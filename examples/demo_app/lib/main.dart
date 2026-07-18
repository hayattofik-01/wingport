import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:wingport/wingport.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: const String.fromEnvironment('SUPABASE_URL'),
    anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
  );
  runApp(const WingportDemoApp());
}

class WingportDemoApp extends StatelessWidget {
  const WingportDemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Wingport Demo',
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF3DDC97),
          brightness: Brightness.dark,
        ),
      ),
      home: const ChatScreen(),
    );
  }
}

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  static const _models = ['claude-sonnet'];

  final _textController = TextEditingController();
  final _wing = Wingport.supabase(Supabase.instance.client);

  String _model = _models.first;
  String _response = '';
  bool _streaming = false;
  String _partialOnInterrupt = '';
  WingportException? _error;
  CancellationToken? _cancelToken;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final prompt = _textController.text.trim();
    if (prompt.isEmpty || _streaming) return;

    _cancelToken = CancellationToken();

    setState(() {
      _response = '';
      _partialOnInterrupt = '';
      _error = null;
      _streaming = true;
    });

    try {
      await for (final chunk in _wing.stream(
        model: _model,
        prompt: prompt,
        cancel: _cancelToken,
      )) {
        setState(() {
          if (chunk.done) {
            _streaming = false;
          } else if (chunk.delta case final text?) {
            _response += text;
          }
        });
      }
    } on StreamInterruptedException catch (e) {
      setState(() {
        _streaming = false;
        _partialOnInterrupt = e.partialText;
      });
    } on WingportException catch (e) {
      setState(() {
        _streaming = false;
        _error = e;
      });
    } finally {
      _cancelToken = null;
    }
  }

  void _cancel() {
    _cancelToken?.cancel();
  }

  String _errorMessage(WingportException e) {
    switch (e) {
      case NetworkException _:
        return 'Network error (timeout: ${e.isTimeout})';
      case AuthException _:
        return 'Auth error: ${e.reason}';
      case QuotaExceededException _:
        return 'Quota exceeded (${e.limitType})';
      case ModelNotAllowedException _:
        return 'Model "${e.requestedModel}" is not allowed';
      case ProviderException _:
        return 'Provider error (HTTP ${e.statusCode})';
      case RequestCancelledException _:
        return 'Request cancelled';
      default:
        return 'Unexpected error';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wingport Demo')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            DropdownButtonFormField<String>(
              value: _model,
              decoration: const InputDecoration(labelText: 'Model'),
              items: _models
                  .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                  .toList(),
              onChanged: _streaming ? null : (v) => setState(() => _model = v!),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _textController,
              decoration: const InputDecoration(
                hintText: 'Prompt…',
                border: OutlineInputBorder(),
              ),
              maxLines: null,
              enabled: !_streaming,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                ElevatedButton(
                  onPressed: _streaming ? null : _send,
                  child: const Text('Send'),
                ),
                const SizedBox(width: 12),
                if (_streaming)
                  OutlinedButton(
                    onPressed: _cancel,
                    child: const Text('Cancel'),
                  ),
              ],
            ),
            const SizedBox(height: 24),
            if (_error case final err?)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade900,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_errorMessage(err)),
              ),
            if (_partialOnInterrupt.isNotEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade900,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Response interrupted — partial kept:',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(_partialOnInterrupt),
                  ],
                ),
              ),
            const Text('Response', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1C2128),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: SingleChildScrollView(
                  child: Text(_response.isEmpty ? '…' : _response),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
