/**
 * Astryx Engine — Main Protocol Generator
 *
 * Calls /api/chart for real natal positions, then builds
 * the complete multi-sensory protocol from the result.
 */

import type {
  IntakeData, ProtocolOutput, DominantPattern, DiagnosticOutput,
  CellSaltPrescription, ActiveTransit, SymptomRouting, UnifiedPrescription,
  ActivePlanet,
  SacredBotanical, CrystalExpanded, LotusEntry, StarterKit, SacredFork,
  SignalHierarchy, SignalTier, PolarityResultLike, PolarityStateLike,
  EnvironmentLayer, ReasoningTrace,
} from '@/types'
import { signalWord } from '@/lib/signalCopy'
import planetsData from '@/data/planets.json'
import aspectsData from '@/data/aspects.json'
import signsData from '@/data/signs.json'
import colorsData from '@/data/colors.json'
import geometryData from '@/data/geometry.json'
import soapTemplates from '@/data/soap-templates.json'
import scentsData from '@/data/scents.json'
import herbsData from '@/data/herbs.json'
import bodyProtocolsData from '@/data/body-protocols.json'
import planetaryAnchors from '@/data/planetary-anchors.json'
import symptomsData from '@/data/symptoms.json'
// Remedy Polarity Engine — Phase B integration
import {
  determinePolarity,
  type PolarityResult,
  type CorrectiveProtocol,
} from '@/lib/RemedyPolarityEngine'
// Narrative + intention parser (CORRECT & FINISH Directive · Fix 4) — makes the
// user's free-text check-in and stated intention actually shape the calibration.
import { parseNarrative, parseIntention } from '@/lib/NarrativeSignalParser'
import { intentionPlanet as intentionPlanetFor } from '@/lib/chamber/intentionMap'
// Directive S — body-zone axis separation (WHERE=sign, WHAT=planet, state) +
// the Reflex engine (LOCAL + opposite/square reflex + planet-anatomy placement).
import { resolveZoneSignals, type ZoneSignal } from '@/lib/bodyZoneResolver'
import { computeReflex, signForHouse, type ReflexZoneSet } from '@/lib/ReflexEngine'
// v3 — symptom-routed cell-salt facet display + domain-overlap routing/scoring.
import { resolveSymptomSalt, SALT_KEYNOTES } from '@/lib/cellSaltKeynotes'
// Sacred Extension Layer — five proprietary data libraries
import sacredBotanicalsData from '@/data/sacredBotanicals.json'
import crystalsExpandedData from '@/data/crystalsExpanded.json'
import lotusSpectrumData    from '@/data/lotusSpectrum.json'
import starterKitsData      from '@/data/starterKits.json'
import sacredTonesData      from '@/data/sacredTones_nervousSystem.json'
// Diagnostic Layer — the car-diagnostic translation
import cellSaltsData        from '@/data/cellSalts.json'
import medicalAstrologyData from '@/data/medicalAstrology.json'
import type { DominantPatternData } from '@/lib/ephemeris'
// FIX 1A — the small presentational helpers live in the client-safe module; the
// heavy engine + proprietary data stay here (server-only).
import { PLANET_COLORS, PLANET_ELEMENT, feltStateLanguage, type FeltLanguage } from '@/lib/engineClient'

// FIX 1A (Security Directive v1.1) — SERVER-ONLY tripwire. This module carries
// the deterministic engine and the proprietary data corpus (medicalAstrology,
// remedyPolarity, etc.). It must never enter the client bundle: client code
// imports render helpers from '@/lib/engineClient' and calls '/api/protocol'.
if (typeof window !== 'undefined') {
  throw new Error('engine.ts is server-only — import client-safe helpers from @/lib/engineClient and call /api/protocol.')
}

// ─── SYMPTOM VOCABULARY BRIDGE ────────────────────────────────
// The intake UI (planet-intake-map.json) emits free-text symptom TAGS such as
// "anger inflammation" or "chronic tension". The Remedy Polarity Engine and the
// symptom scorer both match against the snake_case SLUGS in symptoms.json
// ("anger", "inflammation", "flare_ups", ...). Those two vocabularies never
// matched, so determinePolarity always returned "balanced" and no corrective
// chamber was ever produced. This map bridges the two so symptoms actually
// drive the polarity state. Deterministic — static lookup, no randomness.
const SYMPTOMS = symptomsData as Array<{
  symptom: string
  related_planets?: string[]
  related_signs?: string[]
  weight?: number
  state_signal?: string
}>
const SYMPTOM_SLUGS = new Set(SYMPTOMS.map((s) => s.symptom))

const INTAKE_TAG_TO_SLUGS: Record<string, string[]> = {
  // Sun
  'depleted identity':              ['low_vitality'],
  'low energy':                     ['low_energy'],
  'loss of purpose':                ['poor_confidence', 'low_vitality'],
  // Moon
  'emotional instability':          ['mood_instability', 'emotional_overwhelm'],
  'sleep disruption':               ['insomnia', 'mood_instability'],
  'emotional depletion':            ['emotional_numbness', 'isolation'],
  // Mercury
  'mental fog':                     ['brain_fog'],
  'communication blocks':           ['communication_blockage'],
  'nervous system overstimulation': ['nervous_overstimulation', 'overthinking'],
  // Venus
  'relationship tension':           ['stagnation'],
  'low self-worth':                 ['lack_of_pleasure'],
  'financial stress':               ['lack_of_pleasure'],
  // Mars
  'stagnant drive':                 ['frustration', 'tension'],
  'anger inflammation':             ['anger', 'inflammation'],
  'depleted drive':                 ['low_drive', 'low_motivation'],
  // Jupiter
  'scarcity mindset':               ['pessimism'],
  'excess overextension':           ['excess_appetite', 'indulgence'],
  'loss of faith':                  ['pessimism'],
  // Saturn
  'fear burden':                    ['fear'],
  'boundary issues':                ['weak_boundaries'],
  'chronic tension':                ['rigidity', 'tightness'],
  // Uranus
  'sudden disruption':              ['nervous_overstimulation'],
  'electric restlessness':          ['nervous_overstimulation', 'tremors'],
  'liberation urge':                [],
  // Neptune
  'spiritual fog':                  ['fog', 'confusion'],
  'disrupted intuition':            ['confusion'],
  'dissolution loss of self':       ['dissociation', 'escapism'],
  // Pluto
  'deep transformation':            [],
  'power control dynamics':         ['control_issues'],
  'death rebirth cycle':            [],
}

/**
 * Translate raw intake symptom inputs into canonical symptoms.json slugs.
 * Resolution order per input:
 *   1. Already a known slug → keep as-is.
 *   2. Explicit intake-tag map → expand to mapped slugs.
 *   3. Generic fallback → tokenize and substring-match against known slugs
 *      (catches free-text / future tags without a hard map entry).
 * Returns a de-duplicated array of canonical slugs.
 */
export function normalizeSymptoms(raw: string[] | undefined): string[] {
  if (!raw?.length) return []
  const out = new Set<string>()
  for (const input of raw) {
    const tag = input.toLowerCase().trim()
    if (!tag) continue
    if (SYMPTOM_SLUGS.has(tag)) { out.add(tag); continue }
    const underscored = tag.replace(/\s+/g, '_')
    if (SYMPTOM_SLUGS.has(underscored)) { out.add(underscored); continue }
    const mapped = INTAKE_TAG_TO_SLUGS[tag]
    if (mapped) { mapped.forEach((s) => out.add(s)); continue }
    // Generic fallback — match individual tokens against known slugs.
    const tokens = tag.split(/[^a-z0-9]+/).filter(Boolean)
    for (const entry of SYMPTOMS) {
      const slug = entry.symptom
      if (slug === underscored || tokens.includes(slug)) out.add(slug)
    }
  }
  return Array.from(out)
}

/** Planets implicated by a set of canonical symptom slugs (via symptoms.json). */
function planetsImplicatedBySymptoms(canonicalSymptoms: string[]): string[] {
  const planets = new Set<string>()
  for (const slug of canonicalSymptoms) {
    const entry = SYMPTOMS.find((s) => s.symptom === slug)
    entry?.related_planets?.forEach((p) => planets.add(p))
  }
  return Array.from(planets)
}

// ─── PLANET COLORS ────────────────────────────────────────────
// PLANET_COLORS → moved to @/lib/engineClient (FIX 1A), imported above.

// ─── SACRED LAYER PLANET → FORK MAP ──────────────────────────
// The base engine uses canonical planet names. The sacredTones JSON file
// uses fork names, where the Moon is voiced as "Full Moon". This map is
// used by resolveSacredLayer() to look up the fork by dominant planet.
const PLANET_TO_FORK: Record<string, string> = {
  Sun:     'Sun',
  Moon:    'Full Moon',
  Mercury: 'Mercury',
  Venus:   'Venus',
  Mars:    'Mars',
  Jupiter: 'Jupiter',
  Saturn:  'Saturn',
  Uranus:  'Uranus',
  Neptune: 'Neptune',
  Pluto:   'Pluto',
}

// ─── SACRED LAYER RESOLVER ────────────────────────────────────
// Resolves the five extension JSON files into a single bundle keyed off
// the dominant planet of the user's chart. Returns nulls (never undefined)
// for missing rows so the UI can use simple null-checks.
function resolveSacredLayer(dominantPlanet: string) {
  const botanicals = sacredBotanicalsData as SacredBotanical[]
  const crystals   = crystalsExpandedData  as CrystalExpanded[]
  const lotus      = lotusSpectrumData     as LotusEntry[]
  const kits       = starterKitsData       as StarterKit[]
  const forks      = sacredTonesData       as SacredFork[]

  const forkName     = PLANET_TO_FORK[dominantPlanet] ?? dominantPlanet
  const botanical    = botanicals.find(b => b.planet === dominantPlanet) ?? null
  const crystal      = crystals.find(c => c.planet === dominantPlanet) ?? null
  const dominantFork = forks.find(f => f.planet === forkName) ?? null

  // Default kit — the universal "Planetary Sign Kit" (one variant per sun
  // sign). When a more specific kit is added later, prefer that lookup here.
  const starterKit =
    kits.find(k => k.kitId === 'planetary-sign-kit') ??
    kits[0] ??
    null

  return {
    botanical,
    crystal,
    lotusSpectrum: lotus,
    dominantFork,
    starterKit,
  }
}

// ─── DIAGNOSTIC LAYER RESOLVER ────────────────────────────────
// Builds the car-diagnostic translation: cosmic mechanism → body layer →
// action layer. Powered by medicalAstrology.json (planet anatomy) and
// cellSalts.json (sign-based mineral prescription + Bonacci gestation rule).
//
// Returns null if data lookup fails so UI can null-check cleanly.

function shapeCellSaltPrescription(
  saltEntry: any,
  reason?: string,
): CellSaltPrescription | null {
  if (!saltEntry) return null
  return {
    sign:                saltEntry.sign,
    saltName:            saltEntry.cellSalt?.commonName  ?? '',
    saltShort:           saltEntry.cellSalt?.shortName   ?? '',
    epithet:             saltEntry.cellSalt?.epithet     ?? '',
    plainLanguageSignal: saltEntry.plainLanguageSignal,
    foodSources:         saltEntry.foodSources,
    dosing:              saltEntry.dosing,
    affirmation:         saltEntry.esoteric?.affirmation,
    color:               saltEntry.color,
    reason,
  }
}

// ── Transit interpretation lookup ──────────────────────────
// For an active transit (e.g. Saturn transiting natal Moon), pull the
// matching effect/intervention text from medicalAstrology.json. The
// transitInterpretation block on each planet has a transitToNatalPlanets
// array — we match the transiting planet's entries by .to === natalPlanet.
//
// v4.1 Fix 1 — the pair table now covers ALL 10×10 planet pairs, and the
// description is COMPOSED: an aspect lens (how the contact moves — friction,
// flow, fusion…) leads the pair copy (what the combination means). Every
// pair × aspect the transit engine can emit renders specific text; the
// data-copy lint fails the build if a pair or lens ever goes missing.
function lookupTransitInterpretation(transit: any) {
  if (!transit) return undefined
  const planetEntry = (medicalAstrologyData as any).planets?.find(
    (p: any) => p.planet === transit.transitingPlanet,
  )
  if (!planetEntry) return undefined

  const transitsList = planetEntry.transitInterpretation?.transitToNatalPlanets ?? []
  const match = transitsList.find((t: any) => t.to === transit.natalPlanet)
  if (!match) return undefined

  const lens = (medicalAstrologyData as any).aspectLenses?.[
    String(transit.aspect ?? '').toLowerCase()
  ]
  const pairEffect = match.effect ?? ''
  const effect = lens && pairEffect
    ? `${lens} ${pairEffect.charAt(0).toLowerCase()}${pairEffect.slice(1)}`
    : pairEffect

  return {
    effect,
    intervention: match.intervention ?? '',
    duration:     match.duration     ?? planetEntry.transitInterpretation?.transitDurationDays ?? '',
  }
}

/**
 * v4.2 FIX 3 — render-time transit copy. Display surfaces call this instead of
 * reading the interpretation BAKED into the persisted protocol, so copy edits
 * (compliance rewrites, register passes) reach every user on their next render
 * — no regeneration needed. Falls back to the baked text for safety. The
 * deterministic core (signal, sequence, frequencies) stays persisted untouched;
 * this derives DISPLAY TEXT only, from the current data files.
 */
// freshTransitInterpretation → moved to @/lib/engineClient (FIX 1A). The server
// bakes each transit's interpretation via shapeActiveTransit (below), so the
// client reads the baked copy and medicalAstrology.json stays server-only.

