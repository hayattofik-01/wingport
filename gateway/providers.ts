import type {
  GenerateRequest,
  GenerateResponse,
  ProviderAdapter,
  StreamChunk,
} from './types.ts'
import { anthropicAdapter, toProviderRequest } from './adapters/anthropic.ts'
import { openaiAdapter } from './adapters/openai.ts'
import { parseSSE } from './sse.ts'
import { ProviderError } from './handlers/generate.ts'
import { loadConfig, type GatewayConfig } from './config.ts'

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

export function getProviderForAlias(
  modelAlias: string,
  cfg: GatewayConfig = loadConfig()
): Provider | undefined {
  const providerCfg = cfg.provider
  if (!providerCfg.apiKey) {
    throw new ProviderError('provider_error', `${providerCfg.name.toUpperCase()}_API_KEY is not set`)
  }

  const adapter =
    providerCfg.name === 'openai'
      ? openaiAdapter(providerCfg.apiKey, providerCfg.baseUrl, providerCfg.modelMap)
      : anthropicAdapter(providerCfg.apiKey, providerCfg.baseUrl, providerCfg.modelMap)
  const modelId = adapter.resolveModel(modelAlias)
  if (!modelId) return undefined

  return makeProvider(adapter, modelId)
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

function safeJson(data: string): unknown {
  try {
    return JSON.parse(data)
  } catch {
    return {}
  }
}
