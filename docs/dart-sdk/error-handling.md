---
title: Error Handling
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Error Handling

All failures throw subclasses of the sealed `WingportException`, so a `switch` is checked by the compiler:

```dart
sealed class WingportException implements Exception {}

class NetworkException extends WingportException {
  final bool isTimeout;
}

class AuthException extends WingportException {
  final AuthFailure reason;   // expired | invalid | missing
}

class QuotaExceededException extends WingportException {
  final String limitType;     // requestsPerDay | tokensPerDay | requestsPerMinute
  final int limit;
  final int used;
  final DateTime resetsAt;
}

class ModelNotAllowedException extends WingportException {
  final String requestedModel;
}

class ProviderException extends WingportException {
  final int statusCode;
  final bool wasFallbackAttempted;
  final bool retryable;
}

class StreamInterruptedException extends WingportException {
  final String partialText;   // everything received before the drop
  final bool resumable;
}

class RequestCancelledException extends WingportException {}
```

Design intent: **every branch maps to a distinct UI decision.** Quota → show upgrade prompt. Network → show retry. Auth → re-login. Interrupted → keep partial text, offer continue. If two errors would lead you to the same UI, they're the same type.
