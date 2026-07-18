'use client'

import { useEffect, useRef, forwardRef } from 'react'
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
const FRAME_MS = 50

export default function HeroWire() {
  const containerRef = useRef<HTMLDivElement>(null)
  const wireARef = useRef<HTMLDivElement>(null)
  const wireBRef = useRef<HTMLDivElement>(null)
  const chipContainerRef = useRef<HTMLDivElement>(null)
  const payloadRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const lockRef = useRef<SVGSVGElement>(null)
  const aiRef = useRef<SVGSVGElement>(null)
  const answerTextRef = useRef<HTMLSpanElement>(null)
  const answerWrapRef = useRef<HTMLDivElement>(null)

  const dotRefsA = useRef<(HTMLSpanElement | null)[]>([])
  const dotRefsB = useRef<(HTMLSpanElement | null)[]>([])

  const isVerticalRef = useRef(false)
  const lengthsRef = useRef({ a: 0, b: 0 })
  const rafRef = useRef<number>()
  const lastApplyRef = useRef(0)
  const prevRef = useRef({
    chip: '',
    payload: '',
    status: '',
    statusOpacity: -1,
    statusVisible: false,
    answer: '',
    answerOpacity: -1,
    lockPulse: false,
    aiSparkle: false,
    dots: '',
  })
  const stateRef = useRef({
    phase: 0,
    phaseStart: 0,
    chipOpacity: 1,
    chipLift: 0,
    chipSlide: 0,
    chipScale: 1,
    payloadVisible: false,
    payloadPos: 0,
    payloadScale: 1,
    payloadColor: 'signal' as 'signal' | 'ai',
    payloadStack: true,
    statusText: '',
    statusOpacity: 1,
    statusVisible: false,
    lockPulse: false,
    aiSparkle: false,
    streamDots: [] as { id: number; start: number }[],
    answer: '',
    answerOpacity: 1,
  })

  function measure() {
    const a = wireARef.current?.getBoundingClientRect()
    const b = wireBRef.current?.getBoundingClientRect()
    if (!a || !b) return
    const vertical = window.innerWidth < 900
    isVerticalRef.current = vertical
    lengthsRef.current = {
      a: vertical ? a.height : a.width,
      b: vertical ? b.height : b.width,
    }
  }

  function applyChipStyle(
    opacity: number,
    lift: number,
    slide: number,
    scale: number
  ) {
    const el = chipContainerRef.current
    if (!el) return
    const key = `${opacity};${lift};${slide};${scale}`
    if (prevRef.current.chip === key) return
    prevRef.current.chip = key
    el.style.opacity = String(opacity)
    el.style.transform = `translateY(${lift}px) translateX(${slide}px) scale(${scale})`
  }

  function applyPayload(style: {
    visible: boolean
    pos: number
    scale: number
    color: 'signal' | 'ai'
    stack: boolean
  }) {
    const el = payloadRef.current
    if (!el) return
    const key = `${style.visible};${style.pos};${style.scale};${style.color};${style.stack}`
    if (prevRef.current.payload === key) return
    prevRef.current.payload = key
    el.style.opacity = style.visible ? '0.6' : '0'
    if (style.visible) {
      el.style.backgroundColor = style.color === 'signal' ? '#3DDC97' : '#8B7CF6'
      const half = 6
      el.style.transform = isVerticalRef.current
        ? `translateY(${style.pos}px) scale(${style.scale})`
        : `translateX(${style.pos}px) scale(${style.scale})`
      el.style.top = isVerticalRef.current ? '0' : '50%'
      el.style.left = isVerticalRef.current ? '50%' : '0'
      el.style.marginTop = isVerticalRef.current ? '0' : `${-half}px`
      el.style.marginLeft = isVerticalRef.current ? `${-half}px` : '0'
      const stack1 = el.querySelector<HTMLElement>('.payload-stack-1')
      const stack2 = el.querySelector<HTMLElement>('.payload-stack-2')
      if (stack1) stack1.style.opacity = style.stack ? '1' : '0'
      if (stack2) stack2.style.opacity = style.stack ? '1' : '0'
    }
  }

  function applyStatus(text: string, opacity: number, visible: boolean) {
    const el = statusRef.current
    if (!el) return
    const key = `${text};${opacity};${visible}`
    if (prevRef.current.status === key && prevRef.current.statusOpacity === opacity && prevRef.current.statusVisible === visible) return
    prevRef.current.status = key
    prevRef.current.statusOpacity = opacity
    prevRef.current.statusVisible = visible
    el.style.opacity = visible ? String(opacity) : '0'
    if (visible) el.textContent = text
  }

  function applyAnswer(text: string, opacity: number) {
    const textEl = answerTextRef.current
    const wrap = answerWrapRef.current
    if (textEl && prevRef.current.answer !== text) {
      prevRef.current.answer = text
      textEl.textContent = text
    }
    if (wrap && prevRef.current.answerOpacity !== opacity) {
      prevRef.current.answerOpacity = opacity
      wrap.style.opacity = String(opacity)
    }
  }

  function applyDots(dots: { id: number; start: number }[], now: number) {
    const { a, b } = lengthsRef.current
    const total = a + b
    const speed = total > 0 ? total / STREAM_DURATION : 0

    const active: { container: 'A' | 'B'; id: number; pos: number }[] = []
    dots.forEach((dot) => {
      const age = now - dot.start
      const dist = age * speed
      if (dist < 0 || dist > total) return
      let container: 'A' | 'B'
      let pos = 0
      if (b > 0 && dist <= b) {
        container = 'B'
        const segP = dist / b
        pos = (1 - segP) * Math.max(0, b - 6)
      } else if (a > 0) {
        container = 'A'
        const distA = dist - b
        const segP = distA / a
        pos = (1 - segP) * Math.max(0, a - 6)
      } else {
        return
      }
      active.push({ container, id: dot.id, pos })
    })

    const key = JSON.stringify(active)
    if (prevRef.current.dots === key) return
    prevRef.current.dots = key

    for (let i = 0; i < STREAM_DOT_COUNT; i++) {
      const aEl = dotRefsA.current[i]
      const bEl = dotRefsB.current[i]
      if (aEl) aEl.style.opacity = '0'
      if (bEl) bEl.style.opacity = '0'
    }

    active.forEach(({ container, id, pos }) => {
      const el = container === 'A' ? dotRefsA.current[id] : dotRefsB.current[id]
      if (!el) return
      const half = 3
      el.style.opacity = '0.6'
      el.style.backgroundColor = '#8B7CF6'
      el.style.transform = isVerticalRef.current
        ? `translateY(${pos}px)`
        : `translateX(${pos}px)`
      el.style.top = isVerticalRef.current ? '0' : '50%'
      el.style.left = isVerticalRef.current ? '50%' : '0'
      el.style.marginTop = isVerticalRef.current ? '0' : `${-half}px`
      el.style.marginLeft = isVerticalRef.current ? `${-half}px` : '0'
    })
  }

  function applyPulse(lock: boolean, ai: boolean) {
    const lockEl = lockRef.current
    const aiEl = aiRef.current
    if (lockEl && prevRef.current.lockPulse !== lock) {
      prevRef.current.lockPulse = lock
      lockEl.classList.toggle('animate-pulse-scale', lock)
    }
    if (aiEl && prevRef.current.aiSparkle !== ai) {
      prevRef.current.aiSparkle = ai
      aiEl.classList.toggle('animate-pulse-scale', ai)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const motionQ = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reduced = motionQ.matches

    measure()
    window.addEventListener('resize', measure)

    if (reduced) {
      applyAnswer(ANSWER, 1)
      applyStatus(STATUS_CHECKS.join(''), 1, true)
      applyChipStyle(1, 0, 0, 1)
      return () => window.removeEventListener('resize', measure)
    }

    const state = stateRef.current
    state.phase = 0

    function nextPhase(now: number, idx: number) {
      state.phase = idx % PHASES.length
      state.phaseStart = now
      state.streamDots = []
      if (state.phase === 0) {
        state.answer = ''
        state.answerOpacity = 1
        state.statusVisible = false
        state.chipOpacity = 1
        state.chipLift = 0
        state.chipSlide = 0
        state.chipScale = 1
      }
    }

    function loop(now: number) {
      const phaseIdx = state.phase
      const phase = PHASES[phaseIdx]
      const duration = phase.key === 'type' ? TYPE_DURATION : phase.duration
      const elapsed = now - state.phaseStart
      const p = Math.min(1, Math.max(0, elapsed / duration))
      const { a, b } = lengthsRef.current

      switch (phase.key) {
        case 'gather': {
          const e = easeOut(p)
          state.chipOpacity = 1 - e * 0.6
          state.chipLift = -4 * e
          state.chipSlide = 14 * e
          state.chipScale = 1 - e * 0.2
          state.payloadVisible = true
          state.payloadPos = 0
          state.payloadScale = e
          state.payloadColor = 'signal'
          state.payloadStack = true
          break
        }
        case 'ask': {
          state.chipOpacity = 0.4
          state.chipLift = -4
          state.chipSlide = 14
          state.chipScale = 0.8
          state.payloadVisible = true
          state.payloadPos = easeInOut(p) * Math.max(0, a - 10)
          state.payloadScale = 1
          state.payloadColor = 'signal'
          state.payloadStack = true
          break
        }
        case 'verify': {
          state.chipOpacity = 0.4
          state.chipLift = -4
          state.chipSlide = 14
          state.chipScale = 0.8
          state.payloadVisible = true
          state.payloadPos = Math.max(0, a - 10)
          state.payloadScale = 1
          state.payloadColor = 'signal'
          state.payloadStack = true
          const checkIndex = Math.min(STATUS_CHECKS.length - 1, Math.floor(elapsed / 250))
          state.statusVisible = true
          state.statusText = STATUS_CHECKS.slice(0, checkIndex + 1).join('')
          state.lockPulse = true
          break
        }
        case 'forward': {
          state.chipOpacity = 0.4
          state.chipLift = -4
          state.chipSlide = 14
          state.chipScale = 0.8
          state.payloadVisible = true
          state.payloadPos = easeInOut(p) * Math.max(0, b - 10)
          state.payloadScale = 1
          state.payloadColor = 'ai'
          state.payloadStack = false
          state.statusVisible = true
          state.statusText = STATUS_CHECKS.join('')
          state.statusOpacity = 1 - p
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
          state.answer = ANSWER.slice(0, idx)
          state.chipOpacity = 0.4 + Math.min(1, p / 0.3) * 0.6
          state.chipLift = -4 * (1 - Math.min(1, p / 0.3))
          state.chipSlide = 14 * (1 - Math.min(1, p / 0.3))
          state.chipScale = 0.8 + Math.min(1, p / 0.3) * 0.2
          break
        }
        case 'hold': {
          state.answer = ANSWER
          state.chipOpacity = 1
          state.chipLift = 0
          state.chipSlide = 0
          state.chipScale = 1
          break
        }
        case 'reset': {
          state.answer = ANSWER
          state.answerOpacity = 1 - p
          state.chipOpacity = 1
          state.chipLift = 0
          state.chipSlide = 0
          state.chipScale = 1
          break
        }
      }

      if (now - lastApplyRef.current >= FRAME_MS) {
        lastApplyRef.current = now
        applyChipStyle(state.chipOpacity, state.chipLift, state.chipSlide, state.chipScale)
        applyPayload({
          visible: state.payloadVisible,
          pos: state.payloadPos,
          scale: state.payloadScale,
          color: state.payloadColor,
          stack: state.payloadStack,
        })
        applyStatus(state.statusText, state.statusOpacity, state.statusVisible)
        applyAnswer(state.answer, state.answerOpacity)
        applyDots(state.streamDots, now)
        applyPulse(state.lockPulse, state.aiSparkle)
      }

      state.lockPulse = false
      state.aiSparkle = false
      if (state.statusOpacity < 1) state.statusOpacity = 1

      if (elapsed >= duration) {
        nextPhase(now, phaseIdx + 1)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    const timer = setTimeout(() => {
      state.phaseStart = performance.now()
      rafRef.current = requestAnimationFrame(loop)
    }, 300)

    return () => {
      window.removeEventListener('resize', measure)
      clearTimeout(timer)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

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
              ref={chipContainerRef}
              className="flex flex-wrap justify-end gap-1.5"
              style={{ transformOrigin: 'right center' }}
            >
              <ContextChip icon={FileText}>profile.json</ContextChip>
              <ContextChip icon={Briefcase}>job posting</ContextChip>
            </div>
            <div
              ref={answerWrapRef}
              className="min-h-[4.5rem] rounded-xl border border-wing-border bg-wing-bg px-3 py-2 text-sm text-wing-text break-words"
            >
              <span ref={answerTextRef} />
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
          <PayloadDot ref={payloadRef} />
          {[0, 1, 2].map((i) => (
            <Dot key={`a-${i}`} ref={(el) => { dotRefsA.current[i] = el }} />
          ))}
        </div>

        {/* Wingport node */}
        <div className="relative z-10 w-[180px] min-w-0 shrink-0 rounded-2xl border border-wing-signal bg-wing-raised p-4 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-wing-signal/30">
            <Lock
              ref={lockRef}
              className="h-[22px] w-[22px] text-wing-signal"
              aria-hidden="true"
            />
          </div>
          <p className="break-words font-display text-base font-medium text-wing-text">Wingport</p>
          <p className="break-words text-[11px] leading-relaxed text-wing-dim">
            checks who&apos;s asking · keys stay here
          </p>
          <div className="mt-2 min-h-[2.5rem]">
            <p
              ref={statusRef}
              className="break-words text-[11px] leading-tight text-wing-signal transition-opacity duration-200"
              aria-live="polite"
            />
          </div>
        </div>

        {/* Wire B */}
        <div
          ref={wireBRef}
          className="relative flex-1 bg-wing-border min-[900px]:h-[2px] min-[900px]:w-auto min-[900px]:flex-1 w-[2px] h-24"
        >
          {[0, 1, 2].map((i) => (
            <Dot key={`b-${i}`} ref={(el) => { dotRefsB.current[i] = el }} />
          ))}
        </div>

        {/* AI node */}
        <div className="w-[130px] min-w-0 shrink-0 rounded-2xl border border-wing-ai bg-wing-raised p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-wing-ai/30">
            <Sparkles
              ref={aiRef}
              className="h-5 w-5 text-wing-ai"
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
    <span className="inline-flex max-w-full items-center gap-1.5 whitespace-normal rounded-full border border-wing-signal/50 bg-wing-bg px-2 py-1 text-[11px] text-wing-signal break-words">
      <Icon className="h-3 w-3 shrink-0" />
      {children}
    </span>
  )
}

const Dot = forwardRef<HTMLSpanElement>((_, ref) => (
  <span
    ref={ref}
    className="absolute block rounded-full"
    style={{
      width: 6,
      height: 6,
      opacity: 0,
      boxShadow: '0 0 12px currentColor',
    }}
    aria-hidden="true"
  />
))
Dot.displayName = 'Dot'

const PayloadDot = forwardRef<HTMLSpanElement>((_, ref) => (
  <span
    ref={ref}
    className="absolute flex items-center justify-center rounded-full"
    style={{
      width: 12,
      height: 12,
      opacity: 0,
      boxShadow: '0 0 12px currentColor',
    }}
    aria-hidden="true"
  >
    <span className="payload-stack-1 absolute h-1.5 w-1.5 rounded-[1px] bg-wing-bg/90" />
    <span className="payload-stack-2 absolute h-1.5 w-1.5 rounded-[1px] bg-wing-bg/70" />
  </span>
))
PayloadDot.displayName = 'PayloadDot'

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