// ── Directive H.0.4 — landmark life events ──
// A transiting planet returning to (or striking) a personal natal point on a
// multi-year cycle is a RECKONING, not a generic transit. Detect and elevate.
// (Nodal Return ~18.6y and Chiron Return ~50y need the lunar nodes / Chiron in
//  the chart engine — not computed yet. TODO: add when ephemeris exposes them.)
function detectLifeEvent(t: any): ActiveTransit['lifeEvent'] {
  if ((t.aspect ?? '').toLowerCase() !== 'conjunction') return undefined
  const tp = t.transitingPlanet, np = t.natalPlanet
  if (tp === 'Saturn' && np === 'Saturn') return {
    key: 'saturn-return', label: 'Saturn Return',
    description: 'Transiting Saturn has come back to where it stood at your birth — a structural reckoning that comes roughly once every 29 years. Foundations are audited: what is real holds, what is borrowed falls away.',
  }
  if (tp === 'Saturn' && np === 'Sun') return {
    key: 'saturn-sun', label: 'Saturn on your Sun',
    description: 'Transiting Saturn is sitting on your natal Sun — a weight-bearing season for identity and vitality that classical sources associate with consolidation and earned authority.',
  }
  if (tp === 'Saturn' && np === 'Moon') return {
    key: 'saturn-moon', label: 'Saturn on your Moon',
    description: 'Transiting Saturn is sitting on your natal Moon — a season where emotional needs meet structure; classically associated with sobering, maturing inner work.',
  }
  if (tp === 'Jupiter' && np === 'Jupiter') return {
    key: 'jupiter-return', label: 'Jupiter Return',
    description: 'Transiting Jupiter has returned to its birth position — a ~12-year expansion gate. The themes that grow you are re-opened for the next cycle.',
  }
  return undefined
}

function shapeActiveTransit(t: any): ActiveTransit {
  const lifeEvent = detectLifeEvent(t)
  return {
    transitingPlanet:    t.transitingPlanet,
    transitingSign:      t.transitingSign,
    transitingRetrograde: !!t.transitingRetrograde,
    natalPlanet:    t.natalPlanet,
    natalSign:      t.natalSign,
    aspect:         t.aspect,
    orb:            t.orb,
    exactness:      t.exactness,
    applying:       !!t.applying,
    daysToExact:    t.daysToExact ?? 0,
    // Landmark events outrank generic transits — never buried (H.0.4).
    weight:         (t.weight ?? 0) + (lifeEvent ? 100 : 0),
    interpretation: lookupTransitInterpretation(t),
    lifeEvent,
  }
}

// ── Unified Prescription Composer ──────────────────────────
// For a given planet, pulls all five sense channels + crystal + cell salt
// + botanical + tuning fork from existing data files. Returns ONE cohesive
// prescription card so the protocol coheres around a single signature
// instead of fragmenting across five disconnected blocks.

// Inverse lookup — scents and herbs are keyed by name with
// `planetary_affinities[]` arrays. Returns all entries that include
// the target planet, ordered by affinity priority (planet listed first
// in the affinities array signals primary rulership).
function scentsForPlanet(planet: string) {
  const all = (scentsData as any[]).filter((s) =>
    Array.isArray(s.planetary_affinities) && s.planetary_affinities.includes(planet),
  )
  // Prioritize entries where this planet appears first in affinities (primary ruler)
  return all.sort((a, b) => {
    const ai = a.planetary_affinities.indexOf(planet)
    const bi = b.planetary_affinities.indexOf(planet)
    return ai - bi
  })
}

function herbsForPlanet(planet: string) {
  const all = (herbsData as any[]).filter((h) =>
    Array.isArray(h.planetary_affinities) && h.planetary_affinities.includes(planet),
  )
  return all.sort((a, b) => {
    const ai = a.planetary_affinities.indexOf(planet)
    const bi = b.planetary_affinities.indexOf(planet)
    return ai - bi
  })
}

function composeUnifiedPrescription(
  planet: string,
  source: 'dominant' | 'symptom' | 'transit',
  triggerLabel: string,
  polarity?: PolarityResult,
): UnifiedPrescription | null {
  // ── Polarity correction context (Planet ≠ Remedy) ──
  // When the planet is in a symptom-driven imbalanced state, every channel must
  // move toward the REGULATOR, not deeper into the dominant pattern. The
  // corrective herbs / scents / breath / colors come from remedyPolarity.json
  // (already authored per planet × state). This mirrors the buildXProtocol
  // family so the unified card corrects in lockstep with the chamber.
  const correcting = shouldApplyPolarity(polarity)
  const cp         = correcting ? polarity!.protocol : null
  const regulator  = cp?.regulator_planets?.[0] ?? null
  // Botanical / crystal / fork / sound re-key to the regulator when correcting.
  const sacredKey  = regulator ?? planet

  // Oneirogen / psychoactive backstop: never serve dream-deepening botanicals or
  // herbs for an EXCESS (over-active / dissociative) state, even if a mapping
  // surfaces one (e.g. Neptune-excess must never return mugwort or blue lotus).
  const ONEIROGENS = ['mugwort', 'blue lotus', 'wormwood', 'salvia', 'kava', 'valerian']
  const isOneirogen = (name?: string | null) =>
    !!name &&
    correcting &&
    polarity!.dominant_state === 'excess' &&
    ONEIROGENS.some((o) => name.toLowerCase().includes(o))

  // ── Pull from every data file using planet as the universal key ──
  const planetData = (planetsData as any[]).find((p) => p.planet === planet)
  // Scents and herbs use inverse-affinity lookup (different schema)
  const scentMatches = scentsForPlanet(planet)
  const herbMatches  = herbsForPlanet(planet)
  const primaryScent = scentMatches[0]
  const primaryHerb  = herbMatches[0]
  const bodyData   = (bodyProtocolsData as any[]).find((b) => b.planet === planet)
  const colorData  = (colorsData as any[]).find((c) => c.planet === planet)
  const anchor     = (planetaryAnchors as any[]).find((a) => a.planet === planet)
  const medAstro   = (medicalAstrologyData as any).planets?.find((p: any) => p.planet === planet)

  // Sound frequency single-source-of-truth: regulator anchor when correcting, so
  // the Results card and the Chamber play (and label) the SAME frequency.
  const soundAnchor = correcting
    ? ((planetaryAnchors as any[]).find((a) => a.planet === sacredKey) ?? anchor)
    : anchor
  const soundPlanet = correcting ? sacredKey : planet

  // Botanical + crystal re-key to the regulator under correction; oneirogen-gated.
  let   botanical  = (sacredBotanicalsData as SacredBotanical[]).find((b) => b.planet === sacredKey) ?? null
  if (isOneirogen(botanical?.sacredBotanical)) botanical = null
  const crystal    = (crystalsExpandedData as CrystalExpanded[]).find((c) => c.planet === sacredKey) ?? null

  const forkName   = PLANET_TO_FORK[soundPlanet] ?? soundPlanet
  const fork       = (sacredTonesData as SacredFork[]).find((f) => f.planet === forkName) ?? null

  // Cell salt via the planet's ruling sign
  const ruledSign  = medAstro?.rulingSigns?.[0]
  const saltRaw    = ruledSign
    ? (cellSaltsData as any).cellSalts?.find((c: any) => c.sign === ruledSign)
    : null
  const mineral    = shapeCellSaltPrescription(
    saltRaw,
    `${planet} rules ${ruledSign}. This is the mineral your body needs to recalibrate this signature.`,
  )

  // Need at least planet anchor + medical astrology to produce a coherent prescription
  if (!planetData && !anchor && !medAstro) return null

  // ── Headline & summary ──
  // Pull the actionable line from medicalAstrology.plainLanguageBridge.howToRestore
  // and trim to a clean 1–2 sentence summary.
  const restoreText = medAstro?.plainLanguageBridge?.howToRestore ?? ''
  const summary = restoreText
    .split('. ')
    .slice(0, 2)
    .join('. ')
    .replace(/\.?\s*$/, '.')

  // ── Corrective channel resolution (Planet ≠ Remedy) ──
  // Under correction, herbs/scents/breath/colors come from the corrective
  // protocol; otherwise from the planet's own affinities (existing behavior).
  const correctiveHerbs = correcting && cp!.herbs.length
    ? (cp!.herbs.filter((h) => !isOneirogen(h)).length
        ? cp!.herbs.filter((h) => !isOneirogen(h))
        : cp!.herbs)
    : []
  const tasteTea = correcting && correctiveHerbs.length
    ? `${planet} ${polarity!.dominant_state} corrective blend — featuring ${correctiveHerbs[0].replace(/_/g, ' ')}`
    : (primaryHerb?.herb
        ? `${planet} blend — featuring ${(primaryHerb.herb as string).replace(/_/g, ' ')}`
        : `${planet} blend`)
  const tasteIngredients = correcting && correctiveHerbs.length
    ? correctiveHerbs.slice(0, 4).map((h) => h.replace(/_/g, ' '))
    : herbMatches.slice(0, 4).map((h) => (h.herb as string).replace(/_/g, ' '))
  const tasteInstruction = correcting && correctiveHerbs.length
    ? `Brew as tea — ${cp!.support_style}. Sip during the session.`
    : (primaryHerb
        ? `Brew as ${primaryHerb.delivery?.[0] ?? 'tea'}. ${(primaryHerb.actions ?? []).join(', ')}. Sip during the session.`
        : 'Brew as tea and sip during the session.')
  const scentOils = correcting && cp!.scents.length
    ? cp!.scents.slice(0, 3)
    : scentMatches.slice(0, 3).map((s) => s.scent)
  const scentInstruction = correcting
    ? `${cp!.corrective_direction.slice(0, 3).join(', ') || 'Clarify & balance'} — diffuse or inhale for 5–10 minutes during the session.`
    : (primaryScent
        ? `${(primaryScent.actions ?? []).join(', ')} — ${primaryScent.delivery?.join(' or ') ?? 'diffuse or inhale'} for 5–10 minutes during the session.`
        : 'Diffuse or inhale directly for 5–10 minutes during the session.')
  const bodyBreath  = correcting ? breathLabel(cp!.breath) : breathLabel(bodyData?.breath ?? '')
  const sightColors = correcting && cp!.color_palette.length
    ? cp!.color_palette.slice(0, 3)
    : ((colorData?.primary_colors as string[] | undefined) ?? [])

  // ── Five sensory channels — corrected toward the regulator when imbalanced ──
  const fiveSenses = {
    sound: {
      fork:        fork?.planet ?? `${soundPlanet} fork`,
      hz:          soundAnchor?.hz ?? 0,
      note:        fork?.note,
      instruction: soundAnchor?.hz
        ? `Play ${soundAnchor.hz} Hz tone for 5–10 minutes${fork ? `, applied at the ${fork.boneApplicationPoint || 'body center'}` : ''}.`
        : 'Use the planet-tuned audio session for 5–10 minutes.',
    },
    scent: {
      oils:        scentOils,
      delivery:    primaryScent?.delivery?.[0] ?? 'diffuser',
      instruction: scentInstruction,
    },
    taste: {
      tea:         tasteTea,
      ingredients: tasteIngredients,
      instruction: tasteInstruction,
    },
    body: {
      breath:      bodyBreath,
      movement:    humanize(bodyData?.movement) || 'Gentle release',
      placement:   humanize(bodyData?.posture) || 'Upright, spine aligned',
      orientation: bodyData?.orientation ? humanize(bodyData.orientation) : undefined,
    },
    sight: {
      colors:      sightColors,
      instruction: `Soft ambient light in ${sightColors[0] || 'planet color'} tones. Reduce screen brightness.`,
    },
  }

  // ── Collect safety notes from all referenced data sources ──
  const safetyNotes: string[] = []
  if (botanical?.safetyNote) safetyNotes.push(`Botanical (${botanical.sacredBotanical}): ${botanical.safetyNote}`)
  if (crystal?.featuredCrystalData?.safetyNote)
    safetyNotes.push(`Crystal (${crystal.featuredCrystal}): ${crystal.featuredCrystalData.safetyNote}`)
  if (saltRaw?.safetyNote) safetyNotes.push(`Cell Salt (${saltRaw.cellSalt?.shortName}): ${saltRaw.safetyNote}`)
  // Universal cell salt note from _meta if not present per-salt
  if (!saltRaw?.safetyNote && (cellSaltsData as any)._meta?.safetyNote) {
    safetyNotes.push(`Cell Salts: ${(cellSaltsData as any)._meta.safetyNote}`)
  }
  // Malachite hard rule from CLAUDE.md — red warning everywhere
  if (
    crystal?.featuredCrystal?.toLowerCase().includes('malachite') ||
    crystal?.existingGems?.some((g) => g.toLowerCase().includes('malachite'))
  ) {
    safetyNotes.unshift(
      '⚠ MALACHITE WARNING — raw malachite contains toxic copper carbonate dust. Use ONLY polished and sealed pieces. Never for elixirs or ingestion.',
    )
  }

  // ── Integration note — how to weave all five senses together ──
  const integrationNote = [
    `Begin with sound: ${fiveSenses.sound.fork}${soundAnchor?.hz ? ` (${soundAnchor.hz} Hz)` : ''} for 3 minutes.`,
    `Layer scent — ${fiveSenses.scent.oils.slice(0, 2).join(' + ') || 'diffuse selected oils'}.`,
    `Sip ${fiveSenses.taste.tea}.`,
    `Breathe: ${bodyBreath}.`,
    crystal
      ? `Hold ${crystal.featuredCrystal} at ${crystal.featuredCrystalData?.bodyPlacement || 'the body center'}.`
      : '',
    `Soften vision into ${fiveSenses.sight.colors[0] || 'ambient light'}.`,
    correcting && cp!.avoid.length ? `Avoid: ${cp!.avoid.slice(0, 3).join(', ')}.` : '',
    'Allow 20-30 minutes. Observe what shifts.',
  ]
    .filter(Boolean)
    .join(' ')

  return {
    signature:    { planet, source, triggerLabel },
    prescription: {
      headline: correcting
        ? `${planet} Calibration Protocol — ${polarity!.dominant_state} correction`
        : `${planet} Calibration Protocol`,
      summary:  correcting
        ? `${polarity!.dominant_state[0].toUpperCase()}${polarity!.dominant_state.slice(1)} pattern detected — calibrating toward ${regulator} to balance, not amplify. ${cp!.corrective_direction.slice(0, 2).join('. ')}.`
        : (summary || `Five-channel sensory calibration tuned to ${planet}.`),
      duration: '20–30 minute session',
    },
    fiveSenses,
    mineral,
    botanical,
    crystal,
    fork,
    safetyNotes,
    integrationNote,
  }
}

