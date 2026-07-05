'use client'

/**
 * Astryx Body Map — v3.3 · Image-Based Holographic Anatomy
 *
 * Uses the two reference PNG images Sha provided:
 *   public/images/body-anterior.png   — front view, glowing organs
 *   public/images/body-posterior.png  — back view, glowing spine/nerves
 *
 * Features:
 *   • Front / Back swipe toggle (smooth crossfade)
 *   • Planetary glyphs anchored to body regions per natal chart
 *   • Glow + scale on hover (custom cubic-bezier)
 *   • Click any glyph → slide-in detail panel (Double-Bezel)
 *   • Rainbow chakra meridian SVG overlay on top of the image (toggle)
 *
 * No Three.js (per CLAUDE.md §11). The full Three.js / R3F upgrade
 * outlined in the new dev spec is Phase 3+.
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import type { NatalChart, PlanetPosition } from '@/lib/ephemeris'
import { PLANET_COLORS } from '@/lib/engineClient'
import { hexToRgba } from '@/lib/utils'
import sacredTonesData from '@/data/sacredTones_nervousSystem.json'
import { playPureTone, stopPureTone, pureToneHz, onPureToneChange } from '@/lib/pureTone'
import { audioSession } from '@/lib/audioSession'

// ─── REGION & GLYPH DICTIONARIES ─────────────────────────────────

type RegionKey =
  | 'head' | 'throat' | 'shoulders' | 'chest' | 'heart'
  | 'abdomen' | 'kidneys' | 'pelvis' | 'thighs'
  | 'knees' | 'calves' | 'feet'

const SIGN_TO_REGION: Record<string, RegionKey> = {
  Aries: 'head',         Taurus: 'throat',      Gemini: 'shoulders',
  Cancer: 'chest',       Leo: 'heart',          Virgo: 'abdomen',
  Libra: 'kidneys',      Scorpio: 'pelvis',     Sagittarius: 'thighs',
  Capricorn: 'knees',    Aquarius: 'calves',    Pisces: 'feet',
}

const REGION_LABEL: Record<RegionKey, string> = {
  head: 'Head & Brain',
  throat: 'Throat & Thyroid',
  shoulders: 'Shoulders · Lungs · Arms',
  chest: 'Chest & Stomach',
  heart: 'Heart & Spine',
  abdomen: 'Abdomen · Intestines',
  kidneys: 'Kidneys & Lower Back',
  pelvis: 'Pelvis & Reproductive',
  thighs: 'Hips & Thighs',
  knees: 'Knees & Joints',
  calves: 'Calves & Circulation',
  feet: 'Feet & Lymph',
}

// Regions whose anatomy is best shown on each view.
// Used to pick a default view for a given dominant region.
const ANTERIOR_BIAS = new Set<RegionKey>([
  'head', 'throat', 'shoulders', 'chest', 'heart', 'abdomen', 'pelvis', 'thighs', 'knees', 'feet',
])
const POSTERIOR_BIAS = new Set<RegionKey>(['kidneys', 'shoulders'])

// Position percentages relative to the image container (% from top-left).
// Calibrated against the holographic body reference images Sha provided.
// Anterior layout — body roughly centered, ~60% of frame width.
const REGION_POS_ANTERIOR: Record<RegionKey, { x: number; y: number }> = {
  head:      { x: 50, y:  9  },
  throat:    { x: 50, y: 17  },
  shoulders: { x: 33, y: 22  },
  chest:     { x: 50, y: 28  },
  heart:     { x: 44, y: 30  },
  abdomen:   { x: 50, y: 40  },
  kidneys:   { x: 50, y: 44  },  // shown but more accurate on posterior
  pelvis:    { x: 50, y: 47  },  // K.3 — womb / lower abdomen (was y:53, on the genital line)
  thighs:    { x: 42, y: 64  },
  knees:     { x: 42, y: 75  },
  calves:    { x: 42, y: 85  },
  feet:      { x: 42, y: 95  },
}
// Posterior layout — same x-mirroring fine for back view since body is symmetrical
const REGION_POS_POSTERIOR: Record<RegionKey, { x: number; y: number }> = {
  head:      { x: 50, y:  9  },
  throat:    { x: 50, y: 17  },
  shoulders: { x: 33, y: 22  },
  chest:     { x: 50, y: 28  },  // upper back
  heart:     { x: 50, y: 31  },  // T1-T6 spine
  abdomen:   { x: 50, y: 40  },  // lumbar
  kidneys:   { x: 50, y: 41  },  // proper posterior anatomy
  pelvis:    { x: 50, y: 50  },  // K.3 — sacral field (was y:55, on the genital line)
  thighs:    { x: 42, y: 64  },
  knees:     { x: 42, y: 75  },
  calves:    { x: 42, y: 85  },
  feet:      { x: 42, y: 95  },
}

const PLANET_GLYPH: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅',
  Neptune: '♆', Pluto: '♇',
}

// ─── 7 CHAKRA SPINAL MERIDIAN ────────────────────────────────────
// Y-percentages along the central spine

// Y = % down the body image. Tuned to the unified maps + SHA's placement:
// crown ABOVE the head, third-eye at the brow, throat mid-throat, heart on the
// heart, solar plexus at the navel, sacral inside the pelvic bowl, root beneath
// the pelvic bone. Root and sacral are kept visually distinct.
// Patch 3.1 — each chakra carries a human colorName so the UI never shows a raw
// hex code; the hex is for rendering the swatch only.
const CHAKRAS: { id: string; name: string; sanskrit: string; color: string; colorName: string; hz: number; y: number }[] = [
  // Hz = the standard chakra SOLFEGGIO tones (from solfeggio-overlays.json /
  // accepted sound-healing mapping). NOTE: the chakra layer uses Solfeggio; the
  // PLANETARY protocol (forks/audio/anchors) stays on Cousto's Law of the Octave.
  // v4.5.1 — y positions match the CHAKRA SESSION anchors exactly (the body
  // image is 2:3 and fills the full height in both the session (2:3) and this
  // Body Map (3:4) container, so anchor×100 transfers 1:1). Source of truth:
  // chakraCenterPlacement / bodyMapAnchorLibrary in BodyPlacementEngine.
  { id: 'crown',     name: 'Crown',         sanskrit: 'Sahasrāra',    color: '#B447FF', colorName: 'Violet', hz: 963, y:  4 },
  { id: 'third-eye', name: 'Third Eye',     sanskrit: 'Ājñā',         color: '#5B47FF', colorName: 'Indigo', hz: 852, y: 10 },
  { id: 'throat',    name: 'Throat',        sanskrit: 'Viśuddha',     color: '#1FB6FF', colorName: 'Blue',   hz: 741, y: 16 },
  { id: 'heart',     name: 'Heart',         sanskrit: 'Anāhata',      color: '#43E66A', colorName: 'Green',  hz: 639, y: 30 },
  { id: 'plexus',    name: 'Solar Plexus',  sanskrit: 'Maṇipūra',     color: '#FFD600', colorName: 'Yellow', hz: 528, y: 37 },
  { id: 'sacral',    name: 'Sacral',        sanskrit: 'Svādhiṣṭhāna', color: '#FF8A1A', colorName: 'Orange', hz: 417, y: 46 },
  { id: 'root',      name: 'Root',          sanskrit: 'Mūlādhāra',    color: '#FF3D5C', colorName: 'Red',    hz: 396, y: 48 },
]

// Planet → Sacred Tones fork name + Hz (for the body-map planet detail panel).
const PLANET_FORK_NAME: Record<string, string> = {
  Sun: 'Sun', Moon: 'Full Moon', Mercury: 'Mercury', Venus: 'Venus',
  Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn',
  Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto',
}
function forkHzFor(planet: string): string | null {
  const name = PLANET_FORK_NAME[planet]
  if (!name) return null
  const f = (sacredTonesData as Array<{ planet: string; hz: number | string }>).find((x) => x.planet === name)
  return f?.hz != null ? String(f.hz) : null
}

// ─── PROPS ───────────────────────────────────────────────────────

interface BodyMapProps {
  chart: NatalChart
  accentColor: string
}

type View = 'anterior' | 'posterior'

interface DetailPanelData {
  kind: 'region' | 'chakra'
  region?: RegionKey
  chakra?: typeof CHAKRAS[number]
  planets: PlanetPosition[]
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

// v4.0 — Layer toggle modes per Final 20% Directive §4 (Minor Fixes)
type ViewMode = 'anatomy' | 'chakras' | 'planets' | 'combined' | 'full'
type Sex = 'female' | 'male'

const VIEW_MODES: { id: ViewMode; label: string; short: string }[] = [
  { id: 'anatomy',  label: 'Anatomy Only', short: 'Anatomy' },
  { id: 'chakras',  label: 'Chakras Only', short: 'Chakras' },
  { id: 'planets',  label: 'Planets Only', short: 'Planets' },
  { id: 'combined', label: 'Combined',     short: 'Combined' },
  { id: 'full',     label: 'Full Overlay', short: 'Full' },
]

// v4.1 — Per-sex anterior body images.
// Image selection logic per view mode:
//   - Anatomy Only OR Planets Only → CLEAN image (no embedded chakras)
//     This is critical when planet glyphs are overlayed — embedded chakras
//     would compete with them. Per Sha's directive.
//   - Chakras Only / Combined / Full → CHAKRAS image (embedded rainbow column)
//     SVG meridian overlay layers on top for interactivity.
function selectAnteriorImage(sex: Sex, _viewMode: ViewMode): string {
  // Unified body-map family (the new maps). Chakras are drawn by the SVG
  // meridian overlay on top, so we always use the clean anterior render.
  void _viewMode
  return `/images/bodymaps/${sex}-anterior.png`
}

export default function BodyMap({ chart, accentColor }: BodyMapProps) {
  const [view, setView]       = useState<View>('anterior')
  const [sex, setSex]         = useState<Sex>('female')
  const [hovered, setHovered] = useState<string | null>(null)
  const [detail, setDetail]   = useState<DetailPanelData | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('combined')
  // Phase 5 (Final QA) — on mobile the detail panel renders below the tall body
  // image, so a tap looked like "nothing happened." Scroll it into view on open.
  const detailRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (detail) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [detail])

  // v4.1 — Auto-shrink the SVG chakra meridian overlay when the embedded
  // chakra image is the base, since the image already shows them. The SVG
  // meridian only renders when:
  //   1. user explicitly chose "chakras only" (we want clickable interaction)
  //   2. OR base image is clean (no embedded chakras to compete with)
  //   3. OR posterior view (no anterior chakra image)
  // For combined/full with chakras image, we let the embedded chakras carry
  // the visual + still render the meridian overlay for click targets.
  const showChakras = viewMode === 'chakras' || viewMode === 'combined' || viewMode === 'full'
  const showPlanets = viewMode === 'planets' || viewMode === 'combined' || viewMode === 'full'

  // Anterior uses the new per-sex images. Posterior uses the existing
  // body-posterior.png (single asset for now — back chakra version pending).
  const anteriorSrc = selectAnteriorImage(sex, viewMode)

  // Group planets by region they activate
  const regionPlanets = useMemo<Record<RegionKey, PlanetPosition[]>>(() => {
    const map = {} as Record<RegionKey, PlanetPosition[]>
    chart.planets.forEach((p) => {
      const region = SIGN_TO_REGION[p.sign]
      if (!region) return
      if (!map[region]) map[region] = []
      map[region].push(p)
    })
    return map
  }, [chart])

  const activeRegions = Object.keys(regionPlanets) as RegionKey[]
  const positions = view === 'anterior' ? REGION_POS_ANTERIOR : REGION_POS_POSTERIOR
  // K.3 — Astryx places on the womb/sacral field, NEVER the genitals. Hard floor:
  // any MIDLINE marker is lifted out of the genital band. Off-midline (hips/legs at
  // x≈42) and lower legs/feet (y>60) are unaffected. Floor differs by view.
  const genitalFloor = view === 'anterior' ? 49 : 52
  const clampPos = (p: { x: number; y: number }) =>
    (p.x > 43 && p.x < 57 && p.y > genitalFloor && p.y < 60) ? { x: p.x, y: genitalFloor } : p

  return (
    <div className="relative w-full">
      {/* ─── CONTROL ROW ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <ViewToggle view={view} setView={setView} accent={accentColor} />
          <SexToggle sex={sex} setSex={setSex} accent={accentColor} />
        </div>
        <ViewModeSelector mode={viewMode} setMode={setViewMode} accent={accentColor} />
      </div>

      {/* ─── DOUBLE-BEZEL SHELL (high-end-visual-design §4.A) ── */}
      <div
        className="relative p-2 rounded-[2rem] overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(94,224,255,0.10)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 60px -28px rgba(58,140,255,0.35)',
        }}
      >
        <div
          className="relative rounded-[calc(2rem-0.5rem)] overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at 50% 35%, rgba(58,140,255,0.10) 0%, rgba(2,2,8,0.95) 55%, #020208 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.10)',
          }}
        >
          {/* Stardust */}
          <Stardust count={60} />

          {/* ───────────────────────────────────────────────────
              BODY IMAGE STACK — crossfade between anterior/posterior
              ─────────────────────────────────────────────────── */}
          <div
            className="relative w-full"
            style={{
              aspectRatio: '3 / 4',
              maxHeight: 720,
            }}
          >
            {/* Anterior — per-sex dynamic image. Clean (no embedded chakras)
                when planets are being overlayed so they don't compete. */}
            <img
              key={anteriorSrc}
              src={anteriorSrc}
              alt={`Holographic ${sex} body — anterior view`}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{
                opacity: view === 'anterior' ? 1 : 0,
                transition: 'opacity 700ms cubic-bezier(0.32,0.72,0,1)',
                filter: 'drop-shadow(0 0 40px rgba(94,224,255,0.20))',
              }}
              draggable={false}
            />
            {/* Posterior — unified per-sex map */}
            <img
              src={`/images/bodymaps/${sex}-posterior.png`}
              alt="Holographic anatomical body — posterior view"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{
                opacity: view === 'posterior' ? 1 : 0,
                transition: 'opacity 700ms cubic-bezier(0.32,0.72,0,1)',
                filter: 'drop-shadow(0 0 40px rgba(94,224,255,0.20))',
              }}
              draggable={false}
            />

            {/* ─── CHAKRA MERIDIAN OVERLAY ───────────────────── */}
            {showChakras && (
              <ChakraMeridianOverlay
                onChakraClick={(c) => setDetail({ kind: 'chakra', chakra: c, planets: [] })}
                hovered={hovered}
                setHovered={setHovered}
              />
            )}

            {/* ─── PLANETARY GLYPH OVERLAY ───────────────────── */}
            {showPlanets && activeRegions.map((region) => {
              const pos = clampPos(positions[region])
              const planets = regionPlanets[region]
              const primary = planets[0]
              const color = PLANET_COLORS[primary.planet] || accentColor
              const key = `region-${region}`
              const isHover = hovered === key
              return (
                <button
                  key={region}
                  type="button"
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(key)}
                  onBlur={() => setHovered(null)}
                  onClick={() => setDetail({ kind: 'region', region, planets })}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: 56,
                    height: 56,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  title={REGION_LABEL[region]}
                >
                  {/* Orbital ring (animates rotation) */}
                  <span
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      border: `1px dashed ${hexToRgba(color, isHover ? 0.85 : 0.55)}`,
                      transform: isHover ? 'scale(1.35)' : 'scale(1.0)',
                      transition: 'all 500ms cubic-bezier(0.32,0.72,0,1)',
                      animation: 'planetOrbit 16s linear infinite',
                    }}
                  />
                  {/* Glow halo */}
                  <span
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${hexToRgba(color, isHover ? 0.55 : 0.28)} 0%, transparent 70%)`,
                      filter: 'blur(8px)',
                      transform: isHover ? 'scale(1.6)' : 'scale(1)',
                      transition: 'all 600ms cubic-bezier(0.32,0.72,0,1)',
                    }}
                  />
                  {/* Solid token */}
                  <span
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-cinzel"
                    style={{
                      width:  isHover ? 38 : 30,
                      height: isHover ? 38 : 30,
                      background: '#020208',
                      border: `1.5px solid ${color}`,
                      color,
                      fontSize: isHover ? 18 : 14,
                      textShadow: `0 0 12px ${hexToRgba(color, 0.85)}`,
                      boxShadow: isHover
                        ? `0 0 28px ${hexToRgba(color, 0.7)}, inset 0 0 12px ${hexToRgba(color, 0.3)}`
                        : `0 0 14px ${hexToRgba(color, 0.45)}`,
                      transition: 'all 400ms cubic-bezier(0.32,0.72,0,1)',
                    }}
                  >
                    {PLANET_GLYPH[primary.planet] || '★'}
                  </span>
                  {/* +N badge for stacked planets */}
                  {planets.length > 1 && (
                    <span
                      className="absolute top-0 right-0 rounded-full flex items-center justify-center font-semibold"
                      style={{
                        width: 16, height: 16,
                        background: '#020208',
                        border: `1px solid ${color}`,
                        color,
                        fontSize: 9,
                        transform: 'translate(20%, -20%)',
                      }}
                    >
                      +{planets.length - 1}
                    </span>
                  )}
                </button>
              )
            })}

            {/* ASTRYX wordmark watermark at base */}
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 font-cinzel pointer-events-none"
              style={{
                fontSize: 10,
                letterSpacing: '0.55em',
                color: 'rgba(94,224,255,0.45)',
                textShadow: '0 0 10px rgba(94,224,255,0.4)',
              }}
            >
              A S T R Y X
            </div>
          </div>

          {/* ─── BOTTOM LEGEND ─────────────────────────────── */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 rounded-full mx-auto w-max max-w-full"
              style={{
                background: 'rgba(2,2,8,0.6)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(94,224,255,0.18)',
              }}
            >
              <span className="text-[9px] uppercase tracking-[0.25em] text-cyan-300/75 font-medium">
                Active
              </span>
              {activeRegions.slice(0, 6).map((r) => {
                const p = regionPlanets[r][0]
                const c = PLANET_COLORS[p.planet] || accentColor
                return (
                  <span key={r} className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: c, boxShadow: `0 0 6px ${c}` }}
                    />
                    <span className="text-[10px] text-white/85">{p.planet}</span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── DETAIL PANEL ──────────────────────────────────── */}
      {detail && (
        <div ref={detailRef} style={{ scrollMarginTop: 80 }}>
          <DetailPanel
            detail={detail}
            accentColor={accentColor}
            onClose={() => setDetail(null)}
          />
        </div>
      )}

      {/* ─── SCOPED KEYFRAMES ─────────────────────────────── */}
      <style jsx>{`
        @keyframes planetOrbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes chakraPulseLocal {
          0%, 100% { transform: scale(1);    opacity: 0.6; }
          50%      { transform: scale(1.5);  opacity: 0.05; }
        }
        @keyframes meridianFlowLocal {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -32; }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VIEW TOGGLE — Front / Back swipe pill
