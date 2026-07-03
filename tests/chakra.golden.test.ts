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

  it('has the shape: ground → 7 up → crown turn → 7 down → ground (17 steps)', () => {
    const steps = buildChakraSequence({ durationSec: CANONICAL_SEC, instrument: 'planetary' })
    expect(steps).toHaveLength(17)
    expect(steps[0].role).toBe('ground')
    expect(steps[8].role).toBe('breathwork')       // crown turn
    expect(steps[16].role).toBe('earthClose')
    const up = steps.slice(1, 8).map((s) => s.phaseLabel.replace('Ascent · ', ''))
    expect(up).toEqual(CENTER_ORDER)
    const down = steps.slice(9, 16).map((s) => s.phaseLabel.replace('Descent · ', ''))
    expect(down).toEqual([...CENTER_ORDER].reverse())
    // sweep is lighter than the ascent
    expect(steps[9].holdSec).toBeLessThan(steps[1].holdSec)
    // timeline tiles exactly
    let cursor = 0
    for (const s of steps) { expect(s.startSec).toBe(cursor); cursor += s.holdSec }
    expect(cursor).toBe(CANONICAL_SEC)
  })

  it('Solfeggio frequencies all exist in solfeggio-overlays.json', () => {
    const available = new Set((solfeggioOverlays as { hz: number }[]).map((o) => o.hz))
    for (const c of CHAKRA_CENTERS) expect(available.has(c.solfeggioHz)).toBe(true)
    const steps = buildChakraSequence({ durationSec: CANONICAL_SEC, instrument: 'solfeggio' })
    expect(steps.slice(1, 8).map((s) => s.hz)).toEqual(CHAKRA_CENTERS.map((c) => c.solfeggioHz))
  })

  it('Planetary mapping matches the sacredTones chakra fields exactly (no invented pairs)', () => {
    const forks = sacredTones as { planet: string; chakra?: string; hz: number | string }[]
    for (const c of CHAKRA_CENTERS) {
      const match = forks.find((f) => f.chakra === c.center)
      expect(match, `data mapping for ${c.center}`).toBeTruthy()
      expect(match!.planet).toBe(c.forkName)
    }
    const steps = buildChakraSequence({ durationSec: CANONICAL_SEC, instrument: 'planetary' })
    for (let i = 0; i < CHAKRA_CENTERS.length; i++) {
      expect(steps[i + 1].hz).toBeCloseTo(parseFloat(String(forks.find((f) => f.chakra === CHAKRA_CENTERS[i].center)!.hz)), 2)
    }
  })
})
