# Wingport Gateway

Supabase Edge Function gateway.

- Ticket T2: `/v1/generate` and `/v1/stream` with an Anthropic adapter.
- Ticket T3: Supabase JWT auth middleware (HS256 secret or JWKS).
- Middleware pipeline is ready for T4 quotas.

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

## Auth configuration

The middleware supports two modes:

- `HS256` (default if `SUPABASE_JWT_SECRET` is set): verify tokens with the project's JWT secret.
- `JWKS` (default otherwise): fetch `SUPABASE_URL/auth/v1/.well-known/jwks.json` and cache keys.

Override with `WINGPORT_AUTH_MODE=hs256` or `WINGPORT_AUTH_MODE=jwks`.

| Variable | Purpose |
|----------|---------|
| `SUPABASE_JWT_SECRET` | HS256 secret |
| `SUPABASE_URL` | Supabase project URL (used for JWKS) |
| `WINGPORT_AUTH_MODE` | `hs256` or `jwks` |
| `WINGPORT_ALLOW_ANONYMOUS` | `true` or `false` (default `false`) |
| `WINGPORT_REQUIRE_VERIFIED_EMAIL` | `true` or `false` (default `false`) |
| `WINGPORT_TIER_CLAIM` | JWT claim used for the tier (default `app_tier`) |

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
ANTHROPIC_BASE_URL=http://127.0.0.1:9000 \
ANTHROPIC_API_KEY=mock \
SUPABASE_JWT_SECRET=this-is-a-test-secret-which-is-32-bytes! \
deno task dev

# Terminal 3 — generate (non-streaming)
curl -X POST http://localhost:8000/v1/generate \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <valid-supabase-jwt>' \
  -d '{"model":"claude-sonnet","prompt":"say hi"}'

# Terminal 3 — stream
curl -N -X POST http://localhost:8000/v1/stream \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <valid-supabase-jwt>' \
  -d '{"model":"claude-sonnet","prompt":"say hi"}'
```

The JWT must be signed with `SUPABASE_JWT_SECRET` for the HS256 path. In Supabase the token is returned by `supabase.auth.getSession()`.

Replace `claude-sonnet` with the alias you configure in the gateway. The current default model map is `claude-sonnet -> claude-sonnet-4-6`.
