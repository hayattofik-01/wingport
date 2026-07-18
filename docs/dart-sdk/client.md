---
title: Client
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Dart SDK — Client

## Construction

```dart
// From your existing Supabase client (recommended)
final wing = Wingport.supabase(Supabase.instance.client);

// Or explicitly, for custom setups
final wing = Wingport(
  endpoint: Uri.parse('https://xyz.supabase.co/functions/v1/wingport'),
  tokenProvider: () async => myAuth.currentAccessToken,
);
```

`Wingport` is cheap to construct and safe to keep as a singleton (Riverpod/Provider/GetIt all fine). It holds no mutable auth state — the token is read per-request from your auth client, so sign-out is automatically respected.

## Options

```dart
Wingport.supabase(
  client,
  options: WingportOptions(
    connectTimeout: Duration(seconds: 10),
    chunkTimeout: Duration(seconds: 30),   // max silence mid-stream
    maxRetries: 2,
    logger: (event) => debugPrint(event.toString()),
  ),
);
```
