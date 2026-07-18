import { assertEquals } from '@std/assert'
import { parseSSE, encodeSSE } from './sse.ts'

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk))
      }
      controller.close()
    },
  })
}

async function collect<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const out: T[] = []
  for await (const item of gen) out.push(item)
  return out
}

Deno.test('parseSSE emits complete events', async () => {
  const body = streamOf([
    'data: {"delta":"Hel"}\n\n',
    'data: {"delta":"lo"}\n\n',
    'event: done\ndata: {"done":true}\n\n',
  ])
  const events = await collect(parseSSE(body))
  assertEquals(events, [
    { data: '{"delta":"Hel"}' },
    { data: '{"delta":"lo"}' },
    { event: 'done', data: '{"done":true}' },
  ])
})

Deno.test('parseSSE buffers fragmented events', async () => {
  const body = streamOf([
    'data: {"delta":"H',
    'el"}\n\ndata: {"de',
    'lta":"lo"}\n\n',
  ])
  const events = await collect(parseSSE(body))
  assertEquals(events, [
    { data: '{"delta":"Hel"}' },
    { data: '{"delta":"lo"}' },
  ])
})

Deno.test('parseSSE handles UTF-8 split across chunks', async () => {
  const text = 'café ☕'
  const full = `data: ${JSON.stringify({ delta: text })}\n\n`
  const bytes = new TextEncoder().encode(full)
  // Split mid-UTF-8 character (é is two bytes; split after 5 bytes).
  const first = bytes.slice(0, 5)
  const second = bytes.slice(5)
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(first)
      controller.enqueue(second)
      controller.close()
    },
  })
  const events = await collect(parseSSE(body))
  assertEquals(events, [{ data: `{"delta":"${text}"}` }])
})

Deno.test('encodeSSE produces valid wire chunks', () => {
  assertEquals(encodeSSE({ delta: 'hi' }), 'data: {"delta":"hi"}\n\n')
})
