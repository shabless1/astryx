'use client'

import { useState } from 'react'
import type { ProtocolOutput } from '@/types'
import { GlassCard, PrimaryButton, PlanetBadge, Tag, DataPoint, ConfidenceBar, SectionLabel } from '@/components/ui'
import { PLANET_COLORS } from '@/lib/engine'
import { hexToRgb, hexToRgba, APP_PLAYED_TONES } from '@/lib/utils'
import planetaryAnchors from '@/data/planetary-anchors.json'
import solfeggioOverlays from '@/data/solfeggio-overlays.json'
import sacredTonesData from '@/data/sacredTones_nervousSystem.json'
import PractitionerExport from '@/components/engine/PractitionerExport'
import NatalChartWheel from '@/components/engine/NatalChartWheel'
import BodyMap from '@/components/engine/BodyMap'
import LensSwitcher from '@/components/ui/LensSwitcher'
import PractitionerLensContent from '@/components/engine/PractitionerLensContent'
import type { IntakeData, SacredFork } from '@/types'

interface PractitionerScreenProps {
  protocol: ProtocolOutput
  accentColor: string
  intake: IntakeData
  chartData?: any
  onBack: () => void
  onStartSession: () => void
  onUpgrade: () => void
  onClientRoster?: () => void   // Build Directive Fix 2 — opens ClientRosterScreen
}

// ── Planetary Positions: real chart data ───────────────────────────
// DECISION (Build Directive Fix 1): The hardcoded PLANETS_DISPLAY constant
// was dummy data — the same 7 planets/signs/confidence values rendered
// regardless of whose chart was loaded. Replaced with derivePlanetDisplay()
// which reads from the real chartData.planets[] array returned by /api/chart.
//
// Confidence resolution:
//  • Planets that are part of protocol.dominant_pattern.planets get the
//    pattern's confidence_score (they ARE the dominant signature).
//  • All other planets show a placeholder ("—") — their confidence as a
//    standalone signature is not meaningful; they are supporting context.
//
// Fallback chain (per directive: never fall back to hardcoded):
//   1. chartData.planets[] — full real positions for all 10 planets
//   2. protocol.dominant_pattern.planets[] + .signs[] + .houses[] — 2-planet
//      minimum so the panel never renders empty when chartData is null
//   3. Empty array — render the panel with a "Chart unavailable" notice
interface PlanetDisplayRow {
  name: string
  sign: string
  house: number | string
  conf: number | null
  retrograde?: boolean
}

function derivePlanetDisplay(
  chartData: any,
  pattern: { planets: string[]; signs?: string[]; houses?: number[]; confidence_score: number },
): PlanetDisplayRow[] {
  // Path 1 — real chart data
  if (chartData?.planets && Array.isArray(chartData.planets) && chartData.planets.length > 0) {
    return chartData.planets.map((p: any): PlanetDisplayRow => ({
      name:       p.planet ?? p.name ?? '—',
      sign:       p.sign ?? '—',
      house:      p.house ?? '—',
      conf:       pattern.planets.includes(p.planet ?? p.name) ? pattern.confidence_score : null,
      retrograde: !!p.retrograde,
    }))
  }

  // Path 2 — derive from dominant pattern (chartData null/missing)
  if (pattern.planets?.length > 0) {
    return pattern.planets.map((name, i): PlanetDisplayRow => ({
      name,
      sign:  pattern.signs?.[i] ?? '—',
      house: pattern.houses?.[i] ?? '—',
      conf:  pattern.confidence_score,
    }))
  }

  // Path 3 — nothing to render
  return []
}

