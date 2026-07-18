import { Check } from 'lucide-react'
import CodeBlock from './CodeBlock'

const features = [
  'Per-user rate limits, quotas, and tiers — enforced server-side',
  'Anthropic, OpenAI, and Google behind one interface',
  'Model aliases: upgrade models with no app-store review',
  'Automatic provider fallback',
  'Streaming that survives WiFi↔cellular handoffs',
  'Sealed error types — handle every failure at compile time',
]

export default function ForDevelopers() {
  return (
    <section className="px-6 py-24 md:py-32" id="for-developers">
      <div className="mx-auto max-w-[1080px]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-wing-signal">
          For developers
        </p>
        <h2 className="mb-14 font-display text-[clamp(1.6rem,3.5vw,2.2rem)] font-medium text-wing-text">
          Your entire AI backend is a config file.
        </h2>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="mb-6 break-words text-[1.06rem] leading-[1.7] text-wing-dim">
              One TypeScript object defines auth, providers, limits, and fallback. The Dart SDK reuses the Supabase client your app already has — no new keys, no new backend.
            </p>
            <ul className="space-y-4">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wing-signal/10 text-wing-signal">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="break-words text-base leading-[1.6] text-wing-dim">{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <CodeBlock />
        </div>
      </div>
    </section>
  )
}
