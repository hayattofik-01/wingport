import { Github } from 'lucide-react'
import { TallyButton } from './TallyButton'
import { DOCS_URL, GITHUB_URL } from '@/lib/site'

export default function Navbar() {
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
          <TallyButton variant="outline" className="text-sm">
            Get early access
          </TallyButton>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <a
            href={GITHUB_URL}
            className="rounded-full border border-wing-border px-4 py-2 text-sm font-medium text-wing-text transition-colors hover:border-wing-signal hover:text-wing-signal"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <TallyButton className="px-4 py-2 text-sm">Get early access</TallyButton>
        </div>
      </div>
    </header>
  )
}
