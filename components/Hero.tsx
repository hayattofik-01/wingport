import { TallyButton } from './TallyButton'
import HeroWire from './HeroWire'
import { GITHUB_URL } from '@/lib/site'

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="mx-auto max-w-[1080px]">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-wing-signal">
          Open-source AI layer for Flutter apps
        </p>
        <h1 className="max-w-3xl font-display text-[clamp(2.4rem,6vw,4rem)] font-bold leading-[1.05] tracking-[-0.02em] text-wing-text">
          Ship AI features.{" "}
          <span className="text-wing-signal">Skip the backend.</span>
        </h1>
        <p className="mt-6 max-w-[560px] text-[1.06rem] leading-[1.7] text-wing-dim">
          Wingport is the safe wire between your app and AI. It runs inside infrastructure you already own — your secret keys stay locked on your side, never inside the app.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <TallyButton variant="primary">Get early access</TallyButton>
          <a
            href={GITHUB_URL}
            className="inline-flex items-center justify-center rounded-full border border-wing-signal px-5 py-2.5 text-sm font-medium text-wing-signal transition-colors hover:bg-wing-signal/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>

        <div className="mt-16">
          <HeroWire />
        </div>
      </div>
    </section>
  )
}
