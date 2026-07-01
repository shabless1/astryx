/**
 * ASTRYX — Fork classes + two-address model  (Directive v2.0 · FIX F)
 * ════════════════════════════════════════════════════════════════════════════
 * The same 12 forks serve TWO kinds of work, kept DISTINCT:
 *   • CHAKRA work      — the 7 chakra forks form the Root→Crown ladder/sweep.
 *   • CALIBRATION work — ALL 12 forks place on the body ZONE the planet rules.
 *
 * A chakra fork carries TWO addresses (chakra + body zone). An Extended fork
 * carries ONE (body zone only) — no chakra, by design.
 *
 * Single source of truth = `sacredTones_nervousSystem.json` (the corrected v2
 * chakra map). This module just classifies; body-zone homes live in
 * `BodyPlacementEngine` (which already owns the sign/planet rulership canon).
 */

import sacredTones from '@/data/sacredTones_nervousSystem.json'
import type { SacredFork } from '@/types'

const FORKS = sacredTones as SacredFork[]

// Map a scoring/engine planet name to its stored fork entry (Moon → 'Full Moon').
export function forkEntryFor(planet: string): SacredFork | undefined {
  const name = planet === 'Moon' ? 'Full Moon' : planet
  return FORKS.find((f) => f.planet === name)
}

/** The chakra ADDRESS for a chakra fork; null for the 5 Extended forks. */
export function chakraAddressFor(planet: string): string | null {
  const f = forkEntryFor(planet)
  if (!f || f.chakra === 'Extended') return null
  return f.chakra
}

export function isChakraFork(planet: string): boolean {
  return chakraAddressFor(planet) !== null
}

/** The 7 chakra forks (planet names, Moon not 'Full Moon'), in Root→Crown order. */
const CHAKRA_ORDER = ['Root', 'Sacral', 'Solar Plexus', 'Heart', 'Throat', 'Third Eye', 'Crown']
export const CHAKRA_FORKS: string[] = FORKS
  .filter((f) => f.chakra !== 'Extended')
  .sort((a, b) => CHAKRA_ORDER.indexOf(a.chakra) - CHAKRA_ORDER.indexOf(b.chakra))
  .map((f) => (f.planet === 'Full Moon' ? 'Moon' : f.planet))

/** The 5 Extended forks (body-zone only, no chakra). */
export const EXTENDED_FORKS: string[] = FORKS
  .filter((f) => f.chakra === 'Extended')
  .map((f) => (f.planet === 'Full Moon' ? 'Moon' : f.planet))

/** The labeled Solfeggio FALLBACK tone for a chakra fork (FIX E); null otherwise. */
export function solfeggioFallbackFor(planet: string): number | null {
  return forkEntryFor(planet)?.solfeggioFallback ?? null
}
