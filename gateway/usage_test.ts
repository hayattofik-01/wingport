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
      const body = req.body ? await req.json() : {}
      const response = responseFor(name, body as Record<string, unknown>)
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      })
    })

    server.finished.then(() => {}).catch(() => {})

    // Give the server a tick to bind to an ephemeral port.
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
    assertEquals(name, 'wingport_check_and_use_quota')
    assertEquals(body.p_user_id, 'u1')
    assertEquals(body.p_tier, 'pro')
    return {
      allowed: true,
      retry_after: 0,
      limit_minute: 100,
      limit_day: 10000,
      used_minute: 1,
      used_day: 2,
      remaining_minute: 99,
      remaining_day: 9998,
    }
  })

  Deno.env.set('WINGPORT_SUPABASE_URL', `http://localhost:${server.port}`)
  Deno.env.set('WINGPORT_SERVICE_ROLE_KEY', 'service')
  Deno.env.set('WINGPORT_ANON_KEY', 'anon')
  Deno.env.delete('WINGPORT_QUOTA_DISABLED')

  const result = await checkAndUseQuota({ userId: 'u1', tier: 'pro', isAnonymous: false })

  assertEquals(result, {
    allowed: true,
    retryAfter: 0,
    limitMinute: 100,
    limitDay: 10000,
    usedMinute: 1,
    usedDay: 2,
    remainingMinute: 99,
    remainingDay: 9998,
  })

  server.abort()
})

Deno.test('checkAndUseQuota parses denied response with retryAfter', async () => {
  const server = await startMockServer((name, body) => {
    assertEquals(name, 'wingport_check_and_use_quota')
    assertEquals(body.p_user_id, 'u2')
    return {
      allowed: false,
      retry_after: 42,
      limit_minute: 10,
      limit_day: 100,
      used_minute: 10,
      used_day: 50,
      remaining_minute: 0,
      remaining_day: 50,
    }
  })

  Deno.env.set('WINGPORT_SUPABASE_URL', `http://localhost:${server.port}`)
  Deno.env.set('WINGPORT_SERVICE_ROLE_KEY', 'service')
  Deno.env.set('WINGPORT_ANON_KEY', 'anon')

  const result = await checkAndUseQuota({ userId: 'u2', tier: 'free', isAnonymous: false })

  assertEquals(result?.allowed, false)
  assertEquals(result?.retryAfter, 42)

  server.abort()
})

Deno.test('getQuota parses quota row', async () => {
  const server = await startMockServer((name, body) => {
    assertEquals(name, 'wingport_get_quota')
    assertEquals(body.p_user_id, 'u3')
    return {
      user_id: 'u3',
      tier: 'pro',
      limit_minute: 100,
      limit_day: 10000,
      used_minute: 5,
      used_day: 20,
      remaining_minute: 95,
      remaining_day: 9980,
    }
  })

  Deno.env.set('WINGPORT_SUPABASE_URL', `http://localhost:${server.port}`)

  const result = await getQuota('u3')

  assertEquals(result?.userId, 'u3')
  assertEquals(result?.tier, 'pro')
  assertEquals(result?.remainingMinute, 95)

  server.abort()
})

Deno.test('recordUsage posts usage row', async () => {
  const server = await startMockServer((name, body) => {
    assertEquals(name, 'wingport_record_usage')
    assertEquals(body.p_user_id, 'u4')
    assertEquals(body.p_status, 'ok')
    assertEquals(body.p_input_tokens, 10)
    return {}
  })

  Deno.env.set('WINGPORT_SUPABASE_URL', `http://localhost:${server.port}`)

  await recordUsage(
    { userId: 'u4', tier: 'free', isAnonymous: false },
    'ok',
    'openai',
    'gpt-4o',
    { inputTokens: 10, outputTokens: 20, totalTokens: 30 }
  )

  server.abort()
})
