'use client'

/**
 * ASTRYX Results Screen — The Unified Final Report
 *
 * Top-to-bottom diagnostic report. One scroll. Reads like a medical
 * chart printout. Renders the full output of the engine's new
 * diagnostic + prescription layers.
 *
 * Section order:
 *   1. The Diagnosis                  ── headline + dominant signature
 *   2. Today's Cosmic Weather         ── active transits with interpretation
 *   3. Your Symptom Routing           ── if symptoms reported
 *   4. Your Mineral Foundation        ── cell salts (sun-sign + primary + gestation)
 *   5. Your Prescriptions             ── unified 5-sense protocol cards
 *   6. Full Chart (collapsible)       ── natal wheel + body map + SOAP
 *
 * All sections null-check gracefully so the screen never breaks if
 * an engine block is missing.
 */

import { useState, useMemo } from 'react'
import type {
  ProtocolOutput, AppMode, ActiveTransit, CellSaltPrescription,
  UnifiedPrescription, SymptomRouting,
} from '@/types'
import { GlassCard, PrimaryButton, Tag, PlanetBadge, SectionLabel, DataPoint } from '@/components/ui'
import { PLANET_COLORS, feltStateLanguage } from '@/lib/engine'
import { signalWord, whyLine } from '@/lib/signalCopy'
import { hexToRgba } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import ChartTabs from '@/components/engine/ChartTabs'
import TeacherChat from '@/components/teacher/TeacherChat'
import AskAstryxNudge from '@/components/ui/AskAstryxNudge'
// Chamber Deploy 1 — DNA + duration. Directive I.2: NO audio on Results — all
// playback lives in the chamber. Transit cards are informational + a fork
// suggestion; the only player is inside the session.
import { generateChamberDNA } from '@/lib/chamber/ChamberDNAEngine'
import { durationsForMode, getDurationPreset, type ChamberDurationKey } from '@/lib/chamber/durationPresets'
// v4 FIX 2 — the Results fork label derives from the SAME ordered sequence the
// Chamber + Summary run (single source of truth).
import { buildForkSequence, buildFullSpectrumSequence, forkSequenceDisplay } from '@/lib/chamber/forkRite'

// Directive I.3 — natural-flow gate: hero/transit CTAs scroll the user down to
// the chamber entry (after the full report) instead of launching it early.
function scrollToChamberEntry(): void {
  if (typeof document === 'undefined') return
  document.getElementById('chamber-entry')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// User-facing sound label per Final 20% Directive §17 (User vs Practitioner Mode).
// User mode never shows raw Hz numbers — replaces them with experiential labels.
const USER_SOUND_LABELS: Record<string, string> = {
  Sun: 'Radiant Drone · Centering Tone',
  Moon: 'Tidal Soundscape · Soothing Wash',
  Mercury: 'Bright Sequence · Clear Air',
  Venus: 'Warm Harmonic · Heart Tone',
  Mars: 'Charged Pulse · Activation Rhythm',
  Jupiter: 'Open Drone · Expansive Field',
  Saturn: 'Deep Bass · Grounding Anchor',
  Uranus: 'Crystalline Tone · Reset Pulse',
  Neptune: 'Ambient Wash · Dream Texture',
  Pluto: 'Dark Drone · Transformation Tone',
}

// Phase D — state-corrective labels override the planet's natural label
// whenever the polarity engine has detected an excess/deficiency/blocked
// state at moderate+ confidence.
const STATE_SOUND_LABELS: Record<string, string> = {
  excess:      'Cooling Soundscape · Calming Flow',
  deficiency:  'Warming Activation · Steady Pulse',
  blocked:     'Releasing Soundscape · Mobilizing Flow',
  balanced:    'Centered Soundscape',
}
function userSoundLabel(planet: string, polarity?: import('@/types').PolarityResultLike): string {
  if (
    polarity &&
    polarity.confidence_band !== 'weak' &&
    polarity.dominant_state !== 'balanced'
  ) {
    return STATE_SOUND_LABELS[polarity.dominant_state] ?? 'Calming Soundscape'
  }
  return USER_SOUND_LABELS[planet] ?? 'Calming Soundscape'
}

// Local alpha helper — accepts hex or already-rgba and returns rgba(...) string
function hexAlpha(color: string, alpha: number): string {
  if (color?.startsWith('#')) return hexToRgba(color, alpha)
  if (color?.startsWith('rgba')) {
    // replace existing alpha
    return color.replace(/rgba\(([^)]+),\s*[\d.]+\)/, `rgba($1, ${alpha})`)
  }
  if (color?.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
  }
  return color
}

interface ResultsScreenProps {
  protocol: ProtocolOutput
  mode: AppMode
  accentColor: string
  chartData?: any
  onStartSession: () => void
  onPractitioner: () => void
  onNewIntake: () => void
  // Phase 1 consolidation — when mounted inside the Dashboard as a panel, the
  // page chrome (min-h-screen, top padding, the ONE chamber CTA, secondary CTAs)
  // is stripped and only one slice of the report renders:
  //   'summary' → the Calibration Plan hero (Latest Session panel)
  //   'deep'    → the full diagnostic report + prep (Deeper Dives panel)
  // Internal logic/cards are untouched — this only gates the outer shell.
  embedded?: 'summary' | 'deep'
}

