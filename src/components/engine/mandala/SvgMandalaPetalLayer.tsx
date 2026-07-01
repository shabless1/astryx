'use client'

/**
 * ASTRYX — SVG Mandala Petal Layer (Phase 3B)
 *
 * A radial bloom of petals/lens shapes — the lotus/flower layers (Venus, and the
 * soft petal accents on other planets). Presentational; rotation handled by parent.
 */

import { hexToRgba } from '@/lib/utils'
import { MC, petalPath } from '@/lib/visual/mandalaGeometry'

export default function SvgMandalaPetalLayer({
  count, r, width, color, opacity = 0.7, strokeW = 1.3, offset = false,
}: {
  count: number
  r: number
  width: number
  color: string
  opacity?: number
  strokeW?: number
  offset?: boolean
}) {
  const d = petalPath(r, width)
  const half = offset ? 180 / count : 0
  return (
    <g>
      {Array.from({ length: count }, (_, k) => (
        <path
          key={k}
          d={d}
          fill={hexToRgba(color, 0.10)}
          stroke={color}
          strokeWidth={strokeW}
          opacity={opacity}
          vectorEffect="non-scaling-stroke"
          transform={`rotate(${(k / count) * 360 + half} ${MC} ${MC})`}
        />
      ))}
    </g>
  )
}
