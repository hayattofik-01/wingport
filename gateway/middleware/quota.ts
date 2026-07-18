import type { GenerateRequest, Middleware } from '../types.ts'
import { checkAndUseQuota } from '../usage.ts'

export function quotaMiddleware(): Middleware {
  return async (ctx, next) => {
    const { pathname } = ctx.url
    const isChargeable = pathname.endsWith('/v1/generate') || pathname.endsWith('/v1/stream')

    if (!ctx.user || !isChargeable) {
      return await next()
    }

    let body: GenerateRequest | undefined
    if (ctx.request.method === 'POST') {
      try {
        body = (await ctx.request.json()) as GenerateRequest
        ctx.body = body
      } catch {
        // Not JSON or invalid; let the router return bad_request.
      }
    }

    const quota = await checkAndUseQuota(ctx.user, body)
    if (!quota) {
      return await next()
    }

    if (!quota.allowed) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'quota_exceeded',
            message: 'Quota exceeded',
            retryAfter: quota.retryAfter,
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(quota.retryAfter),
          },
        }
      )
    }

    return await next()
  }
}
