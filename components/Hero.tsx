import HeroWire from './HeroWire'
import { ServerOff, KeyRound, ShieldCheck, WifiOff } from 'lucide-react'
import { GITHUB_URL } from '@/lib/site'

export default function Hero({ onOpenModal }: { onOpenModal: () => void }) {
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
          Wingport is the safe wire between your app and AI. It carries your questions and your data through infrastructure you already own — your secret keys stay locked on your side, never inside the app.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenModal}
            className="inline-flex h-11 items-center justify-center rounded-full bg-wing-signal px-6 text-sm font-medium text-wing-bg transition-colors hover:bg-[#2ecc7a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal"
          >
            Get early access
          </button>
          <a
            href={GITHUB_URL}
            className="inline-flex h-11 items-center justify-center rounded-full border border-wing-signal px-6 text-sm font-medium text-wing-signal transition-colors hover:bg-wing-signal/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>

        <div className="mt-16">
          <HeroWire />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Chip icon={ServerOff}>No servers to build</Chip>
          <Chip icon={KeyRound}>Keys never touch the app</Chip>
          <Chip icon={ShieldCheck}>Your data goes only where you send it</Chip>
          <Chip icon={WifiOff}>Survives bad networks</Chip>
        </div>
      </div>
    </section>
  )
}

function Chip({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex h-9 max-w-full items-center gap-2 whitespace-normal rounded-full border border-wing-border px-4 text-sm text-wing-dim break-words">
      <Icon className="h-4 w-4 shrink-0 text-wing-signal" />
      {children}
    </span>
  )
}
