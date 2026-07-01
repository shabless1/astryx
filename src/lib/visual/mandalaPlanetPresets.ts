/**
 * ASTRYX — Kaleidoscope Mandala Planet Presets (Phase 3B)
 *
 * Each planet's shape language, fold symmetry, layer roles, and particle style —
 * driving both the WebGL shader (shaderMode + symmetry) and the SVG fallback
 * (shapeFamily + layers). Colors come from the corrective color library so the
 * mandala is always signal-state correct.
 */

import type { ShapeFamily } from './planetMandalaLibrary'

// Shader geometry mode — how the fragment shader folds the field.
export type ShaderMode = 0 | 1 | 2 | 3 | 4
// 0 rings · 1 petals/lotus · 2 angular/star · 3 spiral/vortex · 4 grid/architecture

export interface MandalaPreset {
  shapeFamily: ShapeFamily
  shaderMode: ShaderMode
  symmetryCount: number      // radial folds (kaleidoscope)
  baseLayers: number         // concentric geometry rings (SVG)
  rotatePrimaryDir: 'cw' | 'ccw'
  particleCount: number
  shapeLabel: string
  layers: { core: string; inner: string; middle: string; outer: string; glow: string }
}

export const MANDALA_PRESETS: Record<string, MandalaPreset> = {
  Sun: {
    shapeFamily: 'solar-rings', shaderMode: 0, symmetryCount: 12, baseLayers: 5,
    rotatePrimaryDir: 'cw', particleCount: 14, shapeLabel: 'Solar Kaleidoscope',
    layers: { core: 'gold orb', inner: 'twelve-point soft star', middle: 'concentric solar rings', outer: 'radial sun rays', glow: 'warm amber halo' },
  },
  Moon: {
    shapeFamily: 'crescent', shaderMode: 0, symmetryCount: 8, baseLayers: 5,
    rotatePrimaryDir: 'ccw', particleCount: 12, shapeLabel: 'Lunar Water Kaleidoscope',
    layers: { core: 'pearl orb', inner: 'mirrored crescent arcs', middle: 'water ripple circles', outer: 'soft moon halo rings', glow: 'silver-blue mist' },
  },
  Mercury: {
    shapeFamily: 'hex-lattice', shaderMode: 2, symmetryCount: 6, baseLayers: 4,
    rotatePrimaryDir: 'cw', particleCount: 18, shapeLabel: 'Circuit Kaleidoscope',
    layers: { core: 'cyan node', inner: 'hexagon ring', middle: 'mirrored circuit pathways', outer: 'fine silver lattice', glow: 'blue-white node shimmer' },
  },
  Venus: {
    shapeFamily: 'lotus', shaderMode: 1, symmetryCount: 8, baseLayers: 4,
    rotatePrimaryDir: 'cw', particleCount: 14, shapeLabel: 'Lotus Kaleidoscope',
    layers: { core: 'rose-gold orb', inner: 'small lotus petals', middle: 'larger mirrored lotus petals', outer: 'flower of life ring', glow: 'emerald and rose halo' },
  },
  Mars: {
    shapeFamily: 'triangle', shaderMode: 2, symmetryCount: 6, baseLayers: 4,
    rotatePrimaryDir: 'cw', particleCount: 10, shapeLabel: 'Shield Kaleidoscope',
    layers: { core: 'state-based core orb', inner: 'triangle', middle: 'diamond shield', outer: 'directional line ring', glow: 'state-based cooling or activation field' },
  },
  Jupiter: {
    shapeFamily: 'expanding-rings', shaderMode: 3, symmetryCount: 6, baseLayers: 5,
    rotatePrimaryDir: 'cw', particleCount: 12, shapeLabel: 'Expansion Kaleidoscope',
    layers: { core: 'gold-violet orb', inner: 'spiral ring', middle: 'broad arc pattern', outer: 'large containment circle', glow: 'royal blue and muted gold' },
  },
  Saturn: {
    shapeFamily: 'square-grid', shaderMode: 4, symmetryCount: 4, baseLayers: 5,
    rotatePrimaryDir: 'cw', particleCount: 8, shapeLabel: 'Crystalline Architecture',
    layers: { core: 'bone-white point', inner: 'small square', middle: 'cube lattice', outer: 'ringed boundary', glow: 'muted gold on slate depth' },
  },
  Uranus: {
    shapeFamily: 'angular-star', shaderMode: 2, symmetryCount: 8, baseLayers: 4,
    rotatePrimaryDir: 'ccw', particleCount: 16, shapeLabel: 'Electric Star Kaleidoscope',
    layers: { core: 'teal-blue point', inner: 'angular star', middle: 'mirrored circuit branches', outer: 'irregular symmetrical star grid', glow: 'deep blue and muted gold' },
  },
  Neptune: {
    shapeFamily: 'wave-spiral', shaderMode: 3, symmetryCount: 8, baseLayers: 5,
    rotatePrimaryDir: 'ccw', particleCount: 14, shapeLabel: 'Ocean Veil Kaleidoscope',
    layers: { core: 'seafoam orb', inner: 'wave spiral', middle: 'veil rings', outer: 'blurred petal wave', glow: 'lavender ocean mist' },
  },
  Pluto: {
    shapeFamily: 'vortex', shaderMode: 3, symmetryCount: 6, baseLayers: 6,
    rotatePrimaryDir: 'ccw', particleCount: 12, shapeLabel: 'Transformation Vortex',
    layers: { core: 'deep violet orb', inner: 'slow spiral', middle: 'root-like branching geometry', outer: 'concentric underworld rings', glow: 'black-blue with soft gold containment' },
  },
}

export function mandalaPreset(planet: string): MandalaPreset {
  return MANDALA_PRESETS[planet] ?? MANDALA_PRESETS.Sun
}
