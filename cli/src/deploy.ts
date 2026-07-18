import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { findSupabaseRoot, runCommand } from './utils.js'
import type { WingportConfig, WingportProviderConfig } from './config.js'

export type DeployResult = {
  ok: boolean
  message: string
}

export async function deploy(cwd: string): Promise<DeployResult> {
  const projectRoot = findSupabaseRoot(cwd)
  if (!projectRoot) {
    return { ok: false, message: 'No Supabase project found (supabase/config.toml missing).' }
  }

  const versionCheck = await runCommand('supabase', ['--version'], projectRoot)
  if (versionCheck.code !== 0) {
    return {
      ok: false,
      message: 'Supabase CLI is not installed. Install it: https://supabase.com/docs/guides/cli/getting-started',
    }
  }

  const loginCheck = await runCommand('supabase', ['projects', 'list'], projectRoot)
  if (loginCheck.code !== 0) {
    return { ok: false, message: 'You are not logged in to Supabase. Run `supabase login` first.' }
  }

  const configFile = path.join(projectRoot, 'wingport.config.ts')
  if (!fs.existsSync(configFile)) {
    return { ok: false, message: `Missing ${configFile}. Run \`npx wingport init\` first.` }
  }

  let config: WingportConfig
  try {
    config = await loadUserConfig(projectRoot, configFile)
  } catch (err) {
    return { ok: false, message: `Failed to load wingport.config.ts: ${(err as Error).message}` }
  }

  const functionDir = path.join(projectRoot, 'supabase', 'functions', 'wingport')
  if (!fs.existsSync(functionDir)) {
    return { ok: false, message: `Missing ${functionDir}. Run \`npx wingport init\` first.` }
  }

  const envVars = buildEnvVars(config)
  for (const [key, value] of Object.entries(envVars)) {
    const result = await runCommand('supabase', ['secrets', 'set', `${key}=${value}`], projectRoot)
    if (result.code !== 0) {
      return { ok: false, message: `Failed to set secret ${key}: ${result.stderr || result.stdout}` }
    }
  }

  const dbPush = await runCommand('supabase', ['db', 'push'], projectRoot)
  if (dbPush.code !== 0) {
    return { ok: false, message: `supabase db push failed: ${dbPush.stderr || dbPush.stdout}` }
  }

  const fnDeploy = await runCommand(
    'supabase',
    ['functions', 'deploy', 'wingport', '--no-verify-jwt'],
    projectRoot
  )
  if (fnDeploy.code !== 0) {
    return {
      ok: false,
      message: `supabase functions deploy failed: ${fnDeploy.stderr || fnDeploy.stdout}`,
    }
  }

  return {
    ok: true,
    message: 'Wingport deployed. The gateway URL is in your Supabase dashboard.',
  }
}

async function loadUserConfig(projectRoot: string, configFile: string): Promise<WingportConfig> {
  const require = createRequire(import.meta.url)
  const loader = require.resolve('tsx/dist/loader.mjs')

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wingport-deploy-'))
  const tmpScript = path.join(tmpDir, 'load-config.mjs')
  fs.writeFileSync(
    tmpScript,
    `import config from ${JSON.stringify('file://' + configFile)};\nconsole.log(JSON.stringify(config.default ?? config));\n`
  )

  const res = await runCommand(
    'node',
    ['--import', loader, '--input-type=module', '--eval', fs.readFileSync(tmpScript, 'utf-8')],
    projectRoot
  )
  fs.rmSync(tmpDir, { recursive: true, force: true })

  if (res.code !== 0) {
    throw new Error(res.stderr || res.stdout || 'tsx loader failed')
  }
  const json = res.stdout.trim().split('\n').pop() ?? ''
  return JSON.parse(json) as WingportConfig
}

function buildEnvVars(config: WingportConfig): Record<string, string> {
  const env: Record<string, string> = {
    WINGPORT_FALLBACK: String(config.fallback ?? false),
    WINGPORT_AUTH_MODE: 'jwks',
    WINGPORT_MAX_TOKENS_PER_REQUEST: String(config.guards?.maxTokensPerRequest ?? 4096),
    WINGPORT_MAX_CONCURRENT_STREAMS_PER_USER: String(
      config.guards?.maxConcurrentStreamsPerUser ?? 2
    ),
  }

  if (config.auth.allowAnonymous !== undefined) {
    env.WINGPORT_ALLOW_ANONYMOUS = String(config.auth.allowAnonymous)
  }
  if (config.auth.requireVerifiedEmail !== undefined) {
    env.WINGPORT_REQUIRE_VERIFIED_EMAIL = String(config.auth.requireVerifiedEmail)
  }
  if (config.limits.tierSource) {
    env.WINGPORT_TIER_CLAIM = config.limits.tierSource.jwtClaim
  }

  for (const provider of config.providers) {
    applyProviderEnv(env, provider)
  }

  return env
}

function applyProviderEnv(
  env: Record<string, string>,
  provider: WingportProviderConfig
): Record<string, string> {
  const secretName = provider.apiKeySecret
  const apiKey = process.env[secretName]
  if (apiKey) {
    env[secretName] = apiKey
  }

  if (provider.name === 'anthropic') {
    if (provider.baseUrl) env.ANTHROPIC_BASE_URL = provider.baseUrl
    env.WINGPORT_ANTHROPIC_MODELS = JSON.stringify(provider.models)
  } else {
    if (provider.baseUrl) env.OPENAI_BASE_URL = provider.baseUrl
    env.WINGPORT_OPENAI_MODELS = JSON.stringify(provider.models)
  }

  return env
}
