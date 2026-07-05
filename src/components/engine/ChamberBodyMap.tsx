'use client'

/**
 * ASTRYX — Chamber Body Map (instructional)
 *
 * Shown INSIDE the Resonance Chamber for the active fork phase. Driven by the
 * BodyPlacementEngine. Directive K: renders the fork's TWO placements as glowing
 * orbs — the TRADITIONAL placement (the planet's rulership home / zodiacal man)
 * and the NATAL placement (where the planet sits in THIS user's chart). When the
 * planet is in its own ruling sign the two collapse to ONE orb.
 *
 * Instructional, not decorative — it answers "where do I hold the fork?".
 */

import { useState, useEffect } from 'react'
import { hexToRgba } from '@/lib/utils'
import { resolveBodyMapAsset, fallbackBodyMapAsset, type BodyMapType, type BodyView } from '@/lib/bodyMapPlacement'
import type { ForkPlacement, PlacementAnchor } from '@/lib/BodyPlacementEngine'
import type { ReflexPoint } from '@/lib/ReflexEngine'
import { PLANET_COLORS } from '@/lib/engineClient'

interface ChamberBodyMapProps {
  placement: ForkPlacement
  bodyMapType: BodyMapType
  accentColor: string
  /** J.3 — Full-Spectrum breath bookend: render the body only, no orbs. */
  hideForkDot?: boolean
  /** Directive S · A1.3 — LOCAL (where it hurts) + REFLEX + planet-anatomy points
   *  from the Reflex engine (reflexPointsFor). Rendered as small planet-colored
   *  markers with plain labels; the reflex reasoning lives behind Astryx. */
  reflexPoints?: ReflexPoint[]
  /** Opens Astryx seeded with the reflex question (from the "Ask why" affordance). */
  onAskAstryx?: (seed: string) => void
  /** v4.5.1 — CHAKRA session: one orb at the chakra's fixed anatomical point, and
   *  a clean caption (the center + location), no Traditional/Natal framing. */
  chakraMode?: boolean
}

// K.2 — orb styles in clearly-named constants so a restyle is ONE line, not a
// refactor. Traditional = filled bright core + strong halo; Natal = haloed ring
// (outline), same planet color, so the pair reads as two placements not dupes.
const ORB_STYLE = {
  traditional: { halo: 60, core: 16 },
  natal:       { halo: 52, ring: 26 },
}

