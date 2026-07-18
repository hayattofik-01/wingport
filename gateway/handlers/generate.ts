import type { Context, GenerateRequest, GenerateResponse, WingError } from '../types.ts'
import { getProviderForAlias } from '../providers.ts'
import { recordUsage } from '../usage.ts'

export async function handleGenerate(ctx: Context): Promise<Response> {
  let body: GenerateRequest
  try {
    body = await ctx.request.json()
  } catch {
    return errorResponse('bad_request', 'Invalid JSON body')
  }

  const modelAlias = body.model
  const provider = getProviderForAlias(modelAlias)
  if (!provider) {
    return errorResponse('model_not_allowed', `Model ${modelAlias} is not allowed`)
  }

  try {
    const result = await provider.generate(body)
    const response: GenerateResponse = {
      text: result.text,
      usage: result.usage,
      provider: provider.name,
      finishReason: result.finishReason,
    }
    if (ctx.user) {
      await recordUsage(ctx.user, 'ok', provider.name, modelAlias, result.usage).catch(() => {})
    }
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    if (ctx.user) {
      await recordUsage(ctx.user, 'error', provider.name, modelAlias).catch(() => {})
    }
    if (err instanceof ProviderError) {
      return errorResponse(err.code, err.message)
    }
    return errorResponse('provider_error', (err as Error).message)
  }
}

export class ProviderError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message)
  }
}

function errorResponse(code: string, message: string): Response {
  const body: WingError = { error: { code, message } }
  const status = errorStatus(code)
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function errorStatus(code: string): number {
  switch (code) {
    case 'unauthorized':
      return 401
    case 'model_not_allowed':
      return 403
    case 'quota_exceeded':
      return 429
    case 'bad_request':
      return 400
    default:
      return 502
  }
}
