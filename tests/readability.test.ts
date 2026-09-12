/**
 * NOTHING PAINTS A HUE THE PALETTE DID NOT CHOOSE
 * ════════════════════════════════════════════════════════════════════════════
 * SHA, 2026-09-12: "why do i still have this red background?"
 *
 * It was never in the palette, which is why five chrome fixes missed it: it was
 * the background VIDEO'S OWN colour. The footage strip used to be turned by a
 * per-planet `hueRot` that happened to carry it off its native hue; when the
 * planet table was disconnected hueRot went to 0, the raw warm footage showed
 * through, and `saturate(1.4)` amplified it. It sits at bottom 8%, 20% tall —
 * exactly where the glow was in her screenshot. The footage is now greyscaled
 * and tinted by the room, so it cannot contribute a hue at all.
 *
 * ⚠ A CONTRAST-FLOOR SUITE LIVED HERE AND WAS REMOVED, 2026-09-12.
 * SHA asked for readable label text. The change I made swept every
 * `rgba(255,255,255,x)` in nine files and raised it — which caught card
 * BACKGROUNDS and BORDERS as well as text, turning faint fills into a grey wash
 * over the whole dashboard. SHA: "I asked you to change the font color to give
 * it contrast, not change everything to this grey." Reverted in full.
 * If contrast is revisited: change the specific LABELS that are hard to read.
 * Never sweep a colour function across files — a regex cannot tell text from a
 * surface, and the blast radius is the entire app.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

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
