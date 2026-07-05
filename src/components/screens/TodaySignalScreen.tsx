'use client'

/**
 * ASTRYX — Today's Reading  (Directive v1.0 · FIX 4 — the ONE card)
 * ════════════════════════════════════════════════════════════════════════════
 * The default post-calibration Reading. The intelligence RUNS upstream (the
 * engine), but it does not UNLOAD here. One scannable card:
 *   Signal · Carrier · one-line why · today's fork sequence (ordered) ·
 *   today's element note (daily-ritual hook, FIX 5) · [Enter Chamber] [Ask Astryx]
 *
 * Everything heavier (full chart, cell salts, cosmic weather, prescriptions)
 * lives behind "Go deeper" (the Dashboard's depth panels) or Ask Astryx — present,
 * never forced. Nothing is deleted; it's relocated.
 *
 * Single source of truth: every value derives from the SAME helpers Results uses
 * (signalHierarchy.primary, dominantPolarity, signalWord/whyLine, the shared
 * buildForkSequence + forkSequenceDisplay). No engine work, no re-derivation.
 */

import { useState } from 'react'
import type { ProtocolOutput, AppMode } from '@/types'
import { signalWord, whyLine } from '@/lib/signalCopy'
import { PLANET_COLORS } from '@/lib/engineClient'
import { buildForkSequence, buildFullSpectrumSequence, forkSequenceDisplay } from '@/lib/chamber/forkRite'
import { getDurationPreset } from '@/lib/chamber/durationPresets'
import { hexToRgba } from '@/lib/utils'
import { MICRO_DISCLAIMER } from '@/lib/compliance'
import { useAppStore } from '@/lib/store'
import TeacherChat from '@/components/teacher/TeacherChat'

// Traditional planet → element. Used for the FIX 4 element-note slot until FIX 5
// supplies the transit-aware elemental-weather compute (over/under balance).
const PLANET_ELEMENT: Record<string, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  Sun: 'Fire', Mars: 'Fire', Jupiter: 'Fire',
  Saturn: 'Earth', Venus: 'Earth',
  Mercury: 'Air', Uranus: 'Air',
  Moon: 'Water', Neptune: 'Water', Pluto: 'Water',
}
const ELEMENT_ACTION: Record<string, string> = {
  Fire: 'Fire runs warm today — cool and pace yourself: shade, water, one long slow exhale.',
  Air:  'Air is busy up top — ground down: shoes off on the earth, breathe low and slow.',
  Water: 'Water runs deep — give it banks: warmth, a steady rhythm, gentle structure.',
  Earth: 'Earth feels settled — keep it moving: a brisk walk, fresh air, lighten and lift.',
}

