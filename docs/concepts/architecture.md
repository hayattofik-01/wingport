---
title: Architecture
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Architecture

```
┌─────────────────────────────┐
│   Flutter app + Wingport SDK │   no keys in the binary
└──────────────┬──────────────┘
               │  HTTPS + user JWT
┌──────────────▼──────────────────────────────┐
│        YOUR Supabase project                 │
│  ┌────────────────────────────────────────┐  │
│  │        Wingport gateway (edge fn)      │  │
│  └───┬──────────────┬───────────────┬────┘  │
│  ┌───▼────┐   ┌─────▼─────┐   ┌─────▼────┐  │
│  │  Auth  │   │ Postgres  │   │ Secrets  │  │
│  │  (JWT) │   │usage/quota│   │ API keys │  │
│  └────────┘   └───────────┘   └──────────┘  │
└──────────────┬──────────────────────────────┘
               │  provider call, your keys
     ┌─────────┼─────────┐
┌────▼───┐ ┌───▼────┐ ┌──▼─────┐
│Anthropic│ │ OpenAI │ │ Google │
└────────┘ └────────┘ └────────┘
```

## Request lifecycle

1. **The app calls the SDK.** `wing.stream(model: 'claude-sonnet', prompt: ...)`. The SDK attaches the user's current Supabase session JWT.
2. **The gateway verifies the user.** JWT verification happens locally against your project's signing secret — no network round-trip. The gateway now knows *which end user* is calling, not just "the app".
3. **Quota check.** The gateway reads the user's row in `wingport_usage`. Over their daily request or token limit? The request is rejected with `429` before a single provider token is spent.
4. **Provider call.** The gateway pulls the key from your Supabase secrets, maps the request to the provider's API shape, and forwards it. If the primary provider errors and `fallback` is enabled, the request re-routes automatically.
5. **Streaming passthrough.** Response tokens stream back through the gateway to the device as SSE. The gateway never buffers the full response.
6. **Metering.** On completion, token counts are written to `wingport_usage` — your data, your database, queryable with SQL.

## What runs where

| Component | Language | Runs on | You maintain? |
|---|---|---|---|
| Dart SDK | Dart | The user's device | No — `pub upgrade` |
| Gateway function | TypeScript (Deno) | Your Supabase edge | No — `wingport deploy` updates it |
| Config | TypeScript | Checked into your repo | Yes — it's ~15 lines |
| Usage tables | SQL | Your Postgres | No — migrations are generated |

---
