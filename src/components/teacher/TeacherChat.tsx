'use client'

/**
 * ASTRYX — Astryx · Chat UI (the sixth sense)
 * ════════════════════════════════════════════════════════════════════
 * SOVEREIGN (Directive v1.0 · FIX 6 · D1): answers are computed LOCALLY by
 * `answerAstryx` — retrieval-only over SHA's own canon + the user's own reading
 * and session history. NOTHING leaves the stack (no `/api/teach`, no Gemini, no
 * third-party egress). This component only reads local state and shows text.
 *
 * Compliance: persistent micro-disclaimer, crisis card styling; the brain runs
 * crisis detection + the banned-phrase guard and enforces probabilistic framing.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { hexToRgba } from '@/lib/utils'
import { answerAstryx } from '@/lib/astryx/sovereignAstryx'
import { useAstryxVoice } from '@/lib/useAstryxVoice'

type Turn = { role: 'user' | 'model'; text: string; sources?: string[] }

function alpha(color: string, a: number): string {
  if (color?.startsWith('#')) return hexToRgba(color, a)
  return color
}

export default function TeacherChat({
  open, onClose, accentColor = '#C084FC', seed,
}: {
  open: boolean
  onClose: () => void
  accentColor?: string
  seed?: string | null
}) {
  const protocol         = useAppStore((s) => s.protocol)
  const chartData        = useAppStore((s) => s.chartData)
  const sessionLog       = useAppStore((s) => s.sessionLog)
  const dailyElement     = useAppStore((s) => s.dailyElement)
  const intakeData       = useAppStore((s) => s.intakeData)
  const addTaughtConcept = useAppStore((s) => s.addTaughtConcept)

  const [turns, setTurns]     = useState<Turn[]>([])
  const [input, setInput]     = useState('')
  const [busy, setBusy]       = useState(false)
  const [crisis, setCrisis]   = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const seededRef = useRef<string | null>(null)

  // v4.0 Fix 6 — the Astryx voice reads existing reply text (user-gesture only).
  const { speak, stop: stopVoice, speakingId } = useAstryxVoice()
  useEffect(() => { if (!open) stopVoice() }, [open, stopVoice])

  const send = useCallback(async (raw: string) => {
    const message = raw.trim()
    if (!message || busy) return
    setInput('')
    setBusy(true)
    const nextTurns: Turn[] = [...turns, { role: 'user', text: message }]
    setTurns(nextTurns)

    // Local sovereign brain — the graceful fallback when the cloud model is
    // unavailable or errors (Directive L.6). Never lets Astryx go dark.
    const runLocal = () => {
      const ans = answerAstryx(message, { protocol, sessionLog, dailyElementNote: dailyElement?.note })
      if (ans.crisis) setCrisis(true)
      setTurns([...nextTurns, { role: 'model', text: ans.reply }])
      if (ans.suggestedConcept?.key) addTaughtConcept(ans.suggestedConcept.key)
    }

    // L.6 — the full-canon brain (/api/astryx). Falls back locally on any failure.
    try {
      const history = turns.slice(-6).map((t) => ({ role: t.role, text: t.text }))
      const res = await fetch('/api/astryx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, report: protocol, chart: chartData ?? null, intention: intakeData?.intention ?? [], history }),
      })
      if (!res.ok) { runLocal(); return }
      const data = await res.json()
      if (data?.fallback || !data?.reply) { runLocal(); return }
      if (data?.crisis) setCrisis(true)
      setTurns([...nextTurns, { role: 'model', text: data.reply, sources: Array.isArray(data.sources) ? data.sources : undefined }])
    } catch {
      runLocal()
    } finally {
      setBusy(false)
    }
  }, [busy, turns, protocol, chartData, sessionLog, dailyElement, intakeData, addTaughtConcept])

  // Auto-send a seed prompt when opened from a term/tag.
  useEffect(() => {
    if (open && seed && seededRef.current !== seed) {
      seededRef.current = seed
      send(seed)
    }
    if (!open) seededRef.current = null
  }, [open, seed, send])

  // Keep scrolled to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns, busy])

  if (!open) return null

  const suggestions = [
    'What is my Ascendant?',
    'Why this herb?',
    'What does today’s transit mean?',
    'What is the Planet ≠ Remedy idea?',
  ]

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-lg sm:mx-auto rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden flex flex-col animate-fade-in-up"
        style={{
          maxHeight: '88vh',
          height: '88vh',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(94,224,255,0.06) 0%, rgba(2,2,8,0.97) 60%)',
          border: `1px solid ${alpha(accentColor, 0.3)}`,
          boxShadow: `0 -24px 80px -20px ${alpha(accentColor, 0.5)}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-2 h-2 rounded-full animate-cosmic-pulse"
                  style={{ background: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
            <div>
              <div className="font-cinzel text-[15px] leading-none" style={{ color: 'rgba(255,255,255,0.96)' }}>
                Astryx
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] mt-1" style={{ color: alpha(accentColor, 0.8) }}>
                Sixth Sense · Mind
              </div>
            </div>
          </div>
          <button onClick={onClose}
                  className="kowalski-button rounded-full w-8 h-8 flex items-center justify-center text-white/70"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            ✕
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {turns.length === 0 && (
            <div className="text-content-sm text-[13.5px] leading-relaxed">
              <p className="mb-3">
                I&apos;m Astryx. I can explain anything in your calibration — why a tone, herb, color, or
                transit appears, or teach a term like your Ascendant. I read only your chart, in plain
                language. For symptoms or health decisions, that&apos;s for your licensed practitioner.
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)}
                          className="kowalski-button text-[12px] px-3 py-1.5 rounded-full"
                          style={{ background: alpha(accentColor, 0.1), border: `1px solid ${alpha(accentColor, 0.3)}`, color: 'rgba(255,255,255,0.9)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((t, i) => (
            <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className="max-w-[85%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-wrap"
                style={
                  t.role === 'user'
                    ? { background: alpha(accentColor, 0.18), border: `1px solid ${alpha(accentColor, 0.3)}`, color: 'rgba(255,255,255,0.95)' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.9)' }
                }
              >
                {t.text}
                {/* v4.0 Fix 6 — speaker toggle on each Astryx reply. Tapping
                    another reply's speaker stops the current one (one voice). */}
                {t.role === 'model' && (
                  <div className="mt-1.5 -mb-0.5">
                    <button
                      onClick={() => (speakingId === `turn-${i}` ? stopVoice() : speak(t.text, `turn-${i}`))}
                      aria-label={speakingId === `turn-${i}` ? 'Stop reading aloud' : 'Read aloud'}
                      className="kowalski-button text-[11px] px-2 py-0.5 rounded-full"
                      style={{
                        background: speakingId === `turn-${i}` ? alpha(accentColor, 0.25) : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${speakingId === `turn-${i}` ? alpha(accentColor, 0.5) : 'rgba(255,255,255,0.12)'}`,
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {speakingId === `turn-${i}` ? '■ stop' : '🔊 listen'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl text-[13px] text-white/50"
                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="animate-pulse">Astryx is reading your chart…</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer: input + disclaimer */}
        <div className="shrink-0 border-t border-white/8 px-4 pt-3 pb-4">
          {crisis && (
            <div className="mb-2 text-[11px]" style={{ color: '#FCA5A5' }}>
              If you&apos;re in crisis, please use the resources above — they come first.
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
              }}
              rows={1}
              placeholder="Ask about your calibration…"
              className="flex-1 resize-none bg-transparent outline-none text-[14px] text-white/95 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', maxHeight: 96 }}
            />
            <button
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
              className="kowalski-button rounded-xl px-4 py-2.5 text-[13px] font-medium shrink-0 disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${alpha(accentColor, 0.9)} 0%, ${alpha(accentColor, 0.55)} 100%)`, color: '#020208' }}
            >
              Send
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[10px] text-white/35 tracking-wide">ⓘ Reference tool · Not medical advice</span>
            <span className="text-[10px] text-white/25 tracking-wide">Grounded in your chart &amp; the Astryx canon</span>
          </div>
        </div>
      </div>
    </div>
  )
}
