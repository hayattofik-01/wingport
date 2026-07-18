'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { GITHUB_URL } from '@/lib/site'

export default function Banner() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(window.sessionStorage.getItem('wingport-banner') === 'dismissed')
    }
  }, [])

  if (dismissed) return null

  return (
    <div className="sticky top-0 z-50 bg-wing-raised/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1080px] items-center gap-3 border-l-4 border-wing-warn px-6 py-3">
        <p className="flex-1 text-sm text-wing-text">
          🚧 Wingport is in active development, built in public. This page describes v0.1, shipping in weeks —{' '}
          <a
            href={GITHUB_URL}
            className="text-wing-signal underline underline-offset-2 hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            follow along on GitHub
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true)
            if (typeof window !== 'undefined') {
              window.sessionStorage.setItem('wingport-banner', 'dismissed')
            }
          }}
          aria-label="Dismiss status banner"
          className="inline-flex h-11 w-11 items-center justify-center rounded p-1 text-wing-dim hover:text-wing-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
