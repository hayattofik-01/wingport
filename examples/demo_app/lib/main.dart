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
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        final session = Supabase.instance.client.auth.currentSession;
        if (session == null) {
          return const SignInScreen();
        }
        return const ChatScreen();
      },
    );
  }
}

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _signIn() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await Supabase.instance.client.auth.signInWithPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wingport Demo — Sign in')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Sign in with a Supabase user to stream through the gateway.',
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
              keyboardType: TextInputType.emailAddress,
              enabled: !_loading,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder()),
              obscureText: true,
              enabled: !_loading,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loading ? null : _signIn,
              child: _loading
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Sign in'),
            ),
            if (_error case final err?)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(err, style: TextStyle(color: Colors.red.shade300)),
              ),
          ],
        ),
      ),
    );
  }
}

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  static const _models = ['gpt-4o', 'claude-sonnet'];

  final _textController = TextEditingController();
  final _wing = Wingport.supabase(Supabase.instance.client);

  String _model = _models.first;
  String _response = '';
  bool _streaming = false;
  String _partialOnInterrupt = '';
  WingportException? _error;
  CancellationToken? _cancelToken;
  WingQuota? _quota;
  bool _loadingQuota = false;

  @override
  void initState() {
    super.initState();
    _loadQuota();
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _loadQuota() async {
    setState(() => _loadingQuota = true);
    try {
      final quota = await _wing.quota();
      setState(() => _quota = quota);
    } catch (e) {
      // Ignore; the chat UI will surface real request errors.
    } finally {
      setState(() => _loadingQuota = false);
    }
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
      await _loadQuota();
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
      appBar: AppBar(
        title: const Text('Wingport Demo'),
        actions: [
          if (_quota case final q?)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text(
                  'Quota: ${q.remainingMinute}/${q.limitMinute} min · ${q.remainingDay}/${q.limitDay} day',
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            ),
          if (_loadingQuota)
            const Padding(
              padding: EdgeInsets.only(right: 16),
              child: Center(child: SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))),
            ),
        ],
      ),
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
