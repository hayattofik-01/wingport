import 'package:test/test.dart';

/// Transport contract tests for the hardened SSE transport.
///
/// These are intentionally skipped in the basic transport and serve as the spec
/// for the hardened rewrite tracked in issue #1.
void main() {
  const skipReason = 'human-owned: see issue #1';

  group('transport contract', () {
    test(
      'tolerates SSE frames fragmented across byte boundaries',
      () {
        // The hardened transport must buffer and scan without requiring a full
        // event to arrive in one chunk.
      },
      skip: skipReason,
    );

    test(
      'raises a network error when no data arrives within the configured chunk timeout',
      () {
        // The hardened transport must bound inter-chunk silence.
      },
      skip: skipReason,
    );

    test(
      'surfaces partial text and a StreamInterruptedException on mid-stream interruption',
      () {
        // The hardened transport must preserve partialText on connection drop
        // and signal resumability correctly.
      },
      skip: skipReason,
    );
  });
}
