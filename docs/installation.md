---
title: Installation
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Installation

Wingport has two parts: the **gateway** (deploys into your Supabase project) and the **Dart SDK** (goes in your Flutter app).

## Prerequisites

- A [Supabase](https://supabase.com) project (free tier works)
- Supabase CLI installed and logged in
- A Flutter app using `supabase_flutter` for auth
- An API key from at least one provider (Anthropic, OpenAI, or Google)

## 1. Initialize the gateway

From your project root:

```bash
npx wingport init
```

This detects your Supabase project and:

- generates `supabase/functions/wingport/` — the gateway edge function
- generates `wingport.config.ts` — your gateway configuration
- generates a SQL migration for the usage and quota tables
- prompts you to set provider keys as Supabase secrets:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set OPENAI_API_KEY=sk-...
```


:::tip Note
Keys are stored in your Supabase project's encrypted secrets. They are never sent to, or seen by, Wingport.
:::


## 2. Configure

Edit `wingport.config.ts`:

```ts
import { defineGateway, anthropic, openai } from "wingport";

export default defineGateway({
  auth: {
    provider: "supabase",
  },
  providers: [
    anthropic({
      models: ["claude-sonnet", "claude-haiku"],
    }),
    openai({
      models: ["gpt-5-mini"],
    }),
  ],
  limits: {
    default: {
      requestsPerDay: 50,
      tokensPerDay: 100_000,
    },
  },
  fallback: true,
});
```

## 3. Deploy

```bash
npx wingport deploy
```

This runs the database migration and deploys the edge function to your Supabase project. Your AI backend now exists. That's the whole backend.

## 4. Install the Dart SDK

```bash
flutter pub add wingport
```

```dart
import 'package:wingport/wingport.dart';

final wing = Wingport.supabase(Supabase.instance.client);
```

The SDK reuses your existing Supabase client — its URL and the current user's session. There is nothing else to configure on the client. No keys. Ever.
