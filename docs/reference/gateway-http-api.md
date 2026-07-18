---
title: Gateway HTTP API
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Gateway HTTP API

The SDK speaks this API; you rarely will, but it's documented because open infrastructure should be.

Base: `https://<project>.supabase.co/functions/v1/wingport`
Auth: `Authorization: Bearer <supabase access token>` on every request.

## POST /v1/generate

```json
{
  "model": "claude-sonnet",
  "messages": [{ "role": "user", "content": "Hello" }],
  "maxTokens": 512,
  "temperature": 0.7
}
```

`200` → `{ "text": "...", "usage": {...}, "provider": "anthropic", "finishReason": "stop" }`

## POST /v1/stream

Same body. Response is `text/event-stream`:

```
data: {"delta":"Hel"}
data: {"delta":"lo!"}
data: {"done":true,"usage":{"inputTokens":8,"outputTokens":2},"finishReason":"stop"}
```

## GET /v1/quota

`200` → `{ "requestsRemaining": 42, "tokensRemaining": 91000, "resetsAt": "..." }`

## Errors

Uniform shape: `{ "error": { "code": "quota_exceeded", "message": "...", "retryAfter": 3600 } }`
Codes: `unauthorized`, `model_not_allowed`, `quota_exceeded`, `provider_error`, `bad_request`.
