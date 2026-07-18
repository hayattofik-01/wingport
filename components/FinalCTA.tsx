import { GITHUB_URL } from '@/lib/site'

export default function FinalCTA({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[700px] rounded-2xl border border-wing-border bg-wing-raised px-6 py-16 text-center md:px-12 md:py-20">
        <h2 className="mb-4 font-display text-[clamp(1.6rem,3.5vw,2.2rem)] font-medium text-wing-text">
          Be first in line.
        </h2>
        <p className="mx-auto mb-8 max-w-[480px] text-[1.06rem] leading-[1.7] text-wing-dim">
          Wingport v0.1 ships in weeks. Star the repo and you&apos;ll see it the moment it&apos;s stable.
        </p>
        <button
          type="button"
          onClick={onOpenModal}
          className="mb-4 inline-flex h-11 items-center justify-center rounded-full bg-wing-signal px-8 text-base font-medium text-wing-bg transition-colors hover:bg-[#2ecc7a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal"
        >
          Get early access
        </button>
        <p className="text-sm text-wing-dim">
          or{' '}
          <a
            href={GITHUB_URL}
            className="text-wing-signal underline underline-offset-2 hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            star the repo to follow along →
          </a>
        </p>
      </div>
    </section>
  )
}
