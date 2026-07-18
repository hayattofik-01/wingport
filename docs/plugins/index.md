---
title: Plugins — Overview
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Plugins

Plugins extend the gateway's request pipeline with hooks: `beforeRequest`, `afterResponse`, `onStreamChunk`, `onError`. Wingport's core stays small; capabilities are added the Better Auth way — as composable plugins.

```ts
import { defineGateway } from "wingport";
import { spendCaps } from "wingport/plugins";

export default defineGateway({
  // ...
  plugins: [
    spendCaps({ perUserMonthlyUsd: 5 }),
  ],
});
```

## Spend Caps

Converts token usage into estimated USD using per-model pricing and enforces monthly ceilings per user or app-wide. Rejections surface as `QuotaExceededException(limitType: 'spendMonthlyUsd')`.

## Response Caching <span class="VPBadge warning">Planned</span>

Content-addressed caching of identical prompts (great for onboarding flows and canned suggestions) with TTLs, stored in your Postgres or Redis.

## Moderation <span class="VPBadge warning">Planned</span>

Pre-flight input screening and streaming output screening with configurable actions (block, flag, log).

## Analytics <span class="VPBadge warning">Planned</span>

Richer event capture feeding the hosted dashboard — latency percentiles, model comparison, per-feature cost attribution via a `feature` tag on SDK calls.

## Write your own

A plugin is an object with typed hooks. Full authoring guide ships with v0.2.

---
