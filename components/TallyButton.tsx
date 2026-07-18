'use client'

import { TALLY_FORM_ID } from '@/lib/site'

type TallyButtonProps = {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'outline' | 'ghost'
}

function openTally() {
  const id = TALLY_FORM_ID
  if (typeof window !== 'undefined') {
    const win = window as unknown as {
      Tally?: {
        openPopup: (
          formId: string,
          options?: { layout: string; width: number }
        ) => void
      }
    }
    if (win.Tally && id) {
      win.Tally.openPopup(id, { layout: 'modal', width: 420 })
      return
    }
  }
  // Fallback: open Tally form URL in a new tab
  const url = id ? `https://tally.so/r/${id}` : '#'
  if (url !== '#') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const baseStyles =
  'inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wing-signal'

const variants = {
  primary:
    baseStyles +
    ' bg-wing-signal text-wing-bg px-5 py-2.5 hover:bg-[#2ecc7a]',
  outline:
    baseStyles +
    ' border border-wing-signal text-wing-signal px-5 py-2.5 hover:bg-wing-signal/10',
  ghost:
    baseStyles + ' text-wing-signal px-3 py-1.5 hover:bg-wing-signal/10',
}

export function TallyButton({
  children,
  className = '',
  variant = 'primary',
}: TallyButtonProps) {
  return (
    <button
      type="button"
      onClick={openTally}
      className={`${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
