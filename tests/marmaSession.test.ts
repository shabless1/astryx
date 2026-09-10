/**
 * ASTRYX — Marma Recalibration session invariants.
 *
 * The session names the points; MarmaEngine still decides how the fork may meet
 * each one. These tests hold that seam: no ladder ordering, no duration, and no
 * step label can turn a field-only point into a contact point.
 */

import { describe, it, expect } from 'vitest'
import { buildMarmaSequence, MARMA_LADDER } from '@/lib/chamber/forkRite'
import { marmaPointById, resolveMarmaLayer } from '@/lib/MarmaEngine'
import { CHAMBER_DURATIONS, getDurationPreset } from '@/lib/chamber/durationPresets'

const DURATIONS = [900, 1200, 1800, 2400, 3600]

describe('Marma Recalibration — shape', () => {
  it('is registered as a selectable container', () => {
    const preset = CHAMBER_DURATIONS.find((p) => p.key === 'MARMA')
    expect(preset, 'MARMA preset missing').toBeTruthy()
    expect(preset!.marma).toBe(true)
    expect(preset!.minMode).toBe('user')
    expect(getDurationPreset('MARMA').key).toBe('MARMA')
  })

  it('opens at the heel and closes at the sole', () => {
    const steps = buildMarmaSequence({ durationSec: 1800 })
    expect(steps[0].role).toBe('ground')
    expect(steps[0].marmaPointId).toBe('parshni')
    const last = steps[steps.length - 1]
    expect(last.role).toBe('earthClose')
    expect(last.marmaPointId).toBe('pada_madhya')
  })

  it('turns at the crown with breath only, nothing struck', () => {
    const steps = buildMarmaSequence({ durationSec: 1800 })
    const turn = steps.find((s) => s.role === 'breathwork')
    expect(turn, 'no crown turn').toBeTruthy()
    expect(turn!.marmaPointId).toBe('adhipati')
    expect(turn!.fork).toBeNull()
    expect(turn!.hz).toBe(0)
  })

  it('walks eleven named stations between the bookends', () => {
    const steps = buildMarmaSequence({ durationSec: 1800 })
    const stations = steps.filter((s) => s.role === 'signalFork')
    expect(stations).toHaveLength(MARMA_LADDER.length)
    expect(stations).toHaveLength(11)
    expect(steps).toHaveLength(14)
  })

  it('every step names a point that exists', () => {
    for (const s of buildMarmaSequence({ durationSec: 1800 })) {
      expect(s.marmaPointId, `step ${s.idx} has no point`).toBeTruthy()
      expect(marmaPointById(s.marmaPointId!), `unknown point ${s.marmaPointId}`).not.toBeNull()
    }
  })

  it('ascends — each station sits at or above the one before it', () => {
    // Anchor y runs 0 at the crown to 1 at the soles, so an ascent is decreasing y.
    const ys = MARMA_LADDER.map((r) => marmaPointById(r.marma)!.anchor.y)
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i], `${MARMA_LADDER[i].marma} is lower than ${MARMA_LADDER[i - 1].marma}`)
        .toBeLessThanOrEqual(ys[i - 1])
    }
  })

  it('every one of the twelve forks appears exactly once', () => {
    const steps = buildMarmaSequence({ durationSec: 1800 })
    const planets = new Set(steps.map((s) => s.planet))
    for (const p of ['Saturn', 'Mars', 'Pluto', 'Full Moon', 'Sun', 'Jupiter', 'Earth Year', 'Uranus', 'Mercury', 'Venus', 'Neptune']) {
      expect(planets.has(p), `${p} missing from the ladder`).toBe(true)
    }
    // Earth Day carries both bookends.
    expect(steps.filter((s) => s.planet === 'Earth Day')).toHaveLength(2)
    const ladderPlanets = MARMA_LADDER.map((r) => r.planet)
    expect(new Set(ladderPlanets).size, 'a fork repeats in the ladder').toBe(ladderPlanets.length)
  })

  it('Mars is never the last struck station', () => {
    const steps = buildMarmaSequence({ durationSec: 1800 })
    const struck = steps.filter((s) => s.role === 'signalFork')
    expect(struck[struck.length - 1].planet).not.toBe('Mars')
  })
})

describe('Marma Recalibration — timing', () => {
  it('tiles the requested duration exactly, at every length', () => {
    for (const d of DURATIONS) {
      const steps = buildMarmaSequence({ durationSec: d })
      const last = steps[steps.length - 1]
      expect(last.startSec + last.holdSec, `duration ${d} did not tile`).toBe(d)
      // no gaps, no overlaps
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i].startSec).toBe(steps[i - 1].startSec + steps[i - 1].holdSec)
      }
    }
  })

  it('falls back to a sane length rather than producing a zero session', () => {
    const steps = buildMarmaSequence({ durationSec: 0 })
    const last = steps[steps.length - 1]
    expect(last.startSec + last.holdSec).toBe(1800)
  })

  it('is deterministic — the same duration builds the same session', () => {
    for (const d of DURATIONS) {
      expect(JSON.stringify(buildMarmaSequence({ durationSec: d })))
        .toBe(JSON.stringify(buildMarmaSequence({ durationSec: d })))
    }
  })
})

describe('SAFETY — the session cannot loosen a point', () => {
  it('Pluto still resolves to the six-inch sweep at its ladder station', () => {
    const rung = MARMA_LADDER.find((r) => r.planet === 'Pluto')!
    expect(rung.marma).toBe('kati')
    // The ladder puts Pluto on the sacrum, which is a CONTACT point for other
    // forks. Pluto's own delivery mode must still force it off the body.
    const layer = resolveMarmaLayer({ planet: 'Pluto', forkDelivery: 'sweep' })!
    const kati = layer.points.find((p) => p.id === 'kati')!
    expect(kati.application).toBe('fieldOnly')
    expect(kati.fieldDistanceInches).toBe(6)
  })

  it('the sacrum station is contact for the Moon and sweep for Pluto — the same point, two rules', () => {
    const moon = resolveMarmaLayer({ planet: 'Full Moon', forkDelivery: 'contact' })!
      .points.find((p) => p.id === 'kati')!
    const pluto = resolveMarmaLayer({ planet: 'Pluto', forkDelivery: 'sweep' })!
      .points.find((p) => p.id === 'kati')!
    expect(moon.application).toBe('weighted')
    expect(pluto.application).toBe('fieldOnly')
  })

  it('no ladder station names a point from the field-only pelvic zone', () => {
    // Basti and Trik are real points, but they are never a struck station —
    // they reach the session only as doorways, already resolved to a sweep.
    for (const rung of MARMA_LADDER) {
      const p = marmaPointById(rung.marma)!
      expect(p.region, `${rung.marma} is a pelvic-zone station`).not.toBe('pelvis')
    }
  })

  it('every named point in the session still carries its safety note', () => {
    for (const s of buildMarmaSequence({ durationSec: 1800 })) {
      const p = marmaPointById(s.marmaPointId!)!
      expect(p.safetyNote.trim(), `${p.id} lost its safety note`).not.toBe('')
    }
  })
})
