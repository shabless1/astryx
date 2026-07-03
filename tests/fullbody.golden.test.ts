/**
 * Full Body Recalibration — determinism golden test (Directive v4.3).
 *
 * The ladder is CHART-INDEPENDENT: one canonical, byte-identical sequence for
 * every user, every run. This snapshot IS that canon — a diff here means the
 * ladder itself changed (review deliberately; never regenerate casually).
 */

import { describe, it, expect } from 'vitest'
import { buildFullBodySequence, FULL_BODY_LADDER } from '@/lib/chamber/forkRite'

const CANONICAL_SEC = 2100 // the FULL_BODY container duration

describe('buildFullBodySequence — the 12-fork ladder', () => {
  it('is byte-identical across invocations and matches the golden snapshot', () => {
    const a = buildFullBodySequence({ durationSec: CANONICAL_SEC })
    const b = buildFullBodySequence({ durationSec: CANONICAL_SEC })
    expect(JSON.stringify(b)).toBe(JSON.stringify(a))
    expect(a).toMatchSnapshot()
  })

  it('has the exact ladder shape: ground → 12 up → crown turn → 12 down → ground', () => {
    const steps = buildFullBodySequence({ durationSec: CANONICAL_SEC })
    expect(steps).toHaveLength(27)

    expect(steps[0].role).toBe('ground')
    expect(steps[0].planet).toBe('Earth')
    expect(steps[26].role).toBe('earthClose')
    expect(steps[26].planet).toBe('Earth')
    expect(steps[13].role).toBe('breathwork') // the crown turn

    // Ascending pass — Pisces→Aries, modern-rulership forks.
    const ascent = steps.slice(1, 13)
    expect(ascent.map((s) => s.sign)).toEqual(FULL_BODY_LADDER.map((r) => r.sign))
    expect(ascent.map((s) => s.planet)).toEqual(FULL_BODY_LADDER.map((r) => r.planet))
    expect(ascent.map((s) => s.sign)).toEqual([
      'Pisces', 'Aquarius', 'Capricorn', 'Sagittarius', 'Scorpio', 'Libra',
      'Virgo', 'Leo', 'Cancer', 'Gemini', 'Taurus', 'Aries',
    ])

    // Descending pass — the exact reverse.
    const descent = steps.slice(14, 26)
    expect(descent.map((s) => s.sign)).toEqual([...FULL_BODY_LADDER].reverse().map((r) => r.sign))

    // Every rung carries a real fork and its Hz.
    for (const s of [...ascent, ...descent]) {
      expect(s.fork).not.toBeNull()
      expect(s.hz).toBeGreaterThan(0)
      expect(s.purpose.length).toBeGreaterThan(10) // no bare rungs, ever
    }

    // Descending holds are a lighter sweep than ascending holds.
    expect(descent[0].holdSec).toBeLessThan(ascent[0].holdSec)
  })

  it('tiles the duration exactly with no gaps or overlap, at any container length', () => {
    for (const sec of [900, 1800, 2100, 3600]) {
      const steps = buildFullBodySequence({ durationSec: sec })
      let cursor = 0
      for (const s of steps) {
        expect(s.startSec).toBe(cursor)
        cursor += s.holdSec
      }
      expect(cursor).toBe(sec)
    }
  })
})
