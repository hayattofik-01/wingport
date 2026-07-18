import type { Usage, UserContext } from './types.ts'

export type QuotaResult = {
  allowed: boolean
  retryAfter: number
  remainingMinute: number
  remainingDay: number
  limitMinute: number
  limitDay: number
  usedMinute: number
  usedDay: number
}

export type QuotaResponse = {
  userId: string
  tier: string
  limitMinute: number
  limitDay: number
  usedMinute: number
  usedDay: number
  remainingMinute: number
  remainingDay: number
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

function disabled(): boolean {
  const v = Deno.env.get('WINGPORT_QUOTA_DISABLED')
  return v === 'true' || v === '1'
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T | undefined> {
  if (disabled()) return undefined

  const url = supabaseUrl()
  const serviceRole = serviceRoleKey()
  const anon = anonKey()
  if (!url || !serviceRole || !anon) {
    console.warn(`[wingport] quota RPC skipped: missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY`)
    return undefined
  }

  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anon,
      'Authorization': `Bearer ${serviceRole}`,
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

export async function checkAndUseQuota(user: UserContext): Promise<QuotaResult | undefined> {
  const data = await rpc<Record<string, unknown>>('wingport_check_and_use_quota', {
    p_user_id: user.userId,
    p_tier: user.tier ?? 'free',
    p_input_tokens: 0,
    p_output_tokens: 0,
  })

  if (!data) return undefined

  return {
    allowed: data.allowed === true,
    retryAfter: Math.max(0, Math.round(Number(data.retry_after ?? 0))),
    remainingMinute: Number(data.remaining_minute ?? 0),
    remainingDay: Number(data.remaining_day ?? 0),
    limitMinute: Number(data.limit_minute ?? 0),
    limitDay: Number(data.limit_day ?? 0),
    usedMinute: Number(data.used_minute ?? 0),
    usedDay: Number(data.used_day ?? 0),
  }
}

export async function getQuota(userId: string): Promise<QuotaResponse | undefined> {
  const data = await rpc<Record<string, number | string>>('wingport_get_quota', {
    p_user_id: userId,
  })

  if (!data) return undefined

  return {
    userId: String(data.user_id ?? userId),
    tier: String(data.tier ?? 'free'),
    limitMinute: (data.limit_minute as number) ?? 0,
    limitDay: (data.limit_day as number) ?? 0,
    usedMinute: (data.used_minute as number) ?? 0,
    usedDay: (data.used_day as number) ?? 0,
    remainingMinute: (data.remaining_minute as number) ?? 0,
    remainingDay: (data.remaining_day as number) ?? 0,
  }
}

export async function recordUsage(
  user: UserContext,
  status: 'ok' | 'error' | 'interrupted',
  provider: string,
  model: string,
  usage?: Usage
): Promise<void> {
  await rpc<unknown>('wingport_record_usage', {
    p_user_id: user.userId,
    p_status: status,
    p_provider: provider,
    p_model: model,
    p_input_tokens: usage?.inputTokens ?? 0,
    p_output_tokens: usage?.outputTokens ?? 0,
    p_total_tokens: usage?.totalTokens ?? 0,
  })
}
