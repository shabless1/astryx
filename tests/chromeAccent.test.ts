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
  CHROME_PALETTES, PALETTE_ORDER, DEFAULT_PALETTE_ID, CHROME_DEFAULT,
  resolveChromeAccent, resolveChromeRoom, chromeStateFor,
  isRedBand, hexToHsl, assertChromeSafe, allChromeHexes, isStale, STALE_FLOOR,
  paletteHueFamilies, assertPaletteRange, MIN_HUE_FAMILIES, hueDistance,
} from '@/lib/visual/chromeAccent'
import { getAccentColor, HOUSE_ACCENT, PLANET_COLORS } from '@/lib/engineClient'
const DEFAULT_ROOMS = CHROME_PALETTES[DEFAULT_PALETTE_ID].rooms
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
      const room = DEFAULT_ROOMS[state]
      expect(isRedBand(room.hex), `${state} = ${room.hex} (${room.name}) is red`).toBe(false)
    }
  })

  it('SHA\'s named constraint: a DEPLETED day is never hot, blood or crimson red', () => {
    const depleted = DEFAULT_ROOMS.depleted
    expect(isRedBand(depleted.hex)).toBe(false)
    const { h } = hexToHsl(depleted.hex)
    // Comfortably on the amber-gold side of the band edge (28°), not near it.
    expect(h).toBeGreaterThan(32)
    expect(h).toBeLessThan(60)
  })

  it('elevated cools and depleted warms — the shift runs the right way', () => {
    const cool = hexToHsl(DEFAULT_ROOMS.elevated.hex)
    const warm = hexToHsl(DEFAULT_ROOMS.depleted.hex)
    // A cool hue sits in the blue-green half of the circle; a warm one does not.
    expect(cool.h).toBeGreaterThan(90)
    expect(warm.h).toBeLessThan(90)
  })

  it('the room at rest is the house colour', () => {
    expect(CHROME_DEFAULT).toBe(DEFAULT_ROOMS.balanced)
    expect(HOUSE_ACCENT).toBe(DEFAULT_ROOMS.balanced.hex)
  })
})

// ─── THE SECOND LAW — no room may be stale ───────────────────────────────────
// SHA, 2026-09-12: "you either kill me with red or deplete me with stale
// colors." The first chrome ladder passed every red test and was still wrong,
// because it was built out of avoidance and came back beige. Avoiding red is
// half the law. These tests are the other half.
describe('no room is stale', () => {
  it('every room in every palette carries real chroma', () => {
    for (const id of PALETTE_ORDER) {
      const p = CHROME_PALETTES[id]
      for (const state of STATES) {
        const room = p.rooms[state]
        const { s } = hexToHsl(room.hex)
        expect(isStale(room.hex), `${id}.${state} ${room.name} ${room.hex} is washed out (s=${s.toFixed(2)})`).toBe(false)
        expect(s).toBeGreaterThanOrEqual(STALE_FLOOR.minSaturation)
      }
    }
  })

  // The exact ladder SHA rejected, kept as the regression fixture.
  const REJECTED = {
    balanced: '#C9A961', // House Gold   h 42
    depleted: '#CFA65C', // Warm Amber   h 39
    blocked:  '#B3A891', // Dry Stone    h 41
    elevated: '#8FA9A6', // Cooled Stone h 173
  }

  it('the drained values in the rejected ladder are caught per colour', () => {
    expect(isStale(REJECTED.elevated)).toBe(true)   // s 0.13
    expect(isStale(REJECTED.blocked)).toBe(true)    // s 0.18
  })

  it('its two golds are NOT caught per colour — which is why range is the real law', () => {
    // Honest: #C9A961 sits at s 0.49 and is a perfectly decent antique gold in
    // isolation. No per-colour floor separates it from a palette SHA loved
    // (Lilac Release is LOWER in chroma). The ladder is what failed, not the hex.
    expect(isStale(REJECTED.balanced)).toBe(false)
    expect(isStale(REJECTED.depleted)).toBe(false)
  })

  it('the rejected ladder fails the RANGE law — three of four rooms shared a hue', () => {
    const hexes = Object.values(REJECTED)
    expect(paletteHueFamilies(hexes)).toBeLessThan(MIN_HUE_FAMILIES)
    expect(() => assertPaletteRange(hexes, 'rejected ladder')).toThrow(/hue famil/)
    // The three golds really were within a few degrees of one another.
    const h = (x: string) => hexToHsl(x).h
    expect(hueDistance(h(REJECTED.balanced), h(REJECTED.depleted))).toBeLessThan(6)
    expect(hueDistance(h(REJECTED.balanced), h(REJECTED.blocked))).toBeLessThan(6)
  })

  it('every shipped palette has range', () => {
    for (const id of PALETTE_ORDER) {
      const hexes = STATES.map((s) => CHROME_PALETTES[id].rooms[s].hex)
      expect(paletteHueFamilies(hexes), `${id} needs ${MIN_HUE_FAMILIES}+ hue families`)
        .toBeGreaterThanOrEqual(MIN_HUE_FAMILIES)
      expect(() => assertPaletteRange(hexes, id)).not.toThrow()
    }
  })

  it('every room reads on deep space — never too dark, never blown out', () => {
    for (const id of PALETTE_ORDER) {
      for (const state of STATES) {
        const { l } = hexToHsl(CHROME_PALETTES[id].rooms[state].hex)
        expect(l, `${id}.${state} lightness`).toBeGreaterThan(0.28)
        expect(l, `${id}.${state} lightness`).toBeLessThan(0.84)
      }
    }
  })
})

