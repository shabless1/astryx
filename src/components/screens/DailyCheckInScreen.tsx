'use client'

/**
 * ASTRYX — Daily Check-In  (Directive v1.0 · FIX 1 — the daily door)
 * ════════════════════════════════════════════════════════════════════════════
 * The ~20-second light input the returning user gives EVERY day. Birth data is
 * never re-asked (it's the permanent natal key). This collects only today's
 * variables, which are fed straight into a FRESH calibration recompute:
 *   • energy slider (today's "before", 1–10)
 *   • "What's present for you today?" (the daily question → engine narrative)
 *   • optional intention chip (calm / focus / ground / energize)
 *
 * The recompute keys on storedNatal + today's date + today's transits + this
 * question + this feeling, so the signal/carrier/fork sequence differ day-to-day
 * and question-to-question. (No caching of yesterday's reading as today's.)
 *
 * Compliance: the free-text field runs through detectCrisis() before any compute;
 * a crisis match pauses the flow and shows resources. "Reference tool · not
 * medical advice" persists.
 */

import { useState } from 'react'
import { hexToRgba } from '@/lib/utils'
import { MICRO_DISCLAIMER, detectCrisis, CRISIS_RESOURCES_CARD } from '@/lib/compliance'

export interface DailyInput {
  energy: number
  question: string
  intention: string | null
}

const INTENTIONS: { key: string; label: string; glyph: string }[] = [
  { key: 'calm',     label: 'Calm',     glyph: '◡' },
  { key: 'focus',    label: 'Focus',    glyph: '◉' },
  { key: 'ground',   label: 'Ground',   glyph: '⬡' },
  { key: 'energize', label: 'Energize', glyph: '✦' },
]

export default function DailyCheckInScreen({
  accentColor, userName, onCalibrate,
}: {
  accentColor: string
  userName?: string
  onCalibrate: (input: DailyInput) => void
}) {
  const [energy, setEnergy] = useState(5)
  const [question, setQuestion] = useState('')
  const [intention, setIntention] = useState<string | null>(null)
  const [crisis, setCrisis] = useState(false)

  const firstName = (userName ?? '').trim().split(/\s+/)[0]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const handleCalibrate = () => {
    // Crisis keywords trump the flow (COMPLIANCE.md).
    if (detectCrisis(question).isCrisis) { setCrisis(true); return }
    onCalibrate({ energy, question: question.trim(), intention })
  }

  if (crisis) {
    return (
      <div className="min-h-screen font-rajdhani flex items-center justify-center px-5">
        <div
          className="max-w-md w-full rounded-[2rem] p-7"
          style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(255,0,110,0.4)', boxShadow: '0 28px 60px -30px rgba(255,0,110,0.5)' }}
        >
          <div className="text-[10px] uppercase tracking-[0.28em] mb-3" style={{ color: '#FF006E' }}>Immediate support</div>
          <p className="text-[14px] text-content leading-relaxed whitespace-pre-line">{CRISIS_RESOURCES_CARD}</p>
          <button
            onClick={() => setCrisis(false)}
            className="kowalski-button w-full mt-6 rounded-2xl px-5 py-3 text-[13px]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.85)' }}
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-rajdhani pb-28">
      <div className="max-w-xl mx-auto px-5" style={{ paddingTop: 96 }}>

        <div className="mb-6 animate-fade-in-up">
          <div className="text-[10px] uppercase tracking-[0.3em] text-meta mb-1">{today}</div>
          <h1 className="font-cinzel text-[26px] sm:text-[30px] leading-tight text-white">
            Daily Check-In{firstName ? <span className="text-white/45"> · {firstName}</span> : null}
          </h1>
          <p className="text-[13px] text-content-sm mt-2 leading-relaxed">
            A quick check-in tunes today&apos;s calibration to the live sky. Your chart is already saved — this is just today.
          </p>
        </div>

        {/* Energy slider */}
        <div className="rounded-[1.4rem] p-5 mb-4 animate-fade-in-up"
             style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[10px] uppercase tracking-[0.24em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>
            Energy right now
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const on = energy === n
              return (
                <button
                  key={n}
                  onClick={() => setEnergy(n)}
                  className="flex-1 py-2.5 rounded-lg text-[12px] transition"
                  style={{
                    background: on ? hexToRgba(accentColor, 0.28) : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${on ? accentColor : 'rgba(255,255,255,0.1)'}`,
                    color: on ? accentColor : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: on ? 600 : 400,
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>
          <div className="flex justify-between text-[9px] text-white/35 tracking-widest mt-1.5">
            <span>DEPLETED</span><span>CHARGED</span>
          </div>
        </div>

        {/* Daily question */}
        <div className="rounded-[1.4rem] p-5 mb-4 animate-fade-in-up"
             style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[10px] uppercase tracking-[0.24em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>
            What&apos;s present for you today?
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="In your own words — e.g. &ldquo;wired and anxious&rdquo;, &ldquo;foggy, can&rsquo;t focus&rdquo;, &ldquo;heavy and slow&rdquo;…"
            className="w-full px-3 py-2.5 rounded-lg text-[14px] text-white resize-none placeholder:text-white/30"
            style={{ background: 'rgba(15,15,26,0.65)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        {/* Intention chip (optional) */}
        <div className="rounded-[1.4rem] p-5 mb-4 animate-fade-in-up"
             style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[10px] uppercase tracking-[0.24em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>
            Today&apos;s intention <span className="text-white/35 normal-case tracking-normal">· optional</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {INTENTIONS.map((it) => {
              const on = intention === it.key
              return (
                <button
                  key={it.key}
                  onClick={() => setIntention(on ? null : it.key)}
                  className="px-4 py-2 rounded-full text-[12.5px] tracking-[0.04em] transition flex items-center gap-1.5"
                  style={{
                    background: on ? hexToRgba(accentColor, 0.22) : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${on ? accentColor : 'rgba(255,255,255,0.12)'}`,
                    color: on ? accentColor : 'rgba(255,255,255,0.65)', cursor: 'pointer', fontWeight: on ? 600 : 400,
                  }}
                >
                  <span>{it.glyph}</span>{it.label}
                </button>
              )
            })}
          </div>
        </div>

        <p className="text-center text-[10px] tracking-[0.18em] text-white/30 mt-5">{MICRO_DISCLAIMER}</p>
      </div>

      {/* Sticky Calibrate */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-5 pt-3 pb-5"
           style={{ background: 'linear-gradient(180deg, rgba(2,2,8,0) 0%, rgba(2,2,8,0.92) 38%)', backdropFilter: 'blur(2px)' }}>
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleCalibrate}
            className="kowalski-button w-full rounded-2xl px-5 py-4 font-medium text-[15px] tracking-[0.02em]"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.95)} 0%, ${hexToRgba(accentColor, 0.6)} 100%)`,
              color: '#020208',
              boxShadow: `0 0 28px -4px ${hexToRgba(accentColor, 0.7)}, 0 0 56px -16px ${hexToRgba(accentColor, 0.5)}`,
            }}
          >
            Calibrate today →
          </button>
        </div>
      </div>
    </div>
  )
}
