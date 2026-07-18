---
title: Security Model
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Security Model

## Principles

1. **Any secret that reaches the client is public.** Therefore no provider key, in any form, is ever sent to the device.
2. **The client is untrusted.** Model access, limits, and identity are all enforced in the gateway. The app can only *request*; the gateway *decides*.
3. **You can read the code.** The gateway is open source and deployed into your own project — audit the exact code in your request path.
4. **We are not in your request path.** No Wingport-operated server sees your traffic, keys, prompts, or users (unless you later opt into Wingport Cloud).

## Specifics

- JWTs are verified with your project's signing secret; expired/invalid tokens are rejected before any processing.
- Quota checks happen **before** provider calls — abusive traffic costs you rate-limit rejections, not tokens.
- `maxConcurrentStreamsPerUser` and `requestsPerMinute` bound key-farming attempts from a compromised account.
- Prompts and responses are **not stored** by default. Metering records token *counts*, not content. (Opt-in prompt logging is a roadmap plugin, stored — like everything — in your own database.)
- Generated tables ship with RLS enabled: users can read their own usage rows; only the service role writes.

## Responsible disclosure

Security reports: security@wingport.dev. Please do not open public issues for vulnerabilities.

---
