/**
 * ONE-OFF (manual) — dump a real engine report from golden fixture A so the
 * live Astryx guide can be tested with a genuine reading attached.
 *   $env:ASTRYX_DUMP_REPORT='1'; npx vitest run tests/_dump-report.test.ts
 * Skipped in the build pipeline. Writes to the OS temp dir, never the repo.
 */
import { describe, it, vi, afterEach } from 'vitest'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { runEngine } from '@/lib/engine'
import type { IntakeData } from '@/types'
import chartA from './fixtures/chart-a.json'

const ON = process.env.ASTRYX_DUMP_REPORT === '1'

afterEach(() => vi.unstubAllGlobals())

describe.skipIf(!ON)('dump fixture A report', () => {
  it('writes the report JSON to temp', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: unknown) => {
      if (String(url).includes('/api/chart')) return { ok: true, json: async () => chartA } as Response
      throw new Error(`Unexpected fetch: ${String(url)}`)
    }))
    const intake: IntakeData = {
      name: 'Fixture A', birthDate: '1990-03-15', birthTime: '14:30', birthLocation: 'Atlanta, GA, USA',
      symptoms: ['restlessness'], emotionalState: ['anxious'], intention: ['Grounding'],
      narrative: 'I feel electric and unable to settle, my mind races at night.',
      mode: 'user', resourcedPlanets: [], bodyMapType: 'female',
    }
    const report = await runEngine(intake, { lat: 33.749, lon: -84.388, tzOffset: -5 })
    const out = join(tmpdir(), 'astryx-fixtureA-report.json')
    writeFileSync(out, JSON.stringify({ report, chart: chartA }), 'utf8')
    console.log('WROTE', out)
  })
})
