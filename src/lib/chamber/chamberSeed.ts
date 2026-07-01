/**
 * ASTRYX Chamber — Deterministic Seed System
 *
 * The root of every chamber. Same birth data → same hash → same PRNG sequence
 * → same chamber forever. Name is intentionally excluded (people change names,
 * enter them inconsistently). Birth data is the stable astronomical fact.
 *
 * Hash:  FNV-1a 32-bit (small, fast, well-distributed)
 * PRNG:  mulberry32 (state-of-the-art 32-bit, passes basic statistical tests)
 *
 * Usage:
 *   const seed = hashChamberSeed({ birthDate, birthTime, lat, lon })
 *   const rng = createPRNG(seed)
 *   rng() → 0..1, deterministic for the lifetime of this PRNG instance
 */

export interface ChamberSeedInput {
  birthDate?: string       // ISO 'YYYY-MM-DD'
  birthTime?: string       // 'HH:MM'  (empty/unknown handled deterministically)
  birthLatitude?: number
  birthLongitude?: number
}

/**
 * FNV-1a 32-bit hash. Deterministic, no external state.
 */
export function hashChamberSeed(input: ChamberSeedInput): number {
  // Normalize each field. Empty/unknown → consistent placeholder so two
  // people with the same date / no time both produce the same seed
  // (their chamber will diverge later via sign placement, not this seed).
  const fields = [
    (input.birthDate    ?? '0000-00-00').trim(),
    (input.birthTime    ?? '00:00'     ).trim(),
    (input.birthLatitude  ?? 0).toFixed(4),
    (input.birthLongitude ?? 0).toFixed(4),
  ]
  const str = fields.join('|')

  // FNV-1a 32-bit
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * mulberry32 PRNG. Returns a function that yields 0..1 deterministically.
 * Same seed → same sequence, forever.
 */
export function createPRNG(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Convenience: pick one element from an array deterministically.
 */
export function seededPick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]
}

/**
 * Convenience: deterministic integer in [min, max] inclusive.
 */
export function seededInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

/**
 * Convenience: deterministic float in [min, max).
 */
export function seededFloat(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min
}

/**
 * Re-derive the seed in human-readable form for debugging + provenance trails.
 * Format: "ASTRYX-CH-XXXXXXXX" (8 hex chars).
 */
export function formatChamberSignature(seed: number): string {
  return `ASTRYX-CH-${seed.toString(16).toUpperCase().padStart(8, '0')}`
}