// ── Symptom routing ────────────────────────────────────────
// User reports symptoms (e.g. "anxiety"). The engine normalizes them
// to rootCauseIndex keys in medicalAstrology.json, parses candidate
// planetary signatures, scores each against the natal chart + active
// transits, and returns the best-matched signature with its full
// diagnostic. This is the "symptom-first" diagnostic path that lets
// Astryx act as a translation engine: symptom → planetary cause → protocol.

// Keyword normalization — user's free-text/checkbox symptoms map to
// rootCauseIndex keys via substring matching. Order matters: more
// specific keys first.
const SYMPTOM_KEYWORD_MAP: Record<string, string[]> = {
  anxiety_general:         ['anxiety', 'anxious', 'worry', 'panic', 'nervous tension', 'fearful'],
  depression_general:      ['depression', 'depressed', 'sad', 'melancholy', 'hopeless', 'low mood', 'heavy'],
  money_block:             ['money', 'financial', 'wealth', 'scarcity', 'prosperity', 'abundance block'],
  exhaustion_burnout:      ['exhaust', 'fatigue', 'burnout', 'depleted', 'adrenal', 'tired'],
  inflammation_chronic:    ['inflammation', 'inflamed', 'chronic pain', 'arthritis', 'joint pain', 'swollen'],
  hormonal_imbalance:      ['hormonal', 'hormone', 'thyroid', 'menstrual', 'cycle irregular', 'pms'],
  digestive_dysregulation: ['digest', 'bloat', 'ibs', 'constipation', 'gut', 'reflux', 'stomach'],
  sleep_disturbance:       ['sleep', 'insomnia', 'cant sleep', 'cannot sleep', 'nightmare', 'restless'],
  skin_conditions:         ['skin', 'acne', 'eczema', 'psoriasis', 'rash', 'breakout'],
  fertility_reproductive:  ['fertility', 'reproductive', 'conception', 'infertile'],
}

const PLANET_NAMES = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'] as const

function normalizeSymptomKey(reported: string): string | undefined {
  const lower = reported.toLowerCase().replace(/_/g, ' ')
  for (const [key, keywords] of Object.entries(SYMPTOM_KEYWORD_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) return key
  }
  return undefined
}

function parseSignaturePlanets(sig: string): string[] {
  // Extract planet names from a free-text signature like "Mercury-Saturn"
  // or "Moon afflicted by Saturn or Uranus". Preserves order of first occurrence.
  return PLANET_NAMES.filter((p) => sig.includes(p))
}

function scoreSignature(
  planets: string[],
  pattern: DominantPattern,
  transits: ActiveTransit[],
  chart: any,
): { score: number; evidence: string[] } {
  let score = 0
  const evidence: string[] = []

  for (const p of planets) {
    if (pattern.planets.includes(p)) {
      score += 30
      evidence.push(`${p} is part of your dominant chart pattern`)
    }
    const asTransitor = transits.find((t) => t.transitingPlanet === p)
    if (asTransitor) {
      score += 20
      evidence.push(
        `${p} is currently transiting your natal ${asTransitor.natalPlanet} ` +
        `(${asTransitor.aspect}, ${asTransitor.applying ? 'applying' : 'separating'})`,
      )
    }
    const asNatal = transits.find((t) => t.natalPlanet === p)
    if (asNatal) {
      score += 15
      evidence.push(`Your natal ${p} is being activated by transiting ${asNatal.transitingPlanet}`)
    }
  }

  // Mutual natal aspect bonus — the strongest indicator of a stable signature
  if (planets.length >= 2 && Array.isArray(chart?.aspects)) {
    const [a, b] = planets
    const mutual = chart.aspects.find(
      (asp: any) =>
        (asp.planet1 === a && asp.planet2 === b) ||
        (asp.planet1 === b && asp.planet2 === a),
    )
    if (mutual) {
      score += 25
      evidence.push(`${a} and ${b} form a natal ${mutual.aspect} aspect in your chart`)
    }
  }

  return { score, evidence }
}

function routeSymptomsToDiagnosis(
  symptoms: string[],
  pattern: DominantPattern,
  transits: ActiveTransit[],
  chart: any,
): SymptomRouting[] {
  if (!symptoms?.length) return []

  const rootCauseIndex = (medicalAstrologyData as any).rootCauseIndex ?? {}
  const results: SymptomRouting[] = []

  for (const reported of symptoms) {
    const key   = normalizeSymptomKey(reported)
    if (!key) continue
    const entry = rootCauseIndex[key]
    if (!entry) continue

    // Score each primarySignature
    const signatures: string[] = entry.primarySignatures ?? []
    let best: { sig: string; planets: string[]; score: number; evidence: string[] } | null = null

    for (const sig of signatures) {
      const planets = parseSignaturePlanets(sig)
      if (!planets.length) continue
      const { score, evidence } = scoreSignature(planets, pattern, transits, chart)
      if (!best || score > best.score) best = { sig, planets, score, evidence }
    }
    if (!best) continue

    // Score subtypes the same way and pick the highest
    let bestSubtype: { key: string; desc: string; score: number } | null = null
    const typeBreakdown: Record<string, string> = entry.type_breakdown ?? {}
    for (const [subKey, subDesc] of Object.entries(typeBreakdown)) {
      const subPlanets = parseSignaturePlanets(subDesc)
      if (!subPlanets.length) continue
      const { score: subScore } = scoreSignature(subPlanets, pattern, transits, chart)
      if (!bestSubtype || subScore > bestSubtype.score) {
        bestSubtype = { key: subKey, desc: subDesc, score: subScore }
      }
    }

    // Build the diagnostic from the primary planet of the best signature
    const primaryPlanet = best.planets[0]
    const medAstro = (medicalAstrologyData as any).planets?.find(
      (p: any) => p.planet === primaryPlanet,
    )

    const rootCause = {
      headline:    `Your "${reported}" may be sourced from a ${best.sig} pattern`,
      cosmicLayer: best.evidence[0] ?? `${best.sig} signature active in your chart`,
      bodyLayer:   medAstro?.symptomSignatures?.whenStressed?.headline ?? '',
      actionLayer: medAstro?.plainLanguageBridge?.howToRestore        ?? '',
    }

    // v3 — recommended cell salt routes by somatic/emotional DOMAIN overlap (not
    // sign rulership alone) and DISPLAYS the keynote facet matching the symptom
    // (emotional vs physical) with an honest domain-overlap score. Prefers the
    // sign-ruled salt when it overlaps (astrological coherence), else re-routes.
    const ruledSign = medAstro?.rulingSigns?.[0]
    const signRuledRaw = ruledSign
      ? (cellSaltsData as any).cellSalts?.find((c: any) => c.sign === ruledSign)
      : null
    const resolvedSalt = resolveSymptomSalt(reported, ruledSign)
    let recommendedCellSalt: CellSaltPrescription | undefined
    if (resolvedSalt) {
      const chosenRaw = (cellSaltsData as any).cellSalts?.find((c: any) => c.sign === resolvedSalt.sign) ?? signRuledRaw
      const base = shapeCellSaltPrescription(chosenRaw, resolvedSalt.why)
      if (base) {
        const keynote = SALT_KEYNOTES[resolvedSalt.sign]
        recommendedCellSalt = {
          ...base,
          displaySignal: resolvedSalt.facetAxis === 'emotional'
            ? (keynote?.emotional ?? base.plainLanguageSignal)
            : base.plainLanguageSignal,
          matchReason: resolvedSalt.why,
          matchScore:  resolvedSalt.score,
          looseMatch:  resolvedSalt.loose,
        }
      }
    } else {
      // No known domain for this symptom — keep the sign-ruled salt (prior
      // behavior), framed as a traditional association.
      recommendedCellSalt = shapeCellSaltPrescription(
        signRuledRaw,
        `Mineral traditionally associated with ${primaryPlanet} (rules ${ruledSign}) — a reference for your ${reported}.`,
      ) ?? undefined
    }

    results.push({
      reportedSymptom:           reported,
      matchedRootCauseKey:       key,
      matchedSubtype:            bestSubtype?.key,
      matchedSubtypeDescription: bestSubtype?.desc,
      matchedSignature:          best.sig,
      matchedPlanets:            best.planets,
      primaryPlanet,
      activationScore:           Math.min(100, best.score),
      evidence:                  best.evidence,
      rootCause,
      recommendedCellSalt,
    })
  }

  return results
}

function buildDiagnostic(
  pattern: DominantPattern,
  chart: any,
  rawTransits: any[] = [],
  symptoms: string[] = [],
): DiagnosticOutput | undefined {
  const dominantPlanet = pattern.planets[0]

  // ── Chart context (Sun/Moon/Rising) ──
  const sunSign  = chart?.planets?.find((p: any) => p.planet === 'Sun')?.sign  || pattern.signs[0]
  const moonSign = chart?.planets?.find((p: any) => p.planet === 'Moon')?.sign
  const ascSign  = chart?.angles?.ascSign

  // ── Active transits — what's hitting the chart right now ──
  // Re-sort after shaping: H.0.4 life-event boosts can outrank the API order.
  const activeTransits   = rawTransits.map(shapeActiveTransit)
    .sort((a, b) => b.weight - a.weight)
  const headlineTransit  = activeTransits[0]

  // ── Symptom routing — translate reported symptoms into diagnoses ──
  const symptomRouting = routeSymptomsToDiagnosis(symptoms, pattern, activeTransits, chart)

  // ── Pull medical astrology entry for dominant planet ──
  const medAstro = (medicalAstrologyData as any).planets?.find(
    (p: any) => p.planet === dominantPlanet,
  )
  if (!medAstro) return undefined

  // ── Primary salt = salt of the dominant planet's ruling sign ──
  // (Falls back to user's sun sign if no rulership data.)
  const ruledSign  = medAstro.rulingSigns?.[0] || sunSign
  const primaryRaw = (cellSaltsData as any).cellSalts?.find((c: any) => c.sign === ruledSign)
  const primarySalt = shapeCellSaltPrescription(
    primaryRaw,
    `${dominantPlanet} rules ${ruledSign} — this is the active diagnostic mineral right now.`,
  )

  // ── Sun-sign salt = daily baseline for this user ──
  const sunRaw  = (cellSaltsData as any).cellSalts?.find((c: any) => c.sign === sunSign)
  const sunSalt = shapeCellSaltPrescription(
    sunRaw,
    `Your Sun-sign salt — the mineral your body consumes most rapidly and the daily foundation.`,
  )

  // ── Gestation deficiencies = the 3 innate baseline shortfalls (Bonacci rule) ──
  // deficienciesBySunSign returns array of strings like "Taurus (Nat Sulph)".
  const gestEntries: string[] =
    (cellSaltsData as any).deficiencyAlgorithm?.deficienciesBySunSign?.[sunSign] ?? []
  const gestationDeficiencies = gestEntries
    .map((entry) => {
      const signName = entry.split(' ')[0]
      const raw      = (cellSaltsData as any).cellSalts?.find((c: any) => c.sign === signName)
      return shapeCellSaltPrescription(
        raw,
        `Born in ${sunSign} — your body did not gestate through ${signName}, so this mineral is innately under-resourced.`,
      )
    })
    .filter((s): s is CellSaltPrescription => s !== null)

  // ── Build the three-layer translation ──
  const planet2  = pattern.planets[1] ?? pattern.planets[0]
  const sign1    = pattern.signs[0] ?? sunSign
  const sign2    = pattern.signs[1] ?? sign1
  const rootCause = {
    headline:    `${dominantPlanet} is the dominant signature in your chart right now`,
    cosmicLayer: `${dominantPlanet} ${pattern.aspect} ${planet2} in ${sign1}/${sign2}`,
    bodyLayer:   medAstro.symptomSignatures?.whenStressed?.headline ?? '',
    actionLayer: medAstro.plainLanguageBridge?.howToRestore        ?? '',
  }

  // ── Anatomy block ──
  const anatomy = {
    bodySystems:     medAstro.anatomy?.primaryBodySystems ?? [],
    organs:          medAstro.anatomy?.specificOrgans     ?? [],
    endocrineGlands: medAstro.anatomy?.endocrineGlands    ?? [],
    nervousSystem: {
      branch:            medAstro.anatomy?.nervousSystemPathway?.branch            ?? '',
      brainwaveAffinity: medAstro.anatomy?.nervousSystemPathway?.brainwaveAffinity ?? '',
    },
  }

  // ── Symptom signatures (when stressed) ──
  const stressed = medAstro.symptomSignatures?.whenStressed ?? {}
  const symptomSignatures = {
    headline:  stressed.headline  ?? '',
    physical:  stressed.physical  ?? [],
    emotional: stressed.emotional ?? [],
    mental:    stressed.mental    ?? [],
  }

  // ── Plain-language bridge ──
  const bridge = medAstro.plainLanguageBridge ?? {}
  const plainLanguage = {
    whatItGoverns:   bridge.whatItGoverns   ?? '',
    whenItsBalanced: bridge.whenItsBalanced ?? '',
    whenItsOff:      bridge.whenItsOff      ?? '',
    howToRestore:    bridge.howToRestore    ?? '',
  }

  return {
    sunSign,
    moonSign,
    risingSign: ascSign,
    dominantPlanet,
    activeTransits,
    headlineTransit,
    rootCause,
    anatomy,
    symptomSignatures,
    cellSaltPrescription: {
      // shapeCellSaltPrescription only returns null when input is null/undefined.
      // We provide safe fallbacks here in case the chart's sign isn't in cellSalts.json.
      primarySalt: primarySalt ?? ({} as CellSaltPrescription),
      sunSignSalt: sunSalt     ?? ({} as CellSaltPrescription),
      gestationDeficiencies,
    },
    symptomRouting: symptomRouting.length ? symptomRouting : undefined,
    plainLanguage,
  }
}

