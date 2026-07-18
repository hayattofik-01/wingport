import { GITHUB_URL } from '@/lib/site'

const milestones = [
  {
    title: 'v0.1 core loop',
    desc: 'Supabase deploy, Anthropic + OpenAI, streaming, quotas',
    status: 'in progress',
  },
  {
    title: 'v0.2',
    desc: 'Resilience, spend caps, plugin authoring',
    status: 'planned',
  },
  {
    title: 'v0.3',
    desc: 'Firebase, multimodal, caching, moderation',
    status: 'planned',
  },
  {
    title: 'Cloud',
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
              className="relative rounded-2xl border border-wing-border bg-wing-raised p-6"
            >
              {i < milestones.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 h-[2px] w-6 bg-wing-border" aria-hidden="true" />
              )}
              <span
                className={`mb-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${
                  m.status === 'in progress'
                    ? 'bg-wing-warn/15 text-wing-warn'
                    : 'bg-wing-raised text-wing-dim border border-wing-border'
                }`}
              >
                {m.status}
              </span>
              <h3 className="mb-2 font-display text-base font-medium text-wing-text">{m.title}</h3>
              <p className="text-sm leading-relaxed text-wing-dim">{m.desc}</p>
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
