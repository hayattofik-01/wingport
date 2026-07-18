---
title: Authentication
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Authentication

Wingport does not have its own auth system — that's the point. It authenticates every request with the session your users already have.

## Supabase

```ts
auth: { provider: "supabase" }
```

The Dart SDK attaches the current session's access token to every request. The gateway verifies it locally using your project's JWT secret. Expired token → `401` → the SDK surfaces `AuthException` (and will retry once after `supabase_flutter` refreshes the session).

The verified user ID (`sub` claim) becomes the identity for quotas and usage metering.

## Anonymous users

If your app supports Supabase anonymous sign-ins, set `allowAnonymous: true`. Anonymous users get their own quota rows — useful for try-before-signup flows, with limits keeping abuse bounded.

## Firebase <span class="VPBadge warning">Planned</span>

`auth: { provider: "firebase" }` will verify Firebase ID tokens, enabling Firebase-auth apps to use a Wingport gateway.

## Service calls (server-to-server)

For trusted server contexts (cron jobs, admin scripts), mint a service token with the CLI: `wingport token create --role service`. Service calls bypass per-user limits but are still metered.

---
