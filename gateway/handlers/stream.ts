import type { Context, GenerateRequest, StreamChunk, Usage } from '../types.ts'
import { getProviderForAlias } from '../providers.ts'
import { encodeSSE, sseResponse } from '../sse.ts'
import { ProviderError } from './generate.ts'
import { recordUsage } from '../usage.ts'

export async function handleStream(ctx: Context): Promise<Response> {
  const body = ctx.body ?? (await parseBody(ctx))
  if (!body) {
    return jsonError('bad_request', 'Invalid JSON body')
  }

  const modelAlias = body.model
  if (!modelAlias) {
    return jsonError('bad_request', 'Missing model')
  }

  let provider
  try {
    provider = getProviderForAlias(modelAlias)
  } catch (err) {
    if (err instanceof ProviderError) {
      return jsonError(err.code, err.message)
    }
    return jsonError('provider_error', (err as Error).message)
  }

  if (!provider) {
    return jsonError('model_not_allowed', `Model ${modelAlias} is not allowed`)
  }

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()
  let usage: Usage | undefined

  function writeError(code: string, message: string) {
    const line = encodeSSE({ error: { code, message } })
    return writer.write(new TextEncoder().encode(line)).catch(() => {})
  }

  provider
    .stream(body, {
      onChunk(chunk: StreamChunk) {
        if ('done' in chunk && chunk.done) {
          usage = chunk.usage
        }
        const line = encodeSSE(chunk)
        const data = new TextEncoder().encode(line)
        writer.write(data).catch(() => {
          // Client disconnected; ignore.
        })
      },
      async onDone() {
        if (ctx.user) {
          await recordUsage(ctx.user, body, 'ok', provider!.name, usage).catch(() => {})
        }
        await writer.close()
      },
      async onError(err: unknown) {
        if (ctx.user) {
          await recordUsage(ctx.user, body, 'error', provider!.name, usage).catch(() => {})
        }
        const message = err instanceof ProviderError ? err.message : (err as Error).message
        const code = err instanceof ProviderError ? err.code : 'provider_error'
        await writeError(code, message)
        await writer.close()
      },
    })
    .catch(async (err: unknown) => {
      if (ctx.user) {
        await recordUsage(ctx.user, body, 'error', provider!.name, usage).catch(() => {})
      }
      const message = err instanceof ProviderError ? err.message : (err as Error).message
      const code = err instanceof ProviderError ? err.code : 'provider_error'
      await writeError(code, message)
      await writer.close()
    })

  return sseResponse(readable)
}

async function parseBody(ctx: Context): Promise<GenerateRequest | undefined> {
  try {
    return (await ctx.request.json()) as GenerateRequest
  } catch {
    return undefined
  }
}

function jsonError(code: string, message: string): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status: code === 'bad_request' ? 400 : 403,
    headers: { 'Content-Type': 'application/json' },
  })
}