export default function PractitionerScreen({
  protocol,
  accentColor,
  intake,
  chartData,
  onBack,
  onStartSession,
  onUpgrade,
  onClientRoster,
}: PractitionerScreenProps) {
  const rgb = hexToRgb(accentColor)
  const p = protocol.dominant_pattern
  const [sessionDuration, setSessionDuration] = useState(10)
  const [visualIntensity, setVisualIntensity] = useState('High')
  const [soundLayer, setSoundLayer] = useState('Full Stack')
  const [breathMode, setBreathMode] = useState('Active')

  // ── Real planetary positions — derived from chartData (Build Directive Fix 1) ──
  const planetRows = derivePlanetDisplay(chartData, p)

  // Planetary anchors (Hz) — still used for the Hz column alongside live positions
  const anchors = planetaryAnchors as Array<{ planet: string; hz: number; function: string[] }>

  // ── Session Forks (Sacred Tones extension) ─────────────────
  // Pulls directly from sacredTones_nervousSystem.json. Earth Day +
  // Earth Year + Platonic Year are the chakra-grounding set, always
  // shown. The dominant planet forks (top 2 from pattern) lead the
  // sequence. We deduplicate where a chakra fork overlaps the dominant
  // set (Earth Year already represents Venus/Heart).
  const allForks = sacredTonesData as SacredFork[]

  const PLANET_TO_FORK: Record<string, string> = {
    Sun: 'Sun', Moon: 'Full Moon', Mercury: 'Mercury', Venus: 'Venus',
    Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn',
    Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto',
  }
  const CHAKRA_FORK_NAMES = ['Earth Day', 'Earth Year', 'Platonic Year']
  const chakraForks  = allForks.filter(f => CHAKRA_FORK_NAMES.includes(f.planet))

  const dominantForkNames = p.planets
    .map(pl => PLANET_TO_FORK[pl])
    .filter((n): n is string => Boolean(n))
  const dominantForks = allForks.filter(f => dominantForkNames.includes(f.planet))

  const sessionForks: SacredFork[] = [
    ...dominantForks,
    ...chakraForks.filter(cf => !dominantForkNames.includes(cf.planet)),
  ]

  return (
    <div className="min-h-screen font-rajdhani">
      <div className="max-w-4xl mx-auto px-5" style={{ paddingTop: 100, paddingBottom: 60 }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
          <div>
            <SectionLabel>Practitioner Mode</SectionLabel>
            <h1 className="font-cinzel text-2xl text-white">Pattern Analysis — Full View</h1>
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <PrimaryButton label="⬡ Start Session" onClick={onStartSession} accent={accentColor} glow />
            {onClientRoster && (
              <PrimaryButton label="◇ Client Roster" onClick={onClientRoster} accent={accentColor} outlined />
            )}
            <PractitionerExport protocol={protocol} intake={intake} accentColor={accentColor} chartData={chartData} />
            <PrimaryButton label="← Back" onClick={onBack} accent={accentColor} outlined />
          </div>
        </div>

        {/* ── Lens Switcher (Build Directive Fix 4) ── */}
        <LensSwitcher accentColor={accentColor} />

        {/* ── Dominant Configuration ── */}
        <GlassCard accentColor={accentColor} opacity={0.06} topBorder className="p-6 mb-4 animate-fade-in-up">
          <SectionLabel>Dominant Configuration</SectionLabel>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h2 className="font-cinzel text-xl text-white mb-1">{p.title}</h2>
              <p className="text-[12px] text-white/50">{p.element_modality}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {p.planets.map((pl) => <PlanetBadge key={pl} name={pl} />)}
                <Tag label={`Aspect: ${p.aspect}`} accent={accentColor} />
                {p.signs.map((s) => <Tag key={s} label={s} accent="rgba(255,255,255,0.22)" />)}
                {p.houses.map((h) => <Tag key={h} label={`H${h}`} accent="rgba(255,255,255,0.15)" small />)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-cinzel font-bold" style={{ fontSize: 48, color: accentColor, lineHeight: 1 }}>
                {p.confidence_score}%
              </div>
              <div className="text-[10px] tracking-[0.2em] text-white/35 mt-1">CONFIDENCE</div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* ── Planetary Positions ── */}
          <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <SectionLabel>Planetary Positions</SectionLabel>
            {planetRows.length === 0 ? (
              <p className="text-[12px] text-white/40 italic mt-2">
                Chart positions unavailable. Re-run analysis from intake to refresh.
              </p>
            ) : (
              planetRows.map((pl) => {
                const anchor = anchors.find((a) => a.planet === pl.name)
                const isDominant = p.planets.includes(pl.name)
                return (
                  <div
                    key={pl.name}
                    className="flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0"
                  >
                    <div
                      className="flex-shrink-0 rounded-full"
                      style={{ width: 10, height: 10, background: PLANET_COLORS[pl.name] || '#fff' }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-white mr-2">
                        {pl.name}
                        {pl.retrograde && <span className="text-white/40 text-[10px] ml-1">℞</span>}
                      </span>
                      <span className="text-[11px] text-white/40">
                        {pl.sign} {typeof pl.house === 'number' ? `· H${pl.house}` : ''}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/30 mr-2">{anchor?.hz ?? '—'} Hz</span>
                    <div style={{ width: 44 }}>
                      {pl.conf !== null ? (
                        <ConfidenceBar value={pl.conf} color={PLANET_COLORS[pl.name] || accentColor} />
                      ) : (
                        <span className="text-[10px] text-white/25 italic" title="Not part of dominant pattern">—</span>
                      )}
                    </div>
                    {isDominant && (
                      <span
                        className="text-[9px] tracking-widest px-1.5 py-0.5 rounded"
                        style={{ background: `${PLANET_COLORS[pl.name] || accentColor}22`, color: PLANET_COLORS[pl.name] || accentColor }}
                        title="This planet is part of your dominant chart pattern"
                      >
                        DOMINANT
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </GlassCard>

          {/* ── Sacred Tones Session Protocol ──────────────────────
              Replaces the legacy tuningForks rendering with the full
              Sacred Tones extension data (nerve plexus, application point,
              vagal connection, ANS effect, brainwave, clinical note). */}
          <GlassCard accentColor={accentColor} opacity={0.05} className="p-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <SectionLabel>Sacred Tones Session Protocol</SectionLabel>
            <p className="text-[12px] text-white/40 mb-5 mt-1">
              Apply the planetary forks in sequence — dominant planet forks first. The Earth
              and Platonic reference tones are app-played background (no physical fork) — let
              them hold the base while you strike the planetary forks along with them.
            </p>
            <div className="space-y-4">
              {sessionForks.map((fork, i) => {
                const appTone = APP_PLAYED_TONES.has(fork.planet)
                return (
                <div
                  key={fork.planet}
                  className="p-4 rounded-xl border border-white/10"
                  style={{ background: `${fork.color}0D` }}
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-white/30 font-mono">#{i + 1}</span>
                      <div>
                        <span className="font-cinzel text-white text-[14px]">{fork.planet} {appTone ? 'Tone' : 'Fork'}</span>
                        <span className="ml-2 text-[11px]" style={{ color: fork.color }}>
                          {fork.hz} Hz · {fork.note}
                        </span>
                        {appTone && (
                          <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-white/35">· app-played</span>
                        )}
                      </div>
                    </div>
                    <Tag label={fork.chakra} accent={fork.color} small />
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-[12px] text-white/60 mb-3">
                    <div><span className="text-white/30">Nerve Plexus: </span>{fork.nervePlexus}</div>
                    {appTone ? (
                      <div><span className="text-white/30">Delivery: </span>App-played background tone — no physical fork; pair with the planetary forks above.</div>
                    ) : (
                      <div><span className="text-white/30">Application Point: </span>{fork.boneApplicationPoint}</div>
                    )}
                    <div><span className="text-white/30">Vagal Connection: </span>{fork.vagusConnection} · Strength: {fork.vagusStrength}</div>
                    <div><span className="text-white/30">ANS Effect: </span>{fork.ANSEffect}</div>
                    <div><span className="text-white/30">Brainwave: </span>{fork.brainwaveAffinity} — {fork.brainwaveState}</div>
                  </div>

                  <div className="p-3 rounded-lg border" style={{ borderColor: `${fork.color}33`, background: `${fork.color}0A` }}>
                    <p className="text-[10px] tracking-widest mb-1" style={{ color: fork.color }}>CLINICAL NOTE</p>
                    <p className="text-[12px] text-white/70 italic">{fork.clinicalNote}</p>
                  </div>
                </div>
                )
              })}
            </div>

            {/* Sacred Tones shop CTA — feature-flagged */}
            {process.env.NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE === 'true' ? (
              <div className="mt-5 pt-4 border-t border-white/10">
                <a
                  href="https://sacredtea.net/products/planetary-tuning-forks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] tracking-widest"
                  style={{ color: accentColor }}
                >
                  Shop Physical Sacred Tones Forks → sacredtea.net
                </a>
              </div>
            ) : (
              <p className="mt-4 text-[11px] text-white/30 italic">
                Physical Sacred Tones tuning forks — coming soon at sacredtea.net
              </p>
            )}
          </GlassCard>
        </div>

        {/* ── Sacred Botanical & Crystal — Session Reference ────── */}
        {protocol.sacredLayer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-fade-in-up" style={{ animationDelay: '0.18s' }}>
            {protocol.sacredLayer.botanical && (() => {
              const b = protocol.sacredLayer.botanical!
              return (
                <GlassCard accentColor={b.color} opacity={0.05} className="p-5">
                  <SectionLabel>Sacred Botanical</SectionLabel>
                  <h4 className="font-cinzel text-white text-[14px] mt-2 mb-1">{b.sacredBotanical}</h4>
                  <p className="text-[11px] italic text-white/40 mb-3">{b.latinName}</p>
                  <div className="space-y-2">
                    <DataPoint label="System"    value={b.biologicalSystem} />
                    <DataPoint label="Endocrine" value={b.endocrineTarget} />
                    <DataPoint label="Placement" value={b.bodyPlacement} />
                  </div>
                  <p className="text-[11px] text-white/40 italic mt-3">{b.safetyNote}</p>
                </GlassCard>
              )
            })()}

            {protocol.sacredLayer.crystal && (() => {
              const c  = protocol.sacredLayer.crystal!
              const cd = c.featuredCrystalData
              const isMalachite = cd.name === 'Malachite'
              return (
                <GlassCard accentColor={c.hex} opacity={0.05} className="p-5">
                  <SectionLabel>Featured Crystal</SectionLabel>
                  <div className="flex items-center gap-2 mt-2 mb-1 flex-wrap">
                    <h4 className="font-cinzel text-white text-[14px]">{cd.name}</h4>
                    {isMalachite && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white">
                        ⚠ POLISHED/SEALED ONLY
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 mt-2">
                    <DataPoint label="System"    value={cd.biologicalSystem} />
                    <DataPoint label="Placement" value={cd.bodyPlacement} />
                  </div>
                  <p className="text-[11px] text-white/40 italic mt-3">{cd.placementNote}</p>
                  <p className="text-[11px] text-white/40 italic mt-1">{cd.safetyNote}</p>
                </GlassCard>
              )
            })()}
          </div>
        )}

        {/* ── Full SOAP ── */}
        <GlassCard className="p-5 mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <SectionLabel>Full SOAP Output</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DataPoint label="Subjective" value={protocol.soap.subjective.join(' · ')} />
            <DataPoint label="Objective" value={protocol.soap.objective.join(' · ')} />
            <div className="md:col-span-2">
              <DataPoint label="Assessment" value={protocol.soap.assessment} />
            </div>
            <div className="md:col-span-2">
              <DataPoint label="Plan" value={protocol.soap.plan} />
            </div>
          </div>
        </GlassCard>

        {/* ── Session Parameters ── */}
        <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <SectionLabel>Session Parameters</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ControlGroup
              label="Duration"
              options={['5 min', '10 min', '20 min', '30 min', '45 min']}
              current={`${sessionDuration} min`}
              onChange={(v) => setSessionDuration(parseInt(v))}
              accentColor={accentColor}
            />
            <ControlGroup
              label="Visual Intensity"
              options={['Low', 'Medium', 'High', 'Immersive']}
              current={visualIntensity}
              onChange={setVisualIntensity}
              accentColor={accentColor}
            />
            <ControlGroup
              label="Sound Layer"
              options={['Tone Only', 'Ambient', 'Full Stack']}
              current={soundLayer}
              onChange={setSoundLayer}
              accentColor={accentColor}
            />
            <ControlGroup
              label="Breath Guide"
              options={['Active', 'Passive', 'Off']}
              current={breathMode}
              onChange={setBreathMode}
              accentColor={accentColor}
            />
          </div>
        </GlassCard>

        {/* ── Natal Chart Wheel ── */}
        {chartData && (
          <GlassCard className="p-5 mb-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <SectionLabel>
              Natal Chart{chartData.isSolarChart ? ' — Solar Chart Mode ☉' : ''}
            </SectionLabel>
            <NatalChartWheel
              chart={chartData}
              accentColor={accentColor}
              size={500}
            />
          </GlassCard>
        )}

        {/* ── Body Map ── */}
        {chartData && (
          <GlassCard className="p-5 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <SectionLabel>Planetary Body Map</SectionLabel>
            <BodyMap chart={chartData} accentColor={accentColor} />
          </GlassCard>
        )}

        {/* ── Lens-Aware Content (Build Directive Fix 4) ── */}
        <PractitionerLensContent protocol={protocol} accentColor={accentColor} />

      </div>
    </div>
  )
}

function ControlGroup({
  label,
  options,
  current,
  onChange,
  accentColor,
}: {
  label: string
  options: string[]
  current: string
  onChange: (v: string) => void
  accentColor: string
}) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.2em] text-white/40 mb-2.5 font-rajdhani uppercase">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className="font-rajdhani text-[11px] tracking-[0.05em] transition-all duration-200"
            style={{
              padding: '5px 12px',
              borderRadius: 8,
              border: `1px solid ${o === current ? accentColor : 'rgba(255,255,255,0.1)'}`,
              background: o === current ? hexToRgba(accentColor, 0.18) : 'transparent',
              color: o === current ? accentColor : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
