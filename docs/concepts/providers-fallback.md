---
title: Providers & Fallback
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Providers & Fallback

## Supported providers (v0.1 target)

| Provider | Text generation | Streaming | Notes |
|---|---|---|---|
| Anthropic | ✅ | ✅ | Claude models |
| OpenAI | ✅ | ✅ | GPT models |
| Google | ✅ | ✅ | Gemini models |
| OpenRouter | <span class="VPBadge warning">Planned</span> | <span class="VPBadge warning">Planned</span> | Use as a meta-provider |
| On-device | <span class="VPBadge warning">Planned</span> | <span class="VPBadge warning">Planned</span> | Offline fallback via local models |

All providers are normalized to one request/response shape. Provider-specific parameters pass through a `providerOptions` escape hatch.

## Fallback

With `fallback: true`, a request that fails with a retryable provider error (`429`, `5xx`, overload) automatically re-routes to the next provider in your `providers` array that serves a compatible model. The SDK sees one stream; the handoff is invisible to your UI.

Fallback events are recorded in `wingport_usage.provider_used`, so you can see exactly how often your primary is failing over.

## Multimodal <span class="VPBadge warning">Planned</span>

Image input (vision) and structured output (JSON mode / tool calling) are designed into the wire format and planned shortly after v0.1. The `WingMessage` type already reserves `parts` for this.

---
