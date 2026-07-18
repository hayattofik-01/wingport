---
title: Streaming & Resilience
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Streaming & Resilience

This is the half of the problem everyone underestimates. Mobile networks are hostile to long-lived SSE streams: WiFi↔cellular handoffs, elevators, app backgrounding, carrier NAT timeouts. Wingport's SDK treats stream failure as the *normal case* to engineer for, not an edge case.

## What the SDK handles for you

- **Chunk reassembly.** SSE events fragment across TCP packets; the parser handles partial frames, multi-line data, and keep-alive comments.
- **Mid-stream network loss.** If the connection drops mid-generation, the SDK surfaces the tokens received so far and throws `StreamInterruptedException` carrying `partialText` — your UI keeps what it has, and you decide whether to retry.
- **Resume on reconnect.** When the gateway supports it, interrupted streams resume from the last received token rather than regenerating from scratch. <span class="VPBadge warning">Planned</span> — v0.1 ships retry-with-partial, resume lands next
- **Timeouts that fit LLMs.** Separate connect timeout and *inter-chunk* timeout (a stream is dead if no token arrives for N seconds — not if the total takes minutes).
- **Backgrounding.** On iOS/Android app suspension, streams are cancelled cleanly and the state is surfaced, instead of leaking connections.

## The demo we lead with

Start a generation, toggle airplane mode mid-stream, toggle it back. The UI keeps the partial text, the SDK retries, the stream completes. That behavior is the difference between a tech demo and a shippable feature.

## Retry semantics

`generate()` retries idempotently on connection errors and provider `429/5xx` with exponential backoff and jitter (configurable). `stream()` never silently re-issues a request that already produced tokens — you always keep control of whether partial output is regenerated.

---
