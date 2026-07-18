import { assertEquals, assertStringIncludes } from '@std/assert'
import * as jose from 'jose'
import { app } from './main.ts'
import { makeProvider } from './providers.ts'
import { anthropicAdapter } from './adapters/anthropic.ts'
import { openaiAdapter } from './adapters/openai.ts'
import type { GenerateRequest, StreamChunk } from './types.ts'

class Deferred<T = void> {
  promise: Promise<T>
  resolve!: (value: T) => void
  reject!: (reason?: unknown) => void
  constructor() {
    this.promise = new Promise((res, rej) => {
      this.resolve = res
      this.reject = rej
    })
  }
}

const HS_SECRET = 'this-is-a-test-secret-which-is-32-bytes!'

async function signTestToken(claims: Record<string, unknown> = {}): Promise<string> {
  return await new jose.SignJWT({ sub: 'user-123', ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode(HS_SECRET))
}

function setEndpointEnv(env: Record<string, string>) {
  clearEndpointEnv()
  Deno.env.set('SUPABASE_JWT_SECRET', HS_SECRET)
  Deno.env.set('ANTHROPIC_API_KEY', env.ANTHROPIC_API_KEY ?? 'test-key')
  Deno.env.set('WINGPORT_PROVIDER', 'anthropic')
  Deno.env.set('WINGPORT_QUOTA_DISABLED', 'true')
  if (env.ANTHROPIC_BASE_URL) Deno.env.set('ANTHROPIC_BASE_URL', env.ANTHROPIC_BASE_URL)
}

function clearEndpointEnv() {
  Deno.env.delete('SUPABASE_JWT_SECRET')
  Deno.env.delete('WINGPORT_JWT_SECRET')
  Deno.env.delete('ANTHROPIC_API_KEY')
  Deno.env.delete('OPENAI_API_KEY')
  Deno.env.delete('ANTHROPIC_BASE_URL')
  Deno.env.delete('OPENAI_BASE_URL')
  Deno.env.delete('WINGPORT_PROVIDER')
  Deno.env.delete('WINGPORT_AUTH_MODE')
  Deno.env.delete('WINGPORT_QUOTA_DISABLED')
}

type MockServer = {
  url: string
  shutdown: () => Promise<void>
}

function startMockAnthropic(
  handler: (req: Request) => Response | Promise<Response>
): MockServer {
  const server = Deno.serve({ port: 0, hostname: '127.0.0.1' }, handler)
  const port = server.addr.port
  return {
    url: `http://127.0.0.1:${port}`,
    shutdown: () => server.shutdown(),
  }
}

Deno.test('generate returns parsed Anthropic response', async () => {
  const handler = (req: Request): Response => {
    assertEquals(req.url.endsWith('/v1/messages'), true)
    return new Response(
      JSON.stringify({
        content: [{ type: 'text', text: 'Hi there' }],
        usage: { input_tokens: 3, output_tokens: 5 },
        stop_reason: 'end',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
  const mock = startMockAnthropic(handler)
  try {
    const provider = makeProvider(
      anthropicAdapter('test-key', mock.url, { 'claude-sonnet': 'claude-sonnet-4-6' }),
      'claude-sonnet-4-6'
    )

    const result = await provider.generate({
      model: 'claude-sonnet',
      prompt: 'Hello',
    })

    assertEquals(result.text, 'Hi there')
    assertEquals(result.provider, 'anthropic')
    assertEquals(result.usage, { inputTokens: 3, outputTokens: 5, totalTokens: 8 })
    assertEquals(result.finishReason, 'end')
  } finally {
    await mock.shutdown()
  }
})

Deno.test('stream yields deltas and terminal usage', async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(
          'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":2}}}\n\n'
        )
      )
      controller.enqueue(
        new TextEncoder().encode(
          'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hel"}}\n\n'
        )
      )
      controller.enqueue(
        new TextEncoder().encode(
          'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"lo"}}\n\n'
        )
      )
      controller.enqueue(
        new TextEncoder().encode(
          'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end"},"usage":{"output_tokens":4}}\n\n'
        )
      )
      controller.enqueue(new TextEncoder().encode('event: message_stop\ndata: {"type":"message_stop"}\n\n'))
      controller.close()
    },
  })

  const handler = (): Response => {
    return new Response(body, {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }
  const mock = startMockAnthropic(handler)
  try {
    const provider = makeProvider(
      anthropicAdapter('test-key', mock.url, { 'claude-sonnet': 'claude-sonnet-4-6' }),
      'claude-sonnet-4-6'
    )

    const chunks: StreamChunk[] = []
    await provider.stream(
      { model: 'claude-sonnet', prompt: 'Hello' },
      {
        onChunk(c: StreamChunk) {
          chunks.push(c)
        },
        onDone() {},
        onError(err: unknown) {
          throw err
        },
      }
    )

    assertEquals(chunks, [
      { delta: 'Hel' },
      { delta: 'lo' },
      {
        done: true,
        usage: { inputTokens: 2, outputTokens: 4, totalTokens: 6 },
        finishReason: 'end',
      },
    ])
  } finally {
    await mock.shutdown()
  }
})

Deno.test('endpoint integration', async (t) => {
  await t.step('passthrough: first client byte before server finishes', async () => {
    clearEndpointEnv()
    const afterFirst = new Deferred()
    const body = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hel"}}\n\n'
          )
        )
        await afterFirst.promise
        controller.enqueue(
          new TextEncoder().encode(
            'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end"},"usage":{"output_tokens":4}}\n\n'
          )
        )
        controller.enqueue(new TextEncoder().encode('event: message_stop\ndata: {"type":"message_stop"}\n\n'))
        controller.close()
      },
    })

    const handler = (req: Request): Response => {
      assertEquals(req.url.endsWith('/v1/messages'), true)
      return new Response(body, {
        headers: { 'Content-Type': 'text/event-stream' },
      })
    }

    const mock = startMockAnthropic(handler)
    try {
      setEndpointEnv({ ANTHROPIC_BASE_URL: mock.url, ANTHROPIC_API_KEY: 'test-key' })
      const token = await signTestToken()

      const req: GenerateRequest = { model: 'claude-sonnet', prompt: 'Hello' }
      const res = await app(new Request('http://localhost/v1/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(req),
      }))

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let firstChunkReceived = false

      // Read until the first complete SSE event.
      while (!firstChunkReceived) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        if (buffer.includes('\n\n')) firstChunkReceived = true
      }

      assertEquals(firstChunkReceived, true)
      assertStringIncludes(buffer, 'data:')

      // Allow the mock to finish.
      afterFirst.resolve()

      // Drain the rest.
      while (true) {
        const { done } = await reader.read()
        if (done) break
      }
    } finally {
      await mock.shutdown()
      clearEndpointEnv()
    }
  })

  await t.step('model not allowed returns 403', async () => {
    clearEndpointEnv()
    setEndpointEnv({ ANTHROPIC_API_KEY: 'test-key' })
    const token = await signTestToken()
    const res = await app(new Request('http://localhost/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ model: 'unknown-model' }),
    }))
    assertEquals(res.status, 403)
    const body = await res.json()
    assertEquals(body.error.code, 'model_not_allowed')
    clearEndpointEnv()
  })
})

