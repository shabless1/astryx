'use client'

/**
 * ASTRYX — Mandala Chamber View (Phase 3B)
 *
 * The mandala is now the main visual focus: a large kaleidoscope (WebGL → SVG →
 * CSS) filling 55–75% of the Chamber height, its glowing core sitting above the
 * music controls. Minimal text only — never long paragraphs over the geometry.
 */

import { hexToRgba } from '@/lib/utils'
import type { KaleidoscopeMandala } from '@/lib/visual/KaleidoscopeMandalaEngine'
import KaleidoscopeMandalaCanvas from './KaleidoscopeMandalaCanvas'

export default function MandalaChamberView({
  mandala, activeForkLabel, planet, signalState, accentColor,
  rendererOverride = 'auto', phaseProgress = 0,
}: {
  mandala: KaleidoscopeMandala
  activeForkLabel: string
  planet: string
  signalState: string
  sessionTime: number
  accentColor: string
  rendererOverride?: 'auto' | 'webgl' | 'svg'
  phaseProgress?: number
}) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#020208' }}>
      {/* faint planet wash so the kaleidoscope doesn't float on pure black */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(circle at 50% 46%, ${hexToRgba(mandala.colorPalette[0], 0.14)} 0%, transparent 62%)`,
      }} />

      {/* the kaleidoscope — large, central, core above the controls */}
      <div className="absolute left-0 right-0 flex items-center justify-center" style={{ top: 120, bottom: 176 }}>
        <div style={{ position: 'relative', width: 'min(92vw, 620px)', height: '100%', maxHeight: 640 }}>
          <KaleidoscopeMandalaCanvas mandala={mandala} override={rendererOverride} phaseProgress={phaseProgress} showLabel />
        </div>
      </div>

      {/* minimal overlay — top, never over the core */}
      <div className="absolute left-0 right-0 top-[104px] px-6 text-center pointer-events-none">
        <div className="text-[12px] tracking-[0.25em] uppercase" style={{ color: hexToRgba(accentColor, 0.9) }}>
          {activeForkLabel} · {signalState}
        </div>
        <div className="text-[11px] text-white/55 tracking-[0.12em] mt-1">
          Mandala: {mandala.shapeLabel} · {mandala.motionLabel}
        </div>
      </div>

      {/* breath cue — low, just above controls (phase-driven; no visible timer) */}
      <div className="absolute left-0 right-0 bottom-[182px] px-6 text-center pointer-events-none">
        <div className="text-[12px] text-white/80 italic max-w-md mx-auto leading-relaxed">
          {mandala.visualInstruction}
        </div>
        <div className="text-[10px] text-white/40 tracking-[0.2em] mt-1.5">
          {mandala.breathSync.patternName}
        </div>
      </div>
    </div>
  )
}
