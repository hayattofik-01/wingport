'use client'

import { useEffect, useRef, useState } from 'react'
import { Lock, Sparkles, FileText, Briefcase } from 'lucide-react'

const PHASES = [
  { key: 'gather', duration: 800 },
  { key: 'ask', duration: 900 },
  { key: 'verify', duration: 900 },
  { key: 'forward', duration: 700 },
  { key: 'think', duration: 500 },
  { key: 'stream', duration: 1400 },
  { key: 'type', duration: 0 },
  { key: 'hold', duration: 2500 },
  { key: 'reset', duration: 400 },
] as const

const ANSWER = 'Flutter Developer · 3 yrs — shipped 4 production apps, cut crash rate 80%…'
const CHAR_MS = 28
const TYPE_DURATION = Math.max(2100, ANSWER.length * CHAR_MS)

const STATUS_CHECKS = ['✓ user verified', ' · ✓ within limits', ' · ✓ key attached']
const STREAM_DURATION = 1100
const STREAM_STAGGER = 150
const STREAM_DOT_COUNT = 3

export default function HeroWire() {
  const containerRef = useRef<HTMLDivElement>(null)
  const wireARef = useRef<HTMLDivElement>(null)
  const wireBRef = useRef<HTMLDivElement>(null)

  const [isVertical, setIsVertical] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [tick, setTick] = useState(0)

  const anim = useRef({
    phase: 0,
    phaseStart: 0,
    lengths: { a: 0, b: 0 },
    chipOpacity: 1,
    chipLift: 0,
    chipSlide: 0,
    chipScale: 1,
    payload: {
      visible: false,
      pos: 0,
      scale: 1,
      color: 'signal' as 'signal' | 'ai',
      stack: true,
    },
    status: { visible: false, text: '', opacity: 1 },
    lockPulse: false,
    aiSparkle: false,
    streamDots: [] as { id: number; start: number }[],
    answer: { text: '', opacity: 1 },
    rafId: 0 as unknown as number,
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
      anim.current.answer.text = ANSWER
      anim.current.status = { visible: true, text: STATUS_CHECKS.join(''), opacity: 1 }
      setTick((t) => t + 1)
      return () => motionQ.removeEventListener('change', onMotion)
    }

    anim.current.phaseStart = performance.now()
    anim.current.phase = 0

    function nextPhase(now: number, idx: number) {
      const state = anim.current
      state.phase = idx % PHASES.length
      state.phaseStart = now
      state.streamDots = []
      if (state.phase === 0) {
        state.answer.text = ''
        state.answer.opacity = 1
        state.status = { visible: false, text: '', opacity: 1 }
        state.chipOpacity = 1
        state.chipLift = 0
        state.chipSlide = 0
        state.chipScale = 1
      }
    }

    function loop(now: number) {
      const state = anim.current
      const phaseIdx = state.phase
      const phase = PHASES[phaseIdx]
      const duration = phase.key === 'type' ? TYPE_DURATION : phase.duration
      const elapsed = now - state.phaseStart
      const p = Math.min(1, Math.max(0, elapsed / duration))
      const { a, b } = state.lengths
      const total = a + b

      // defaults
      state.lockPulse = false
      state.aiSparkle = false
      state.payload.visible = false

      switch (phase.key) {
        case 'gather': {
          const e = easeOut(p)
          state.chipOpacity = 1 - e * 0.6
          state.chipLift = -4 * e
          state.chipSlide = 14 * e
          state.chipScale = 1 - e * 0.2
          state.payload = {
            visible: true,
            pos: 0,
            scale: e,
            color: 'signal',
            stack: true,
          }
          break
        }
        case 'ask': {
          state.chipOpacity = 0.4
          state.chipLift = -4
          state.chipSlide = 14
          state.chipScale = 0.8
          state.payload = {
            visible: true,
            pos: easeInOut(p) * Math.max(0, a - 10),
            scale: 1,
            color: 'signal',
            stack: true,
          }
          break
        }
        case 'verify': {
          state.chipOpacity = 0.4
          state.chipLift = -4
          state.chipSlide = 14
          state.chipScale = 0.8
          state.payload = {
            visible: true,
            pos: Math.max(0, a - 10),
            scale: 1,
            color: 'signal',
            stack: true,
          }
          const checkIndex = Math.min(STATUS_CHECKS.length - 1, Math.floor(elapsed / 250))
          state.status = {
            visible: true,
            text: STATUS_CHECKS.slice(0, checkIndex + 1).join(''),
            opacity: 1,
          }
          state.lockPulse = true
          break
        }
        case 'forward': {
          state.chipOpacity = 0.4
          state.chipLift = -4
          state.chipSlide = 14
          state.chipScale = 0.8
          state.payload = {
            visible: true,
            pos: easeInOut(p) * Math.max(0, b - 10),
            scale: 1,
            color: 'ai',
            stack: false,
          }
          state.status = {
            visible: true,
            text: STATUS_CHECKS.join(''),
            opacity: 1 - p,
          }
          break
        }
        case 'think': {
          state.aiSparkle = true
          break
        }
        case 'stream': {
          for (let i = 0; i < STREAM_DOT_COUNT; i++) {
            const start = i * STREAM_STAGGER
            if (elapsed >= start && !state.streamDots.find((d) => d.id === i)) {
              state.streamDots.push({ id: i, start: now - (elapsed - start) })
            }
          }
          break
        }
        case 'type': {
          const idx = Math.min(ANSWER.length, Math.floor(p * ANSWER.length))
          state.answer.text = ANSWER.slice(0, idx)
          state.chipOpacity = 0.4 + Math.min(1, p / 0.3) * 0.6
          state.chipLift = -4 * (1 - Math.min(1, p / 0.3))
          state.chipSlide = 14 * (1 - Math.min(1, p / 0.3))
          state.chipScale = 0.8 + Math.min(1, p / 0.3) * 0.2
          break
        }
        case 'hold': {
          state.answer.text = ANSWER
          state.chipOpacity = 1
          state.chipLift = 0
          state.chipSlide = 0
          state.chipScale = 1
          break
        }
        case 'reset': {
          state.answer.text = ANSWER
          state.answer.opacity = 1 - p
          state.chipOpacity = 1
          state.chipLift = 0
          state.chipSlide = 0
          state.chipScale = 1
          break
        }
      }

      if (elapsed >= duration) {
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
  }, [reducedMotion])

  const { a, b } = anim.current.lengths
  const total = a + b
  const speed = total > 0 ? total / STREAM_DURATION : 0

  const streamDots = anim.current.streamDots
    .map((dot) => {
      const age = performance.now() - dot.start
      const dist = age * speed
      if (dist < 0 || dist > total) return null

      if (b > 0 && dist <= b) {
        const segP = dist / b
        const pos = (1 - segP) * Math.max(0, b - 6)
        return { key: dot.id, color: 'ai' as const, container: 'B' as const, pos, size: 6 }
      }
      if (a > 0) {
        const distA = dist - b
        const segP = distA / a
        const pos = (1 - segP) * Math.max(0, a - 6)
        return { key: dot.id, color: 'ai' as const, container: 'A' as const, pos, size: 6 }
      }
      return null
    })
    .filter(Boolean) as {
    key: number
    color: 'ai'
    container: 'A' | 'B'
    pos: number
    size: number
  }[]

  if (reducedMotion) {
    return <ReducedMotionHero />
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="flex flex-col items-center justify-between gap-0 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between"
        aria-label="Animation showing context data flowing from a phone through Wingport to AI and an answer streaming back"
      >
        {/* Phone card */}
        <div className="relative w-[190px] shrink-0 rounded-3xl border border-wing-border bg-wing-raised p-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-wing-border" aria-hidden="true" />
          <div className="flex flex-col gap-2">
            <div className="max-w-[80%] self-end rounded-xl bg-wing-signal/15 px-3 py-2 text-sm text-wing-signal break-words">
              Write my resume
            </div>
            <div
              className="flex flex-wrap justify-end gap-1.5"
              style={{
                opacity: anim.current.chipOpacity,
                transform: `translateY(${anim.current.chipLift}px) translateX(${anim.current.chipSlide}px) scale(${anim.current.chipScale})`,
              }}
            >
              <ContextChip icon={FileText}>profile.json</ContextChip>
              <ContextChip icon={Briefcase}>job posting</ContextChip>
            </div>
            <div
              className="min-h-[4.5rem] rounded-xl border border-wing-border bg-wing-bg px-3 py-2 text-sm text-wing-text break-words"
              style={{ opacity: anim.current.answer.opacity }}
            >
              {anim.current.answer.text}
              <span
                className="ml-0.5 inline-block w-2 animate-blink bg-current align-middle"
                style={{ height: '1em' }}
              >
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
          {anim.current.payload.visible && anim.current.payload.color === 'signal' && (
            <PayloadDot
              isVertical={isVertical}
              pos={anim.current.payload.pos}
              scale={anim.current.payload.scale}
              stack={anim.current.payload.stack}
            />
          )}
          {streamDots
            .filter((d) => d.container === 'A')
            .map((d) => (
              <Dot key={d.key} isVertical={isVertical} pos={d.pos} size={d.size} color="ai" />
            ))}
        </div>

        {/* Wingport node */}
        <div className="relative z-10 w-[180px] min-w-0 shrink-0 rounded-2xl border border-wing-signal bg-wing-raised p-4 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-wing-signal/30">
            <Lock
              className={`h-[22px] w-[22px] text-wing-signal ${anim.current.lockPulse ? 'animate-pulse-scale' : ''}`}
              aria-hidden="true"
            />
          </div>
          <p className="break-words font-display text-base font-medium text-wing-text">Wingport</p>
          <p className="break-words text-[11px] leading-relaxed text-wing-dim">
            checks who&apos;s asking · keys stay here
          </p>
          <div className="mt-2 min-h-[2.5rem]">
            <p
              className="break-words text-[11px] leading-tight text-wing-signal transition-opacity duration-200"
              style={{ opacity: anim.current.status.opacity }}
              aria-live="polite"
            >
              {anim.current.status.visible && anim.current.status.text}
            </p>
          </div>
        </div>

        {/* Wire B */}
        <div
          ref={wireBRef}
          className="relative flex-1 bg-wing-border min-[900px]:h-[2px] min-[900px]:w-auto min-[900px]:flex-1 w-[2px] h-24"
        >
          {anim.current.payload.visible && anim.current.payload.color === 'ai' && (
            <PayloadDot isVertical={isVertical} pos={anim.current.payload.pos} scale={anim.current.payload.scale} stack={false} ai />
          )}
          {streamDots
            .filter((d) => d.container === 'B')
            .map((d) => (
              <Dot key={d.key} isVertical={isVertical} pos={d.pos} size={d.size} color="ai" />
            ))}
        </div>

        {/* AI node */}
        <div className="w-[130px] min-w-0 shrink-0 rounded-2xl border border-wing-ai bg-wing-raised p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-wing-ai/30">
            <Sparkles
              className={`h-5 w-5 text-wing-ai ${anim.current.aiSparkle ? 'animate-pulse-scale' : ''}`}
              aria-hidden="true"
            />
          </div>
          <p className="break-words font-display text-base font-medium text-wing-text">AI</p>
          <p className="break-words text-[11px] text-wing-dim">any model</p>
        </div>
      </div>

    </div>
  )
}

function ContextChip({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 whitespace-normal rounded-full border border-wing-signal/50 px-2 py-1 text-[11px] text-wing-signal break-words">
      <Icon className="h-3 w-3 shrink-0" />
      {children}
    </span>
  )
}


function Dot({
  isVertical,
  pos,
  size,
  color,
}: {
  isVertical: boolean
  pos: number
  size: number
  color: 'signal' | 'ai'
}) {
  const colorClass = color === 'signal' ? 'bg-wing-signal' : 'bg-wing-ai'
  const half = size / 2
  return (
    <span
      className={`absolute block rounded-full ${colorClass}`}
      style={{
        width: size,
        height: size,
        transform: isVertical ? `translateY(${pos}px)` : `translateX(${pos}px)`,
        top: isVertical ? 0 : '50%',
        left: isVertical ? '50%' : 0,
        marginTop: isVertical ? 0 : -half,
        marginLeft: isVertical ? -half : 0,
        boxShadow: '0 0 12px currentColor',
        opacity: 0.6,
      }}
      aria-hidden="true"
    />
  )
}

function PayloadDot({
  isVertical,
  pos,
  scale,
  stack,
  ai = false,
}: {
  isVertical: boolean
  pos: number
  scale: number
  stack: boolean
  ai?: boolean
}) {
  const colorClass = ai ? 'bg-wing-ai' : 'bg-wing-signal'
  const size = 12
  const half = size / 2
  return (
    <span
      className={`absolute flex items-center justify-center rounded-full ${colorClass}`}
      style={{
        width: size,
        height: size,
        transform: isVertical ? `translateY(${pos}px) scale(${scale})` : `translateX(${pos}px) scale(${scale})`,
        top: isVertical ? 0 : '50%',
        left: isVertical ? '50%' : 0,
        marginTop: isVertical ? 0 : -half,
        marginLeft: isVertical ? -half : 0,
        boxShadow: '0 0 12px currentColor',
        opacity: 0.6,
      }}
      aria-hidden="true"
    >
      {stack && (
        <>
          <span className="absolute h-1.5 w-1.5 rounded-[1px] bg-wing-bg/90" style={{ top: 3, left: 3 }} />
          <span className="absolute h-1.5 w-1.5 rounded-[1px] bg-wing-bg/70" style={{ top: 5, left: 5 }} />
        </>
      )}
    </span>
  )
}

function ReducedMotionHero() {
  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-between gap-6 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
        <div className="relative w-[190px] shrink-0 rounded-3xl border border-wing-border bg-wing-raised p-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-wing-border" aria-hidden="true" />
          <div className="flex flex-col gap-2">
            <div className="max-w-[80%] self-end rounded-xl bg-wing-signal/15 px-3 py-2 text-sm text-wing-signal break-words">
              Write my resume
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              <ContextChip icon={FileText}>profile.json</ContextChip>
              <ContextChip icon={Briefcase}>job posting</ContextChip>
            </div>
            <div className="min-h-[4.5rem] rounded-xl border border-wing-border bg-wing-bg px-3 py-2 text-sm text-wing-text">
              {ANSWER}
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-wing-dim">Your app</p>
        </div>

        <div className="h-24 w-[2px] bg-wing-border min-[900px]:h-[2px] min-[900px]:flex-1" />

        <div className="w-[180px] shrink-0 rounded-2xl border border-wing-signal bg-wing-raised p-4 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-wing-signal/30">
            <Lock className="h-[22px] w-[22px] text-wing-signal" aria-hidden="true" />
          </div>
          <p className="font-display text-base font-medium text-wing-text">Wingport</p>
          <p className="text-[11px] leading-relaxed text-wing-dim">checks who&apos;s asking · keys stay here</p>
          <p className="mt-2 text-[11px] text-wing-signal">{STATUS_CHECKS.join('')}</p>
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

    </div>
  )
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
