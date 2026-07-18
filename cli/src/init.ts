import fs from 'node:fs'
import path from 'node:path'
import { copyDirSync, findGatewayTemplateDir, findSupabaseRoot } from './utils.js'

const DEFAULT_CONFIG = `import { defineGateway, anthropic, openai } from "wingport";

export default defineGateway({
  auth: { provider: "supabase", requireVerifiedEmail: false, allowAnonymous: false },
  providers: [
    anthropic({ models: { "claude-sonnet": "claude-sonnet-4-6" }, apiKeySecret: "ANTHROPIC_API_KEY" }),
    openai({ models: { "gpt-4o": "gpt-4o" }, apiKeySecret: "OPENAI_API_KEY" }),
  ],
  limits: {
    default: { requestsPerDay: 50, tokensPerDay: 100_000, requestsPerMinute: 10 },
    tiers: { pro: { requestsPerDay: 1000, tokensPerDay: 2_000_000 } },
    tierSource: { jwtClaim: "app_tier" },
  },
  fallback: true,
  guards: { maxTokensPerRequest: 4096, maxConcurrentStreamsPerUser: 2 },
});
`

const FUNCTION_INDEX = `import { app } from "./main.ts";

Deno.serve(app);
`

const FUNCTION_DENO_JSON = JSON.stringify({ imports: { jose: 'npm:jose@5.6.3' } }, null, 2)

export type InitResult = {
  ok: boolean
  message: string
  projectRoot: string
  functionDir: string
  configFile: string
}

export async function init(cwd: string): Promise<InitResult> {
  const projectRoot = findSupabaseRoot(cwd)
  if (!projectRoot) {
    return {
      ok: false,
      message: 'No Supabase project found. Run `supabase init` first and try again.',
      projectRoot: '',
      functionDir: '',
      configFile: '',
    }
  }

  const functionDir = path.join(projectRoot, 'supabase', 'functions', 'wingport')
  const configFile = path.join(projectRoot, 'wingport.config.ts')

  const gatewayTemplateDir = findGatewayTemplateDir()
  if (!gatewayTemplateDir) {
    return {
      ok: false,
      message: 'Gateway template directory not found. Is the CLI installed correctly?',
      projectRoot,
      functionDir,
      configFile,
    }
  }

  // Always refresh source files; never overwrite an edited config file.
  copyDirSync(gatewayTemplateDir, functionDir, (rel: string) => {
    // Skip test files and Deno configuration from the gateway root.
    const lower = rel.toLowerCase()
    return !lower.endsWith('_test.ts') && lower !== 'deno.json' && lower !== 'deno.lock'
  })

  fs.writeFileSync(path.join(functionDir, 'index.ts'), FUNCTION_INDEX)
  fs.writeFileSync(path.join(functionDir, 'deno.json'), FUNCTION_DENO_JSON)

  const configExists = fs.existsSync(configFile)
  let configWritten = false
  if (!configExists) {
    fs.writeFileSync(configFile, DEFAULT_CONFIG)
    configWritten = true
  } else {
    const existing = fs.readFileSync(configFile, 'utf-8')
    if (!existing.includes('defineGateway')) {
      return {
        ok: false,
        message: `Existing ${path.basename(configFile)} does not contain defineGateway; refusing to overwrite.`,
        projectRoot,
        functionDir,
        configFile,
      }
    }
  }

  const migrationsDir = path.join(projectRoot, 'supabase', 'migrations')
  fs.mkdirSync(migrationsDir, { recursive: true })
  const migrationSource = path.join(
    gatewayTemplateDir,
    '..',
    '..',
    'supabase',
    'migrations',
    '20250718160000_wingport_quotas_and_usage.sql'
  )
  if (fs.existsSync(migrationSource)) {
    fs.copyFileSync(
      migrationSource,
      path.join(migrationsDir, '20250718160000_wingport_quotas_and_usage.sql')
    )
  }

  const message = configWritten
    ? `Wingport function scaffolded at ${functionDir}.\nNext steps:\n1. Edit ${configFile}\n2. Run: supabase secrets set OPENAI_API_KEY=<key> ANTHROPIC_API_KEY=<key>\n3. Run: npx wingport deploy`
    : `Wingport function refreshed at ${functionDir}. Existing ${configFile} was preserved.`

  return { ok: true, message, projectRoot, functionDir, configFile }
}
