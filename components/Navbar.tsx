import { Github } from 'lucide-react'
import { DOCS_URL, GITHUB_URL } from '@/lib/site'

export default function Navbar({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <header className="border-b border-wing-border bg-wing-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-1 font-display text-xl font-bold text-wing-text">
          <span className="text-wing-signal">▸</span>
          wingport
        </a>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          <a
            href={DOCS_URL}
            className="text-sm font-medium text-wing-dim transition-colors hover:text-wing-text"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </a>
          <a
            href="#roadmap"
            className="text-sm font-medium text-wing-dim transition-colors hover:text-wing-text"
          >
            Roadmap
          </a>
          <a
            href={GITHUB_URL}
            className="flex items-center gap-1.5 text-sm font-medium text-wing-dim transition-colors hover:text-wing-text"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <button
            type="button"
            onClick={onOpenModal}
            className="rounded-full border border-wing-signal px-5 py-2.5 text-sm font-medium text-wing-signal transition-colors hover:bg-wing-signal/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal"
          >
            Get early access
          </button>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <a
            href={GITHUB_URL}
            className="inline-flex h-11 items-center justify-center rounded-full border border-wing-border px-4 text-sm font-medium text-wing-text transition-colors hover:border-wing-signal hover:text-wing-signal"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <button
            type="button"
            onClick={onOpenModal}
            className="inline-flex h-11 items-center justify-center rounded-full bg-wing-signal px-4 text-sm font-medium text-wing-bg transition-colors hover:bg-[#2ecc7a]"
          >
            Get early access
          </button>
        </div>
      </div>
    </header>
  )
}
