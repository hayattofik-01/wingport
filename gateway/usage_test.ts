import { assertEquals } from '@std/assert'
import { checkAndUseQuota, getQuota, recordUsage } from './usage.ts'

function startMockServer(
  responseFor: (name: string, body: Record<string, unknown>) => unknown
): Promise<{ port: number; abort: () => void }> {
  const ac = new AbortController()
  return new Promise((resolve) => {
    const server = Deno.serve({ port: 0, signal: ac.signal }, async (req) => {
      const url = new URL(req.url)
      const match = url.pathname.match(/^\/rest\/v1\/rpc\/(.+)$/)
      const name = match ? match[1] : ''
      const body = req.body ? (await req.json() as Record<string, unknown>) : {}
      const response = responseFor(name, body)
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      })
    })

    server.finished.then(() => {}).catch(() => {})

    setTimeout(() => {
      const addr = server.addr
      if ('port' in addr) {
        resolve({
          port: addr.port,
          abort: () => ac.abort(),
        })
      } else {
        throw new Error('Expected TCP address')
      }
    }, 100)
  })
}

Deno.test('checkAndUseQuota parses allowed response', async () => {
  const server = await startMockServer((name, body) => {
    assertEquals(name, 'wingport_consume_quota')
    assertEquals(body.p_user_id, 'u1')
    assertEquals(body.p_tier, 'pro')
    return {
      allowed: true,
      retry_after: 0,
      requests_remaining: 999,
      tokens_remaining: 999000,
      resets_at: '2026-07-20T00:00:00Z',
    }
  })

  Deno.env.set('WINGPORT_SUPABASE_URL', `http://localhost:${server.port}`)
  Deno.env.set('WINGPORT_SERVICE_ROLE_KEY', 'service')
  Deno.env.set('WINGPORT_ANON_KEY', 'anon')
  Deno.env.delete('WINGPORT_QUOTA_DISABLED')

  const result = await checkAndUseQuota({ userId: 'u1', tier: 'pro', isAnonymous: false }, {
    model: 'claude-sonnet',
    maxTokens: 100,
  })

  assertEquals(result, {
    allowed: true,
    retryAfter: 0,
    requestsRemaining: 999,
    tokensRemaining: 999000,
    resetsAt: '2026-07-20T00:00:00Z',
  })

  server.abort()
})

Deno.test('checkAndUseQuota parses denied response with retryAfter', async () => {
  const server = await startMockServer((name, body) => {
    assertEquals(name, 'wingport_consume_quota')
    assertEquals(body.p_user_id, 'u2')
    return {
      allowed: false,
      retry_after: 42,
      requests_remaining: 0,
      tokens_remaining: 50000,
      resets_at: '2026-07-20T00:00:00Z',
    }
  })

  Deno.env.set('WINGPORT_SUPABASE_URL', `http://localhost:${server.port}`)

  const result = await checkAndUseQuota({ userId: 'u2', tier: 'free', isAnonymous: false })

  assertEquals(result?.allowed, false)
  assertEquals(result?.retryAfter, 42)

  server.abort()
})

Deno.test('getQuota parses quota response', async () => {
  const server = await startMockServer((name, body) => {
    assertEquals(name, 'wingport_get_quota')
    assertEquals(body.p_user_id, 'u3')
    return {
      requestsRemaining: 42,
      tokensRemaining: 91000,
      resetsAt: '2026-07-20T00:00:00Z',
    }
  })

  Deno.env.set('WINGPORT_SUPABASE_URL', `http://localhost:${server.port}`)

  const result = await getQuota({ userId: 'u3', tier: 'pro', isAnonymous: false })

  assertEquals(result?.requestsRemaining, 42)
  assertEquals(result?.tokensRemaining, 91000)

  server.abort()
})

Deno.test('recordUsage posts usage row with estimates', async () => {
  const server = await startMockServer((name, body) => {
    assertEquals(name, 'wingport_record_usage')
    assertEquals(body.p_user_id, 'u4')
    assertEquals(body.p_status, 'ok')
    assertEquals(body.p_input_tokens, 10)
    assertEquals(body.p_model_alias, 'gpt-4o')
    return {}
  })

  Deno.env.set('WINGPORT_SUPABASE_URL', `http://localhost:${server.port}`)

  await recordUsage(
    { userId: 'u4', tier: 'free', isAnonymous: false },
    { model: 'gpt-4o' },
    'ok',
    'openai',
    { inputTokens: 10, outputTokens: 20, totalTokens: 30 }
  )

  server.abort()
})
