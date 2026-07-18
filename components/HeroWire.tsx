'use client'

import { useEffect, useRef, useState } from 'react'
import { Lock, Sparkles, ServerOff, KeyRound, WifiOff } from 'lucide-react'

const PHASES = [
  { key: 'ask', duration: 900 },
  { key: 'verify', duration: 700 },
  { key: 'forward', duration: 700 },
  { key: 'think', duration: 500 },
  { key: 'stream', duration: 1400 },
  { key: 'type', duration: 1800 },
  { key: 'hold', duration: 2500 },
  { key: 'reset', duration: 400 },
] as const

const ANSWER = 'Gym at 7, standup at 10, ship Wingport tonight.'
const STREAM_DURATION = 1100 // ms for a dot to cross both wires
const STREAM_STAGGER = 150
const STREAM_DOTS = 3

export default function HeroWire() {
  const containerRef = useRef<HTMLDivElement>(null)
  const wireARef = useRef<HTMLDivElement>(null)
  const wireBRef = useRef<HTMLDivElement>(null)

  const [isVertical, setIsVertical] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [tick, setTick] = useState(0)

  // Mutable animation state
  const anim = useRef({
    phase: 0,
    phaseStart: 0,
    lengths: { a: 0, b: 0 },
    wireADot: { color: 'signal', pos: 0, visible: false },
    wireBDot: { color: 'ai', pos: 0, visible: false },
    streamDots: [] as { id: number; start: number }[],
    verifyOpacity: 0,
    lockPulse: false,
    aiSparkle: false,
    typedText: '',
    answerOpacity: 1,
    rafId: 0 as unknown as number,
    startTime: 0,
  })

  function measure() {
    const a = wireARef.current?.getBoundingClientRect()
    const b = wireBRef.current?.getBoundingClientRect()
    if (!a || !b) return
    const vertical = window.innerWidth < 900
    setIsVertical(vertical)
    anim.current.lengths = {
      a: vertical ? a.height : a.width,
      b: vertical ? b.height : b.width,
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const motionQ = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(motionQ.matches)
    const onMotion = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    motionQ.addEventListener('change', onMotion)

    measure()
    window.addEventListener('resize', measure)

    if (reducedMotion) {
      anim.current.typedText = ANSWER
      anim.current.verifyOpacity = 1
      setTick((t) => t + 1)
      return () => motionQ.removeEventListener('change', onMotion)
    }

    anim.current.phaseStart = performance.now()
    anim.current.startTime = performance.now()

    function nextPhase(now: number, phase: number) {
      anim.current.phase = phase % PHASES.length
      anim.current.phaseStart = now
      anim.current.streamDots = []
      if (anim.current.phase === 0) {
        anim.current.typedText = ''
        anim.current.answerOpacity = 1
        anim.current.verifyOpacity = 0
        anim.current.lockPulse = false
        anim.current.aiSparkle = false
      }
    }

    function loop(now: number) {
      const state = anim.current
      const phaseIdx = state.phase
      const phase = PHASES[phaseIdx]
      const elapsed = now - state.phaseStart
      const p = Math.min(1, elapsed / phase.duration)
      const { a, b } = state.lengths
      const total = a + b

      // Reset defaults
      state.wireADot.visible = false
      state.wireBDot.visible = false
      state.lockPulse = false
      state.aiSparkle = false

      switch (phase.key) {
        case 'ask': {
          state.wireADot = {
            color: 'signal',
            pos: easeInOut(p) * Math.max(0, a - 10),
            visible: true,
          }
          break
        }
        case 'verify': {
          state.wireADot = { color: 'signal', pos: Math.max(0, a - 10), visible: true }
          state.verifyOpacity = p < 0.5 ? p * 2 : 1
          state.lockPulse = true
          break
        }
        case 'forward': {
          state.wireBDot = {
            color: 'ai',
            pos: easeInOut(p) * Math.max(0, b - 10),
            visible: true,
          }
          state.verifyOpacity = 1 - p
          break
        }
        case 'think': {
          state.aiSparkle = true
          break
        }
        case 'stream': {
          // spawn stream dots staggered
          for (let i = 0; i < STREAM_DOTS; i++) {
            const start = i * STREAM_STAGGER
            if (elapsed >= start && !state.streamDots.find((d) => d.id === i)) {
              state.streamDots.push({ id: i, start: now - (elapsed - start) })
            }
          }
          break
        }
        case 'type': {
          const chars = ANSWER.length
          const index = Math.min(chars, Math.floor(p * chars))
          state.typedText = ANSWER.slice(0, index)
          break
        }
        case 'hold': {
          state.typedText = ANSWER
          break
        }
        case 'reset': {
          state.typedText = ANSWER
          state.answerOpacity = 1 - p
          break
        }
      }

      if (elapsed >= phase.duration) {
        nextPhase(now, phaseIdx + 1)
      }

      setTick((t) => t + 1)
      state.rafId = requestAnimationFrame(loop)
    }

    anim.current.rafId = requestAnimationFrame(loop)

    return () => {
      motionQ.removeEventListener('change', onMotion)
      window.removeEventListener('resize', measure)
      cancelAnimationFrame(anim.current.rafId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion])

  // Calculate stream dot positions
  const { a, b } = anim.current.lengths
  const total = a + b
  const speed = total > 0 ? total / STREAM_DURATION : 0

  const streamDotsRendered = anim.current.streamDots
    .map((dot) => {
      const age = performance.now() - dot.start
      const dist = age * speed
      if (dist < 0 || dist > total) return null

      if (b > 0 && dist <= b) {
        // in wire B, moving from far end toward near end
        const segP = dist / b
        const pos = (1 - segP) * Math.max(0, b - 10)
        return { key: dot.id, color: 'ai', container: 'B', pos, visible: true }
      }
      if (a > 0) {
        const distA = dist - b
        const segP = distA / a
        const pos = (1 - segP) * Math.max(0, a - 10)
        return { key: dot.id, color: 'ai', container: 'A', pos, visible: true }
      }
      return null
    })
    .filter(Boolean) as {
    key: number
    color: string
    container: 'A' | 'B'
    pos: number
    visible: boolean
  }[]

  if (reducedMotion) {
    return <ReducedMotionHero />
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="flex flex-col items-center justify-between gap-0 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between"
        aria-label="Animation showing a request traveling from a phone to Wingport, then to an AI provider, and the answer streaming back"
      >
        {/* Phone card */}
        <div className="relative w-[180px] shrink-0 rounded-3xl border border-wing-border bg-wing-raised p-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-wing-border" aria-hidden="true" />
          <div className="flex flex-col gap-3">
            <div className="self-end rounded-xl bg-wing-signal/15 px-3 py-2 text-sm text-wing-signal">
              Plan my day
            </div>
            <div className="min-h-[4.5rem] rounded-xl border border-wing-border bg-wing-bg px-3 py-2 text-sm text-wing-text">
              {anim.current.typedText}
              <span className="ml-0.5 inline-block w-2 animate-blink bg-current align-middle" style={{ height: '1em' }}>
                ▌
              </span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-wing-dim">Your app</p>
        </div>

        {/* Wire A */}
        <div
          ref={wireARef}
          className="relative flex-1 bg-wing-border min-[900px]:h-[2px] min-[900px]:w-auto min-[900px]:flex-1 w-[2px] h-24"
        >
          {anim.current.wireADot.visible && (
            <Dot
              color="bg-wing-signal"
              glow="shadow-[0_0_12px_rgba(61,220,151,0.6)]"
              isVertical={isVertical}
              pos={anim.current.wireADot.pos}
            />
          )}
          {streamDotsRendered
            .filter((d) => d.container === 'A')
            .map((d) => (
              <Dot
                key={d.key}
                color="bg-wing-ai"
                glow="shadow-[0_0_12px_rgba(139,124,246,0.6)]"
                isVertical={isVertical}
                pos={d.pos}
              />
            ))}
        </div>

        {/* Wingport node */}
        <div className="relative z-10 w-[170px] shrink-0 rounded-2xl border border-wing-signal bg-wing-raised p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-wing-signal/30">
            <Lock
              className={`h-5 w-5 text-wing-signal ${anim.current.lockPulse ? 'animate-pulse-scale' : ''}`}
              aria-hidden="true"
            />
          </div>
          <p className="font-display text-base font-medium text-wing-text">Wingport</p>
          <p className="text-[11px] leading-relaxed text-wing-dim">
            checks who&apos;s asking · keys stay here
          </p>
          <p
            className="mt-2 text-[11px] text-wing-signal transition-opacity duration-200"
            style={{ opacity: anim.current.verifyOpacity }}
            aria-live="polite"
          >
            ✓ user verified · ✓ within limits
          </p>
        </div>

        {/* Wire B */}
        <div
          ref={wireBRef}
          className="relative flex-1 bg-wing-border min-[900px]:h-[2px] min-[900px]:w-auto min-[900px]:flex-1 w-[2px] h-24"
        >
          {anim.current.wireBDot.visible && (
            <Dot
              color="bg-wing-ai"
              glow="shadow-[0_0_12px_rgba(139,124,246,0.6)]"
              isVertical={isVertical}
              pos={anim.current.wireBDot.pos}
            />
          )}
          {streamDotsRendered
            .filter((d) => d.container === 'B')
            .map((d) => (
              <Dot
                key={d.key}
                color="bg-wing-ai"
                glow="shadow-[0_0_12px_rgba(139,124,246,0.6)]"
                isVertical={isVertical}
                pos={d.pos}
              />
            ))}
        </div>

        {/* AI node */}
        <div className="w-[130px] shrink-0 rounded-2xl border border-wing-ai bg-wing-raised p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-wing-ai/30">
            <Sparkles
              className={`h-5 w-5 text-wing-ai ${anim.current.aiSparkle ? 'animate-sparkle-pulse' : ''}`}
              aria-hidden="true"
            />
          </div>
          <p className="font-display text-base font-medium text-wing-text">AI</p>
          <p className="text-[11px] text-wing-dim">any model</p>
        </div>
      </div>

      {/* Chips */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Chip icon={ServerOff}>No servers to build</Chip>
        <Chip icon={KeyRound}>Keys never touch the app</Chip>
        <Chip icon={WifiOff}>Survives bad networks</Chip>
      </div>
    </div>
  )
}

function Dot({
  color,
  glow,
  isVertical,
  pos,
}: {
  color: string
  glow: string
  isVertical: boolean
  pos: number
}) {
  return (
    <span
      className={`absolute block h-2.5 w-2.5 rounded-full ${color} ${glow}`}
      style={{
        transform: isVertical ? `translateY(${pos}px)` : `translateX(${pos}px)`,
        top: isVertical ? 0 : '50%',
        left: isVertical ? '50%' : 0,
        marginTop: isVertical ? 0 : '-5px',
        marginLeft: isVertical ? '-5px' : 0,
      }}
      aria-hidden="true"
    />
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
    <span className="inline-flex items-center gap-2 rounded-full border border-wing-border px-4 py-2 text-sm text-wing-dim">
      <Icon className="h-4 w-4 text-wing-signal" />
      {children}
    </span>
  )
}

function ReducedMotionHero() {
  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-between gap-6 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
        <div className="relative w-[180px] shrink-0 rounded-3xl border border-wing-border bg-wing-raised p-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-wing-border" aria-hidden="true" />
          <div className="flex flex-col gap-3">
            <div className="self-end rounded-xl bg-wing-signal/15 px-3 py-2 text-sm text-wing-signal">
              Plan my day
            </div>
            <div className="min-h-[4.5rem] rounded-xl border border-wing-border bg-wing-bg px-3 py-2 text-sm text-wing-text">
              {ANSWER}
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-wing-dim">Your app</p>
        </div>

        <div className="h-24 w-[2px] bg-wing-border min-[900px]:h-[2px] min-[900px]:flex-1" />

        <div className="w-[170px] shrink-0 rounded-2xl border border-wing-signal bg-wing-raised p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-wing-signal/30">
            <Lock className="h-5 w-5 text-wing-signal" aria-hidden="true" />
          </div>
          <p className="font-display text-base font-medium text-wing-text">Wingport</p>
          <p className="text-[11px] leading-relaxed text-wing-dim">checks who&apos;s asking · keys stay here</p>
          <p className="mt-2 text-[11px] text-wing-signal">✓ user verified · ✓ within limits</p>
        </div>

        <div className="h-24 w-[2px] bg-wing-border min-[900px]:h-[2px] min-[900px]:flex-1" />

        <div className="w-[130px] shrink-0 rounded-2xl border border-wing-ai bg-wing-raised p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-wing-ai/30">
            <Sparkles className="h-5 w-5 text-wing-ai" aria-hidden="true" />
          </div>
          <p className="font-display text-base font-medium text-wing-text">AI</p>
          <p className="text-[11px] text-wing-dim">any model</p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Chip icon={ServerOff}>No servers to build</Chip>
        <Chip icon={KeyRound}>Keys never touch the app</Chip>
        <Chip icon={WifiOff}>Survives bad networks</Chip>
      </div>
    </div>
  )
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}
