import type { Context, GenerateRequest, StreamChunk } from '../types.ts'
import { getProviderForAlias } from '../providers.ts'
import { encodeSSE, sseResponse } from '../sse.ts'
import { ProviderError } from './generate.ts'

export async function handleStream(ctx: Context): Promise<Response> {
  let body: GenerateRequest
  try {
    body = await ctx.request.json()
  } catch {
    return jsonError('bad_request', 'Invalid JSON body')
  }

  const modelAlias = body.model
  const provider = getProviderForAlias(modelAlias)
  if (!provider) {
    return jsonError('model_not_allowed', `Model ${modelAlias} is not allowed`)
  }

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()

  provider
    .stream(body, {
      onChunk(chunk: StreamChunk) {
        const line = encodeSSE(chunk)
        const data = new TextEncoder().encode(line)
        writer.write(data).catch(() => {
          // Client disconnected; ignore.
        })
      },
      async onDone() {
        await writer.close()
      },
      async onError(err: unknown) {
        const message = err instanceof ProviderError ? err.message : (err as Error).message
        const code = err instanceof ProviderError ? err.code : 'provider_error'
        const line = encodeSSE({ error: { code, message } })
        await writer.write(new TextEncoder().encode(line)).catch(() => {})
        await writer.close()
      },
    })
    .catch(async (err: unknown) => {
      const message = err instanceof ProviderError ? err.message : (err as Error).message
      const code = err instanceof ProviderError ? err.code : 'provider_error'
      const line = encodeSSE({ error: { code, message } })
      await writer.write(new TextEncoder().encode(line)).catch(() => {})
      await writer.close()
    })

  return sseResponse(readable)
}

function jsonError(code: string, message: string): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status: code === 'bad_request' ? 400 : 403,
    headers: { 'Content-Type': 'application/json' },
  })
}
