'use client'

/**
 * SessionModePicker (Directive v4.3 · Feature 1) — one lightweight step where
 * a session begins: Calibrated (chart-driven, the existing flow) vs Full Body
 * Recalibration (the complete 12-fork anatomical ladder, chart-independent).
 *
 * Skippable: "remember my choice" writes the Settings preference
 * (rememberedSessionMode) so future sessions start directly.
 * Copy reviewed against COMPLIANCE.md + the v4.1 voice spec.
 */

import { useState } from 'react'
import { hexToRgba } from '@/lib/utils'
import { MICRO_DISCLAIMER } from '@/lib/compliance'
import { useAppStore } from '@/lib/store'
import type { SessionMode, InterruptedSession } from '@/lib/store'

export default function SessionModePicker({
  accentColor,
  hasReading,
  interrupted,
  onResume,
  onPick,
  onBack,
}: {
  accentColor: string
  /** No reading → the Calibrated card routes to the scan first. */
  hasReading: boolean
  /** v4.3 — an interrupted session (guests have no Dashboard resume card,
   *  so the picker offers the resume door too). */
  interrupted?: InterruptedSession | null
  onResume?: () => void
  onPick: (mode: SessionMode, remember: boolean) => void
  onBack: () => void
}) {
  const [remember, setRemember] = useState(false)

  const card = (opts: {
    title: string
    blurb: string
    footnote?: string
    accent: string
    onClick: () => void
    preselected?: boolean
  }) => (
    <button
      onClick={opts.onClick}
      className="kowalski-button w-full text-left rounded-[1.6rem] p-6 transition-transform"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${hexToRgba(opts.accent, 0.08)} 0%, rgba(2,2,8,0.92) 65%)`,
        border: `1px solid ${hexToRgba(opts.accent, opts.preselected ? 0.55 : 0.28)}`,
        boxShadow: opts.preselected ? `0 24px 56px -30px ${hexToRgba(opts.accent, 0.6)}` : 'none',
      }}
    >
      <div className="font-cinzel text-[18px] text-white mb-1.5">{opts.title}</div>
      <p className="text-[13px] text-content-sm leading-relaxed">{opts.blurb}</p>
      {opts.footnote && (
        <p className="text-[11px] text-white/40 mt-2">{opts.footnote}</p>
      )}
    </button>
  )

  return (
    <div className="min-h-screen font-rajdhani flex items-center justify-center px-5 py-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-[10px] uppercase tracking-[0.28em] mb-2" style={{ color: hexToRgba(accentColor, 0.85) }}>
            Resonance Chamber
          </div>
          <h1 className="font-cinzel text-2xl text-white">Choose your session</h1>
        </div>

        {interrupted && onResume && (
          <button
            onClick={onResume}
            className="kowalski-button w-full rounded-2xl px-4 py-3 mb-4 text-[12.5px]"
            style={{ background: hexToRgba(accentColor, 0.12), border: `1px solid ${hexToRgba(accentColor, 0.4)}`, color: 'rgba(255,255,255,0.9)' }}
          >
            Resume your session
            {interrupted.phaseLabel != null && interrupted.phaseIndex != null
              ? <> · {interrupted.phaseLabel} · Phase {interrupted.phaseIndex + 1} of {interrupted.phaseCount ?? '—'}</>
              : null} →
          </button>
        )}

        <div className="flex flex-col gap-3.5 mb-5">
          {card({
            title: 'Calibrated Session',
            blurb: 'Tuned to your chart and today’s sky — the forks and phases your reading calls for.',
            footnote: hasReading ? undefined : 'Starts with the resonance scan — your reading shapes the session.',
            accent: accentColor,
            preselected: true,
            onClick: () => onPick('calibrated', remember),
          })}
          {card({
            title: 'Full Body Recalibration',
            blurb: 'The complete anatomical ladder — all twelve forks, ground to crown and back. The same map for every body; no reading required.',
            accent: '#4CAF89',
            onClick: () => onPick('full_body', remember),
          })}
          <ChakraCard remember={remember} onPick={onPick} />
        </div>

        <label className="flex items-center gap-2.5 justify-center mb-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-current"
            style={{ accentColor }}
          />
          <span className="text-[12px] text-white/60">
            Remember my choice (change anytime in Settings)
          </span>
        </label>

        <div className="text-center">
          <button
            onClick={onBack}
            className="kowalski-button rounded-2xl px-5 py-2.5 text-[13px]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}
          >
            ← Back
          </button>
        </div>

        <p className="mt-8 text-center text-[10px] text-white/40">{MICRO_DISCLAIMER}</p>
      </div>
    </div>
  )
}

// v4.3.1 — the Chakra card carries its instrument choice inline: Solfeggio
// forks or Planetary forks. Preselects the set the user owns (ownedForks are
// the planetary Sacred Tones); both are always selectable — the chamber
// carries any tone the user doesn't hold in hand.
function ChakraCard({
  remember, onPick,
}: {
  remember: boolean
  onPick: (mode: SessionMode, remember: boolean) => void
}) {
  const instrument = useAppStore((s) => s.chakraInstrument)
  const setInstrument = useAppStore((s) => s.setChakraInstrument)
  const ownedForks = useAppStore((s) => s.ownedForks)
  const [touched, setTouched] = useState(false)
  // Preselect from ownership once (planetary if they own Sacred Tones forks).
  const effective = touched ? instrument : (ownedForks.length ? 'planetary' : instrument)
  const accent = '#C084FC'
  const pill = (v: 'solfeggio' | 'planetary', label: string) => (
    <button
      onClick={(e) => { e.stopPropagation(); setTouched(true); setInstrument(v) }}
      className="kowalski-button text-[11px] px-3 py-1 rounded-full"
      style={{
        border: `1px solid ${effective === v ? hexToRgba(accent, 0.6) : 'rgba(255,255,255,0.14)'}`,
        background: effective === v ? hexToRgba(accent, 0.18) : 'transparent',
        color: effective === v ? accent : 'rgba(255,255,255,0.55)',
      }}
    >
      {label}
    </button>
  )
  return (
    <div
      className="w-full text-left rounded-[1.6rem] p-6"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${hexToRgba(accent, 0.08)} 0%, rgba(2,2,8,0.92) 65%)`,
        border: `1px solid ${hexToRgba(accent, 0.28)}`,
      }}
    >
      <div className="font-cinzel text-[18px] text-white mb-1.5">Chakra Recalibration</div>
      <p className="text-[13px] text-content-sm leading-relaxed mb-3">
        The seven centers, root to crown and back. Choose your instrument set —
        the chamber carries any tone you don&apos;t hold in hand.
      </p>
      <div className="flex items-center gap-2 mb-4">
        {pill('solfeggio', 'Solfeggio forks')}
        {pill('planetary', 'Planetary forks')}
      </div>
      <button
        onClick={() => { setInstrument(effective); onPick('chakra', remember) }}
        className="kowalski-button rounded-2xl px-4 py-2.5 text-[13px] font-medium"
        style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.9)} 0%, ${hexToRgba(accent, 0.55)} 100%)`, color: '#020208' }}
      >
        Begin Chakra Recalibration →
      </button>
    </div>
  )
}
