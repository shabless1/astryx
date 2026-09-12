/**
 * THE BODY SITE REGISTER — the invariants that keep a photograph honest.
 *
 * A photograph shows a place on a body; the system is only the reason you chose
 * that place. These tests hold that rule shut:
 *
 *   1. Every system's identifiers resolve to a real site — no dangling keys.
 *   2. Every marma point has a site, so no point can silently lose its picture.
 *   3. Every photograph belongs to a real site and states what it depicts.
 *   4. THE GATE — a contact photograph can never be returned for a step that
 *      resolved to a sweep. This is the class of error that put a stem on the
 *      temple; it must be mechanically impossible, not merely reviewed for.
 *   5. SHA's standing safety ruling holds at the register level: the lower belly
 *      and the tail bone are field-only, and nothing can mark them contact.
 */

import { describe, it, expect } from 'vitest'
import {
  allBodySites, siteById, siteForMarma, siteForChakra, photoForSite, sitesWithoutPhoto,
} from '../src/lib/bodySites'
import { allMarmaPoints } from '../src/lib/MarmaEngine'
import { FULL_BODY_LADDER, FULL_SPECTRUM_SWEEP, CHAKRA_CENTERS } from '../src/lib/chamber/forkRite'
import photoFile from '../src/data/placementPhotos.json'
import register from '../src/data/bodySites.json'

const PHOTOS = (photoFile as any).photos as Record<string, { file: string; discipline: string }>

describe('the register is complete', () => {
  it('every site id is unique', () => {
    const ids = allBodySites().map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every marma point resolves to a site', () => {
    for (const pt of allMarmaPoints()) {
      expect(siteForMarma(pt.id), `no site for marma point ${pt.id}`).not.toBeNull()
    }
  })

  it('every Full Body rung resolves to a site', () => {
    for (const rung of FULL_BODY_LADDER) {
      expect(siteById(rung.site), `rung ${rung.sign} → ${rung.site}`).not.toBeNull()
    }
  })

  it('every Full Spectrum step resolves to a site', () => {
    for (const step of FULL_SPECTRUM_SWEEP) {
      expect(siteById(step.site), `sweep ${step.sign} → ${step.site}`).not.toBeNull()
    }
  })

  it('every chakra centre resolves to a site', () => {
    for (const c of CHAKRA_CENTERS) {
      expect(siteForChakra(c.center), `chakra ${c.center}`).not.toBeNull()
    }
  })

  it("a site's named marma point is one that actually maps back to it", () => {
    const ids = new Set(allMarmaPoints().map((p) => p.id))
    for (const s of allBodySites()) {
      if (!s.marma) continue
      expect(ids.has(s.marma), `${s.id} names unknown point ${s.marma}`).toBe(true)
      expect(siteForMarma(s.marma)?.id).toBe(s.id)
    }
  })
})

describe('photographs', () => {
  it('every photograph belongs to a real site', () => {
    for (const key of Object.keys(PHOTOS)) {
      expect(siteById(key), `photo keyed to unknown site "${key}"`).not.toBeNull()
    }
  })

  it('every photograph declares what it depicts', () => {
    for (const [key, p] of Object.entries(PHOTOS)) {
      expect(['contact', 'field'], `${key}`).toContain(p.discipline)
    }
  })

  it('no photograph claims contact at a field-only site', () => {
    for (const [key, p] of Object.entries(PHOTOS)) {
      const site = siteById(key)!
      if (site.discipline === 'fieldOnly') expect(p.discipline, key).toBe('field')
    }
  })
})

describe('THE GATE — discipline must agree before a picture is shown', () => {
  it('withholds a contact photograph from a step resolved to a sweep', () => {
    // knee_front ships a contact picture; a person the engine has tightened
    // gets the map alone rather than a picture of a stem pressed to a knee.
    expect(photoForSite('knee_front', 'weighted')).not.toBeNull()
    expect(photoForSite('knee_front', 'field')).toBeNull()
    expect(photoForSite('knee_front', 'fieldOnly')).toBeNull()
  })

  it('withholds a field photograph from a contact step', () => {
    expect(photoForSite('temple', 'field')).not.toBeNull()
    expect(photoForSite('temple', 'weighted')).toBeNull()
  })

  it('returns nothing for a site with no photograph, never a neighbour', () => {
    for (const s of sitesWithoutPhoto()) {
      expect(photoForSite(s.id, 'weighted'), s.id).toBeNull()
      expect(photoForSite(s.id, 'field'), s.id).toBeNull()
    }
  })
})

describe("SHA's standing safety ruling holds at the register", () => {
  it('the lower belly and the tail bone are field-only', () => {
    expect(siteById('lower_belly')!.discipline).toBe('fieldOnly')
    expect(siteById('tailbone')!.discipline).toBe('fieldOnly')
  })

  it('the Sacral centre and the Root resolve to those field-only sites', () => {
    expect(siteForChakra('Sacral')!.id).toBe('lower_belly')
    expect(siteForChakra('Root')!.id).toBe('tailbone')
  })

  it('the Full Body pelvis rung is field-only, so its rung is swept', () => {
    const rung = FULL_BODY_LADDER.find((r) => r.sign === 'Scorpio')!
    expect(siteById(rung.site)!.discipline).toBe('fieldOnly')
  })

  it('no region is omitted — every rung and sweep step has a place to go', () => {
    expect(FULL_BODY_LADDER.every((r) => !!r.site)).toBe(true)
    expect(FULL_SPECTRUM_SWEEP.every((f) => !!f.site)).toBe(true)
  })
})

describe('the ladder no longer borrows the planet’s marma points', () => {
  it('the Shins rung names the shin, not the shoulder', () => {
    const rung = FULL_BODY_LADDER.find((r) => r.sign === 'Aquarius')!
    expect(rung.site).toBe('shin')
    // The shin has no named marma point, so the panel shows nothing rather
    // than Uranus's shoulder/forearm/palm set with their photographs.
    expect(siteById('shin')!.marma).toBeNull()
  })

  it('the throat/thymus rung names the breastbone, not the forehead', () => {
    const rung = FULL_BODY_LADDER.find((r) => r.sign === 'Taurus')!
    expect(rung.site).toBe('upper_breastbone')
    expect(siteById(rung.site)!.marma).toBe('jatru')
  })
})

describe('coverage, reported honestly', () => {
  it('names the sites still waiting on a photograph', () => {
    const missing = sitesWithoutPhoto().map((s) => s.id)
    // Not an assertion of completeness — a visible ledger. Shrink it by
    // shooting the pictures, never by loosening the gate.
    expect(Array.isArray(missing)).toBe(true)
    // eslint-disable-next-line no-console
    console.log(`  placement photos: ${Object.keys(PHOTOS).length}/${allBodySites().length} sites · still needed: ${missing.join(', ')}`)
  })

  it('the register documents its own chakra crossing decision', () => {
    expect((register as any)._chakraNote).toContain('never the headline')
  })
})