// ─── ASPECT DISPLAY LABELS ────────────────────────────────────
const ASPECT_LABELS: Record<string, string> = {
  conjunction:   'Fusion · Density',
  opposition:    'Polarity · Mirroring',
  trine:         'Flow · Harmony',
  square:        'Friction · Tension',
  sextile:       'Opportunity · Support',
  quincunx:      'Adjustment · Realignment',
  semisquare:    'Friction · Irritation',
  sesquisquare:  'Tension · Resistance',
}

// ─── GEOCODING ────────────────────────────────────────────────

// GeoResult + geocodeLocation → moved to @/lib/engineClient (FIX 1A).

// ─── CHART API CALL ───────────────────────────────────────────

interface ChartRequestPayload {
  birthDate: string
  birthTime: string
  latitude: number
  longitude: number
  tzOffset?: number
  symptoms?: string[]
}

async function fetchChart(payload: ChartRequestPayload): Promise<{
  dominantPattern: DominantPatternData
  chart: any
  transits: any[]
  symptomPlanets: string[]
} | null> {
  try {
    // FIX 1A — runEngine now runs server-side (inside /api/protocol), so the
    // internal chart call needs an ABSOLUTE base. Resolve it from the server env
    // (NEXTAUTH_URL in prod/dev, VERCEL_URL as a fallback). Determinism-neutral:
    // the chart response is identical regardless of how the URL is formed.
    const base =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'
    const res = await fetch(`${base}/api/chart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data.success) {
      console.error('Chart API error:', data.error)
      return null
    }
    return {
      dominantPattern: data.dominantPattern,
      chart:           data.chart,
      transits:        data.transits ?? [],
      symptomPlanets:  data.symptomPlanets ?? [],
    }
  } catch (err) {
    console.error('Chart fetch failed:', err)
    return null
  }
}

// ─── FALLBACK — seed-based approximation ─────────────────────
// Used only if the API call fails (no coords provided, network issue, etc.)

function fallbackPattern(intake: IntakeData): DominantPatternData {
  const dt = new Date(intake.birthDate || '1990-01-01')
  const seed = dt.getFullYear() * 10000 + (dt.getMonth() + 1) * 100 + dt.getDate()
  const planets = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']
  const aspects = ['conjunction','opposition','trine','square','sextile']
  const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']

  const p1 = planets[seed % planets.length]
  const p2Idx = (seed * 3 + 2) % planets.length
  const p2 = planets[p2Idx] !== p1 ? planets[p2Idx] : planets[(p2Idx + 1) % planets.length]
  const asp = aspects[seed % aspects.length]
  const s1 = signs[seed % 12]
  const s2 = signs[(seed * 7) % 12]

  const elemMap: Record<string,string> = {
    Aries:'Fire',Leo:'Fire',Sagittarius:'Fire',
    Taurus:'Earth',Virgo:'Earth',Capricorn:'Earth',
    Gemini:'Air',Libra:'Air',Aquarius:'Air',
    Cancer:'Water',Scorpio:'Water',Pisces:'Water',
  }
  const modMap: Record<string,string> = {
    Aries:'Cardinal',Cancer:'Cardinal',Libra:'Cardinal',Capricorn:'Cardinal',
    Taurus:'Fixed',Leo:'Fixed',Scorpio:'Fixed',Aquarius:'Fixed',
    Gemini:'Mutable',Virgo:'Mutable',Sagittarius:'Mutable',Pisces:'Mutable',
  }

  return {
    planet1: p1, planet2: p2, aspect: asp,
    signs: [s1, s2] as [string, string],
    houses: [1, 7] as [number, number],
    elementModality: `${elemMap[s1]||'Fire'} + ${elemMap[s2]||'Earth'} / ${modMap[s1]||'Cardinal'} + ${modMap[s2]||'Fixed'}`,
    confidenceScore: 72,
    orb: 2.5,
  }
}

// ─── BUILD DOMINANT PATTERN ───────────────────────────────────

function buildDominantPattern(raw: DominantPatternData): DominantPattern {
  const label = ASPECT_LABELS[raw.aspect] || 'Resonance Pattern'
  const aspectTitle = raw.aspect.charAt(0).toUpperCase() + raw.aspect.slice(1)

  return {
    title: `${raw.planet1} — ${raw.planet2} ${aspectTitle}`,
    subtitle: label,
    planets: [raw.planet1, raw.planet2],
    aspect: raw.aspect,
    signs: raw.signs,
    houses: raw.houses,
    element_modality: raw.elementModality,
    confidence_score: raw.confidenceScore,
  }
}

// ─── PROTOCOL BUILDERS ───────────────────────────────────────

// Default 5-phase session timeline (15 min = 900s). Used as fallback when
// the engine cannot derive durations from other inputs. Shared with
// VisualProtocol.animation_phases via the same name enum.
function defaultSessionPhases(p1Hz: number, p2Hz: number) {
  return [
    { name: 'entry'       as const, duration_seconds: 120, hz_focus: 136.10, intensity: 0.30, binaural_offset: 0 },
    { name: 'activation'  as const, duration_seconds: 180, hz_focus: p1Hz,   intensity: 0.65, binaural_offset: 1.6 },
    { name: 'peak'        as const, duration_seconds: 240, hz_focus: p1Hz,   intensity: 1.00, binaural_offset: 4.0 },
    { name: 'regulation'  as const, duration_seconds: 180, hz_focus: p2Hz,   intensity: 0.60, binaural_offset: 1.2 },
    { name: 'integration' as const, duration_seconds: 180, hz_focus: 136.10, intensity: 0.25, binaural_offset: 0 },
  ]
}

// Decide whether polarity correction should fully apply.
// Weak signal OR balanced state → use planet's natural character (no flip).
// Moderate/strong signal in excess/deficiency/blocked → apply corrective.
function shouldApplyPolarity(polarity?: PolarityResult): boolean {
  if (!polarity) return false
  if (polarity.dominant_state === 'balanced') return false
  if (polarity.confidence_band === 'weak') return false
  return true
}

// ── Directive v2 Part B — corrective text for the Cosmic Diagnostic ──
// When the dominant signature is in a symptom-driven imbalanced state, the
// diagnostic's "what to do" line must speak the SAME corrective protocol the
// prescription + chamber use (regulator-named, corrective herbs/scents/breath,
// regulator Hz) — never the raw, AMPLIFYING medicalAstrology.howToRestore,
// which for a Neptune-excess user would suggest Blue Lotus (an oneirogen) and
// the 211.44 Hz Neptune fork (feeding the imbalance). Law 3: never amplify.
const DIAGNOSTIC_ONEIROGENS = ['mugwort', 'blue lotus', 'wormwood', 'salvia', 'kava', 'valerian']

function correctiveDiagnosisAction(polarity: PolarityResult): string {
  const cp        = polarity.protocol
  const planet    = polarity.planet
  const state     = polarity.dominant_state
  const regulator = cp.regulator_planets?.[0] ?? null
  // Same oneirogen gate as the prescription: never serve dream-deepening herbs
  // for an excess (over-active / dissociative) state.
  const gateOk = (name: string) =>
    !(state === 'excess' && DIAGNOSTIC_ONEIROGENS.some((o) => name.toLowerCase().includes(o)))
  const herbs     = (cp.herbs ?? []).filter(gateOk).slice(0, 3).map((h) => h.replace(/_/g, ' '))
  const scents    = (cp.scents ?? []).slice(0, 2).map((s) => s.replace(/_/g, ' '))
  const direction = (cp.corrective_direction ?? []).slice(0, 3).join(', ')
  // Single source of truth for the frequency — the regulator's anchor, exactly
  // as the prescription + chamber resolve it.
  const soundKey  = regulator ?? planet
  const anchor    = (planetaryAnchors as any[]).find((a) => a.planet === soundKey)
  const hz        = anchor?.hz

  const parts: string[] = []
  // H.0.3 — planet-true felt language + element-matched corrective verbs
  // (Mercury-excess reads "running fast → settle", never "hot → cool").
  const lang = feltStateLanguage(planet, state)
  parts.push(
    `${planet} may be reading as ${lang.felt} (${state}) — so today's calibration works to ${lang.verbs}` +
      `${regulator ? `, borrowing ${regulator}'s qualities` : ''}${direction ? ` (${direction})` : ''}.`,
  )
  if (herbs.length) {
    parts.push(`Sip a ${herbs[0]}-led blend${herbs.length > 1 ? ` (${herbs.join(', ')})` : ''}.`)
  }
  if (scents.length) parts.push(`Diffuse ${scents.join(' or ')}.`)
  parts.push(`Breathe with ${breathLabel(cp.breath)}.`)
  if ((cp.color_palette ?? []).length) parts.push('Rest your eyes on the corrective palette below.')
  if (hz) parts.push(`Play the ${soundKey} tone at ${hz} Hz.`)
  return parts.join(' ')
}

// ── Fix 11 — DISTINCT per-symptom guidance ──
// The prior pass overwrote EVERY routed symptom's "What To Do" with one identical
// corrective line (the boilerplate the QA flagged). Each routed symptom now gets
// guidance specific to ITS theme + planet + state + body system + cell salt, while
// the FREQUENCY work stays unified under the primary calibration (so a routed
// block never prescribes a contradictory fork). Compliance-safe: support /
// "traditionally associated" language only — never diagnose/treat/cure.
function buildSymptomGuidance(
  sr: SymptomRouting,
  primaryPlanet: string,
  polarityResults: PolarityResult[],
): string {
  const planet = sr.primaryPlanet
  const pr = polarityResults.find((r) => r.planet === planet)
  const dir = (pr?.symptomDriven ? (pr.protocol.corrective_direction ?? []) : []).slice(0, 3)
  const medAstro = (medicalAstrologyData as any).planets?.find((p: any) => p.planet === planet)
  const system = medAstro?.anatomy?.primaryBodySystems?.[0]
  const salt = sr.recommendedCellSalt

  const parts: string[] = []
  parts.push(
    `Your reported "${sr.reportedSymptom}" may trace to a ${sr.matchedSignature} pattern` +
    `${system ? ` (${String(system).toLowerCase()})` : ''}.`,
  )
  if (dir.length) {
    parts.push(`Today's calibration works to ${dir.join(', ')} this signal.`)
  } else {
    parts.push(`${planet} reads steady here — Astryx draws on it to support the rest of the field.`)
  }
  if (salt?.saltShort) {
    // v4 FIX 1 — use the SAME keynote facet the card shows (emotional facet for an
    // emotional symptom, physical for a physical one), never the legacy physical
    // default. The facet already carries the matching meaning, so we do NOT append
    // a second, conflicting description (that was the "skin cracking… (security
    // fear…)" double-print).
    const facet = salt.displaySignal ?? salt.plainLanguageSignal
    parts.push(`Mineral support: ${salt.saltShort}${facet ? ` — ${facet.trim()}` : ''}`)
  }
  if (planet !== primaryPlanet) {
    parts.push(`In the chamber this is held within today's ${primaryPlanet} calibration.`)
  }
  return parts.join(' ')
}

// ── Directive B.1 — the ONE source of truth for the subject of the reading ──
// surface → root → aggravator. Built ONCE in runEngine; every text surface AND
// audio layer reads from this. No surface ever recomputes its own "dominant".
// ── Directive H.0.3 — PLANET-TRUE felt language ──
// "Running hot" is a FIRE metaphor — wrong for Mercury (air) or Saturn (earth),
// and you can't "cool" a planet that was never hot. Felt language keys to the
// planet's ELEMENT (the Part-F PLANET_ELEMENT map) + state, and the corrective
// verbs match the actual corrective direction. Never default to hot/cool.
// FeltLanguage + feltStateLanguage (+ its element/state tables) → moved to
// @/lib/engineClient (FIX 1A), imported above.

function buildSignalHierarchy(
  pattern: DominantPattern,
  polarityResults: PolarityResult[],
  diagnostic: DiagnosticOutput | undefined,
  canonicalSymptoms: string[],
): { hierarchy: SignalHierarchy; primaryResult: PolarityResult | undefined } {
  const lead = pattern.planets[0] ?? 'Sun'

  // PRIMARY = strongest symptom-driven imbalance (Part A). On a symptom-weight
  // TIE (e.g. Mars 9 / Sun 9 for "depleted drive"), prefer the chart lead so the
  // subject lands deterministically on ONE planet — this is what killed the
  // Mars/Sun flip. Deterministic; no Math.random.
  const driven = polarityResults.filter(
    (r) => r.symptomDriven && r.dominant_state !== 'balanced',
  )
  let primaryRes: PolarityResult | undefined
  if (driven.length) {
    const maxConf = Math.max(...driven.map((r) => r.confidence))
    const tied = driven.filter((r) => r.confidence === maxConf)
    primaryRes = tied.find((r) => r.planet === lead) ?? tied[0]
  } else {
    primaryRes = polarityResults.find((r) => r.planet === lead) ?? polarityResults[0]
  }
  const primary: SignalTier = {
    planet: primaryRes?.planet ?? lead,
    state: (primaryRes?.dominant_state ?? 'balanced') as PolarityStateLike,
    confidence_band: primaryRes?.confidence_band,
    role: 'surface',
  }

  // SECONDARY (root) = the deeper pattern the symptom-routing finds — a DIFFERENT
  // planet, context not a competing protocol. Plays its own state (NAT if balanced).
  let secondary: SignalTier | undefined
  for (const sr of diagnostic?.symptomRouting ?? []) {
    const rootPlanet = (sr.matchedPlanets ?? []).find((p) => p !== primary.planet) ?? sr.primaryPlanet
    if (rootPlanet && rootPlanet !== primary.planet) {
      const rootRes = polarityResults.find((r) => r.planet === rootPlanet)
      secondary = {
        planet: rootPlanet,
        state: (rootRes?.symptomDriven ? rootRes.dominant_state : 'balanced') as PolarityStateLike,
        confidence_band: rootRes?.confidence_band,
        role: 'root',
      }
      break
    }
  }

  // TERTIARY (aggravator) = the top active transit (Cosmic Weather).
  let tertiary: SignalTier | undefined
  const topTransit = diagnostic?.headlineTransit ?? diagnostic?.activeTransits?.[0]
  if (topTransit?.transitingPlanet &&
      topTransit.transitingPlanet !== primary.planet &&
      topTransit.transitingPlanet !== secondary?.planet) {
    const tRes = polarityResults.find((r) => r.planet === topTransit.transitingPlanet)
    tertiary = {
      planet: topTransit.transitingPlanet,
      state: (tRes?.symptomDriven ? tRes.dominant_state : 'balanced') as PolarityStateLike,
      confidence_band: tRes?.confidence_band,
      role: 'aggravator',
    }
  }

  // REPORTED — the planet the user's reported symptoms most implicate. When it
  // differs from the resolved primary, the SignalStack shows the bridge
  // ("you reported a Mars signal → it traces to a Sun root") so the tapped
  // planet never silently vanishes.
  // v4 FIX 4 — name a planet the user ACTUALLY activated. Prefer the planets the
  // reported symptoms genuinely ROUTED to (diagnostic.symptomRouting), not the raw
  // multi-planet association tally — which over-counted secondary links (e.g.
  // insomnia→Mercury) and could name a planet the user never reported.
  let reportedPlanet: string | undefined
  const routed = (diagnostic?.symptomRouting ?? [])
    .map((sr) => sr.primaryPlanet)
    .filter((p): p is string => !!p && p !== primary.planet)
  if (routed.length) {
    const freq: Record<string, number> = {}
    for (const p of routed) freq[p] = (freq[p] ?? 0) + 1
    reportedPlanet = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0]
  } else {
    // Fallback (no routing): tally only the PRIMARY association of each symptom.
    const tally: Record<string, number> = {}
    for (const slug of canonicalSymptoms) {
      const entry = SYMPTOMS.find((s) => s.symptom === slug)
      const lead = entry?.related_planets?.[0]
      if (lead) tally[lead] = (tally[lead] ?? 0) + (entry?.weight ?? 1)
    }
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (top && top !== primary.planet) reportedPlanet = top
  }

  return { hierarchy: { primary, secondary, tertiary, reportedPlanet }, primaryResult: primaryRes }
}

