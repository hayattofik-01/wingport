import type { Middleware } from './types.ts'
import { handleGenerate } from './handlers/generate.ts'
import { handleStream } from './handlers/stream.ts'
import { handleQuota } from './handlers/quota.ts'

export const router: Middleware = (ctx, next) => {
  const { pathname } = ctx.url
  const method = ctx.request.method

  if (method === 'POST' && pathname.endsWith('/v1/generate')) {
    return handleGenerate(ctx)
  }

  if (method === 'POST' && pathname.endsWith('/v1/stream')) {
    return handleStream(ctx)
  }

  if (method === 'GET' && pathname.endsWith('/v1/quota')) {
    return handleQuota(ctx)
  }

  return next()
}

export function notFound(): Response {
  return new Response(JSON.stringify({ error: { code: 'bad_request', message: 'Not found' } }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  })
}
