---
title: Gateway Configuration
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Gateway Configuration

All gateway behavior is defined in `wingport.config.ts` — one typed object, sane defaults.

```ts
import { defineGateway, anthropic, openai, google } from "wingport";

export default defineGateway({
  // Which auth system issues your users' JWTs
  auth: {
    provider: "supabase",           // "firebase" [ROADMAP]
    requireVerifiedEmail: false,     // reject unverified accounts
    allowAnonymous: false,           // allow Supabase anonymous sign-ins
  },

  // Providers and the models the client may request
  providers: [
    anthropic({
      models: ["claude-sonnet", "claude-haiku"],
      // secret name in Supabase; defaults shown
      apiKeySecret: "ANTHROPIC_API_KEY",
    }),
    openai({ models: ["gpt-5-mini"] }),
    google({ models: ["gemini-flash"] }),
  ],

  // Per-end-user limits
  limits: {
    default: {
      requestsPerDay: 50,
      tokensPerDay: 100_000,
      requestsPerMinute: 10,
    },
    // Map your own user tiers to different limits.
    // Tier is read from a claim in the JWT or a column you define.
    tiers: {
      pro: { requestsPerDay: 1000, tokensPerDay: 2_000_000 },
      admin: "unlimited",
    },
    tierSource: { jwtClaim: "app_tier" },
  },

  // Re-route to the next configured provider on 5xx / overload
  fallback: true,

  // Hard ceilings, independent of user tiers
  guards: {
    maxTokensPerRequest: 4096,
    maxConcurrentStreamsPerUser: 2,
  },

  // Plugins extend the request pipeline [ROADMAP]
  plugins: [],
});
```

> **Design principle:** the client is untrusted. Everything above is enforced server-side. Nothing the Flutter app sends can raise its own limits, access unlisted models, or bypass auth.

## Model aliases

Model strings in the client (`'claude-sonnet'`) are **aliases** you define, mapped to concrete provider model IDs in the provider config. This means you can upgrade the underlying model (e.g. to a newer Claude Sonnet version) by redeploying the gateway — zero app updates, no app-store review.

```ts
anthropic({
  models: {
    "claude-sonnet": "claude-sonnet-4-6",
    "claude-haiku": "claude-haiku-4-5",
  },
})
```

---
