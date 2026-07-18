import type { WingMessage } from './types.ts'

export type AuthMode = 'hs256' | 'jwks'

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
  provider: {
    name: 'anthropic' | 'openai'
    apiKey: string
    baseUrl: string
    modelMap: Record<string, string>
  }
}

export function loadConfig(): GatewayConfig {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  const providerName =
    (Deno.env.get('WINGPORT_PROVIDER') as 'anthropic' | 'openai' | undefined) ??
    (openaiKey ? 'openai' : anthropicKey ? 'anthropic' : 'anthropic')

  const isOpenAI = providerName === 'openai'
  const apiKey = (isOpenAI ? openaiKey : anthropicKey) ?? ''
  const baseUrl = isOpenAI
    ? (Deno.env.get('OPENAI_BASE_URL') ?? 'https://api.openai.com')
    : (Deno.env.get('ANTHROPIC_BASE_URL') ?? 'https://api.anthropic.com')
  const modelMap = (isOpenAI
    ? { 'gpt-4o': 'gpt-4o' }
    : { 'claude-sonnet': 'claude-sonnet-4-6' }) as Record<string, string>

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
    provider: {
      name: providerName,
      apiKey,
      baseUrl,
      modelMap,
    },
  }
}

function envBool(name: string, fallback: boolean): boolean {
  const v = Deno.env.get(name)
  if (v === undefined) return fallback
  return v === 'true' || v === '1'
}

export function toProviderMessages(req: {
  messages?: WingMessage[]
  prompt?: string
}): { messages: WingMessage[]; system?: string } {
  const messages: WingMessage[] = req.messages
    ? [...req.messages]
    : req.prompt
    ? [{ role: 'user', content: req.prompt }]
    : []
  const system = messages.find((m) => m.role === 'system')?.content
  const conversation = messages.filter((m) => m.role !== 'system')
  return { messages: conversation, system }
}
