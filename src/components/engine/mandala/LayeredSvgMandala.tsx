'use client'

/**
 * ASTRYX — Layered SVG Mandala (Phase 3B — premium fallback renderer)
 *
 * A luminous, multidimensional kaleidoscope built without WebGL. Depth + glow
 * come from GPU-friendly CSS filters (drop-shadow neon on the geometry, blur on
 * the bloom duplicate), gradient core + halo, mix-blend screen for additive
 * luminosity, and counter-rotating mirrored layers. Reads as a glowing frequency
 * lens, not line-art. All motion is slow + breath-synced; reduced-motion freezes
 * rotation and keeps only the breath pulse.
 */

import { hexToRgba } from '@/lib/utils'
import type { KaleidoscopeMandala } from '@/lib/visual/KaleidoscopeMandalaEngine'
import type { ShapeFamily } from '@/lib/visual/planetMandalaLibrary'
import SvgMandalaRing, { type RingVariant } from './SvgMandalaRing'
import SvgMandalaPetalLayer from './SvgMandalaPetalLayer'
import SvgMandalaOrbitParticles from './SvgMandalaOrbitParticles'

const FAMILY_LAYERS: Record<ShapeFamily, { outer: RingVariant; middle: RingVariant; inner: RingVariant; petals?: boolean }> = {
  'solar-rings':     { outer: 'rays',     middle: 'ring',     inner: 'star' },
  crescent:          { outer: 'ring',     middle: 'crescent', inner: 'crescent' },
  'hex-lattice':     { outer: 'poly6',    middle: 'poly6',    inner: 'nodes' },
  lotus:             { outer: 'ring',     middle: 'star',     inner: 'star', petals: true },
  triangle:          { outer: 'rays',     middle: 'poly4',    inner: 'poly3' },
  'expanding-rings': { outer: 'ring',     middle: 'arcs',     inner: 'spiral' },
  'square-grid':     { outer: 'ring',     middle: 'poly4',    inner: 'poly4' },
  'angular-star':    { outer: 'star',     middle: 'star',     inner: 'star' },
  'wave-spiral':     { outer: 'ring',     middle: 'spiral',   inner: 'spiral' },
  vortex:            { outer: 'ring',     middle: 'spiral',   inner: 'spiral' },
}

function Spin({
  dir, sec, frozen, mirror = false, opacity = 1, glowColor, children,
}: {
  dir: 'cw' | 'ccw'; sec: number; frozen: boolean; mirror?: boolean
  opacity?: number; glowColor?: string; children: React.ReactNode
}) {
  const anim = dir === 'cw' ? 'rotate' : 'counterRotate'
  return (
    <g
      className="chamber-rotate"
      style={{
        transformBox: 'view-box', transformOrigin: '50% 50%', opacity,
        animation: frozen ? undefined : `${anim} ${sec}s linear infinite`,
        filter: glowColor
          ? `drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 11px ${hexToRgba(glowColor, 0.55)})`
          : undefined,
      }}
    >
      {mirror ? <g transform="translate(400 0) scale(-1 1)">{children}</g> : children}
    </g>
  )
}

