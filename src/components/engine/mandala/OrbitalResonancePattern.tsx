'use client'

/**
 * ASTRYX — Orbital Resonance Pattern (Phase 3C)
 *
 * Orbital-resonance-INSPIRED geometry (not a real ephemeris orbit): a luminous
 * rose curve + nested orbital circles + planet-like nodes that drift slowly
 * around the rim. Venus → 5-fold (pentagonal) rosette.
 */

import { hexToRgba } from '@/lib/utils'
import { orbitalRosette } from '@/lib/visual/sacredGeometryBaseLibrary'

export default function OrbitalResonancePattern({
  petals = 5, color, nodeColor, opacity = 0.7, spinSec = 110, reducedMotion = false,
}: {
  petals?: number
  color: string
  nodeColor?: string
  opacity?: number
  spinSec?: number
  reducedMotion?: boolean
}) {
  const geo = orbitalRosette(150, petals)
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%"
         style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity,
                  filter: `drop-shadow(0 0 4px ${hexToRgba(color, 0.6)})`, mixBlendMode: 'screen' }} aria-hidden>
      {/* nested orbital circles */}
      {geo.circles?.map((c, i) => (
        <circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} fill="none"
                stroke={color} strokeWidth={0.8} opacity={0.4} vectorEffect="non-scaling-stroke" />
      ))}
      {/* the rose curve + the orbiting nodes counter-rotate slowly */}
      <g className="chamber-rotate"
         style={{ transformBox: 'view-box', transformOrigin: '50% 50%',
                  animation: reducedMotion ? undefined : `counterRotate ${spinSec}s linear infinite` }}>
        {geo.paths?.map((d, i) => (
          <path key={`p${i}`} d={d} fill="none" stroke={color} strokeWidth={1.1}
                opacity={0.9} vectorEffect="non-scaling-stroke" />
        ))}
        {geo.nodes?.map((n, i) => (
          <circle key={`n${i}`} cx={n.x} cy={n.y} r={3.2} fill={nodeColor ?? color}
                  style={{ filter: `drop-shadow(0 0 6px ${nodeColor ?? color})` }} opacity={0.95} />
        ))}
      </g>
    </svg>
  )
}
