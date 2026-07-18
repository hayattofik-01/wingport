---
title: Prompt Templates
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Prompt Templates

> **Status:** designed for v0.2. This page documents the planned API so you can shape it — open a discussion with your use case.

Your prompts want to live server-side for the same reasons your keys do. If the prompt template ships in the app binary: you can't improve it without an app-store review, anyone can extract your carefully-tuned prompt with a decompiler, and a tampered client can rewrite it. For many AI apps, **the prompt is the product** — treat it like a secret.

Templates move the prompt into your gateway config. The app sends only named inputs.

```ts
// wingport.config.ts
templates: {
  resume_generator: {
    model: "claude-sonnet",
    system: "You are an expert resume writer. Be concise, quantify impact.",
    user: "Write a resume for this profile:\n{{profile}}\n\nTargeting:\n{{job}}",
    inputs: { profile: "json", job: "string" },   // validated at the gate
    maxTokens: 2000,
    output: resumeSchema,                          // optional: structured output
  },
}
```

```dart
// Flutter — the app never contains the prompt at all
final result = await wing.run('resume_generator', inputs: {
  'profile': user.profile.toJson(),
  'job': jobDescription,
});

final draft = ResumeDraft.fromJson(result.json);
```

## What this buys you

- **Iterate without app-store review.** Improve the prompt, `wingport deploy`, every user gets it instantly — the model-aliases trick, generalized to your entire AI feature.
- **Prompt IP stays out of the binary.** Nothing to extract.
- **Validated inputs.** Declared input schemas are enforced server-side; malformed or oversized inputs are rejected before spending tokens.
- **Per-feature analytics for free.** Templates are named, so `wingport_usage` now answers "what does the resume generator cost per user vs. the chat feature?" with plain SQL.
- **Structured output.** Declare an output schema and the gateway enforces the provider's JSON mode — the SDK returns parsed JSON ready for your Freezed models. Typed in, typed out.

## Scope (and non-goals)

Templates cover prompts + variables + structured output. Chains, agents, and conversation memory are **application logic** — they live happily in your Dart code calling templates as steps. Wingport is the layer, not the framework.

## Later: context from your own database <span class="VPBadge warning">Planned</span>

Your users' data already lives in Supabase, and Supabase ships pgvector. A planned `context` block lets a template pull matching rows from your own vector store and inject them — retrieval-augmented generation with zero new infrastructure. Your database is already your vector store.

---
