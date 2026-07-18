import type { Middleware } from '../types.ts'
import { checkAndUseQuota } from '../usage.ts'

export function quotaMiddleware(): Middleware {
  return async (ctx, next) => {
    if (!ctx.user) {
      return await next()
    }

    const quota = await checkAndUseQuota(ctx.user)
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
            limit: quota.limitMinute,
            used: quota.usedMinute,
            resetsAt: new Date(Date.now() + quota.retryAfter * 1000).toISOString(),
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
