'use client'

/**
 * ASTRYX — Home Screen (Daily Hub)
 *
 * Build Directive Fix 5 · The daily-return hook for Individual users at
 * $9.95/mo. Shown after a user has completed at least one intake
 * (their protocol is non-null).
 *
 * Sections top to bottom:
 *   1. Header — name + today's date + settings icon
 *   2. Today's Cosmic Weather — top 3 active transits from the engine
 *   3. Daily Cell Salt — sun-sign salt with dosing reminder + affirmation
 *   4. Morning Intention — single deterministic affirmation, fresh daily
 *   5. Quick Symptom Check-In — 10 chips that route to engine immediately
 *   6. Begin Evening Session — full-width session entry
 *
 * DECISIONS:
 *  - Transit data is read directly from the stored protocol.diagnostic
 *    (already calculated by the engine). DOES NOT re-call /api/chart on
 *    every home-screen visit — the diagnostic is fresh enough; refresh
 *    happens on full intake re-run or via a Settings option.
 *  - "Morning Intention" deterministic seed = today's date (YYYY-MM-DD)
 *    + sun-sign affirmation index. Same day always shows same intention.
 *  - Quick Symptom chips route to the engine via onQuickSymptom (parent-
 *    provided handler). Birth data is already stored — engine re-runs
 *    with the symptom and returns to Results screen with routed output.
 *  - Persistent micro-disclaimer footer per directive global rule #5.
 */

import { useMemo } from 'react'
import type { ProtocolOutput, ActiveTransit } from '@/types'
import { GlassCard, PrimaryButton, SectionLabel, PlanetBadge, Tag } from '@/components/ui'
import { PLANET_COLORS } from '@/lib/engine'
import { hexToRgba } from '@/lib/utils'
import { MICRO_DISCLAIMER } from '@/lib/compliance'
import cellSaltsData from '@/data/cellSalts.json'

// Local alpha helper for either #hex or rgba() strings
function alpha(c: string, a: number): string {
  if (c?.startsWith('#')) return hexToRgba(c, a)
  if (c?.startsWith('rgba')) return c.replace(/rgba\(([^)]+),\s*[\d.]+\)/, `rgba($1, ${a})`)
  if (c?.startsWith('rgb(')) return c.replace('rgb(', 'rgba(').replace(')', `, ${a})`)
  return c
}

interface HomeScreenProps {
  protocol: ProtocolOutput
  userName?: string
  accentColor: string
  onSettings: () => void
  onStartSession: () => void
  onQuickSymptom: (symptom: string) => void
  onNewReading: () => void
}

// 10 root-cause categories from the engine's symptom router — chips for
// quick midday check-in. Each chip routes to the engine's symptom routing.
const SYMPTOM_CHIPS = [
  'Anxious', 'Exhausted', 'Scattered', 'Inflamed', 'Heavy',
  'Restless', 'Blocked', 'Foggy', 'Disrupted sleep', 'Disconnected',
] as const

