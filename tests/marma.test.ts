/**
 * ASTRYX — Marma layer invariants.
 *
 * The safety rules SHA ruled on (2026-09-10) are the point of this file:
 *   · the reproductive / pelvic-floor zone is NEVER contacted, by any fork,
 *     for any chart, for any person — it is a ZONE rule, not a Pluto rule;
 *   · application resolution only ever TIGHTENS (weighted → field → fieldOnly);
 *   · the SACRAL doorway is the SACRUM, not the navel.
 *
 * If any of these ever go red, the fix is the engine, never the test.
 */

import { describe, it, expect } from 'vitest'
import {
  resolveMarmaLayer,
  resolveApplication,
  marmaDoorwayFor,
  allMarmaPoints,
  APPLICATION_RANK,
  FIELD_ONLY_REGIONS,
  type MarmaApplication,
} from '@/lib/MarmaEngine'
import pointsData from '@/data/marmaPoints.json'
import forkData from '@/data/marmaFork.json'
import { BANNED_PHRASES } from '@/lib/compliance'

const FORK_PLANETS = [
  'Earth Day', 'Full Moon', 'Sun', 'Earth Year', 'Mercury', 'Venus',
  'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
]
const STATES = ['excess', 'deficiency', 'blocked', 'balanced', undefined]
const rank = (a: MarmaApplication) => APPLICATION_RANK.indexOf(a)

