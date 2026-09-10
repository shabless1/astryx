/**
 * Outcome capture — the whitelist fence (Roadmap 0.2).
 * The flywheel dataset holds subjective felt-state only. If a future change
 * lets free text, clinical fields, or unknown keys through, this fails.
 */

import { describe, it, expect } from 'vitest'
import { shapeSessionStart, shapeSessionOutcome, energyScore, CALIBRATION_STANDARD_VERSION } from '@/lib/outcomeCapture'

describe('energyScore', () => {
  it('accepts integers 1–10 only', () => {
    expect(energyScore(1)).toBe(1)
    expect(energyScore(10)).toBe(10)
    expect(energyScore(0)).toBeUndefined()
    expect(energyScore(11)).toBeUndefined()
    expect(energyScore(5.5)).toBeUndefined()
    expect(energyScore('7')).toBeUndefined()
    expect(energyScore(NaN)).toBeUndefined()
    expect(energyScore(undefined)).toBeUndefined()
  })
})

describe('shapeSessionStart — what ran', () => {
  it('keeps the known fields, normalises the signal state, clamps lists', () => {
    const out = shapeSessionStart({
      energyBefore: 4,
      carrierPlanet: ' Saturn ',
      signalState: 'Deficiency',
      forkSequence: ['Earth', 'Saturn', 'Moon', 'Earth', 42, ''],
      intention: ['Rest', 'Clarity'],
    })
    expect(out).toEqual({
      energyBefore: 4,
      carrierPlanet: 'Saturn',
      signalState: 'deficiency',
      forkSequence: ['Earth', 'Saturn', 'Moon', 'Earth'],
      intention: ['Rest', 'Clarity'],
    })
  })

  it('drops unknown signal states, unknown keys, and garbage', () => {
    const out = shapeSessionStart({
      signalState: 'possessed', notes: 'free text', diagnosis: 'x', energyBefore: '9',
      forkSequence: 'Sun', intention: [],
    }) as Record<string, unknown>
    expect(out.signalState).toBeUndefined()
    expect(out.energyBefore).toBeUndefined()
    expect(out.forkSequence).toBeUndefined()
    expect(out.intention).toBeUndefined()
    expect('notes' in out).toBe(false)
    expect('diagnosis' in out).toBe(false)
  })

  it('is null-safe and deterministic', () => {
    expect(shapeSessionStart(null)).toEqual({})
    expect(shapeSessionStart('nope')).toEqual({})
    const a = shapeSessionStart({ carrierPlanet: 'Sun', forkSequence: ['Sun'] })
    expect(JSON.stringify(a)).toBe(JSON.stringify(shapeSessionStart({ forkSequence: ['Sun'], carrierPlanet: 'Sun' })))
  })
})

describe('shapeSessionOutcome — how it landed', () => {
  it('keeps energyAfter + the whitelisted felt-state answers only', () => {
    const out = shapeSessionOutcome({
      energyAfter: 8,
      outcome: {
        feeling: ['Calm', 'Clear'],
        bodyState: ['Loose'],
        mentalState: ['Quiet'],
        placementAccuracy: 'Somewhat',
        chamberSupport: 'Yes',
        feltMostWhere: 'FREE_TEXT_SECRET',
        notes: 'NOTES_SECRET',
        diagnosis: 'CLINICAL_SECRET',
      },
    })
    expect(out.energyAfter).toBe(8)
    expect(out.outcome).toEqual({
      feeling: ['Calm', 'Clear'], bodyState: ['Loose'], mentalState: ['Quiet'],
      placementAccuracy: 'Somewhat', chamberSupport: 'Yes',
    })
    const s = JSON.stringify(out)
    for (const secret of ['FREE_TEXT_SECRET', 'NOTES_SECRET', 'CLINICAL_SECRET', 'feltMostWhere', 'notes', 'diagnosis']) {
      expect(s).not.toContain(secret)
    }
  })

  it('rejects unknown enum values and returns no outcome when nothing survives', () => {
    const out = shapeSessionOutcome({ energyAfter: 99, outcome: { placementAccuracy: 'Definitely', chamberSupport: 'Meh' } })
    expect(out.energyAfter).toBeUndefined()
    expect(out.outcome).toBeUndefined()
  })

  it('is null-safe', () => {
    expect(shapeSessionOutcome(undefined)).toEqual({ energyAfter: undefined, outcome: undefined })
  })
})

describe('CALIBRATION_STANDARD_VERSION', () => {
  it('is a short stable tag the server stamps on every session', () => {
    expect(CALIBRATION_STANDARD_VERSION).toMatch(/^v\d/)
  })
})