/**
 * Re-key the Cosmic Diagnostic to the PRIMARY signal (planet + state). Kills the
 * subject flip AND the wrong-state archetype (a depleted reading never reads
 * "overheating / rage"). The action line is set separately from the corrective
 * protocol (correctiveDiagnosisAction) when a real correction applies.
 */
function alignDiagnosticToPrimary(diagnostic: DiagnosticOutput, hierarchy: SignalHierarchy): void {
  const primary = hierarchy.primary
  diagnostic.dominantPlanet = primary.planet

  const medAstro = (medicalAstrologyData as any).planets?.find((p: any) => p.planet === primary.planet)
  const governs  = (medAstro?.plainLanguageBridge?.whatItGoverns ?? '').trim().replace(/[.\s]+$/, '')

  const lang = feltStateLanguage(primary.planet, primary.state)
  diagnostic.rootCause.headline =
    `${primary.planet} is the dominant signal in your chart today` +
    (primary.state !== 'balanced' ? ` — it may be ${lang.felt} (${primary.state}).` : '.')

  // State-aware body — built from the planet's domain + its CURRENT state and
  // ELEMENT (H.0.3), never the static "when stressed" (excess) archetype and
  // never a fire metaphor on an air/earth/water planet.
  let body = (governs ? `${primary.planet} governs ${governs}. ` : '') +
    `Right now it ${lang.body}.`
  if (hierarchy.secondary) {
    body += ` Beneath it, a ${hierarchy.secondary.planet} root your symptoms trace to.`
  }
  diagnostic.rootCause.bodyLayer = body
  diagnostic.plainLanguage.whenItsOff = body
}

// ── Directive F — Elements, Polarity & Environment ──
// Planet → element via PRIMARY (traditional) rulership — the same associations
// signs.json/elements.json encode (Moon rules Cancer = Water, Mars rules Aries =
// Fire, …). Authored from existing data; not fabricated. The CORRECTIVE element
// comes from the regulator, so the environment always points toward balance.
// PLANET_ELEMENT → moved to @/lib/engineClient (FIX 1A), imported above.
const SIGN_MODALITY: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  for (const s of signsData as Array<{ sign: string; modality?: string }>) {
    if (s.sign && s.modality) m[s.sign] = s.modality
  }
  return m
})()
// Default sign-modality per planet's ruling sign (fallback when natal sign unknown).
const PLANET_DEFAULT_MODALITY: Record<string, string> = {
  Sun: 'Fixed', Moon: 'Cardinal', Mercury: 'Mutable', Venus: 'Fixed', Mars: 'Cardinal',
  Jupiter: 'Mutable', Saturn: 'Cardinal', Uranus: 'Fixed', Neptune: 'Mutable', Pluto: 'Fixed',
}

const ELEMENT_SETTING: Record<string, string> = {
  Fire:  'in sunlight, or near a candle or hearth',
  Earth: 'in a park, barefoot on the ground, or under a tree',
  Air:   'on a hilltop, by an open window, or in a fresh breeze',
  Water: 'near still water — a quiet bath, or a glass of water within reach',
}
const POLARITY_POSTURE: Record<string, string> = {
  projective: 'active and reaching outward',
  receptive:  'still, receiving inward',
}
const MODALITY_TEMPO: Record<string, string> = {
  Cardinal: 'begin, and set an intention',
  Fixed:    'hold the position and let it sustain',
  Mutable:  'let it flow and dissolve',
}

function buildEnvironment(
  hierarchy: SignalHierarchy,
  primaryPolarity: PolarityResult | undefined,
  planetSigns: Record<string, string>,
): EnvironmentLayer {
  const primary = hierarchy.primary
  const correcting = shouldApplyPolarity(primaryPolarity)
  // Corrective element = the REGULATOR's element (points toward balance). When
  // balanced, the primary's own element (a neutral, grounding setting).
  const regulator = correcting ? primaryPolarity!.protocol.regulator_planets?.[0] : undefined
  const elementPlanet = regulator ?? primary.planet
  const element = PLANET_ELEMENT[elementPlanet] ?? 'Earth'
  const polarity: 'projective' | 'receptive' =
    element === 'Fire' || element === 'Air' ? 'projective' : 'receptive'
  const natalSign = planetSigns[primary.planet]
  const modality = SIGN_MODALITY[natalSign] ?? PLANET_DEFAULT_MODALITY[primary.planet] ?? 'Mutable'
  return {
    element,
    elementSource: `${elementPlanet} · ${element}`,
    polarity,
    modality,
    setting: ELEMENT_SETTING[element] ?? ELEMENT_SETTING.Earth,
    posture: POLARITY_POSTURE[polarity],
    tempo: MODALITY_TEMPO[modality] ?? MODALITY_TEMPO.Mutable,
    corrective: correcting,
  }
}

function buildSoundProtocol(pattern: DominantPattern, polarity?: PolarityResult) {
  const anchors = planetaryAnchors as Array<{ planet: string; hz: number; function: string[] }>
  const p1Data = anchors.find((a) => a.planet === pattern.planets[0])
  const p2Data = anchors.find((a) => a.planet === pattern.planets[1])

  const aspData = (aspectsData as any[]).find((a: any) => a.aspect === pattern.aspect)
  const mb = aspData?.music_behavior ?? {}
  const rhythm = (mb.rhythm || 'steady') as
    | 'steady' | 'syncopated' | 'call_response'
    | 'steady_or_heavy' | 'interactive' | 'corrective'

  let style =
    rhythm === 'syncopated'      ? 'Pulsed → Regulated'   :
    rhythm === 'steady_or_heavy' ? 'Dense → Sustained'     :
    rhythm === 'call_response'   ? 'Call → Response'       :
                                   'Harmonic → Flowing'

  let p1Hz = p1Data?.hz ?? 144.72
  const p2Hz = p2Data?.hz ?? 147.85
  let description =
    `${pattern.planets[0]} anchor (${p1Hz} Hz) paired with ${pattern.planets[1]} anchor (${p2Hz} Hz). Earth Om regulator grounds the activation cycle.`

  // ─── POLARITY CORRECTION ─────────────────────────────────────
  // When the detected planet is in EXCESS / BLOCKED / DEFICIENCY,
  // we don't amplify the planet's own anchor — we shift to the
  // regulator planet's anchor (cooling Moon for Mars excess, etc.)
  // and rename the style to reflect the corrective direction.
  if (shouldApplyPolarity(polarity)) {
    const cp = polarity!.protocol
    const regulator = cp.regulator_planets[0]
    const regulatorAnchor = regulator ? anchors.find((a) => a.planet === regulator) : null
    if (regulatorAnchor?.hz) {
      p1Hz = regulatorAnchor.hz
      style = cp.sound_character
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
      description =
        `${polarity!.planet} pattern in ${polarity!.dominant_state} state — ` +
        `applying corrective ${regulator} anchor (${p1Hz} Hz) to ${cp.support_style}. ` +
        `Earth Om regulator anchors. Avoid: ${cp.avoid.slice(0, 3).join(', ')}.`
    }
  }

  return {
    mode: 'tone_sequence' as const,
    primary_anchors: [p1Hz, p2Hz],
    aspect_behavior: {
      interval_style: (mb.interval_style ?? ['stacked']) as string[],
      chord_style:    (mb.chord_style    ?? 'open')      as string,
      rhythm,
      resolution:     (mb.resolution     ?? 'natural')   as string,
    },
    rhythm_style: rhythm,
    regulator: { name: 'Earth Year Om', hz: 136.10 },
    session_phases: defaultSessionPhases(p1Hz, p2Hz),
    style,
    duration: '5–10 min',
    description,
    variants: ['Ambient drone', 'Tone sequence', 'Binaural layer'],
  }
}

function buildScentProtocol(pattern: DominantPattern, polarity?: PolarityResult) {
  // POLARITY CORRECTION: When excess/blocked/deficiency at moderate+ confidence,
  // override planet-derived oils with the corrective scent palette
  // (e.g. Mars Excess → lavender/rose/chamomile instead of black pepper/ginger).
  if (shouldApplyPolarity(polarity)) {
    const cp = polarity!.protocol
    const action = cp.corrective_direction.slice(0, 3).join(' & ') || 'Balance & Clear'
    return {
      action,
      oils: cp.scents.length ? cp.scents.slice(0, 3) : ['lavender', 'frankincense'],
      delivery: 'Direct inhale + diffuser',
      duration: '5–15 min',
    }
  }

  // Balanced / weak signal — use planet's natural scent affinity (existing path)
  const primaryScents   = scentsForPlanet(pattern.planets[0])
  const secondaryScents = scentsForPlanet(pattern.planets[1] ?? pattern.planets[0])
  const primary   = primaryScents[0]
  const secondary = secondaryScents[0]

  const oils = [
    ...primaryScents.slice(0, 2).map((s) => s.scent),
    ...(secondary && !primaryScents.includes(secondary) ? [secondary.scent] : []),
  ]

  return {
    action:   (primary?.actions ?? []).join(' & ') || 'Balance & Clear',
    oils:     oils.length ? oils : ['lavender', 'frankincense'],
    delivery: primary?.delivery?.join(' or ') ?? 'Direct inhale + diffuser',
    duration: '5–15 min',
  }
}

