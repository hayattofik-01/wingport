import type { GenerateRequest, Usage, UserContext } from './types.ts'

export type QuotaResult = {
  allowed: boolean
  retryAfter: number
  requestsRemaining: number
  tokensRemaining: number
  resetsAt: string
}

export type QuotaResponse = {
  requestsRemaining: number
  tokensRemaining: number
  resetsAt: string
}

function supabaseUrl(): string | undefined {
  return Deno.env.get('WINGPORT_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL') ?? undefined
}

function serviceRoleKey(): string | undefined {
  return Deno.env.get('WINGPORT_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? undefined
}

function anonKey(): string | undefined {
  return Deno.env.get('WINGPORT_ANON_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? undefined
}

export function disabled(): boolean {
  const v = Deno.env.get('WINGPORT_QUOTA_DISABLED')
  return v === 'true' || v === '1'
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T | undefined> {
  if (disabled()) return undefined

  const url = supabaseUrl()
  const serviceRole = serviceRoleKey()
  const anon = anonKey()
  if (!url || !serviceRole || !anon) {
    console.warn(
      `[wingport] quota RPC skipped: missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY`
    )
    return undefined
  }

  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${serviceRole}`,
    },
    body: JSON.stringify(args),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[wingport] quota RPC ${name} failed: ${res.status} ${body}`)
    return undefined
  }

  return (await res.json()) as T
}

function estimateTokens(body?: GenerateRequest): { input: number; output: number } {
  const inputChars = body?.prompt?.length ??
    body?.messages?.reduce((acc, m) => acc + (m.content?.length ?? 0), 0) ??
    0
  const input = Math.ceil(inputChars / 4)
  const output = body?.maxTokens ?? 1024
  return { input, output }
}

export async function checkAndUseQuota(
  user: UserContext,
  body?: GenerateRequest
): Promise<QuotaResult | undefined> {
  const { input, output } = estimateTokens(body)
  const data = await rpc<Record<string, unknown>>('wingport_consume_quota', {
    p_user_id: user.userId,
    p_tier: user.tier ?? 'default',
    p_input_estimate: input,
    p_output_estimate: output,
  })

  if (!data) return undefined

  return {
    allowed: data.allowed === true,
    retryAfter: Math.max(0, Math.round(Number(data.retry_after ?? 0))),
    requestsRemaining: Number(data.requests_remaining ?? 0),
    tokensRemaining: Number(data.tokens_remaining ?? 0),
    resetsAt: String(data.resets_at ?? ''),
  }
}

export async function getQuota(user: UserContext): Promise<QuotaResponse | undefined> {
  const data = await rpc<Record<string, unknown>>('wingport_get_quota', {
    p_user_id: user.userId,
    p_tier: user.tier ?? 'default',
  })

  if (!data) return undefined

  return {
    requestsRemaining: Number(data.requestsRemaining ?? 0),
    tokensRemaining: Number(data.tokensRemaining ?? 0),
    resetsAt: String(data.resetsAt ?? ''),
  }
}

export async function recordUsage(
  user: UserContext,
  body: GenerateRequest | undefined,
  status: 'ok' | 'error' | 'interrupted',
  provider: string,
  usage?: Usage
): Promise<void> {
  const estimate = estimateTokens(body)
  await rpc<unknown>('wingport_record_usage', {
    p_user_id: user.userId,
    p_status: status,
    p_model_alias: body?.model ?? '',
    p_provider_used: provider,
    p_input_tokens: usage?.inputTokens ?? 0,
    p_output_tokens: usage?.outputTokens ?? 0,
    p_input_estimate: estimate.input,
    p_output_estimate: estimate.output,
    p_duration_ms: null,
  })
}
