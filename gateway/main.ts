import type { Context, Middleware } from './types.ts'
import { authMiddleware } from './middleware/auth.ts'
import { quotaMiddleware } from './middleware/quota.ts'
import { router } from './router.ts'

const middlewares: Middleware[] = [
  authMiddleware(),
  quotaMiddleware(),
  router,
]

function compose(stack: Middleware[]): Middleware {
  return (ctx: Context, next: () => Promise<Response>) => {
    let index = -1

    function dispatch(i: number): Promise<Response> {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'))
      }
      index = i
      const fn = stack[i] ?? next
      return fn(ctx, () => dispatch(i + 1))
    }

    return dispatch(0)
  }
}

const handler = compose(middlewares)

export function app(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const ctx: Context = { request, url }
  return handler(ctx, () =>
    Promise.resolve(
      new Response(JSON.stringify({ error: { code: 'bad_request', message: 'Not found' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  )
}

if (import.meta.main) {
  const port = Number(Deno.env.get('PORT') ?? '8000')
  Deno.serve({ port }, app)
  console.log(`Wingport gateway listening on http://localhost:${port}`)
}