const prettyRegion = (r: string) => {
  const s = r.replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function ChamberBodyMap({ placement, bodyMapType, accentColor, hideForkDot = false, reflexPoints, onAskAstryx, chakraMode = false }: ChamberBodyMapProps) {
  const trad = placement.traditionalPlacement
  const natal = placement.natalPlacement
  const showNatal = !natal.sameAsTraditional
  const showReflex = !hideForkDot && !!reflexPoints && reflexPoints.length > 0

  // Default to the TRADITIONAL placement's view; reset when the planet changes.
  const [view, setView] = useState<BodyView>(trad.view)
  useEffect(() => { setView(trad.view) }, [trad.view, placement.planet])

  const src = resolveBodyMapAsset(bodyMapType, view)

  // N.1 — BOTH orbs always render on the shown body image (the anchor x/y is the
  // same on front/back). The Front/Back toggle just swaps the underlying image;
  // it never hides a placement. (Was gated per-view, which left only one orb.)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] uppercase tracking-[0.25em]" style={{ color: hexToRgba(accentColor, 0.85) }}>
          {hideForkDot ? 'The body' : 'Where to hold the fork'}
        </span>
        <div className="inline-flex p-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {(['anterior', 'posterior'] as BodyView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-0.5 rounded-full text-[9px] uppercase tracking-[0.2em] transition"
              style={{
                background: view === v ? hexToRgba(accentColor, 0.2) : 'transparent',
                color: view === v ? accentColor : 'rgba(255,255,255,0.5)',
              }}
            >
              {v === 'anterior' ? 'Front' : 'Back'}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative w-full mx-auto rounded-2xl overflow-hidden"
        style={{ maxWidth: 210, aspectRatio: '2 / 3', background: 'radial-gradient(ellipse at 50% 35%, rgba(58,140,255,0.08) 0%, #020208 70%)', border: '1px solid rgba(94,224,255,0.12)' }}
      >
        <img
          key={src}
          src={src}
          alt={`${bodyMapType} ${view} body map`}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
          onError={(e) => {
            const fb = fallbackBodyMapAsset(bodyMapType, view)
            if (e.currentTarget.src.indexOf(fb) === -1) e.currentTarget.src = fb
          }}
        />

        {/* K.2 / N.1 — both placement orbs always render (one when sameAsTraditional).
            Breathwork bookends pass hideForkDot → body only, no orbs. */}
        {!hideForkDot && <Orb p={trad} kind="traditional" color={accentColor} />}
        {!hideForkDot && showNatal && <Orb p={natal} kind="natal" color={accentColor} />}

        {/* SHA 2026-06-28 — each fork shows ONLY its 2 placements (traditional +
            natal). The reflex-point cloud is removed from the map; that reasoning
            lives behind Astryx, not scattered as extra orbs. */}
      </div>

      {/* Captions + legend */}
      {!hideForkDot && chakraMode && (
        /* v4.5.1 — chakra: ONE clean caption = the center + its fixed location. */
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span style={{ color: accentColor }}>◉</span>
            <span className="text-content-sm">{placement.primaryLabel}</span>
          </div>
          <div className="flex items-center gap-3 pt-0.5 text-[8px] uppercase tracking-[0.18em] text-white/40">
            <span><span style={{ color: accentColor }}>◉</span> Chakra placement · same for every body</span>
          </div>
        </div>
      )}
      {!hideForkDot && !chakraMode && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span style={{ color: accentColor }}>◉</span>
            <span className="text-content-sm">
              <span className="uppercase tracking-[0.18em] text-[9px] text-white/45">Traditional · </span>
              {prettyRegion(trad.region)}{trad.mode === 'sweep' ? ' · off-body sweep' : ''}
            </span>
          </div>
          {showNatal && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span style={{ color: hexToRgba(accentColor, 0.95) }}>◎</span>
              <span className="text-content-sm">
                <span className="uppercase tracking-[0.18em] text-[9px] text-white/45">Natal · {natal.sign ?? ''} · </span>
                {prettyRegion(natal.region)}{natal.mode === 'sweep' ? ' · off-body sweep' : ''}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 pt-0.5 text-[8px] uppercase tracking-[0.18em] text-white/40">
            <span><span style={{ color: accentColor }}>◉</span> Traditional placement</span>
            {showNatal && <span><span style={{ color: accentColor }}>◎</span> Natal placement</span>}
          </div>

          {/* SHA — "where else does it ease?" reflex reasoning lives behind Astryx. */}
          {onAskAstryx && (
            <button
              onClick={() => onAskAstryx('Where else does this ease on my body — the reflex points — and why?')}
              className="mt-1.5 text-[10.5px]"
              style={{ color: accentColor, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Where else does it ease? Ask Astryx →
            </button>
          )}
        </div>
      )}

      {/* A1.3 — quiet technique expander (retained from Directive R). */}
      {!hideForkDot && <TechniqueExpander accentColor={accentColor} />}
    </div>
  )
}

/** A small reflex/local/root marker (planet-colored), plainly shaped by kind. */
function ReflexDot({ pt }: { pt: ReflexPoint }) {
  const color = PLANET_COLORS[pt.planet] || '#C084FC'
  const left = `${pt.x * 100}%`
  const top = `${pt.y * 100}%`
  const common = { left, top } as const
  if (pt.kind === 'local') {
    return (
      <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{ ...common, width: 11, height: 11, background: color, boxShadow: `0 0 9px ${hexToRgba(color, 0.8)}`, opacity: 0.92 }} title={`Apply here for comfort · ${pt.region}`} />
    )
  }
  if (pt.kind === 'planet') {
    return (
      <div className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ ...common, width: 11, height: 11, background: color, transform: 'translate(-50%,-50%) rotate(45deg)', boxShadow: `0 0 8px ${hexToRgba(color, 0.7)}`, opacity: 0.85 }} title={`Root point · ${pt.region}`} />
    )
  }
  // reflex — hollow ring
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
      style={{ ...common, width: 12, height: 12, border: `2px solid ${color}`, boxShadow: `0 0 7px ${hexToRgba(color, 0.55)}`, opacity: 0.8 }} title={`Reflex point · ${pt.region}`} />
  )
}

