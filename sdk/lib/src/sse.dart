import 'dart:convert';

/// One parsed SSE event.
class SseEvent {
  final String? event;
  final String data;

  const SseEvent({this.event, required this.data});

  bool get isEmpty => data.isEmpty;
}

/// Buffer-and-scan SSE parser. Tolerates frames fragmented across chunks and
/// split mid-UTF-8-character when fed by a [Utf8Decoder] stream.
class SseParser {
  final StringBuffer _buffer = StringBuffer();

  void append(String chunk) => _buffer.write(chunk);

  List<SseEvent> events() {
    final raw = _buffer.toString();
    final events = <SseEvent>[];
    var start = 0;

    while (true) {
      final boundary = raw.indexOf('\n\n', start);
      if (boundary == -1) break;
      final slice = raw.substring(start, boundary);
      start = boundary + 2;
      final parsed = _parseEvent(slice);
      if (parsed != null) events.add(parsed);
    }

    // Keep any trailing partial event in the buffer.
    if (start > 0) {
      _buffer.clear();
      _buffer.write(raw.substring(start));
    }

    return events;
  }

  SseEvent? _parseEvent(String raw) {
    final lines = raw.split('\n');
    String? event;
    final dataLines = <String>[];

    for (final line in lines) {
      if (line.startsWith('event:')) {
        event = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        final rest = line.substring(5);
        dataLines.add(rest.startsWith(' ') ? rest.substring(1) : rest);
      }
      // Unknown fields and comments are ignored.
    }

    if (dataLines.isEmpty) return null;
    return SseEvent(event: event, data: dataLines.join('\n'));
  }
}

/// Encodes a Dart object as an SSE data line.
String encodeSSE(Object? data) => 'data: ${jsonEncode(data)}\n\n';
