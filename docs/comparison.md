---
title: Comparison
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Comparison

An honest look at the alternatives. Wingport isn't the right choice for everyone — here's how to decide.

## vs. hand-rolling an edge function

The "correct" DIY path today: store your key in Supabase secrets, write a Deno edge function that verifies the JWT, forwards to the provider, and streams back.

**What you write yourself:** JWT verification, per-user rate limiting (needs tables), usage metering, SSE proxying within edge runtime CPU/wall-clock limits, provider error handling, retries, fallback, and the entire mobile client half: stream parsing, reconnection, cancellation, typed errors.

**What Wingport is:** that exact function — hardened, tested, maintained, and paired with a client SDK that handles the mobile half. You keep full ownership (it runs in your project); you stop maintaining boilerplate.

Choose DIY if your needs are truly one-off and you enjoy owning the code. Choose Wingport if you'd rather own a config file.

## vs. Firebase AI Logic

Firebase AI Logic solves the same key-security problem — proof the problem is real. But it's Gemini-only, Google-only, Firebase-only.

Wingport is neutral on every axis: any provider (Anthropic, OpenAI, Google), any backend (Supabase first, Firebase planned), and open source, so you're never locked into one vendor's model roadmap.

## vs. OpenRouter / LiteLLM

OpenRouter and LiteLLM are excellent **server-side** routers: one API across many providers. But they have no concept of your *end users* — no per-user auth, no per-user quotas, no mobile SDK — and OpenRouter is a hosted middleman in your request path.

Wingport is mobile-first: it authenticates individual end users against your existing auth, enforces per-user limits, meters per-user usage, and ships a client SDK built for unreliable networks. You can even use OpenRouter *as a provider inside* Wingport if you want its routing. <Badge type="info" text="Planned" />

## vs. calling providers directly from the app

Shipping `sk-...` in your binary. Please don't. Any user can extract the key via a debugging proxy, and provider terms prohibit client-side keys for exactly this reason. There is no RLS trick or obfuscation that fixes this: **any secret that reaches the client is public.**
