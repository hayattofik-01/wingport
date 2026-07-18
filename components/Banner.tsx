'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { GITHUB_URL } from '@/lib/site'

export default function Banner() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem('wingport-banner-dismissed') === '1') {
        setDismissed(true)
      }
    } catch {
      // ignore
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem('wingport-banner-dismissed', '1')
    } catch {
      // ignore
    }
  }

  if (dismissed) return null

  return (
    <div className="sticky top-0 z-50 border-b border-wing-border bg-wing-raised">
      <div className="mx-auto flex max-w-[1080px] items-start gap-3 border-l-4 border-wing-warn px-6 py-3">
        <p className="flex-1 text-sm leading-relaxed text-wing-text">
          🚧 Wingport is in active development, built in public. This page describes v0.1, shipping in weeks —{' '}
          <a
            href={GITHUB_URL}
            className="underline underline-offset-2 hover:text-wing-signal"
            target="_blank"
            rel="noopener noreferrer"
          >
            follow along on GitHub
          </a>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss status banner"
          className="shrink-0 text-wing-dim transition-colors hover:text-wing-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
