const cards = [
  {
    title: '…write an edge function?',
    body: 'That is a backend — you maintain the auth check, quotas, streaming, and retries yourself. Wingport is that exact function, hardened, plus the mobile half nobody\'s boilerplate covers.',
  },
  {
    title: '…use Firebase AI Logic?',
    body: 'It proves the problem is real — but it\'s Gemini-only, Google-only, Firebase-only. Wingport is neutral on every axis, and open source.',
  },
  {
    title: '…use OpenRouter or LiteLLM?',
    body: 'Great server-side routers with no concept of your end users — no per-user auth, quotas, or mobile SDK. And OpenRouter is a hosted middleman in your path.',
  },
  {
    title: '…put the key behind RLS?',
    body: 'Every legitimate user needs to read it, so every user receives your key. Any secret that reaches the client is public.',
  },
]

export default function Comparisons() {
  return (
    <section className="px-6 py-24 md:py-32" id="comparisons">
      <div className="mx-auto max-w-[1080px]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-wing-signal">
          Honest comparisons
        </p>
        <h2 className="mb-14 font-display text-[clamp(1.6rem,3.5vw,2.2rem)] font-medium text-wing-text">
          Why not just…
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-wing-border bg-wing-raised p-6 md:p-8">
              <h3 className="mb-3 font-display text-lg font-medium text-wing-text">{c.title}</h3>
              <p className="text-base leading-[1.7] text-wing-dim">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