export default function HomeScreen({
  protocol, userName, accentColor,
  onSettings, onStartSession, onQuickSymptom, onNewReading,
}: HomeScreenProps) {
  const diagnostic = protocol.diagnostic
  const sunSign = diagnostic?.sunSign

  // ── Today's date — formatted "Tuesday · May 26" ──
  const today = useMemo(() => {
    const d = new Date()
    const weekday = d.toLocaleDateString(undefined, { weekday: 'long' })
    const month   = d.toLocaleDateString(undefined, { month: 'long' })
    const day     = d.getDate()
    return `${weekday} · ${month} ${day}`
  }, [])

  // ── Sun-sign cell salt ──
  const sunSalt = useMemo(() => {
    if (!sunSign) return null
    return (cellSaltsData as any).cellSalts?.find((s: any) => s.sign === sunSign) ?? null
  }, [sunSign])

  // ── Morning Intention — deterministic from today's date + sun-sign ──
  const morningIntention = useMemo(() => {
    if (!sunSalt?.esoteric?.affirmation) return 'Be present. Receive. Allow the flow.'
    // For now, the sun-sign salt's affirmation is the daily intention.
    // Future: rotate among multiple affirmations seeded by date hash.
    return sunSalt.esoteric.affirmation as string
  }, [sunSalt])

  // ── Top 3 transits ──
  const topTransits: ActiveTransit[] = (diagnostic?.activeTransits ?? []).slice(0, 3)

  return (
    <div className="min-h-screen font-rajdhani">
      <div className="max-w-4xl mx-auto px-5 sm:px-8" style={{ paddingTop: 96, paddingBottom: 96 }}>

        {/* ───────────────────────────────────────────────────────
            HERO HEADER — Editorial first impression
            Massive Cinzel greeting + Eyebrow Pill + Settings ButtonInButton
            ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-10 sm:mb-14 flex-wrap gap-4 animate-fade-in-up">
          <div className="max-w-[640px]">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full"
                 style={{
                   background: 'rgba(255,255,255,0.04)',
                   border: `1px solid ${alpha(accentColor, 0.28)}`,
                 }}>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-cosmic-pulse"
                style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
              />
              <span className="text-[10px] uppercase tracking-[0.25em] font-medium"
                    style={{ color: alpha(accentColor, 0.9) }}>
                Welcome back · cosmic signal active
              </span>
            </div>

            {/* Massive greeting */}
            <h1
              className="font-cinzel font-semibold leading-[1.02] tracking-tight mb-3"
              style={{
                fontSize: 'clamp(40px, 7.5vw, 64px)',
                color: 'rgba(255,255,255,0.95)',
                textWrap: 'balance' as any,
              }}
            >
              {userName ? userName : 'Astryx'}
            </h1>

            {/* Date subtitle, readable */}
            <p className="text-[15px] sm:text-[16px] text-content-sm">
              {today}
            </p>
          </div>

          {/* Settings — Button-in-Button pill (high-end-visual-design §4.B) */}
          <button
            onClick={onSettings}
            className="group inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full kowalski-button"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              transition: 'all 500ms cubic-bezier(0.32,0.72,0,1)',
            }}
            title="Settings"
          >
            <span className="text-[10px] uppercase tracking-[0.25em] text-content-sm">
              Settings
            </span>
            <span
              className="btn-magnetic-icon w-7 h-7 rounded-full flex items-center justify-center text-[12px]"
              style={{
                background: alpha(accentColor, 0.18),
                border: `1px solid ${alpha(accentColor, 0.3)}`,
                color: accentColor,
              }}
            >
              ⚙
            </span>
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────
            1. TODAY'S COSMIC WEATHER — Double-Bezel hero card
            ─────────────────────────────────────────────────────── */}
        <div className="mb-7 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          {/* Eyebrow row above bezel */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="eyebrow-pill">Today&apos;s Cosmic Weather</span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-meta">
              {topTransits.length > 0 ? `${topTransits.length} active` : 'Clear skies'}
            </span>
          </div>

          {/* Double-Bezel shell */}
          <div className="bezel-shell">
            <div className="bezel-core relative p-5 sm:p-7">
              {/* Aurora wash */}
              <div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{
                  background: `radial-gradient(circle at 90% 0%, ${alpha(accentColor, 0.16)} 0%, transparent 50%)`,
                }}
              />
              <div className="relative">
                {topTransits.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-[16px] text-content mb-1">No major transits hitting your chart today.</p>
                    <p className="text-[13px] text-content-sm italic">A good day for steady, baseline practice.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topTransits.map((t, i) => (
                      <TransitDailyCard key={`${t.transitingPlanet}-${t.natalPlanet}-${i}`} transit={t} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────
            2. DAILY CELL SALT — Planet-tinted Double-Bezel
            ─────────────────────────────────────────────────────── */}
        {sunSalt && (
          <div className="mb-7 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="eyebrow-pill">Daily Cell Salt</span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-meta">
                {sunSign} · Sun Sign
              </span>
            </div>

            <div
              className="p-1.5 rounded-[2rem]"
              style={{
                background: `linear-gradient(135deg, ${alpha(sunSalt.color ?? accentColor, 0.20)} 0%, rgba(255,255,255,0.03) 60%)`,
                border: `1px solid ${alpha(sunSalt.color ?? accentColor, 0.25)}`,
                boxShadow: `0 24px 60px -28px ${alpha(sunSalt.color ?? accentColor, 0.5)}`,
              }}
            >
              <div
                className="relative p-6 sm:p-7 rounded-[calc(2rem-0.375rem)] overflow-hidden"
                style={{
                  background: 'radial-gradient(ellipse at 0% 0%, rgba(94,224,255,0.05) 0%, rgba(2,2,8,0.92) 55%, #020208 100%)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.10)',
                }}
              >
                {/* Aurora wash */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-60"
                  style={{
                    background: `radial-gradient(circle at 85% 100%, ${alpha(sunSalt.color ?? accentColor, 0.18)} 0%, transparent 50%)`,
                  }}
                />
                <div className="relative">
                  <div className="flex items-baseline gap-3 flex-wrap mb-2">
                    <span
                      className="font-cinzel font-semibold tracking-tight"
                      style={{ fontSize: 'clamp(28px, 4.5vw, 38px)', color: 'rgba(255,255,255,0.95)' }}
                    >
                      {sunSalt.cellSalt?.shortName}
                    </span>
                    <span className="text-[14px] text-content-sm">
                      {sunSalt.cellSalt?.commonName}
                    </span>
                  </div>
                  <p className="text-[14px] text-content italic mb-5 max-w-[60ch]">
                    {sunSalt.cellSalt?.epithet}
                  </p>
                  {/* Dosing — inset hairline panel */}
                  <div
                    className="p-4 rounded-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="text-[10px] uppercase tracking-[0.25em] text-label mb-1.5">
                      Traditional Usage Reference
                    </div>
                    <p className="text-[14px] text-content leading-relaxed">
                      {sunSalt.dosing ?? 'Traditionally taken as 4 tablets under the tongue, 3× daily.'}
                    </p>
                    <p className="text-[10px] text-white/35 italic mt-1.5">
                      Traditional educational reference · not medical advice · consult a licensed provider.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Intention section removed (SHA). */}

        {/* ───────────────────────────────────────────────────────
            4. QUICK SYMPTOM CHECK-IN — Magnetic chip grid
            ─────────────────────────────────────────────────────── */}
        <div className="mb-7 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="mb-4 px-1">
            <div className="mb-2">
              <span className="eyebrow-pill">How are you feeling?</span>
            </div>
            <p className="text-[14px] text-content-sm max-w-[60ch] leading-relaxed">
              Tap a state. Astryx routes it through your chart and returns a focused diagnostic.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_CHIPS.map((s, i) => (
              <button
                key={s}
                onClick={() => onQuickSymptom(s.toLowerCase())}
                className="group px-4 py-2.5 rounded-full text-[13px] kowalski-button"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.85)',
                  transition: 'all 400ms cubic-bezier(0.32,0.72,0,1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = alpha(accentColor, 0.5)
                  e.currentTarget.style.background = alpha(accentColor, 0.08)
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 8px 20px -8px ${alpha(accentColor, 0.4)}`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────
            5. BEGIN EVENING SESSION — Magnetic Button-in-Button
            ─────────────────────────────────────────────────────── */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <button
            onClick={onStartSession}
            className="group w-full flex items-center justify-between pl-7 pr-2 py-2 rounded-full kowalski-button"
            style={{
              background: `linear-gradient(135deg, ${alpha(accentColor, 0.22)} 0%, ${alpha(accentColor, 0.10)} 100%)`,
              border: `1px solid ${alpha(accentColor, 0.45)}`,
              boxShadow: `0 18px 40px -16px ${alpha(accentColor, 0.5)}`,
              transition: 'all 500ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            <span
              className="font-cinzel font-semibold tracking-[0.15em] uppercase"
              style={{
                fontSize: 'clamp(14px, 1.8vw, 17px)',
                color: 'rgba(255,255,255,0.95)',
              }}
            >
              Begin Evening Session
            </span>
            <span
              className="btn-magnetic-icon w-12 h-12 rounded-full flex items-center justify-center text-[18px]"
              style={{
                background: alpha(accentColor, 0.28),
                border: `1px solid ${alpha(accentColor, 0.5)}`,
                color: 'rgba(255,255,255,0.95)',
              }}
            >
              →
            </span>
          </button>
        </div>

        {/* ── New Reading (re-intake) — quiet tertiary link ── */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={onNewReading}
            className="text-[11px] uppercase tracking-[0.3em] text-label hover:text-content transition-colors"
            style={{ transitionDuration: '300ms' }}
          >
            ↻ New Reading
          </button>
        </div>

        {/* ── Persistent micro-disclaimer ── */}
        <div className="text-[10px] text-meta text-center mt-12 tracking-widest">
          {MICRO_DISCLAIMER}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TRANSIT DAILY CARD — compact transit display for home screen
// ═══════════════════════════════════════════════════════════════
function TransitDailyCard({ transit }: { transit: ActiveTransit }) {
  const color = PLANET_COLORS[transit.transitingPlanet] ?? '#8B5CF6'
  const timing = transit.applying
    ? `Applying · exact in ${Math.abs(transit.daysToExact).toFixed(0)}d`
    : `Separating · ${Math.abs(transit.daysToExact).toFixed(0)}d past`

  return (
    <GlassCard accentColor={color} opacity={0.10} className="p-4">
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 flex items-center justify-center font-cinzel rounded-lg"
          style={{
            width: 40, height: 40,
            background: `${color}22`,
            border: `1px solid ${color}55`,
            color,
            fontSize: 16,
          }}
        >
          {transit.transitingPlanet[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
            <span className="font-cinzel text-[13px] text-white">
              {transit.transitingPlanet} {transit.aspect} natal {transit.natalPlanet}
            </span>
            {transit.transitingRetrograde && (
              <span className="text-[9px] text-white/40">℞</span>
            )}
          </div>
          <p className="text-[12px] text-white/70 leading-relaxed mb-1">
            {transit.interpretation?.effect ?? 'Active transit window.'}
          </p>
          {transit.interpretation?.intervention && (
            <p className="text-[11px] text-white/55 italic mb-1.5">
              {transit.interpretation.intervention.split('.').slice(0, 1).join('.')}.
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-white/40 tracking-widest">{timing}</span>
            {transit.interpretation?.duration && (
              <Tag label={transit.interpretation.duration} accent="rgba(255,255,255,0.15)" small />
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
