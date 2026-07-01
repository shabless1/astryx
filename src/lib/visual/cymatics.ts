/**
 * ASTRYX — Cymatics math (ported from the approved proof sheet)
 * ════════════════════════════════════════════════════════════════════════════
 * Circular-membrane (water) model only. Same hardcoded Bessel-zero table, same
 * Bessel evaluation, same tuning constant K = 8.726 that produced 10 distinct,
 * collision-free modes in cymatics_proof.html. Frequencies come from the app's
 * canonical fork source (sacredTones via forkClass) — single source of truth.
 *
 *   u(r,θ) = J_m( λ_mn · r/a ) · cos(m·θ)
 *
 * Pure + deterministic. No app-engine dependency beyond the fork frequency.
 */

import { forkEntryFor } from '@/lib/forkClass'

export const CYMATIC_K = 8.726   // approved tuning (proof sheet: 10 distinct, 0 collisions)

// Hardcoded Bessel J_m zeros λ_mn (rows m=0..8, cols n=1..8) — known constants.
const BZ: number[][] = [
  [2.4048,5.5201,8.6537,11.7915,14.9309,18.0711,21.2116,24.3525],
  [3.8317,7.0156,10.1735,13.3237,16.4706,19.6159,22.7601,25.9037],
  [5.1356,8.4172,11.6198,14.7960,17.9598,21.1170,24.2701,27.4206],
  [6.3802,9.7610,13.0152,16.2235,19.4094,22.5827,25.7482,28.9084],
  [7.5883,11.0647,14.3725,17.6160,20.8269,24.0190,27.1991,30.3710],
  [8.7715,12.3386,15.7002,18.9801,22.2178,25.4303,28.6266,31.8117],
  [9.9361,13.5893,17.0038,20.3208,23.5861,26.8202,30.0337,33.2330],
  [11.0864,14.8213,18.2876,21.6415,24.9349,28.1912,31.4228,34.6371],
  [12.2251,16.0378,19.5545,22.9452,26.2668,29.5457,32.7958,36.0150],
]

export interface CymaticMode { m: number; n: number; eig: number }

const MODES: CymaticMode[] = (() => {
  const out: CymaticMode[] = []
  for (let m = 0; m <= 8; m++) for (let n = 1; n <= 8; n++) out.push({ m, n, eig: BZ[m][n - 1] })
  return out
})()

/** Bessel J_m(x) via the stable iterative power series. */
export function besselJ(m: number, x: number): number {
  if (x === 0) return m === 0 ? 1 : 0
  const xh = x / 2
  let term = 1
  for (let i = 1; i <= m; i++) term *= xh / i
  let sum = term
  const f = -xh * xh
  for (let k = 1; k <= 80; k++) {
    term *= f / (k * (k + m))
    sum += term
    if (Math.abs(term) < 1e-12 * Math.abs(sum)) break
  }
  return sum
}

/** Nearest eigenmode for a frequency, using the approved K tuning. */
export function modeForFrequency(freq: number): CymaticMode {
  let best = MODES[0], bd = Infinity
  for (const mode of MODES) {
    const d = Math.abs(freq - CYMATIC_K * mode.eig)
    if (d < bd) { bd = d; best = mode }
  }
  return best
}

// Fallback Cousto frequencies (only used if a fork entry is somehow missing).
const FALLBACK_HZ: Record<string, number> = {
  Sun: 126.22, Moon: 210.42, Mercury: 141.27, Venus: 221.23, Mars: 144.72,
  Jupiter: 183.58, Saturn: 147.85, Uranus: 207.36, Neptune: 211.44, Pluto: 140.25,
  Earth: 136.10, Silence: 136.10,
}

/** Canonical fork frequency for a chamber planet (Moon→'Full Moon', Earth/Silence→Om). */
export function frequencyForPlanet(planet: string): number {
  const entry = forkEntryFor(planet)
  const hz = entry ? parseFloat(String(entry.hz)) : NaN
  if (Number.isFinite(hz)) return hz
  return FALLBACK_HZ[planet] ?? FALLBACK_HZ.Earth
}

export function modeForPlanet(planet: string): CymaticMode {
  return modeForFrequency(frequencyForPlanet(planet))
}

/** Membrane displacement u(r,θ) for a mode; rNorm = r/a ∈ [0,1]. */
export function membraneHeight(mode: CymaticMode, rNorm: number, theta: number): number {
  return besselJ(mode.m, mode.eig * rNorm) * Math.cos(mode.m * theta)
}

/** The J_m zero table row (read-only) — used to place nodal rings. */
export function besselZeros(m: number): number[] {
  return BZ[Math.max(0, Math.min(8, m))]
}

/**
 * The analytic nodal figure for a circular mode — the EXACT cymatic pattern the
 * proof sheet draws as glowing lines:
 *   • diameters: the m angular nodes of cos(mθ)=0  → 2m radial lines (none if m=0)
 *   • rings:     the radial nodes where J_m(eig·r/a)=0 → the n−1 interior circles
 * Returns normalized geometry (rNorm ∈ (0,1), angles in radians).
 */
export function nodalFigure(mode: CymaticMode): { diameters: number[]; rings: number[] } {
  const diameters: number[] = []
  if (mode.m > 0) {
    for (let j = 0; j < 2 * mode.m; j++) diameters.push((Math.PI / 2 + j * Math.PI) / mode.m)
  }
  const rings: number[] = []
  const zeros = besselZeros(mode.m)
  for (let j = 0; j < zeros.length; j++) {
    const rNorm = zeros[j] / mode.eig
    if (rNorm > 0.001 && rNorm < 0.999) rings.push(rNorm)
  }
  return { diameters, rings }
}
