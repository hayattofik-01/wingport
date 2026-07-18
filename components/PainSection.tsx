import { Github, MessageCircle, Check } from 'lucide-react'

const cards = [
  {
    sourceIcon: Github,
    source: 'supabase/supabase · Discussion #14325',
    pain: 'GPT-4 responses take over a minute — the client gets a 504 gateway timeout at exactly 60 seconds while the edge function keeps running.',
    check: 'Wingport streams tokens as they arrive — no waiting on a full response',
    href: 'https://github.com/orgs/supabase/discussions/14325',
  },
  {
    sourceIcon: Github,
    source: 'supabase/supabase-flutter · Issue #894',
    pain: 'Teams building ChatGPT-style features found no way to receive a streamed (SSE) edge function response from the Flutter client library.',
    check: "Wingport's Dart SDK is a streaming client, built for exactly this",
    href: 'https://github.com/supabase/supabase-flutter/issues/894',
  },
  {
    sourceIcon: Github,
    source: 'supabase/supabase · Discussion #40074',
    pain: "Long AI generations blow past edge function wall-clock limits — and the limits can't be raised.",
    check: "Wingport's gateway and SDK are designed around edge runtime limits",
    href: 'https://github.com/orgs/supabase/discussions/40074',
  },
  {
    sourceIcon: MessageCircle,
    source: 'FlutterFlow community',
    pain: 'Developers trade DIY recipes for wiring OpenAI through Supabase functions — everyone rebuilding the same proxy, quota, and auth boilerplate.',
    check: 'Wingport replaces the boilerplate with one deploy and one SDK call',
    href: 'https://community.flutterflow.io/discussions/post/supabase-serverless-functions-openai-api-implentation-husV1D1WtHfRlzt',
  },
]

export default function PainSection() {
  return (
    <section className="px-6 py-24 md:py-32" id="pain">
      <div className="mx-auto max-w-[1080px]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-wing-signal">
          You&apos;re not alone
        </p>
        <h2 className="mb-6 font-display text-[clamp(1.6rem,3.5vw,2.2rem)] font-medium text-wing-text">
          Developers keep hitting this wall.
        </h2>
        <p className="mb-14 max-w-[560px] text-[1.06rem] leading-[1.7] text-wing-dim">
          These aren&apos;t our words — they&apos;re open threads from the community. Every one of them is a Wingport design requirement.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((c) => (
            <div
              key={c.href}
              className="flex flex-col rounded-2xl border border-wing-border bg-wing-raised p-6 md:p-8"
            >
              <div className="mb-4 flex items-center gap-2 text-[12px] text-wing-dim">
                <c.sourceIcon className="h-4 w-4 shrink-0" />
                <span className="break-words">{c.source}</span>
              </div>
              <p className="mb-4 break-words text-[15px] leading-relaxed text-wing-text">
                {c.pain}
              </p>
              <p className="mb-6 flex items-start gap-2 break-words text-base leading-[1.6] text-wing-signal">
                <Check className="mt-1 h-4 w-4 shrink-0" />
                <span>{c.check}</span>
              </p>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto text-sm font-medium text-wing-signal underline underline-offset-2 hover:no-underline"
              >
                Read the thread ↗
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