Deno.test('openai generate returns parsed response', async () => {
  const handler = (req: Request): Response => {
    assertEquals(req.url.endsWith('/v1/chat/completions'), true)
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: 'Hello from OpenAI' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
  const mock = startMockAnthropic(handler)
  try {
    const provider = makeProvider(
      openaiAdapter('test-key', mock.url, { 'gpt-4o': 'gpt-4o' }),
      'gpt-4o'
    )

    const result = await provider.generate({ model: 'gpt-4o', prompt: 'Hello' })

    assertEquals(result.text, 'Hello from OpenAI')
    assertEquals(result.provider, 'openai')
    assertEquals(result.usage, { inputTokens: 2, outputTokens: 3, totalTokens: 5 })
    assertEquals(result.finishReason, 'stop')
  } finally {
    await mock.shutdown()
  }
})

Deno.test('openai stream yields deltas and terminal usage', async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(
          'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'
        )
      )
      controller.enqueue(
        new TextEncoder().encode(
          'data: {"choices":[{"delta":{"content":" there"}}]}\n\n'
        )
      )
      controller.enqueue(
        new TextEncoder().encode(
          'data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":2,"completion_tokens":2,"total_tokens":4}}\n\n'
        )
      )
      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  const handler = (): Response => {
    return new Response(body, {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }
  const mock = startMockAnthropic(handler)
  try {
    const provider = makeProvider(
      openaiAdapter('test-key', mock.url, { 'gpt-4o': 'gpt-4o' }),
      'gpt-4o'
    )

    const chunks: StreamChunk[] = []
    await provider.stream(
      { model: 'gpt-4o', prompt: 'Hello' },
      {
        onChunk(c: StreamChunk) {
          chunks.push(c)
        },
        onDone() {},
        onError(err: unknown) {
          throw err
        },
      }
    )

    assertEquals(chunks, [
      { delta: 'Hi' },
      { delta: ' there' },
      { done: true, usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 }, finishReason: 'stop' },
    ])
  } finally {
    await mock.shutdown()
  }
})
