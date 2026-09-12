/**
 * READABILITY — the contrast floor, and the last hue the palette did not choose.
 * ════════════════════════════════════════════════════════════════════════════
 * SHA, 2026-09-12, with three arrows drawn on a screenshot:
 *
 *   "The fonts need a contrasting color, you cannot read it."
 *   "and why do i still have this red background?"
 *
 * TWO SEPARATE FAULTS, BOTH MINE
 *
 * 1. CONTRAST. Making GlassCard genuinely translucent (92% opaque → lit glass)
 *    was right, but it changed the ground under every piece of dim text in the
 *    app. `text-white/35` over a near-solid panel is quiet; over lit glass it is
 *    gone. The fix is a floor, applied so the ORDER survives — everything moves
 *    up, nothing overtakes what was above it.
 *
 * 2. THE RED. It was never in the palette, which is why every chrome fix missed
 *    it: it was the background VIDEO'S OWN colour. The footage strip used to be
 *    turned by a per-planet `hueRot` that happened to carry it off its native
 *    hue; when the planet table was disconnected hueRot went to 0, the raw warm
 *    footage showed through, and `saturate(1.4)` amplified it. It sits at
 *    bottom 8%, 20% tall — exactly where the red glow was in the screenshot.
 *    The footage is now greyscaled and tinted by the room, so it cannot
 *    contribute a hue at all.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

// Every surface a person reads a session from.
const SCREENS = [
  'src/components/screens/SessionScreen.tsx',
  'src/components/engine/MarmaPanel.tsx',
  'src/components/engine/ChamberBodyMap.tsx',
  'src/components/screens/DashboardScreen.tsx',
  'src/components/screens/SettingsScreen.tsx',
  'src/components/screens/HistoryScreen.tsx',
  'src/components/screens/PostSessionSummary.tsx',
  'src/components/screens/ResultsScreen.tsx',
]

/** Below this, text on lit glass stops being readable. */
const FLOOR = 56

describe('the contrast floor', () => {
  it.each(SCREENS)('%s has no text dimmer than the floor', (file) => {
    const offenders = [...read(file).matchAll(/text-white\/(\d+)/g)]
      .map((m) => Number(m[1]))
      .filter((n) => n < FLOOR)
    expect(offenders, `${file} has text-white/${offenders.join(', /')} below /${FLOOR}`)
      .toHaveLength(0)
  })

  it.each(SCREENS)('%s has no inline white TEXT below the floor', (file) => {
    // Scoped to `color:` on purpose. Borders, rims and hairlines are SUPPOSED to
    // be faint — they are looked at, not read. An earlier version of this test
    // flagged them and would have pushed every hairline up into the content.
    const offenders = [...read(file).matchAll(/color:\s*['"`]?rgba\(255,\s*255,\s*255,\s*(0\.\d+)\)/g)]
      .map((m) => Number(m[1]))
      .filter((a) => a < FLOOR / 100)
    expect(offenders, `${file} has unreadable text at rgba white ${offenders.join(', ')}`)
      .toHaveLength(0)
  })

  it('the hierarchy survived the raise — the ladder is monotonic', () => {
    // The floor was applied through one ordered map. If two different old values
    // had collapsed onto one new value, hierarchy would be lost.
    const LADDER: Record<number, number> = {
      25: 56, 30: 58, 32: 60, 35: 62, 38: 64, 40: 66, 42: 68, 45: 70,
      50: 74, 55: 78, 60: 82, 62: 83, 65: 85, 68: 86, 70: 87, 72: 88, 75: 89,
    }
    const keys = Object.keys(LADDER).map(Number).sort((a, b) => a - b)
    const vals = keys.map((k) => LADDER[k])
    for (let i = 1; i < vals.length; i++) {
      expect(vals[i], `${keys[i]} must stay above ${keys[i - 1]}`).toBeGreaterThan(vals[i - 1])
      expect(vals[i]).toBeGreaterThanOrEqual(FLOOR)
    }
  })
})

describe('nothing paints a hue the palette did not choose', () => {
  const bg = () => read('src/components/layout/CosmicBackground.tsx')

  it('the background video cannot contribute its own colour', () => {
    const s = bg()
    // Greyscaled first, so the footage keeps its light and loses its hue.
    expect(s).toMatch(/filter: 'grayscale\(1\)/)
    // And the old amplifier is gone — saturate(1.4) on raw footage is what made
    // the red loud once hueRot stopped rotating it away.
    expect(s).not.toMatch(/hue-rotate\(\$\{atm\.hueRot\}deg\) saturate\(1\.4\)/)
    // The tint that replaces it comes from the resolved room.
    expect(s).toMatch(/rgba\(\$\{atm\.atmosRgb\},0\.55\)/)
    expect(s).toMatch(/mixBlendMode: 'screen'/)
  })

  it('the horizon glow and the grid follow the room, not a fixed cyan', () => {
    const s = bg()
    const horizon = s.slice(s.indexOf('Top horizon glow'), s.indexOf('Top horizon glow') + 500)
    expect(horizon).toMatch(/atm\.atmosRgb/)
    // One hard-coded cyan is allowed to remain (the star tint); no more.
    const cyanHits = [...s.matchAll(/94,\s*224,\s*255/g)].length
    expect(cyanHits, 'hard-coded cyan is creeping back into chrome').toBeLessThanOrEqual(1)
  })

  it('the page background is never re-indexed by the dominant planet', () => {
    // The original fault: a per-planet table painting the whole viewport.
    expect(bg()).not.toMatch(/PLANET_ATMOSPHERE\s*\[/)
  })
})