export default function LayeredSvgMandala({
  mandala, reducedMotion = false, fieldOpacity = 1,
}: {
  mandala: KaleidoscopeMandala
  reducedMotion?: boolean
  fieldOpacity?: number
}) {
  const m = mandala
  const fam = FAMILY_LAYERS[m.shapeFamily]
  const [primary, support, accent] = m.colorPalette
  const sym = Math.min(12, Math.max(3, m.symmetryCount))
  const baseOpacity = (0.62 + m.brightness * 0.38) * fieldOpacity
  const pulse = Math.max(6, m.pulseRate)
  const rp = m.rotationPrimarySec
  const rs = m.rotationSecondarySec

  // The full geometry stack — reused for the crisp pass and the bloom duplicate.
  const Geo = ({ glow = false }: { glow?: boolean }) => (
    <>
      <SvgMandalaRing variant={fam.outer} r={174} symmetry={sym} color={accent} opacity={glow ? 0.7 : 0.9} strokeW={glow ? 3 : 1.9} />
      <SvgMandalaRing variant="ring" r={152} symmetry={sym} color={accent} opacity={0.4} strokeW={1.1} />
      <SvgMandalaRing variant={fam.middle} r={128} symmetry={sym} color={support} opacity={0.95} strokeW={glow ? 3 : 2.2} fillGlow />
      <SvgMandalaRing variant="ring" r={106} symmetry={sym} color={support} opacity={0.32} strokeW={1} />
      <SvgMandalaRing variant={fam.inner} r={84} symmetry={sym} color={primary} opacity={0.95} strokeW={glow ? 2.6 : 2} fillGlow />
      {fam.petals && (
        <>
          <SvgMandalaPetalLayer count={sym} r={124} width={26} color={support} opacity={0.78} />
          <SvgMandalaPetalLayer count={sym} r={86} width={18} color={primary} opacity={0.82} offset />
        </>
      )}
    </>
  )

  return (
    <div
      className="chamber-breathe"
      style={{
        position: 'relative', width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animationDuration: `${pulse}s`,
      }}
    >
      {/* Backdrop bloom — large soft radial glow behind everything */}
      <div
        className="chamber-breathe"
        style={{
          position: 'absolute', top: '8%', left: '8%', width: '84%', height: '84%', borderRadius: '50%',
          background: `radial-gradient(circle, ${hexToRgba(m.glowColor, 0.55 * m.brightness)} 0%, ${hexToRgba(primary, 0.28 * m.brightness)} 40%, transparent 70%)`,
          filter: `blur(${20 + m.depth * 16}px)`, mixBlendMode: 'screen',
          animationDuration: `${pulse * 1.15}s`,
        }}
      />

      <svg viewBox="0 0 400 400" width="100%" height="100%"
           style={{ maxWidth: 640, maxHeight: '100%', opacity: baseOpacity, overflow: 'visible' }}
           preserveAspectRatio="xMidYMid meet" aria-hidden>
        <defs>
          <radialGradient id="ksCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={m.coreColor} stopOpacity={1} />
            <stop offset="32%" stopColor={m.coreColor} stopOpacity={0.5} />
            <stop offset="100%" stopColor={m.coreColor} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="ksHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={m.glowColor} stopOpacity={0.5} />
            <stop offset="55%" stopColor={m.glowColor} stopOpacity={0.12} />
            <stop offset="100%" stopColor={m.glowColor} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Halo glow disk behind the geometry */}
        <circle cx={200} cy={200} r={155} fill="url(#ksHalo)" style={{ mixBlendMode: 'screen' }} />

        {/* Depth bloom duplicate — scaled out, blurred, screen-blended */}
        <g style={{
          transform: 'scale(1.13)', transformBox: 'view-box', transformOrigin: '50% 50%',
          filter: 'blur(7px)', mixBlendMode: 'screen', opacity: 0.5,
        }}>
          <Spin dir="cw" sec={Math.round(rp * 1.35)} frozen={reducedMotion}><Geo glow /></Spin>
        </g>

        {/* Main geometry — neon drop-shadow glow */}
        <g style={{ mixBlendMode: 'screen' }}>
          <Spin dir="cw" sec={rp} frozen={reducedMotion} glowColor={primary}><Geo /></Spin>
        </g>

        {/* Counter-rotating middle accent */}
        <g style={{ mixBlendMode: 'screen' }} opacity={0.85}>
          <Spin dir="ccw" sec={rs} frozen={reducedMotion} glowColor={support}>
            <SvgMandalaRing variant={fam.middle} r={128} symmetry={sym} color={primary} opacity={0.8} strokeW={1.6} />
          </Spin>
        </g>

        {/* Mirrored fold (kaleidoscope), opposite spin */}
        <g style={{ mixBlendMode: 'screen' }} opacity={0.5}>
          <Spin dir="cw" sec={Math.round(rs * 1.1)} mirror frozen={reducedMotion}>
            <SvgMandalaRing variant={fam.middle} r={128} symmetry={sym} color={accent} opacity={0.7} strokeW={1.4} />
          </Spin>
        </g>

        {/* Chakra accent — soft, never dominant */}
        {m.chakraAccent && (
          <circle cx={200} cy={200} r={190} fill="none" stroke={m.chakraAccent} strokeWidth={1} opacity={0.2} />
        )}

        {/* Orbiting particle shimmer */}
        <Spin dir="ccw" sec={m.particle.orbitSec} frozen={reducedMotion} opacity={0.9}>
          <SvgMandalaOrbitParticles
            count={m.particle.count}
            color={support}
            size={m.particle.size}
            twinkleSec={reducedMotion ? 0 : m.particle.twinkleSec}
          />
        </Spin>

        {/* Central glowing core + halo */}
        <circle cx={200} cy={200} r={62} fill="url(#ksCore)" style={{ mixBlendMode: 'screen' }} />
        <circle cx={200} cy={200} r={10} fill={m.coreColor}
                style={{ filter: `drop-shadow(0 0 14px ${m.coreColor}) drop-shadow(0 0 26px ${hexToRgba(m.coreColor, 0.6)})` }} />
      </svg>
    </div>
  )
}
