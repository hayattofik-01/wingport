---
title: FAQ
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# FAQ

**Is Wingport production-ready?**
Not yet — and we'll never let the docs pretend otherwise. v0.1 is an alpha: the core loop works end to end (deploy, authenticate, stream, meter, enforce quotas), the streaming transport is the basic version, and the API may change before 1.0. It's right for side projects, internal tools, and MVPs today; the hardening roadmap is public in the issues. When something isn't ready, the docs say so with a <span class="VPBadge warning">Planned</span> badge.

**What does it cost?**
Nothing. MIT licensed, self-hosted in your own Supabase project, free forever — including commercially. The self-hosted core will never be feature-gated. (A hosted convenience tier is on the long-term roadmap for teams that want it; it will run the same open-source code.)

**Do my prompts or keys ever touch Wingport's servers?**
No — there are no Wingport servers in your request path. The gateway runs in your Supabase project; keys live in your Supabase secrets; requests go app → your project → provider. If Wingport-the-project disappeared tomorrow, your deployment keeps working.

**How is this different from Firebase AI Logic / OpenRouter / writing my own edge function?**
Short version: Firebase AI Logic is Gemini-and-Google-only; OpenRouter and LiteLLM are server-side routers with no concept of your end users and (for OpenRouter) a hosted middleman in your path; a hand-rolled edge function is a backend you now maintain, minus the per-user limits, metering, and the mobile streaming client. The full honest breakdown is on the [Comparison](/comparison) page.

**Can I use it with Firebase instead of Supabase?**
Not yet — Supabase is the v0.1 target. A Firebase deployment target (Cloud Functions + Firebase Auth verification) is on the roadmap. The Dart SDK is already auth-agnostic via the `tokenProvider` constructor.

**Does it work with Riverpod / Bloc / Provider?**
Yes — the SDK is state-management-agnostic. `Wingport` is a plain class, cheap to construct, safe as a singleton; `stream()` returns a standard Dart `Stream`. Wire it into whatever you already use.

**What stops one of my users from running up my AI bill?**
Per-user limits, enforced in the gateway before any tokens are spent: requests per minute (burst), requests per day, tokens per day, and concurrent-stream caps — with tiers mapped from your own user data. See [Usage & Quotas](/concepts/usage-quotas).

**Which models can my app call?**
Only the aliases you list in `wingport.config.ts`. The client can't request anything you didn't configure — and because aliases map to concrete model IDs server-side, you can upgrade models with a redeploy and **no app-store review**.

**Why TypeScript for the gateway if this is a Dart project?**
Because Supabase Edge Functions run Deno. The Dart side is where your app lives (the SDK); the gateway is ~infrastructure you deploy once and rarely touch. A pure-Dart self-hosted gateway (Shelf) is on the roadmap for teams running Dart on the server.

**Can I contribute?**
Please. The project is young and built in public — the [roadmap](/reference/roadmap) is real, the issues are scoped, and `good first issue` means it. Start with a GitHub Discussion about the AI feature you're building; real apps' needs set the priority order.

---
