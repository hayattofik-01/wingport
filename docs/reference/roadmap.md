---
title: Reference — Roadmap
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Roadmap

Built in public. The checkboxes below mirror the GitHub project board.

## v0.1 — the core loop
- [ ] Supabase deployment via CLI (`init`, `deploy`)
- [ ] Anthropic + OpenAI providers, streaming + generate
- [ ] Supabase JWT auth, per-user request/token quotas
- [ ] Usage metering to Postgres
- [ ] Dart SDK: `generate`, `stream`, sealed errors, cancellation, retry-with-partial

## v0.2
- [ ] Prompt templates: server-side prompts, validated inputs, structured output
- [ ] Google provider · model aliases hot-swap · `doctor` CLI
- [ ] Stream resume · spend caps plugin · plugin authoring guide

## v0.3+
- [ ] Firebase deployment target · multimodal input · pgvector context (RAG)
- [ ] Response caching · moderation plugin · OpenRouter meta-provider

## Cloud (parallel track)
- [ ] Hosted gateway (BYOK) → analytics dashboard → managed keys

Want something sooner? Open a discussion — roadmap priority follows real apps' needs.

---

*Wingport is open source under the MIT license. The wire between your app and AI.*
