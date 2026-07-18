import type {
  ModelAliasMap,
  ProviderAdapter,
  ProviderRequest,
  ProviderResponse,
  ProviderStreamChunk,
  Usage,
  WingMessage,
} from '../types.ts'

export function openaiAdapter(
  apiKey: string,
  baseUrl: string,
  modelMap: ModelAliasMap
): ProviderAdapter {
  return {
    name: 'openai',
    baseUrl: baseUrl.replace(/\/$/, ''),
    resolveModel(alias: string): string | undefined {
      return modelMap[alias]
    },
    request(req: ProviderRequest): Promise<Response> {
      return fetchOpenAIChatCompletion(req, apiKey, baseUrl.replace(/\/$/, ''))
    },
    parseNonStream(body: unknown): ProviderResponse {
      return parseOpenAIResponse(body)
    },
    parseStreamEvent(_eventType: string, data: unknown): ProviderStreamChunk | undefined {
      return parseOpenAIStreamEvent(data)
    },
  }
}

function fetchOpenAIChatCompletion(
  req: ProviderRequest,
  apiKey: string,
  baseUrl: string
): Promise<Response> {
  const messages: WingMessage[] = req.messages ? [...req.messages] : []
  if (req.system) {
    messages.unshift({ role: 'system', content: req.system })
  }

  const body: Record<string, unknown> = {
    model: req.modelId,
    messages,
    max_tokens: req.maxTokens,
    temperature: req.temperature,
    stream: req.stream,
  }

  if (req.stream) {
    body.stream_options = { include_usage: true }
  }

  return fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })
}

function parseOpenAIResponse(body: unknown): ProviderResponse {
  const msg = body as Record<string, unknown>
  const choice = (msg.choices as Array<Record<string, unknown>> | undefined)?.[0]
  const message = choice?.message as Record<string, unknown> | undefined
  const text = (message?.content as string | undefined) ?? ''
  const finishReason = (choice?.finish_reason as string | null) ?? 'stop'
  const usage = normalizeUsage(msg.usage as Record<string, number> | undefined)

  return { text, usage, finishReason }
}

function parseOpenAIStreamEvent(data: unknown): ProviderStreamChunk | undefined {
  if (typeof data === 'string' && data.trim() === '[DONE]') {
    return undefined
  }

  const d = data as Record<string, unknown>
  const choices = d.choices as Array<Record<string, unknown>> | undefined
  const choice = choices?.[0]
  if (!choice) return undefined

  const delta = choice.delta as Record<string, unknown> | undefined
  const content = delta?.content as string | null | undefined
  if (content !== undefined && content !== null && content.length > 0) {
    return { delta: content }
  }

  const finishReason = choice.finish_reason as string | null | undefined
  const usage = normalizeUsage(d.usage as Record<string, number> | undefined)

  if (finishReason !== undefined && finishReason !== null) {
    return { done: true, usage, finishReason }
  }

  if (usage.totalTokens > 0) {
    return { usage }
  }

  return undefined
}

function normalizeUsage(raw: Record<string, number> | undefined): Usage {
  const input = raw?.prompt_tokens ?? raw?.inputTokens ?? 0
  const output = raw?.completion_tokens ?? raw?.outputTokens ?? 0
  const total = raw?.total_tokens ?? (input + output)
  return {
    inputTokens: input,
    outputTokens: output,
    totalTokens: total,
  }
}
