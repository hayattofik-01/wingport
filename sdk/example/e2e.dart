import 'dart:io';

import 'package:wingport/wingport.dart';

// End-to-end streaming test against a deployed Wingport gateway.
//
// Usage:
//   WINGPORT_TOKEN=<jwt> \
//   WINGPORT_PROJECT=<project-ref> \
//   dart run example/e2e.dart
//
// Or set WINGPORT_ENDPOINT explicitly instead of WINGPORT_PROJECT.

void main() async {
  final token = Platform.environment['WINGPORT_TOKEN'] ?? '';
  final project = Platform.environment['WINGPORT_PROJECT'] ?? '';
  final explicitEndpoint = Platform.environment['WINGPORT_ENDPOINT'] ?? '';
  final model = Platform.environment['WINGPORT_MODEL'] ?? 'gpt-4o';
  final prompt = Platform.environment['WINGPORT_PROMPT'] ??
      'Say hello briefly, then stop.';

  if (token.isEmpty) {
    stderr.writeln('Set WINGPORT_TOKEN to a valid Supabase JWT.');
    exitCode = 1;
    return;
  }

  final endpoint = explicitEndpoint.isNotEmpty
      ? Uri.parse(explicitEndpoint)
      : Uri.parse('https://$project.supabase.co/functions/v1/wingport');

  final wingport = Wingport(
    endpoint: endpoint,
    tokenProvider: () async => token,
  );

  try {
    stderr.writeln('Streaming from $endpoint with model $model...');
    final chunks = <WingChunk>[];
    await for (final chunk in wingport.stream(model: model, prompt: prompt)) {
      chunks.add(chunk);
      if (chunk.done) {
        stderr.writeln('\n[done] usage=${chunk.usage}');
      } else if (chunk.delta != null) {
        stdout.write(chunk.delta);
      }
    }
    stderr.writeln('Received ${chunks.length} chunk(s).');
  } on WingportException catch (e) {
    stderr.writeln('WingportException: $e');
    exitCode = 1;
  } catch (e, st) {
    stderr.writeln('Unexpected error: $e\n$st');
    exitCode = 1;
  }
}
