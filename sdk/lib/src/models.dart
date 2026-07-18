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
  final String userId;
  final String tier;
  final int limitMinute;
  final int limitDay;
  final int usedMinute;
  final int usedDay;
  final int remainingMinute;
  final int remainingDay;

  const WingQuota({
    required this.userId,
    required this.tier,
    required this.limitMinute,
    required this.limitDay,
    required this.usedMinute,
    required this.usedDay,
    required this.remainingMinute,
    required this.remainingDay,
  });

  factory WingQuota.fromJson(Map<String, dynamic> json) {
    return WingQuota(
      userId: json['userId'] as String? ?? json['user_id'] as String? ?? '',
      tier: json['tier'] as String? ?? 'free',
      limitMinute: (json['limitMinute'] as num? ?? json['limit_minute'] as num?)?.toInt() ?? 0,
      limitDay: (json['limitDay'] as num? ?? json['limit_day'] as num?)?.toInt() ?? 0,
      usedMinute: (json['usedMinute'] as num? ?? json['used_minute'] as num?)?.toInt() ?? 0,
      usedDay: (json['usedDay'] as num? ?? json['used_day'] as num?)?.toInt() ?? 0,
      remainingMinute: (json['remainingMinute'] as num? ?? json['remaining_minute'] as num?)?.toInt() ?? 0,
      remainingDay: (json['remainingDay'] as num? ?? json['remaining_day'] as num?)?.toInt() ?? 0,
    );
  }
}

/// SDK options.
class WingportOptions {
  final int maxRetries;
  final Duration timeout;
  final Map<String, String>? headers;

  const WingportOptions({
    this.maxRetries = 3,
    this.timeout = const Duration(seconds: 30),
    this.headers,
  });
}

/// Token that can be used to cancel an in-flight request.
class CancellationToken {
  bool _cancelled = false;

  bool get isCancelled => _cancelled;

  void cancel() => _cancelled = true;
}
