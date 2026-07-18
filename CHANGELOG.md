# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0-alpha.1] - Unreleased

### Added

- `gateway`: Supabase Edge Function with `/v1/generate`, `/v1/stream`, and `/v1/quota` endpoints.
- `gateway`: Anthropic Messages API and OpenAI Chat Completions adapters for non-streaming and streaming responses, normalized to the §3.1 wire format.
- `gateway`: Supabase JWT auth middleware supporting HS256 (`WINGPORT_JWT_SECRET`) and JWKS (`SUPABASE_URL`) verification.
- `gateway`: Per-user quota enforcement and usage metering backed by atomic Postgres SQL (§3.3).
- `gateway`: Provider fallback that re-routes to the next provider on retryable failures before the first streamed token, and terminates with `provider_error` after tokens have been emitted.
- `cli`: `npx wingport init` and `npx wingport deploy` commands that scaffold the gateway into a Supabase project from a `wingport.config.ts` file.
- `sdk`: Dart SDK with `generate()`, `stream()`, `quota()`, sealed `WingportException` hierarchy, `connectTimeout`/`chunkTimeout`/`maxRetries` options, and 401 session-refresh retry.
- `examples/demo_app`: Flutter chat demo that streams through the gateway with distinct error states and a quota meter.
- `docs`: VitePress documentation site.
- Community and release infrastructure: issue templates, `CONTRIBUTING.md`, `LICENSE`, and a tag-driven release workflow.

### Known limitations

- The SDK transport is a basic implementation; resumption, lifecycle/backgrounding handling, and automatic stream retry are tracked in issue #7.
- Anthropic and OpenAI are the only supported providers.
- CLI requires the Supabase CLI to be installed and authenticated.
