import type {
  GenerateRequest,
  GenerateResponse,
  ProviderAdapter,
  StreamChunk,
} from './types.ts'
import { anthropicAdapter } from './adapters/anthropic.ts'
import { openaiAdapter } from './adapters/openai.ts'
import { parseSSE } from './sse.ts'
import { ProviderError } from './handlers/generate.ts'
import { loadConfig, type GatewayConfig, type ProviderConfig } from './config.ts'
import { toProviderRequest } from './adapters/anthropic.ts'

export type Provider = {
  name: string
  generate: (req: GenerateRequest) => Promise<GenerateResponse>
  stream: (
    req: GenerateRequest,
    callbacks: {
      onChunk: (chunk: StreamChunk) => void
      onDone: () => void
      onError: (err: unknown) => void
    }
  ) => Promise<void>
}

export function getProvidersForAlias(
  modelAlias: string,
  cfg: GatewayConfig = loadConfig()
): Provider[] {
  const candidates: Provider[] = []
  for (const pc of cfg.providers) {
    const modelId = pc.modelMap[modelAlias]
    if (modelId) {
      candidates.push(makeProvider(buildAdapter(pc), modelId))
    }
  }
  return candidates
}

export function getProviderForAlias(
  modelAlias: string,
  cfg: GatewayConfig = loadConfig()
): Provider | undefined {
  const providers = getProvidersForAlias(modelAlias, cfg)
  if (providers.length === 0) return undefined

  if (cfg.fallback && providers.length > 1) {
    return makeFallbackProvider(providers)
  }

  return providers[0]
}

function buildAdapter(pc: ProviderConfig): ProviderAdapter {
  return pc.name === 'openai'
    ? openaiAdapter(pc.apiKey, pc.baseUrl, pc.modelMap)
    : anthropicAdapter(pc.apiKey, pc.baseUrl, pc.modelMap)
}

export function makeProvider(adapter: ProviderAdapter, modelId: string): Provider {
  return {
    name: adapter.name,
    async generate(req: GenerateRequest): Promise<GenerateResponse> {
      const pr = toProviderRequest(req)
      pr.modelId = modelId
      pr.stream = false

      const res = await adapter.request(pr)
      if (!res.ok) {
        const body = await res.text()
        throw new ProviderError('provider_error', `${adapter.name} returned ${res.status}: ${body}`)
      }

      const body = (await res.json()) as unknown
      const parsed = adapter.parseNonStream(body)
      return {
        text: parsed.text,
        usage: parsed.usage,
        provider: adapter.name,
        finishReason: parsed.finishReason,
      }
    },

    async stream(req, callbacks) {
      const pr = toProviderRequest(req)
      pr.modelId = modelId
      pr.stream = true

      try {
        const res = await adapter.request(pr)
        if (!res.ok) {
          const body = await res.text()
          throw new ProviderError('provider_error', `${adapter.name} returned ${res.status}: ${body}`)
        }

        let inputTokens = 0
        let outputTokens = 0
        let finishReason = 'stop'

        for await (const event of parseSSE(res.body)) {
          const chunk = adapter.parseStreamEvent(event.event ?? '', safeJson(event.data))
          if (!chunk) continue

          if ('delta' in chunk) {
            callbacks.onChunk({ delta: chunk.delta })
          } else if ('done' in chunk) {
            inputTokens = chunk.usage.inputTokens || inputTokens
            outputTokens = chunk.usage.outputTokens || outputTokens
            finishReason = chunk.finishReason
          } else if ('usage' in chunk) {
            inputTokens = chunk.usage.inputTokens || inputTokens
            outputTokens = chunk.usage.outputTokens || outputTokens
          }
        }

        callbacks.onChunk({
          done: true,
          usage: {
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
          },
          finishReason,
        })
        callbacks.onDone()
      } catch (err) {
        callbacks.onError(err)
      }
    },
  }
}

export function makeFallbackProvider(providers: Provider[]): Provider {
  const primary = providers[0]

  return {
    name: primary.name,
    async generate(req: GenerateRequest): Promise<GenerateResponse> {
      const errors: string[] = []
      for (const p of providers) {
        try {
          return await p.generate(req)
        } catch (err) {
          if (err instanceof ProviderError) {
            errors.push(err.message)
            if (!isRetryable(err.message)) throw err
            continue
          }
          throw err
        }
      }
      throw new ProviderError('provider_error', `All providers failed: ${errors.join('; ')}`)
    },

    async stream(req, callbacks) {
      let fallbackAttempted = false
      let tokensEmitted = false

      for (let i = 0; i < providers.length; i++) {
        const p = providers[i]

        try {
          await p.stream(req, {
            onChunk(chunk: StreamChunk) {
              if ('delta' in chunk) tokensEmitted = true
              callbacks.onChunk(chunk)
            },
            onDone() {
              callbacks.onDone()
            },
            onError(err: unknown) {
              if (fallbackAttempted && tokensEmitted) {
                // A fallback produced tokens before failing; do not silently re-issue.
                throw new ProviderError(
                  'provider_error',
                  `Stream failed after fallback already emitted tokens`
                )
              }
              // Errors here will be caught by the surrounding try and trigger next fallback.
              throw err
            },
          })
          return
        } catch (err) {
          if (i < providers.length - 1 && isRetryable((err as Error).message) && !tokensEmitted) {
            fallbackAttempted = true
            continue
          }
          throw err
        }
      }
    },
  }
}

function isRetryable(message: string): boolean {
  const code = Number(message.match(/returned (\d+):/)?.[1])
  if (Number.isNaN(code)) return true // network/connection failure
  return code === 429 || code >= 500
}

function safeJson(data: string): unknown {
  try {
    return JSON.parse(data)
  } catch {
    return {}
  }
}
