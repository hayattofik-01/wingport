<div align="center">

# 🪽 Wingport

**Ship AI features. Skip the backend.**

The open-source AI layer for Flutter apps — deploys into your own Supabase project.
Your keys, your database, your users' auth. No middleman.

[Website](https://wingport.dev) · [Docs](./docs) · [Roadmap](#roadmap) · [Early access](https://wingport.dev)

![Status](https://img.shields.io/badge/status-in%20development-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![Made for Flutter](https://img.shields.io/badge/made%20for-Flutter-02569B)

</div>

> 🚧 **Wingport is pre-1.0 and being built in public.** The API below is the v0.1 design — see the [roadmap](#roadmap) for what's shipped vs. planned. Star the repo to follow along.

---

## The problem

You built your whole Flutter app on Supabase. No backend. It's great.

Then you add **one AI feature** — and everything breaks:

- You can't ship an OpenAI/Anthropic key in your app binary. Anyone can extract it with a proxy and burn your account down.
- So now you're writing a server. An edge function whose only job is: verify the user, check their quota, attach the key, forward the request, stream it back.
- A hundred lines of security-critical boilerplate that thousands of developers copy-paste from tutorials — with no per-user limits, no metering, and streaming that dies the moment someone walks into an elevator.

**Your entire backend exists because of one feature.** That's backwards.

## What Wingport does

One command deploys a hardened AI gateway **into your own Supabase project**. One SDK call streams any model into your app.

```dart
final wing = Wingport.supabase(Supabase.instance.client);

await for (final chunk in wing.stream(
  model: 'claude-sonnet',
  prompt: 'Summarize my day',
)) {
  setState(() => reply += chunk.text);
}
```

No API keys in the binary. No new auth system. No server to babysit.

## No middleman, by design

Wingport is **not a hosted proxy**. Everything runs in infrastructure you already own:

```
┌──────────────────────────────┐
│  Flutter app + Wingport SDK  │   no keys in the binary
└──────────────┬───────────────┘
               │ HTTPS + your user's JWT
┌──────────────▼───────────────────────────────┐
│           YOUR Supabase project              │
│  ┌────────────────────────────────────────┐  │
│  │       Wingport gateway (edge fn)       │  │
│  └──┬───────────────┬───────────────┬─────┘  │
│  ┌──▼─────┐  ┌──────▼──────┐  ┌─────▼─────┐  │
│  │  Auth  │  │  Postgres   │  │  Secrets  │  │
│  │ (JWT)  │  │ usage/quota │  │ API keys  │  │
│  └────────┘  └─────────────┘  └───────────┘  │
└──────────────┬───────────────────────────────┘
               │ provider call, your keys
      ┌────────┼─────────┐
 ┌────▼───┐ ┌──▼─────┐ ┌─▼──────┐
 │Anthropic│ │ OpenAI │ │ Google │
 └────────┘ └────────┘ └────────┘
```

- 🔑 Provider keys live in **your** Supabase secrets — never on our servers
- 📊 Usage data lives in **your** Postgres — query AI costs with plain SQL
- 🔍 The gateway is open source — read every line in your request path
- 🧯 If Wingport-the-company disappears tomorrow, **your app keeps working**

## Features

| | |
|---|---|
| **Zero backend** | `npx wingport init && npx wingport deploy` — that's your whole AI backend |
| **Your existing auth** | Every request verified with your users' Supabase session. Anonymous sign-ins supported. |
| **Per-user limits** | Requests/day, tokens/day, burst limits, tiers ("free users get 10 messages") — enforced server-side |
| **Multi-provider** | Anthropic, OpenAI, Google behind one interface. Switch models by changing a string. |
| **Model aliases** | `'claude-sonnet'` maps server-side to a concrete model ID — upgrade models with **no app-store review** |
| **Automatic fallback** | Provider down? Requests re-route to your backup automatically |
| **Mobile-grade streaming** | Survives WiFi↔cellular handoffs, keeps partial output on drops, cancels cleanly, retries sanely |
| **Typed errors** | Sealed `WingportException` hierarchy — handle every failure at compile time |

## Quickstart (v0.1 design)

**1. Deploy the gateway into your Supabase project**

```bash
npx wingport init
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx wingport deploy
```

**2. Configure it — this is your entire backend**

```ts
// wingport.config.ts
import { defineGateway, anthropic, openai } from "wingport";

export default defineGateway({
  auth: { provider: "supabase" },
  providers: [
    anthropic({ models: { "claude-sonnet": "claude-sonnet-4-6" } }),
    openai({ models: { "gpt-5-mini": "gpt-5-mini" } }),
  ],
  limits: {
    default: { requestsPerDay: 50, tokensPerDay: 100_000 },
    tiers: { pro: "unlimited" },
  },
  fallback: true,
});
```

**3. Call it from Flutter**

```bash
flutter pub add wingport
```

```dart
final wing = Wingport.supabase(Supabase.instance.client);

// One-shot
final result = await wing.generate(
  model: 'claude-sonnet',
  prompt: 'Write a haiku about hot reload',
);

// Streaming, with errors your compiler checks
try {
  await for (final chunk in wing.stream(model: 'claude-sonnet', prompt: q)) {
    setState(() => reply += chunk.text);
  }
} on QuotaExceededException catch (e) {
  showUpgradePrompt(resetsAt: e.resetsAt);
} on StreamInterruptedException catch (e) {
  reply = e.partialText;  // keep what arrived, offer retry
}
```

## Why not just…

**…use a Supabase edge function?** That *is* a backend — you write, test, and maintain the JWT check, quota tables, SSE proxying, retries, and metering yourself. Wingport is that exact function, hardened and maintained, plus the mobile client half nobody's boilerplate covers.

**…use Firebase AI Logic?** It proves the problem is real — but it's Gemini-only, Google-only, Firebase-only. Wingport is provider-neutral, backend-neutral, and open source.

**…use OpenRouter/LiteLLM?** Great server-side routers — with no concept of your *end users*. No per-user auth, quotas, or mobile SDK, and OpenRouter is a hosted middleman in your request path.

**…put the key in a Supabase table behind RLS?** Every legitimate user needs to read it, so every user (including the attacker with a burner email) receives your key. **Any secret that reaches the client is public.**

## Roadmap

Built in public — this mirrors the project board.

**v0.1 — the core loop**
- [ ] Supabase deploy via CLI (`init`, `deploy`)
- [ ] Anthropic + OpenAI providers · generate + streaming
- [ ] Supabase JWT auth · per-user request/token quotas
- [ ] Usage metering to your Postgres
- [ ] Dart SDK: `generate`, `stream`, sealed errors, cancellation, retry-with-partial

**v0.2** — Google provider · stream resume · spend-caps plugin · `wingport doctor`

**v0.3+** — Firebase target · multimodal · structured output · caching & moderation plugins

**Cloud (parallel track)** — hosted gateway (BYOK) → team analytics dashboard → managed keys (skip provider signups, billed per token). Same open-source core underneath, for teams who want convenience. The self-hosted path stays free and complete, forever.

## Contributing

Wingport is young — this is the best moment to shape it.

- ⭐ **Star the repo** — it genuinely decides how much time I can spend on this
- 💬 **Open a discussion** — tell me about your app's AI feature and what's blocked you; the roadmap follows real needs
- 🐛 Issues and PRs welcome once v0.1 code lands (days, not months)

See [docs/](./docs) for the full documentation: architecture, gateway config, SDK reference, security model.

## Security

The security model is documented in [docs](./docs). Report vulnerabilities to **security@wingport.dev** — please don't open public issues for them.

## License

MIT — free forever, including commercially. The self-hosted core will never be feature-gated.

---

<div align="center">

**Wingport** — the wire between your app and AI.

*Built with 3 years of Flutter scar tissue, in public, starting now.*

</div>
