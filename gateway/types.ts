export type Role = 'system' | 'user' | 'assistant'

export type WingMessage = {
  role: Role
  content: string
}

export type GenerateRequest = {
  model: string
  messages?: WingMessage[]
  prompt?: string
  maxTokens?: number
  temperature?: number
}

export type Usage = {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export type GenerateResponse = {
  text: string
  usage: Usage
  provider: string
  finishReason: string
}

export type StreamChunk =
  | { delta: string }
  | { done: true; usage: Usage; finishReason: string }

export type WingError = {
  error: {
    code: string
    message: string
    retryAfter?: number
  }
}

export type UserContext = {
  userId: string
  tier?: string
  isAnonymous: boolean
}

export type Context = {
  request: Request
  url: URL
  user?: UserContext
  body?: GenerateRequest
}

export type Next = () => Promise<Response>
export type Middleware = (ctx: Context, next: Next) => Promise<Response>

export type ModelAliasMap = Record<string, string>

export type ProviderRequest = {
  modelId: string
  messages: WingMessage[]
  system?: string
  maxTokens: number
  temperature: number
  stream: boolean
}

export type ProviderResponse = {
  text: string
  usage: Usage
  finishReason: string
}

export type ProviderStreamChunk =
  | { delta: string }
  | { usage: Usage }
  | { done: true; usage: Usage; finishReason: string }

export type ProviderAdapter = {
  name: string
  baseUrl: string
  resolveModel: (alias: string) => string | undefined
  request: (req: ProviderRequest) => Promise<Response>
  parseNonStream: (body: unknown) => ProviderResponse
  parseStreamEvent: (eventType: string, data: unknown) => ProviderStreamChunk | undefined
}