/** Quiet "How to use this fork" expander — the fork technique, one tap away. */
function TechniqueExpander({ accentColor }: { accentColor: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2 pt-2 border-t border-white/8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.2em]"
        style={{ color: hexToRgba(accentColor, 0.8), background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span>How to use this fork</span>
        <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 300ms' }}>↓</span>
      </button>
      {open && (
        <ol className="mt-2 space-y-1 text-[11px] text-content-sm list-decimal pl-4 leading-relaxed">
          <li>Settle with a slow breath (Reception).</li>
          <li>Strike the fork on a soft surface — never metal.</li>
          <li>For a weighted fork, set the stem to the body point (or bring the tines near the ears); for the intimate field, hover just off-body — no contact.</li>
          <li>Two applications at most — less is more; let the tone fade each time.</li>
          <li>Close with a breath to seal (Stillness → Seal).</li>
        </ol>
      )}
    </div>
  )
}

/** A single glowing orb (or off-body sweep for intimate placements). */
function Orb({ p, kind, color }: { p: PlacementAnchor; kind: 'traditional' | 'natal'; color: string }) {
  const left = `${p.anchor.x * 100}%`
  const top = `${p.anchor.y * 100}%`

  // Off-body sweep placements (intimate regions / Pluto) render the no-contact
  // sweep path + hollow ring instead of a solid orb.
  if (p.mode === 'sweep') {
    const from = p.sweep?.from ?? p.anchor
    return (
      <>
        {p.sweep?.to && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <line x1={from.x * 100} y1={from.y * 100} x2={p.sweep.to.x * 100} y2={p.sweep.to.y * 100}
              stroke={color} strokeWidth={0.9} strokeDasharray="3 2" opacity={0.85} vectorEffect="non-scaling-stroke" markerEnd={`url(#sweepArrow-${kind})`} />
            <defs>
              <marker id={`sweepArrow-${kind}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill={color} />
              </marker>
            </defs>
          </svg>
        )}
        <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ left: `${from.x * 100}%`, top: `${from.y * 100}%`, width: 22, height: 22, border: `2px dashed ${color}`, boxShadow: `0 0 12px ${hexToRgba(color, 0.6)}` }} />
      </>
    )
  }

  const s = kind === 'traditional' ? ORB_STYLE.traditional : ORB_STYLE.natal
  return (
    <div className="absolute pointer-events-none" style={{ left, top, width: 0, height: 0 }}>
      {/* luminous halo (both) — GPU-light pulse (opacity/transform only) */}
      <div className="absolute rounded-full"
        style={{
          left: 0, top: 0, width: s.halo, height: s.halo, marginLeft: -s.halo / 2, marginTop: -s.halo / 2,
          background: `radial-gradient(circle, ${hexToRgba(color, kind === 'traditional' ? 0.7 : 0.45)} 0%, ${hexToRgba(color, 0.2)} 45%, transparent 72%)`,
          animation: 'forkDotPulse 2.6s ease-in-out infinite',
        }} />
      {kind === 'traditional' ? (
        /* filled bright core */
        <div className="absolute rounded-full"
          style={{
            left: 0, top: 0, width: ORB_STYLE.traditional.core, height: ORB_STYLE.traditional.core,
            marginLeft: -ORB_STYLE.traditional.core / 2, marginTop: -ORB_STYLE.traditional.core / 2,
            background: '#ffffff', boxShadow: `0 0 14px 3px ${color}, 0 0 30px ${hexToRgba(color, 0.85)}`,
            animation: 'forkDotCore 2.6s ease-in-out infinite',
          }} />
      ) : (
        /* haloed RING (outline orb) — same planet color, reads as the pair-mate */
        <div className="absolute rounded-full"
          style={{
            left: 0, top: 0, width: ORB_STYLE.natal.ring, height: ORB_STYLE.natal.ring,
            marginLeft: -ORB_STYLE.natal.ring / 2, marginTop: -ORB_STYLE.natal.ring / 2,
            border: `2.5px solid ${color}`, boxShadow: `0 0 12px ${hexToRgba(color, 0.7)}, inset 0 0 8px ${hexToRgba(color, 0.5)}`,
            animation: 'forkDotPulse 2.6s ease-in-out infinite',
          }} />
      )}
    </div>
  )
}
