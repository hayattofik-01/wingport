# Wingport Demo App

A minimal Flutter chat screen that streams AI responses through a Wingport gateway deployed to your Supabase project.

## Configure

Create or edit `assets/.env` (or pass `--dart-define`) with:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

## Run

```bash
cd examples/demo_app
flutter pub get
flutter run --dart-define=SUPABASE_URL=$SUPABASE_URL --dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

## End-to-end test

1. Deploy the gateway from `/gateway` to your Supabase project.
2. Set `ANTHROPIC_API_KEY` as a Supabase secret.
3. Sign in to the demo app with Supabase Auth (or configure anonymous access in the gateway).
4. Type a prompt and send. The response streams token by token.
5. To test the interrupted state, process-kill the gateway mid-response. The UI shows **"Response interrupted — partial kept"** with the text received so far.
