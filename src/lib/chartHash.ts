/**
 * Stable chart hash (Directive v4.0 · Fix 1).
 *
 * sha256 over the determinism-relevant intake fields, with sorted-key
 * stringification so property order never changes the hash. Used to verify
 * that the same birth data + intake reproduces the same protocol.
 *
 * Server-only (node crypto) — imported by the /api/readings route.
 */

import { createHash } from 'crypto'

/** Stable JSON stringify (sorted keys) so hashing is order-independent. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}

export function computeChartHash(intake: Record<string, unknown>): string {
  const relevant = {
    birthDate:      intake.birthDate ?? '',
    birthTime:      intake.birthTime ?? '',
    birthLocation:  intake.birthLocation ?? '',
    symptoms:       intake.symptoms ?? [],
    emotionalState: intake.emotionalState ?? [],
    intention:      intake.intention ?? [],
    narrative:      intake.narrative ?? '',
  }
  return createHash('sha256').update(stableStringify(relevant)).digest('hex')
}
