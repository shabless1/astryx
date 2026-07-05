'use client'

/**
 * ASTRYX — Practitioner Lens Content
 *
 * Build Directive Fix 4 · Lens-aware content blocks rendered inside
 * PractitionerScreen. Reads `practitionerLens` from Zustand and renders
 * the appropriate modality slice.
 *
 * REIKI lens is the launch lens (fully built — per Phase 1B roadmap):
 *   1. Chakra Activation Panel — derived from chart
 *   2. Hand Position Guide — top 3 active chakras
 *   3. Session Intention Generator — affirmation + transit
 *   4. Crystal Placement Guidance — featured crystal w/ Malachite warning
 *
 * Other 6 lenses scaffolded with "Coming in Phase 2" cards. This is
 * honest, not broken — the practitioner sees the full diagnostic above
 * and applies professional judgment.
 *
 * DECISION: One file with internal Reiki+Phase2 components rather than
 * separate files per lens. Keeps the lens-content logic in one place
 * for easier review and easier to grow into separate lens components
 * later as each is fully built.
 */

import type { ProtocolOutput, CrystalExpanded } from '@/types'
import { useAppStore } from '@/lib/store'
import { GlassCard, SectionLabel, Tag } from '@/components/ui'
import { hexToRgba } from '@/lib/utils'
import { freshTransitInterpretation } from '@/lib/engineClient'
import sacredTonesData from '@/data/sacredTones_nervousSystem.json'
import cellSaltsData   from '@/data/cellSalts.json'
import crystalsData    from '@/data/crystalsExpanded.json'

interface LensContentProps {
  protocol: ProtocolOutput
  accentColor: string
}

export default function PractitionerLensContent({ protocol, accentColor }: LensContentProps) {
  const lens = useAppStore((s) => s.practitionerLens)

  switch (lens) {
    case 'reiki':
      return <ReikiLens protocol={protocol} accentColor={accentColor} />
    case 'medical_astrologer':
      return <Phase2Placeholder icon="🔭" label="Medical Astrologer" accentColor={accentColor} />
    case 'bodyworker':
      return <Phase2Placeholder icon="💪" label="Bodyworker (Massage / Neuromuscular / Sports)" accentColor={accentColor} />
    case 'naturopath_herbalist':
      return <Phase2Placeholder icon="🌿" label="Naturopath / Herbalist" accentColor={accentColor} />
    case 'ayurvedic':
      return <Phase2Placeholder icon="🕉" label="Ayurvedic Practitioner" accentColor={accentColor} />
    case 'acupuncturist_tcm':
      return <Phase2Placeholder icon="🪡" label="Acupuncturist / TCM" accentColor={accentColor} />
    case 'pastoral_spiritual':
      return <Phase2Placeholder icon="🕯" label="Pastoral / Spiritual Counselor" accentColor={accentColor} />
    case 'individual':
    default:
      return null   // Individual lens — no extra block (the rest of the screen is plain language)
  }
}

// ═══════════════════════════════════════════════════════════════
// REIKI LENS — fully built
// ═══════════════════════════════════════════════════════════════

// The 7 chakras in standard top-to-bottom order with their planetary rulers.
// Sourced from sacredTones_nervousSystem.json chakra field + classical
// chakra-planet correspondences.
interface ChakraInfo {
  name:    string
  sanskrit: string
  color:   string
  rulers:  string[]    // planets associated with this chakra
  hzRef:   number      // typical Hz reference for this chakra
}

const CHAKRA_TABLE: ChakraInfo[] = [
  { name: 'Crown',         sanskrit: 'Sahasrara',  color: '#9B5DE5', rulers: ['Neptune', 'Uranus'], hzRef: 480.0 },
  { name: 'Third Eye',     sanskrit: 'Ajna',       color: '#5DADE2', rulers: ['Mercury', 'Moon'],   hzRef: 426.7 },
  { name: 'Throat',        sanskrit: 'Vishuddha',  color: '#38BDF8', rulers: ['Mercury', 'Venus'],  hzRef: 384.0 },
  { name: 'Heart',         sanskrit: 'Anahata',    color: '#4CAF89', rulers: ['Sun', 'Venus'],      hzRef: 341.3 },
  { name: 'Solar Plexus',  sanskrit: 'Manipura',   color: '#F4A940', rulers: ['Sun', 'Mars', 'Jupiter'], hzRef: 528.0 },
  { name: 'Sacral',        sanskrit: 'Svadhisthana', color: '#FF6B35', rulers: ['Moon', 'Venus', 'Mars'], hzRef: 417.0 },
  { name: 'Root',          sanskrit: 'Muladhara',  color: '#E8453C', rulers: ['Mars', 'Saturn', 'Pluto'], hzRef: 396.0 },
]

