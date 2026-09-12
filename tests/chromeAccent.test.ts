/**
 * THE CHROME LAW, enforced.
 * ════════════════════════════════════════════════════════════════════════════
 * SHA's ruling, 2026-09-12 (model C): chrome warms or cools by the carrier's
 * STATE only, never by the planet's identity — and a depleted day is NEVER a
 * hot, blood or crimson red.
 *
 * The original failure was not one bad hex. It was that nothing stopped one:
 * chrome read `PLANET_COLORS[dominant]`, the planet's raw identity hue, and the
 * app rendered the exact colour its own therapy library lists under `avoid`.
 * These tests are the thing that stops one.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CHROME_BY_STATE, CHROME_DEFAULT, resolveChromeAccent, resolveChromeRoom,
  chromeStateFor, isRedBand, hexToHsl, assertChromeSafe,
} from '@/lib/visual/chromeAccent'
import { getAccentColor, HOUSE_ACCENT, PLANET_COLORS } from '@/lib/engineClient'
import { PLANET_COLOR_THERAPY } from '@/lib/visual/planetColorTherapyLibrary'
import type { ProtocolOutput } from '@/types'

const STATES = ['elevated', 'depleted', 'blocked', 'balanced'] as const
const reading = (planet: string, state: string) =>
  ({ signalHierarchy: { primary: { planet, state, role: 'surface' } } } as unknown as ProtocolOutput)

// ─── the red-band detector itself ────────────────────────────────────────────
describe('the red band is detected', () => {
  it('catches the hues that caused this', () => {
    // The two base identity hues that painted the app.
    expect(isRedBand('#C5283D')).toBe(true)   // Mars base — Crimson
    expect(isRedBand('#6E1F36')).toBe(true)   // Pluto base — Burgundy
    // The corrective picks that would still have been red under model A.
    expect(isRedBand('#E0673A')).toBe(true)   // Mars depleted — Warm Red-Orange
    expect(isRedBand('#D24238')).toBe(true)   // Mars balanced — Warm Red
    expect(isRedBand('#CF5B5B')).toBe(true)   // Mars blocked  — Soft Red
    expect(isRedBand('#5E1B30')).toBe(true)   // Pluto depleted — Deep Burgundy
    // The retired vermilion.
    expect(isRedBand('#E8453C')).toBe(true)
  })

  it('does not catch warm stone, amber or gold — the room is allowed to be warm', () => {
    for (const hex of ['#C9A961', '#CFA65C', '#B3A891', '#8FA9A6', '#DDD7CA', '#8A8378']) {
      expect(isRedBand(hex), `${hex} should be chrome-safe`).toBe(false)
    }
  })

  it('reads hue and saturation correctly', () => {
    const { h, s, l } = hexToHsl('#C9A961')
    expect(h).toBeGreaterThan(35); expect(h).toBeLessThan(50)
    expect(s).toBeGreaterThan(0.3); expect(l).toBeGreaterThan(0.4)
  })

  it('assertChromeSafe throws on a red-band value and passes a safe one', () => {
    expect(() => assertChromeSafe('#C5283D', 'test')).toThrow(/red band/)
    expect(assertChromeSafe('#C9A961', 'test')).toBe('#C9A961')
  })
})

// ─── the four rooms ──────────────────────────────────────────────────────────
describe('the four rooms', () => {
  it('every chrome value is outside the red band', () => {
    for (const state of STATES) {
      const room = CHROME_BY_STATE[state]
      expect(isRedBand(room.hex), `${state} = ${room.hex} (${room.name}) is red`).toBe(false)
    }
  })

  it('SHA\'s named constraint: a DEPLETED day is never hot, blood or crimson red', () => {
    const depleted = CHROME_BY_STATE.depleted
    expect(isRedBand(depleted.hex)).toBe(false)
    const { h } = hexToHsl(depleted.hex)
    // Comfortably on the amber-gold side of the band edge (28°), not near it.
    expect(h).toBeGreaterThan(32)
    expect(h).toBeLessThan(60)
  })

  it('elevated cools and depleted warms — the shift runs the right way', () => {
    const cool = hexToHsl(CHROME_BY_STATE.elevated.hex)
    const warm = hexToHsl(CHROME_BY_STATE.depleted.hex)
    // A cool hue sits in the blue-green half of the circle; a warm one does not.
    expect(cool.h).toBeGreaterThan(90)
    expect(warm.h).toBeLessThan(90)
  })

  it('no room shouts — every value stays inside the chrome envelope', () => {
    for (const state of STATES) {
      const { s, l } = hexToHsl(CHROME_BY_STATE[state].hex)
      expect(s, `${state} saturation`).toBeLessThanOrEqual(0.55)
      expect(l, `${state} lightness`).toBeGreaterThan(0.40)
      expect(l, `${state} lightness`).toBeLessThan(0.80)
    }
  })

  it('the room at rest is the house colour', () => {
    expect(CHROME_DEFAULT).toBe(CHROME_BY_STATE.balanced)
    expect(HOUSE_ACCENT).toBe(CHROME_BY_STATE.balanced.hex)
  })
})

// ─── model C: state only, never planet identity ──────────────────────────────
describe('chrome answers the state, never the planet', () => {
  it('the same state gives the same room for every planet', () => {
    for (const state of STATES) {
      const hexes = new Set(
        Object.keys(PLANET_COLOR_THERAPY).map((p) => getAccentColor(reading(p, engineWord(state))))
      )
      expect(hexes.size, `${state} should give one room, got ${[...hexes]}`).toBe(1)
    }
  })

  it('a Mars day and a Neptune day in the same state are indistinguishable', () => {
    expect(getAccentColor(reading('Mars', 'excess'))).toBe(getAccentColor(reading('Neptune', 'excess')))
    expect(getAccentColor(reading('Pluto', 'deficiency'))).toBe(getAccentColor(reading('Moon', 'deficiency')))
  })

  it('no planet\'s identity hue can ever be the chrome colour', () => {
    const chrome = new Set(STATES.map((s) => CHROME_BY_STATE[s].hex.toLowerCase()))
    for (const [planet, hex] of Object.entries(PLANET_COLORS)) {
      expect(chrome.has(hex.toLowerCase()), `${planet}'s identity hue leaked into chrome`).toBe(false)
    }
    for (const [planet, prof] of Object.entries(PLANET_COLOR_THERAPY)) {
      for (const hex of prof.base) {
        expect(chrome.has(hex.toLowerCase()), `${planet}'s base palette leaked into chrome`).toBe(false)
      }
    }
  })

  it('every one of the 40 planet-states resolves to a safe room', () => {
    for (const planet of Object.keys(PLANET_COLOR_THERAPY)) {
      for (const state of STATES) {
        const hex = getAccentColor(reading(planet, engineWord(state)))
        expect(isRedBand(hex), `${planet} · ${state} → ${hex}`).toBe(false)
        expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    }
  })

  it('maps engine state words to the right room', () => {
    expect(chromeStateFor(reading('Mars', 'excess'))).toBe('elevated')
    expect(chromeStateFor(reading('Mars', 'deficiency'))).toBe('depleted')
    expect(chromeStateFor(reading('Mars', 'blocked'))).toBe('blocked')
    expect(chromeStateFor(reading('Mars', 'balanced'))).toBe('balanced')
    expect(resolveChromeRoom(reading('Mars', 'excess')).temperature).toBe('cool')
    expect(resolveChromeRoom(reading('Mars', 'deficiency')).temperature).toBe('warm')
  })

  it('falls back to the room at rest with no reading at all', () => {
    expect(resolveChromeAccent(null)).toBe(CHROME_DEFAULT.hex)
    expect(resolveChromeAccent(undefined)).toBe(CHROME_DEFAULT.hex)
    expect(getAccentColor({} as ProtocolOutput)).toBe(CHROME_DEFAULT.hex)
  })
})

// ─── the mechanism, not just the values ──────────────────────────────────────
describe('the mechanism that caused this cannot come back', () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

  it('getAccentColor does not read PLANET_COLORS', () => {
    const src = read('src/lib/engineClient.ts')
    const fn = src.slice(src.indexOf('export function getAccentColor'))
      .slice(0, src.slice(src.indexOf('export function getAccentColor')).indexOf('\n}') + 2)
    expect(fn).not.toMatch(/PLANET_COLORS/)
    expect(fn).toMatch(/resolveChromeAccent/)
  })

  it('the page background is not reconnected to the dominant planet', () => {
    const src = read('src/components/layout/CosmicBackground.tsx')
    // The per-planet table may exist for the record, but must not be indexed
    // by dominantPlanet to build the atmosphere that paints the viewport.
    expect(src).not.toMatch(/PLANET_ATMOSPHERE\s*\[/)
    expect(src).toMatch(/ATMOSPHERE_BY_TEMPERATURE\[room\.temperature\]/)
  })

  it('the chamber step card does not take the fork\'s own colour', () => {
    const src = read('src/components/screens/SessionScreen.tsx')
    expect(src).not.toMatch(/accentColor=\{fork\.color\}/)
  })

  it('the retired vermilion is gone from src', () => {
    const hits: string[] = []
    for (const f of listSources('src')) {
      if (/#E8453C/i.test(readFileSync(f, 'utf-8'))) hits.push(f)
    }
    expect(hits, `#E8453C still present in ${hits.join(', ')}`).toHaveLength(0)
  })
})

// ── helpers ──────────────────────────────────────────────────────────────────
function engineWord(display: (typeof STATES)[number]): string {
  return { elevated: 'excess', depleted: 'deficiency', blocked: 'blocked', balanced: 'balanced' }[display]
}

function listSources(dir: string): string[] {
  const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs')
  const out: string[] = []
  for (const entry of readdirSync(join(process.cwd(), dir))) {
    const rel = `${dir}/${entry}`
    const abs = join(process.cwd(), rel)
    if (statSync(abs).isDirectory()) out.push(...listSources(rel))
    else if (/\.(ts|tsx|css)$/.test(entry)) out.push(abs)
  }
  return out
}
