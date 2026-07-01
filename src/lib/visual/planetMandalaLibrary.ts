/**
 * ASTRYX — Planet Mandala Library (Phase 3)
 *
 * Per-planet sacred geometry for the Mandala Chamber view. Shape family +
 * symmetry are fixed per planet; motion + speed shift with signal state.
 *
 * SAFETY: every motion is slow, breath-synced and fluid. For amplified /
 * electrified / heated / accelerated states the motion gets SLOWER (settling),
 * never faster. No flashing, strobing, or rapid spin — ever.
 */

import type { ColorState } from './planetColorTherapyLibrary'

export type ShapeFamily =
  | 'solar-rings' | 'crescent' | 'hex-lattice' | 'lotus' | 'triangle'
  | 'expanding-rings' | 'square-grid' | 'angular-star' | 'wave-spiral' | 'vortex'

export type MandalaMotion =
  | 'outward-pulse' | 'tidal-ripple' | 'organize-flow' | 'petal-bloom'
  | 'cool-contract' | 'activate-pulse' | 'compress-release' | 'expand-contain'
  | 'grid-breathe' | 'settle-current' | 'spark-wake' | 'ocean-drift'
  | 'inward-spiral' | 'root-glow' | 'steady-spin'

export type RotationDir = 'cw' | 'ccw' | 'none'

export interface MandalaStateProfile {
  motion: MandalaMotion
  motionWords: string
  /** rotation seconds (full turn) — larger = slower. Amplified states are slower. */
  rotationSec: number
  rotation: RotationDir
}

export interface PlanetMandalaProfile {
  shapeFamily: ShapeFamily
  /** radial fold count (petals, rays, sides). */
  symmetry: number
  /** base concentric layer count before phase scaling. */
  baseLayers: number
  defaultRotation: RotationDir
  states: Record<ColorState, MandalaStateProfile>
}

// Helper to build a state profile quickly.
const s = (
  motion: MandalaMotion, motionWords: string, rotationSec: number, rotation: RotationDir,
): MandalaStateProfile => ({ motion, motionWords, rotationSec, rotation })

