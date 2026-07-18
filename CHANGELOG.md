# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0-dev] - Unreleased

### Added

- `gateway`: Supabase Edge Function skeleton with `/v1/generate` and `/v1/stream` endpoints.
- `gateway`: Anthropic Messages API adapter for non-streaming and streaming responses.
- `gateway`: Supabase JWT auth middleware supporting HS256 and JWKS verification.
- `gateway`: SSE parser with fragmentation and mid-UTF-8 split tolerance.
- `sdk`: Dart SDK with `generate()`, `stream()`, and the sealed `WingportException` hierarchy.
- `sdk`: Basic SSE transport using `http.Client().send()`.
- `cli`: TypeScript skeleton for the `wingport` CLI.
- `examples/demo_app`: Flutter chat demo that streams through the gateway.
- `docs`: VitePress documentation site.
- Community and release infrastructure: issue templates, `CONTRIBUTING.md`, and a tag-driven release workflow.

### Known limitations

- Quotas and metering are not implemented in this pre-release.
- CLI `init` and `deploy` commands are not yet implemented.
- OpenAI and Google provider adapters are not yet implemented.
- The SDK transport is a basic implementation; resumption, retry, and inter-chunk timeouts are planned for a hardened rewrite.
