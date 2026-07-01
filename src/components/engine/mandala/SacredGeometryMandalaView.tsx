'use client'

/**
 * ASTRYX — Sacred Geometry Mandala View (Phase 3D · ONE SHAPE PER PLANET)
 * ════════════════════════════════════════════════════════════════════════════
 * SHA directive 2026-06-21: each fork phase shows its planet's ONE sacred solid,
 * rotating in true depth — not a converging soup of grids. The old composition
 * stacked the solid ON TOP of Metatron's Cube + the interlocking-triangle field
 * (the persistent "Star of David") + mirrored kaleidoscope copies + an orbital
 * rosette + a 24-ray burst, so every planet read the same and cluttered.
 *
 * Now the planet's 3D/4D solid is the hero. Everything else is pure atmosphere:
 * a soft radial glow, faint star sparkle, and the luminous core. No competing
 * line-shapes. The flat sacred grids are gone from this view.
 */

import { hexToRgba } from '@/lib/utils'
import type { KaleidoscopeMandala } from '@/lib/visual/KaleidoscopeMandalaEngine'
import { buildSacredGeometry, type GeometryQuality } from '@/lib/visual/SacredGeometryEngine'
import PlatonicSolidOverlay from './PlatonicSolidOverlay'

export default function SacredGeometryMandalaView({
  mandala, reducedMotion = false, fieldOpacity = 1, quality = 'high',
}: {
  mandala: KaleidoscopeMandala
  reducedMotion?: boolean
  fieldOpacity?: number
  quality?: GeometryQuality
}) {
  const s = buildSacredGeometry(mandala, quality)
  const pulse = Math.max(6, s.pulseRate)

  return (
    <div
      className="chamber-breathe"
      style={{
        position: 'relative', width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animationDuration: `${pulse}s`,
      }}
    >
      {/* soft cosmic backdrop glow (atmosphere only — no shapes) */}
      <div className="chamber-breathe" style={{
        position: 'absolute', top: '8%', left: '8%', width: '84%', height: '84%', borderRadius: '50%',
        background: `radial-gradient(circle, ${hexToRgba(s.glow, 0.5 * s.brightness)} 0%, ${hexToRgba(s.primary, 0.22 * s.brightness)} 40%, transparent 72%)`,
        filter: 'blur(26px)', mixBlendMode: 'screen', animationDuration: `${pulse * 1.15}s`,
      }} />

      {/* THE planet's shape — its one solid, rotating in depth */}
      {s.platonics.map((p, i) => (
        <PlatonicSolidOverlay
          key={p.name + i}
          name={p.name}
          color={p.color}
          opacity={(quality === 'low' ? 0.55 : 0.95) * fieldOpacity}
          spinSec={Math.round(s.rotationPrimarySec * (1 + i * 0.28))}
          scale={p.scale}
          reducedMotion={reducedMotion}
        />
      ))}

      {/* core glow + faint star sparkle (atmosphere) */}
      <svg viewBox="0 0 400 400" width="100%" height="100%"
           style={{ maxWidth: 660, maxHeight: '100%', overflow: 'visible' }}
           preserveAspectRatio="xMidYMid meet" aria-hidden>
        <defs>
          <radialGradient id="sgCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={s.core} stopOpacity={1} />
            <stop offset="34%" stopColor={s.core} stopOpacity={0.5} />
            <stop offset="100%" stopColor={s.core} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="sgHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={s.glow} stopOpacity={0.4} />
            <stop offset="58%" stopColor={s.glow} stopOpacity={0.08} />
            <stop offset="100%" stopColor={s.glow} stopOpacity={0} />
          </radialGradient>
        </defs>

        <circle cx={200} cy={200} r={158} fill="url(#sgHalo)" style={{ mixBlendMode: 'screen' }} />

        {/* faint star sparkle — points of light, not a shape */}
        {s.particleNodes.length > 0 && (
          <g style={{ mixBlendMode: 'screen' }}>
            {s.particleNodes.map((n, i) => (
              <circle key={i} cx={n.x} cy={n.y} r={i % 5 === 0 ? 1.6 : 1.0}
                      fill={i % 3 === 0 ? s.accent : '#EAF1FF'}
                      style={{
                        animation: reducedMotion ? undefined : `mandalaTwinkle ${6 + (i % 5)}s ease-in-out ${(i % 7) * 0.4}s infinite`,
                        filter: `drop-shadow(0 0 3px ${hexToRgba(s.accent, 0.7)})`,
                      }}
                      opacity={0.4} />
            ))}
          </g>
        )}

        {/* luminous centre */}
        <circle cx={200} cy={200} r={54} fill="url(#sgCore)" style={{ mixBlendMode: 'screen' }} />
        <circle cx={200} cy={200} r={8} fill={s.core}
                style={{ filter: `drop-shadow(0 0 14px ${s.core}) drop-shadow(0 0 28px ${hexToRgba(s.core, 0.6)})` }} />
      </svg>
    </div>
  )
}
