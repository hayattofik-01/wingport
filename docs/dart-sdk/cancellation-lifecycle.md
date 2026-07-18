---
title: Dart SDK — Cancellation & Lifecycle
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Cancellation & Lifecycle

## Cancel a generation

```dart
final cancel = CancellationToken();

final future = wing.generate(
  model: 'claude-sonnet',
  prompt: prompt,
  cancel: cancel,
);

// User taps stop:
cancel.cancel();
```

Cancelling a `stream()` subscription (`sub.cancel()`) also aborts the underlying request — the gateway closes the provider connection, so you stop paying for tokens the instant the user stops reading.

## App lifecycle

On `AppLifecycleState.paused`, in-flight streams are cancelled and surfaced as `StreamInterruptedException(resumable: ...)`. Pair with your state management to offer "continue generating" on resume.

---
