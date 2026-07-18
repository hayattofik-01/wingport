/// A single message in a Wingport request.
class WingMessage {
  final String role;
  final String content;

  const WingMessage({required this.role, required this.content});

  Map<String, dynamic> toJson() => {'role': role, 'content': content};
}

/// Usage returned by the gateway.
class WingUsage {
  final int inputTokens;
  final int outputTokens;
  final int totalTokens;

  const WingUsage({
    required this.inputTokens,
    required this.outputTokens,
    required this.totalTokens,
  });

  factory WingUsage.fromJson(Map<String, dynamic> json) {
    return WingUsage(
      inputTokens: (json['inputTokens'] as num).toInt(),
      outputTokens: (json['outputTokens'] as num).toInt(),
      totalTokens: (json['totalTokens'] as num).toInt(),
    );
  }
}

/// Non-streaming response.
class WingResult {
  final String text;
  final WingUsage usage;
  final String provider;
  final String finishReason;

  const WingResult({
    required this.text,
    required this.usage,
    required this.provider,
    required this.finishReason,
  });

  factory WingResult.fromJson(Map<String, dynamic> json) {
    return WingResult(
      text: json['text'] as String,
      usage: WingUsage.fromJson(json['usage'] as Map<String, dynamic>),
      provider: json['provider'] as String,
      finishReason: json['finishReason'] as String,
    );
  }
}

/// A chunk emitted by [Wingport.stream].
class WingChunk {
  final String? delta;
  final bool done;
  final WingUsage? usage;
  final String? finishReason;

  const WingChunk({
    this.delta,
    this.done = false,
    this.usage,
    this.finishReason,
  });

  factory WingChunk.delta(String text) => WingChunk(delta: text);

  factory WingChunk.done(WingUsage usage, String finishReason) => WingChunk(
    done: true,
    usage: usage,
    finishReason: finishReason,
  );
}

/// Quota returned by [Wingport.quota].
class WingQuota {
  final int requestsRemaining;
  final int tokensRemaining;
  final DateTime resetsAt;

  const WingQuota({
    required this.requestsRemaining,
    required this.tokensRemaining,
    required this.resetsAt,
  });

  factory WingQuota.fromJson(Map<String, dynamic> json) {
    return WingQuota(
      requestsRemaining: (json['requestsRemaining'] as num?)?.toInt() ?? 0,
      tokensRemaining: (json['tokensRemaining'] as num?)?.toInt() ?? 0,
      resetsAt: DateTime.tryParse(json['resetsAt'] as String? ?? '') ??
          DateTime.now().toUtc().add(const Duration(days: 1)),
    );
  }
}

/// SDK options.
class WingportOptions {
  final Duration connectTimeout;
  final Duration chunkTimeout;
  final int maxRetries;
  final Map<String, String>? headers;
  final void Function(String)? logger;

  const WingportOptions({
    this.connectTimeout = const Duration(seconds: 10),
    this.chunkTimeout = const Duration(seconds: 30),
    this.maxRetries = 2,
    this.headers,
    this.logger,
  });
}

/// Token that can be used to cancel an in-flight request.
class CancellationToken {
  bool _cancelled = false;

  bool get isCancelled => _cancelled;

  void cancel() => _cancelled = true;
}
