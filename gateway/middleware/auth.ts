import * as jose from 'jose'
import type { Middleware } from '../types.ts'
import { loadConfig } from '../config.ts'

const jwkSetCache = new Map<string, ReturnType<typeof jose.createRemoteJWKSet>>()

export function authMiddleware(): Middleware {
  return async (ctx, next) => {
    const config = loadConfig()
    const authHeader = ctx.request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized('Missing or malformed Authorization header')
    }

    const token = authHeader.slice('Bearer '.length).trim()
    if (!token) {
      return unauthorized('Missing bearer token')
    }

    try {
      const result = await verifyToken(token, config.auth)

      if (config.auth.requireVerifiedEmail && result.emailConfirmedAt === null) {
        return unauthorized('Email not verified')
      }

      if (result.isAnonymous && !config.auth.allowAnonymous) {
        return unauthorized('Anonymous users are not allowed')
      }

      ctx.user = {
        userId: result.sub,
        tier: result.tier,
        isAnonymous: result.isAnonymous,
      }

      return next()
    } catch (err) {
      return unauthorized((err as Error).message)
    }
  }
}

type VerifyResult = {
  sub: string
  tier?: string
  isAnonymous: boolean
  emailConfirmedAt: string | null
}

async function verifyToken(
  token: string,
  auth: ReturnType<typeof loadConfig>['auth']
): Promise<VerifyResult> {
  if (auth.mode === 'hs256') {
    if (!auth.secret) throw new Error('HS256 mode selected but SUPABASE_JWT_SECRET is not set')
    const secret = new TextEncoder().encode(auth.secret)
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })
    return extractClaims(payload)
  }

  if (auth.mode === 'jwks') {
    if (!auth.supabaseUrl) throw new Error('JWKS mode selected but SUPABASE_URL is not set')
    const jwksUrl = `${auth.supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`
    let jwks = jwkSetCache.get(jwksUrl)
    if (!jwks) {
      jwks = jose.createRemoteJWKSet(new URL(jwksUrl), {
        cooldownDuration: 500,
        cacheMaxAge: 1000 * 60 * 60 * 24,
      })
      jwkSetCache.set(jwksUrl, jwks)
    }
    const { payload } = await jose.jwtVerify(token, jwks, {
      algorithms: ['RS256'],
    })
    return extractClaims(payload)
  }

  throw new Error(`Unsupported auth mode: ${auth.mode}`)
}

function extractClaims(payload: jose.JWTPayload): VerifyResult {
  const config = loadConfig()
  return {
    sub: String(payload.sub ?? ''),
    tier: payload[config.auth.tierClaim] as string | undefined,
    isAnonymous: payload.is_anonymous === true,
    emailConfirmedAt: (payload.email_confirmed_at as string | null) ?? null,
  }
}

function unauthorized(message: string): Response {
  return new Response(JSON.stringify({ error: { code: 'unauthorized', message } }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
