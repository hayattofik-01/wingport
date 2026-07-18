'use client'

import { useEffect, useRef } from 'react'
import { Github, X } from 'lucide-react'
import { GITHUB_URL, X_URL } from '@/lib/site'

export default function Modal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement
      const panel = panelRef.current
      if (panel) {
        const focusable = panel.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        focusable?.focus()
      }
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      previousFocus.current?.focus?.()
    }

    function onKey(e: KeyboardEvent) {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex >= 0)

        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const active = document.activeElement

        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-[420px] rounded-2xl border border-wing-border bg-wing-raised p-6 md:p-8"
        tabIndex={-1}
      >
        <h2
          id="modal-title"
          className="mb-3 font-display text-xl font-medium text-wing-text"
        >
          Early access is coming
        </h2>
        <p className="mb-6 text-base leading-relaxed text-wing-dim">
          Wingport v0.1 ships in weeks and the waitlist opens with it. Until
          then, the best way to be first in line:
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-wing-signal px-5 text-sm font-medium text-wing-bg transition-colors hover:bg-[#2ecc7a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal"
          >
            <Github className="h-4 w-4" />
            Star the repo on GitHub
          </a>
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-wing-border px-5 text-sm font-medium text-wing-text transition-colors hover:border-wing-signal hover:text-wing-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal"
          >
            Follow along on X
          </a>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 text-sm text-wing-dim underline underline-offset-2 hover:text-wing-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal"
          >
            Close
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded p-1 text-wing-dim hover:text-wing-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
