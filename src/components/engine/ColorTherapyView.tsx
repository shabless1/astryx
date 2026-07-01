'use client'

/**
 * ASTRYX — Color Therapy View (Phase 3)
 *
 * A FULL-panel color therapy field (never a dot). The corrective field fills the
 * Chamber; a soft central glow breathes with the active breath pattern; the
 * chakra color is layered on very softly and never overrides the correction.
 * No flashing — only slow, fluid drift + a gentle breath pulse.
 */

import { hexToRgba } from '@/lib/utils'
import type { ColorTherapyOutput } from '@/lib/visual/ColorTherapyEngine'

export default function ColorTherapyView({
  color, activeForkLabel, planet, signalState, accentColor,
}: {
  color: ColorTherapyOutput
  activeForkLabel: string
  planet: string
  signalState: string
  sessionTime: number
  accentColor: string
}) {
  const breathSec = Math.max(6, color.breathSync.cycleSec)

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#020208' }}>
      {/* Full corrective color field — slow drift, no flashing */}
      <div
        className="absolute chamber-drift"
        style={{
          inset: '-8%',
          background: color.backgroundGradient,
          opacity: 0.55 + color.intensity * 0.4,
          animationDuration: `${Math.round(breathSec * 4)}s`,
        }}
      />

      {/* Soft central glow — breathes with the active pattern */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="chamber-breathe rounded-full"
          style={{
            width: 'min(70vw, 520px)', height: 'min(70vw, 520px)',
            background: `radial-gradient(circle, ${hexToRgba(color.glowColor, 0.55)} 0%, ${hexToRgba(color.pulseColor, 0.22)} 45%, transparent 72%)`,
            animationDuration: `${breathSec}s`,
            filter: 'blur(8px)',
          }}
        />
      </div>

      {/* Chakra color — layered softly ON TOP, never dominant */}
      {color.chakraAccent && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(circle at 50% 64%, ${hexToRgba(color.chakraAccent, 0.16)} 0%, transparent 48%)`,
        }} />
      )}

      {/* Edge vignette keeps it from feeling like a flat wash */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 50% 50%, transparent 55%, rgba(2,2,8,0.6) 100%)',
      }} />

      {/* Overlay text */}
      <div className="absolute left-0 right-0 top-[104px] px-6 text-center pointer-events-none">
        <div className="text-[12px] tracking-[0.25em] uppercase" style={{ color: hexToRgba(accentColor, 0.9) }}>
          {activeForkLabel} · {signalState}
        </div>
        <div className="text-[11px] text-white/60 tracking-[0.1em] mt-1">
          Color Field: {color.colorNames.join(' + ')}
        </div>
        <div className="text-[13px] text-white/85 italic mt-2 max-w-md mx-auto leading-relaxed">
          {color.visualInstruction}
        </div>
        <div className="text-[10px] text-white/40 tracking-[0.2em] mt-2">
          {color.breathSync.patternName}
        </div>
      </div>
    </div>
  )
}
