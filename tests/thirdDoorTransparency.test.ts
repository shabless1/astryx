/**
 * The third door — proving the shaping is invisible to the app.
 *
 * The other tests say what the shaping withholds. This one says what it must
 * NOT break, and it does it the only way worth trusting: by running the real
 * client-side engines against a real calibration, once with the engine's raw
 * output and once with the payload the route actually sends, and demanding the
 * two agree byte for byte.
 *
 * That matters because the app is not a passive reader of this data. The
 * chamber composes its session from the polarity results, the DNA engine reads
 * the corrective breath and palette, and the scale engine reads the override.
 * If shaping starved any of them the damage would be silent — a subtly wrong
 * session, composed from a field that quietly became undefined, with nothing
 * failing anywhere. So: same inputs, same sequence, same DNA, same scale.
 */

import { describe, it, expect } from 'vitest'
import { runEngine } from '@/lib/engine'
import {
  shapePolarityResultsForClient,
  shapeDominantPolarityForClient,
  shapeActivePlanetsForClient,
  shapeDiagnosticForClient,
} from '@/lib/sacredShape'
import { buildForkSequence } from '@/lib/chamber/forkRite'
import { generateChamberDNA } from '@/lib/chamber/ChamberDNAEngine'
import { buildScalePlan } from '@/lib/chamber/ScaleEngine'
import { getDurationPreset } from '@/lib/chamber/durationPresets'
import type { IntakeData, ProtocolOutput } from '@/types'
import chartA from './fixtures/chart-a.json'

const INTAKE: IntakeData = {
  name: 'Fixture A',
  birthDate: '1990-03-15',
  birthTime: '14:30',
  birthLocation: 'Atlanta, GA, USA',
  symptoms: ['restlessness'],
  emotionalState: ['anxious'],
  intention: ['Grounding'],
  narrative: 'I feel electric and unable to settle, my mind races at night.',
  mode: 'user',
  resourcedPlanets: [],
  bodyMapType: 'female',
} as IntakeData

const COORDS = { lat: 33.749, lon: -84.388, tzOffset: -5 }
const BIRTH = { birthDate: '1990-03-15', birthTime: '14:30', lat: 33.749, lon: -84.388 }

/** Exactly what src/app/api/protocol/route.ts sends. */
function asSentToClient(protocol: ProtocolOutput): ProtocolOutput {
  return {
    ...protocol,
    polarityResults: shapePolarityResultsForClient(protocol.polarityResults) as never,
    dominantPolarity: shapeDominantPolarityForClient(protocol.dominantPolarity) as never,
    activePlanets: shapeActivePlanetsForClient(protocol.activePlanets) as never,
    diagnostic: shapeDiagnosticForClient(protocol.diagnostic) as never,
  }
}

async function bothForms() {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (url: unknown) => {
    if (String(url).includes('/api/chart')) return { ok: true, json: async () => chartA } as Response
    throw new Error(`Unexpected fetch: ${String(url)}`)
  }) as typeof fetch
  try {
    const raw = (await runEngine(INTAKE, COORDS)) as ProtocolOutput
    return { raw, sent: asSentToClient(raw) }
  } finally {
    globalThis.fetch = originalFetch
  }
}

describe('the shaped payload drives the client identically', () => {
  it('composes the same session sequence', async () => {
    const { raw, sent } = await bothForms()
    const preset = getDurationPreset('15_PERSONAL')
    const seq = (p: ProtocolOutput) =>
      buildForkSequence({
        hierarchy: p.signalHierarchy,
        polarity: p.dominantPolarity,
        polarityResults: p.polarityResults,
        intentionPlanet: p.intentionPlanet,
        architecture: preset.architecture,
        durationSec: preset.durationSec,
        forkCount: preset.forkCount,
      })
    expect(JSON.stringify(seq(sent))).toBe(JSON.stringify(seq(raw)))
    expect(seq(sent).length).toBeGreaterThan(3)
  })

  it('generates the same chamber DNA, including the corrective character', async () => {
    const { raw, sent } = await bothForms()
    const dna = (p: ProtocolOutput) =>
      generateChamberDNA({ protocol: p, birthData: BIRTH as never, polarity: p.dominantPolarity })

    // ChamberDNA echoes its polarity input back inside itself, so comparing the
    // whole object would only be re-testing the shaping. What matters is every
    // value the DNA DERIVES — the seed, the signature, the corrective decision,
    // and all four sub-DNAs. If shaping had starved the engine, these are what
    // would quietly move.
    const behaviour = (p: ProtocolOutput) => {
      const { polarity, ...rest } = dna(p) as any
      return JSON.stringify(rest)
    }
    expect(behaviour(sent)).toBe(behaviour(raw))

    // And the decision itself, named explicitly, because it is the one that
    // would hurt: a corrective chamber silently becoming a non-corrective one.
    expect((dna(sent) as any).applyCorrective).toBe((dna(raw) as any).applyCorrective)
    expect((dna(sent) as any).effectivePlanet).toBe((dna(raw) as any).effectivePlanet)
    expect((dna(sent) as any).breathDNA).toEqual((dna(raw) as any).breathDNA)
    expect((dna(sent) as any).colorDNA).toEqual((dna(raw) as any).colorDNA)
  })

  it('picks the same scale, including a scale_override', async () => {
    const { raw, sent } = await bothForms()
    const plan = (p: ProtocolOutput) =>
      buildScalePlan(
        generateChamberDNA({ protocol: p, birthData: BIRTH as never, polarity: p.dominantPolarity }),
      )
    expect(JSON.stringify(plan(sent))).toBe(JSON.stringify(plan(raw)))
  })

  it('still carries every field the screens render', async () => {
    const { sent } = await bothForms()
    const p = sent.dominantPolarity as any
    expect(p.planet).toBeTruthy()
    expect(p.dominant_state).toBeTruthy()
    expect(p.confidence_band).toBeTruthy()
    // ResultsScreen prints the raw number on the practitioner DNA panel.
    expect(typeof p.confidence).toBe('number')
    // The corrective card reads all of these.
    for (const k of ['regulator_planets', 'corrective_direction', 'avoid', 'herbs', 'scents',
                     'color_palette', 'sound_character', 'support_style', 'breath']) {
      expect(p.protocol[k], `dominantPolarity.protocol.${k}`).toBeDefined()
    }
  })

  it('and none of the fields that were only ever exposure', async () => {
    const { sent } = await bothForms()
    const blob = JSON.stringify({
      polarityResults: sent.polarityResults,
      dominantPolarity: sent.dominantPolarity,
      activePlanets: sent.activePlanets,
      diagnostic: sent.diagnostic,
    })
    for (const k of ['scores', 'natalWeight', 'transitPressure', 'symptomScore',
                     'matchedRootCauseKey', 'matchedSignature', 'indicators', 'visual_motion']) {
      expect(blob, `leaked ${k}`).not.toContain(`"${k}"`)
    }
  })

  it('the engine itself is untouched — only what leaves the server changes', async () => {
    const { raw } = await bothForms()
    // The goldens lock runEngine's own output; this asserts the route never
    // mutates it on the way past.
    expect((raw.polarityResults as any)?.[0]?.scores).toBeDefined()
  })
})
