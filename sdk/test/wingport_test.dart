import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:test/test.dart';
import 'package:wingport/wingport.dart';

http.Client _mockClient(http.Response Function(http.Request) handler) {
  return MockClient((request) async => handler(request));
}

void main() {
  final endpoint = Uri.parse('http://localhost:8000/functions/v1/wingport');

  test('generate returns a parsed result', () async {
    final client = _mockClient((req) {
      expect(req.headers['Authorization'], 'Bearer token-123');
      final body = jsonDecode(req.body) as Map<String, dynamic>;
      expect(body['model'], 'claude-sonnet');
      expect(body['prompt'], 'hi');
      return http.Response(
        jsonEncode({
          'text': 'Hello!',
          'usage': {'inputTokens': 1, 'outputTokens': 2, 'totalTokens': 3},
          'provider': 'anthropic',
          'finishReason': 'stop',
        }),
        200,
      );
    });

    final wing = Wingport(
      endpoint: endpoint,
      tokenProvider: () async => 'token-123',
      client: client,
    );

    final result = await wing.generate(model: 'claude-sonnet', prompt: 'hi');
    expect(result.text, 'Hello!');
    expect(result.usage.totalTokens, 3);
    expect(result.provider, 'anthropic');
  });

  test('generate maps unauthorized to AuthException', () async {
    final client = _mockClient((_) => http.Response(
      jsonEncode({'error': {'code': 'unauthorized', 'message': 'bad token'}}),
      401,
    ));

    final wing = Wingport(
      endpoint: endpoint,
      tokenProvider: () async => 'token',
      client: client,
    );

    expect(
      wing.generate(model: 'claude-sonnet', prompt: 'hi'),
      throwsA(isA<AuthException>()),
    );
  });

  test('generate maps model_not_allowed to ModelNotAllowedException', () async {
    final client = _mockClient((_) => http.Response(
      jsonEncode({
        'error': {'code': 'model_not_allowed', 'message': 'not allowed'},
      }),
      403,
    ));

    final wing = Wingport(
      endpoint: endpoint,
      tokenProvider: () async => 'token',
      client: client,
    );

    expect(
      wing.generate(model: 'bad-model', prompt: 'hi'),
      throwsA(isA<ModelNotAllowedException>()),
    );
  });

  test('generate maps quota_exceeded to QuotaExceededException', () async {
    final client = _mockClient((_) => http.Response(
      jsonEncode({
        'error': {
          'code': 'quota_exceeded',
          'message': 'daily limit hit',
          'retryAfter': 3600,
        },
      }),
      429,
    ));

    final wing = Wingport(
      endpoint: endpoint,
      tokenProvider: () async => 'token',
      client: client,
    );

    expect(
      wing.generate(model: 'claude-sonnet', prompt: 'hi'),
      throwsA(isA<QuotaExceededException>()),
    );
  });

  test('generate retries on 502 and succeeds', () async {
    var calls = 0;
    final client = _mockClient((_) {
      calls++;
      if (calls < 2) {
        return http.Response(
          jsonEncode({'error': {'code': 'provider_error', 'message': 'boom'}}),
          502,
        );
      }
      return http.Response(
        jsonEncode({
          'text': 'ok',
          'usage': {'inputTokens': 1, 'outputTokens': 1, 'totalTokens': 2},
          'provider': 'anthropic',
          'finishReason': 'stop',
        }),
        200,
      );
    });

    final wing = Wingport(
      endpoint: endpoint,
      tokenProvider: () async => 'token',
      client: client,
    );

    final result = await wing.generate(model: 'claude-sonnet', prompt: 'hi');
    expect(result.text, 'ok');
    expect(calls, 2);
  });

  test('stream yields deltas and a done chunk', () async {
    final sseBody = utf8.encode(
      'data: {"delta":"Hel"}\n\n'
      'data: {"delta":"lo"}\n\n'
      'data: {"done":true,"usage":{"inputTokens":1,"outputTokens":2,"totalTokens":3},"finishReason":"stop"}\n\n',
    );
    final client = _mockClient((req) {
      expect(req.headers['Authorization'], 'Bearer token-123');
      return http.Response.bytes(sseBody, 200);
    });

    final wing = Wingport(
      endpoint: endpoint,
      tokenProvider: () async => 'token-123',
      client: client,
    );

    final chunks = await wing.stream(model: 'claude-sonnet', prompt: 'hi').toList();
    expect(chunks, hasLength(3));
    expect(chunks[0].delta, 'Hel');
    expect(chunks[1].delta, 'lo');
    expect(chunks[2].done, true);
    expect(chunks[2].usage?.totalTokens, 3);
  });

  test('stream emits error event as StreamInterruptedException with partial text', () async {
    final sseBody = utf8.encode(
      'data: {"delta":"partial "}\n\n'
      'data: {"error":{"code":"provider_error","message":"boom"}}\n\n',
    );
    final client = _mockClient((_) => http.Response.bytes(sseBody, 200));

    final wing = Wingport(
      endpoint: endpoint,
      tokenProvider: () async => 'token',
      client: client,
    );

    final errors = <WingportException>[];
    final chunks = <WingChunk>[];
    final completer = Completer<void>();
    wing
        .stream(model: 'claude-sonnet', prompt: 'hi')
        .listen(
          chunks.add,
          onError: errors.add,
          onDone: completer.complete,
          cancelOnError: false,
        );
    await completer.future;

    expect(chunks[0].delta, 'partial ');
    expect(errors.any((e) => e is StreamInterruptedException), isTrue);
    final interrupted = errors.firstWhere((e) => e is StreamInterruptedException)
        as StreamInterruptedException;
    expect(interrupted.partialText, 'partial ');
  });

  test('quota is not yet supported', () async {
    final wing = Wingport(
      endpoint: endpoint,
      tokenProvider: () async => 'token',
    );

    expect(wing.quota(), throwsA(isA<UnimplementedError>()));
  });
}
