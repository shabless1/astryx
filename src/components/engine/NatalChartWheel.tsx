'use client'

import { useState } from 'react'
import type { NatalChart } from '@/lib/ephemeris'
import { PLANET_COLORS } from '@/lib/engineClient'
import { hexToRgba } from '@/lib/utils'
import sacredTonesData from '@/data/sacredTones_nervousSystem.json'
import crystalsData from '@/data/crystalsExpanded.json'
import housesData from '@/data/houses.json'
import signsData from '@/data/signs.json'
import planetaryAnchors from '@/data/planetary-anchors.json'

// ─── DETAIL PANEL TYPES (Build Directive FIX 3) ────────────────
// Clicking planet/aspect/house in the wheel opens a slide-in detail panel.
// Each variant has its own data shape — discriminated union for type safety.

type DetailSelection =
  | { type: 'planet'; planet: string; sign: string; house: number; degree: number; retrograde: boolean }
  | { type: 'aspect'; planet1: string; planet2: string; aspectName: string; orb: number; applying?: boolean }
  | { type: 'house'; houseNum: number; sign: string }

const PLANET_TO_FORK: Record<string, string> = {
  Sun: 'Sun', Moon: 'Full Moon', Mercury: 'Mercury', Venus: 'Venus',
  Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn',
  Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto',
}

// ─── CONSTANTS ────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  { name: 'Aries',       symbol: '♈', color: '#E8453C' },
  { name: 'Taurus',      symbol: '♉', color: '#4CAF89' },
  { name: 'Gemini',      symbol: '♊', color: '#9EC832' },
  { name: 'Cancer',      symbol: '♋', color: '#A8C4D0' },
  { name: 'Leo',         symbol: '♌', color: '#F4A940' },
  { name: 'Virgo',       symbol: '♍', color: '#9EC832' },
  { name: 'Libra',       symbol: '♎', color: '#4CAF89' },
  { name: 'Scorpio',     symbol: '♏', color: '#E8453C' },
  { name: 'Sagittarius', symbol: '♐', color: '#F4A940' },
  { name: 'Capricorn',   symbol: '♑', color: '#C9993A' },
  { name: 'Aquarius',    symbol: '♒', color: '#2EC4B6' },
  { name: 'Pisces',      symbol: '♓', color: '#9B5DE5' },
]

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '⛢', Neptune: '♆', Pluto: '♇',
}

const ASPECT_COLORS: Record<string, string> = {
  conjunction:  '#F4A940',
  opposition:   '#E8453C',
  trine:        '#4CAF89',
  square:       '#E8453C',
  sextile:      '#2EC4B6',
  quincunx:     '#9B5DE5',
  semisquare:   '#C9993A',
  sesquisquare: '#C9993A',
}

const ASPECT_OPACITY: Record<string, number> = {
  conjunction: 0.7, opposition: 0.65, trine: 0.6,
  square: 0.65, sextile: 0.55, quincunx: 0.35,
  semisquare: 0.25, sesquisquare: 0.25,
}

// ─── GEOMETRY HELPERS ─────────────────────────────────────────

/** Ecliptic longitude → SVG angle. A proper natal wheel fixes the ASCENDANT at
 *  9 o'clock (left = 180°) and runs the ecliptic + houses COUNTERCLOCKWISE from
 *  it: Asc(left) → 2nd → 3rd → IC(bottom) → … → DC(right) → … → MC(top) → back.
 *  polarToXY uses y-up math angles (0°=right, 90°=top, 180°=left, 270°=bottom). */
function toAngle(lon: number, ascLon: number): number {
  return ((180 + lon - ascLon) % 360 + 360) % 360
}

