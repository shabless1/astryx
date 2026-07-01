'use client'

/**
 * ASTRYX — Kaleidoscope Mandala Canvas (Phase 3B)
 *
 * The single mount point for the mandala. Selects the renderer at runtime via the
 * performance ladder:
 *   webgl → R3F GLSL kaleidoscope (only when explicitly enabled / forced)
 *   svg   → layered SVG sacred-geometry mandala (the default — reliable everywhere)
 * A WebGL error boundary drops to SVG so the Chamber is never blank or crashes.
 * Reduced-motion → SVG with rotation frozen, breath pulse only.
 *
 * (2026-06-25 — reverted to this pre-session state per SHA: the cymatic/3D
 * experiments were removed; the mandala is the original SVG sacred-geometry view.)
 */

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useMandalaRenderer, resolveRenderer } from '@/lib/visual/mandalaPerformanceFallback'
import type { KaleidoscopeMandala } from '@/lib/visual/KaleidoscopeMandalaEngine'
import SacredGeometryMandalaView from './mandala/SacredGeometryMandalaView'

const WebGLMandala = dynamic(() => import('./mandala/WebGLMandala'), { ssr: false })

class WebGLBoundary extends React.Component<
  { onError: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

export default function KaleidoscopeMandalaCanvas({
  mandala, fieldOpacity = 1, forceReducedMotion = false, override = 'auto', showLabel = false,
}: {
  mandala: KaleidoscopeMandala
  fieldOpacity?: number
  forceReducedMotion?: boolean
  override?: 'auto' | 'webgl' | 'svg'
  /** show a faint corner label of the active renderer (for live comparison). */
  showLabel?: boolean
  /** accepted for caller compatibility; the SVG view does not use it. */
  phaseProgress?: number
}) {
  const auto = useMandalaRenderer()
  const { renderer, reducedMotion } = resolveRenderer(override, auto)
  const [webglFailed, setWebglFailed] = useState(false)
  const reduce = reducedMotion || forceReducedMotion

  const useWebGL = override !== 'svg' && renderer === 'webgl' && !reduce && !webglFailed
  const active = useWebGL ? 'WebGL' : webglFailed ? 'SVG (WebGL failed)' : 'SVG'

  return (
    <>
      {useWebGL ? (
        <div style={{ position: 'absolute', inset: 0, opacity: fieldOpacity }}>
          <WebGLBoundary onError={() => setWebglFailed(true)}>
            <WebGLMandala mandala={mandala} onContextLost={() => setWebglFailed(true)} />
          </WebGLBoundary>
        </div>
      ) : (
        <SacredGeometryMandalaView
          mandala={mandala}
          reducedMotion={reduce}
          fieldOpacity={fieldOpacity}
          quality="high"
        />
      )}
      {showLabel && (
        <div style={{
          position: 'absolute', right: 8, bottom: 6, fontSize: 9, letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', pointerEvents: 'none',
        }}>
          {active}
        </div>
      )}
    </>
  )
}
