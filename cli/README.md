# Wingport CLI

Node 20+ / TypeScript CLI, published as `wingport` on npm.

## Install

```bash
cd cli
npm install
```

## Usage

In an existing Supabase project:

```bash
npx wingport init    # scaffolds supabase/functions/wingport/ and wingport.config.ts
npx wingport deploy  # sets secrets, runs supabase db push, and deploys the function
```

`wingport init` is idempotent: it refreshes gateway source files but will not overwrite an edited `wingport.config.ts`.

## Test

```bash
npm run test
npm run lint
```

## Publish

```bash
npm run build
npm publish --dry-run
```