function buildTasteProtocol(pattern: DominantPattern, polarity?: PolarityResult) {
  // POLARITY CORRECTION: replace planet's warming herbs with cooling ones
  // for excess states, etc. (e.g. Mars Excess → peppermint/chamomile/rose
  // instead of ginger/cayenne/nettle).
  if (shouldApplyPolarity(polarity)) {
    const cp = polarity!.protocol
    const correctiveTasteProfile =
      polarity!.dominant_state === 'excess'      ? ['cooling', 'soothing', 'calming'] :
      polarity!.dominant_state === 'deficiency'  ? ['warming', 'building', 'aromatic'] :
      polarity!.dominant_state === 'blocked'     ? ['mobilizing', 'softening', 'releasing'] :
                                                   ['balancing']
    return {
      blend_type:    `${polarity!.planet} ${polarity!.dominant_state} corrective — ${cp.support_style}`,
      taste_profile: correctiveTasteProfile,
      ingredients:   cp.herbs.length ? cp.herbs.slice(0, 4) : ['dandelion root', 'peppermint'],
      preparation:   'tea',
      timing:        'Between meals or during the session',
    }
  }

  // Balanced — use planet's natural herbs (existing path)
  const primaryHerbs   = herbsForPlanet(pattern.planets[0])
  const secondaryHerbs = herbsForPlanet(pattern.planets[1] ?? pattern.planets[0])
  const primary   = primaryHerbs[0]
  const secondary = secondaryHerbs[0]

  const ingredients = [
    ...primaryHerbs.slice(0, 2).map((h) => (h.herb as string).replace(/_/g, ' ')),
    ...(secondary && !primaryHerbs.includes(secondary)
      ? [(secondary.herb as string).replace(/_/g, ' ')]
      : []),
  ]

  return {
    blend_type:    primary?.herb
      ? `${pattern.planets[0]} blend — featuring ${(primary.herb as string).replace(/_/g, ' ')}`
      : 'Regulation Blend',
    taste_profile: primary?.taste_profile ?? ['bitter', 'cooling', 'aromatic'],
    ingredients:   ingredients.length ? ingredients : ['dandelion root', 'peppermint'],
    preparation:   primary?.delivery?.[0] ?? 'tea',
    timing:        'Between meals or during the session',
  }
}