// ═══════════════════════════════════════════════════════════════

function ViewToggle({
  view, setView, accent,
}: { view: View; setView: (v: View) => void; accent: string }) {
  return (
    <div
      className="relative inline-flex p-1 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {/* Sliding active indicator */}
      <span
        className="absolute top-1 bottom-1 rounded-full pointer-events-none"
        style={{
          width: 'calc(50% - 4px)',
          left: view === 'anterior' ? 4 : 'calc(50% + 0px)',
          background: `linear-gradient(135deg, ${hexToRgba(accent, 0.25)} 0%, ${hexToRgba(accent, 0.10)} 100%)`,
          border: `1px solid ${hexToRgba(accent, 0.5)}`,
          boxShadow: `0 0 18px -4px ${hexToRgba(accent, 0.6)}`,
          transition: 'left 500ms cubic-bezier(0.32,0.72,0,1)',
        }}
      />
      {(['anterior', 'posterior'] as View[]).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className="relative px-5 py-1.5 text-[10px] uppercase tracking-[0.25em] font-medium kowalski-button rounded-full"
          style={{
            color: view === v ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
            background: 'transparent',
            border: 'none',
            transition: 'color 400ms cubic-bezier(0.32,0.72,0,1)',
            zIndex: 1,
          }}
        >
          {v === 'anterior' ? '◐ Front' : 'Back ◑'}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CHAKRA MERIDIAN OVERLAY (SVG on top of body image)
// ═══════════════════════════════════════════════════════════════

function ChakraMeridianOverlay({
  onChakraClick, hovered, setHovered,
}: {
  onChakraClick: (c: typeof CHAKRAS[number]) => void
  hovered: string | null
  setHovered: (h: string | null) => void
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <defs>
        <linearGradient id="chakra-meridian-grad" x1="0" y1="0" x2="0" y2="1">
          {/* stops track the chakra fractions along the crown(4)→root(48) line */}
          <stop offset="0%"   stopColor="#B447FF" />
          <stop offset="14%"  stopColor="#5B47FF" />
          <stop offset="27%"  stopColor="#1FB6FF" />
          <stop offset="59%"  stopColor="#43E66A" />
          <stop offset="75%"  stopColor="#FFD600" />
          <stop offset="95%"  stopColor="#FF8A1A" />
          <stop offset="100%" stopColor="#FF3D5C" />
        </linearGradient>
        <filter id="meridian-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Solid glowing meridian core (crown → root) */}
      <line
        x1="50" y1="4" x2="50" y2="48"
        stroke="url(#chakra-meridian-grad)"
        strokeWidth="0.5"
        strokeLinecap="round"
        opacity="0.95"
        filter="url(#meridian-glow)"
      />
      {/* Flowing dashed overlay */}
      <line
        x1="50" y1="4" x2="50" y2="48"
        stroke="url(#chakra-meridian-grad)"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeDasharray="0.5 1.5"
        opacity="0.55"
        style={{ animation: 'meridianFlowLocal 5s linear infinite' }}
      />

      {/* 7 chakra nodes */}
      {CHAKRAS.map((c) => {
        const isHover = hovered === `chakra-${c.id}`
        return (
          <g
            key={c.id}
            style={{ cursor: 'pointer', pointerEvents: 'all' }}
            onMouseEnter={() => setHovered(`chakra-${c.id}`)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChakraClick(c)}
          >
            {/* Outer pulse ring */}
            <circle
              cx="50" cy={c.y}
              r={isHover ? 4.6 : 3.6}
              fill="none"
              stroke={c.color}
              strokeWidth="0.2"
              opacity={isHover ? 0.6 : 0.4}
              style={{ transition: 'all 600ms cubic-bezier(0.32,0.72,0,1)' }}
            />
            {/* Animated mid pulse */}
            <circle
              cx="50" cy={c.y}
              r="2.7"
              fill="none"
              stroke={c.color}
              strokeWidth="0.14"
              opacity="0.6"
              style={{
                transformOrigin: `50px ${c.y}px`,
                animation: `chakraPulseLocal 3.2s cubic-bezier(0.32,0.72,0,1) ${c.y * 0.05}s infinite`,
              }}
            />
            {/* Inner glowing core */}
            <circle
              cx="50" cy={c.y}
              r={isHover ? 1.7 : 1.3}
              fill={c.color}
              filter="url(#meridian-glow)"
              style={{ transition: 'all 400ms cubic-bezier(0.32,0.72,0,1)' }}
            />
            {/* Pinpoint */}
            <circle cx="50" cy={c.y} r="0.4" fill="#ffffff" />
          </g>
        )
      })}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// DETAIL PANEL — Double-Bezel slide-in
// ═══════════════════════════════════════════════════════════════

function DetailPanel({
  detail, accentColor, onClose,
}: {
  detail: DetailPanelData
  accentColor: string
  onClose: () => void
}) {
  const isChakra = detail.kind === 'chakra' && detail.chakra
  const chakraHz = isChakra ? detail.chakra!.hz : null
  const panelKey = isChakra ? `c-${detail.chakra!.id}` : `r-${detail.region}`

  // Tap-to-hear tone — pure Web Audio sine. Chakras play their Solfeggio Hz;
  // planets play their Cousto fork Hz. One shared player; tapping a playing
  // frequency stops it, tapping a different one switches.
  const [, forceTone] = useState(0)
  useEffect(() => {
    const unsub = onPureToneChange(() => forceTone((n) => n + 1))
    return unsub
  }, [])
  useEffect(() => {
    // Stop the tone whenever the panel target changes or the panel closes.
    return () => { stopPureTone() }
  }, [panelKey])
  const playingHz = pureToneHz()
  const toggleToneAt = (hz: number) => {
    if (pureToneHz() === hz) { stopPureTone() }
    else { audioSession.claim('chakraTone'); playPureTone(hz) }
  }
  const tonePlaying = chakraHz != null && playingHz === chakraHz

  const color = isChakra
    ? detail.chakra!.color
    : detail.planets[0]
      ? PLANET_COLORS[detail.planets[0].planet] || accentColor
      : accentColor

  return (
    <div
      className="mt-4 p-1.5 rounded-[2rem] animate-slide-in-up"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${hexToRgba(color, 0.3)}`,
        boxShadow: `0 0 36px -12px ${color}`,
      }}
    >
      <div
        className="relative p-5 rounded-[calc(2rem-0.375rem)] overflow-hidden"
        style={{
          background: 'rgba(2,2,8,0.85)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.10)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-[14px] kowalski-button"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.7)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ×
        </button>

        {isChakra && detail.chakra && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: detail.chakra.color, boxShadow: `0 0 10px ${detail.chakra.color}` }}
              />
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/55">
                Chakra · {detail.chakra.sanskrit}
              </span>
            </div>
            <div className="text-[22px] font-cinzel tracking-wide text-white/95 mb-3">
              {detail.chakra.name}
            </div>
            <div className="flex gap-4 text-[12px] text-white/75">
              <span>
                <span className="text-white/40">Hz</span>{' '}
                <span style={{ color: detail.chakra.color }}>{detail.chakra.hz}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-white/40">Color</span>{' '}
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: detail.chakra.color, boxShadow: `0 0 8px ${detail.chakra.color}` }}
                />
                <span style={{ color: detail.chakra.color }}>{detail.chakra.colorName}</span>
              </span>
            </div>

            {/* Play the chakra's Solfeggio tone */}
            <button
              onClick={() => toggleToneAt(detail.chakra!.hz)}
              className="mt-4 inline-flex items-center gap-2.5 px-4 py-2 rounded-full kowalski-button"
              style={{
                background: tonePlaying ? hexToRgba(detail.chakra.color, 0.26) : hexToRgba(detail.chakra.color, 0.12),
                border: `1px solid ${hexToRgba(detail.chakra.color, 0.5)}`,
                color: detail.chakra.color, cursor: 'pointer',
              }}
            >
              <span className="text-[13px]">{tonePlaying ? '❚❚' : '▶'}</span>
              <span className="text-[11px] uppercase tracking-[0.2em]">{tonePlaying ? 'Playing' : 'Play tone'}</span>
              <span className="text-[10px] text-white/55">{detail.chakra.hz} Hz</span>
            </button>
          </div>
        )}

        {!isChakra && detail.region && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/55 mb-1">
              Active Body Region
            </div>
            <div className="text-[20px] font-cinzel tracking-wide text-white/95 mb-3">
              {REGION_LABEL[detail.region]}
            </div>
            <div className="space-y-2">
              {detail.planets.map((p) => {
                const c = PLANET_COLORS[p.planet] || accentColor
                return (
                  <div
                    key={p.planet}
                    className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{
                      background: hexToRgba(c, 0.08),
                      border: `1px solid ${hexToRgba(c, 0.25)}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[18px] font-cinzel"
                        style={{ color: c }}
                      >
                        {PLANET_GLYPH[p.planet] || '★'}
                      </span>
                      <div>
                        <div className="text-[13px] text-white/90">
                          {p.planet} in {p.sign}
                        </div>
                        <div className="text-[10px] text-white/45">
                          House {p.house ?? '—'}
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const hzStr = forkHzFor(p.planet)
                      const hz = hzStr ? parseFloat(hzStr) : NaN
                      if (!Number.isFinite(hz)) return null
                      const playing = playingHz === hz
                      return (
                        <button
                          type="button"
                          onClick={() => toggleToneAt(hz)}
                          className="shrink-0 inline-flex items-center gap-2.5 pl-3 pr-3.5 py-1.5 rounded-full kowalski-button"
                          style={{
                            background: playing ? hexToRgba(c, 0.26) : hexToRgba(c, 0.12),
                            border: `1px solid ${hexToRgba(c, 0.5)}`,
                            color: c, cursor: 'pointer',
                          }}
                          aria-label={`${playing ? 'Stop' : 'Play'} ${p.planet} fork tone, ${hzStr} hertz`}
                        >
                          <span className="text-[12px]">{playing ? '❚❚' : '▶'}</span>
                          <div className="text-right leading-tight">
                            <div className="text-[13px] font-cinzel">{hzStr} Hz</div>
                            <div className="text-[8px] uppercase tracking-[0.22em] text-white/55">
                              {playing ? 'Playing' : 'Play fork'}
                            </div>
                          </div>
                        </button>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SEX TOGGLE — Female / Male body image swap (anterior only)
// ═══════════════════════════════════════════════════════════════

function SexToggle({
  sex, setSex, accent,
}: { sex: Sex; setSex: (s: Sex) => void; accent: string }) {
  return (
    <div
      className="relative inline-flex p-1 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {/* Sliding active indicator */}
      <span
        className="absolute top-1 bottom-1 rounded-full pointer-events-none"
        style={{
          width: 'calc(50% - 4px)',
          left: sex === 'female' ? 4 : 'calc(50% + 0px)',
          background: `linear-gradient(135deg, ${hexToRgba(accent, 0.25)} 0%, ${hexToRgba(accent, 0.10)} 100%)`,
          border: `1px solid ${hexToRgba(accent, 0.5)}`,
          boxShadow: `0 0 16px -4px ${hexToRgba(accent, 0.55)}`,
          transition: 'left 500ms cubic-bezier(0.32,0.72,0,1)',
        }}
      />
      {(['female', 'male'] as Sex[]).map((s) => (
        <button
          key={s}
          onClick={() => setSex(s)}
          className="relative px-3.5 py-1.5 text-[12px] kowalski-button rounded-full font-cinzel"
          style={{
            color: sex === s ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
            background: 'transparent',
            border: 'none',
            transition: 'color 400ms cubic-bezier(0.32,0.72,0,1)',
            zIndex: 1,
            minWidth: 32,
          }}
          aria-label={s === 'female' ? 'Female body' : 'Male body'}
        >
          {s === 'female' ? '♀' : '♂'}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VIEW MODE SELECTOR — Anatomy / Chakras / Planets / Combined / Full
// Per Final 20% Directive §4 (Body Mapping Layer Controls)
// ═══════════════════════════════════════════════════════════════

function ViewModeSelector({
  mode, setMode, accent,
}: { mode: ViewMode; setMode: (m: ViewMode) => void; accent: string }) {
  return (
    <div
      className="inline-flex p-1 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {VIEW_MODES.map((m) => {
        const active = mode === m.id
        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.18em] kowalski-button"
            title={m.label}
            style={{
              background: active
                ? `linear-gradient(135deg, ${hexToRgba(accent, 0.25)} 0%, ${hexToRgba(accent, 0.10)} 100%)`
                : 'transparent',
              border: 'none',
              color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
              boxShadow: active ? `0 0 12px -2px ${hexToRgba(accent, 0.55)}` : 'none',
              transition: 'all 350ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            {m.short}
          </button>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STARDUST OVERLAY
// ═══════════════════════════════════════════════════════════════

function Stardust({ count }: { count: number }) {
  const stars = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const x = ((i * 9301 + 49297) % 233280) / 233280
      const y = ((i * 1597 + 51749) % 233280) / 233280
      const r = 0.4 + ((i * 31) % 100) / 100 * 1.2
      const delay = (i % 7) * 0.4
      return { x, y, r, delay }
    })
  }, [count])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            width: s.r,
            height: s.r,
            opacity: 0.5,
            animation: `starTwinkle ${2.4 + (i % 4)}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
