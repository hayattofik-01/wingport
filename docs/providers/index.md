---
title: Providers — Anthropic / OpenAI / Google
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Providers

Each provider page follows the same template:

## Anthropic

```ts
anthropic({
  models: { "claude-sonnet": "claude-sonnet-4-6" },
  apiKeySecret: "ANTHROPIC_API_KEY",   // default
  defaultMaxTokens: 1024,
})
```

Set the key: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
Provider options passthrough: `providerOptions: {"anthropic": {"top_k": 40}}`

## OpenAI

```ts
openai({
  models: { "gpt-5-mini": "gpt-5-mini" },
  apiKeySecret: "OPENAI_API_KEY",
})
```

## Google

```ts
google({
  models: { "gemini-flash": "gemini-2.5-flash" },
  apiKeySecret: "GOOGLE_AI_API_KEY",
})
```

> Concrete model IDs above are illustrative — pin the current IDs from each provider's docs when configuring.

---