// Phase 3 — never let a raw snake_case key reach the UI. Already-human strings
// (anything containing a space) pass through untouched.
function humanize(token: string | undefined | null): string {
  if (!token) return ''
  if (/\s/.test(token)) return token
  return token.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Breath token (from polarity.protocol.breath) → user-facing breath instruction.
function breathLabel(token: string): string {
  const map: Record<string, string> = {
    '4-7-8':                 '4-7-8 extended exhale cycles (4 in, 7 hold, 8 out)',
    'box_breathing':         'Box breathing — 4 in · 4 hold · 4 out · 4 hold',
    'extended_exhale':       'Extended exhale breath — inhale 4, exhale 8',
    'alternate_nostril':     'Alternate nostril breathing — 12 gentle cycles',
    'balanced':              '4-4 balanced rhythmic breathing',
    'balanced_activating':   'Balanced activating — 4 in, 2 hold, 4 out',
    'soft_extended':         'Soft extended breath — gentle inhale, long slow exhale',
    'soft_sighing':          'Gentle sighing exhale — let the breath release naturally',
    'warm_expansive':        'Warm expansive breath — open chest, full inhale',
    'expansive_inhale':      'Expansive inhale — fill from belly to chest, slow release',
    'gentle_release':        'Gentle release breath — soft inhale, easy exhale',
    'gentle_sighing':        'Gentle sighing — let air leave with a sound',
    'heart_opening':         'Heart-opening breath — inhale wide through the chest',
    'humming_release':       'Humming exhale — release with a low hum',
    'humming_voiced':        'Voiced humming exhale — engages vocal release',
    'long_exhale_release':   'Long exhale release — short in, very long out',
    'open_chest_expansion':  'Open chest expansion — broad inhale, soft exhale',
    'deep_extended':         'Deep extended breath — full belly inhale, slow exhale',
    // body-protocols.json tokens (the natural/balanced path) — Phase 3 fix so
    // raw snake_case never reaches the UI when no correction applies.
    'expansive_diaphragmatic_breath':                  'Expansive diaphragmatic breath — full belly to chest',
    'soft_wave_breath':                                'Soft wave breath — gentle rolling inhale and exhale',
    'alternate_nostril_breath':                        'Alternate nostril breathing — 12 gentle cycles',
    'long_smooth_exhale':                              'Long smooth exhale — short in, slow out',
    'controlled_exhale_4_count':                       'Controlled exhale — inhale, then exhale on a 4-count',
    'full_three_part_breath':                          'Full three-part breath — belly, ribs, chest',
    'long_slow_exhale_6_to_8_count':                   'Long slow exhale — inhale 4, exhale 6–8',
    'breath_of_fire_short_or_rapid_alternate_nostril': 'Gentle rapid breath — soft, steady nasal rhythm',
    'soft_oceanic_breath':                             'Soft oceanic breath — quiet ocean-sound inhale and exhale',
    'deep_belly_breath_with_long_holds':               'Deep belly breath — full inhale with long, easy holds',
  }
  if (map[token]) return map[token]
  if (!token) return '4-7-8 slow exhale cycles'
  // Fallback humanizer — never let a raw key surface (Phase 3).
  return token.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildBodyProtocol(pattern: DominantPattern, polarity?: PolarityResult) {
  // POLARITY CORRECTION: breath choice comes from the corrective protocol.
  // Mars Excess → 4-7-8 (calming exhale). Mars Deficiency → balanced activating.
  // Mars Blocked → humming release.
  if (shouldApplyPolarity(polarity)) {
    const cp = polarity!.protocol
    const corrective = cp.corrective_direction.slice(0, 3).join(', ')
    return {
      breath:      breathLabel(cp.breath),
      movement:    `Gentle ${corrective} movement — let the body follow the breath`,
      posture:     'Upright, supported, soft jaw and shoulders',
      touch:       polarity!.dominant_state === 'excess'      ? 'Cooling abdominal placement — palms light'
                 : polarity!.dominant_state === 'deficiency'  ? 'Warming heart placement — palms over sternum'
                 : polarity!.dominant_state === 'blocked'     ? 'Mobilizing — slow open-palm circles over the tense region'
                                                              : 'Grounding abdominal pressure',
      orientation: 'Seated, facing north or east',
    }
  }

  // Balanced / weak — planet's natural body protocol (existing path)
  const body = bodyProtocolsData as unknown as Array<{
    planet: string; breath: string; movement: string
    posture: string; touch: string; orientation: string
  }>
  const primary   = body.find((b) => b.planet === pattern.planets[0])
  const secondary = body.find((b) => b.planet === (pattern.planets[1] ?? pattern.planets[0]))

  return {
    breath:      breathLabel(primary?.breath ?? ''),
    movement:    humanize(secondary?.movement ?? primary?.movement) || 'Gentle release sequence',
    posture:     humanize(primary?.posture) || 'Upright spinal alignment',
    touch:       humanize(secondary?.touch ?? primary?.touch) || 'Grounding abdominal pressure',
    orientation: humanize(primary?.orientation) || 'Seated, facing north or east',
  }
}

// Planet → base geometric primitive (used for VisualProtocol.geometry_base).
// Element-derived: Fire → triangle, Earth → square, Air → hexagon, Water → circle.
function planetBaseGeometry(planet: string): string {
  const map: Record<string, string> = {
    Sun: 'circle',      Moon: 'circle',     Venus: 'hexagon',
    Mars: 'triangle',   Mercury: 'hexagon', Jupiter: 'triangle',
    Saturn: 'square',   Uranus: 'hexagon',  Neptune: 'circle',
    Pluto: 'square',
  }
  return map[planet] ?? 'circle'
}

function buildSightProtocol(pattern: DominantPattern, polarity?: PolarityResult) {
  const colorMap = colorsData as unknown as Array<{ planet: string; primary_colors: string[]; regulator_colors: string[] }>
  const geo      = geometryData as Array<{ aspect: string; geometry: string; motion: string; kaleidoscope_mode: string }>

  const p1Colors = colorMap.find((c) => c.planet === pattern.planets[0])
  const p2Colors = colorMap.find((c) => c.planet === pattern.planets[1])
  const geoData  = geo.find((g) => g.aspect === pattern.aspect)
  const applyCorrective = shouldApplyPolarity(polarity)

  const hexMap: Record<string, string> = {
    gold:'#F4A940', yellow:'#F9DC5C', 'pale blue':'#A8C4D0',
    red:'#E8453C', 'deep red':'#C0392B', charcoal:'#3A3A3A',
    'muted gold':'#C9993A', seafoam:'#2EC4B6', violet:'#9B5DE5',
    'yellow-green':'#9EC832', green:'#4CAF89', silver:'#CBD5E0',
    'blue-violet':'#6B7FD4', 'electric yellow':'#F6E05E',
    'soft white':'#F7FAFC', 'deep indigo':'#553C9A', teal:'#2EC4B6',
    'soft green':'#9BD2A4', white:'#F7FAFC', rose:'#FFB6C1',
    indigo:'#553C9A', emerald:'#10B981', crimson:'#DC143C',
    black:'#020208', amber:'#F59E0B', cyan:'#22D3EE',
  }
  const toHex = (name: string) =>
    hexMap[name?.toLowerCase()] || PLANET_COLORS[pattern.planets[0]] || '#22D3EE'

  // Build palette slots — POLARITY OVERRIDE when applicable
  let primary_colors: string[]
  let secondary_colors: string[]
  let regulator_color: string

  if (applyCorrective) {
    // The corrective palette already comes as hex strings (e.g. Mars Excess
    // = ["#5DADEC","#43E66A","#A8C4D0"]). No translation needed.
    const cp = polarity!.protocol
    primary_colors   = cp.color_palette.length ? cp.color_palette.slice(0, 3) : ['#22D3EE']
    secondary_colors = (p2Colors?.primary_colors ?? ['violet']).map(toHex)
    regulator_color  = cp.color_palette[0] ?? toHex('soft green')
  } else {
    primary_colors   = (p1Colors?.primary_colors ?? ['gold']).map(toHex)
    secondary_colors = (p2Colors?.primary_colors ?? p1Colors?.regulator_colors ?? ['violet']).map(toHex)
    regulator_color  = toHex(p1Colors?.regulator_colors?.[0] ?? 'soft green')
  }

  // Geometry split
  const geometry_base    = planetBaseGeometry(pattern.planets[0])
  const geometry_overlay = geoData?.geometry ?? 'circle'
  const motion_type      = (geoData?.motion ?? 'center_intensification') as
    | 'center_intensification' | 'oscillation' | 'collision_pulse'
    | 'continuous_expansion' | 'harmonic_opening' | 'skewed_adjustment'
  const kaleidoscope_mode = (geoData?.kaleidoscope_mode ?? 'flow_symmetry') as
    | 'dense_bloom' | 'dual_reflection' | 'structured_tension'
    | 'flow_symmetry' | 'harmonic_weave' | 'adaptive_misalignment'

  // 5-phase animation timeline (mirrors SoundProtocol.session_phases durations)
  const animation_phases = [
    { name: 'entry'       as const, duration_seconds: 120, intensity: 0.30, dominant_color: regulator_color,                              motion_modifier: 'slow_inhale' },
    { name: 'activation'  as const, duration_seconds: 180, intensity: 0.65, dominant_color: primary_colors[0],                            motion_modifier: 'build_pulse' },
    { name: 'peak'        as const, duration_seconds: 240, intensity: 1.00, dominant_color: primary_colors[0],                            motion_modifier: 'rapid_pulse' },
    { name: 'regulation'  as const, duration_seconds: 180, intensity: 0.60, dominant_color: secondary_colors[0] ?? primary_colors[0],     motion_modifier: 'settle' },
    { name: 'integration' as const, duration_seconds: 180, intensity: 0.25, dominant_color: regulator_color,                              motion_modifier: 'still' },
  ]

  return {
    // Structured renderer-ready fields
    primary_colors,
    secondary_colors,
    regulator_color,
    geometry_base,
    geometry_overlay,
    motion_type,
    kaleidoscope_mode,
    animation_phases,
    // Back-compat shorthand fields (legacy UI reads)
    colors: [primary_colors[0], regulator_color, secondary_colors[0] ?? primary_colors[0]],
    geometry: geometry_overlay,
    motion: motion_type,
    delivery: ['Screen animation', 'Ambient light field'],
    description: `${pattern.planets[0]} + ${pattern.planets[1]} visual field. ${motion_type.replace(/_/g, ' ')} geometry in ${pattern.aspect} configuration.`,
  }
}

function buildSOAP(pattern: DominantPattern, intake: IntakeData) {
  // ─────────────────────────────────────────────────────────────
  // soap-templates.json is a mode-keyed *descriptor* file, not an
  // array of aspect-templates. We use the descriptors to drive the
  // depth of each section, then synthesize SOAP text directly from
  // the dominant pattern.
  //
  // Per CLAUDE.md rule #3 — all assessment language is probabilistic:
  // "may suggest", "is associated with", "may correlate". Never "you have".
  // ─────────────────────────────────────────────────────────────
  type ModeBlock = { subjective: string; objective: string; assessment: string; plan: string }
  const tpl = soapTemplates as unknown as { user_mode: ModeBlock; practitioner_mode: ModeBlock }
  const isPractitioner = intake.mode === 'practitioner'

  // ── Subjective: user-reported intake ──
  const symptoms  = intake.symptoms ?? []
  const emotional = (intake.emotionalState ?? []).filter(Boolean).join(', ')
  const intent    = (intake.intention      ?? []).filter(Boolean).join(', ')
  const subjective: string[] = [
    ...symptoms.map((s) => `${s} — reported`),
    emotional ? `Emotional state: ${emotional}` : null,
    intent    ? `Stated intention: ${intent}`   : null,
  ].filter((x): x is string => x !== null)
  if (subjective.length === 0) {
    subjective.push('No specific symptoms reported — calibration for general wellness alignment.')
  }

  // ── Objective: the chart pattern itself ──
  const planet2     = pattern.planets[1] ?? pattern.planets[0]
  const sign1       = pattern.signs[0]   ?? '—'
  const sign2       = pattern.signs[1]   ?? sign1
  const houses      = (pattern.houses ?? []).map((h) => `H${h}`).join(' · ') || '—'
  const aspectLabel = ASPECT_LABELS[pattern.aspect] ?? pattern.aspect

  const objective: string[] = [
    `Dominant configuration: ${pattern.planets[0]} ${aspectLabel} ${planet2}`,
    `Signs: ${sign1} · ${sign2}`,
    `Houses: ${houses}`,
    `Element / modality: ${pattern.element_modality}`,
    `Confidence: ${pattern.confidence_score}%`,
  ]
  if (isPractitioner) {
    objective.push(`Aspect class: ${pattern.aspect}`)
  }

  // ── Assessment: probabilistic interpretation ──
  const assessmentBase =
    `The ${pattern.planets[0]}–${planet2} ${pattern.aspect} ` +
    `in ${sign1}/${sign2} may suggest a ${pattern.element_modality.toLowerCase()} ` +
    `pattern that is associated with the themes of ${pattern.subtitle?.toLowerCase() || pattern.title.toLowerCase()}.`
  const assessmentPractitioner = isPractitioner
    ? ` This configuration may correlate with patterns commonly described as "${pattern.title}" in classical interpretation, ` +
      `with a confidence weighting of ${pattern.confidence_score}% relative to the rest of the chart.`
    : ''
  const assessment = assessmentBase + assessmentPractitioner

  // ── Plan: short summary of the 5 sensory protocols ──
  const plan = isPractitioner
    ? `Multi-sensory calibration protocol prescribed across Sound, Scent, Taste, Body, and Sight channels — ` +
      `tuned to the ${pattern.planets[0]}–${planet2} configuration. Begin with sound regulation, ` +
      `layer scent + taste anchors, integrate body protocol, and close with sight resonance. ` +
      `Track vagal tone and nervous-system response across sessions.`
    : `Five sensory anchors — sound, scent, taste, body, sight — may support alignment with this resonance pattern. ` +
      `Sit with the protocol once; observe what shifts.`

  return {
    subjective,
    objective,
    assessment,
    plan,
  }
}

// ─── MAIN ENGINE FUNCTION ─────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// TRI-SOURCE SCORING ENGINE (Build Directive v2.0 FIX 5)
// ═══════════════════════════════════════════════════════════════
// Planet Score = (Natal × 0.35) + (Transit Pressure × 0.40) + (Symptom × 0.25)
//
// Three independent sources, each scored 0-10, combined into final urgency
// ranking. Returns top 3 active planets, each with breakdown by source and
// plain-language transit description (run through compliance wrapper).

const NATAL_WEIGHT     = 0.35
const TRANSIT_WEIGHT   = 0.40
const SYMPTOM_WEIGHT   = 0.25

// Domicile (sign rulership) per classical astrology
const DOMICILE: Record<string, string[]> = {
  Sun:     ['Leo'],
  Moon:    ['Cancer'],
  Mercury: ['Gemini', 'Virgo'],
  Venus:   ['Taurus', 'Libra'],
  Mars:    ['Aries', 'Scorpio'],
  Jupiter: ['Sagittarius', 'Pisces'],
  Saturn:  ['Capricorn', 'Aquarius'],
  Uranus:  ['Aquarius'],
  Neptune: ['Pisces'],
  Pluto:   ['Scorpio'],
}

// Exaltation per classical astrology
const EXALTATION: Record<string, string> = {
  Sun: 'Aries', Moon: 'Taurus', Mercury: 'Virgo', Venus: 'Pisces',
  Mars: 'Capricorn', Jupiter: 'Cancer', Saturn: 'Libra',
}

/** NATAL WEIGHT 0-10 — based on chart prominence */
function computeNatalWeight(planetName: string, chart: any, pattern: DominantPattern): number {
  if (!chart?.planets) return 0
  const p = chart.planets.find((x: any) => x.planet === planetName)
  if (!p) return 0

  let w = 1                              // baseline presence

  // In dominant aspect pattern (engine's primary signature)
  if (pattern.planets.includes(planetName)) w += 2

  // Prominent houses (1, 4, 7, 10 = angular)
  if ([1, 4, 7, 10].includes(p.house)) w += 2

  // Domicile (planet in own sign)
  if (DOMICILE[planetName]?.includes(p.sign)) w += 1
  // Exaltation
  if (EXALTATION[planetName] === p.sign) w += 1

  // Conjunct ASC/MC (within 8° of cusp)
  if (chart.angles) {
    const ascDist = Math.min(Math.abs(p.longitude - chart.angles.ascendant),
                             360 - Math.abs(p.longitude - chart.angles.ascendant))
    const mcDist  = Math.min(Math.abs(p.longitude - chart.angles.midheaven),
                             360 - Math.abs(p.longitude - chart.angles.midheaven))
    if (ascDist < 8 || mcDist < 8) w += 3
  }

  return Math.min(10, w)
}

/** TRANSIT PRESSURE 0-10 — based on active transits hitting this planet */
function computeTransitPressure(planetName: string, transits: ActiveTransit[]): {
  pressure: number
  description: string
  daysToExact: number
} {
  let pressure = 0
  let bestDesc = ''
  let bestDays = 0
  let bestExactness = -1

  for (const t of transits) {
    // Only count transits where this planet is involved (as either side)
    const involved = t.transitingPlanet === planetName || t.natalPlanet === planetName
    if (!involved) continue

    // Base pressure by aspect type
    let base = 0
    if (t.aspect === 'conjunction')       base = 5
    else if (t.aspect === 'opposition' || t.aspect === 'square') base = 4
    else if (t.aspect === 'trine')        base = 2
    else if (t.aspect === 'sextile')      base = 1

    // Orb multiplier
    let mult = 1
    if (t.orb < 2 && t.applying)   mult = 1.5
    else if (!t.applying)           mult = 0.7

    const score = base * mult
    pressure += score

    // Track the most exact transit for the description
    if (t.exactness > bestExactness) {
      bestExactness = t.exactness
      bestDesc = `${t.transitingPlanet} ${t.aspect} natal ${t.natalPlanet}`
      bestDays = t.daysToExact
    }
  }

  return {
    pressure: Math.min(10, pressure),
    description: bestDesc,
    daysToExact: bestDays,
  }
}

/** SYMPTOM SCORE 0-10 — from narrative scores or keyword fallback */
function computeSymptomScore(
  planetName: string,
  narrativeScores: Record<string, number> | undefined,
  intake: IntakeData,
): number {
  // Path A: narrative scores from Claude API interpretation (Play A)
  if (narrativeScores && typeof narrativeScores[planetName] === 'number') {
    return Math.max(0, Math.min(10, narrativeScores[planetName] / 10))
  }

  // Path B: data-driven — score from symptoms.json. `intake.symptoms` here is
  // expected to already be normalized to canonical slugs (runEngine passes a
  // scoring clone). For each slug whose related_planets includes this planet,
  // accumulate its weight. This replaces the old ad-hoc keyword list, which
  // never matched the intake's multi-word symptom tags.
  const symptoms = normalizeSymptoms(intake.symptoms)
  let score = 0
  for (const slug of symptoms) {
    const entry = SYMPTOMS.find((s) => s.symptom === slug)
    if (entry?.related_planets?.includes(planetName)) {
      score += entry.weight ?? 1
    }
  }
  return Math.min(10, score)
}

/** Compose ranked top-3 ActivePlanet array */
function computeActivePlanets(
  chart: any,
  pattern: DominantPattern,
  transits: ActiveTransit[],
  intake: IntakeData,
): ActivePlanet[] {
  const ALL_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

  const scored: ActivePlanet[] = ALL_PLANETS.map((p) => {
    const natalWeight     = computeNatalWeight(p, chart, pattern)
    const transitResult   = computeTransitPressure(p, transits)
    const symptomScore    = computeSymptomScore(p, intake.narrativeScores, intake)

    const score = parseFloat((
      natalWeight   * NATAL_WEIGHT   +
      transitResult.pressure * TRANSIT_WEIGHT +
      symptomScore  * SYMPTOM_WEIGHT
    ).toFixed(2))

    const urgency: ActivePlanet['urgency'] =
      score >= 5.5 ? 'critical' :
      score >= 3.5 ? 'elevated' :
                     'active'

    const calibrationWindow = transitResult.daysToExact > 0
      ? `Optimal window: now through ${Math.round(transitResult.daysToExact)} days`
      : 'Optimal window: ongoing reference'

    // Compliance-friendly transit description
    const transitDescription = transitResult.description
      ? `${transitResult.description}. This configuration may correlate with classical sources' associations for ${p}.`
      : `${p}-pattern reference signature`

    return {
      planet: p,
      score,
      urgency,
      natalWeight: parseFloat(natalWeight.toFixed(2)),
      transitPressure: parseFloat(transitResult.pressure.toFixed(2)),
      symptomScore: parseFloat(symptomScore.toFixed(2)),
      transitDescription,
      calibrationWindow,
    }
  })

  // Sort descending by score, return top 3
  return scored.sort((a, b) => b.score - a.score).slice(0, 3)
}

export async function runEngine(
  intake: IntakeData,
  coords?: { lat: number; lon: number; tzOffset?: number }
): Promise<ProtocolOutput> {
  let rawPattern: DominantPatternData | null = null
  let chart: any = null
  let transits: any[] = []
  let apiSymptomPlanets: string[] = []

  // ── Step 1: Try real ephemeris chart via API ──
  if (coords?.lat !== undefined && coords?.lon !== undefined && intake.birthDate) {
    const result = await fetchChart({
      birthDate: intake.birthDate,
      birthTime: intake.birthTime || '12:00',
      latitude:  coords.lat,
      longitude: coords.lon,
      tzOffset:  coords.tzOffset ?? 0,
      symptoms:  intake.symptoms,
    })
    if (result) {
      rawPattern = result.dominantPattern
      chart      = result.chart      // retained for diagnostic layer (sun/moon/asc lookup)
      transits   = result.transits   // today's sky aspects to natal chart
      apiSymptomPlanets = result.symptomPlanets
    }
  }

  // ── Step 2: Fallback if no coords or API failed ──
  if (!rawPattern) {
    console.warn('[engine] Falling back to seed-based approximation')
    rawPattern = fallbackPattern(intake)
  }
  void apiSymptomPlanets  // reserved for future client-side symptom-planet use

  // ── Step 3: Build full protocol ──
  const dominantPattern = buildDominantPattern(rawPattern)
  const soap  = buildSOAP(dominantPattern, intake)

  // ── Step 3a: Chart-derived sign / house maps (polarity modifiers) ──
  const planetSigns: Record<string, string> = {}
  const planetHouses: Record<string, number> = {}
  if (chart?.planets) {
    for (const p of chart.planets) {
      planetSigns[p.planet] = p.sign
      planetHouses[p.planet] = p.house
    }
  }

  // ── Step 3b: Canonical symptom slugs ──
  // Bridge the intake's free-text symptom tags ("anger inflammation") to the
  // snake_case slugs in symptoms.json ("anger", "inflammation") so the polarity
  // engine and symptom scorer can actually match them. Without this, every
  // state resolved to "balanced" and no corrective chamber was produced.
  const canonicalSymptoms = normalizeSymptoms(intake.symptoms)
  const canonicalEmotional = normalizeSymptoms(intake.emotionalState)

  // ── Fix 4 — NARRATIVE + INTENTION now shape the calibration ──
  // The free-text check-in is parsed into canonical symptom slugs (which carry
  // planet + state + weight) and folded into the symptom signal, so a typed
  // paragraph moves the SAME polarity + scoring pipeline as the checkboxes. This
  // is the difference between a preset and a true recalibration: two users with
  // identical charts but different narratives now resolve to different signals.
  const narrativeParse = parseNarrative(intake.narrative)
  const intentionParse = parseIntention(intake.intention, intake.intentionText)
  // Union of checkbox + narrative slugs — the full symptom signal for this read.
  const combinedSymptomSlugs = Array.from(
    new Set([...canonicalSymptoms, ...narrativeParse.slugs]),
  )
  // Narrative planet hints feed narrativeScores when the API didn't (the tri-
  // source symptom scorer reads narrativeScores first). API scores win on tie.
  const mergedNarrativeScores: Record<string, number> = {
    ...narrativeParse.planetHints,
    ...(intake.narrativeScores ?? {}),
  }
  // Scoring clone — combined slugs + merged narrative scores so computeActivePlanets
  // (and thus the whole hierarchy) reflects narrative + intention, not chart alone.
  const scoringIntake: IntakeData = {
    ...intake,
    symptoms: combinedSymptomSlugs,
    narrativeScores: mergedNarrativeScores,
  }

  // ── Step 4: Diagnostic Layer (car-diagnostic translation) ──
  // Cross-references medicalAstrology.json (planet → anatomy → root cause)
  // with cellSalts.json (sign → mineral prescription + Bonacci gestation rule),
  // current transits (today's sky → natal-chart activation), and the user's
  // reported symptoms (routed against rootCauseIndex → planetary signatures).
  // Uses the RAW symptoms — routeSymptomsToDiagnosis has its own vocabulary
  // (rootCauseIndex keys). Returns undefined if lookup fails; UI null-checks it.
  const diagnostic = buildDiagnostic(dominantPattern, chart, transits, intake.symptoms ?? [])

  // ── Step 5: Tri-Source Scoring (Build Directive v2.0 FIX 5) ──
  // Top active planets from weighted natal/transit/symptom inputs.
  const activePlanets = computeActivePlanets(
    chart,
    dominantPattern,
    diagnostic?.activeTransits ?? [],
    scoringIntake,
  )

  // ── Step 6: Remedy Polarity — the intelligence layer ──
  // This MUST run before the 5 sense builders so each can apply the corrective
  // direction when a planet is in excess / deficiency / blocked state. The
  // detection set is the tri-source active planets PLUS any planet implicated by
  // the user's symptoms — guaranteeing a symptom-flagged planet (e.g. Mars for
  // anger/inflammation) is evaluated even on a chart where it isn't top-ranked.
  // ── Directive S — resolve the light somatic intake into {sign+planet+state} ──
  // Body-zone chips + the wired/weary axis + named conditions in the narrative →
  // axis-separated signals. These are the USER'S reported signal (authority), fed
  // to the polarity engine as directSignals and to the Reflex engine for placement.
  const zoneSignals: ZoneSignal[] = resolveZoneSignals({
    zoneChips: intake.bodyZones,
    autonomic: intake.autonomic ?? null,
    text: [intake.narrative, intake.symptoms?.join(' '), intake.intentionText].filter(Boolean).join(' '),
  })
  const directSignals = zoneSignals.map((z) => ({
    planet: z.planet, state: z.state as PolarityStateLike, weight: z.weight,
  }))
  // Reflex/dual-placement structure per body signal (LOCAL + opposite/square
  // reflex + planet anatomy). Deterministic; rendered by the body map, explained
  // by Astryx. De-dup by localSign so two complaints in one zone don't double up.
  const reflexPlacements: ReflexZoneSet[] = []
  const seenReflexSigns = new Set<string>()
  for (const z of zoneSignals) {
    if (seenReflexSigns.has(z.sign)) continue
    const r = computeReflex(z.sign, z.planet, z.state)
    if (r) { reflexPlacements.push(r); seenReflexSigns.add(z.sign) }
  }

  const polarityDetectionSet: ActivePlanet[] = [...activePlanets]
  const seenPolarityPlanets = new Set(activePlanets.map((p) => p.planet))
  // Symptom-implicated planets AND body-zone action planets join the detection
  // set, so a held knee (Saturn) is evaluated even when the chart doesn't rank it.
  const extraDetectionPlanets = Array.from(new Set([
    ...planetsImplicatedBySymptoms(combinedSymptomSlugs),
    ...zoneSignals.map((z) => z.planet),
  ]))
  for (const planet of extraDetectionPlanets) {
    if (seenPolarityPlanets.has(planet)) continue
    seenPolarityPlanets.add(planet)
    polarityDetectionSet.push({
      planet,
      score: 0,
      urgency: 'active',
      natalWeight: computeNatalWeight(planet, chart, dominantPattern),
      transitPressure: 0,
      symptomScore: 0,
      transitDescription: '',
      calibrationWindow: '',
    })
  }
  const polarityResults = determinePolarity({
    detectedPlanets: polarityDetectionSet,
    directSignals,
    aspects: [dominantPattern.aspect],
    planetSigns,
    planetHouses,
    userSymptoms: combinedSymptomSlugs,
    emotionalState: canonicalEmotional,
    goals: intake.intention,
    // Fix 4 — intention now actually biases SUPPORT: the planets that best
    // deliver the stated intention are preferred when ordering regulators
    // (e.g. "calm" → Moon/Saturn rise as the corrective support).
    intentionSupportPlanets: intentionParse.supportPlanets,
    // Directive I.1 — planets the user marked balanced/strong are resources the
    // correction can borrow from (regulator preference), never deficits.
    resourcedPlanets: intake.resourcedPlanets,
  })

  // A1.2 — SECONDARY house→body correspondence (the "house anatomy" leg). A
  // strongly-afflicted planet sitting in a HEALTH house (1/6/8/12) adds a
  // secondary reflex placement at that house's sign (house N mimics sign N),
  // ranked BELOW the primary sign/quality signals. It never overrides a primary;
  // it only ADDS. No health-house affliction → no house-derived zone (no noise).
  const HEALTH_HOUSES = new Set([1, 6, 8, 12])
  for (const pr of polarityResults) {
    if (pr.dominant_state === 'balanced' || pr.confidence_band === 'weak') continue
    const h = planetHouses[pr.planet]
    if (!h || !HEALTH_HOUSES.has(h)) continue
    const houseSign = signForHouse(h)
    if (!houseSign || seenReflexSigns.has(houseSign)) continue
    const r = computeReflex(houseSign, pr.planet, pr.dominant_state)
    if (r) { reflexPlacements.push({ ...r, secondary: true }); seenReflexSigns.add(houseSign) }
  }

  // The remedy targets the most symptom-implicated IMBALANCED planet.
  // polarityResults is sorted by confidence (symptom weight dominates the
  // score), so [0] is that planet. We deliberately do NOT anchor to
  // dominantPattern.planets[0]: a multi-planet symptom like "inflammation"
  // implicates Mars AND Sun, which can make a Sun aspect the chart-dominant —
  // and anchoring there would mislabel the remedy as Sun. The detection boost
  // already pushes the PRIMARY symptom planet to the top of the pattern when it
  // has an aspect, so in practice these agree; when they don't, the remedy stays
  // correct. (Verified: Mars-excess symptoms → Mars excess, not Sun.)
  // ── Directive B.1: the ONE source of truth (surface → root → aggravator) ──
  // Built ONCE here; every text surface AND audio layer reads from it. The
  // tie-aware primary becomes the canonical dominantPolarity, so prescriptions,
  // the diagnostic, the chamber, and the hero can never name different planets.
  const { hierarchy: signalHierarchy, primaryResult } =
    buildSignalHierarchy(dominantPattern, polarityResults, diagnostic, combinedSymptomSlugs)
  const dominantPolarity = primaryResult ?? polarityResults[0]

  // ── Part B + B.1: re-key the Cosmic Diagnostic to the PRIMARY signal ──
  // Aligns planet + state (no Sun headline on a Mars reading; no excess archetype
  // on a deficiency reading), then sets the corrective action from the SAME
  // corrective protocol the prescription/chamber use.
  if (diagnostic) {
    alignDiagnosticToPrimary(diagnostic, signalHierarchy)
    if (shouldApplyPolarity(dominantPolarity)) {
      const correctedAction = correctiveDiagnosisAction(dominantPolarity)
      diagnostic.rootCause.actionLayer      = correctedAction
      diagnostic.plainLanguage.howToRestore = correctedAction
    }
    // Fix 11 — DISTINCT per-symptom "What To Do" (always, not only under
    // correction). Each routed symptom gets its own theme/planet/state/cell-salt
    // guidance; the frequency work stays unified under the primary (no
    // contradictory fork). Kills the identical-boilerplate problem.
    for (const sr of diagnostic.symptomRouting ?? []) {
      sr.rootCause.actionLayer = buildSymptomGuidance(sr, signalHierarchy.primary.planet, polarityResults)
    }
  }

  // ── Directive F — derive the corrective elemental SETTING from the regulator ──
  const environment = buildEnvironment(signalHierarchy, dominantPolarity, planetSigns)

  // Pass the resolved dominant polarity to every protocol builder so the
  // prescription tiles correct in lockstep with the chamber. Builders fall back
  // to the dominant planet's natural data when the state is balanced/weak.
  const sound = buildSoundProtocol(dominantPattern, dominantPolarity)
  const scent = buildScentProtocol(dominantPattern, dominantPolarity)
  const taste = buildTasteProtocol(dominantPattern, dominantPolarity)
  const body  = buildBodyProtocol(dominantPattern, dominantPolarity)
  const sight = buildSightProtocol(dominantPattern, dominantPolarity)

  // ── Step 7: Sacred Layer ──
  // The dominant planet (first in the pattern) keys the Sacred Botanical,
  // Featured Crystal, and Sacred Tones fork. Lotus Spectrum + Starter Kit
  // are universal — every user gets them. This block runs for both the
  // real-chart and fallback/seed paths since both flow through here.
  const sacredLayer = resolveSacredLayer(signalHierarchy.primary.planet)

  // ── Step 8: Unified Prescriptions ──────────────────────────
  // One cohesive prescription card per planetary signature. Three triggers
  // can spawn a prescription:
  //   (a) Dominant pattern → primary prescription
  //   (b) Symptom routing  → one per symptom that resolved to a different planet
  //   (c) Headline transit → if the transiting planet isn't already covered
  // Deduplicated by primary planet — one card per unique planet.
  const prescriptions: UnifiedPrescription[] = []
  const seenPlanets   = new Set<string>()

  const addPrescription = (
    planet: string,
    source: 'dominant' | 'symptom' | 'transit',
    triggerLabel: string,
  ) => {
    if (!planet || seenPlanets.has(planet)) return
    // Match this planet's polarity so the prescription corrects in lockstep with
    // the chamber (only symptom-driven imbalances flip; chart-only = balanced).
    const planetPolarity = polarityResults.find((pr) => pr.planet === planet)
    const p = composeUnifiedPrescription(planet, source, triggerLabel, planetPolarity)
    if (p) {
      prescriptions.push(p)
      seenPlanets.add(planet)
    }
  }

  // (a) Primary prescription — the PRIMARY signal (B.1), not the raw chart lead,
  // so the hero's prescription names the same planet as the diagnostic + chamber.
  addPrescription(
    signalHierarchy.primary.planet,
    'dominant',
    `${signalHierarchy.primary.planet} ${signalHierarchy.primary.state !== 'balanced' ? signalHierarchy.primary.state + ' ' : ''}— today's dominant signal`,
  )

  // (b) Symptom-routed prescriptions
  if (diagnostic?.symptomRouting) {
    for (const sr of diagnostic.symptomRouting) {
      addPrescription(
        sr.primaryPlanet,
        'symptom',
        `Your reported "${sr.reportedSymptom}" routes to a ${sr.matchedSignature} pattern`,
      )
    }
  }

  // (c) Transit-driven prescription — headline transit if not already covered
  if (diagnostic?.headlineTransit) {
    const ht = diagnostic.headlineTransit
    addPrescription(
      ht.transitingPlanet,
      'transit',
      `Transiting ${ht.transitingPlanet} ${ht.aspect} natal ${ht.natalPlanet} (${ht.applying ? 'applying' : 'separating'}, ${Math.abs(ht.daysToExact).toFixed(0)} days from exact)`,
    )
  }

  return {
    dominant_pattern: dominantPattern,
    soap,
    plan: { sound, scent, taste, body, sight },
    sacredLayer,
    diagnostic,
    prescriptions: prescriptions.length ? prescriptions : undefined,
    activePlanets,
    polarityResults,
    dominantPolarity,
    signalHierarchy,
    // Directive J.5 — resolve the intention to a guaranteed fork (chip → planet,
    // else open-text keyword match, else null). The composer (J.6) honors it.
    intentionPlanet: intentionPlanetFor(intake.intention, intake.intentionText),
    environment,
    // Directive S — dual-placement structure (LOCAL + reflex + planet anatomy).
    reflexPlacements: reflexPlacements.length ? reflexPlacements : undefined,
    reasoningTrace: buildReasoningTrace({
      hierarchy: signalHierarchy,
      dominantPolarity,
      narrativeThemeLabels: narrativeParse.themeLabels,
      narrativeContributed: narrativeParse.matched,
      intentionLabels: intentionParse.labels,
      primaryResult,
    }),
  }
}

// ── Fix 4 — the reasoning trace (why THIS calibration) ──
// Individual reads whyThisSequence; practitioner reads themes + evidence. Proves
// the narrative + intention shaped the sequence. Compliance-safe, non-diagnostic.
function buildReasoningTrace(args: {
  hierarchy: SignalHierarchy
  dominantPolarity?: PolarityResult
  narrativeThemeLabels: string[]
  narrativeContributed: boolean
  intentionLabels: string[]
  primaryResult?: PolarityResult
}): ReasoningTrace {
  const { hierarchy, dominantPolarity, narrativeThemeLabels, narrativeContributed, intentionLabels, primaryResult } = args
  const primary = hierarchy.primary
  const word = signalWord(primary.planet, primary.state)
  const correcting = shouldApplyPolarity(dominantPolarity)
  const regulator = correcting ? dominantPolarity!.protocol.regulator_planets?.[0] : undefined
  const correctiveDir = correcting
    ? (dominantPolarity!.protocol.corrective_direction ?? []).slice(0, 2).join(' and ')
    : ''
  const themeStr = narrativeThemeLabels.slice(0, 3).join(', ')
  const intentStr = intentionLabels.slice(0, 2).join(' and ')

  let why = `Your primary signal today is ${primary.planet} ${word}`
  if (narrativeContributed && themeStr) why += ` — your words pointed to ${themeStr}`
  why += '.'
  if (regulator) {
    why += ` Astryx paired ${primary.planet} with ${regulator} support` +
      (correctiveDir ? ` to ${correctiveDir} the signal` : ' to bring it back toward balance') + '.'
  }
  if (intentStr) why += ` Your intention to ${intentStr} shaped the support and close.`

  return {
    whyThisSequence: why,
    primarySignal: { planet: primary.planet, state: primary.state, word },
    secondarySupport: regulator
      ? { planet: regulator, reason: correctiveDir ? `selected to ${correctiveDir} the primary signal` : 'corrective support for the primary signal' }
      : (hierarchy.secondary
          ? { planet: hierarchy.secondary.planet, reason: 'the chart root your symptoms trace to' }
          : undefined),
    tertiaryIntegration: hierarchy.tertiary
      ? { planet: hierarchy.tertiary.planet, reason: 'the current aggravator in your cosmic weather' }
      : undefined,
    narrativeThemes: narrativeThemeLabels,
    intentionLabels,
    narrativeContributed,
    evidence: (primaryResult?.reasoning ?? []).slice(0, 8),
  }
}

// getAccentColor → moved to @/lib/engineClient (FIX 1A).
