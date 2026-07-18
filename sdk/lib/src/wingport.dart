import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;
import 'package:supabase/supabase.dart' hide AuthException;

import 'exceptions.dart';
import 'models.dart';
import 'sse.dart';

/// Basic transport — hardened transport tracked in issue #1.
///
/// Uses [http.Client].send() with a streamed response, buffers and scans SSE
/// frames, and maps them to [WingChunk].
class Wingport {
  final Uri endpoint;
  final Future<String?> Function() _tokenProvider;
  final WingportOptions _options;
  final http.Client? _client;

  Wingport({
    required this.endpoint,
    required Future<String?> Function() tokenProvider,
    WingportOptions? options,
    http.Client? client,
  }) : _tokenProvider = tokenProvider,
       _options = options ?? const WingportOptions(),
       _client = client;

  /// Creates a Wingport client from a [SupabaseClient].
  ///
  /// The gateway endpoint is derived from the Supabase Functions URL and tokens
  /// are read from `supabase.auth.currentSession.accessToken` on every request.
  factory Wingport.supabase(
    SupabaseClient client, {
    WingportOptions? options,
    http.Client? httpClient,
  }) {
    // Derive the Functions URL from the public PostgREST URL.
    final functionsUrl = client.rest.url.replaceAll('/rest/v1', '/functions/v1');
    final endpoint = Uri.parse('$functionsUrl/wingport');
    return Wingport(
      endpoint: endpoint,
      tokenProvider: () async => client.auth.currentSession?.accessToken,
      options: options,
      client: httpClient,
    );
  }

  /// Sends a non-streaming generate request.
  Future<WingResult> generate({
    required String model,
    String? prompt,
    List<WingMessage>? messages,
    double? temperature,
    int? maxTokens,
    CancellationToken? cancel,
  }) async {
    final body = _buildBody(
      model: model,
      prompt: prompt,
      messages: messages,
      temperature: temperature,
      maxTokens: maxTokens,
    );

    return _withRetry(() async {
      final response = await _postJson('/v1/generate', body, cancel: cancel);
      final json = jsonDecode(response) as Map<String, dynamic>;
      if (json.containsKey('error')) {
        throw _mapWireError(json['error'] as Map<String, dynamic>);
      }
      return WingResult.fromJson(json);
    });
  }

  /// Streams a generate request.
  Stream<WingChunk> stream({
    required String model,
    String? prompt,
    List<WingMessage>? messages,
    double? temperature,
    int? maxTokens,
    CancellationToken? cancel,
  }) {
    final body = _buildBody(
      model: model,
      prompt: prompt,
      messages: messages,
      temperature: temperature,
      maxTokens: maxTokens,
    );

    final controller = StreamController<WingChunk>(
      onCancel: () {
        cancel?.cancel();
      },
    );

    _streamRequest(controller, body, cancel: cancel);

    return controller.stream;
  }

  Future<void> _streamRequest(
    StreamController<WingChunk> controller,
    Map<String, dynamic> body, {
    CancellationToken? cancel,
  }) async {
    final ownsClient = _client == null;
    final client = _client ?? http.Client();
    final request = http.Request('POST', _buildUri('/v1/stream'))
      ..headers.addAll(await _headers())
      ..body = jsonEncode(body);

    http.StreamedResponse? response;
    try {
      if (cancel?.isCancelled ?? false) {
        throw RequestCancelledException();
      }

      response = await client.send(request).timeout(_options.timeout);

      if (response.statusCode != 200) {
        final bodyString = await response.stream.bytesToString();
        final json = _tryDecode(bodyString);
        throw _mapWireError(
          json?['error'] as Map<String, dynamic>? ??
              {'code': 'provider_error', 'message': 'HTTP ${response.statusCode}'},
          statusCode: response.statusCode,
        );
      }

      final parser = SseParser();
      final partialBuffer = StringBuffer();
      StreamSubscription<String>? subscription;

      void dispose() {
        subscription?.cancel();
        if (ownsClient) client.close();
      }

      // utf8.decoder preserves partial multi-byte characters across chunks.
      final decodedStream = response.stream.transform(utf8.decoder);

      subscription = decodedStream.listen(
        (decoded) {
          if (cancel?.isCancelled ?? false) {
            dispose();
            controller.addError(RequestCancelledException());
            if (!controller.isClosed) controller.close();
            return;
          }

          parser.append(decoded);

          for (final event in parser.events()) {
            if (event.isEmpty) continue;
            final data = _tryDecode(event.data);
            if (data == null) continue;

            if (data case {'delta': final String text}) {
              partialBuffer.write(text);
              controller.add(WingChunk.delta(text));
            } else if (data case {'done': true}) {
              final usageJson = data['usage'] as Map<String, dynamic>?;
              final finishReason = data['finishReason'] as String?;
              controller.add(
                WingChunk.done(
                  usageJson == null
                      ? const WingUsage(
                          inputTokens: 0,
                          outputTokens: 0,
                          totalTokens: 0,
                        )
                      : WingUsage.fromJson(usageJson),
                  finishReason ?? 'stop',
                ),
              );
              dispose();
              controller.close();
              return;
            } else if (data case {'error': final Map<String, dynamic> err}) {
              dispose();
              controller.addError(
                StreamInterruptedException(
                  partialText: partialBuffer.toString(),
                  resumable: false,
                ),
              );
              controller.addError(_mapWireError(err, statusCode: response?.statusCode ?? 502));
              if (!controller.isClosed) controller.close();
              return;
            }
          }
        },
        onError: (Object err) {
          dispose();
          final exception = _mapStreamError(err, partialBuffer.toString());
          controller.addError(exception);
          if (!controller.isClosed) controller.close();
        },
        onDone: () {
          dispose();
          if (!controller.isClosed) {
            controller.addError(
              StreamInterruptedException(
                partialText: partialBuffer.toString(),
                resumable: false,
              ),
            );
            controller.close();
          }
        },
        cancelOnError: false,
      );
    } catch (err) {
      if (ownsClient) client.close();
      if (!controller.isClosed) {
        controller.addError(_mapError(err));
        controller.close();
      }
    }
  }

