import type {
  GenerateRequest,
  ModelAliasMap,
  ProviderAdapter,
  ProviderRequest,
  ProviderResponse,
  ProviderStreamChunk,
  Usage,
  WingMessage,
} from '../types.ts'

const API_VERSION = '2023-06-01'

export function anthropicAdapter(
  apiKey: string,
  baseUrl: string,
  modelMap: ModelAliasMap
): ProviderAdapter {
  return {
    name: 'anthropic',
    baseUrl: baseUrl.replace(/\/$/, ''),
    resolveModel(alias: string): string | undefined {
      return modelMap[alias]
    },
    request(req: ProviderRequest): Promise<Response> {
      return fetchAnthropicMessages(req, apiKey, baseUrl.replace(/\/$/, ''))
    },
    parseNonStream(body: unknown): ProviderResponse {
      return parseAnthropicMessageResponse(body)
    },
    parseStreamEvent(eventType: string, data: unknown): ProviderStreamChunk | undefined {
      return parseAnthropicStreamEvent(eventType, data)
    },
  }
}

export function toProviderRequest(req: GenerateRequest): ProviderRequest {
  const messages: WingMessage[] = req.messages
    ? [...req.messages]
    : req.prompt
    ? [{ role: 'user', content: req.prompt }]
    : []

  const system = messages.find((m) => m.role === 'system')?.content
  const conversation = messages.filter((m) => m.role !== 'system')

  return {
    modelId: '', // filled by caller
    messages: conversation,
    system,
    maxTokens: req.maxTokens ?? 1024,
    temperature: req.temperature ?? 0.7,
    stream: false,
  }
}

function fetchAnthropicMessages(
  req: ProviderRequest,
  apiKey: string,
  baseUrl: string
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: req.modelId,
    max_tokens: req.maxTokens,
    temperature: req.temperature,
    messages: req.messages,
    stream: req.stream,
  }
  if (req.system) body.system = req.system

  return fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
    },
    body: JSON.stringify(body),
  })
}

function parseAnthropicMessageResponse(body: unknown): ProviderResponse {
  const msg = body as Record<string, unknown>
  const contentBlocks = (msg.content ?? []) as Array<{ type: string; text?: string }>
  const text = contentBlocks
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('')

  const usage = normalizeUsage(msg.usage as Record<string, number> | undefined)
  const stopReason = msg.stop_reason as string | null

  return {
    text,
    usage,
    finishReason: stopReason ?? 'stop',
  }
}

function parseAnthropicStreamEvent(
  eventType: string,
  data: unknown
): ProviderStreamChunk | undefined {
  const d = data as Record<string, unknown>

  if (eventType === 'content_block_delta' || d.type === 'content_block_delta') {
    const delta = d.delta as Record<string, unknown> | undefined
    const text = delta?.text as string | undefined
    if (text !== undefined && text.length > 0) {
      return { delta: text }
    }
  }

  if (eventType === 'message_delta' || d.type === 'message_delta') {
    const messageDelta = d.delta as Record<string, unknown> | undefined
    const usageRaw = d.usage as Record<string, number> | undefined
    const usage = normalizeUsage(usageRaw)
    const stopReason = messageDelta?.stop_reason as string | null
    return { done: true, usage, finishReason: stopReason ?? 'stop' }
  }

  if (eventType === 'message_start' || d.type === 'message_start') {
    const message = d.message as Record<string, unknown> | undefined
    const usageRaw = message?.usage as Record<string, number> | undefined
    const usage = normalizeUsage(usageRaw)
    return { usage }
  }

  // message_stop carries no client-visible data.
  return undefined
}

function normalizeUsage(raw: Record<string, number> | undefined): Usage {
  const input = raw?.input_tokens ?? raw?.inputTokens ?? 0
  const output = raw?.output_tokens ?? raw?.outputTokens ?? 0
  return {
    inputTokens: input,
    outputTokens: output,
    totalTokens: input + output,
  }
}