type ChakraState = 'over-active' | 'blocked' | 'balanced'

function ReikiLens({ protocol, accentColor }: LensContentProps) {
  // Chakra activation logic (per directive):
  //  - over-active: chakra's ruling planet is in the dominant pattern
  //  - blocked:     chakra's ruling planet is stressed by a transit
  //  - balanced:    otherwise
  const dominantPlanets = new Set(protocol.dominant_pattern.planets)
  const transitTargets  = new Set(
    (protocol.diagnostic?.activeTransits ?? []).flatMap((t) => [t.transitingPlanet, t.natalPlanet]),
  )

  const chakras = CHAKRA_TABLE.map((c) => {
    const isOver = c.rulers.some((r) => dominantPlanets.has(r))
    const isBlocked = !isOver && c.rulers.some((r) => transitTargets.has(r))
    const state: ChakraState = isOver ? 'over-active' : isBlocked ? 'blocked' : 'balanced'
    return { ...c, state }
  })

  // Top 3 active (over-active or blocked) chakras for hand position focus
  const activeChakras = chakras.filter((c) => c.state !== 'balanced').slice(0, 3)
  const focusChakras = activeChakras.length > 0 ? activeChakras : chakras.slice(0, 3)

  // Session intention — pull sun-sign salt affirmation + active transit
  const sunSign = protocol.diagnostic?.sunSign
  const sunSalt = sunSign
    ? (cellSaltsData as any).cellSalts?.find((s: any) => s.sign === sunSign)
    : null
  const affirmation = sunSalt?.esoteric?.affirmation ?? 'Be present. Receive. Allow the flow.'
  const headlineTransit = protocol.diagnostic?.headlineTransit
  // v4.2 FIX 3 — render-time copy (current data files, not the baked text)
  const transitText = freshTransitInterpretation(headlineTransit)?.effect ?? 'this moment of recalibration'

  // Crystal placement — for dominant planet
  const dominantPlanet = protocol.dominant_pattern.planets[0]
  const featuredCrystal = (crystalsData as CrystalExpanded[]).find((c) => c.planet === dominantPlanet)

  return (
    <div className="space-y-4 mt-2">
      <SectionLabel>Reiki Practitioner Lens</SectionLabel>

      {/* 1 — Chakra Activation Panel */}
      <GlassCard accentColor={accentColor} opacity={0.08} className="p-5">
        <div className="text-[10px] tracking-widest text-white/40 mb-3">CHAKRA ACTIVATION PANEL</div>
        <div className="space-y-1.5">
          {chakras.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 p-2.5 rounded-lg"
              style={{ background: c.state === 'balanced' ? 'rgba(255,255,255,0.025)' : `${c.color}10` }}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-white font-medium">{c.name}</div>
                <div className="text-[10px] text-white/40">{c.sanskrit} · {c.hzRef} Hz · {c.rulers.join('/')}</div>
              </div>
              <ChakraStateBadge state={c.state} color={c.color} />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 2 — Hand Position Guide */}
      <GlassCard accentColor={accentColor} opacity={0.08} className="p-5">
        <div className="text-[10px] tracking-widest text-white/40 mb-3">
          HAND POSITION GUIDE — TOP {focusChakras.length} ACTIVE CHAKRA{focusChakras.length === 1 ? '' : 'S'}
        </div>
        <div className="space-y-3">
          {focusChakras.map((c) => (
            <div key={c.name} className="p-3 rounded-lg border border-white/10" style={{ background: `${c.color}08` }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                <span className="font-cinzel text-[14px] text-white">{c.name}</span>
                <ChakraStateBadge state={c.state} color={c.color} small />
              </div>
              <p className="text-[12px] text-white/70 leading-relaxed">{HAND_POSITIONS[c.name]}</p>
              {c.state === 'over-active' && (
                <p className="text-[11px] mt-2 italic" style={{ color: c.color }}>
                  → Use cooling, draining motion. Avoid amplification.
                </p>
              )}
              {c.state === 'blocked' && (
                <p className="text-[11px] mt-2 italic" style={{ color: c.color }}>
                  → Use opening, activating motion. Hold the field steady.
                </p>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 3 — Session Intention Generator */}
      <GlassCard accentColor={accentColor} opacity={0.12} className="p-5">
        <div className="text-[10px] tracking-widest text-white/40 mb-3">SESSION INTENTION</div>
        <p className="text-[14px] text-white/85 leading-relaxed italic">
          The intention for this session: <span style={{ color: accentColor }}>&ldquo;{affirmation}&rdquo;</span>
        </p>
        <p className="text-[12px] text-white/55 mt-2 leading-relaxed">
          The sky supports {transitText.toLowerCase().replace(/\.$/, '')}.
        </p>
      </GlassCard>

      {/* 4 — Crystal Placement Guidance */}
      {featuredCrystal && (
        <GlassCard accentColor={featuredCrystal.hex} opacity={0.10} className="p-5">
          <div className="text-[10px] tracking-widest text-white/40 mb-3">CRYSTAL PLACEMENT — {dominantPlanet?.toUpperCase()}</div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-cinzel text-[16px] text-white">{featuredCrystal.featuredCrystal}</span>
            {featuredCrystal.featuredCrystal === 'Malachite' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white">
                ⚠ POLISHED/SEALED ONLY
              </span>
            )}
          </div>
          {featuredCrystal.featuredCrystalData && (
            <>
              <div className="mb-2">
                <span className="text-[10px] tracking-widest text-white/40 mr-2">PLACEMENT</span>
                <span className="text-[12px] text-white/75">{featuredCrystal.featuredCrystalData.bodyPlacement}</span>
              </div>
              <p className="text-[12px] text-white/65 leading-relaxed italic">
                {featuredCrystal.featuredCrystalData.biologicalMechanism.split('.')[0]}.
              </p>
              {featuredCrystal.featuredCrystalData.safetyNote && (
                <p className="text-[11px] text-white/45 italic mt-2">{featuredCrystal.featuredCrystalData.safetyNote}</p>
              )}
            </>
          )}
        </GlassCard>
      )}
    </div>
  )
}

// ── Reiki hand position descriptions (top-of-skull-down) ──
const HAND_POSITIONS: Record<string, string> = {
  'Crown':        'Crown — top of the skull, slightly posterior. Cup hands 2–4 inches above without touching.',
  'Third Eye':    'Third Eye — between the brows. Place index and middle finger softly on forehead, or hover at the brow line.',
  'Throat':       'Throat — front and sides of neck. Cup hands around throat without pressure; allow the field to settle.',
  'Heart':        'Heart — over the sternum (thymus). One hand on the sternum, one above between the breasts.',
  'Solar Plexus': 'Solar Plexus — just above the navel. Palm flat over the area; the other palm cradles the lower back opposite.',
  'Sacral':       'Sacral — two finger-widths below the navel. Palm flat or hovering; second hand at the lower lumbar opposite.',
  'Root':         'Root — base of the spine / perineum area. Hover hands over the hips and tailbone; never contact this region directly.',
}

function ChakraStateBadge({ state, color, small = false }: { state: ChakraState; color: string; small?: boolean }) {
  const labels = { 'over-active': 'OVER-ACTIVE', blocked: 'BLOCKED', balanced: 'BALANCED' }
  const bgs    = {
    'over-active': hexToRgba(color, 0.25),
    blocked:       'rgba(232,69,60,0.15)',
    balanced:      'rgba(76,175,137,0.12)',
  }
  const fgs    = { 'over-active': color, blocked: '#FCA5A5', balanced: '#86EFAC' }
  return (
    <span
      className="px-1.5 py-0.5 rounded font-bold tracking-widest shrink-0"
      style={{
        background: bgs[state],
        color:      fgs[state],
        fontSize:   small ? 8 : 9,
      }}
    >
      {labels[state]}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 PLACEHOLDER — for lenses not yet built
// ═══════════════════════════════════════════════════════════════
function Phase2Placeholder({ icon, label, accentColor }: { icon: string; label: string; accentColor: string }) {
  return (
    <div className="mt-2">
      <SectionLabel>{label} Lens</SectionLabel>
      <GlassCard accentColor={accentColor} opacity={0.06} className="p-7 text-center">
        <div className="text-5xl mb-3">{icon}</div>
        <h3 className="font-cinzel text-lg text-white mb-2">{label} — Phase 2</h3>
        <p className="text-[13px] text-white/65 max-w-md mx-auto leading-relaxed">
          Your client&apos;s full diagnostic data is above. Apply your professional judgment.
          Lens-specific tools for this modality are scheduled for the Phase 2 release per the Astryx Roadmap.
        </p>
      </GlassCard>
    </div>
  )
}
