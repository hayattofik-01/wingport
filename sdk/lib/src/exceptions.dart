sealed class WingportException implements Exception {}

class NetworkException extends WingportException {
  final bool isTimeout;

  NetworkException({required this.isTimeout});

  @override
  String toString() => 'NetworkException(isTimeout: $isTimeout)';
}

enum AuthFailure { expired, invalid, missing }

class AuthException extends WingportException {
  final AuthFailure reason;

  AuthException({required this.reason});

  @override
  String toString() => 'AuthException(reason: $reason)';
}

class QuotaExceededException extends WingportException {
  final String limitType;
  final int limit;
  final int used;
  final DateTime resetsAt;

  QuotaExceededException({
    required this.limitType,
    required this.limit,
    required this.used,
    required this.resetsAt,
  });

  @override
  String toString() =>
      'QuotaExceededException(limitType: $limitType, limit: $limit, used: $used)';
}

class ModelNotAllowedException extends WingportException {
  final String requestedModel;

  ModelNotAllowedException({required this.requestedModel});

  @override
  String toString() => 'ModelNotAllowedException(requestedModel: $requestedModel)';
}

class ProviderException extends WingportException {
  final int statusCode;
  final bool wasFallbackAttempted;
  final bool retryable;

  ProviderException({
    required this.statusCode,
    required this.wasFallbackAttempted,
    required this.retryable,
  });

  @override
  String toString() =>
      'ProviderException(statusCode: $statusCode, retryable: $retryable)';
}

class StreamInterruptedException extends WingportException {
  final String partialText;
  final bool resumable;

  StreamInterruptedException({required this.partialText, this.resumable = false});

  @override
  String toString() =>
      'StreamInterruptedException(partialText: $partialText, resumable: $resumable)';
}

class RequestCancelledException extends WingportException {
  @override
  String toString() => 'RequestCancelledException()';
}
