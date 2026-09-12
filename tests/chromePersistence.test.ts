/**
 * CHROME PERSISTENCE — the trap that made three fixes invisible.
 * ════════════════════════════════════════════════════════════════════════════
 * `accentColor` used to sit in the zustand persist whitelist. zustand merges
 * the saved blob OVER the defaults, so a browser that had once stored a
 * per-planet base hue (Mars Crimson, Pluto Burgundy) replayed it on every
 * load, before any runtime override could run. Clearing the browser cache does
 * not clear localStorage, so three separate chrome fixes shipped clean and
 * still rendered red on SHA's own device.
 *
 * These tests read the store source directly. A unit test that imports the
 * store would exercise a fresh in-memory instance and prove nothing about what
 * a returning browser does — the bug lives in the persist CONFIG, so that is
 * what gets asserted.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = readFileSync(join(process.cwd(), 'src/lib/store.ts'), 'utf-8')

/** The `partialize: (state) => ({ ... })` body — the persist whitelist. */
function partializeBody(): string {
  const start = SRC.indexOf('partialize: (state) => ({')
  expect(start, 'partialize block not found in store.ts').toBeGreaterThan(-1)
  const end = SRC.indexOf('}),', start)
  return SRC.slice(start, end)
}

describe('chrome is never restored from disk', () => {
  it('accentColor is NOT in the persist whitelist', () => {
    expect(partializeBody()).not.toMatch(/accentColor:\s*state\.accentColor/)
  })

  it('the persist config carries a version so migrate runs for returning browsers', () => {
    expect(SRC).toMatch(/name:\s*'astryx-storage'/)
    expect(SRC).toMatch(/version:\s*[2-9]\d*/)
  })

  it('migrate strips a stored accentColor off the root and off saved records', () => {
    const start = SRC.indexOf('migrate:')
    expect(start, 'migrate not found in store.ts').toBeGreaterThan(-1)
    const body = SRC.slice(start, start + 1200)
    expect(body).toMatch(/delete next\.accentColor/)
    expect(body).toMatch(/next\.history/)
    expect(body).toMatch(/next\.sessionLog/)
  })

  it('merge strips accentColor on EVERY load, not just the one migration', () => {
    const start = SRC.indexOf('merge: (persisted, current)')
    expect(start, 'merge not found in store.ts').toBeGreaterThan(-1)
    const body = SRC.slice(start, start + 900)
    expect(body).toMatch(/delete incoming\.accentColor/)
  })

  it('the CHOSEN PALETTE is persisted — it is an input, not a derivation', () => {
    // The distinction that keeps this from being confused with the bug above:
    // a preference the user set is restored; a value derived from a reading is
    // resolved. chromePaletteId is the former, accentColor the latter.
    expect(partializeBody()).toMatch(/chromePaletteId:\s*state\.chromePaletteId/)
    expect(SRC).toMatch(/chromePaletteId:\s*DEFAULT_PALETTE_ID/)
    // Picking a palette re-resolves the accent immediately from the live reading.
    expect(SRC).toMatch(/setChromePaletteId:[\s\S]{0,400}getAccentColor\(state\.protocol, id\)/)
  })

  it('starting a new reading keeps the room the user chose', () => {
    const reset = SRC.slice(SRC.indexOf('resetIntake:'), SRC.indexOf('resetIntake:') + 900)
    expect(reset).not.toMatch(/chromePaletteId/)
  })

  it('the store seeds chrome with the house accent, not a planet hue', () => {
    expect(SRC).toMatch(/accentColor:\s*HOUSE_ACCENT/)
    // The old violet seed is gone from every default and from resetIntake.
    expect(SRC).not.toMatch(/accentColor:\s*'#8B5CF6'/)
  })
})

describe('no screen replays a stored hue back into chrome', () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

  it('loading a history record resolves chrome from the reading', () => {
    const s = read('src/components/screens/DashboardScreen.tsx')
    expect(s).not.toMatch(/setAccentColor\(record\.accentColor\)/)
    expect(s).toMatch(/setAccentColor\(getAccentColor\(record\.protocol, chromePaletteId\)\)/)
  })

  it('the post-session summary does not take its accent from the snapshot', () => {
    const s = read('src/components/screens/PostSessionSummary.tsx')
    expect(s).not.toMatch(/snapshot\.accentColor\s*\|\|/)
  })

  it('the history stripe does not paint a saved per-planet hue', () => {
    const s = read('src/components/screens/HistoryScreen.tsx')
    expect(s).not.toMatch(/background:\s*record\.accentColor/)
  })
})
