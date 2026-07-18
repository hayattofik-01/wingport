# Wingport Demo App

A minimal Flutter chat screen that streams AI responses through a Wingport gateway deployed to your Supabase project.

## What this demonstrates

- Supabase Auth sign-in.
- Streaming AI responses through `Wingport.stream()`.
- Quota meter shown in the app bar (`Wingport.quota()`).
- Distinct error states: auth, quota, network, provider, interrupted stream with partial text preserved, cancelled.
- Model picker (`gpt-4o` and `claude-sonnet`).
- Request cancellation with a stop button.

## Prerequisites

- A Supabase project.
- An OpenAI or Anthropic API key.
- The Supabase CLI installed and logged in.

## Configure the app

Create or edit `assets/.env` (or pass `--dart-define`) with:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

## Deploy the gateway

From the root of your Supabase project (not this folder):

```bash
npx wingport init
npx wingport deploy
```

`wingport init` scaffolds `supabase/functions/wingport/`, a starter `wingport.config.ts`, and the quota migration. Edit `wingport.config.ts` and set your provider keys in the environment before deploying:

```bash
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
npx wingport deploy
```

`wingport deploy` runs `supabase db push` and `supabase functions deploy wingport --no-verify-jwt`.

## Run the app

```bash
cd examples/demo_app
flutter pub get
flutter run --dart-define=SUPABASE_URL=$SUPABASE_URL --dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

## End-to-end test

1. Create a user in your Supabase project (Authentication → Users → Add user) or sign up in the app.
2. Sign in on the device/emulator.
3. Pick a model, type a prompt, and send. The response streams token by token.
4. The app bar shows remaining requests and tokens.
5. To test the interrupted state, process-kill the gateway mid-response (e.g., `supabase functions delete wingport` or stop the local emulator). The UI shows **"Stream interrupted — partial kept"** with the text received so far and a retry button.
