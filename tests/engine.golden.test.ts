/**
 * Determinism golden tests (Directive v4.0 · Fix 7).
 *
 * Three fixed intake fixtures → runEngine → full-ProtocolOutput snapshots.
 * The /api/chart network call is stubbed with FROZEN fixture responses
 * (captured 2026-07-01 from the real ephemeris route), so the pipeline —
 * polarity, signal hierarchy, five builders, reflex placements, diagnostics —
 * runs exactly as in prod but with a pinned sky.
 *
 * HARD INVARIANT: same birth data + intake → byte-identical protocol.
 * If a snapshot changes, either the engine changed (review!) or determinism
 * broke (revert!). Never regenerate snapshots casually.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { runEngine } from '@/lib/engine'
import type { IntakeData } from '@/types'
import chartA from './fixtures/chart-a.json'
import chartB from './fixtures/chart-b.json'
import chartC from './fixtures/chart-c.json'

type Fixture = {
  name: string
  chartResponse: unknown
  intake: IntakeData
  coords: { lat: number; lon: number; tzOffset?: number }
}

const FIXTURES: Fixture[] = [
  {
    name: 'A — restless Aries-season chart, grounding intention',
    chartResponse: chartA,
    coords: { lat: 33.749, lon: -84.388, tzOffset: -5 },
    intake: {
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
    },
  },
  {
    name: 'B — heavy/fatigued Scorpio-season chart, energy intention',
    chartResponse: chartB,
    coords: { lat: 51.5074, lon: -0.1278, tzOffset: 0 },
    intake: {
      name: 'Fixture B',
      birthDate: '1975-11-02',
      birthTime: '03:10',
      birthLocation: 'London, UK',
      symptoms: ['fatigue', 'heaviness'],
      emotionalState: ['heavy'],
      intention: ['Energy'],
      narrative: 'Everything feels heavy and stuck. I have been tired for months.',
      mode: 'user',
      resourcedPlanets: [],
      bodyMapType: 'male',
    },
  },
  {
    name: 'C — solar chart (unknown birth time), clean intake',
    chartResponse: chartC,
    coords: { lat: -33.8688, lon: 151.2093, tzOffset: 10 },
    intake: {
      name: 'Fixture C',
      birthDate: '2001-07-22',
      birthTime: '',
      birthLocation: 'Sydney, Australia',
      symptoms: [],
      emotionalState: [],
      intention: ['Clarity'],
      narrative: '',
      mode: 'user',
      resourcedPlanets: [],
      bodyMapType: 'neutral',
    },
  },
]

function stubChartFetch(response: unknown) {
  vi.stubGlobal('fetch', vi.fn(async (url: unknown) => {
    if (String(url).includes('/api/chart')) {
      return { ok: true, json: async () => response } as Response
    }
    throw new Error(`Unexpected fetch in engine test: ${String(url)}`)
  }))
}

afterEach(() => vi.unstubAllGlobals())

describe('runEngine — determinism golden files', () => {
  for (const f of FIXTURES) {
    it(`fixture ${f.name}: byte-identical across invocations + matches golden snapshot`, async () => {
      stubChartFetch(f.chartResponse)

      const first = await runEngine(f.intake, f.coords)
      const second = await runEngine(f.intake, f.coords)

      // Byte-identical: same inputs → same protocol, same fork sequence,
      // same prescriptions, same reflex placements. No exceptions.
      expect(JSON.stringify(second)).toBe(JSON.stringify(first))
      expect(second).toEqual(first)

      // Golden snapshot of the FULL ProtocolOutput.
      expect(first).toMatchSnapshot()
    })
  }
})