export const PLANET_MANDALA: Record<string, PlanetMandalaProfile> = {
  Sun: {
    shapeFamily: 'solar-rings', symmetry: 12, baseLayers: 4, defaultRotation: 'cw',
    states: {
      elevated: s('outward-pulse', 'slow outward pulse · glow softens on the exhale', 120, 'cw'),
      depleted: s('outward-pulse', 'slow sunrise expansion · glow grows on the inhale', 90, 'cw'),
      blocked:  s('outward-pulse', 'the rays open again slowly', 100, 'cw'),
      balanced: s('steady-spin', 'very slow clockwise rotation · even glow', 80, 'cw'),
    },
  },
  Moon: {
    shapeFamily: 'crescent', symmetry: 8, baseLayers: 4, defaultRotation: 'ccw',
    states: {
      elevated: s('tidal-ripple', 'slow tidal ripple · gentle emotional settling', 130, 'ccw'),
      depleted: s('tidal-ripple', 'soft circular drift · the wave swells with the breath', 95, 'ccw'),
      blocked:  s('tidal-ripple', 'the ripple opens and feeling moves', 105, 'ccw'),
      balanced: s('steady-spin', 'gentle circular drift', 85, 'ccw'),
    },
  },
  Mercury: {
    shapeFamily: 'hex-lattice', symmetry: 6, baseLayers: 3, defaultRotation: 'cw',
    states: {
      elevated: s('organize-flow', 'lines organize slowly · nodes drift left to right', 140, 'cw'),
      depleted: s('organize-flow', 'pathways form slowly · gentle node activation', 100, 'cw'),
      blocked:  s('organize-flow', 'the lines reconnect slowly', 110, 'cw'),
      balanced: s('steady-spin', 'gentle organized rotation', 90, 'cw'),
    },
  },
  Venus: {
    shapeFamily: 'lotus', symmetry: 8, baseLayers: 3, defaultRotation: 'cw',
    states: {
      elevated: s('petal-bloom', 'petals open then soften on the exhale · gentle clearing', 120, 'cw'),
      depleted: s('petal-bloom', 'slow flower bloom · the heart field expands', 95, 'cw'),
      blocked:  s('petal-bloom', 'slow symmetrical opening', 105, 'cw'),
      balanced: s('petal-bloom', 'smooth pulsing expansion', 88, 'cw'),
    },
  },
  Mars: {
    shapeFamily: 'triangle', symmetry: 3, baseLayers: 3, defaultRotation: 'cw',
    states: {
      elevated: s('cool-contract', 'slow cooling contraction · heat dissolves into the field', 140, 'cw'),
      depleted: s('activate-pulse', 'steady activation pulse · slow forward movement', 95, 'cw'),
      blocked:  s('compress-release', 'compression-release · the triangle softens into a circle', 110, 'cw'),
      balanced: s('steady-spin', 'slow steady directional pulse', 90, 'cw'),
    },
  },
  Jupiter: {
    shapeFamily: 'expanding-rings', symmetry: 6, baseLayers: 4, defaultRotation: 'cw',
    states: {
      elevated: s('expand-contain', 'expansion slows · the containment ring holds the field', 130, 'cw'),
      depleted: s('expand-contain', 'gradual expansion · a slow spiral uplift', 95, 'cw'),
      blocked:  s('expand-contain', 'the field frees and expands at a steady pace', 105, 'cw'),
      balanced: s('steady-spin', 'slow expansion · the outer ring stabilises on the exhale', 90, 'cw'),
    },
  },
  Saturn: {
    shapeFamily: 'square-grid', symmetry: 4, baseLayers: 4, defaultRotation: 'cw',
    states: {
      elevated: s('grid-breathe', 'slow grid breathing · the boundary softens on the exhale', 150, 'cw'),
      depleted: s('grid-breathe', 'the grid forms slowly · stable square rotation', 110, 'cw'),
      blocked:  s('compress-release', 'compression and release · pressure eases outward', 120, 'cw'),
      balanced: s('steady-spin', 'stable square rotation', 100, 'cw'),
    },
  },
  Uranus: {
    shapeFamily: 'angular-star', symmetry: 8, baseLayers: 3, defaultRotation: 'ccw',
    states: {
      elevated: s('settle-current', 'slow downward settling current · angular lines smooth', 150, 'ccw'),
      depleted: s('spark-wake', 'gentle spark activation · light nodes wake slowly', 100, 'ccw'),
      blocked:  s('settle-current', 'circuit lines reconnect slowly', 115, 'ccw'),
      balanced: s('steady-spin', 'soft angular rotation', 95, 'ccw'),
    },
  },
  Neptune: {
    shapeFamily: 'wave-spiral', symmetry: 8, baseLayers: 4, defaultRotation: 'ccw',
    states: {
      elevated: s('ocean-drift', 'oceanic drift · boundary lines clarify slowly', 140, 'ccw'),
      depleted: s('ocean-drift', 'soft spiral wave · slow dissolve and reform', 105, 'ccw'),
      blocked:  s('ocean-drift', 'the veil clears · the spiral defines', 115, 'ccw'),
      balanced: s('steady-spin', 'slow oceanic drift', 95, 'ccw'),
    },
  },
  Pluto: {
    shapeFamily: 'vortex', symmetry: 6, baseLayers: 5, defaultRotation: 'ccw',
    states: {
      elevated: s('inward-spiral', 'very slow spiral · a contained transformation pulse', 160, 'ccw'),
      depleted: s('root-glow', 'slow empowering pulse · the root ring strengthens', 110, 'ccw'),
      blocked:  s('inward-spiral', 'the vortex opens gently · the root ring expands on the exhale', 125, 'ccw'),
      balanced: s('steady-spin', 'very slow contained spiral', 105, 'ccw'),
    },
  },
}

export function planetMandalaProfile(planet: string): PlanetMandalaProfile {
  return PLANET_MANDALA[planet] ?? PLANET_MANDALA.Sun
}
