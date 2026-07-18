---
title: Dart SDK — Streaming
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Streaming

```dart
Stream<WingChunk> stream({
  required String model,
  String? prompt,
  List<WingMessage>? messages,
  double? temperature,
  int? maxTokens,
  CancellationToken? cancel,
});
```

`WingChunk` carries `text` (the delta) and, on the final chunk, `usage` and `finishReason`.

### With a StreamBuilder

```dart
StreamBuilder<WingChunk>(
  stream: wing.stream(model: 'claude-sonnet', prompt: question),
  builder: (context, snapshot) { ... },
)
```

### Accumulating into state

```dart
final sub = wing
    .stream(model: 'claude-sonnet', messages: history)
    .listen(
      (chunk) => setState(() => reply += chunk.text),
      onError: (e) => handleWingportError(e),
      onDone: () => setState(() => generating = false),
    );
```

---