// ─── every palette obeys the law, not just the default ───────────────────────
describe('all five palettes', () => {
  it('the roster is complete and ordered', () => {
    expect(PALETTE_ORDER).toHaveLength(5)
    expect(new Set(PALETTE_ORDER).size).toBe(5)
    for (const id of PALETTE_ORDER) expect(CHROME_PALETTES[id]?.id).toBe(id)
    expect(PALETTE_ORDER).toContain(DEFAULT_PALETTE_ID)
  })

  it('no palette can put a red anywhere', () => {
    for (const hex of allChromeHexes()) expect(isRedBand(hex), `${hex}`).toBe(false)
  })

  it('every palette cools when elevated and warms when depleted', () => {
    for (const id of PALETTE_ORDER) {
      const p = CHROME_PALETTES[id]
      expect(hexToHsl(p.rooms.elevated.hex).h, `${id} elevated should be cool`).toBeGreaterThan(90)
      expect(hexToHsl(p.rooms.depleted.hex).h, `${id} depleted should be warm`).toBeLessThan(90)
      expect(p.rooms.elevated.temperature).toBe('cool')
      expect(p.rooms.depleted.temperature).toBe('warm')
    }
  })

  it('every palette resolves all 40 planet-states safely', () => {
    for (const id of PALETTE_ORDER) {
      for (const planet of Object.keys(PLANET_COLOR_THERAPY)) {
        for (const state of STATES) {
          const hex = getAccentColor(reading(planet, engineWord(state)), id)
          expect(isRedBand(hex), `${id} · ${planet} · ${state} → ${hex}`).toBe(false)
          expect(isStale(hex), `${id} · ${planet} · ${state} → ${hex}`).toBe(false)
        }
      }
    }
  })

  it('a palette changes the finish but never the reading', () => {
    // Same state → same ROOM SLOT in every palette; different palette → different
    // colour. The state is what the colour means; the palette is what it is made of.
    for (const state of STATES) {
      const hexes = PALETTE_ORDER.map((id) => getAccentColor(reading('Mars', engineWord(state)), id))
      expect(new Set(hexes).size, `${state} should differ across palettes`).toBeGreaterThan(1)
    }
    for (const id of PALETTE_ORDER) {
      expect(getAccentColor(reading('Mars', 'excess'), id))
        .toBe(getAccentColor(reading('Neptune', 'excess'), id))
    }
  })

  it('an unknown or missing palette id falls back to the default', () => {
    const fallback = CHROME_PALETTES[DEFAULT_PALETTE_ID].rooms.balanced.hex
    expect(getAccentColor(null, 'not-a-palette')).toBe(fallback)
    expect(getAccentColor(null, null)).toBe(fallback)
    expect(getAccentColor(null)).toBe(fallback)
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
    const chrome = new Set(allChromeHexes().map((h) => h.toLowerCase()))
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
