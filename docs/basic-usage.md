---
title: Basic Usage
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Basic Usage

## Generate text

For a single, complete response:

```dart
final result = await wing.generate(
  model: 'claude-sonnet',
  prompt: 'Write a haiku about Flutter',
);

print(result.text);
print(result.usage.totalTokens);
```

## Stream text

For token-by-token streaming into your UI:

```dart
final buffer = StringBuffer();

await for (final chunk in wing.stream(
  model: 'claude-sonnet',
  prompt: 'Explain quantum computing simply',
)) {
  buffer.write(chunk.text);
  setState(() => reply = buffer.toString());
}
```

## Multi-turn conversations

Pass a message list instead of a prompt:

```dart
final result = await wing.generate(
  model: 'claude-sonnet',
  messages: [
    WingMessage.system('You are a helpful cooking assistant.'),
    WingMessage.user('What can I make with eggs and rice?'),
    WingMessage.assistant('Egg fried rice is the classic choice...'),
    WingMessage.user('I also have kimchi'),
  ],
);
```

## Switch models with a string

Because providers are configured server-side, model switching requires no client changes and no new keys:

```dart
wing.generate(model: 'claude-sonnet', prompt: prompt);   // Anthropic
wing.generate(model: 'gpt-5-mini', prompt: prompt);      // OpenAI
```

Only models you listed in `wingport.config.ts` are callable. Requests for unlisted models are rejected by the gateway — the client can't escalate its own access.

## Handle the failure modes

Every Wingport call can throw a `WingportException`. The hierarchy is sealed, so `switch` is exhaustive:

```dart
try {
  final result = await wing.generate(model: 'claude-sonnet', prompt: prompt);
} on WingportException catch (e) {
  final message = switch (e) {
    QuotaExceededException() => 'Daily limit reached — resets at midnight.',
    NetworkException()       => 'Connection lost. Check your network.',
    AuthException()          => 'Please sign in again.',
    ProviderException()      => 'The AI service is having issues. Try again.',
    _                        => 'Something went wrong.',
  };
  showSnackBar(message);
}
```

See [Error Handling](/dart-sdk/error-handling) for the full hierarchy.