function polarToXY(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy - radius * Math.sin(rad),
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────

interface NatalChartWheelProps {
  chart: NatalChart & { isSolarChart?: boolean }
  accentColor: string
  size?: number
}

export default function NatalChartWheel({
  chart,
  accentColor,
  size = 480,
}: NatalChartWheelProps) {
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null)
  // Patch 4.1 — aspects OFF by default so the chart doesn't open as a wall of
  // symbols for non-astrologers; they can switch the lines on when curious.
  const [showAspects, setShowAspects] = useState(false)
  const [showHouses, setShowHouses] = useState(true)
  // Build Directive FIX 3: click to open detail panel
  const [selected, setSelected] = useState<DetailSelection | null>(null)

  const cx = size / 2
  const cy = size / 2

  // Radii
  const R_OUTER     = size * 0.48   // outer edge
  const R_ZODIAC_IN = size * 0.40   // inner zodiac ring
  const R_HOUSE_OUT = size * 0.38   // outer house ring
  const R_HOUSE_IN  = size * 0.32   // inner house ring
  const R_PLANET    = size * 0.26   // planet placement ring
  const R_ASPECT    = size * 0.20   // aspect lines endpoint
  const R_CENTER    = size * 0.12   // center circle

  // ── WHOLE SIGN house system ──
  // Each house IS one whole sign. The 1st house is the Ascendant's whole sign.
  // CRITICAL: rotate by the Ascendant's SIGN, not its exact degree. Standard
  // whole-sign charts place 0° of the rising sign at the 9 o'clock (left), so the
  // rising sign fills the wedge from there counterclockwise (1st house at lower
  // left, ~8 o'clock) and every sign/house is a clean 30° wedge — no split, no
  // off-by-one. (Rotating by the degree made a late-degree Ascendant push its
  // sign up into the 12th.)
  const ascSignIdx = Math.floor((((chart.angles.ascendant % 360) + 360) % 360) / 30)
  const wheelAngle = (lon: number) => toAngle(lon, ascSignIdx * 30)
  const ascAngle = wheelAngle(chart.angles.ascendant)
  const wholeSignHouseOf = (lon: number) =>
    ((Math.floor((((lon % 360) + 360) % 360) / 30) - ascSignIdx + 12) % 12) + 1

  // ── ASPECT LINES ──────────────────────────────────────────
  const aspectLines = showAspects ? chart.aspects
    .filter(a => ['conjunction','opposition','trine','square','sextile'].includes(a.aspect))
    .slice(0, 20)
    .map((asp, i) => {
      const p1 = chart.planets.find(p => p.planet === asp.planet1)
      const p2 = chart.planets.find(p => p.planet === asp.planet2)
      if (!p1 || !p2) return null
      const a1 = wheelAngle(p1.longitude)
      const a2 = wheelAngle(p2.longitude)
      const pos1 = polarToXY(a1, R_ASPECT, cx, cy)
      const pos2 = polarToXY(a2, R_ASPECT, cx, cy)
      const color = ASPECT_COLORS[asp.aspect] || '#888'
      const opacity = ASPECT_OPACITY[asp.aspect] || 0.3
      const isHovered = hoveredPlanet === asp.planet1 || hoveredPlanet === asp.planet2
      return { ...asp, pos1, pos2, color, opacity: isHovered ? Math.min(opacity + 0.3, 1) : opacity, key: i }
    }).filter(Boolean) : []

  // ── PLANET POSITIONS ──────────────────────────────────────
  // Spread planets that are too close together
  const planetPositions = chart.planets.map(planet => {
    const angle = wheelAngle(planet.longitude)
    const pos = polarToXY(angle, R_PLANET, cx, cy)
    const aspectPos = polarToXY(angle, R_ASPECT, cx, cy)
    return { ...planet, angle, pos, aspectPos, wholeSignHouse: wholeSignHouseOf(planet.longitude) }
  })

  // ── HOUSE LABEL POSITIONS ─────────────────────────────────
  const houseLabelRadius = (R_HOUSE_IN + R_ASPECT) / 2

  return (
    <div className="flex flex-col items-center font-rajdhani">
      {/* Controls */}
      <div className="flex gap-3 mb-3">
        {[
          { label: 'Aspects', val: showAspects, set: setShowAspects },
          { label: 'Houses', val: showHouses, set: setShowHouses },
        ].map(ctrl => (
          <button
            key={ctrl.label}
            onClick={() => ctrl.set(!ctrl.val)}
            className="text-[10px] tracking-[0.15em] uppercase transition-all duration-200"
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              border: `1px solid ${ctrl.val ? accentColor : 'rgba(255,255,255,0.15)'}`,
              background: ctrl.val ? hexToRgba(accentColor, 0.12) : 'transparent',
              color: ctrl.val ? accentColor : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
            }}
          >
            {ctrl.label}
          </button>
        ))}
        {chart.isSolarChart && (
          <div
            className="text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-full"
            style={{ background: 'rgba(244,169,64,0.12)', border: '1px solid rgba(244,169,64,0.35)', color: '#F4A940' }}
          >
            ☉ Solar Chart
          </div>
        )}
      </div>

      {/* Patch 4.1 — plain-language legend so a non-astrologer knows what the
          toggles do (no astrology knowledge required). */}
      <p className="text-[10.5px] text-white/50 leading-snug text-center max-w-xs mb-3 -mt-1">
        <span style={{ color: hexToRgba(accentColor, 0.85) }}>Houses</span> = the 12 life areas ·{' '}
        <span style={{ color: hexToRgba(accentColor, 0.85) }}>Aspects</span> = the lines linking your planets.
        Tap a planet for detail.
      </p>

      {/* SVG Wheel */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ maxWidth: '100%' }}
      >
        {/* ── Background ── */}
        <circle cx={cx} cy={cy} r={R_OUTER} fill="rgba(16,21,44,0.96)" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />

        {/* ── Zodiac ring segments ── */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const startLon = i * 30
          const endLon   = startLon + 30
          const startAngle = wheelAngle(startLon)
          const endAngle   = wheelAngle(endLon)

          // Arc path
          const s = polarToXY(startAngle, R_OUTER, cx, cy)
          const e = polarToXY(endAngle,   R_OUTER, cx, cy)
          const si = polarToXY(startAngle, R_ZODIAC_IN, cx, cy)
          const ei = polarToXY(endAngle,   R_ZODIAC_IN, cx, cy)

          // Direction reversed (Ascendant-relative CCW) → flip the arc sweeps so
          // each 30° wedge still traces the short way.
          const path = [
            `M ${s.x} ${s.y}`,
            `A ${R_OUTER} ${R_OUTER} 0 0 1 ${e.x} ${e.y}`,
            `L ${ei.x} ${ei.y}`,
            `A ${R_ZODIAC_IN} ${R_ZODIAC_IN} 0 0 0 ${si.x} ${si.y}`,
            'Z',
          ].join(' ')

          // ── Curved sign NAME on the ring (SHA: written out, not just a glyph —
          // readable without knowing astrology, curved to fit its wedge). Names on
          // the lower half ride a reversed arc so they stay right-side-up.
          const nameR  = (R_OUTER + R_ZODIAC_IN) / 2
          const midPos = polarToXY(wheelAngle(startLon + 15), nameR, cx, cy)
          const bottom = midPos.y > cy
          const pA = polarToXY(wheelAngle(startLon + (bottom ? 28 : 2)), nameR, cx, cy)
          const pB = polarToXY(wheelAngle(startLon + (bottom ? 2 : 28)), nameR, cx, cy)
          const nameSweep = bottom ? 1 : 0
          const arcId = `zsign-${i}`

          return (
            <g key={sign.name}>
              <path
                d={path}
                fill={`${sign.color}2b`}
                stroke={`${sign.color}40`}
                strokeWidth="0.5"
              />
              {/* invisible baseline the curved name rides */}
              <path id={arcId} d={`M ${pA.x} ${pA.y} A ${nameR} ${nameR} 0 0 ${nameSweep} ${pB.x} ${pB.y}`} fill="none" />
              <text
                fontSize={size * 0.0205}
                fill={sign.color}
                opacity={0.95}
                style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.4px' }}
              >
                <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle" dominantBaseline="middle">
                  {sign.name}
                </textPath>
              </text>
            </g>
          )
        })}

        {/* ── Zodiac inner border ── */}
        <circle cx={cx} cy={cy} r={R_ZODIAC_IN} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />

        {/* ── 30° tick marks ── */}
        {Array.from({ length: 36 }, (_, i) => {
          const angle = wheelAngle(i * 10)
          const isSign = i % 3 === 0
          const outer = polarToXY(angle, R_ZODIAC_IN, cx, cy)
          const inner = polarToXY(angle, R_ZODIAC_IN - (isSign ? 8 : 4), cx, cy)
          return (
            <line
              key={i}
              x1={outer.x} y1={outer.y}
              x2={inner.x} y2={inner.y}
              stroke={isSign ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}
              strokeWidth={isSign ? '1' : '0.5'}
            />
          )
        })}

        {/* ── Houses — WHOLE SIGN ──
            One house per whole sign. The division lines sit ON the sign
            boundaries (no overlap), and the house number sits in its own band,
            well clear of the planet ring. Angular houses (1·4·7·10) are accented. */}
        {showHouses && ZODIAC_SIGNS.map((sign, signIdx) => {
          const houseNum  = ((signIdx - ascSignIdx + 12) % 12) + 1
          const isAngular = houseNum === 1 || houseNum === 4 || houseNum === 7 || houseNum === 10
          // Division line on the sign boundary (= the house cusp).
          const cuspAngle = wheelAngle(signIdx * 30)
          const lineOuter = polarToXY(cuspAngle, R_HOUSE_OUT, cx, cy)
          const lineInner = polarToXY(cuspAngle, R_CENTER, cx, cy)
          // House number in the middle of the sign wedge, in its own ring band.
          const houseNumR = (R_HOUSE_IN + R_HOUSE_OUT) / 2
          const numPos = polarToXY(wheelAngle(signIdx * 30 + 15), houseNumR, cx, cy)
          return (
            <g key={`house-${signIdx}`}>
              <line
                x1={lineOuter.x} y1={lineOuter.y}
                x2={lineInner.x} y2={lineInner.y}
                stroke={isAngular ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.12)'}
                strokeWidth={isAngular ? '1' : '0.7'}
                strokeDasharray={isAngular ? 'none' : '3 4'}
              />
              <g style={{ cursor: 'pointer' }} onClick={() => setSelected({ type: 'house', houseNum, sign: sign.name })}>
                <circle cx={numPos.x} cy={numPos.y} r={size * 0.028} fill="transparent" />
                <text
                  x={numPos.x} y={numPos.y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={size * 0.026}
                  fill={isAngular ? accentColor : 'rgba(255,255,255,0.5)'}
                  fontFamily="Arial"
                  fontWeight={isAngular ? 'bold' : 'normal'}
                  pointerEvents="none"
                >
                  {houseNum}
                </text>
              </g>
            </g>
          )
        })}

        {/* ── House ring ── */}
        <circle cx={cx} cy={cy} r={R_HOUSE_OUT} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={R_ASPECT + 6} fill="rgba(5,7,20,0.4)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

        {/* ── Aspect lines ── */}
        {aspectLines.map((asp: any) => (
          <g key={asp.key} style={{ cursor: 'pointer' }}>
            {/* Invisible wider hit target for click */}
            <line
              x1={asp.pos1.x} y1={asp.pos1.y}
              x2={asp.pos2.x} y2={asp.pos2.y}
              stroke="transparent"
              strokeWidth="8"
              onClick={() => setSelected({
                type: 'aspect',
                planet1: asp.planet1 ?? asp.p1 ?? '',
                planet2: asp.planet2 ?? asp.p2 ?? '',
                aspectName: asp.aspect,
                orb: asp.orb ?? 0,
                applying: asp.applying,
              })}
            />
            <line
              x1={asp.pos1.x} y1={asp.pos1.y}
              x2={asp.pos2.x} y2={asp.pos2.y}
              stroke={asp.color}
              strokeWidth="0.8"
              opacity={asp.opacity}
              strokeDasharray={['trine','sextile'].includes(asp.aspect) ? 'none' : '4 3'}
              pointerEvents="none"
            />
          </g>
        ))}

        {/* ── Center circle ── */}
        <circle cx={cx} cy={cy} r={R_CENTER} fill="rgba(8,12,30,0.9)" stroke={hexToRgba(accentColor, 0.3)} strokeWidth="1" />
        <text
          x={cx} y={cy - 6}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.028}
          fill={accentColor}
          fontFamily="Arial"
          fontWeight="bold"
        >
          {chart.angles.ascSign}
        </text>
        <text
          x={cx} y={cy + 9}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.020}
          fill="rgba(255,255,255,0.35)"
          fontFamily="Arial"
        >
          ASC
        </text>

        {/* ── ASC/DC/MC/IC angles ── */}
        {[
          { angle: chart.angles.ascendant,        label: 'ASC', color: accentColor },
          { angle: chart.angles.ascendant + 180,  label: 'DC',  color: hexToRgba(accentColor, 0.6) },
          { angle: chart.angles.midheaven,        label: 'MC',  color: '#F4A940' },
          { angle: chart.angles.midheaven + 180,  label: 'IC',  color: 'rgba(255,255,255,0.5)' },
        ].map(({ angle, label, color }) => {
          const a = wheelAngle(angle)
          const pos = polarToXY(a, R_HOUSE_OUT + 10, cx, cy)
          return (
            <text
              key={label}
              x={pos.x} y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.024}
              fill={color}
              fontFamily="Arial"
              fontWeight="bold"
              opacity={0.8}
            >
              {label}
            </text>
          )
        })}

        {/* ── Planets ── */}
        {planetPositions.map(planet => {
          const color = PLANET_COLORS[planet.planet] || '#fff'
          const symbol = PLANET_SYMBOLS[planet.planet] || '●'
          const isHovered = hoveredPlanet === planet.planet
          const r = isHovered ? size * 0.022 : size * 0.018

          return (
            <g
              key={planet.planet}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPlanet(planet.planet)}
              onMouseLeave={() => setHoveredPlanet(null)}
              onClick={() => setSelected({
                type: 'planet',
                planet: planet.planet,
                sign: planet.sign ?? '',
                house: planet.wholeSignHouse,
                degree: planet.signDegree ?? 0,
                retrograde: !!planet.retrograde,
              })}
            >
              {/* Planet dot */}
              <circle
                cx={planet.pos.x}
                cy={planet.pos.y}
                r={r}
                fill={`${color}22`}
                stroke={color}
                strokeWidth={isHovered ? 1.5 : 1}
              />
              {/* Planet symbol */}
              <text
                x={planet.pos.x}
                y={planet.pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size * 0.026}
                fill={color}
                fontFamily="Arial"
                opacity={isHovered ? 1 : 0.85}
              >
                {symbol}
              </text>
              {/* Degree line to zodiac ring */}
              {(() => {
                const ringPos = polarToXY(planet.angle, R_ZODIAC_IN - 2, cx, cy)
                const planetEdge = polarToXY(planet.angle, R_PLANET + r + 2, cx, cy)
                return (
                  <line
                    x1={planetEdge.x} y1={planetEdge.y}
                    x2={ringPos.x} y2={ringPos.y}
                    stroke={color}
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                )
              })()}
            </g>
          )
        })}
      </svg>

      {/* Planet hover tooltip (lightweight) */}
      {hoveredPlanet && !selected && (() => {
        const planet = chart.planets.find(p => p.planet === hoveredPlanet)
        if (!planet) return null
        const color = PLANET_COLORS[hoveredPlanet] || '#fff'
        return (
          <div
            className="mt-3 px-4 py-3 rounded-xl text-center animate-fade-in"
            style={{
              background: hexToRgba(color, 0.08),
              border: `1px solid ${hexToRgba(color, 0.3)}`,
              minWidth: 220,
            }}
          >
            <div className="font-cinzel text-base font-semibold" style={{ color }}>
              {PLANET_SYMBOLS[planet.planet]} {planet.planet}
            </div>
            <div className="text-[12px] text-white/87 mt-1">
              {planet.signDegree.toFixed(1)}° {planet.sign} · House {wholeSignHouseOf(planet.longitude)}
              {planet.retrograde && ' · Retrograde ℞'}
            </div>
            <div className="text-[10px] text-white/55 italic mt-1">Tap for detail</div>
          </div>
        )
      })()}

      {/* Click-to-open Detail Panel (Build Directive FIX 3) */}
      {selected && (
        <ChartDetailPanel
          selection={selected}
          chart={chart}
          accentColor={accentColor}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CHART DETAIL PANEL (slide-in from right)
// ═══════════════════════════════════════════════════════════════

function ChartDetailPanel({
  selection, chart, accentColor, onClose,
}: {
  selection: DetailSelection
  chart: NatalChart
  accentColor: string
  onClose: () => void
}) {
  const housesLib = housesData as Array<{ house: number; themes?: string[]; body_area?: string }>
  const signsLib  = signsData as Array<{ sign: string; body_regions?: string[]; organs_systems?: string[] }>
  const forks     = sacredTonesData as Array<{ planet: string; hz: string; note: string; chakra: string; boneApplicationPoint: string; nervePlexus?: string }>
  const crystals  = crystalsData as Array<{ planet: string; featuredCrystal: string; featuredCrystalData?: { bodyPlacement?: string; biologicalSystem?: string } }>
  const anchors   = planetaryAnchors as Array<{ planet: string; hz: number; function: string[] }>

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:pr-6"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:w-[360px] max-h-[80vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5"
        style={{
          background: 'linear-gradient(180deg, rgba(5,7,20,0.96) 0%, rgba(15,15,26,0.92) 100%)',
          border: `1px solid ${hexToRgba(accentColor, 0.35)}`,
          animation: 'slideInRight 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] tracking-[0.3em] text-white/55 uppercase">
            {selection.type === 'planet' ? 'Planet' : selection.type === 'aspect' ? 'Aspect' : 'House'}
          </div>
          <button
            onClick={onClose}
            className="text-[14px] text-white/55 hover:text-white/87 transition"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* PLANET PANEL */}
        {selection.type === 'planet' && (() => {
          const color = PLANET_COLORS[selection.planet] || accentColor
          const fork = forks.find((f) => f.planet === (PLANET_TO_FORK[selection.planet] ?? selection.planet))
          const crystal = crystals.find((c) => c.planet === selection.planet)
          const anchor = anchors.find((a) => a.planet === selection.planet)
          const sign = signsLib.find((s) => s.sign === selection.sign)
          return (
            <>
              <h3 className="font-cinzel text-[22px] mb-1" style={{ color }}>
                {PLANET_SYMBOLS[selection.planet]} {selection.planet}
              </h3>
              <p className="text-[12px] text-white/87 mb-3">
                {selection.degree.toFixed(1)}° {selection.sign} · {selection.house} House
                {selection.retrograde && ' · ℞'}
              </p>

              {anchor && (
                <PanelRow label="FREQUENCY" value={`${anchor.hz} Hz`} color={color} />
              )}
              {fork && (
                <>
                  <PanelRow label="TUNING FORK" value={`${fork.planet} · ${fork.hz} Hz · ${fork.note}`} color={color} />
                  <PanelRow label="CHAKRA" value={fork.chakra} color={color} />
                  <PanelRow label="APPLY AT" value={fork.boneApplicationPoint} color={color} highlight />
                </>
              )}
              {crystal && (
                <>
                  <PanelRow
                    label="CRYSTAL"
                    value={`${crystal.featuredCrystal}${crystal.featuredCrystal === 'Malachite' ? ' ⚠ POLISHED/SEALED ONLY' : ''}`}
                    color={color}
                    isMalachite={crystal.featuredCrystal === 'Malachite'}
                  />
                  {crystal.featuredCrystalData?.bodyPlacement && (
                    <PanelRow label="PLACEMENT" value={crystal.featuredCrystalData.bodyPlacement} color={color} />
                  )}
                </>
              )}
              {sign?.body_regions && sign.body_regions.length > 0 && (
                <PanelRow label="BODY REGIONS" value={sign.body_regions.join(' · ')} color={color} />
              )}
              {anchor?.function && (
                <PanelRow label="FUNCTION" value={anchor.function.join(' · ')} color={color} />
              )}
            </>
          )
        })()}

        {/* ASPECT PANEL */}
        {selection.type === 'aspect' && (() => {
          const color = ASPECT_COLORS[selection.aspectName] || accentColor
          const fork1 = forks.find((f) => f.planet === (PLANET_TO_FORK[selection.planet1] ?? selection.planet1))
          const fork2 = forks.find((f) => f.planet === (PLANET_TO_FORK[selection.planet2] ?? selection.planet2))
          return (
            <>
              <h3 className="font-cinzel text-[20px] mb-1" style={{ color }}>
                {selection.planet1} {selection.aspectName} {selection.planet2}
              </h3>
              <p className="text-[12px] text-white/87 mb-3">
                Orb {selection.orb.toFixed(1)}°
                {typeof selection.applying === 'boolean' && (
                  <span className="ml-1.5">· {selection.applying ? 'Applying' : 'Separating'}</span>
                )}
              </p>
              <p className="text-[13px] text-white/87 leading-relaxed mb-3 italic">
                This {selection.aspectName} between {selection.planet1} and {selection.planet2} may correlate
                with patterns of interaction between these planetary signatures in your chart.
              </p>
              {fork1 && fork2 && (
                <>
                  <PanelRow label="FORK COMBO" value={`${fork1.planet} (${fork1.hz} Hz) + ${fork2.planet} (${fork2.hz} Hz)`} color={color} highlight />
                  <PanelRow label="APPLY SEQUENCE" value={`First ${fork1.boneApplicationPoint.split('.')[0]}, then ${fork2.boneApplicationPoint.split('.')[0]}`} color={color} />
                </>
              )}
            </>
          )
        })()}

        {/* HOUSE PANEL */}
        {selection.type === 'house' && (() => {
          const house = housesLib.find((h) => h.house === selection.houseNum)
          const planetsHere = chart.planets.filter((p) => p.house === selection.houseNum)
          return (
            <>
              <h3 className="font-cinzel text-[22px] mb-1" style={{ color: accentColor }}>
                {selection.houseNum}{ordinalSuffix(selection.houseNum)} House
              </h3>
              <p className="text-[12px] text-white/87 mb-3">Cusp in {selection.sign}</p>
              {house?.themes && (
                <PanelRow label="THEMES" value={house.themes.join(' · ')} color={accentColor} highlight />
              )}
              {house?.body_area && (
                <PanelRow label="BODY AREA" value={house.body_area} color={accentColor} />
              )}
              <div className="mt-3">
                <div className="text-[10px] tracking-widest text-white/55 mb-1">PLANETS HERE</div>
                {planetsHere.length === 0 ? (
                  <p className="text-[12px] text-white/55 italic">None in this house</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {planetsHere.map((p) => (
                      <span
                        key={p.planet}
                        className="px-2 py-1 rounded text-[11px]"
                        style={{
                          background: hexToRgba(PLANET_COLORS[p.planet] || '#fff', 0.15),
                          color: PLANET_COLORS[p.planet] || '#fff',
                        }}
                      >
                        {PLANET_SYMBOLS[p.planet]} {p.planet}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )
        })()}

        <div className="text-[9px] text-white/35 text-center mt-4 italic tracking-widest">
          ⓘ Reference tool · Not medical advice
        </div>
      </div>
    </div>
  )
}

function PanelRow({
  label, value, color, highlight = false, isMalachite = false,
}: { label: string; value: string; color: string; highlight?: boolean; isMalachite?: boolean }) {
  return (
    <div className="mb-2.5">
      <div className="text-[9px] tracking-[0.25em] text-white/55 mb-0.5">{label}</div>
      <div
        className={`text-[12px] leading-snug ${highlight ? 'font-semibold' : ''}`}
        style={{ color: highlight ? color : 'rgba(255,255,255,0.87)' }}
      >
        {isMalachite ? (
          <>
            <span>{value.replace(' ⚠ POLISHED/SEALED ONLY', '')}</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-600 text-white">
              ⚠ POLISHED/SEALED ONLY
            </span>
          </>
        ) : value}
      </div>
    </div>
  )
}

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
