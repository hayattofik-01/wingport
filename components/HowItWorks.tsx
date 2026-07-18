import { Plug, MessageCircle, Sparkles } from 'lucide-react'

const steps = [
  {
    num: '1',
    icon: Plug,
    title: 'Connect',
    body: 'Run one command. Wingport installs itself into the Supabase project your app already uses — like adding a smart lock to a door you already own.',
  },
  {
    num: '2',
    icon: MessageCircle,
    title: 'Ask',
    body: "Your app sends its question — and the data that goes with it, like a profile or a document. Wingport checks who's asking, keeps them within their limits, and attaches your secret key, which never leaves your side.",
  },
  {
    num: '3',
    icon: Sparkles,
    title: 'Answer',
    body: "The AI's answer streams straight back into your app, word by word — and keeps working even when the network doesn't.",
  },
]

export default function HowItWorks() {
  return (
    <section className="px-6 py-24 md:py-32" id="how-it-works">
      <div className="mx-auto max-w-[1080px]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-wing-signal">How it works</p>
        <h2 className="mb-14 font-display text-[clamp(1.6rem,3.5vw,2.2rem)] font-medium text-wing-text">
          Three steps. Zero servers.
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.num}
              className="rounded-2xl border border-wing-border bg-wing-raised p-6 md:p-8"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-wing-signal/30 text-wing-signal">
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-wing-dim">
                Step {s.num}
              </p>
              <h3 className="mb-3 font-display text-lg font-medium text-wing-text">{s.title}</h3>
              <p className="text-base leading-[1.7] text-wing-dim">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
