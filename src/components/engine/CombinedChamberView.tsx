'use client'

/**
 * ASTRYX — Combined Chamber View (Phase 3B)
 *
 * The premium, immersive layering:
 *   1. color therapy field (full background)
 *   2. large low-opacity kaleidoscope behind the body (0.25–0.45)
 *   3. body map with the active placement glow, on top
 *   4. minimal fork label + breath cue + timer
 * The mandala never competes with the body map.
 */

import { hexToRgba } from '@/lib/utils'
import type { ColorTherapyOutput } from '@/lib/visual/ColorTherapyEngine'
import type { KaleidoscopeMandala } from '@/lib/visual/KaleidoscopeMandalaEngine'
import type { ForkPlacement } from '@/lib/BodyPlacementEngine'
import type { BodyMapType } from '@/lib/bodyMapPlacement'
import KaleidoscopeMandalaCanvas from './KaleidoscopeMandalaCanvas'
import ChamberBodyMap from './ChamberBodyMap'

export default function CombinedChamberView({
  color, mandala, placement, bodyMapType,
  activeForkLabel, signalState, accentColor,
  rendererOverride = 'auto', phaseProgress = 0, breathwork = false,
}: {
  color: ColorTherapyOutput
  mandala: KaleidoscopeMandala
  placement: ForkPlacement
  bodyMapType: BodyMapType
  activeForkLabel: string
  signalState: string
  sessionTime: number
  accentColor: string
  rendererOverride?: 'auto' | 'webgl' | 'svg'
  phaseProgress?: number
  /** J.3 — Full-Spectrum breath bookend: hide the fork-placement dot. */
  breathwork?: boolean
}) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#020208' }}>
      {/* 1. color field background — softer than the full Color view */}
      <div className="absolute chamber-drift" style={{
        inset: '-8%', background: color.backgroundGradient,
        opacity: 0.34 + color.intensity * 0.22,
        animationDuration: `${Math.round(Math.max(6, color.breathSync.cycleSec) * 4)}s`,
      }} />
      {color.chakraAccent && (
        <div className="absolute inset-0" style={{
          background: `radial-gradient(circle at 50% 52%, ${hexToRgba(color.chakraAccent, 0.12)} 0%, transparent 50%)`,
        }} />
      )}

      {/* 2. kaleidoscope behind the body, low opacity so it doesn't compete */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ position: 'relative', width: 'min(94vw, 640px)', height: 'min(82vh, 640px)', opacity: 0.4 }}>
          <KaleidoscopeMandalaCanvas mandala={mandala} fieldOpacity={0.85} override={rendererOverride} phaseProgress={phaseProgress} />
        </div>
      </div>

      {/* 3. body map with active placement highlight, on top — seated in a band
          BELOW the fork-label header so the two never overlap at the top. */}
      <div className="absolute left-0 right-0 flex items-center justify-center px-6" style={{ top: 196, bottom: 176 }}>
        <div className="w-full max-w-[230px]">
          <ChamberBodyMap placement={placement} bodyMapType={bodyMapType} accentColor={color.dominantColor} hideForkDot={breathwork} />
        </div>
      </div>

      {/* 4. minimal fork label + breath cue + timer */}
      <div className="absolute left-0 right-0 top-[104px] px-6 text-center pointer-events-none">
        <div className="text-[12px] tracking-[0.25em] uppercase" style={{ color: hexToRgba(accentColor, 0.9) }}>
          {activeForkLabel} · {signalState}
        </div>
        <div className="text-[12px] text-white/80 italic mt-1.5 max-w-md mx-auto leading-relaxed">
          {color.visualInstruction}
        </div>
        <div className="text-[10px] text-white/40 tracking-[0.2em] mt-1.5">
          {color.breathSync.patternName}
        </div>
      </div>
    </div>
  )
}