describe('marma data integrity', () => {
  it('covers all 12 forks', () => {
    expect(forkData.forks).toHaveLength(12)
    for (const p of FORK_PLANETS) {
      expect(resolveMarmaLayer({ planet: p }), `${p} has no marma layer`).not.toBeNull()
    }
  })

  it('every referenced point id resolves', () => {
    const ids = new Set(pointsData.points.map((p: any) => p.id))
    const refs: string[] = []
    for (const f of forkData.forks as any[]) {
      for (const key of ['primary', 'secondary', 'chakraDoorway', 'counterweight']) {
        if (f[key]) refs.push(f[key].marma)
      }
      for (const a of f.alternates ?? []) refs.push(a.marma)
    }
    for (const d of forkData.chakraDoorways as any[]) {
      refs.push(d.marma)
      refs.push(...(d.alternates ?? []))
    }
    const missing = refs.filter((r) => !ids.has(r))
    expect(missing, `unresolved point ids: ${missing.join(', ')}`).toEqual([])
  })

  it('no genital or perineal point ever enters the set', () => {
    // These are real marmas in the source and must never appear in Astryx.
    const FORBIDDEN = ['bhaga', 'medhra', 'yoni_jihva', 'yoni', 'vrushana', 'guda', 'yoni_oshtha']
    const ids = pointsData.points.map((p: any) => p.id.toLowerCase())
    for (const f of FORBIDDEN) expect(ids, `forbidden point present: ${f}`).not.toContain(f)
  })

  it('every point carries a safety note and a source page', () => {
    for (const p of pointsData.points as any[]) {
      expect(String(p.safetyNote ?? '').trim(), `${p.id} has no safety note`).not.toBe('')
      expect(String(p.sourcePage ?? '').trim(), `${p.id} has no source page`).not.toBe('')
    }
  })

  it('no banned phrase in any rendered marma string', () => {
    const walk = (node: any, path: string, hits: string[]) => {
      if (typeof node === 'string') {
        for (const re of BANNED_PHRASES) {
          const m = node.match(re)
          if (m) hits.push(`${path}: "${m[0]}"`)
        }
      } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`, hits))
      else if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
          if (k.startsWith('_') || k === 'engineUsage') continue
          walk(v, `${path}.${k}`, hits)
        }
      }
    }
    const hits: string[] = []
    walk(pointsData, 'marmaPoints', hits)
    walk(forkData, 'marmaFork', hits)
    expect(hits, hits.join(' | ')).toEqual([])
  })
})

describe('SAFETY — the reproductive / pelvic-floor zone is never contacted', () => {
  it('is a zone rule: every pelvis-region point is fieldOnly at six inches, for every fork and every state', () => {
    const pelvicIds = (pointsData.points as any[])
      .filter((p) => FIELD_ONLY_REGIONS.has(p.region))
      .map((p) => p.id)
    expect(pelvicIds.length, 'expected pelvic-zone points in the set').toBeGreaterThan(0)

    for (const planet of FORK_PLANETS) {
      for (const state of STATES) {
        for (const delivery of ['contact', 'sweep'] as const) {
          const layer = resolveMarmaLayer({ planet, engineState: state, forkDelivery: delivery })!
          for (const pt of layer.points) {
            if (!pelvicIds.includes(pt.id)) continue
            expect(pt.application, `${planet}/${state}/${delivery} → ${pt.id}`).toBe('fieldOnly')
            expect(pt.fieldDistanceInches, `${pt.id} distance`).toBe(6)
          }
        }
      }
    }
  })

  it('a pelvic point cannot be loosened even when the fork is a contact fork in deficiency', () => {
    // deficiency + contact is the most permissive combination the engine can produce.
    const r = resolveApplication(
      { applicationType: 'weighted', region: 'pelvis' },
      { forkDelivery: 'contact', engineState: 'deficiency' },
    )
    expect(r.application).toBe('fieldOnly')
    expect(r.reason).toMatch(/reproductive and pelvic-floor zone/i)
  })

  it('Pluto is off the body at every one of its points, in every state', () => {
    for (const state of STATES) {
      const layer = resolveMarmaLayer({ planet: 'Pluto', engineState: state, forkDelivery: 'sweep' })!
      for (const pt of layer.points) {
        expect(pt.application, `Pluto/${state} → ${pt.id}`).toBe('fieldOnly')
        expect(pt.fieldDistanceInches).toBe(6)
      }
    }
  })

  it('Trik and Basti are field-only wherever they appear', () => {
    for (const planet of FORK_PLANETS) {
      for (const state of STATES) {
        const layer = resolveMarmaLayer({ planet, engineState: state })!
        for (const pt of layer.points) {
          if (pt.id === 'trik' || pt.id === 'basti') {
            expect(pt.application, `${planet}/${state} → ${pt.id}`).toBe('fieldOnly')
          }
        }
      }
    }
  })
})

describe('SAFETY — application resolution only ever tightens', () => {
  it('never returns a class looser than the point declares, across the full input matrix', () => {
    for (const p of pointsData.points as any[]) {
      const own = rank(p.applicationType as MarmaApplication)
      for (const delivery of [undefined, 'contact', 'sweep'] as const) {
        for (const state of STATES) {
          for (const preg of [false, true]) {
            const { application } = resolveApplication(p, {
              forkDelivery: delivery, engineState: state, pregnancyWiden: preg,
            })
            expect(rank(application), `${p.id} loosened`).toBeGreaterThanOrEqual(own)
          }
        }
      }
    }
  })

  it('an unknown application class fails safe rather than to weighted', () => {
    const r = resolveApplication({ applicationType: 'nonsense', region: 'head' })
    expect(r.application).toBe('field')
  })

  it('an amplified signal is never pressed into the body', () => {
    for (const p of pointsData.points as any[]) {
      const { application } = resolveApplication(p, { engineState: 'excess' })
      expect(application, `${p.id} pressed while amplified`).not.toBe('weighted')
    }
  })

  it('pregnancy widens the field over the abdomen and the sacrum', () => {
    const kati = (pointsData.points as any[]).find((p) => p.id === 'kati')
    expect(resolveApplication(kati, {}).application).toBe('weighted')
    expect(resolveApplication(kati, { pregnancyWiden: true }).application).toBe('fieldOnly')
  })

  it('the Eight Great points are never taken with deep pressure where the source forbids it', () => {
    // Hridayam (over the heart), Nabhi (over the aorta), Kantha (the throat)
    // and Shankha (the temple) must never resolve to a weighted stem.
    for (const id of ['hridayam', 'nabhi', 'kantha', 'shankha']) {
      const p = (pointsData.points as any[]).find((x) => x.id === id)
      expect(p.applicationType, `${id} declared weighted`).not.toBe('weighted')
      expect(resolveApplication(p, { engineState: 'deficiency' }).application).not.toBe('weighted')
    }
  })
})

describe('SHA ruling — the sacral doorway is the sacrum, not the navel', () => {
  it('the Sacral centre resolves to Kati on the sacrum', () => {
    const door = marmaDoorwayFor('Sacral')!
    expect(door.id).toBe('kati')
    expect(door.region).toBe('sacrum')
    expect(door.view).toBe('posterior')
  })

  it('Nabhi is not the sacral doorway anywhere in the data', () => {
    const sacral = (forkData.chakraDoorways as any[]).find((d) => d.chakra === 'Sacral')
    expect(sacral.marma).not.toBe('nabhi')
    expect(sacral.alternates).not.toContain('nabhi')
  })

  it('the anterior face of the sacral centre is Basti, below the navel, field only', () => {
    const sacral = (forkData.chakraDoorways as any[]).find((d) => d.chakra === 'Sacral')
    expect(sacral.alternates).toContain('basti')
    const basti = (pointsData.points as any[]).find((p) => p.id === 'basti')
    expect(basti.applicationType).toBe('fieldOnly')
    expect(basti.plainLocation.toLowerCase()).toContain('below the navel')
  })

  it('all seven chakra centres have a named doorway', () => {
    for (const c of ['Crown', 'Third Eye', 'Throat', 'Heart', 'Solar Plexus', 'Sacral', 'Root']) {
      expect(marmaDoorwayFor(c), `${c} has no doorway`).not.toBeNull()
    }
  })
})

describe('determinism', () => {
  it('the same input returns the same layer every time', () => {
    for (const planet of FORK_PLANETS) {
      const a = resolveMarmaLayer({ planet, engineState: 'blocked', forkDelivery: 'contact' })
      const b = resolveMarmaLayer({ planet, engineState: 'blocked', forkDelivery: 'contact' })
      expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    }
  })

  it('an unmapped planet returns null rather than guessing', () => {
    expect(resolveMarmaLayer({ planet: 'Chiron' })).toBeNull()
  })

  it('a fork never emits the same point twice', () => {
    for (const planet of FORK_PLANETS) {
      const layer = resolveMarmaLayer({ planet })!
      const ids = layer.points.map((p) => p.id)
      expect(new Set(ids).size, `${planet} emitted a duplicate point`).toBe(ids.length)
    }
  })

  it('every point exposes an anchor inside the body image', () => {
    for (const p of allMarmaPoints()) {
      expect(p.anchor.x).toBeGreaterThan(0)
      expect(p.anchor.x).toBeLessThan(1)
      expect(p.anchor.y).toBeGreaterThan(0)
      expect(p.anchor.y).toBeLessThan(1)
    }
  })
})
