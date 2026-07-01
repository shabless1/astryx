/**
 * ASTRYX — Intention → Fork Map  (Directive J.5 · 2026-06-28)
 * ════════════════════════════════════════════════════════════════════════════
 * The user's stated intention (the 12 INTENTION_CHIPS at intake, or the open
 * `intentionText`) must be able to surface its OWN planetary fork in the
 * recalibration. Before this, intention only re-ordered the regulator pool, so an
 * *activating* intention (e.g. Abundance → Jupiter) could never appear. The
 * composer (composeSessionForks, J.6) now guarantees the intention fork a slot.
 *
 * The map below is the SHA-approved 2026-06-28 chip→planet lock-in. Keyed to the
 * exact INTENTION_CHIPS strings in IntakeScreen.tsx — keep them in sync.
 *
 * Deterministic. No Math.random. Never invents an intention (returns null when
 * nothing matches), so a phantom fork can never be injected.
 */

import { parseIntention } from '@/lib/NarrativeSignalParser'

/** The exact 12 intake chips → the planet whose fork carries that intention. */
export const INTENTION_TO_PLANET: Record<string, string> = {
  Clarity: 'Mercury',
  Peace: 'Moon',
  Energy: 'Sun',
  Healing: 'Neptune',
  Strength: 'Mars',
  'Emotional balance': 'Moon',
  Abundance: 'Jupiter',
  Transformation: 'Pluto',
  'Spiritual connection': 'Neptune',
  Grounding: 'Saturn',
  Love: 'Venus',
  Focus: 'Mercury',
}

/**
 * Resolve the user's intention to a single planet (the fork the session will
 * guarantee). Priority:
 *   1. The FIRST matching selected chip, in the user's selection order
 *      (deterministic — chip order is the user's own).
 *   2. If no chip matches, keyword-match the open `intentionText` against the
 *      existing NarrativeSignalParser intention table (its first support planet).
 *   3. Otherwise null — never invent an intention fork.
 */
export function intentionPlanet(
  intentionChips?: string[],
  intentionText?: string,
): string | null {
  for (const chip of intentionChips ?? []) {
    const planet = INTENTION_TO_PLANET[chip]
    if (planet) return planet
  }
  if (intentionText && intentionText.trim()) {
    const parsed = parseIntention(undefined, intentionText)
    if (parsed.supportPlanets.length) return parsed.supportPlanets[0]
  }
  return null
}