  /// Returns quota information.
  ///
  /// Stub: quotas are not yet supported in this version.
  Future<WingQuota> quota() async {
    throw UnimplementedError('Quotas are not yet supported');
  }

  Map<String, dynamic> _buildBody({
    required String model,
    String? prompt,
    List<WingMessage>? messages,
    double? temperature,
    int? maxTokens,
  }) {
    final body = <String, dynamic>{'model': model};
    if (messages != null && messages.isNotEmpty) {
      body['messages'] = messages.map((m) => m.toJson()).toList();
    } else if (prompt != null) {
      body['prompt'] = prompt;
    }
    if (temperature != null) body['temperature'] = temperature;
    if (maxTokens != null) body['maxTokens'] = maxTokens;
    return body;
  }

  Uri _buildUri(String path) {
    final basePath = endpoint.path.replaceAll(RegExp(r'/+$'), '');
    final route = path.startsWith('/') ? path : '/$path';
    return endpoint.replace(path: '$basePath$route');
  }

  Future<String> _postJson(
    String path,
    Map<String, dynamic> body, {
    CancellationToken? cancel,
  }) async {
    if (cancel?.isCancelled ?? false) {
      throw RequestCancelledException();
    }
    final client = _client ?? http.Client();
    try {
      final token = await _tokenProvider();
      final headers = <String, String>{
        'Content-Type': 'application/json',
        if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
        if (_options.headers != null) ..._options.headers!,
      };

      final response = await client
          .post(
            _buildUri(path),
            headers: headers,
            body: jsonEncode(body),
          )
          .timeout(_options.timeout);

      return response.body;
    } finally {
      if (_client == null) client.close();
    }
  }

  Future<Map<String, String>> _headers() async {
    final token = await _tokenProvider();
    return <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
      if (_options.headers != null) ..._options.headers!,
    };
  }

  Future<T> _withRetry<T>(Future<T> Function() fn) async {
    var lastError = Object();
    final maxRetries = _options.maxRetries;
    for (var attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } on WingportException catch (err) {
        if (err is NetworkException || (err is ProviderException && err.retryable)) {
          if (attempt == maxRetries) rethrow;
          lastError = err;
          await _backoff(attempt);
          continue;
        }
        rethrow;
      } on TimeoutException {
        if (attempt == maxRetries) {
          throw NetworkException(isTimeout: true);
        }
        await _backoff(attempt);
        continue;
      } on http.ClientException {
        if (attempt == maxRetries) {
          throw NetworkException(isTimeout: false);
        }
        await _backoff(attempt);
        continue;
      }
    }
    throw lastError;
  }

  Future<void> _backoff(int attempt) async {
    final delay = Duration(
      milliseconds: (100 * (1 << attempt)) + _random.nextInt(100),
    );
    await Future<void>.delayed(delay);
  }

  WingportException _mapWireError(
    Map<String, dynamic> error, {
    int? statusCode,
  }) {
    final code = error['code'] as String? ?? 'provider_error';

    switch (code) {
      case 'unauthorized':
        return AuthException(reason: AuthFailure.invalid);
      case 'model_not_allowed':
        return ModelNotAllowedException(
          requestedModel: error['requestedModel'] as String? ?? 'unknown',
        );
      case 'quota_exceeded':
        return QuotaExceededException(
          limitType: error['limitType'] as String? ?? 'unknown',
          limit: (error['limit'] as num?)?.toInt() ?? 0,
          used: (error['used'] as num?)?.toInt() ?? 0,
          resetsAt: DateTime.tryParse(error['resetsAt'] as String? ?? '') ??
              DateTime.now().add(const Duration(hours: 1)),
        );
      case 'provider_error':
      case 'bad_request':
      default:
        final sc = statusCode ?? 502;
        return ProviderException(
          statusCode: sc,
          wasFallbackAttempted: false,
          retryable: sc == 429 || sc >= 500,
        );
    }
  }

  WingportException _mapStreamError(Object err, String partialText) {
    if (err is RequestCancelledException) return err;
    if (err is TimeoutException || err is http.ClientException) {
      return NetworkException(isTimeout: err is TimeoutException);
    }
    if (err is WingportException) return err;
    return StreamInterruptedException(partialText: partialText, resumable: false);
  }

  WingportException _mapError(Object err) {
    if (err is RequestCancelledException) return err;
    if (err is TimeoutException) return NetworkException(isTimeout: true);
    if (err is FormatException) {
      return ProviderException(
        statusCode: 200,
        wasFallbackAttempted: false,
        retryable: false,
      );
    }
    if (err is WingportException) return err;
    return NetworkException(isTimeout: false);
  }

  Map<String, dynamic>? _tryDecode(String body) {
    try {
      return jsonDecode(body) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }
}

final _random = Random.secure();
