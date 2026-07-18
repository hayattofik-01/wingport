import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:test/test.dart';
import 'package:wingport/wingport.dart';

class _ChunkedClient extends http.BaseClient {
  _ChunkedClient(this._chunks);

  final Stream<List<int>> _chunks;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    return http.StreamedResponse(_chunks, 200, headers: {
      'content-type': 'text/event-stream',
    });
  }
}

void main() {
  final endpoint = Uri.parse('http://localhost:8000/functions/v1/wingport');

  test('tolerates SSE frames fragmented across byte boundaries', () async {
    final event =
        'data: {"delta":"café"}\n\n'
        'data: {"done":true,"usage":{"inputTokens":1,"outputTokens":1,"totalTokens":2},"finishReason":"stop"}\n\n';
    final bytes = utf8.encode(event);
    final splitAt = bytes.indexOf(0xC3) + 1;
    final stream = Stream.fromIterable([
      bytes.sublist(0, splitAt),
      bytes.sublist(splitAt),
    ]);

    final wing = Wingport(
      endpoint: endpoint,
      tokenProvider: () async => 'token',
      client: _ChunkedClient(stream),
    );

    final chunks = await wing.stream(model: 'claude-sonnet', prompt: 'hi').toList();
    expect(chunks, hasLength(2));
    expect(chunks[0].delta, 'café');
    expect(chunks[1].done, isTrue);
  });

  test('raises a network error when no data arrives within the configured chunk timeout', () async {
    final controller = StreamController<List<int>>();
    final wing = Wingport(
      endpoint: endpoint,
      tokenProvider: () async => 'token',
      client: _ChunkedClient(controller.stream),
      options: const WingportOptions(chunkTimeout: Duration(milliseconds: 50)),
    );

    final errors = <Object>[];
    final completer = Completer<void>();
    wing.stream(model: 'claude-sonnet', prompt: 'hi').listen(
      (_) {},
      onError: (Object e) {
        errors.add(e);
        if (!completer.isCompleted) completer.complete();
      },
      onDone: () {
        if (!completer.isCompleted) completer.complete();
      },
    );

    await completer.future;
    expect(errors, hasLength(1));
    expect(errors.first, isA<NetworkException>());
    expect((errors.first as NetworkException).isTimeout, isTrue);
  });

  test('surfaces partial text and a StreamInterruptedException on mid-stream interruption', () async {
    final sseBody = utf8.encode(
      'data: {"delta":"partial "}\n\n'
      'data: {"error":{"code":"provider_error","message":"boom"}}\n\n',
    );
    final client = MockClient((_) async => http.Response.bytes(sseBody, 200));

    final wing = Wingport(
      endpoint: endpoint,
      tokenProvider: () async => 'token',
      client: client,
    );

    final errors = <WingportException>[];
    final chunks = <WingChunk>[];
    final completer = Completer<void>();
    wing.stream(model: 'claude-sonnet', prompt: 'hi').listen(
      chunks.add,
      onError: (Object e) {
        errors.add(e as WingportException);
        if (!completer.isCompleted) completer.complete();
      },
      onDone: () {
        if (!completer.isCompleted) completer.complete();
      },
    );

    await completer.future;
    expect(chunks[0].delta, 'partial ');
    expect(errors.any((e) => e is StreamInterruptedException), isTrue);
    final interrupted = errors.firstWhere((e) => e is StreamInterruptedException)
        as StreamInterruptedException;
    expect(interrupted.partialText, 'partial ');
  });
}
