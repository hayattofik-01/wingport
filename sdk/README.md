# Wingport Dart SDK

Dart package published as `wingport`. Implements the client, exceptions, and models per the wire spec.

## Install

```bash
cd sdk
dart pub get
```

## Test

```bash
dart analyze
dart test
```

Transport-contract edge cases (fragmentation, chunk timeout, interruption with partial text) are covered by `test/transport_contract_test.dart`. Device-dependent cases (network handoff, backgrounding) are deferred to the hardened transport tracked in issue #7.

## Usage

```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:wingport/wingport.dart';

final wing = Wingport.supabase(Supabase.instance.client);

// Non-streaming
final result = await wing.generate(
  model: 'claude-sonnet',
  prompt: 'Write a one-sentence pitch for a Flutter AI app.',
);
print(result.text);

// Streaming
await for (final chunk in wing.stream(
  model: 'claude-sonnet',
  prompt: 'Write a one-sentence pitch for a Flutter AI app.',
)) {
  if (chunk.done) {
    print('Finished. Total tokens: ${chunk.usage?.totalTokens}');
  } else if (chunk.delta case final text?) {
    stdout.write(text);
  }
}
```

The explicit constructor is available when you manage the endpoint and token yourself:

```dart
final wing = Wingport(
  endpoint: Uri.parse('https://<project>.supabase.co/functions/v1/wingport'),
  tokenProvider: () async => myAuthToken,
);
```

## Transport

`stream()` uses `http.Client().send()` with a buffer-and-scan SSE parser. It maps wire-format `data:` events to `WingChunk`. Mid-stream errors or connection drops become `StreamInterruptedException` with `partialText` preserved.

Use `WingportOptions` to configure `connectTimeout`, `chunkTimeout`, `maxRetries`, and a logger.
