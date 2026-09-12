/**
 * ASTRYX — THE BODY SITE REGISTER
 * ════════════════════════════════════════════════════════════════════════════
 * SHA, 2026-09-12.
 *
 * THE PROBLEM THIS SOLVES
 * Five chamber sessions decide where the fork goes using five different systems:
 * the natal chart, the anatomical ladder, the feet-up sweep, the chakra centres
 * and the marma points. Each names the same physical places differently, and
 * nothing was shared between them but a raw {x,y}. The placement photographs
 * were commissioned from ONE of those systems (marma), so they could only ever
 * be correct in one session out of five — and the body map, driven from yet
 * another source, agreed with none of them.
 *
 * THE RULE
 *   A photograph shows A PLACE ON A BODY.
 *   The system is only the REASON you chose that place.
 *
 * So imagery and anchors key to the anatomical SITE, never to a system's name
 * for it. The front of the knee is the same photograph whether you arrived
 * there by Saturn's rulership, the Capricorn rung of the ladder, or the Janu
 * marma. Only the caption changes. One site, one anchor, one picture, one orb.
 *
 * THE DISCIPLINE GATE
 * Every photograph is stamped `contact` or `field`. Every step resolves its own
 * discipline through MarmaEngine, which is monotone and only ever TIGHTENS. A
 * contact photograph can never be shown on a step that resolved to a sweep —
 * mechanically, not by anyone's judgement. Where they disagree the map shows
 * alone, which is the rule already written at the top of placementPhotos.json:
 * never a wrong picture rather than none.
 */

import register from '@/data/bodySites.json'
import photoFile from '@/data/placementPhotos.json'
import type { MarmaApplication } from '@/lib/MarmaEngine'

export type SiteView = 'anterior' | 'posterior'
/** What the body itself permits at this site, before the engine tightens it. */
export type SiteDiscipline = 'contact' | 'field' | 'fieldOnly'

export interface BodySite {
  id: string
  name: string
  short: string
  view: SiteView
  discipline: SiteDiscipline
  anchor: { x: number; y: number }
  /** The marma point that lives at this site, where one does. */
  marma: string | null
  paired: boolean
}

export interface PlacementPhoto {
  file: string
  alt: string
  /** What the picture SHOWS — contact means the stem is touching. */
  discipline: 'contact' | 'field'
}

const SITES: BodySite[] = (register as any).sites
const MARMA_TO_SITE: Record<string, string> = (register as any).marmaToSite
const CHAKRA_TO_SITE: Record<string, string> = (register as any).chakraToSite
const REGION_TO_SITE: Record<string, string> = (register as any).regionToSite
const PHOTOS: Record<string, PlacementPhoto> = (photoFile as any).photos

const BY_ID = new Map<string, BodySite>(SITES.map((s) => [s.id, s]))

export function allBodySites(): BodySite[] {
  return SITES
}

export function siteById(id: string | null | undefined): BodySite | null {
  return id ? BY_ID.get(id) ?? null : null
}

/** The site a marma point sits at. Several points can share one site — three
 *  neck points all live at the base of the skull, and one picture serves them. */
export function siteForMarma(marmaId: string | null | undefined): BodySite | null {
  return siteById(marmaId ? MARMA_TO_SITE[marmaId] : null)
}

/** The site a chakra centre sits at. Its marma doorway may sit elsewhere; that
 *  is an alternate, never the headline — see _chakraNote in bodySites.json. */
export function siteForChakra(center: string | null | undefined): BodySite | null {
  return siteById(center ? CHAKRA_TO_SITE[center.trim()] : null)
}

/** A marma application narrows to what a photograph can honestly depict.
 *  `fieldOnly` and `field` both need a picture showing an unmistakable gap. */
export function disciplineOf(application: MarmaApplication | SiteDiscipline): 'contact' | 'field' {
  return application === 'weighted' || application === 'contact' ? 'contact' : 'field'
}

/**
 * THE GATE. Returns a photograph only when it depicts the discipline this step
 * actually resolved to. Pass the step's RESOLVED application (post-engine), not
 * the site's default — that is the whole point: the engine may have tightened a
 * contact point to a sweep for this person, and the contact picture must then
 * disappear rather than contradict the instruction beside it.
 */
export function photoForSite(
  siteId: string | null | undefined,
  resolved: MarmaApplication | SiteDiscipline,
): PlacementPhoto | null {
  if (!siteId) return null
  const photo = PHOTOS[siteId]
  if (!photo) return null
  return photo.discipline === disciplineOf(resolved) ? photo : null
}

