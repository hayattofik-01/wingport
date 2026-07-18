import { getHighlighterInstance } from '@/lib/shiki'
import CodeBlockClient from './CodeBlockClient'

const gatewayCode = `import { defineGateway, anthropic, openai } from "wingport";

export default defineGateway({
  auth: { provider: "supabase" },
  providers: [
    anthropic({ models: { "claude-sonnet": "claude-sonnet-4-6" } }),
    openai({ models: { "gpt-5-mini": "gpt-5-mini" } }),
  ],
  limits: {
    default: { requestsPerDay: 50, tokensPerDay: 100_000 },
    tiers: { pro: "unlimited" },
  },
  fallback: true,
});`

const flutterCode = `final wing = Wingport.supabase(Supabase.instance.client);

await for (final chunk in wing.stream(
  model: 'claude-sonnet',
  prompt: 'Summarize my day',
)) {
  setState(() => reply += chunk.delta ?? '');
}`

export default async function CodeBlock() {
  const highlighter = await getHighlighterInstance()
  const gatewayHtml = highlighter.codeToHtml(gatewayCode, {
    lang: 'typescript',
    theme: 'github-dark',
  })
  const flutterHtml = highlighter.codeToHtml(flutterCode, {
    lang: 'dart',
    theme: 'github-dark',
  })

  return <CodeBlockClient gatewayHtml={gatewayHtml} flutterHtml={flutterHtml} />
}
