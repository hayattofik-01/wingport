# Contributing to Wingport

Thanks for helping build the wire between Flutter apps and AI. This repo moves fast — pre-1.0, minor versions may break APIs. We will call those out in release notes and migration notes.

## Where design discussions happen

- **Big questions, use cases, or roadmap ideas** → [GitHub Discussions](https://github.com/hayattofik-01/wingport/discussions)
- **Bugs with a clear repro** → open an issue using the bug report template
- **Feature requests** → open an issue using the feature request template, or start a Discussion first

## Development setup

### 1. Gateway (Deno)

```bash
cd gateway
deno task lint
deno task test
```

You need [Deno](https://deno.com) installed.

### 2. CLI (Node / TypeScript)

```bash
cd cli
npm install
npm run lint
npm run test
```

You need Node 20+.

### 3. SDK (Dart)

```bash
cd sdk
dart pub get
dart analyze
dart test
```

You need Dart 3+.

### 4. Demo app (Flutter)

```bash
cd examples/demo_app
flutter pub get
flutter run --dart-define=SUPABASE_URL=$SUPABASE_URL --dart-define=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

You need Flutter 3.22+ and a Supabase project with the gateway deployed.

## Pull request rules

- **One change per PR.** If you want to fix a bug and add a feature, split them.
- **All PRs must have tests** (or a clear note if the change is not testable in this repo).
- **Conventional commit titles** are required: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `security:`.
- **Update the relevant README** if you change commands, env vars, or public API.
- **No `TODO` or placeholder code** in finished PRs. If something is intentionally deferred, open an issue and reference it.

A maintainer will review, run CI, and merge. Security/auth/quota PRs get an extra human security review before merge.

## Publishing (manual)

We do not auto-publish on release. When a release is ready:

- **pub.dev** (SDK): `cd sdk && dart pub publish --dry-run` then `dart pub publish`.
- **npm** (CLI): `cd cli && npm run build && npm publish --dry-run` then `npm publish`.
- **JSR** (gateway): `cd gateway && deno publish --dry-run` then `deno publish`.

Each step must pass its dry-run first.

## Good first issues

Look for issues labeled [`good first issue`](https://github.com/hayattofik-01/wingport/labels/good%20first%20issue). They are scoped, have clear acceptance criteria, and are safe to pick up without deep context.
