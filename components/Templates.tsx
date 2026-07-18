import { Check } from 'lucide-react'
import { DOCS_URL } from '@/lib/site'

const points = [
  'Update prompts with no app-store review',
  'Prompt IP never ships in the binary',
  'Per-feature cost analytics in your own SQL',
]

export default function Templates() {
  return (
    <section className="px-6 py-24 md:py-32" id="templates">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-3 flex items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-wing-signal">Coming in v0.2</p>
          <span className="rounded-full bg-wing-warn/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-wing-warn">
            planned
          </span>
        </div>
        <h2 className="mb-6 font-display text-[clamp(1.6rem,3.5vw,2.2rem)] font-medium text-wing-text">
          Your prompts belong server-side too.
        </h2>
        <p className="mb-10 max-w-[620px] text-[1.06rem] leading-[1.7] text-wing-dim">
          For many AI apps, the prompt is the product — and today it ships inside the binary where anyone can extract it, and every improvement needs an app-store review. Wingport templates move prompts into your gateway: the app sends only the data, by name.
        </p>

        <div className="mb-8 rounded-2xl border border-wing-border bg-wing-raised p-6 md:p-8">
          <pre className="shiki overflow-x-auto">
            <code className="font-mono text-sm md:text-base">
{`templates: {
  resume_generator: {
    model: "claude-sonnet",
    system: "You are an expert resume writer...",
    user: "Write a resume for:\n{{profile}}\n\nTargeting:\n{{job}}",
    inputs: { profile: "json", job: "string" },
  },
}`}
            </code>
          </pre>
        </div>

        <div className="mb-8 rounded-lg border border-wing-border bg-wing-bg px-4 py-3 font-mono text-sm text-wing-text md:inline-block md:px-6">
          await wing.run(&apos;resume_generator&apos;, inputs: {'{'}&apos;profile&apos;: user.toJson(), &apos;job&apos;: job{'}'});
        </div>

        <ul className="mb-8 grid gap-4 md:grid-cols-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wing-signal/10 text-wing-signal">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-base leading-[1.6] text-wing-dim">{p}</span>
            </li>
          ))}
        </ul>

        <p>
          <a
            href={DOCS_URL}
            className="text-sm font-medium text-wing-signal underline underline-offset-2 hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the template design in the docs →
          </a>
        </p>
      </div>
    </section>
  )
}
