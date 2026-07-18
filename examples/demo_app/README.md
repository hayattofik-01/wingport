# Wingport Demo App

A minimal Flutter chat screen that streams AI responses through a Wingport gateway deployed to your Supabase project.

## What this demonstrates

- Supabase Auth sign-in.
- Streaming AI responses through `Wingport.stream()`.
- Quota/usage meter shown in the app bar (`Wingport.quota()`).
- Interrupted-stream state with preserved partial text.
- Model picker (OpenAI `gpt-4o` and Anthropic `claude-sonnet`).

## Configure

Create or edit `assets/.env` (or pass `--dart-define`) with:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

## Gateway setup

1. Deploy the gateway from `/gateway` to your Supabase project:

```bash
supabase functions deploy wingport --no-verify-jwt
```

2. Set the provider and quota secrets:

```bash
supabase secrets set WINGPORT_PROVIDER=openai OPENAI_API_KEY=sk-...
supabase secrets set WINGPORT_JWT_SECRET=<your-32-byte-jwt-secret>
```

3. (Optional but recommended for Stripe-for-AI metering) Set the Supabase connection keys so the gateway can record usage and enforce per-user quotas:

```bash
supabase secrets set \
  WINGPORT_SUPABASE_URL=https://<project>.supabase.co \
  WINGPORT_SERVICE_ROLE_KEY=<service-role-key> \
  WINGPORT_ANON_KEY=<anon-key>
```

These are also auto-injected in Supabase Edge Functions as `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY`, but the `WINGPORT_*` overrides are useful for local Supabase emulator setups.

4. Run the database migration in `supabase/migrations/20250718160000_wingport_quotas_and_usage.sql` via the Supabase dashboard SQL editor or:

```bash
supabase db push
```

## Run

```bash
cd examples/demo_app
flutter pub get
flutter run --dart-define=SUPABASE_URL=$SUPABASE_URL --dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

## End-to-end test

1. Create a user in your Supabase project (Authentication → Users → Add user) or sign up in the app.
2. Sign in on the device/emulator.
3. Pick a model, type a prompt, and send. The response streams token by token.
4. The app bar shows remaining `minute / day` quota.
5. To test the interrupted state, process-kill the gateway mid-response. The UI shows **"Response interrupted — partial kept"** with the text received so far.
