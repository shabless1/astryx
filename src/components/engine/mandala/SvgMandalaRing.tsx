'use client'

/**
 * ASTRYX — SVG Mandala Ring (Phase 3B)
 *
 * One concentric geometry band of the layered SVG kaleidoscope. Renders a single
 * family motif repeated `symmetry` times at radius `r`. Presentational only — the
 * parent (LayeredSvgMandala) handles rotation + glow + breath.
 */

import { hexToRgba } from '@/lib/utils'
import { MC, ptsOnCircle, polyPoints, starPoints, spiralPath, crescentPath } from '@/lib/visual/mandalaGeometry'

export type RingVariant =
  | 'ring' | 'poly3' | 'poly4' | 'poly6' | 'star' | 'crescent' | 'spiral' | 'rays' | 'nodes' | 'arcs'

export default function SvgMandalaRing({
  variant, r, symmetry, color, opacity = 0.7, strokeW = 1.4, fillGlow = false, rot = 0,
}: {
  variant: RingVariant
  r: number
  symmetry: number
  color: string
  opacity?: number
  strokeW?: number
  fillGlow?: boolean
  rot?: number
}) {
  const stroke = color
  const fill = fillGlow ? hexToRgba(color, 0.08) : 'none'
  const common = { stroke, strokeWidth: strokeW, fill, opacity, vectorEffect: 'non-scaling-stroke' as const }

  switch (variant) {
    case 'ring':
      return <circle cx={MC} cy={MC} r={r} {...common} />
    case 'poly3':
      return <polygon points={polyPoints(r, 3, -Math.PI / 2 + rot)} {...common} />
    case 'poly4':
      return <polygon points={polyPoints(r, 4, Math.PI / 4 + rot)} {...common} />
    case 'poly6':
      return <polygon points={polyPoints(r, 6, rot)} {...common} />
    case 'star':
      return <polygon points={starPoints(r, r * 0.5, symmetry, -Math.PI / 2 + rot)} {...common} />
    case 'spiral':
      return <path d={spiralPath(r * 0.18, r, 2, -1)} {...common} fill="none" />
    case 'crescent':
      return (
        <g>
          {ptsOnCircle(r * 0.82, symmetry, rot).map(([x, y], k) => (
            <path key={k} d={crescentPath(r * 0.16, x, y)} {...common}
                  transform={`rotate(${(k / symmetry) * 360} ${x} ${y})`} />
          ))}
        </g>
      )
    case 'rays':
      return (
        <g>
          {ptsOnCircle(r, symmetry, rot).map(([x, y], k) => (
            <line key={k} x1={MC} y1={MC} x2={x} y2={y} {...common} opacity={opacity * 0.6} />
          ))}
        </g>
      )
    case 'nodes':
      return (
        <g>
          {ptsOnCircle(r, symmetry, rot).map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r={2.6} fill={color} opacity={opacity} />
          ))}
        </g>
      )
    case 'arcs':
      return (
        <g>
          {ptsOnCircle(r * 0.8, Math.max(3, Math.round(symmetry / 2)), rot).map(([x, y], k, arr) => (
            <circle key={k} cx={x} cy={y} r={r * 0.22} {...common} opacity={opacity * 0.7} />
          ))}
        </g>
      )
    default:
      return <circle cx={MC} cy={MC} r={r} {...common} />
  }
}
