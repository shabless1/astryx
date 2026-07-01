'use client'

/**
 * ASTRYX — Sacred Solid Overlay, TRUE 3D / 4D  (Phase 3D)
 * ════════════════════════════════════════════════════════════════════════════
 * A glowing solid that genuinely rotates IN DEPTH. Every animation frame we
 * rotate the real 3D vertices (the tesseract: 4D → 3D first), perspective-project
 * them, and write the new coordinates straight onto the SVG <line>/<circle>
 * elements via refs — no React re-render. Near edges read brighter + thicker,
 * far edges dim + thin, so the form reads as a solid tumbling in space, not a
 * flat spinning outline.
 *
 * Reduced-motion → a single static tilted projection (still reads 3D, no motion).
 * Frame-throttled (~40fps) and ref-mutated to stay light on mobile WebKit.
 */

import { useEffect, useId, useMemo, useRef } from 'react'
import { hexToRgba } from '@/lib/utils'
import {
  getSolid, rot3, rot4, project4to3, project3to2,
  type SolidName, type ScreenPoint, type Angles4,
} from '@/lib/visual/solid3DLibrary'

const BASE_R = 94   // screen radius (viewBox units) at scale 1

interface A3 { ax: number; ay: number; az: number }

function projectAll(
  solid: ReturnType<typeof getSolid>, R: number, a3: A3, a4: Angles4,
): ScreenPoint[] {
  const pts: ScreenPoint[] = []
  if (solid.dims === 4 && solid.verts4) {
    for (const v of solid.verts4) {
      const v3 = project4to3(rot4(v, a4))
      pts.push(project3to2(rot3(v3, a3.ax, a3.ay, a3.az), R))
    }
  } else if (solid.verts3) {
    for (const v of solid.verts3) {
      pts.push(project3to2(rot3(v, a3.ax, a3.ay, a3.az), R))
    }
  }
  return pts
}

// depth (≈ -1.4..1.4) → 0..1 brightness factor
const shade = (depth: number) => Math.max(0, Math.min(1, (depth + 1.3) / 2.6))

export default function PlatonicSolidOverlay({
  name, color, opacity = 0.5, scale = 1, spinSec = 90, reducedMotion = false,
}: {
  name: SolidName
  color: string
  opacity?: number
  scale?: number
  spinSec?: number
  reducedMotion?: boolean
}) {
  const solid = useMemo(() => getSolid(name), [name])
  const R = BASE_R * scale
  // Unique fragment id so multiple overlays can each <use>-mirror their own solid.
  const uid = 'sg-' + useId().replace(/[:]/g, '')
  const FOLDS = 6   // kaleidoscope arms (mirrored repeats of THIS shape)
  const kaleidoSec = Math.max(40, Math.round(spinSec * 2.2))   // slow whole-field turn

  const lineRefs = useRef<(SVGLineElement | null)[]>([])
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([])

  // Initial static projection so first paint isn't empty / SSR-stable.
  const initial = useMemo(
    () => projectAll(solid, R, { ax: 0.5, ay: 0.6, az: 0 }, { xy: 0.3, zw: 0.4, xw: 0.2, yz: 0.1 }),
    [solid, R],
  )

  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    let last = 0
    const start = performance.now()
    const omega = (Math.PI * 2) / Math.max(20, spinSec)        // primary angular vel (rad/s)
    const omegaW = (Math.PI * 2) / Math.max(30, spinSec * 1.5) // 4D plane vel

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (now - last < 25) return            // ~40fps throttle
      last = now
      const t = (now - start) / 1000
      const a3: A3 = { ax: t * omega * 0.55, ay: t * omega, az: t * omega * 0.16 }
      const a4: Angles4 = { xy: t * omega * 0.4, zw: t * omegaW, xw: t * omegaW * 0.7, yz: t * omega * 0.3 }
      const pts = projectAll(solid, R, a3, a4)

      for (let i = 0; i < solid.edges.length; i++) {
        const el = lineRefs.current[i]
        if (!el) continue
        const [ai, bi] = solid.edges[i]
        const pa = pts[ai], pb = pts[bi]
        if (!pa || !pb) continue
        const f = shade((pa.depth + pb.depth) / 2)
        el.setAttribute('x1', pa.x.toFixed(1))
        el.setAttribute('y1', pa.y.toFixed(1))
        el.setAttribute('x2', pb.x.toFixed(1))
        el.setAttribute('y2', pb.y.toFixed(1))
        el.setAttribute('stroke-width', (0.7 + 1.5 * f).toFixed(2))
        el.setAttribute('opacity', (0.32 + 0.62 * f).toFixed(2))
      }
      if (solid.drawNodes) {
        for (let i = 0; i < pts.length; i++) {
          const el = nodeRefs.current[i]
          if (!el) continue
          const f = shade(pts[i].depth)
          el.setAttribute('cx', pts[i].x.toFixed(1))
          el.setAttribute('cy', pts[i].y.toFixed(1))
          el.setAttribute('r', (1.0 + 1.7 * f).toFixed(2))
          el.setAttribute('opacity', (0.4 + 0.55 * f).toFixed(2))
        }
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [solid, R, spinSec, reducedMotion])

  return (
    <div
      style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', opacity,
      }}
    >
      <svg
        viewBox="0 0 400 400" width="100%" height="100%"
        style={{ overflow: 'visible', maxWidth: 660, maxHeight: '100%', filter: `drop-shadow(0 0 5px ${hexToRgba(color, 0.7)})` }}
        aria-hidden
      >
        {/* Whole kaleidoscope slowly turns as one (on top of each arm's own 3D spin). */}
        <g
          style={{
            transformBox: 'view-box', transformOrigin: '50% 50%', mixBlendMode: 'screen',
            animation: reducedMotion ? undefined : `rotate ${kaleidoSec}s linear infinite`,
          }}
        >
          {/* The live 3D/4D solid — arm 0, and the source the other arms mirror. */}
          <g id={uid}>
            {solid.edges.map(([ai, bi], i) => {
              const pa = initial[ai], pb = initial[bi]
              return (
                <line
                  key={i}
                  ref={(el) => { lineRefs.current[i] = el }}
                  x1={pa?.x ?? 200} y1={pa?.y ?? 200} x2={pb?.x ?? 200} y2={pb?.y ?? 200}
                  stroke={color} strokeWidth={1.2} opacity={0.7}
                  strokeLinecap="round" vectorEffect="non-scaling-stroke"
                />
              )
            })}
            {solid.drawNodes && initial.map((p, i) => (
              <circle
                key={`n${i}`}
                ref={(el) => { nodeRefs.current[i] = el }}
                cx={p.x} cy={p.y} r={1.8} fill={color} opacity={0.85}
              />
            ))}
          </g>

          {/* Mirrored / rotated repeats of the SAME shape → kaleidoscope. */}
          {Array.from({ length: FOLDS - 1 }, (_, k) => {
            const arm = k + 1
            const ang = (360 / FOLDS) * arm
            const mirror = arm % 2 === 1
            const tf = `rotate(${ang} 200 200)` + (mirror ? ' translate(400 0) scale(-1 1)' : '')
            return <use key={arm} href={`#${uid}`} transform={tf} opacity={0.92} />
          })}
        </g>
      </svg>
    </div>
  )
}
