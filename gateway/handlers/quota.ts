import type { Context } from '../types.ts'
import { getQuota } from '../usage.ts'

export async function handleQuota(ctx: Context): Promise<Response> {
  if (!ctx.user) {
    return new Response(
      JSON.stringify({ error: { code: 'unauthorized', message: 'Missing user context' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const quota = await getQuota(ctx.user)
  if (!quota) {
    return new Response(
      JSON.stringify({ error: { code: 'provider_error', message: 'Quota service unavailable' } }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(JSON.stringify(quota), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
