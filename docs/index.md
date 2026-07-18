---
title: Introduction
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Introduction

Wingport is an open-source AI layer for mobile apps. It lets you ship AI features from a Flutter app **without building or running a backend** — and without ever putting a provider API key inside your app binary.

One command deploys the Wingport gateway into infrastructure you already own (starting with Supabase). One SDK call streams any model into your app, authenticated with the user auth you already have.

```dart
final wing = Wingport.supabase(Supabase.instance.client);

await for (final chunk in wing.stream(
  model: 'claude-sonnet',
  prompt: 'Summarize my day',
)) {
  setState(() => reply += chunk.text);
}
```

## Why Wingport exists

Backend-as-a-service platforms like Supabase and Firebase let you build an entire app with no server. The moment you add one AI feature, that promise breaks:

- **You can't ship an API key in an app binary.** Anyone can extract it with a proxy or a decompiler. One leaked key means someone scripts free AI usage against your account and you wake up to a four-figure bill.
- **So you write a backend anyway.** An edge function or server whose only job is: verify the user, check their quota, attach the key, forward the request, stream the response back. A hundred-plus lines of security-critical boilerplate that thousands of developers hand-roll — badly — from tutorials.
- **And the client half is worse.** Streaming SSE over mobile networks fails constantly: WiFi-to-cellular handoffs, backgrounded apps, flaky connections mid-generation. Nobody's boilerplate handles it.

Wingport replaces all of that. Your entire "AI backend" becomes a config file.

## No middleman, by design

Wingport is **not a hosted proxy**. The gateway deploys into *your* Supabase project:

- Your provider keys live in **your** Supabase secrets — they never touch our servers.
- Usage and quota data lives in **your** Postgres — query your AI costs with plain SQL.
- Requests flow app → your project → provider. **If Wingport-the-company disappears tomorrow, your app keeps working.**
- The gateway code is open source. Read every line before you deploy it.

## Features

<div class="features-grid">
<div class="feature-card"><h3><strong>No backend required</strong></h3><p>Deploys into your existing Supabase project in one command</p></div>
<div class="feature-card"><h3><strong>No keys in the binary</strong></h3><p>Provider keys stay server-side in your own secrets store</p></div>
<div class="feature-card"><h3><strong>Your existing auth</strong></h3><p>Authenticates every request with your users' Supabase session — no new auth system</p></div>
<div class="feature-card"><h3><strong>Per-user limits</strong></h3><p>Rate limits, daily quotas, and spend caps per end user, out of the box</p></div>
<div class="feature-card"><h3><strong>Multi-provider</strong></h3><p>Anthropic, OpenAI, and Google behind one interface — switch models by changing a string</p></div>
<div class="feature-card"><h3><strong>Automatic fallback</strong></h3><p>Provider down? Requests re-route to your configured backup automatically</p></div>
<div class="feature-card"><h3><strong>Mobile-grade streaming</strong></h3><p>The Dart SDK survives network handoffs, resumes streams, and cancels cleanly</p></div>
<div class="feature-card"><h3><strong>Typed errors</strong></h3><p>A sealed error hierarchy — handle every failure mode at compile time</p></div>
<div class="feature-card"><h3><strong>Usage in your database</strong></h3><p>Token counts and costs written to your Postgres per user, per model, per request</p></div>
<div class="feature-card"><h3><strong>Plugin ecosystem</strong></h3><p>Caching, moderation, analytics, and more as drop-in plugins <span class="VPBadge warning">Planned</span></p></div>
</div>

## Project status

Wingport is pre-1.0 and in active development, built in public. The v0.1 target covers: Supabase deployment, Anthropic + OpenAI providers, streaming and generation from the Dart SDK, per-user quotas, and usage tracking. See the [Roadmap](/reference/roadmap).

---
