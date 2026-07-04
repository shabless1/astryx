/**
 * Chakra Recalibration — determinism golden tests (Directive v4.3.1).
 * Chart-independent: one canonical sequence PER INSTRUMENT, byte-identical
 * every run. Frequencies are validated against the repo data files —
 * solfeggio-overlays.json (Solfeggio set) and sacredTones_nervousSystem.json
 * (Planetary set) — never trusted from memory.
 */

import { describe, it, expect } from 'vitest'
import { buildChakraSequence, CHAKRA_CENTERS, type ChakraInstrument } from '@/lib/chamber/forkRite'
import solfeggioOverlays from '@/data/solfeggio-overlays.json'
import sacredTones from '@/data/sacredTones_nervousSystem.json'

const CANONICAL_SEC = 1650
const CENTER_ORDER = ['Root', 'Sacral', 'Solar Plexus', 'Heart', 'Throat', 'Third Eye', 'Crown']

describe('buildChakraSequence — the 7-center session', () => {
  for (const instrument of ['solfeggio', 'planetary'] as ChakraInstrument[]) {
    it(`${instrument}: byte-identical + golden snapshot`, () => {
      const a = buildChakraSequence({ durationSec: CANONICAL_SEC, instrument })
      const b = buildChakraSequence({ durationSec: CANONICAL_SEC, instrument })
      expect(JSON.stringify(b)).toBe(JSON.stringify(a))
      expect(a).toMatchSnapshot()
    })
  }

  it('has the v4.5 shape: centering → 7 descent (crown→root) → 7 ascent (root→crown) → Earth close (16 steps)', () => {
    const steps = buildChakraSequence({ durationSec: CANONICAL_SEC, instrument: 'planetary' })
    expect(steps).toHaveLength(16)
    // Open · Centering — breath-only at the crown, nothing struck.
    expect(steps[0].role).toBe('breathwork')
    expect(steps[0].fork).toBeNull()
    // Close · Earth Grounding — the final step.
    expect(steps[15].role).toBe('earthClose')
    // Descent (crown → root) — the 7 struck centers, reversed order.
    const descent = steps.slice(1, 8).map((s) => s.phaseLabel.replace('Descent · ', ''))
    expect(descent).toEqual([...CENTER_ORDER].reverse())
    // Ascent (root → crown) — the 7 struck centers, canonical order.
    const ascent = steps.slice(8, 15).map((s) => s.phaseLabel.replace('Ascent · ', ''))
    expect(ascent).toEqual(CENTER_ORDER)
    // Every struck center is a signalFork.
    for (const s of steps.slice(1, 15)) expect(s.role).toBe('signalFork')
    // timeline tiles exactly
    let cursor = 0
    for (const s of steps) { expect(s.startSec).toBe(cursor); cursor += s.holdSec }
    expect(cursor).toBe(CANONICAL_SEC)
  })

  it('the SAME center glows the SAME chakra color on both descent and ascent', () => {
    const steps = buildChakraSequence({ durationSec: CANONICAL_SEC, instrument: 'planetary' })
    const colorByCenter = new Map(CHAKRA_CENTERS.map((c) => [c.center, c.color]))
    for (const s of steps.slice(1, 15)) {
      const center = s.phaseLabel.replace(/^(Descent|Ascent) · /, '')
      expect(s.centerColor, `color for ${center}`).toBe(colorByCenter.get(center))
    }
    // Crown appears on both passes (descent[0] and ascent[6]) — identical color.
    expect(steps[1].centerColor).toBe(steps[14].centerColor)
    expect(steps[1].phaseLabel).toBe('Descent · Crown')
    expect(steps[14].phaseLabel).toBe('Ascent · Crown')
  })

  it('center ORDER is identical for both instruments (only the struck tone differs)', () => {
    const solf = buildChakraSequence({ durationSec: CANONICAL_SEC, instrument: 'solfeggio' })
    const plan = buildChakraSequence({ durationSec: CANONICAL_SEC, instrument: 'planetary' })
    expect(solf.map((s) => s.phaseLabel)).toEqual(plan.map((s) => s.phaseLabel))
  })

  it('Solfeggio frequencies all exist in solfeggio-overlays.json', () => {
    const available = new Set((solfeggioOverlays as { hz: number }[]).map((o) => o.hz))
    for (const c of CHAKRA_CENTERS) expect(available.has(c.solfeggioHz)).toBe(true)
    const steps = buildChakraSequence({ durationSec: CANONICAL_SEC, instrument: 'solfeggio' })
    const solfByCenter = new Map(CHAKRA_CENTERS.map((c) => [c.center, c.solfeggioHz]))
    // descent = reversed order, ascent = canonical order
    expect(steps.slice(1, 8).map((s) => s.hz)).toEqual([...CHAKRA_CENTERS].reverse().map((c) => c.solfeggioHz))
    expect(steps.slice(8, 15).map((s) => s.hz)).toEqual(CHAKRA_CENTERS.map((c) => c.solfeggioHz))
    for (const s of steps.slice(1, 15)) {
      expect(s.hz).toBe(solfByCenter.get(s.phaseLabel.replace(/^(Descent|Ascent) · /, '')))
    }
  })

  it('Planetary mapping matches the sacredTones chakra fields exactly (no invented pairs)', () => {
    const forks = sacredTones as { planet: string; chakra?: string; hz: number | string }[]
    for (const c of CHAKRA_CENTERS) {
      const match = forks.find((f) => f.chakra === c.center)
      expect(match, `data mapping for ${c.center}`).toBeTruthy()
      expect(match!.planet).toBe(c.forkName)
    }
    const steps = buildChakraSequence({ durationSec: CANONICAL_SEC, instrument: 'planetary' })
    const hzForCenter = (center: string) =>
      parseFloat(String(forks.find((f) => f.chakra === center)!.hz))
    for (const s of steps.slice(1, 15)) {
      expect(s.hz).toBeCloseTo(hzForCenter(s.phaseLabel.replace(/^(Descent|Ascent) · /, '')), 2)
    }
  })
})
