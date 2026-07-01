'use client'

/**
 * ASTRYX — WebGL Mandala (Phase 3B · R3F Canvas wrapper)
 *
 * Dynamically imported (ssr:false) so three/R3F never run on the server. The
 * Canvas is alpha/transparent — the Chamber view supplies the background. Low
 * power preference + capped DPR keep it light on mobile.
 */

import { Canvas } from '@react-three/fiber'
import MandalaShaderPlane from './MandalaShaderPlane'
import type { KaleidoscopeMandala } from '@/lib/visual/KaleidoscopeMandalaEngine'

export default function WebGLMandala({
  mandala, onContextLost,
}: {
  mandala: KaleidoscopeMandala
  onContextLost?: () => void
}) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', premultipliedAlpha: false, failIfMajorPerformanceCaveat: false }}
      dpr={[1, 1.75]}
      style={{ width: '100%', height: '100%' }}
      frameloop="always"
      onCreated={({ gl }) => {
        // Context loss is common on hybrid-GPU laptops — fall back to SVG cleanly
        // instead of showing a dead canvas.
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onContextLost?.()
        }, { once: true })
      }}
    >
      <MandalaShaderPlane mandala={mandala} />
    </Canvas>
  )
}