export default function TodaySignalScreen({
  protocol, mode, accentColor, onEnterChamber, onGoDeeper, elementNote,
}: {
  protocol: ProtocolOutput
  mode: AppMode
  accentColor: string
  onEnterChamber: () => void
  onGoDeeper?: () => void
  /** FIX 5 supplies today's elemental-weather note; falls back to a planet-element line. */
  elementNote?: string
}) {
  const chamberDurationKey = useAppStore((s) => s.chamberDurationKey)
  const dailyElement = useAppStore((s) => s.dailyElement)
  const [askOpen, setAskOpen] = useState(false)
  const [askSeed, setAskSeed] = useState<string | null>(null)

  // ── The canonical signal (same source as Results' CalibrationToday) ──
  const primary  = protocol.signalHierarchy?.primary
  const rx       = protocol.prescriptions?.[0]
  const polarity = protocol.dominantPolarity

  const planet = primary?.planet ?? rx?.signature.planet ?? protocol.diagnostic?.dominantPlanet ?? 'Sun'
  const state  = primary?.state ?? polarity?.dominant_state ?? 'balanced'
  const planetColor = PLANET_COLORS[planet] ?? accentColor

  const frequencySignal = signalWord(planet, state)
  const why             = whyLine(planet, state)

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const correctiveDir = polarity?.protocol?.corrective_direction ?? []
  const calibrationResponse =
    state !== 'balanced' && correctiveDir.length
      ? correctiveDir.slice(0, 3).map(cap).join('. ') + '.'
      : 'Draw on this steady signal to support the rest of your field.'

  // ── Fork sequence (shared helper — never re-derived) ──
  const preset = getDurationPreset(chamberDurationKey)
  const forkSteps = preset.fullSpectrum
    ? buildFullSpectrumSequence({ durationSec: preset.durationSec })
    : buildForkSequence({
        hierarchy:        protocol.signalHierarchy,
        polarity:         protocol.dominantPolarity,
        polarityResults:  protocol.polarityResults,
        intentionPlanet:  protocol.intentionPlanet,
        architecture:     preset.architecture,
        durationSec:      preset.durationSec,
        forkCount:        preset.forkCount,
        tier:             mode === 'practitioner' ? 'practitioner' : 'individual',
      })
  const forkSeqArr   = forkSequenceDisplay(forkSteps)
  const forkSequence = forkSeqArr.length ? forkSeqArr.join('  →  ') : `${planet} Resonance`

  // ── Element note (FIX 4 slot; FIX 5 upgrades to transit elemental weather) ──
  const element = PLANET_ELEMENT[planet] ?? 'Air'
  // FIX 5 — prefer today's computed elemental-weather note (store); fall back to
  // the prop, then the planet-element line.
  const todayElementNote = elementNote ?? dailyElement?.note ?? ELEMENT_ACTION[element]

  const askAstryx = (seed?: string) => { setAskSeed(seed ?? null); setAskOpen(true) }

  return (
    <div className="min-h-screen font-rajdhani pb-32">
      <div className="max-w-2xl mx-auto px-5" style={{ paddingTop: 96 }}>

        {/* Header */}
        <div className="mb-5 animate-fade-in-up">
          <div className="text-[10px] uppercase tracking-[0.3em] text-meta mb-1">Today&apos;s Reading</div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="font-cinzel text-[30px] sm:text-[36px] leading-none" style={{ color: planetColor }}>
              {frequencySignal}
            </span>
            <span className="text-[14px] tracking-[0.06em]" style={{ color: hexToRgba(planetColor, 0.85) }}>
              · {planet}
            </span>
          </div>
        </div>

        {/* The ONE card */}
        <div
          className="rounded-[1.6rem] p-5 sm:p-6 mb-4 animate-fade-in-up"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(planetColor, 0.12)} 0%, rgba(255,255,255,0.02) 60%)`,
            border: `1px solid ${hexToRgba(planetColor, 0.24)}`,
            boxShadow: `0 24px 60px -32px ${hexToRgba(planetColor, 0.5)}`,
          }}
        >
          <SignalRow label="Carrier" accent={planetColor}>
            <button
              onClick={() => askAstryx(`What does ${planet} mean in my chart, and why is it my signal today?`)}
              className="kowalski-button inline-flex items-center gap-1.5 text-content"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {planet}
              <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: hexToRgba(planetColor, 0.85) }}>· learn this</span>
            </button>
          </SignalRow>

          <SignalRow label="Why this signal" accent={planetColor}>
            <span className="text-content-sm italic">{why}</span>
          </SignalRow>

          <SignalRow label="Calibration response" accent={planetColor}>
            <span className="capitalize-first">{calibrationResponse}</span>
          </SignalRow>

          <SignalRow label="Today's fork sequence" accent={planetColor}>
            <span className="tracking-[0.02em]">{forkSequence}</span>
          </SignalRow>

          <SignalRow label="Today's sky" accent={planetColor} last>
            <span className="text-content">{todayElementNote}</span>
          </SignalRow>
        </div>

        {/* Go deeper — depth on demand (never forced) */}
        {onGoDeeper && (
          <button
            onClick={onGoDeeper}
            className="kowalski-button w-full flex items-center justify-between rounded-2xl px-4 py-3 mb-3 text-left"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="text-[12px] tracking-[0.04em] text-content">Go deeper — chart, minerals, cosmic weather</span>
            <span className="text-[12px] text-white/45">→</span>
          </button>
        )}

        <p className="text-center text-[10px] tracking-[0.18em] text-white/30 mt-6">{MICRO_DISCLAIMER}</p>
      </div>

      {/* Sticky primary actions — Enter Chamber + Ask Astryx */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 px-5 pt-3 pb-5"
        style={{ background: 'linear-gradient(180deg, rgba(2,2,8,0) 0%, rgba(2,2,8,0.92) 38%)', backdropFilter: 'blur(2px)' }}
      >
        <div className="max-w-2xl mx-auto flex flex-col gap-2.5">
          <button
            onClick={onEnterChamber}
            className="kowalski-button w-full rounded-2xl px-5 py-4 font-medium text-[15px] tracking-[0.02em]"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(planetColor, 0.95)} 0%, ${hexToRgba(planetColor, 0.6)} 100%)`,
              color: '#020208',
              boxShadow: `0 0 28px -4px ${hexToRgba(planetColor, 0.7)}, 0 0 56px -16px ${hexToRgba(planetColor, 0.5)}`,
            }}
          >
            Enter Resonance Chamber →
          </button>
          <button
            onClick={() => askAstryx()}
            className="kowalski-button w-full rounded-2xl px-5 py-3 text-[13.5px] tracking-[0.02em]"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${hexToRgba(accentColor, 0.4)}`, color: 'rgba(255,255,255,0.88)' }}
          >
            Ask Astryx
          </button>
        </div>
      </div>

      {/* Astryx — the depth / continuity / learn-more face (brain rebuilt sovereign in FIX 6) */}
      <TeacherChat
        open={askOpen}
        onClose={() => { setAskOpen(false); setAskSeed(null) }}
        accentColor={accentColor}
        seed={askSeed}
      />
    </div>
  )
}

function SignalRow({
  label, accent, children, last = false,
}: {
  label: string
  accent: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={last ? 'pt-3' : 'pb-3 mb-3 border-b border-white/5'}>
      <div className="text-[10px] uppercase tracking-[0.24em] mb-1" style={{ color: hexToRgba(accent, 0.85) }}>
        {label}
      </div>
      <div className="text-[14px] text-content leading-snug">{children}</div>
    </div>
  )
}
