'use client'

/**
 * ASTRYX — Image Mandala (Phase 3B — premium art renderer)
 *
 * Renders a supplied mandala ARTWORK (e.g. a Midjourney PNG) as a LIVING
 * frequency lens: slow breath-synced rotation, breath-pulse scale + glow,
 * signal-state colour grading, and a radial mask that blends the artwork's
 * edges into the cosmic black so it never looks like a pasted square.
 *
 * Drop art into:  public/images/mandalas/
 *   per-state:    {planet}-{state}.png   (e.g. venus-depleted.png)
 *   per-planet:   {planet}.png           (e.g. venus.png)
 *   (lowercase planet; state = elevated|depleted|blocked|balanced)
 *
 * If no matching file loads, onAllFailed() fires and the Chamber falls back to
 * the SVG kaleidoscope — so this is purely additive and never blanks.
 */

import { useState } from 'react'
import { hexToRgba } from '@/lib/utils'
import type { KaleidoscopeMandala } from '@/lib/visual/KaleidoscopeMandalaEngine'

// Signal-state grade so a single base artwork still reads correctly per state.
const STATE_GRADE: Record<string, string> = {
  elevated: 'saturate(0.92) brightness(0.9)',    // amplified → cooler / calmer
  depleted: 'saturate(1.06) brightness(1.1)',    // under-supported → warmer / brighter
  blocked:  'saturate(1.0) brightness(0.98)',
  balanced: 'saturate(1.0) brightness(1.0)',
}

export function mandalaArtSrcs(planet: string, stateKey: string): string[] {
  const p = planet.toLowerCase().replace(/\s+/g, '-')
  const base = '/images/mandalas'
  return [
    `${base}/${p}-${stateKey}.png`,
    `${base}/${p}-${stateKey}.jpg`,
    `${base}/${p}.png`,
    `${base}/${p}.jpg`,
  ]
}

export default function ImageMandala({
  mandala, srcs, reducedMotion = false, fieldOpacity = 1, onAllFailed,
}: {
  mandala: KaleidoscopeMandala
  srcs: string[]
  reducedMotion?: boolean
  fieldOpacity?: number
  onAllFailed?: () => void
}) {
  const [idx, setIdx] = useState(0)
  const src = srcs[idx]

  if (!src) { onAllFailed?.(); return null }

  const pulse = Math.max(6, mandala.pulseRate)
  const spinSec = Math.round(mandala.rotationPrimarySec * 1.8) // slower than the geometry
  const grade = STATE_GRADE[mandala.stateKey] ?? ''

  return (
    <div
      className="chamber-breathe"
      style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        animationDuration: `${pulse}s`, opacity: fieldOpacity,
      }}
    >
      {/* soft glow bed so the art sits in light, not on flat black */}
      <div className="chamber-breathe" style={{
        position: 'absolute', width: '74%', height: '74%', borderRadius: '50%',
        background: `radial-gradient(circle, ${hexToRgba(mandala.glowColor, 0.4 * mandala.brightness)} 0%, transparent 70%)`,
        filter: 'blur(26px)', mixBlendMode: 'screen', animationDuration: `${pulse * 1.15}s`,
      }} />
      <img
        key={src}
        src={src}
        alt=""
        onError={() => setIdx((i) => i + 1)}
        className="chamber-rotate"
        style={{
          maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
          animation: reducedMotion ? undefined : `rotate ${spinSec}s linear infinite`,
          transformOrigin: '50% 50%',
          filter: `${grade} drop-shadow(0 0 26px ${hexToRgba(mandala.glowColor, 0.5)})`,
          // blend the artwork edges into the cosmic black (no hard square edge)
          WebkitMaskImage: 'radial-gradient(circle, #000 58%, rgba(0,0,0,0.6) 72%, transparent 82%)',
          maskImage: 'radial-gradient(circle, #000 58%, rgba(0,0,0,0.6) 72%, transparent 82%)',
        }}
      />
    </div>
  )
}
