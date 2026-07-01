/**
 * ASTRYX — Planet → Sacred Geometry Map (Phase 3C)
 *
 * Each planet's geometry recipe: base sacred-geometry patterns + Platonic solid
 * overlay(s) + optional orbital-resonance rosette fold + a one-line feeling.
 * Colours come from the corrective colour library (signal-state correct).
 */

import type { SacredBaseName } from './sacredGeometryBaseLibrary'
import type { SolidName } from './solid3DLibrary'

export interface PlanetGeometry {
  bases: SacredBaseName[]
  platonics: SolidName[]
  /** rosette petal fold when a base uses orbitalRosette (Venus → 5). */
  rosettePetals?: number
  feeling: string
}

export const PLANET_SACRED_GEOMETRY: Record<string, PlanetGeometry> = {
  Sun: {
    // SHA 2026-06-21 — Sun = Sphere (source of all form) + Golden Spiral (phi).
    bases: ['seedOfLife', 'torusField'],
    platonics: ['sphere', 'goldenSpiral'],
    feeling: 'Solar temple — golden life-force centre, radiant but soft',
  },
  Moon: {
    // SHA 2026-06-21 — Moon = Vesica Piscis (cosmic womb) + Crescent.
    bases: ['seedOfLife', 'flowerOfLife'],
    platonics: ['vesicaPiscis', 'crescent'],
    feeling: 'Lunar water chamber — pearl & silver emotional field, soft tidal breath',
  },
  Mercury: {
    bases: ['metatronsCube', 'orbitalRosette'],
    platonics: ['octahedron'],
    rosettePetals: 6,
    feeling: 'Living intelligence grid — holographic neural pattern',
  },
  Venus: {
    bases: ['flowerOfLife', 'orbitalRosette'],
    platonics: ['octahedron'],
    rosettePetals: 5,
    feeling: 'Rose-emerald lotus portal — heart harmonic field',
  },
  Mars: {
    // SHA 2026-06-21 — Mars = Dodecahedron (Ether / cosmic blueprint): will carving action out of structure.
    bases: ['triangleField'],
    platonics: ['dodecahedron'],
    feeling: 'Warrior shield field — contained force, cooled when overactivated',
  },
  Jupiter: {
    // SHA 2026-06-21 — Jupiter = Tetrahedron (Fire): expansion, the spark of growth/wisdom.
    bases: ['orbitalRosette', 'spiralVortex'],
    platonics: ['tetrahedron'],
    rosettePetals: 6,
    feeling: 'Cosmic expansion chamber — gold-violet wisdom field, large but contained',
  },
  Saturn: {
    bases: ['metatronsCube'],
    platonics: ['cube'],
    feeling: 'Crystalline architecture — sacred structural blueprint',
  },
  Uranus: {
    // SHA 2026-06-21 — Uranus = Cuboctahedron (Vector Equilibrium): perfect balance, unmanifest potential.
    bases: ['metatronsCube', 'orbitalRosette'],
    platonics: ['cuboctahedron'],
    rosettePetals: 8,
    feeling: 'Electric star map — stabilised lightning, future intelligence grid',
  },
  Neptune: {
    // SHA 2026-06-21 — Neptune = Torus / Flower of Life matrix: dissolution, continuous flow, oneness.
    bases: ['flowerOfLife', 'spiralVortex'],
    platonics: ['torus'],
    feeling: 'Oceanic dream lens — lavender seafoam portal, mist becoming pattern',
  },
  Pluto: {
    // SHA 2026-06-21 — Pluto = Stellated Dodecahedron + Tesseract (4D): transmutation, multi-dimensional hidden power.
    bases: ['spiralVortex', 'triangleField'],
    platonics: ['stellatedDodecahedron', 'tesseract'],
    feeling: 'Deep transformation chamber — violet-black-gold containment, slow rebirth',
  },
}

export function planetGeometry(planet: string): PlanetGeometry {
  return PLANET_SACRED_GEOMETRY[planet] ?? PLANET_SACRED_GEOMETRY.Sun
}