export default function ResultsScreen({
  protocol,
  mode,
  accentColor,
  chartData,
  onStartSession,
  onPractitioner,
  onNewIntake,
  embedded,
}: ResultsScreenProps) {
  const [showChart, setShowChart]               = useState(false)
  const [expandedPrescription, setExpandedPrescription] = useState<number | null>(0)
  const [expandedTransit, setExpandedTransit]   = useState<number | null>(0)
  const [protocolModalTransit, setProtocolModalTransit] = useState<ActiveTransit | null>(null)
  // The Teacher (sixth sense) — open state + optional seed prompt
  const [teacherOpen, setTeacherOpen]           = useState(false)
  const [teacherSeed, setTeacherSeed]           = useState<string | null>(null)
  const askTeacher = (seed?: string) => { setTeacherSeed(seed ?? null); setTeacherOpen(true) }

  // FIX 6/7 — Individual = Lite (lead with one card; deep report behind
  // "Explore Deeper"). Practitioner = Full (everything always visible).
  const isPractitioner = mode === 'practitioner'
  const [exploreOpen, setExploreOpen] = useState(false)

  const d  = protocol.diagnostic
  const p  = protocol.dominant_pattern
  const prescriptions = protocol.prescriptions ?? []

  // Phase 1 consolidation — section gating when mounted as a Dashboard panel.
  const showSummary  = embedded !== 'deep'                                   // hero (Latest Session)
  const showDeep     = embedded === 'deep' || (!embedded && (isPractitioner || exploreOpen))
  const showExplore  = !embedded && !isPractitioner                          // the Explore Deeper toggle
  const showPrepare  = embedded !== 'summary'                                // PrepareSession (carry-forward / tea / space)
  const showChamber  = !embedded                                            // the ONE Enter Chamber + secondary CTAs
  const showSolar    = embedded !== 'summary'

  return (
    <div className={embedded ? 'font-rajdhani' : 'min-h-screen font-rajdhani'}>
      {/* Phase 13 — use more of the desktop width without breaking the
          mobile-first reading flow. */}
      {/* v5 FIX 1 — wider desktop container so Results is no longer a narrow
          centered pillar (uses the real estate, fewer wrapped lines → less
          scroll). The full 3-column dashboard composition is the next iteration,
          to be finalized against on-device review (see FIXES_COMPLETE v5 notes). */}
      <div
        className={embedded ? '' : 'max-w-3xl lg:max-w-5xl mx-auto px-5 lg:px-8'}
        style={embedded ? undefined : { paddingTop: 96, paddingBottom: 60 }}
      >

        {/* ─────────────────────────────────────────────────────────
            0. YOUR CALIBRATION TODAY — action-first hero (Phase 1)
               What to do today, in plain language, before any astrology.
            ───────────────────────────────────────────────────────── */}
        {showSummary && (
          <CalibrationToday
            protocol={protocol}
            mode={mode}
            accentColor={accentColor}
            onStartSession={onStartSession}
            onAskTeacher={askTeacher}
          />
        )}

        {/* Directive S · Part 7 — the gentle bridge. The report answers WHAT;
            Astryx answers WHY / WHERE-ELSE. Reflex prompt only when we have one. */}
        {showSummary && (
          <div className="mb-6 -mt-2">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/35 mb-2">Curious? Ask Astryx</div>
            <AskAstryxNudge
              accentColor={accentColor}
              onAsk={askTeacher}
              prompts={[
                { label: 'Why this fork?', prompt: 'Why this fork for me — explain the counterweight and the Planet ≠ Remedy idea in my reading.' },
                ...(protocol.reflexPlacements?.length
                  ? [{ label: 'Where are the reflex points?', prompt: 'Where are the reflex points for my body signal, and why does easing them help?' }]
                  : []),
                { label: 'How do I hold the fork?', prompt: 'How do I hold and use the tuning fork properly?' },
              ]}
            />
          </div>
        )}

        {/* Phase 10 — Solar Chart transparency. When birth time is unknown the
            house/angle-based details are less precise; say so plainly. */}
        {showSolar && chartData?.isSolarChart && (
          <div
            className="mb-6 px-4 py-3 rounded-xl animate-fade-in-up"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.28)' }}
          >
            <div className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: '#F59E0B' }}>
              ☉ Solar Chart mode
            </div>
            <p className="text-[12.5px] text-content leading-relaxed">
              Birth time unknown — Astryx is using Solar Chart mode. Planetary sign-based insights
              remain useful, but houses, Ascendant, Midheaven, and timing-sensitive details may be
              less precise. Add your birth time on Intake for a fully precise chart.
            </p>
          </div>
        )}

        {/* ── FIX 6/7 — Individual keeps the full reading collapsed behind
            "Explore Deeper"; Practitioner Full always shows everything.
            The ONE Enter Chamber lives at the very END (below the report). ── */}
        {showExplore && (
          <button
            onClick={() => setExploreOpen((o) => !o)}
            className="group w-full mt-8 mb-2 flex items-center justify-between pl-5 pr-2 py-3 rounded-2xl kowalski-button"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${hexAlpha(accentColor, 0.22)}`,
              transition: 'all 500ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            <div className="text-left">
              <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: hexAlpha(accentColor, 0.85) }}>
                {exploreOpen ? 'Hide the full reading' : 'Explore Deeper'}
              </div>
              <div className="text-[12.5px] text-content-sm">
                {exploreOpen ? 'Collapse the calibration insight, cosmic weather & full chart' : 'Why this? — the full calibration insight, cosmic weather & chart'}
              </div>
            </div>
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-500"
              style={{ background: hexAlpha(accentColor, 0.18), border: `1px solid ${hexAlpha(accentColor, 0.3)}`, transform: exploreOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <span className="text-[14px]" style={{ color: accentColor }}>↓</span>
            </span>
          </button>
        )}

        {showDeep && (
        <>
        {/* ─────────────────────────────────────────────────────────
            1. THE DIAGNOSIS — Double-Bezel hero card (Ethereal Glass)
            ───────────────────────────────────────────────────────── */}
        <div
          className="relative p-1.5 rounded-[2rem] mb-6 animate-fade-in-up"
          style={{
            background: `linear-gradient(135deg, ${hexAlpha(accentColor, 0.18)} 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.02) 100%)`,
            border: `1px solid ${hexAlpha(accentColor, 0.22)}`,
            boxShadow:
              `0 32px 64px -32px ${hexAlpha(accentColor, 0.45)}, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          {/* Inner core (concentric squircle, mathematically smaller radius) */}
          <div
            className="relative p-7 sm:p-9 rounded-[calc(2rem-0.375rem)] overflow-hidden"
            style={{
              background:
                'radial-gradient(ellipse at 0% 0%, rgba(94,224,255,0.06) 0%, rgba(2,2,8,0.92) 55%, rgba(2,2,8,0.96) 100%)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)',
            }}
          >
            {/* Aurora wash */}
            <div
              className="absolute inset-0 pointer-events-none opacity-50"
              style={{
                background:
                  `radial-gradient(circle at 85% 15%, ${hexAlpha(accentColor, 0.18)} 0%, transparent 45%)`,
              }}
            />
            {/* Hairline rule under header */}
            <div className="relative">
              {/* Eyebrow tag — proper pill, not faint caption */}
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full"
                   style={{
                     background: 'rgba(255,255,255,0.04)',
                     border: `1px solid ${hexAlpha(accentColor, 0.28)}`,
                   }}>
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
                />
                <span className="text-[10px] uppercase tracking-[0.25em] font-medium"
                      style={{ color: hexAlpha(accentColor, 0.85) }}>
                  Your Calibration Insight
                </span>
              </div>

              {d ? (
                <>
                  <h1
                    className="font-cinzel text-[28px] sm:text-[40px] font-semibold mb-5 leading-[1.05] tracking-tight"
                    style={{ color: 'rgba(255,255,255,0.95)' }}
                  >
                    {d.rootCause.headline}
                  </h1>
                  <p className="text-[15px] sm:text-[16px] leading-[1.65] mb-4 text-content">
                    {d.rootCause.bodyLayer || d.plainLanguage.whenItsOff}
                  </p>
                  <div className="text-[13px] italic leading-[1.7] mb-7 text-content-sm">
                    {d.rootCause.actionLayer || d.plainLanguage.howToRestore}
                  </div>
                  {protocol.signalHierarchy && (
                    <SignalStack
                      hierarchy={protocol.signalHierarchy}
                      mode={mode}
                      accentColor={accentColor}
                      onAskTeacher={askTeacher}
                    />
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    <PlanetBadge name={d.dominantPlanet} />
                    {d.sunSign && (
                      <Tag label={`☉ Sun in ${d.sunSign}`} accent="rgba(245,158,11,0.4)" small />
                    )}
                    {d.moonSign && (
                      <Tag label={`☽ Moon in ${d.moonSign}`} accent="rgba(168,196,208,0.4)" small />
                    )}
                    {d.risingSign && (
                      <Tag label={`ASC ${d.risingSign}`} accent="rgba(192,132,252,0.4)" small />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h1 className="font-cinzel text-[28px] sm:text-[36px] font-semibold mb-2 leading-tight"
                      style={{ color: 'rgba(255,255,255,0.95)' }}>
                    {p.title}
                  </h1>
                  <p className="text-[14px] text-content-sm">{p.subtitle}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            2. TODAY'S COSMIC WEATHER — active transits
            ───────────────────────────────────────────────────────── */}
        {d?.activeTransits && d.activeTransits.length > 0 && (
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-baseline justify-between mb-3 px-1">
              <SectionLabel>Today&apos;s Cosmic Weather</SectionLabel>
              <span className="text-[10px] text-white/30 tracking-widest">
                {d.activeTransits.length > 5
                  ? `TOP 5 OF ${d.activeTransits.length}`
                  : `${d.activeTransits.length} ACTIVE`}
              </span>
            </div>
            <div className="space-y-2">
              {d.activeTransits.slice(0, 5).map((t, i) => (
                <TransitCard
                  key={`${t.transitingPlanet}-${t.natalPlanet}-${i}`}
                  transit={t}
                  expanded={expandedTransit === i}
                  onToggle={() => setExpandedTransit(expandedTransit === i ? null : i)}
                  onOpenProtocol={() => setProtocolModalTransit(t)}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            3. YOUR SYMPTOM ROUTING — if symptoms reported
            ───────────────────────────────────────────────────────── */}
        {d?.symptomRouting && d.symptomRouting.length > 0 && (
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-baseline justify-between mb-3 px-1">
              <SectionLabel>Symptom Routing</SectionLabel>
              <span className="text-[10px] text-white/30 tracking-widest">
                {d.symptomRouting.length} ROUTED
              </span>
            </div>
            <div className="space-y-3">
              {d.symptomRouting.map((s, i) => (
                <SymptomCard key={i} symptom={s} />
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            4. YOUR MINERAL FOUNDATION — cell salts
            ───────────────────────────────────────────────────────── */}
        {d?.cellSaltPrescription && (
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-baseline justify-between mb-3 px-1">
              <SectionLabel>Your Mineral Foundation</SectionLabel>
              <span className="text-[10px] text-white/30 tracking-widest">CELL SALTS · BIOCHEMIC</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Primary salt — active right now */}
              {d.cellSaltPrescription.primarySalt?.saltName && (
                <CellSaltCard
                  salt={d.cellSaltPrescription.primarySalt}
                  label="ACTIVE NOW"
                  highlight
                />
              )}
              {/* Sun-sign salt — daily baseline */}
              {d.cellSaltPrescription.sunSignSalt?.saltName && (
                <CellSaltCard
                  salt={d.cellSaltPrescription.sunSignSalt}
                  label="DAILY BASELINE"
                />
              )}
            </div>

            {/* Gestation deficiencies — Bonacci's rule */}
            {d.cellSaltPrescription.gestationDeficiencies?.length > 0 && (
              <GlassCard className="mt-3 p-5">
                <div className="text-[10px] tracking-[0.25em] text-white/40 mb-2">
                  INNATE BASELINE DEFICIENCIES · 3 SIGNS YOU DIDN&apos;T GESTATE THROUGH
                </div>
                <p className="text-[12px] text-white/50 italic mb-4">
                  Per Carey/Bonacci&apos;s gestation rule — human gestation is 9 months, so the 3 zodiac
                  signs immediately after your Sun sign represent the 3 minerals you are innately
                  under-resourced in from birth.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {d.cellSaltPrescription.gestationDeficiencies.map((salt, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-white/10"
                      style={{ background: salt.color ? `${salt.color}10` : 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="text-[10px] tracking-widest text-white/40 mb-1">{salt.sign}</div>
                      <div className="font-cinzel text-[14px] text-white mb-0.5">{salt.saltShort}</div>
                      <div className="text-[11px] text-white/50 italic">{salt.epithet}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            5. YOUR PRESCRIPTIONS — unified 5-sense protocol cards
            ───────────────────────────────────────────────────────── */}
        {prescriptions.length > 0 && (
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-baseline justify-between mb-3 px-1">
              <SectionLabel>Your 5-Sense Calibration Plan</SectionLabel>
              <span className="text-[10px] text-white/30 tracking-widest">
                {prescriptions.length} PROTOCOL{prescriptions.length > 1 ? 'S' : ''}
              </span>
            </div>
            <div className="space-y-3">
              {prescriptions.map((rx, i) => (
                <PrescriptionCard
                  key={i}
                  rx={rx}
                  expanded={expandedPrescription === i}
                  onToggle={() => setExpandedPrescription(expandedPrescription === i ? null : i)}
                  protocol={protocol}
                  mode={mode}
                />
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            6. FULL CHART — collapsible "see why"
            ───────────────────────────────────────────────────────── */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <button
            onClick={() => setShowChart(!showChart)}
            className="group w-full flex items-center justify-between pl-5 pr-2 py-2 rounded-full kowalski-button"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${hexAlpha(accentColor, 0.18)}`,
              transition: 'all 600ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="text-[10px] tracking-[0.3em] uppercase font-medium text-content-sm">
                See Why
              </div>
              <div className="text-[13px] text-content">
                Full natal chart · body map · reference assessment
              </div>
            </div>
            {/* Button-in-Button trailing icon (high-end-visual-design §4.B) */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                background: hexAlpha(accentColor, 0.18),
                border: `1px solid ${hexAlpha(accentColor, 0.3)}`,
                transform: showChart ? 'rotate(180deg)' : 'rotate(0deg)',
                transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)',
              }}
            >
              <span className="text-[14px]" style={{ color: accentColor }}>↓</span>
            </div>
          </button>
          {showChart && (
            <GlassCard className="px-5 py-5 mt-3 animate-fade-in">
              <ChartTabs
                protocol={protocol}
                chart={chartData || null}
                accentColor={accentColor}
                soapContent={
                  <div>
                    <SectionLabel>Reference Assessment (SOAP)</SectionLabel>
                    <SOAPSection label="S — Subjective" items={protocol.soap.subjective} accentColor={accentColor} />
                    <SOAPSection
                      label="O — Objective"
                      items={mode === 'practitioner' ? protocol.soap.objective : protocol.soap.objective.slice(0, 2)}
                      accentColor={accentColor}
                    />
                    <div className="mb-4">
                      <div className="text-[11px] tracking-[0.2em] mb-2" style={{ color: accentColor }}>A — Assessment</div>
                      <p className="text-[13px] text-white/75 leading-relaxed italic">{protocol.soap.assessment}</p>
                    </div>
                    <div>
                      <div className="text-[11px] tracking-[0.2em] mb-2" style={{ color: accentColor }}>P — Plan</div>
                      <p className="text-[13px] text-white/65 leading-relaxed">{protocol.soap.plan}</p>
                    </div>
                  </div>
                }
              />
            </GlassCard>
          )}
        </div>
        </>
        )}

        {/* Prepare-your-session (tea / fork / set your space) — part of the
            Deeper Dives "what to carry forward" when embedded. */}
        {showPrepare && <PrepareSession protocol={protocol} mode={mode} accentColor={accentColor} />}

        {/* ── THE ONE ENTER CHAMBER + secondary CTAs — standalone page only.
            When embedded, the Dashboard's Today panel owns chamber entry. ── */}
        {showChamber && (
          <>
            <ChamberCTA protocol={protocol} mode={mode} accentColor={accentColor} onStart={onStartSession} />
            <div className="flex flex-wrap gap-3 mt-4">
              {mode === 'practitioner' && (
                <PrimaryButton label="⊕ Practitioner View" onClick={onPractitioner} accent={accentColor} outlined />
              )}
              <PrimaryButton label="↩ New Intake" onClick={onNewIntake} accent="rgba(255,255,255,0.1)" outlined />
            </div>
          </>
        )}
      </div>

      {/* v4.0 — Transit Protocol Modal */}
      {protocolModalTransit && (
        <TransitProtocolModal
          transit={protocolModalTransit}
          mode={mode}
          polarityResults={protocol.polarityResults}
          onClose={() => setProtocolModalTransit(null)}
          onStartSession={() => {
            setProtocolModalTransit(null)
            onStartSession()
          }}
        />
      )}

      {/* The Teacher — sixth sense conversational guide */}
      <TeacherChat
        open={teacherOpen}
        onClose={() => { setTeacherOpen(false); setTeacherSeed(null) }}
        accentColor={accentColor}
        seed={teacherSeed}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TRANSIT CARD — one active transit with effect/intervention
// ═══════════════════════════════════════════════════════════════
function TransitCard({
  transit,
  expanded,
  onToggle,
  onOpenProtocol,
  index,
}: {
  transit: ActiveTransit
  expanded: boolean
  onToggle: () => void
  onOpenProtocol: () => void
  index: number
}) {
  const planetColor = PLANET_COLORS[transit.transitingPlanet] ?? '#8B5CF6'
  const daysLabel = transit.applying
    ? `${Math.abs(transit.daysToExact).toFixed(0)}d to exact`
    : `${Math.abs(transit.daysToExact).toFixed(0)}d past exact`
  const orbLabel = `${transit.orb.toFixed(1)}° orb`
  const lifeEvent = transit.lifeEvent

  return (
    <GlassCard
      accentColor={lifeEvent ? '#F59E0B' : planetColor}
      opacity={lifeEvent ? 0.22 : index === 0 ? 0.18 : 0.08}
      className="overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* H.0.4 — landmark life event: a distinct, elevated banner */}
      {lifeEvent && (
        <div className="px-4 pt-3 pb-2"
             style={{ borderBottom: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.08)' }}>
          <div className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: '#F59E0B' }}>
            ⚠ {lifeEvent.label}
          </div>
          <p className="text-[12px] text-white/75 leading-relaxed mt-1">{lifeEvent.description}</p>
        </div>
      )}
      {/* H.0.4 — the WHOLE card opens this transit's protocol (not just a link) */}
      <button onClick={onOpenProtocol} className="w-full flex items-center gap-4 p-4 text-left">
        <div
          className="flex-shrink-0 flex items-center justify-center text-base rounded-[10px] font-cinzel"
          style={{
            width: 44,
            height: 44,
            background: `${planetColor}22`,
            border: `1px solid ${planetColor}55`,
            color: planetColor,
          }}
        >
          {transit.transitingPlanet[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-white leading-snug">
            Transiting <span style={{ color: planetColor }}>{transit.transitingPlanet}</span>
            {transit.transitingRetrograde && <span className="text-white/40 text-[11px] ml-1">℞</span>}
            {' '}
            <span className="text-white/50">{transit.aspect}</span>
            {' '}
            natal <span className="text-white/90">{transit.natalPlanet}</span>
          </div>
          <div className="text-[11px] text-white/40 mt-0.5">
            {transit.transitingSign} → {transit.natalSign} · {orbLabel} · {daysLabel}
            {transit.applying ? ' · applying' : ' · separating'}
          </div>
        </div>
        {/* Inline-details toggle — secondary; the card itself opens the protocol */}
        <span
          role="button"
          aria-label="Toggle details"
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          className="text-lg text-white/30 flex-shrink-0 transition-transform px-2 py-1"
          style={{ transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)', cursor: 'pointer' }}
        >
          +
        </span>
      </button>

      {expanded && transit.interpretation && (
        <div className="px-4 pb-5 animate-fade-in">
          <div className="h-px bg-white/5 mb-4" />
          {transit.interpretation.effect && (
            <div className="mb-3">
              <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1">EFFECT IN YOUR BODY</div>
              <p className="text-[13px] text-white/75 leading-relaxed">{transit.interpretation.effect}</p>
            </div>
          )}
          {transit.interpretation.intervention && (
            <div className="mb-3">
              <div className="text-[10px] tracking-[0.2em] mb-1" style={{ color: planetColor }}>INTERVENTION</div>
              <p className="text-[13px] text-white/70 leading-relaxed">{transit.interpretation.intervention}</p>
            </div>
          )}
          {transit.interpretation.duration && (
            <div className="text-[11px] text-white/40 italic mb-3">
              Duration of this transit window: {transit.interpretation.duration}
            </div>
          )}

          {/* Directive I.2 — informational + a fork suggestion (no audio) */}
          <div className="text-[12px] text-white/55 leading-relaxed mb-4">
            <span style={{ color: planetColor }}>♪</span> Strike your{' '}
            <span style={{ color: planetColor }}>{transit.transitingPlanet} fork</span> on your own for
            ~5 minutes (up to 10 to go deeper).
          </div>

          {/* v4.0 — View Protocol CTA (Final 20% Directive minor fix §1) */}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenProtocol() }}
            className="group w-full flex items-center justify-between pl-5 pr-1.5 py-1.5 rounded-full kowalski-button"
            style={{
              background: `linear-gradient(135deg, ${hexAlpha(planetColor, 0.20)} 0%, ${hexAlpha(planetColor, 0.06)} 100%)`,
              border: `1px solid ${hexAlpha(planetColor, 0.42)}`,
              boxShadow: `0 0 18px -4px ${hexAlpha(planetColor, 0.45)}`,
              color: 'rgba(255,255,255,0.95)',
              transition: 'all 400ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            <span className="font-cinzel font-semibold text-[12px] tracking-[0.18em] uppercase">
              View Protocol
            </span>
            <span
              className="btn-magnetic-icon w-8 h-8 rounded-full flex items-center justify-center text-[13px]"
              style={{
                background: hexAlpha(planetColor, 0.28),
                border: `1px solid ${hexAlpha(planetColor, 0.5)}`,
                color: planetColor,
              }}
            >
              →
            </span>
          </button>
        </div>
      )}
    </GlassCard>
  )
}

// ═══════════════════════════════════════════════════════════════
// SYMPTOM CARD — routed symptom with evidence
// ═══════════════════════════════════════════════════════════════
function SymptomCard({ symptom }: { symptom: SymptomRouting }) {
  const planetColor = PLANET_COLORS[symptom.primaryPlanet] ?? '#8B5CF6'

  return (
    <GlassCard accentColor={planetColor} opacity={0.12} className="p-5">
      <div className="text-[10px] tracking-[0.25em] text-white/40 mb-1">REPORTED SYMPTOM</div>
      <div className="font-cinzel text-[18px] text-white mb-3 capitalize">{symptom.reportedSymptom}</div>

      <p className="text-[14px] text-white/85 leading-relaxed mb-3">
        {symptom.rootCause.headline}
      </p>
      {symptom.matchedSubtypeDescription && (
        <p className="text-[12px] text-white/55 italic mb-3">
          Subtype: {symptom.matchedSubtypeDescription}
        </p>
      )}

      <div className="mb-3">
        <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1.5">EVIDENCE FROM YOUR CHART</div>
        <ul className="space-y-1">
          {symptom.evidence.map((e, i) => (
            <li key={i} className="text-[12px] text-white/65 flex gap-2 leading-relaxed">
              <span style={{ color: planetColor }}>·</span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      </div>

      {symptom.rootCause.bodyLayer && (
        <div className="mb-3">
          <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1">WHAT IT DOES IN YOUR BODY</div>
          <p className="text-[13px] text-white/75 leading-relaxed">{symptom.rootCause.bodyLayer}</p>
        </div>
      )}
      {symptom.rootCause.actionLayer && (
        <div className="mb-3">
          <div className="text-[10px] tracking-[0.2em] mb-1" style={{ color: planetColor }}>WHAT TO DO</div>
          <p className="text-[13px] text-white/70 leading-relaxed">{symptom.rootCause.actionLayer}</p>
        </div>
      )}

      {symptom.recommendedCellSalt?.saltName && (
        <div className="mt-4 p-3 rounded-lg border border-white/10 bg-white/3">
          <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1">RECOMMENDED CELL SALT</div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-cinzel text-[14px] text-white">{symptom.recommendedCellSalt.saltShort}</span>
            <span className="text-[11px] text-white/40 italic">{symptom.recommendedCellSalt.epithet}</span>
          </div>
          {/* v3 — show the keynote FACET that matches the routed symptom
              (emotional vs physical), never a blind physical default. */}
          {(symptom.recommendedCellSalt.displaySignal ?? symptom.recommendedCellSalt.plainLanguageSignal) && (
            <p className="text-[12px] text-white/55 mt-1 italic">
              {symptom.recommendedCellSalt.displaySignal ?? symptom.recommendedCellSalt.plainLanguageSignal}
            </p>
          )}
          {/* v3 — one-line "why this salt" turns a correct pairing from random → intentional */}
          {symptom.recommendedCellSalt.matchReason && (
            <p className="text-[11px] text-white/45 mt-1.5 leading-snug">{symptom.recommendedCellSalt.matchReason}</p>
          )}
          {/* v3 — honest domain-overlap score; weak fits are labeled "loose match" */}
          {typeof symptom.recommendedCellSalt.matchScore === 'number' && (
            <div
              className="mt-2 inline-block text-[9px] tracking-[0.18em] uppercase px-2 py-0.5 rounded-full"
              style={{
                color: symptom.recommendedCellSalt.looseMatch ? 'rgba(255,255,255,0.5)' : planetColor,
                background: symptom.recommendedCellSalt.looseMatch ? 'rgba(255,255,255,0.05)' : hexAlpha(planetColor, 0.12),
                border: `1px solid ${symptom.recommendedCellSalt.looseMatch ? 'rgba(255,255,255,0.15)' : hexAlpha(planetColor, 0.35)}`,
              }}
            >
              {symptom.recommendedCellSalt.looseMatch
                ? 'Loose match · traditional association'
                : `${symptom.recommendedCellSalt.matchScore}% salt match`}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${symptom.activationScore}%`, background: planetColor }}
          />
        </div>
        <span className="text-[10px] text-white/40 tracking-widest">{symptom.activationScore}% MATCH</span>
      </div>
    </GlassCard>
  )
}

// ═══════════════════════════════════════════════════════════════
// CELL SALT CARD — compact mineral foundation card
// ═══════════════════════════════════════════════════════════════
function CellSaltCard({
  salt,
  label,
  highlight = false,
}: {
  salt: CellSaltPrescription
  label: string
  highlight?: boolean
}) {
  const color = salt.color ?? '#94A3B8'
  return (
    <GlassCard accentColor={color} opacity={highlight ? 0.20 : 0.08} className="p-5">
      <div className="text-[10px] tracking-[0.25em] mb-2" style={{ color }}>
        {label}
      </div>
      <div className="font-cinzel text-[18px] text-white mb-0.5">{salt.saltName}</div>
      <div className="text-[11px] text-white/50 mb-2">{salt.saltShort} · {salt.sign} · {salt.epithet}</div>
      {salt.plainLanguageSignal && (
        <p className="text-[12px] text-white/65 leading-relaxed italic mb-3">{salt.plainLanguageSignal}</p>
      )}
      {salt.foodSources && salt.foodSources.length > 0 && (
        <div className="mb-2">
          <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1">FOOD SOURCES</div>
          <div className="text-[12px] text-white/60">{salt.foodSources.slice(0, 5).join(' · ')}</div>
        </div>
      )}
      {/* SHA — no dosages anywhere. The cell salt is a mineral-foundation
          reference (what it is, what it supports, food sources), not a dose. */}
      {salt.affirmation && (
        <div className="mt-3 p-2 rounded border-l-2 italic text-[12px] text-white/65" style={{ borderColor: color, background: `${color}08` }}>
          &ldquo;{salt.affirmation}&rdquo;
        </div>
      )}
    </GlassCard>
  )
}

// ═══════════════════════════════════════════════════════════════
// PRESCRIPTION CARD — one unified 5-sense protocol
// ═══════════════════════════════════════════════════════════════
function PrescriptionCard({
  rx,
  expanded,
  onToggle,
  protocol,
  mode,
}: {
  rx: UnifiedPrescription
  expanded: boolean
  onToggle: () => void
  protocol: ProtocolOutput
  mode: AppMode
}) {
  const color = PLANET_COLORS[rx.signature.planet] ?? '#8B5CF6'
  const sourceLabel = {
    dominant: 'PRIMARY · CHART SIGNATURE',
    symptom:  'SYMPTOM-ROUTED',
    transit:  'TRANSIT-DRIVEN',
  }[rx.signature.source]

  return (
    <GlassCard accentColor={color} opacity={expanded ? 0.18 : 0.10} className="overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-start gap-4 p-5 text-left">
        <div
          className="flex-shrink-0 flex items-center justify-center font-cinzel text-lg rounded-[12px]"
          style={{
            width: 52, height: 52,
            background: `${color}22`,
            border: `1px solid ${color}55`,
            color,
          }}
        >
          {rx.signature.planet[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] tracking-[0.25em] text-white/40 mb-1">{sourceLabel}</div>
          <div className="font-cinzel text-[18px] text-white mb-1">{rx.prescription.headline}</div>
          <div className="text-[12px] text-white/50 mb-2 leading-snug">{rx.signature.triggerLabel}</div>
          <p className="text-[13px] text-white/70 leading-relaxed">{rx.prescription.summary}</p>
        </div>
        <div
          className="text-lg text-white/30 flex-shrink-0 transition-transform"
          style={{ transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 animate-fade-in">
          <div className="h-px bg-white/5 mb-5" />

          {/* Five senses grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <SenseTile
              icon="♪" label="SOUND" color={color}
              primary={
                mode === 'practitioner'
                  ? (rx.fiveSenses.sound.hz ? `${rx.fiveSenses.sound.hz} Hz` : rx.fiveSenses.sound.fork)
                  : userSoundLabel(
                      rx.signature.planet,
                      protocol.polarityResults?.find((p) => p.planet === rx.signature.planet),
                    )
              }
              detail={rx.fiveSenses.sound.instruction}
            />
            <SenseTile
              icon="◎" label="SCENT" color={color}
              primary={rx.fiveSenses.scent.oils.join(' · ') || '—'}
              detail={rx.fiveSenses.scent.instruction}
            />
            <SenseTile
              icon="◇" label="TASTE" color={color}
              primary={rx.fiveSenses.taste.tea}
              detail={rx.fiveSenses.taste.ingredients.join(' · ')}
            />
            <SenseTile
              icon="⬡" label="BODY" color={color}
              primary={rx.fiveSenses.body.breath.replace(/_/g, ' ')}
              detail={`Posture: ${rx.fiveSenses.body.placement.replace(/_/g, ' ')} · Movement: ${rx.fiveSenses.body.movement.replace(/_/g, ' ')}`}
            />
            <div className="sm:col-span-2">
              <SenseTile
                icon="✦" label="SIGHT" color={color}
                primary={rx.fiveSenses.sight.colors.join(' · ') || '—'}
                detail={rx.fiveSenses.sight.instruction}
                colorSwatches={rx.fiveSenses.sight.colors}
              />
            </div>
          </div>

          {/* Mineral / Botanical / Crystal / Fork bundle */}
          <div className="space-y-2 mb-5">
            {rx.mineral?.saltName && (
              <BundleRow label="CELL SALT" color={color}>
                <span className="font-cinzel text-white">{rx.mineral.saltShort}</span>
                <span className="text-white/40"> · </span>
                <span className="text-white/60">{rx.mineral.sign}</span>
                <span className="text-white/40"> · </span>
                <span className="text-white/55 italic">{rx.mineral.epithet}</span>
              </BundleRow>
            )}
            {rx.botanical?.sacredBotanical && (
              <BundleRow label="SACRED BOTANICAL" color={color}>
                <span className="font-cinzel text-white">{rx.botanical.sacredBotanical}</span>
                <span className="text-white/40"> · </span>
                <span className="text-white/55 italic">{rx.botanical.latinName}</span>
              </BundleRow>
            )}
            {rx.crystal?.featuredCrystal && (
              <BundleRow label="FEATURED CRYSTAL" color={color}>
                <span className="font-cinzel text-white">{rx.crystal.featuredCrystal}</span>
                {rx.crystal.featuredCrystalData?.bodyPlacement && (
                  <>
                    <span className="text-white/40"> · placement: </span>
                    <span className="text-white/65">{rx.crystal.featuredCrystalData.bodyPlacement}</span>
                  </>
                )}
                {rx.crystal.featuredCrystal === 'Malachite' && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white">
                    ⚠ POLISHED/SEALED ONLY
                  </span>
                )}
              </BundleRow>
            )}
            {rx.fork && mode === 'practitioner' && (
              <BundleRow label="TUNING FORK" color={color}>
                <span className="font-cinzel text-white">{rx.fork.planet}</span>
                <span className="text-white/40"> · </span>
                <span className="text-white/65 font-mono-jb">{rx.fork.hz} Hz</span>
                {rx.fork.note && (
                  <>
                    <span className="text-white/40"> · note </span>
                    <span className="text-white/65">{rx.fork.note}</span>
                  </>
                )}
                {rx.fork.boneApplicationPoint && (
                  <>
                    <span className="text-white/40"> · apply at </span>
                    <span className="text-white/65">{rx.fork.boneApplicationPoint}</span>
                  </>
                )}
              </BundleRow>
            )}
          </div>

          {/* Integration note — the step-by-step */}
          {rx.integrationNote && (
            <div className="p-4 rounded-lg border border-white/10" style={{ background: `${color}08` }}>
              <div className="text-[10px] tracking-[0.25em] mb-2" style={{ color }}>
                INTEGRATION — HOW TO WEAVE THE 5 SENSES
              </div>
              <p className="text-[13px] text-white/75 leading-relaxed">{rx.integrationNote}</p>
            </div>
          )}

          {/* Safety notes */}
          {rx.safetyNotes && rx.safetyNotes.length > 0 && (
            <div className="mt-3 space-y-1">
              {rx.safetyNotes.map((note, i) => (
                <p key={i} className={`text-[11px] leading-relaxed ${note.startsWith('⚠') ? 'text-red-300 font-semibold' : 'text-white/40 italic'}`}>
                  {note}
                </p>
              ))}
            </div>
          )}

          {/* Directive I.2 — no preview audio on Results. The sound for this
              prescription plays in the chamber, where it can be controlled. */}
          {rx.signature.source === 'dominant' && (
            <div className="mt-4 flex items-center gap-2 text-[11px] text-white/45 italic">
              <span style={{ color }}>♫</span>
              Hear this calibration in your chamber — the only place audio plays.
            </div>
          )}
        </div>
      )}
    </GlassCard>
  )
}

// ═══════════════════════════════════════════════════════════════
// SENSE TILE — one of 5 sensory channels
// ═══════════════════════════════════════════════════════════════
function SenseTile({
  icon, label, color, primary, detail, colorSwatches,
}: {
  icon: string; label: string; color: string
  primary: string; detail?: string
  colorSwatches?: string[]
}) {
  return (
    <div className="p-3 rounded-lg border border-white/10" style={{ background: 'rgba(255,255,255,0.025)' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ color, fontSize: 16 }}>{icon}</span>
        <span className="text-[10px] tracking-[0.25em] text-white/45">{label}</span>
      </div>
      <div className="text-[13px] text-white/85 font-medium mb-1">{primary}</div>
      {colorSwatches && colorSwatches.length > 0 && (
        <div className="flex gap-1.5 mb-1.5">
          {colorSwatches.slice(0, 4).map((c, i) => (
            <div
              key={i}
              className="rounded border border-white/15"
              style={{ width: 22, height: 22, background: c }}
            />
          ))}
        </div>
      )}
      {detail && <p className="text-[11px] text-white/55 leading-relaxed">{detail}</p>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BUNDLE ROW — one item in the mineral/botanical/crystal/fork bundle
// ═══════════════════════════════════════════════════════════════
function BundleRow({
  label, color, children,
}: {
  label: string; color: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline gap-3 py-1.5 border-b border-white/5 last:border-b-0">
      <div className="text-[10px] tracking-[0.2em] text-white/40 shrink-0" style={{ minWidth: 130 }}>
        {label}
      </div>
      <div className="text-[13px] flex-1 leading-snug">{children}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CALIBRATION TODAY — Phase 1 action-first hero
// The very first thing every user sees on Results. Plain language:
// what to DO today, before any astrology. A zero-astrology newcomer
// can act immediately. Felt-state leads; the planet is a tappable
// "signal" tag (a hook for the Phase-2 Teacher).
//
// Determinism: reads engine output only (no Math.random). Compliance:
// probabilistic framing, no medical claims — these are invitations to
// a wellness practice, not a diagnosis.
// ═══════════════════════════════════════════════════════════════

// Plain-language felt-state framing — H.0.3: PLANET-TRUE. The felt word and the
// corrective lean come from the planet's element + state via feltStateLanguage
// (engine.ts), so a Mercury-excess reads "running fast → settle, slow, ground",
// never the fire metaphor "hot → cool".
function feltLinesFor(planet: string, state: string): { headline: string; lean: string } {
  const lang = feltStateLanguage(planet, state)
  if (state === 'balanced') {
    return { headline: 'Your signal today reads as steady.', lean: 'holding your center' }
  }
  return {
    headline: `Your signal today may read as ${lang.felt}.`,
    lean: lang.verbs,
  }
}

// One action row in the hero — a sense label + the plain-language instruction.
function ActionRow({
  label, accent, children,
}: { label: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 py-2 border-b border-white/5 last:border-b-0">
      <div
        className="text-[10px] uppercase tracking-[0.22em] shrink-0 font-medium"
        style={{ minWidth: 64, color: hexAlpha(accent, 0.85) }}
      >
        {label}
      </div>
      <div className="text-[13.5px] flex-1 leading-snug text-content">{children}</div>
    </div>
  )
}

// Appendix A — one labeled field of the Today's Resonance signal card.
function SignalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.28em] text-meta mb-0.5">{label}</div>
      <div>{children}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SIGNAL STACK — Directive B.1 Step 5 (tier-gated)
// Individual: the primary clean + a one-line root hint that opens Astryx.
// Practitioner: the full surface → root → aggravator differential.
// ═══════════════════════════════════════════════════════════════
function SignalStack({
  hierarchy, mode, accentColor, onAskTeacher,
}: {
  hierarchy: import('@/types').SignalHierarchy
  mode: AppMode
  accentColor: string
  onAskTeacher: (seed?: string) => void
}) {
  const { primary, secondary, tertiary, reportedPlanet } = hierarchy
  const isPro = mode === 'practitioner'
  const st = (s: string) => (s !== 'balanced' ? ` · ${s}` : '')
  return (
    <div className="mb-4">
      {/* B.1 cleanup — keep the tapped planet visible: show the bridge when the
          reading routes a reported signal to a different primary. */}
      {reportedPlanet && (
        <p className="text-[12px] text-content-sm mb-2 leading-relaxed">
          You reported a <strong style={{ color: PLANET_COLORS[reportedPlanet] ?? accentColor }}>{reportedPlanet}</strong> signal
          {' '}→ it traces to a <strong style={{ color: PLANET_COLORS[primary.planet] ?? accentColor }}>{primary.planet}{secondary ? `–${secondary.planet}` : ''}</strong> root.
        </p>
      )}
      <div className="text-[10px] uppercase tracking-[0.25em] text-label mb-1.5">Signal stack</div>
      <div className="flex flex-wrap gap-1.5 items-center">
        <Tag
          label={`SURFACE · ${primary.planet}${st(primary.state)}`}
          accent={hexAlpha(PLANET_COLORS[primary.planet] ?? accentColor, 0.5)}
          small
        />
        {isPro && secondary && (
          <Tag label={`ROOT · ${secondary.planet}${st(secondary.state)}`} accent="rgba(255,255,255,0.2)" small />
        )}
        {isPro && tertiary && (
          <Tag label={`AGGRAVATOR · ${tertiary.planet}${st(tertiary.state)}`} accent="rgba(255,255,255,0.14)" small />
        )}
      </div>
      {!isPro && secondary && (
        <button
          onClick={() => onAskTeacher(`What's the ${secondary.planet} root beneath my ${primary.planet} signal today?`)}
          className="kowalski-button mt-1.5 text-[11.5px] text-left"
          style={{ color: hexAlpha(accentColor, 0.85) }}
        >
          Beneath it, a {secondary.planet} root — ask Astryx ↗
        </button>
      )}
    </div>
  )
}

function CalibrationToday({
  protocol, mode, accentColor, onStartSession, onAskTeacher,
}: {
  protocol: ProtocolOutput
  mode: AppMode
  accentColor: string
  onStartSession: () => void
  onAskTeacher: (seed?: string) => void
}) {
  // Primary unified prescription = the dominant signature (polarity-corrective).
  // Fall back to the raw five-sense plan if prescriptions aren't populated.
  const rx   = protocol.prescriptions?.[0]
  const plan = protocol.plan
  const polarity = protocol.dominantPolarity

  // FIX 7 / Appendix A — the signal is the ONE source of truth (signalHierarchy).
  const primary = protocol.signalHierarchy?.primary
  const planet  = primary?.planet ?? rx?.signature.planet ?? protocol.diagnostic?.dominantPlanet ?? 'Sun'
  const state   = primary?.state ?? polarity?.dominant_state ?? 'balanced'
  const planetColor = PLANET_COLORS[planet] ?? accentColor

  // Appendix A fields — resonance vocabulary (never "excess"), approved Why lines.
  const frequencySignal = signalWord(planet, state)
  const why             = whyLine(planet, state)
  const regulator       = polarity?.protocol?.regulator_planets?.[0]
  const correctiveDir   = polarity?.protocol?.corrective_direction ?? []
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const calibrationResponse = state !== 'balanced' && correctiveDir.length
    ? correctiveDir.slice(0, 3).map(cap).join('. ') + '.'
    : 'Draw on this steady signal to support the rest of your field.'
  // v4 FIX 2 — print the REAL ordered sequence the Chamber + Summary run for the
  // user's selected container, via the shared helper. Never a hardcoded "X with Y
  // support" string derived separately from the engine's phase array.
  const chamberDurationKey = useAppStore((s) => s.chamberDurationKey)
  const chamberPreset = getDurationPreset(chamberDurationKey)
  const forkSteps = chamberPreset.fullSpectrum
    ? buildFullSpectrumSequence({ durationSec: chamberPreset.durationSec })
    : buildForkSequence({
        hierarchy:        protocol.signalHierarchy,
        polarity:         protocol.dominantPolarity,
        polarityResults:  protocol.polarityResults,
        intentionPlanet:  protocol.intentionPlanet,
        architecture:     chamberPreset.architecture,
        durationSec:      chamberPreset.durationSec,
        forkCount:        chamberPreset.forkCount,
        tier:             mode === 'practitioner' ? 'practitioner' : 'individual',
      })
  const forkSeqArr = forkSequenceDisplay(forkSteps)
  const forkSequence = forkSeqArr.length ? forkSeqArr.join(' → ') : `${planet} Resonance`

  // Five plain-language actions, prescription first then plan fallback.
  const breath = rx?.fiveSenses.body.breath  ?? plan?.body?.breath  ?? '4-7-8 breath'
  const oils   = rx?.fiveSenses.scent.oils   ?? plan?.scent?.oils   ?? []
  const tea    = rx?.fiveSenses.taste.tea
  const taste  = rx?.fiveSenses.taste.ingredients ?? plan?.taste?.ingredients ?? []
  const color  =
    rx?.fiveSenses.sight.colors?.[0] ??
    plan?.sight?.colors?.[0] ??
    plan?.sight?.primary_colors?.[0]
  const soundLabel = userSoundLabel(planet, polarity)
  void feltStateLanguage

  return (
    <div className="mb-6 animate-fade-in-up">
      <div
        className="relative p-1.5 rounded-[2rem]"
        style={{
          background: `linear-gradient(135deg, ${hexAlpha(planetColor, 0.20)} 0%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.02) 100%)`,
          border: `1px solid ${hexAlpha(planetColor, 0.30)}`,
          boxShadow: `0 28px 60px -30px ${hexAlpha(planetColor, 0.50)}, inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        <div
          className="relative p-6 sm:p-8 rounded-[calc(2rem-0.375rem)] overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 0% 0%, rgba(94,224,255,0.06) 0%, rgba(2,2,8,0.93) 55%, rgba(2,2,8,0.96) 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.10)',
          }}
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full"
               style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${hexAlpha(planetColor, 0.30)}` }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-cosmic-pulse"
                  style={{ background: planetColor, boxShadow: `0 0 8px ${planetColor}` }} />
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium"
                  style={{ color: hexAlpha(planetColor, 0.9) }}>
              Today&apos;s Resonance
            </span>
          </div>

          {/* Appendix A — the canonical signal card */}
          <div className="space-y-3 mb-5">
            <SignalField label="Frequency Signal">
              <span className="font-cinzel text-[26px] sm:text-[30px] leading-none" style={{ color: planetColor }}>
                {frequencySignal}
              </span>
            </SignalField>
            <SignalField label="Planetary Carrier">
              <button
                onClick={() => onAskTeacher(`What does ${planet} mean in my chart, and why is it my signal today?`)}
                className="kowalski-button inline-flex items-center gap-1.5 text-[15px] text-content"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {planet}
                <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: hexAlpha(planetColor, 0.85) }}>· learn this</span>
              </button>
            </SignalField>
            <SignalField label="Calibration Response">
              <span className="text-[14px] text-content leading-snug">{calibrationResponse}</span>
            </SignalField>
            <SignalField label="Fork Sequence">
              <span className="text-[14px] text-content leading-snug">{forkSequence}</span>
            </SignalField>
            <SignalField label="Why">
              <span className="text-[13px] text-content-sm italic leading-relaxed">{why}</span>
            </SignalField>
          </div>

          <div className="text-[10px] uppercase tracking-[0.25em] text-meta mb-2">Five small things to try — pick any</div>

          {/* The five plain-language actions */}
          <div className="rounded-2xl px-4 sm:px-5 py-1.5 mb-5"
               style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ActionRow label="Sound" accent={planetColor}>
              {soundLabel}
              {mode === 'practitioner' && rx?.fiveSenses.sound?.hz
                ? <span className="text-meta"> · {rx.fiveSenses.sound.hz} Hz</span> : null}
            </ActionRow>
            <ActionRow label="Breath" accent={planetColor}>{breath}</ActionRow>
            {oils.length > 0 && (
              <ActionRow label="Scent" accent={planetColor}>
                {oils.slice(0, 3).join(' · ')}
              </ActionRow>
            )}
            {(tea || taste.length > 0) && (
              <ActionRow label="Taste" accent={planetColor}>
                {tea ? <strong className="text-content">{tea}</strong> : null}
                {tea && taste.length > 0 ? ' — ' : ''}
                {taste.slice(0, 3).join(' · ')}
              </ActionRow>
            )}
          </div>

          {/* NO chamber button here — there is exactly ONE Enter Chamber, at the
              end of the report. (SHA: only one chamber entry, at the bottom.) */}

          {/* Sixth sense — Mind. The Teacher turns one-off resets into a
              daily practice of self-knowledge. */}
          <button
            onClick={() => onAskTeacher()}
            className="kowalski-button w-full mt-1 flex items-center justify-between rounded-2xl px-4 py-3 text-left"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="flex items-center gap-2.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: '#C084FC', boxShadow: '0 0 8px #C084FC' }} />
              <span>
                <span className="block text-[10px] uppercase tracking-[0.22em] text-meta">Sixth sense · Mind</span>
                <span className="block text-[13px] text-content">Ask Astryx why your calibration is what it is</span>
              </span>
            </span>
            <span className="text-[12px] text-white/50 shrink-0">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PREPARE YOUR SESSION — Directive G (+ Part F "Set your space")
// One session the user prepares for and steps into: brew the corrective tea
// (or reach for the oil), ready the PRIMARY fork (app tone if you don't own it),
// and set your space toward the corrective element. Invitations, never a
// checklist — the user authors how immersive it goes. The session then opens
// and closes on the primary (B.1), so they leave in the direction they came for.
// ═══════════════════════════════════════════════════════════════
function PrepareSession({
  protocol, mode, accentColor,
}: {
  protocol: ProtocolOutput
  mode: AppMode
  accentColor: string
}) {
  const rx   = protocol.prescriptions?.[0]
  const env  = protocol.environment
  const primaryPlanet = protocol.signalHierarchy?.primary.planet
    ?? protocol.diagnostic?.dominantPlanet ?? 'Sun'
  const planetColor = PLANET_COLORS[primaryPlanet] ?? accentColor
  const isPro = mode === 'practitioner'

  const tea  = rx?.fiveSenses.taste.tea
  const oils = rx?.fiveSenses.scent.oils ?? []
  const oil  = oils[0]

  return (
    <div className="mt-8 mb-3 animate-fade-in-up">
      <div className="flex items-baseline justify-between mb-3 px-1">
        <SectionLabel>Prepare your Chamber</SectionLabel>
        <span className="text-[10px] text-white/30 tracking-widest">IF YOU CAN</span>
      </div>
      <div
        className="rounded-[1.75rem] p-5 sm:p-6"
        style={{
          background: `linear-gradient(135deg, ${hexAlpha(planetColor, 0.10)} 0%, rgba(255,255,255,0.02) 60%)`,
          border: `1px solid ${hexAlpha(planetColor, 0.22)}`,
        }}
      >
        <p className="text-[13px] text-content-sm leading-relaxed mb-4">
          Gather what you have — none of it is required. Whatever you bring, the session is
          one act tuned to a single corrective frequency, and it closes where it began.
        </p>

        <div className="space-y-2.5">
          {/* Brew the tea (or reach for the oil) */}
          {(tea || oil) && (
            <PrepareStep label="Brew" color={planetColor}>
              {tea ? <>Steep <strong className="text-content">{tea}</strong> to have with you.</> : 'Brew your corrective blend to have with you.'}
              {oil && (
                <span className="block text-[12px] text-meta mt-0.5">
                  No tea? Reach for <strong className="text-content-sm">{oil}</strong> oil — it carries the same frequency.
                </span>
              )}
            </PrepareStep>
          )}

          {/* Ready the primary fork (app tone if not owned) */}
          <PrepareStep label="Tone" color={planetColor}>
            Ready your <strong className="text-content">{primaryPlanet} Resonance Fork</strong> — the tone this session calibrates.
            <span className="block text-[12px] text-meta mt-0.5">
              No forks yet? The Chamber introduces the tone sequence through guided audio — the full
              calibration is built for use with the Astryx Resonance Forks.
            </span>
          </PrepareStep>

          {/* Set your space (Part F) */}
          {env && (
            <PrepareStep label="Space" color={planetColor}>
              If you can, settle <strong className="text-content">{env.setting}</strong>.
              Stay <em>{env.posture}</em>; {env.tempo}.
              {isPro && (
                <span className="block text-[11px] text-meta mt-1 font-mono-jb">
                  {env.elementSource} · {env.polarity} · {env.modality}
                  {env.corrective ? ' · corrective' : ''}
                </span>
              )}
            </PrepareStep>
          )}
        </div>
      </div>
    </div>
  )
}

function PrepareStep({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5 border-b border-white/5 last:border-b-0">
      <div className="text-[10px] uppercase tracking-[0.22em] shrink-0 font-medium"
           style={{ minWidth: 52, color: hexAlpha(color, 0.85) }}>
        {label}
      </div>
      <div className="text-[13px] flex-1 leading-snug text-content">{children}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CHAMBER CTA — Deploy 1
// DNA-derived chamber name + duration selector + Preview (15s bake)
// + Start. Replaces the legacy "Start Session" button.
// ═══════════════════════════════════════════════════════════════

function ChamberCTA({
  protocol, mode, accentColor, onStart,
}: {
  protocol: ProtocolOutput
  mode: AppMode
  accentColor: string
  onStart: () => void
}) {
  const intakeData         = useAppStore((s) => s.intakeData)
  const birthCoords        = useAppStore((s) => s.birthCoords)
  const chamberDurationKey = useAppStore((s) => s.chamberDurationKey)
  const setChamberDurationKey = useAppStore((s) => s.setChamberDurationKey)

  // DNA — deterministic from chart + birth data + polarity
  const dna = useMemo(() => {
    return generateChamberDNA({
      protocol,
      birthData: {
        birthDate: intakeData.birthDate,
        birthTime: intakeData.birthTime || undefined,
        birthLatitude:  birthCoords?.lat,
        birthLongitude: birthCoords?.lon,
      },
      polarity: protocol.dominantPolarity,
    })
  }, [protocol, intakeData.birthDate, intakeData.birthTime, birthCoords?.lat, birthCoords?.lon])

  // Fix 5 — the three session containers (Individual: 15 + 30; Practitioner: all).
  const visiblePresets = durationsForMode(mode === 'practitioner' ? 'practitioner' : 'user')

  // Translucent chamber color tint pulled from DNA primary
  const chamberAccent = dna.colorDNA.primary

  return (
    // Directive I.3 — the chamber entry, gated to the end of the report flow.
    <div id="chamber-entry" className="mt-8 mb-3 animate-fade-in-up" style={{ scrollMarginTop: 96 }}>
      {/* Chamber identity card */}
      <div
        className="relative p-1.5 rounded-[2rem] mb-3"
        style={{
          background: `linear-gradient(135deg, ${hexAlpha(chamberAccent, 0.20)} 0%, rgba(255,255,255,0.03) 60%)`,
          border: `1px solid ${hexAlpha(chamberAccent, 0.32)}`,
          boxShadow: `0 24px 60px -28px ${hexAlpha(chamberAccent, 0.55)}`,
        }}
      >
        <div
          className="relative p-5 sm:p-7 rounded-[calc(2rem-0.375rem)] overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(94,224,255,0.06) 0%, rgba(2,2,8,0.94) 60%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.10)',
          }}
        >
          {/* Eyebrow + chamber name */}
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full"
               style={{
                 background: 'rgba(255,255,255,0.04)',
                 border: `1px solid ${hexAlpha(chamberAccent, 0.32)}`,
               }}>
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-cosmic-pulse"
              style={{ background: chamberAccent, boxShadow: `0 0 8px ${chamberAccent}` }}
            />
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium"
                  style={{ color: hexAlpha(chamberAccent, 0.92) }}>
              Your Chamber
            </span>
          </div>

          {/* FIX 10 — always "Resonance Chamber" (never "Pressure/Convergence
              Chamber"); the aspect quality is a soft subtitle. */}
          <h2
            className="font-cinzel font-semibold leading-[1.05] tracking-tight mb-2"
            style={{ fontSize: 'clamp(28px, 4.8vw, 42px)', color: 'rgba(255,255,255,0.96)' }}
          >
            Resonance Chamber
          </h2>
          <p className="text-[14px] sm:text-[15px] text-content-sm leading-relaxed mb-1">
            {dna.experientialDescription}
          </p>

          {/* Phase D — Polarity state callout. Shows the diagnostic state
              and the corrective intent so the user understands WHY the
              chamber sounds/looks the way it does. */}
          {dna.applyCorrective && dna.polarity && (
            <div
              className="mt-4 px-4 py-3 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${hexAlpha(dna.colorDNA.primary, 0.15)} 0%, rgba(255,255,255,0.02) 70%)`,
                border: `1px solid ${hexAlpha(dna.colorDNA.primary, 0.30)}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.22em] font-medium"
                  style={{
                    background: hexAlpha(dna.colorDNA.primary, 0.18),
                    border: `1px solid ${hexAlpha(dna.colorDNA.primary, 0.45)}`,
                    color: 'rgba(255,255,255,0.95)',
                  }}
                >
                  {dna.polarity.planet} · {signalWord(dna.polarity.planet, dna.polarity.dominant_state)}
                </span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-meta">
                  {dna.polarity.confidence_band} signal
                </span>
              </div>
              <p className="text-[13px] text-content leading-relaxed">
                This chamber is designed to{' '}
                <strong style={{ color: dna.colorDNA.primary }}>
                  {dna.polarity.protocol.corrective_direction.slice(0, 3).join(', ')}
                </strong>
                . Sound and color shift toward{' '}
                {dna.polarity.protocol.regulator_planets[0] ?? 'balancing'}{' '}
                character — supporting{' '}
                <em>{dna.polarity.protocol.support_style}</em> rather than amplifying the pattern.
              </p>
              {dna.polarity.protocol.avoid.length > 0 && (
                <p className="text-[11px] text-content-sm italic mt-2">
                  Avoid: {dna.polarity.protocol.avoid.slice(0, 4).join(' · ')}.
                </p>
              )}
            </div>
          )}

          {mode === 'practitioner' && (
            <div className="mt-3 px-3 py-2 rounded-lg"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-label mb-1">Practitioner trace</p>
              <p className="text-[11px] text-meta">
                {dna.technicalSignature} · <span className="font-mono-jb">{dna.signature}</span>
              </p>
              {dna.polarity && (
                <>
                  <p className="text-[11px] text-content-sm mt-1.5">
                    State: <strong>{dna.polarity.dominant_state}</strong>
                    {dna.polarity.secondary_state && ` (secondary: ${dna.polarity.secondary_state})`}
                    {' · '}confidence {dna.polarity.confidence} ({dna.polarity.confidence_band})
                  </p>
                  <p className="text-[10px] text-meta mt-1 leading-relaxed">
                    {dna.polarity.reasoning.slice(0, 5).join(' · ')}
                  </p>
                  <p className="text-[10px] text-meta mt-1">
                    Effective planet for chamber: <strong>{dna.effectivePlanet}</strong>
                    {dna.applyCorrective && dna.effectivePlanet !== dna.polarity.planet
                      ? ` (regulator for ${dna.polarity.planet} ${dna.polarity.dominant_state})`
                      : ''}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Duration selector */}
          <div className="mt-5">
            <div className="text-[10px] uppercase tracking-[0.25em] text-label mb-2">
              Duration
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visiblePresets.map((p) => {
                const active = chamberDurationKey === p.key
                const mins = Math.round(p.durationSec / 60)
                const shortLabel = p.key === '15_PERSONAL' ? 'Personal Recalibration'
                  : p.key === '30_DEEP' ? 'Deep Chamber'
                  : p.key === 'FULL_SPECTRUM' ? 'Full-Spectrum'
                  : 'Practitioner Session'
                return (
                  <button
                    key={p.key}
                    onClick={() => setChamberDurationKey(p.key as ChamberDurationKey)}
                    className="group flex flex-col items-start px-3 py-1.5 rounded-xl kowalski-button"
                    style={{
                      background: active
                        ? `linear-gradient(135deg, ${hexAlpha(chamberAccent, 0.25)} 0%, ${hexAlpha(chamberAccent, 0.08)} 100%)`
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? hexAlpha(chamberAccent, 0.55) : 'rgba(255,255,255,0.10)'}`,
                      boxShadow: active ? `0 0 16px -4px ${hexAlpha(chamberAccent, 0.55)}` : 'none',
                      transition: 'all 350ms cubic-bezier(0.32,0.72,0,1)',
                    }}
                  >
                    <span
                      className="text-[10px] uppercase tracking-[0.22em] font-medium"
                      style={{ color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.6)' }}
                    >
                      {shortLabel}
                    </span>
                    <span className="font-mono-jb text-[14px]"
                          style={{ color: active ? chamberAccent : 'rgba(255,255,255,0.75)' }}>
                      {mins} min
                    </span>
                  </button>
                )
              })}
            </div>
            {/* J.4 — Full-Spectrum framing (compliant, neutral): distinguishes the
                attunement pass from a corrective session. */}
            {chamberDurationKey === 'FULL_SPECTRUM' && (
              <p className="text-[12px] text-content-sm leading-relaxed mt-2.5 italic">
                A full-body attunement that sounds all ten forks, feet to head — an even maintenance pass, not a correction targeted to today&apos;s signal. It opens and closes with breathwork.
              </p>
            )}
          </div>

          {/* CTA row — Enter Chamber (the single audio environment; no preview
              on Results per Directive I.2) */}
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={onStart}
              className="group flex-1 min-w-[180px] flex items-center justify-between pl-6 pr-2 py-2 rounded-full kowalski-button"
              style={{
                background: `linear-gradient(135deg, ${hexAlpha(chamberAccent, 0.30)} 0%, ${hexAlpha(chamberAccent, 0.12)} 100%)`,
                border: `1px solid ${hexAlpha(chamberAccent, 0.55)}`,
                boxShadow: `0 22px 44px -18px ${hexAlpha(chamberAccent, 0.6)}`,
                color: 'rgba(255,255,255,0.95)',
                transition: 'all 500ms cubic-bezier(0.32,0.72,0,1)',
              }}
            >
              <span className="font-cinzel font-semibold tracking-[0.18em] uppercase text-[14px] sm:text-[15px]">
                Enter Chamber
              </span>
              <span
                className="btn-magnetic-icon w-11 h-11 rounded-full flex items-center justify-center text-[18px]"
                style={{
                  background: hexAlpha(chamberAccent, 0.32),
                  border: `1px solid ${hexAlpha(chamberAccent, 0.55)}`,
                  color: 'rgba(255,255,255,0.95)',
                }}
              >
                ⬡
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SOAP SECTION — used inside collapsible Full Chart
// ═══════════════════════════════════════════════════════════════
function SOAPSection({ label, items, accentColor }: { label: string; items: string[]; accentColor: string }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] tracking-[0.2em] mb-2" style={{ color: accentColor }}>{label}</div>
      {items.map((item, i) => (
        <p key={i} className="text-[13px] text-white/65 leading-relaxed pl-1">• {item}</p>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TRANSIT PROTOCOL MODAL — Final 20% Directive §1 (Cosmic Weather)
// Sound / Scent / Taste / Body / Sight layers for the transiting pair.
// Determines protocol from transit's two planets + aspect type.
// ═══════════════════════════════════════════════════════════════

function TransitProtocolModal({
  transit, mode, polarityResults, onClose, onStartSession,
}: {
  transit: ActiveTransit
  mode: AppMode
  polarityResults?: import('@/types').PolarityResultLike[]
  onClose: () => void
  onStartSession: () => void
}) {
  const isPractitioner = mode === 'practitioner'

  // Phase D — polarity correction reaches the transit modal. If the user has an
  // ACTIVE corrective (excess/deficiency/blocked at moderate+ confidence) for a
  // planet involved in this transit, the transit protocol adopts that planet's
  // corrective direction — so the app never amplifies a detected imbalance, even
  // in transit guidance (e.g. no "breath of fire" for a Mars-excess user).
  const corrective = useMemo(
    () => correctiveForTransit(transit, polarityResults),
    [transit, polarityResults],
  )

  // Frame tint shifts to the corrective palette when correcting, else planet color.
  const planetColor = corrective?.protocol.color_palette?.[0]
    ?? PLANET_COLORS[transit.transitingPlanet] ?? '#22D3EE'

  // Resolve protocol layers for the transit pair (corrective-aware)
  const tProto = useMemo(
    () => buildTransitProtocol(transit.transitingPlanet, transit.natalPlanet, transit.aspect, corrective),
    [transit, corrective],
  )

  // Directive I.2 — a transit is a passing influence, not a chamber. No audio
  // plays from this modal; instead it suggests striking the planet's own fork.
  const forkPlanet = corrective && isActiveCorrective(corrective)
    ? (corrective.protocol.regulator_planets?.[0] ?? corrective.planet)
    : transit.transitingPlanet

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8 animate-fade-in"
      style={{
        background: 'rgba(2,2,8,0.78)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full max-h-[88vh] overflow-y-auto p-1.5 rounded-[2rem] animate-slide-in-up"
        style={{
          background: `linear-gradient(180deg, ${hexAlpha(planetColor, 0.22)} 0%, rgba(255,255,255,0.03) 60%)`,
          border: `1px solid ${hexAlpha(planetColor, 0.32)}`,
          boxShadow: `0 32px 64px -24px ${hexAlpha(planetColor, 0.55)}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative p-6 sm:p-8 rounded-[calc(2rem-0.375rem)] overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(94,224,255,0.06) 0%, rgba(2,2,8,0.96) 60%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.10)',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[16px] kowalski-button"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.7)',
            }}
            aria-label="Close"
          >
            ×
          </button>

          {/* Header */}
          <div className="mb-6 pr-12">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full"
                 style={{
                   background: 'rgba(255,255,255,0.04)',
                   border: `1px solid ${hexAlpha(planetColor, 0.32)}`,
                 }}>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-cosmic-pulse"
                style={{ background: planetColor, boxShadow: `0 0 8px ${planetColor}` }}
              />
              <span className="text-[10px] uppercase tracking-[0.28em] font-medium"
                    style={{ color: hexAlpha(planetColor, 0.9) }}>
                Transit Protocol
              </span>
            </div>
            <h2
              className="font-cinzel font-semibold leading-[1.1] tracking-tight mb-2"
              style={{ fontSize: 'clamp(22px, 3vw, 30px)', color: 'rgba(255,255,255,0.95)' }}
            >
              {transit.transitingPlanet} {transit.aspect} {transit.natalPlanet}
            </h2>
            <p className="text-[13px] text-content-sm">
              {transit.transitingSign} → {transit.natalSign}
              {transit.applying ? ' · applying' : ' · separating'}
              {' · '}
              {Math.abs(transit.daysToExact).toFixed(0)}d to exact
            </p>
          </div>

          {/* Phase D — polarity correction callout (same intelligence as the chamber) */}
          {corrective && (
            <div
              className="mb-6 px-4 py-3 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${hexAlpha(planetColor, 0.16)} 0%, rgba(255,255,255,0.02) 70%)`,
                border: `1px solid ${hexAlpha(planetColor, 0.32)}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.22em] font-medium"
                  style={{
                    background: hexAlpha(planetColor, 0.18),
                    border: `1px solid ${hexAlpha(planetColor, 0.45)}`,
                    color: 'rgba(255,255,255,0.95)',
                  }}
                >
                  {corrective.planet} {corrective.dominant_state} detected
                </span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-meta">
                  {corrective.confidence_band} signal
                </span>
              </div>
              <p className="text-[13px] text-content leading-relaxed">
                This transit protocol is adjusted to{' '}
                <strong style={{ color: planetColor }}>
                  {corrective.protocol.corrective_direction.slice(0, 3).join(', ')}
                </strong>
                . It shifts toward{' '}
                {corrective.protocol.regulator_planets[0] ?? 'balancing'}{' '}
                character — supporting <em>{corrective.protocol.support_style}</em> rather than
                amplifying the pattern.
              </p>
              {corrective.protocol.avoid.length > 0 && (
                <p className="text-[11px] text-content-sm italic mt-2">
                  Avoid: {corrective.protocol.avoid.slice(0, 4).join(' · ')}.
                </p>
              )}
            </div>
          )}

          {/* Assessment summary */}
          {transit.interpretation?.effect && (
            <TransitSection title="Assessment" color={planetColor}>
              <p className="text-[14px] text-content leading-relaxed">{transit.interpretation.effect}</p>
              {transit.interpretation.intervention && (
                <p className="text-[13px] text-content-sm italic mt-2 leading-relaxed">
                  {transit.interpretation.intervention}
                </p>
              )}
            </TransitSection>
          )}

          {/* SOUND */}
          <TransitSection title="Sound" color={planetColor}>
            {isPractitioner ? (
              <p className="text-[13px] text-content leading-relaxed">
                {transit.transitingPlanet} anchor{' '}
                <span className="font-mono-jb" style={{ color: planetColor }}>{tProto.sound.transitingHz} Hz</span>
                {' '}paired with {transit.natalPlanet}{' '}
                <span className="font-mono-jb" style={{ color: planetColor }}>{tProto.sound.natalHz} Hz</span>.
                {' '}Earth Om regulator (app-played background){' '}
                <span className="font-mono-jb">136.10 Hz</span> — strike the planetary fork along with it.
                {' '}Aspect behavior: <span className="text-white/85">{tProto.sound.behavior}</span>.
              </p>
            ) : (
              <p className="text-[13px] text-content leading-relaxed">
                {tProto.sound.userLabel}. A {tProto.sound.character.toLowerCase()} soundscape designed to
                {' '}{tProto.sound.purpose.toLowerCase()}.
              </p>
            )}

            {/* Directive I.2 — a transit is a passing influence: strike the
                fork on your own. No playback here; the chamber owns the audio. */}
            <div
              className="mt-3 px-3 py-2.5 rounded-lg"
              style={{ background: hexAlpha(planetColor, 0.08), border: `1px solid ${hexAlpha(planetColor, 0.25)}` }}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] mb-0.5" style={{ color: hexAlpha(planetColor, 0.9) }}>
                On your own
              </div>
              <p className="text-[12.5px] text-content leading-relaxed">
                Strike your <strong style={{ color: planetColor }}>{forkPlanet} fork</strong> for about
                5 minutes — up to 10 if you want to go deeper. A transit is a passing influence; a short
                pass is enough. Your full calibration lives in the chamber.
              </p>
            </div>
          </TransitSection>

          {/* SCENT */}
          <TransitSection title="Scent" color={planetColor}>
            <p className="text-[13px] text-content leading-relaxed">{tProto.scent.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tProto.scent.oils.map((o, i) => (
                <span key={i}
                  className="px-2.5 py-0.5 rounded-full text-[11px]"
                  style={{
                    background: hexAlpha(planetColor, 0.12),
                    border: `1px solid ${hexAlpha(planetColor, 0.3)}`,
                    color: 'rgba(255,255,255,0.9)',
                  }}>{o}</span>
              ))}
            </div>
          </TransitSection>

          {/* TASTE */}
          <TransitSection title="Taste / Herbal" color={planetColor}>
            <p className="text-[13px] text-content leading-relaxed">{tProto.taste.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tProto.taste.ingredients.map((i, k) => (
                <span key={k}
                  className="px-2.5 py-0.5 rounded-full text-[11px]"
                  style={{
                    background: hexAlpha(planetColor, 0.10),
                    border: `1px solid ${hexAlpha(planetColor, 0.25)}`,
                    color: 'rgba(255,255,255,0.85)',
                  }}>{i}</span>
              ))}
            </div>
          </TransitSection>

          {/* BODY */}
          <TransitSection title="Body" color={planetColor}>
            <p className="text-[13px] text-content leading-relaxed">{tProto.body.description}</p>
            <ul className="mt-2 space-y-1 text-[12px] text-content-sm">
              <li>Breath — {tProto.body.breath}</li>
              <li>Movement — {tProto.body.movement}</li>
            </ul>
          </TransitSection>

          {/* SIGHT */}
          <TransitSection title="Sight / Color · Geometry" color={planetColor}>
            <p className="text-[13px] text-content leading-relaxed">{tProto.sight.description}</p>
            <div className="flex items-center gap-2 mt-3">
              {tProto.sight.colors.map((c, i) => (
                <span key={i}
                  className="w-6 h-6 rounded-full"
                  style={{ background: c, boxShadow: `0 0 10px ${c}` }}
                  title={c}
                />
              ))}
              <span className="text-[11px] text-content-sm ml-1 capitalize">
                {tProto.sight.geometry}
              </span>
            </div>
          </TransitSection>

          {/* Practitioner-only details */}
          {isPractitioner && transit.interpretation?.duration && (
            <TransitSection title="Practitioner Notes" color={planetColor}>
              <p className="text-[12px] text-content-sm italic leading-relaxed">
                Window duration: {transit.interpretation.duration}. Orb {transit.orb.toFixed(1)}°.
                Sacred Tone reference: {transit.transitingPlanet} fork @ {tProto.sound.transitingHz} Hz.
              </p>
            </TransitSection>
          )}

          {/* CTA — Directive I.3: route to the gated chamber entry, not a
              direct launch. Closes the modal and scrolls down to Enter Chamber. */}
          <button
            onClick={() => { onClose(); requestAnimationFrame(scrollToChamberEntry) }}
            className="group mt-6 w-full flex items-center justify-between pl-6 pr-2 py-2 rounded-full kowalski-button"
            style={{
              background: `linear-gradient(135deg, ${hexAlpha(planetColor, 0.30)} 0%, ${hexAlpha(planetColor, 0.12)} 100%)`,
              border: `1px solid ${hexAlpha(planetColor, 0.5)}`,
              boxShadow: `0 22px 44px -18px ${hexAlpha(planetColor, 0.55)}`,
              color: 'rgba(255,255,255,0.95)',
              transition: 'all 500ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            <span className="font-cinzel font-semibold text-[14px] tracking-[0.18em] uppercase">
              To your chamber ↓
            </span>
            <span
              className="btn-magnetic-icon w-11 h-11 rounded-full flex items-center justify-center text-[17px]"
              style={{
                background: hexAlpha(planetColor, 0.32),
                border: `1px solid ${hexAlpha(planetColor, 0.55)}`,
                color: 'rgba(255,255,255,0.95)',
              }}
            >
              ⬡
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

function TransitSection({
  title, color, children,
}: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 pb-5 last:mb-0 last:pb-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-[10px] uppercase tracking-[0.28em] font-medium mb-2"
           style={{ color: hexAlpha(color, 0.85) }}>
        {title}
      </div>
      {children}
    </div>
  )
}

// ─── Per-transit protocol composer ──────────────────────────────
// Builds the 5-layer protocol bundle from transit's planet pair + aspect.
// Reads from planetary-anchors, scents, herbs, body-protocols, colors,
// geometry data — same source library as the main runEngine output.

interface TransitProtocol {
  sound: {
    transitingHz: number
    natalHz: number
    behavior: string
    userLabel: string
    character: string
    purpose: string
  }
  scent: { oils: string[]; description: string }
  taste: { ingredients: string[]; description: string }
  body: { breath: string; movement: string; description: string }
  sight: { colors: string[]; geometry: string; description: string }
}

// Is this polarity result an ACTIVE corrective? (mirrors engine shouldApplyPolarity)
function isActiveCorrective(r?: import('@/types').PolarityResultLike): boolean {
  return !!r && r.dominant_state !== 'balanced' && r.confidence_band !== 'weak'
}

// Find the active corrective (if any) for a planet involved in this transit.
// polarityResults is already sorted by confidence (desc), so the FIRST active
// match — whether the transiting or natal planet — is the strongest signal.
// This prefers a user-reported strong correction over a weaker chart-inferred
// one when a transit involves two corrected planets.
function correctiveForTransit(
  transit: ActiveTransit,
  polarityResults?: import('@/types').PolarityResultLike[],
): import('@/types').PolarityResultLike | null {
  if (!polarityResults?.length) return null
  return (
    polarityResults.find(
      (r) =>
        isActiveCorrective(r) &&
        (r.planet === transit.transitingPlanet || r.planet === transit.natalPlanet),
    ) ?? null
  )
}

// Corrective breath token → user-facing label (mirrors engine.ts breathLabel).
const CORRECTIVE_BREATH_LABELS: Record<string, string> = {
  '4-7-8':               '4-7-8 extended exhale (4 in, 7 hold, 8 out)',
  box_breathing:         'Box breathing — 4 in · 4 hold · 4 out · 4 hold',
  extended_exhale:       'Extended exhale — inhale 4, exhale 8',
  balanced:              '4-4 balanced rhythmic breathing',
  balanced_activating:   'Balanced activating — 4 in, 2 hold, 4 out',
  soft_extended:         'Soft extended breath — gentle inhale, long slow exhale',
  warm_expansive:        'Warm expansive breath — open chest, full inhale',
  gentle_release:        'Gentle release breath — soft inhale, easy exhale',
  humming_release:       'Humming exhale — release with a low hum',
}
function correctiveBreathLabel(token: string): string {
  return CORRECTIVE_BREATH_LABELS[token] ?? '4-7-8 slow exhale cycles'
}

function titleizeToken(token: string): string {
  return token.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function buildTransitProtocol(
  transitingPlanet: string,
  natalPlanet: string,
  aspect: string,
  corrective?: import('@/types').PolarityResultLike | null,
): TransitProtocol {
  const transitingHz = TRANSIT_ANCHOR_HZ[transitingPlanet] ?? 144.72
  const natalHz      = TRANSIT_ANCHOR_HZ[natalPlanet] ?? 147.85
  const aspectChar   = ASPECT_CHARACTER[aspect] ?? ASPECT_CHARACTER.trine

  // ── Polarity correction ──────────────────────────────────────
  // When a planet in this transit is in an active imbalance state, override the
  // sense layers with that planet's corrective protocol (same data the chamber
  // uses). The aspect still drives geometry + sound behavior (the transit's
  // identity); only the corrective CHARACTER (colors, herbs, scents, breath)
  // changes — never amplifying the detected pattern.
  if (corrective && isActiveCorrective(corrective)) {
    const cp = corrective.protocol
    const regulator = cp.regulator_planets[0] ?? 'balancing'
    const direction = cp.corrective_direction.slice(0, 3).join(', ')
    return {
      sound: {
        transitingHz: TRANSIT_ANCHOR_HZ[regulator] ?? transitingHz,
        natalHz,
        behavior: aspectChar.soundBehavior,
        userLabel: `${corrective.planet} ${corrective.dominant_state} corrective soundscape`,
        character: titleizeToken(cp.sound_character),
        purpose: `${direction} — shifting toward ${regulator} character`,
      },
      scent: {
        oils: cp.scents.length ? cp.scents.slice(0, 3) : pickScents(transitingPlanet, natalPlanet),
        description: `Adjusted for ${corrective.planet} ${corrective.dominant_state} — supports ${direction} rather than amplifying the pattern.`,
      },
      taste: {
        ingredients: cp.herbs.length ? cp.herbs.slice(0, 4) : pickHerbs(transitingPlanet, natalPlanet),
        description: `Corrective herbal infusion for ${cp.support_style}. Drink between meals or during the session.`,
      },
      body: {
        breath: correctiveBreathLabel(cp.breath),
        movement: `Gentle ${direction} movement — let the body follow the breath`,
        description: `Body protocol adjusted to ${cp.support_style} during this ${aspect} window.`,
      },
      sight: {
        colors: cp.color_palette.length
          ? cp.color_palette.slice(0, 3)
          : [PLANET_COLORS[transitingPlanet] ?? '#22D3EE', PLANET_COLORS[natalPlanet] ?? '#7DF9FF', aspectChar.regulatorColor],
        geometry: aspectChar.geometry,
        description: `${corrective.protocol.support_style} visual field. ${aspectChar.geometry} in ${aspect} configuration, ${regulator} palette.`,
      },
    }
  }

  return {
    sound: {
      transitingHz,
      natalHz,
      behavior: aspectChar.soundBehavior,
      userLabel: `${transitingPlanet}–${natalPlanet} ${aspect} soundscape`,
      character: aspectChar.character,
      purpose: aspectChar.purpose,
    },
    scent: {
      oils: pickScents(transitingPlanet, natalPlanet),
      description: `Essential oil blend keyed to the ${transitingPlanet}/${natalPlanet} pairing — supports ${aspectChar.purpose.toLowerCase()}.`,
    },
    taste: {
      ingredients: pickHerbs(transitingPlanet, natalPlanet),
      description: `Herbal infusion for ${aspectChar.purpose.toLowerCase()}. Drink between meals or during the session.`,
    },
    body: {
      breath: aspectChar.breath,
      movement: aspectChar.movement,
      description: `Body protocol designed to ${aspectChar.purpose.toLowerCase()} during this ${aspect} window.`,
    },
    sight: {
      colors: [PLANET_COLORS[transitingPlanet] ?? '#22D3EE', PLANET_COLORS[natalPlanet] ?? '#7DF9FF', aspectChar.regulatorColor],
      geometry: aspectChar.geometry,
      description: `${transitingPlanet} and ${natalPlanet} visual field. ${aspectChar.geometry} in ${aspect} configuration.`,
    },
  }
}

// Static lookup tables — kept local to avoid coupling modal to engine pipeline
const TRANSIT_ANCHOR_HZ: Record<string, number> = {
  Sun: 126.22, Moon: 210.42, Mercury: 141.27, Venus: 221.23,
  Mars: 144.72, Jupiter: 183.58, Saturn: 147.85,
  Uranus: 207.36, Neptune: 211.44, Pluto: 140.25,
}

const ASPECT_CHARACTER: Record<string, {
  soundBehavior: string; character: string; purpose: string
  breath: string; movement: string
  geometry: string; regulatorColor: string
}> = {
  conjunction: {
    soundBehavior: 'stacking + amplification', character: 'Dense, grounded',
    purpose: 'Anchor the combined energy and integrate the activation',
    breath: '4-count box breathing (inhale-hold-exhale-hold)',
    movement: 'Slow seated stillness with subtle spinal lengthening',
    geometry: 'concentric circles', regulatorColor: '#50E3A4',
  },
  opposition: {
    soundBehavior: 'call & response · L/R oscillation', character: 'Bilateral, balanced',
    purpose: 'Mediate the polarity and find the midpoint',
    breath: 'Alternate nostril breathing (12 cycles)',
    movement: 'Standing weight-shift L/R, arms wide open',
    geometry: 'mirrored axis', regulatorColor: '#5DADEC',
  },
  square: {
    soundBehavior: 'tension · syncopated · delayed resolution', character: 'Charged, structural',
    purpose: 'Release stuck friction and find structural release',
    breath: 'Breath of fire (90 seconds), then 4-7-8 exhale',
    movement: 'Cross-body twists, hip circles, shake-out',
    geometry: 'grid cube', regulatorColor: '#50E3A4',
  },
  trine: {
    soundBehavior: 'flow · consonant · natural resolution', character: 'Smooth, harmonic',
    purpose: 'Receive and channel the easy current',
    breath: 'Slow ocean breath (Ujjayi), 5-second inhale / 7-second exhale',
    movement: 'Gentle flowing arm sweeps, soft swaying',
    geometry: 'triangle flow', regulatorColor: '#FFD166',
  },
  sextile: {
    soundBehavior: 'cooperation · light consonance', character: 'Open, supportive',
    purpose: 'Open the channel and amplify cooperative momentum',
    breath: '4-4-4 even-count breathing',
    movement: 'Hex-pattern arm reaches, open-handed gestures',
    geometry: 'hexagon honeycomb', regulatorColor: '#5DADEC',
  },
  quincunx: {
    soundBehavior: 'adjustment · offset · gradual realignment', character: 'Adaptive, corrective',
    purpose: 'Adjust and recalibrate toward alignment',
    breath: 'Variable breath — match exhale to current need',
    movement: 'Slow somatic scan, micro-adjustments along the spine',
    geometry: 'offset spiral', regulatorColor: '#B388FF',
  },
}

// Quick planet → scent / herb shortlists (no engine pipeline coupling)
const PLANET_SCENTS: Record<string, string[]> = {
  Sun: ['Frankincense', 'Rosemary', 'Bergamot'],
  Moon: ['Sandalwood', 'Jasmine', 'Chamomile'],
  Mercury: ['Peppermint', 'Eucalyptus', 'Lemongrass'],
  Venus: ['Rose', 'Geranium', 'Ylang Ylang'],
  Mars: ['Black Pepper', 'Ginger', 'Cinnamon'],
  Jupiter: ['Cedarwood', 'Pine', 'Nutmeg'],
  Saturn: ['Myrrh', 'Vetiver', 'Patchouli'],
  Uranus: ['Tea Tree', 'Eucalyptus', 'Camphor'],
  Neptune: ['Lotus', 'Lavender', 'Clary Sage'],
  Pluto: ['Patchouli', 'Frankincense', 'Vetiver'],
}
const PLANET_HERBS: Record<string, string[]> = {
  Sun: ['Calendula', 'Rosemary', 'St John\'s Wort'],
  Moon: ['Chamomile', 'Lemon Balm', 'Passionflower'],
  Mercury: ['Peppermint', 'Fennel', 'Skullcap'],
  Venus: ['Hibiscus', 'Damiana', 'Rose Hip'],
  Mars: ['Ginger', 'Nettle', 'Cayenne'],
  Jupiter: ['Dandelion', 'Sage', 'Milk Thistle'],
  Saturn: ['Comfrey', 'Horsetail', 'Burdock'],
  Uranus: ['Holy Basil', 'Gotu Kola', 'Ginkgo'],
  Neptune: ['Mugwort', 'Valerian', 'Blue Lotus'],
  Pluto: ['Wormwood', 'Mullein', 'Yarrow'],
}

function pickScents(p1: string, p2: string): string[] {
  const a = PLANET_SCENTS[p1] ?? []
  const b = PLANET_SCENTS[p2] ?? []
  return Array.from(new Set([...a.slice(0, 2), ...b.slice(0, 1)])).slice(0, 3)
}
function pickHerbs(p1: string, p2: string): string[] {
  const a = PLANET_HERBS[p1] ?? []
  const b = PLANET_HERBS[p2] ?? []
  return Array.from(new Set([...a.slice(0, 2), ...b.slice(0, 1)])).slice(0, 3)
}
