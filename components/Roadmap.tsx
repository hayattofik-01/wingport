import { Check } from 'lucide-react'
import { GITHUB_URL } from '@/lib/site'

const milestones = [
  {
    title: 'v0.1 Core loop',
    desc: 'Supabase deploy, Anthropic + OpenAI, streaming, quotas',
    status: 'done',
  },
  {
    title: 'v0.2 Templates + resilience',
    desc: 'Templates, spend caps, plugin authoring',
    status: 'planned',
  },
  {
    title: 'v0.3 Firebase + multimodal',
    desc: 'Firebase, multimodal, caching, moderation',
    status: 'planned',
  },
  {
    title: 'Cloud Hosted + dashboard',
    desc: 'Hosted gateway, dashboards, managed keys',
    status: 'planned',
  },
]

export default function Roadmap() {
  return (
    <section className="px-6 py-24 md:py-32" id="roadmap">
      <div className="mx-auto max-w-[1080px]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-wing-signal">Built in public</p>
        <h2 className="mb-14 font-display text-[clamp(1.6rem,3.5vw,2.2rem)] font-medium text-wing-text">
          Where this is going.
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          {milestones.map((m, i) => (
            <div
              key={m.title}
              className="relative overflow-hidden rounded-2xl border border-wing-border bg-wing-raised p-6"
            >
              {i < milestones.length - 1 && (
                <div className="absolute -right-2 top-1/2 hidden h-[2px] w-4 bg-wing-border md:block" aria-hidden="true" />
              )}
              <span
                className={`mb-3 inline-flex min-w-0 max-w-full items-center gap-1.5 break-words rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${
                  m.status === 'done'
                    ? 'bg-wing-signal/15 text-wing-signal'
                    : m.status === 'in progress'
                      ? 'bg-wing-warn/15 text-wing-warn'
                      : 'border border-wing-border bg-wing-raised text-wing-dim'
                }`}
              >
                {m.status === 'done' && <Check className="h-3 w-3" aria-hidden="true" />}
                {m.status}
              </span>
              <h3 className="mb-2 break-words font-display text-base font-medium text-wing-text">{m.title}</h3>
              <p className="break-words text-sm leading-relaxed text-wing-dim">{m.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center">
          <a
            href={GITHUB_URL}
            className="text-sm font-medium text-wing-signal underline underline-offset-2 hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Full roadmap on GitHub →
          </a>
        </p>
      </div>
    </section>
  )
}
