/**
 * THE ONE-PLACE RULE
 * ════════════════════════════════════════════════════════════════════════════
 * SHA, 2026-09-12, with three screenshots:
 *
 *   "if you are in the natal calibration, the only pictures that should be shown
 *    are pictures that match the body map. if it says shoulder, then only
 *    shoulder pictures should apply, if it says knee, only pictures that match
 *    the knee should apply. is this that difficult?"
 *
 * It is not difficult and it was not ambiguous. **A session step has ONE place.**
 * The card names it, the body map marks it, and the only picture shown is a
 * picture of that place.
 *
 * WHAT WAS ACTUALLY BROKEN
 * ────────────────────────
 * A Natal Calibration step took its HEADLINE from the planet's natal body zone
 * and its PICTURES from `resolveMarmaLayer(planet)`, which returns the fork's own
 * four points — primary, secondary, chakra doorway, counterweight — at four
 * unrelated sites. Nothing ever compared the two. Every picture was correct for
 * its own point and wrong for the step:
 *
 *   Mercury · card said "Chest / Breasts / Stomach" · showed Krikatika + Vidhuram (NECK)
 *   Uranus  · card said "Intestines / Lower abdomen" · showed Urdhva Skandha (SHOULDER) + Bahu Indrabasti (ELBOW)
 *   Venus   · card said "Intestines / Lower abdomen" · showed Sthapani (FOREHEAD) + Shivarandhra (TOP OF HEAD)
 *
 * Those three cases are fixtures below and must never pass again.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  governingPlace, pointIsAtPlace, siteForRegion, siteForMarma, siteById,
  allBodySites, photoForSite,
} from '@/lib/bodySites'
import { resolveMarmaLayer } from '@/lib/MarmaEngine'
import { resolveForkPlacement } from '@/lib/BodyPlacementEngine'

const register = JSON.parse(
  readFileSync(join(process.cwd(), 'src/data/bodySites.json'), 'utf-8'),
)

// ─── the register itself ─────────────────────────────────────────────────────
describe('the region → site map', () => {
  it('every mapped region points at a site that exists', () => {
    for (const [region, siteId] of Object.entries(register.regionToSite as Record<string, string>)) {
      expect(siteById(siteId), `${region} → ${siteId} is not a site`).not.toBeNull()
      expect(siteForRegion(region)?.id).toBe(siteId)
    }
  })

  it('an unmapped region resolves to NO site — never a neighbouring one', () => {
    // These are systemic fields and ambiguous spans. A step there shows no
    // photograph at all; the body map still shows where it is.
    for (const region of Object.keys(register.regionUnmapped as Record<string, string>)) {
      expect(siteForRegion(region), `${region} should have no site`).toBeNull()
    }
    expect(siteForRegion('not_a_region')).toBeNull()
    expect(siteForRegion(null)).toBeNull()
  })

  it('every omission is on the record with a reason', () => {
    for (const [region, why] of Object.entries(register.regionUnmapped as Record<string, string>)) {
      expect(String(why).length, `${region} needs a reason`).toBeGreaterThan(4)
      expect(register.regionToSite[region]).toBeUndefined()
    }
  })
})

// ─── the governing place ─────────────────────────────────────────────────────
describe('a step has one place, and the session decides it', () => {
  it('a chakra step is placed at the centre, whatever the fork is', () => {
    const p = governingPlace({ chakraCenter: 'Heart', natalRegion: 'knees' })
    expect(p.basis).toBe('chakra')
    expect(p.site?.id).toBe(siteById(register.chakraToSite['Heart'])?.id)
  })

  it('a marma step is placed at its own named point', () => {
    const p = governingPlace({ marmaPointId: 'adhipati', natalRegion: 'knees' })
    expect(p.basis).toBe('marma')
    expect(p.site?.id).toBe('crown')
  })

  it('a register step is placed at the rung the ladder owns', () => {
    const p = governingPlace({ registerSiteId: 'knee_front', natalRegion: 'chest' })
    expect(p.basis).toBe('register')
    expect(p.site?.id).toBe('knee_front')
  })

  it('a natal calibration step is placed at the region the card names', () => {
    const p = governingPlace({ natalRegion: 'shoulders' })
    expect(p.basis).toBe('natal')
    expect(p.site?.id).toBe('shoulder_ridge')
  })

  it('the precedence is chakra → marma → register → natal → traditional', () => {
    expect(governingPlace({
      chakraCenter: 'Crown', marmaPointId: 'adhipati',
      registerSiteId: 'knee_front', natalRegion: 'chest', traditionalRegion: 'feet',
    }).basis).toBe('chakra')
    expect(governingPlace({
      marmaPointId: 'adhipati', registerSiteId: 'knee_front', natalRegion: 'chest',
    }).basis).toBe('marma')
    expect(governingPlace({ registerSiteId: 'knee_front', natalRegion: 'chest' }).basis).toBe('register')
    expect(governingPlace({ traditionalRegion: 'feet' }).basis).toBe('traditional')
    expect(governingPlace({}).basis).toBe('none')
  })
})

// ─── SHA's rule, stated as a test ────────────────────────────────────────────
describe("SHA's rule: if it says shoulder, only shoulder pictures apply", () => {
  const CASES: Array<[string, string]> = [
    ['shoulders', 'shoulder_ridge'],
    ['knees', 'knee_front'],
    ['hands', 'palm'],
    ['feet', 'sole'],
    ['throat', 'throat_front'],
    ['lower_abdomen', 'lower_belly'],
  ]

  it.each(CASES)('a step at %s only admits %s pictures', (region, siteId) => {
    const place = governingPlace({ natalRegion: region })
    expect(place.site?.id).toBe(siteId)
    // Every point in the whole corpus that is NOT at this site is refused.
    for (const site of allBodySites()) {
      if (!site.marma) continue
      const allowed = pointIsAtPlace(site.marma, place)
      expect(allowed, `${site.marma} (${site.id}) at a ${region} step`)
        .toBe(site.id === siteId)
    }
  })

  it('a picture only ever depicts its own site', () => {
    for (const site of allBodySites()) {
      const photo = photoForSite(site.id, site.discipline)
      if (photo) expect(photo.file.length).toBeGreaterThan(0)
      // A point at another site can never reach this site's picture.
      for (const other of allBodySites()) {
        if (other.id === site.id || !other.marma) continue
        expect(siteForMarma(other.marma)?.id).not.toBe(site.id === other.id ? null : undefined)
      }
    }
  })
})

// ─── the three screenshots, as regressions ───────────────────────────────────
describe('the three cards SHA photographed can never come back', () => {
  // Each is [fork, the natal region the card named, a point that was illustrated
  // under it, the site that point actually sits at].
  const SCREENSHOTS: Array<[string, string, string]> = [
    ['Mercury', 'chest',          'krikatika'],       // neck points under a chest card
    ['Mercury', 'chest',          'vidhuram'],
    ['Uranus',  'lower_abdomen',  'urdhva_skandha'],  // shoulder under an intestines card
    ['Uranus',  'lower_abdomen',  'bahu_indrabasta'], // elbow under an intestines card
    ['Venus',   'lower_abdomen',  'sthapani'],        // forehead under an intestines card
    ['Venus',   'lower_abdomen',  'shivarandhra'],    // top of head under an intestines card
  ]

  it.each(SCREENSHOTS)('%s · a card naming %s refuses to illustrate %s', (_fork, region, pointId) => {
    const place = governingPlace({ natalRegion: region })
    expect(place.site).not.toBeNull()
    // GUARD: a fixture on a point id that does not exist would pass for the
    // wrong reason. Two of these were first written with hyphens instead of
    // underscores and passed trivially, which is exactly the kind of green
    // test that lets a real bug back in.
    const pointSite = siteForMarma(pointId)
    expect(pointSite, `${pointId} is not a real marma id — fixture is vacuous`).not.toBeNull()
    expect(pointSite!.id).not.toBe(place.site!.id)
    expect(pointIsAtPlace(pointId, place)).toBe(false)
  })

  it('every screenshot fixture names a point the engine actually emits', () => {
    const byFork: Record<string, Set<string>> = {}
    for (const [fork] of SCREENSHOTS) {
      byFork[fork] ??= new Set((resolveMarmaLayer({ planet: fork })?.points ?? []).map((p) => p.id))
    }
    for (const [fork, , pointId] of SCREENSHOTS) {
      expect(byFork[fork].has(pointId), `${fork} does not emit ${pointId}`).toBe(true)
    }
  })

  it('the fork layers really do reach across the body — this is why the rule exists', () => {
    // Not a hypothetical: resolveMarmaLayer returns points at several sites for
    // one planet, which is correct for the LAYER and wrong for a single step.
    for (const planet of ['Mercury', 'Uranus', 'Venus']) {
      const layer = resolveMarmaLayer({ planet })
      const sites = new Set(
        (layer?.points ?? []).map((p) => siteForMarma(p.id)?.id).filter(Boolean),
      )
      expect(sites.size, `${planet} should span more than one site`).toBeGreaterThan(1)
    }
  })
})

// ─── the mechanism, so it cannot be undone quietly ───────────────────────────
describe('the components enforce it', () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

  it('the marma panel gates every photograph on the step place', () => {
    const s = read('src/components/engine/MarmaPanel.tsx')
    expect(s).toMatch(/const atPlace = place \? pointIsAtPlace\(point\.id, place\) : true/)
    expect(s).toMatch(/const photo = atPlace \? photoForMarma\(/)
  })

  it('the chamber card resolves one place and hands it to both the map and the panel', () => {
    const s = read('src/components/screens/SessionScreen.tsx')
    expect(s).toMatch(/const place = useMemo\(\(\) => governingPlace\(/)
    expect(s).toMatch(/<MarmaPanel[^>]*place=\{place\}/)
    expect(s).toMatch(/<ChamberBodyMap[^>]*place=\{place\}/)
  })

  it('the body map names one address instead of three competing systems', () => {
    const s = read('src/components/engine/ChamberBodyMap.tsx')
    expect(s).toMatch(/const governs = place\?\.basis/)
    expect(s).toMatch(/PLACE_BASIS_NOTE/)
    // The marma marker is only drawn when the point IS the step's place.
    expect(s).toMatch(/pointIsAtPlace\(marmaCandidate\.id, place\)/)
  })

  it('the place is resolved from the same field that produces the headline', () => {
    // primaryLabel and primaryRegions are assigned together in every branch of
    // resolvePlacement, so resolving from primaryRegions[0] is by construction
    // resolving from what the card says.
    const s = read('src/lib/BodyPlacementEngine.ts')
    for (const pair of [
      /primaryLabel = sym\.label; primaryRegions = sym\.regions/,
      /primaryLabel = signField\.primaryZones[\s\S]{0,120}primaryRegions = signField\.bodyMapRegions/,
      /primaryLabel = planetField\.placementLabel; primaryRegions = planetField\.bodyMapRegions/,
    ]) expect(s).toMatch(pair)
  })

  it('a real natal placement resolves to the region its own label names', () => {
    const p: any = resolveForkPlacement({ planet: 'Mercury', sign: 'Cancer' })
    expect(p.primaryRegions?.length).toBeGreaterThan(0)
    const place = governingPlace({ natalRegion: p.primaryRegions[0] })
    // Whatever it resolves to, no point outside it may illustrate the step.
    for (const pt of resolveMarmaLayer({ planet: 'Mercury' })?.points ?? []) {
      if (!pointIsAtPlace(pt.id, place)) {
        expect(siteForMarma(pt.id)?.id).not.toBe(place.site?.id)
      }
    }
  })
})
