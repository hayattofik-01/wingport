export type WingportProviderConfig = {
  name: 'anthropic' | 'openai'
  apiKeySecret: string
  models: Record<string, string>
  baseUrl?: string
}

export type WingportTier = {
  requestsPerDay?: number
  tokensPerDay?: number
  requestsPerMinute?: number
}

export type WingportLimits = {
  default: WingportTier
  tiers?: Record<string, WingportTier>
  tierSource?: { jwtClaim: string }
}

export type WingportAuthConfig = {
  provider: 'supabase'
  requireVerifiedEmail?: boolean
  allowAnonymous?: boolean
}

export type WingportConfig = {
  auth: WingportAuthConfig
  providers: WingportProviderConfig[]
  limits: WingportLimits
  fallback?: boolean
  guards?: {
    maxTokensPerRequest?: number
    maxConcurrentStreamsPerUser?: number
  }
}

export function defineGateway(config: WingportConfig): WingportConfig {
  return config
}

export function anthropic(options: {
  models: Record<string, string>
  apiKeySecret: string
  baseUrl?: string
}): WingportProviderConfig {
  return { name: 'anthropic', ...options }
}

export function openai(options: {
  models: Record<string, string>
  apiKeySecret: string
  baseUrl?: string
}): WingportProviderConfig {
  return { name: 'openai', ...options }
}
