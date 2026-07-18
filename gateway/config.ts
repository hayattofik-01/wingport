export type AuthMode = 'hs256' | 'jwks'

export type ProviderConfig = {
  name: 'anthropic' | 'openai'
  apiKey: string
  baseUrl: string
  modelMap: Record<string, string>
}

export type GatewayConfig = {
  auth: {
    provider: 'supabase'
    mode: AuthMode
    secret?: string
    supabaseUrl?: string
    requireVerifiedEmail: boolean
    allowAnonymous: boolean
    tierClaim: string
  }
  providers: ProviderConfig[]
  fallback: boolean
  guards: {
    maxTokensPerRequest: number
    maxConcurrentStreamsPerUser: number
  }
}

export function loadConfig(): GatewayConfig {
  const jwtSecret = Deno.env.get('WINGPORT_JWT_SECRET') ?? Deno.env.get('SUPABASE_JWT_SECRET')

  return {
    auth: {
      provider: 'supabase',
      mode: (Deno.env.get('WINGPORT_AUTH_MODE') as AuthMode) ??
        (jwtSecret ? 'hs256' : 'jwks'),
      secret: jwtSecret,
      supabaseUrl: Deno.env.get('SUPABASE_URL'),
      requireVerifiedEmail: envBool('WINGPORT_REQUIRE_VERIFIED_EMAIL', false),
      allowAnonymous: envBool('WINGPORT_ALLOW_ANONYMOUS', false),
      tierClaim: Deno.env.get('WINGPORT_TIER_CLAIM') ?? 'app_tier',
    },
    providers: loadProviders(),
    fallback: envBool('WINGPORT_FALLBACK', false),
    guards: {
      maxTokensPerRequest: Number(Deno.env.get('WINGPORT_MAX_TOKENS_PER_REQUEST') ?? 4096),
      maxConcurrentStreamsPerUser: Number(Deno.env.get('WINGPORT_MAX_CONCURRENT_STREAMS_PER_USER') ?? 2),
    },
  }
}

function loadProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = []

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (openaiKey) {
    providers.push({
      name: 'openai',
      apiKey: openaiKey,
      baseUrl: Deno.env.get('OPENAI_BASE_URL') ?? 'https://api.openai.com',
      modelMap: parseModelMap('WINGPORT_OPENAI_MODELS') ?? { 'gpt-4o': 'gpt-4o' },
    })
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (anthropicKey) {
    providers.push({
      name: 'anthropic',
      apiKey: anthropicKey,
      baseUrl: Deno.env.get('ANTHROPIC_BASE_URL') ?? 'https://api.anthropic.com',
      modelMap: parseModelMap('WINGPORT_ANTHROPIC_MODELS') ??
        { 'claude-sonnet': 'claude-sonnet-4-6' },
    })
  }

  return providers
}

function parseModelMap(envName: string): Record<string, string> | undefined {
  const raw = Deno.env.get(envName)
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return undefined
  }
}

function envBool(name: string, fallback: boolean): boolean {
  const v = Deno.env.get(name)
  if (v === undefined) return fallback
  return v === 'true' || v === '1'
}
