/**
 * Streaming SSE utilities for Wingport.
 *
 * parseSSE buffers incoming UTF-8 chunks, splits events on `\n\n`,
 * and handles `data:` and `event:` fields. It also tolerates fragmented
 * UTF-8 and events split across chunk boundaries.
 */

export type SseEvent = {
  event?: string
  data: string
}

export async function* parseSSE(
  body: ReadableStream<Uint8Array> | null
): AsyncGenerator<SseEvent> {
  if (!body) return

  const decoder = new TextDecoder('utf-8', { fatal: false })
  const reader = body.getReader()
  let buffer = ''
  let done = false

  while (!done) {
    const result = await reader.read()
    done = result.done
    if (result.value) {
      buffer += decoder.decode(result.value, { stream: true })
    } else if (done) {
      buffer += decoder.decode(new Uint8Array(), { stream: false })
    }

    // Split complete events on blank lines.
    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const raw = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const parsed = parseEvent(raw)
      if (parsed) yield parsed
      boundary = buffer.indexOf('\n\n')
    }
  }

  // Emit a trailing event if there is any non-empty content left.
  if (buffer.trim().length > 0) {
    const parsed = parseEvent(buffer)
    if (parsed) yield parsed
  }
}

function parseEvent(raw: string): SseEvent | undefined {
  const lines = raw.split('\n')
  let event: string | undefined
  const dataLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      // Strip optional single leading space (data: {…} or data:{…}).
      const rest = line.slice(5)
      dataLines.push(rest.startsWith(' ') ? rest.slice(1) : rest)
    }
    // Ignore comment / unknown fields.
  }

  if (dataLines.length === 0) return undefined
  const out: SseEvent = { data: dataLines.join('\n') }
  if (event) out.event = event
  return out
}

/**
 * Encode a JavaScript object as an SSE data line.
 */
export function encodeSSE(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

/**
 * Build a Response object with text/event-stream headers from a source
 * of wire-format chunks.
 */
export function sseResponse(source: ReadableStream<Uint8Array>): Response {
  return new Response(source, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
