---
title: Generating Text
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Generating Text

```dart
Future<WingResult> generate({
  required String model,
  String? prompt,                 // shorthand for a single user message
  List<WingMessage>? messages,    // full conversation
  double? temperature,
  int? maxTokens,
  Map<String, Object?>? providerOptions,
  CancellationToken? cancel,
});
```

`WingResult`:

```dart
class WingResult {
  final String text;
  final WingUsage usage;        // inputTokens, outputTokens, totalTokens
  final String modelAlias;
  final String providerUsed;    // which provider actually served it
  final String finishReason;    // stop | length | error
}
```
