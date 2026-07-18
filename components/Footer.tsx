import { DOCS_URL, GITHUB_URL, X_URL } from '@/lib/site'

export default function Footer() {
  return (
    <footer className="border-t border-wing-border px-6 py-10">
      <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-wing-dim">
          wingport — the wire between your app and AI. MIT licensed.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-wing-dim">
          <a href={GITHUB_URL} className="hover:text-wing-text" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span aria-hidden="true">·</span>
          <a href={DOCS_URL} className="hover:text-wing-text" target="_blank" rel="noopener noreferrer">Docs</a>
          <span aria-hidden="true">·</span>
          <a href={X_URL} className="hover:text-wing-text" target="_blank" rel="noopener noreferrer">X</a>
          <span aria-hidden="true">·</span>
          <a href="mailto:security@wingport.dev" className="hover:text-wing-text">security@wingport.dev</a>
        </div>
      </div>
    </footer>
  )
}
