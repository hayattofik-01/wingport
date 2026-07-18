import { assertEquals } from '@std/assert'
import * as jose from 'jose'
import { app } from '../main.ts'

const HS_SECRET = 'this-is-a-test-secret-which-is-32-bytes!'

function setTestEnv(overrides: Record<string, string>) {
  Deno.env.set('SUPABASE_JWT_SECRET', HS_SECRET)
  Deno.env.set('ANTHROPIC_API_KEY', 'test-key')
  Deno.env.set('WINGPORT_TIER_CLAIM', 'app_tier')
  for (const [k, v] of Object.entries(overrides)) {
    Deno.env.set(k, v)
  }
}

function clearTestEnv() {
  Deno.env.delete('SUPABASE_JWT_SECRET')
  Deno.env.delete('ANTHROPIC_API_KEY')
  Deno.env.delete('WINGPORT_AUTH_MODE')
  Deno.env.delete('SUPABASE_URL')
  Deno.env.delete('WINGPORT_TIER_CLAIM')
  Deno.env.delete('WINGPORT_ALLOW_ANONYMOUS')
  Deno.env.delete('WINGPORT_REQUIRE_VERIFIED_EMAIL')
}

async function signHS(claims: Record<string, unknown>): Promise<string> {
  const secret = new TextEncoder().encode(HS_SECRET)
  return await new jose.SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(secret)
}

Deno.test('auth middleware', async (t) => {
  await t.step('valid HS256 token passes', async () => {
    clearTestEnv()
    setTestEnv({})
    const token = await signHS({ sub: 'user-123', app_tier: 'pro' })
    const res = await app(
      new Request('http://localhost/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ model: 'unknown-model' }),
      })
    )
    assertEquals(res.status, 403)
    const body = await res.json()
    assertEquals(body.error.code, 'model_not_allowed')
  })

  await t.step('valid JWKS token passes', async () => {
    clearTestEnv()
    const { privateKey, publicKey } = await jose.generateKeyPair('RS256', { extractable: true })
    const jwk = await jose.exportJWK(publicKey)
    const kid = 'test-key-1'
    jwk.kid = kid
    jwk.use = 'sig'
    jwk.alg = 'RS256'

    const server = Deno.serve({ port: 0, hostname: '127.0.0.1' }, (req) => {
      if (req.url.endsWith('/auth/v1/.well-known/jwks.json')) {
        return new Response(JSON.stringify({ keys: [jwk] }))
      }
      return new Response('not found', { status: 404 })
    })

    try {
      const port = server.addr.port
      setTestEnv({ WINGPORT_AUTH_MODE: 'jwks', SUPABASE_URL: `http://127.0.0.1:${port}` })
      const token = await new jose.SignJWT({ sub: 'user-jwks', app_tier: 'pro' })
        .setProtectedHeader({ alg: 'RS256', kid })
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey)

      const res = await app(
        new Request('http://localhost/v1/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ model: 'unknown-model' }),
        })
      )
      assertEquals(res.status, 403)
      const body = await res.json()
      assertEquals(body.error.code, 'model_not_allowed')
    } finally {
      await server.shutdown()
      clearTestEnv()
    }
  })

  await t.step('JWKS key set is cached across requests', async () => {
    clearTestEnv()
    const { privateKey, publicKey } = await jose.generateKeyPair('RS256', { extractable: true })
    const jwk = await jose.exportJWK(publicKey)
    const kid = 'cached-key-1'
    jwk.kid = kid
    jwk.use = 'sig'
    jwk.alg = 'RS256'

    let fetchCount = 0
    const server = Deno.serve({ port: 0, hostname: '127.0.0.1' }, (req) => {
      if (req.url.endsWith('/auth/v1/.well-known/jwks.json')) {
        fetchCount++
        return new Response(JSON.stringify({ keys: [jwk] }))
      }
      return new Response('not found', { status: 404 })
    })

    try {
      const port = server.addr.port
      setTestEnv({ WINGPORT_AUTH_MODE: 'jwks', SUPABASE_URL: `http://127.0.0.1:${port}` })
      const token = await new jose.SignJWT({ sub: 'user-cache', app_tier: 'pro' })
        .setProtectedHeader({ alg: 'RS256', kid })
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(privateKey)

      const makeRequest = () =>
        app(
          new Request('http://localhost/v1/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ model: 'unknown-model' }),
          })
        )

      const res1 = await makeRequest()
      assertEquals(res1.status, 403)
      const res2 = await makeRequest()
      assertEquals(res2.status, 403)
      assertEquals(fetchCount, 1)
    } finally {
      await server.shutdown()
      clearTestEnv()
    }
  })

  await t.step('expired token is rejected', async () => {
    clearTestEnv()
    setTestEnv({})
    const token = await new jose.SignJWT({ sub: 'user-expired' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('-1m')
      .sign(new TextEncoder().encode(HS_SECRET))

    const res = await app(
      new Request('http://localhost/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ model: 'unknown-model' }),
      })
    )
    assertEquals(res.status, 401)
    const body = await res.json()
    assertEquals(body.error.code, 'unauthorized')
  })

  await t.step('wrong signature is rejected', async () => {
    clearTestEnv()
    setTestEnv({})
    const wrongSecret = new TextEncoder().encode('a-different-32-byte-secret-for-test!')
    const token = await new jose.SignJWT({ sub: 'user-wrong' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(wrongSecret)

    const res = await app(
      new Request('http://localhost/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ model: 'unknown-model' }),
      })
    )
    assertEquals(res.status, 401)
    const body = await res.json()
    assertEquals(body.error.code, 'unauthorized')
  })

  await t.step('anonymous allowed', async () => {
    clearTestEnv()
    setTestEnv({ WINGPORT_ALLOW_ANONYMOUS: 'true' })
    const token = await signHS({ sub: 'user-anon', is_anonymous: true })
    const res = await app(
      new Request('http://localhost/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ model: 'unknown-model' }),
      })
    )
    assertEquals(res.status, 403)
    const body = await res.json()
    assertEquals(body.error.code, 'model_not_allowed')
  })

  await t.step('anonymous denied', async () => {
    clearTestEnv()
    setTestEnv({ WINGPORT_ALLOW_ANONYMOUS: 'false' })
    const token = await signHS({ sub: 'user-anon', is_anonymous: true })
    const res = await app(
      new Request('http://localhost/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ model: 'unknown-model' }),
      })
    )
    assertEquals(res.status, 401)
    const body = await res.json()
    assertEquals(body.error.code, 'unauthorized')
  })

  await t.step('missing header', async () => {
    clearTestEnv()
    setTestEnv({})
    const res = await app(
      new Request('http://localhost/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'unknown-model' }),
      })
    )
    assertEquals(res.status, 401)
    const body = await res.json()
    assertEquals(body.error.code, 'unauthorized')
  })
})
