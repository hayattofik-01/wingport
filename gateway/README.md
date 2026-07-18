# Wingport Gateway

Supabase Edge Function gateway. Ticket T2 implements `/v1/generate` and `/v1/stream` with an Anthropic adapter, fixture-driven tests, and a middleware pipeline ready for T3/T4.

## Run locally

```bash
cd gateway
deno task dev
```

The server listens on `http://localhost:8000` by default (override with `PORT`).

## Test

```bash
deno task lint
deno task test
```

The test suite runs fixture-driven mocks of Anthropic, including:

- SSE event fragmentation
- mid-UTF-8 character splits
- passthrough: the first client byte is emitted before the mock server finishes sending

## Manual curl against a mock (no real API key)

For a manual end-to-end check, point the gateway at a local mock Anthropic server:

```bash
# Terminal 1 — start a simple mock Anthropic SSE server on port 9000
python3 - <<'PY'
from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class H(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.end_headers()
        for s in [
            'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":2}}}\n\n',
            'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hi "}}\n\n',
            'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"there"}}\n\n',
            'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end"},"usage":{"output_tokens":4}}\n\n',
            'event: message_stop\ndata: {"type":"message_stop"}\n\n',
        ]:
            self.wfile.write(s.encode())
            self.wfile.flush()

HTTPServer(('127.0.0.1', 9000), H).serve_forever()
PY

# Terminal 2 — run the gateway against the mock
ANTHROPIC_BASE_URL=http://127.0.0.1:9000 ANTHROPIC_API_KEY=mock deno task dev

# Terminal 3 — generate (non-streaming)
curl -X POST http://localhost:8000/v1/generate \
  -H 'Content-Type: application/json' \
  -d '{"model":"claude-sonnet","prompt":"say hi"}'

# Terminal 3 — stream
curl -N -X POST http://localhost:8000/v1/stream \
  -H 'Content-Type: application/json' \
  -d '{"model":"claude-sonnet","prompt":"say hi"}'
```

Replace `claude-sonnet` with the alias you configure in the gateway. The current default model map is `claude-sonnet -> claude-sonnet-4-6`.