/** Convenience for the marma panel, which still speaks in point ids. */
export function photoForMarma(
  marmaId: string | null | undefined,
  resolved: MarmaApplication,
): PlacementPhoto | null {
  return photoForSite(siteForMarma(marmaId)?.id, resolved)
}

/** Which sites still have no photograph — used by the coverage test. */
export function sitesWithoutPhoto(): BodySite[] {
  return SITES.filter((s) => !PHOTOS[s.id])
}

// ─── THE ONE-PLACE RULE ──────────────────────────────────────────────────────
// SHA, 2026-09-12:
//
//   "if you are in the natal calibration, the only pictures that should be shown
//    are pictures that match the body map. if it says shoulder, then only
//    shoulder pictures should apply, if it says knee, only pictures that match
//    the knee should apply."
//
// She is right and it is simple: **a session step has ONE place.** The card names
// it, the body map marks it, and the only picture shown is a picture of that
// place.
//
// What was going wrong: a Natal Calibration step took its HEADLINE from the
// planet's natal body zone (Mercury in Cancer → "Chest / Breasts / Stomach") and
// its PICTURES from `resolveMarmaLayer(planet)`, which returns the fork's own
// four marma points — primary, secondary, chakra doorway, counterweight — at
// four unrelated sites. So the card said chest and showed Krikatika and Vidhuram,
// which are neck points. Every picture was correct FOR ITS OWN POINT and wrong
// for the step. Nothing compared the two.

/** The site a body-map region IS. Unmapped regions (systemic fields, the whole
 *  spine, a jaw with no photographed site) return null, and a step there shows
 *  NO photograph rather than a neighbouring one. */
export function siteForRegion(region: string | null | undefined): BodySite | null {
  return siteById(region ? REGION_TO_SITE[region.trim().toLowerCase()] : null)
}

/** What kind of session decided this step's place — used only for the reason
 *  string, so a step can always say WHY its place is its place. */
export type PlaceBasis = 'chakra' | 'marma' | 'register' | 'natal' | 'traditional' | 'none'

export interface GoverningPlace {
  site: BodySite | null
  basis: PlaceBasis
  /** The region token the place was resolved from, for diagnostics. */
  region: string | null
}

/**
 * THE GOVERNING PLACE of a step — the single site every picture on that step
 * must depict. Resolution order matches how the session itself decides:
 *
 *   chakra session   → the centre's own fixed anatomical point
 *   marma session    → the step's named point
 *   register step    → the site the ladder rung owns (Full Body / Full Spectrum)
 *   natal calibration→ the NATAL region, because that is what the card names
 *   otherwise        → the traditional region
 *
 * Returns a null site when the place has no photographed site. That is a
 * correct answer, not a failure: the body map still shows where it is.
 */
export function governingPlace(input: {
  chakraCenter?: string | null
  marmaPointId?: string | null
  registerSiteId?: string | null
  natalRegion?: string | null
  traditionalRegion?: string | null
}): GoverningPlace {
  if (input.chakraCenter) {
    return { site: siteForChakra(input.chakraCenter), basis: 'chakra', region: null }
  }
  if (input.marmaPointId) {
    return { site: siteForMarma(input.marmaPointId), basis: 'marma', region: null }
  }
  if (input.registerSiteId) {
    return { site: siteById(input.registerSiteId), basis: 'register', region: null }
  }
  if (input.natalRegion) {
    return { site: siteForRegion(input.natalRegion), basis: 'natal', region: input.natalRegion }
  }
  if (input.traditionalRegion) {
    return { site: siteForRegion(input.traditionalRegion), basis: 'traditional', region: input.traditionalRegion }
  }
  return { site: null, basis: 'none', region: null }
}

/**
 * Does this marma point sit at the step's governing place? Only points that do
 * may show a photograph. A point somewhere else is a real alternate and still
 * worth naming — it just cannot illustrate a step it is not part of.
 */
export function pointIsAtPlace(
  marmaId: string | null | undefined,
  place: GoverningPlace | BodySite | null,
): boolean {
  const siteId = place && 'site' in (place as GoverningPlace)
    ? (place as GoverningPlace).site?.id
    : (place as BodySite | null)?.id
  if (!siteId) return false
  return siteForMarma(marmaId)?.id === siteId
}
