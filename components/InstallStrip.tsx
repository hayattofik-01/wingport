'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

const lines = [
  'npx wingport init',
  'npx wingport deploy',
  'flutter pub add wingport',
]

export default function InstallStrip() {
  const [copied, setCopied] = useState<number | null>(null)

  const copy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(idx)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <section className="border-y border-wing-border bg-wing-raised px-6 py-16 md:py-20">
      <div className="mx-auto max-w-[1080px] text-center">
        <h2 className="mb-10 font-display text-[1.4rem] font-medium text-wing-text">
          Your AI backend, in two commands.
        </h2>

        <div className="mx-auto max-w-[640px] rounded-2xl border border-wing-border bg-wing-bg p-5 md:p-6">
          <div className="space-y-3 text-left font-mono text-sm text-wing-text">
            {lines.map((line, i) => (
              <div key={line} className="flex items-center justify-between gap-4">
                <code className="min-w-0 break-all">{line}</code>
                <button
                  type="button"
                  onClick={() => copy(line, i)}
                  aria-label={`Copy ${line}`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded text-wing-dim transition-colors hover:text-wing-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal"
                >
                  {copied === i ? (
                    <Check className="h-4 w-4 text-wing-signal" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-[13px] leading-relaxed text-wing-dim">
          That&apos;s the whole setup. Keys go in your Supabase secrets — the CLI walks you through it.
        </p>
      </div>
    </section>
  )
}
