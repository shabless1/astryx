'use client'

/**
 * ASTRYX — SVG Mandala Orbit Particles (Phase 3B)
 *
 * Foreground shimmer — small dots orbiting slowly on 1–2 rings. Twinkle is a slow
 * (7s+) opacity ease, never a flash. The whole group is rotated by the parent.
 */

import { MC, ptsOnCircle } from '@/lib/visual/mandalaGeometry'

export default function SvgMandalaOrbitParticles({
  count, color, size = 2.2, twinkleSec = 7,
}: {
  count: number
  color: string
  size?: number
  twinkleSec?: number
}) {
  const ringA = ptsOnCircle(118, Math.ceil(count / 2), 0)
  const ringB = ptsOnCircle(152, Math.floor(count / 2), Math.PI / count)
  const all = [...ringA, ...ringB]
  return (
    <g>
      {all.map(([x, y], k) => (
        <circle
          key={k}
          cx={x}
          cy={y}
          r={size * (0.7 + (k % 3) * 0.18)}
          fill={color}
          style={{
            animation: twinkleSec > 0
              ? `mandalaTwinkle ${twinkleSec + (k % 4)}s ease-in-out ${(k % 5) * 0.6}s infinite`
              : undefined,
            opacity: twinkleSec > 0 ? undefined : 0.7,
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
        />
      ))}
    </g>
  )
}
