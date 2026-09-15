/**
 * ASTRYX — Practitioner tier gate (P0) invariants.
 *
 * The portal audit's one-sentence blocker: there was no practitioner tier in
 * the money path, so the whole practitioner surface was free to any subscriber
 * who opened Settings. The rule these tests hold is simple and absolute:
 *
 *   THE TIER COMES FROM THE SERVER. A request body can never grant it.
 *
 * If any of these go red, the fix is the gate, never the test.
 */

import { describe, it, expect } from 'vitest'
import {
  sacredTierFor,
  shapeSacredLayerForClient,
  shapePrescriptionsForClient,
  shapePolarityResultsForClient,
  shapeDominantPolarityForClient,
  shapeActivePlanetsForClient,
  shapeDiagnosticForClient,
} from '@/lib/sacredShape'
import { isPractitionerTier } from '@/lib/tierGate'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('SECURITY — the tier comes from the session, never the request body', () => {
  // sacredTierFor() takes the same literal either way, so the property that
  // actually matters lives at the CALL SITE: which value is handed to it.
  // Before P0 the route passed `intake.mode` — a string the client controls.
  // This reads the route source, so a revert fails the build rather than
  // quietly reopening the practitioner sacred layer to anyone who can POST.
  const ROUTE = readFileSync(
    join(process.cwd(), 'src', 'app', 'api', 'protocol', 'route.ts'),
    'utf8',
  )

  it('the protocol route never derives the tier from intake.mode', () => {
    expect(ROUTE).not.toMatch(/sacredTierFor\(\s*intake\.mode/)
    expect(ROUTE).not.toMatch(/sacredTierFor\(\s*body[.?[]/)
  })

  it('the protocol route derives the tier from the session', () => {
    expect(ROUTE).toMatch(/session\?\.user[\s\S]{0,120}tier/)
    expect(ROUTE).toMatch(/sacredTierFor\(\s*sessionTier/)
  })

  it('an unauthenticated caller can never reach the practitioner layer', () => {
    for (const claimed of ['practitioner', 'individual', 'admin', undefined]) {
      expect(sacredTierFor(claimed, false), `${claimed} unauthenticated`).toBe('basic')
    }
  })

  it('a signed-in individual gets the basic layer', () => {
    expect(sacredTierFor('individual', true)).toBe('basic')
    expect(sacredTierFor(undefined, true)).toBe('basic')
  })

  it('only the exact server tier opens it', () => {
    expect(sacredTierFor('practitioner', true)).toBe('practitioner')
    for (const near of ['practitioner_tier', 'Practitioner', 'practitioners', ' practitioner']) {
      expect(sacredTierFor(near, true), `${near} was accepted`).toBe('basic')
    }
  })
})

describe('the tier predicate is exact', () => {
  it('accepts only the literal practitioner tier', () => {
    expect(isPractitionerTier('practitioner')).toBe(true)
    for (const v of ['individual', 'Practitioner', 'PRACTITIONER', 'practitioner ', '', 'verified', null, undefined]) {
      expect(isPractitionerTier(v as string), `${JSON.stringify(v)} was accepted`).toBe(false)
    }
  })

  it('the retired Verified tier grants nothing', () => {
    // SHA cut it 2026-09-10. It must never resolve to elevated access.
    expect(isPractitionerTier('verified')).toBe(false)
    expect(sacredTierFor('verified', true)).toBe('basic')
  })
})

describe('the shaped payload never leaks practitioner fields at basic tier', () => {
  const FULL = {
    botanical: {
      planet: 'Sun', sacredBotanical: 'Calendula', latinName: 'Calendula officinalis',
      teaProfile: 'x', bodyPlacement: 'y', wellnessBenefits: 'z', safetyNote: 's',
      biologicalMechanism: 'SECRET', endocrineTarget: 'SECRET', nervousSystem: 'SECRET',
      esotericSignature: 'NEVER', traditionalUse: 'NEVER',
    },
    crystal: {
      planet: 'Sun', featuredCrystal: 'Citrine', hex: '#fff',
      featuredCrystalData: {
        name: 'Citrine', bodyPlacement: 'p', placementNote: 'n', safetyNote: 's',
        biologicalMechanism: 'SECRET', mineralComposition: 'SECRET',
      },
    },
    dominantFork: {
      planet: 'Sun', chakra: 'Solar Plexus', hz: '126.22', note: 'C', color: '#f00',
      boneApplicationPoint: 'p', nervePlexus: 'SECRET', clinicalNote: 'SECRET',
    },
    lotusSpectrum: ['NEVER SHIPPED'],
    starterKit: { name: 'NEVER SHIPPED' },
  } as never

  it('basic tier omits every clinical field', () => {
    const blob = JSON.stringify(shapeSacredLayerForClient(FULL, 'basic'))
    expect(blob).not.toContain('SECRET')
    expect(blob).not.toContain('NEVER')
    expect(blob).toContain('Calendula')
  })

  it('the Lotus Spectrum and starter kits ship at NO tier', () => {
    for (const t of ['basic', 'practitioner'] as const) {
      const blob = JSON.stringify(shapeSacredLayerForClient(FULL, t))
      expect(blob, `lotusSpectrum leaked at ${t}`).not.toContain('lotusSpectrum')
      expect(blob, `starterKit leaked at ${t}`).not.toContain('starterKit')
      expect(blob, `NEVER-SHIPPED value leaked at ${t}`).not.toContain('NEVER SHIPPED')
    }
  })

  it('practitioner tier does receive the clinical fields', () => {
    const blob = JSON.stringify(shapeSacredLayerForClient(FULL, 'practitioner'))
    expect(blob).toContain('SECRET')
    // ...but never the fields that ship at no tier.
    expect(blob).not.toContain('NEVER')
  })
})

describe('SECURITY — the SECOND door: prescriptions[] carried an unshaped copy', () => {
  // Found live on 2026-09-10 while verifying the P0 gate: an unauthenticated
  // POST to /api/protocol returned nervePlexus, clinicalNote, ANSEffect,
  // biologicalMechanism and endocrineTarget — not via sacredLayer (which was
  // correctly shaped to "basic") but via protocol.prescriptions[], which
  // carries its own copy of the same records. Shaping one door contained
  // nothing while the other stood open.
  const RX = [{
    signature: 'Sun',
    prescription: 'visible',
    botanical: {
      planet: 'Sun', sacredBotanical: 'Calendula', teaProfile: 'ok', safetyNote: 'ok',
      biologicalMechanism: 'CLINICAL', endocrineTarget: 'CLINICAL',
      esotericSignature: 'NEVERSHIP', traditionalUse: 'NEVERSHIP', kitProduct: 'NEVERSHIP',
    },
    crystal: {
      planet: 'Sun', featuredCrystal: 'Citrine', hex: '#fff',
      featuredCrystalData: { name: 'Citrine', safetyNote: 'ok', biologicalMechanism: 'CLINICAL' },
    },
    fork: {
      planet: 'Sun', hz: '126.22', boneApplicationPoint: 'ok',
      nervePlexus: 'CLINICAL', clinicalNote: 'CLINICAL', ANSEffect: 'CLINICAL',
    },
  }]

  it('basic tier strips every clinical field from every prescription', () => {
    const blob = JSON.stringify(shapePrescriptionsForClient(RX, 'basic'))
    expect(blob).not.toContain('CLINICAL')
    expect(blob).toContain('Calendula')
    expect(blob).toContain('visible')   // non-sacred prescription copy survives
  })

  it('fields that ship at NO tier never appear, even for a practitioner', () => {
    for (const t of ['basic', 'practitioner'] as const) {
      const blob = JSON.stringify(shapePrescriptionsForClient(RX, t))
      expect(blob, `never-ship field leaked at ${t}`).not.toContain('NEVERSHIP')
    }
  })

  it('practitioner tier still receives the clinical fields', () => {
    const blob = JSON.stringify(shapePrescriptionsForClient(RX, 'practitioner'))
    expect(blob).toContain('CLINICAL')
  })

  it('a non-array or empty payload passes through untouched', () => {
    expect(shapePrescriptionsForClient(undefined, 'basic')).toBeUndefined()
    expect(shapePrescriptionsForClient([], 'basic')).toEqual([])
  })

  it('the route shapes BOTH doors — a third copy must come through here too', () => {
    const ROUTE = readFileSync(join(process.cwd(), 'src', 'app', 'api', 'protocol', 'route.ts'), 'utf8')
    expect(ROUTE).toMatch(/shapeSacredLayerForClient\(/)
    expect(ROUTE).toMatch(/shapePrescriptionsForClient\(/)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('SECURITY — the THIRD door: everything the spread carried out raw', () => {
  // Found 2026-09-13 while building the Worker's tiered shaping. The route
  // returns `{ ...protocol, sacredLayer: shaped, prescriptions: shaped }`, so
  // every field NOT named there went out untouched to any signed-in caller.

  const POLARITY = [
    {
      planet: 'Saturn',
      dominant_state: 'excess',
      secondary_state: 'blocked',
      confidence: 87,
      confidence_band: 'high',
      overridden: false,
      symptomDriven: true,
      resourced: false,
      reasoning: ['a reason'],
      scores: { excess: 9, deficiency: 1, blocked: 4, balanced: 0 },
      protocol: {
        regulator_planets: ['Venus', 'Moon'],
        corrective_direction: ['soften', 'warm', 'open', 'FIFTH', 'SIXTH'],
        avoid: ['a', 'b', 'c', 'd', 'FIFTH'],
        herbs: ['h1', 'h2', 'h3', 'h4', 'FIFTH'],
        scents: ['s1', 's2', 's3', 'FOURTH'],
        color_palette: ['#1', '#2', '#3', 'FOURTH'],
        sound_character: 'warm',
        support_style: 'soften',
        breath: 'long_exhale',
        scale_override: 'lydian',
        indicators: ['NEVER SHIPPED'],
        visual_motion: 'NEVER SHIPPED',
      },
    },
  ] as never

  it('the per-state score map never leaves — that is the ranking model', () => {
    const blob = JSON.stringify(shapePolarityResultsForClient(POLARITY))
    expect(blob).not.toContain('scores')
    expect(blob).not.toContain('"deficiency":1')
  })

  it('the numeric confidence leaves only on the dominant result', () => {
    const many = shapePolarityResultsForClient(POLARITY) as any[]
    expect(many[0].confidence).toBeUndefined()
    expect(many[0].confidence_band).toBe('high')
    // The practitioner DNA panel prints the number, and reads it from here.
    expect((shapeDominantPolarityForClient(POLARITY[0]) as any).confidence).toBe(87)
  })

  it('drops the corrective-row fields nothing renders', () => {
    const blob = JSON.stringify(shapePolarityResultsForClient(POLARITY))
    expect(blob).not.toContain('NEVER SHIPPED')
    expect(blob).not.toContain('indicators')
    expect(blob).not.toContain('visual_motion')
  })

  it('trims every list to what the screens actually show', () => {
    const [r] = shapePolarityResultsForClient(POLARITY) as any[]
    expect(r.protocol.corrective_direction).toHaveLength(3)
    expect(r.protocol.avoid).toHaveLength(4)
    expect(r.protocol.herbs).toHaveLength(4)
    expect(r.protocol.scents).toHaveLength(3)
    expect(r.protocol.color_palette).toHaveLength(3)
    expect(JSON.stringify(r)).not.toContain('FIFTH')
    expect(JSON.stringify(r)).not.toContain('FOURTH')
  })

  it('keeps what the app genuinely needs to render and to compose', () => {
    const [r] = shapePolarityResultsForClient(POLARITY) as any[]
    // forkRite filters the whole regulator list when it picks a counterweight.
    expect(r.protocol.regulator_planets).toEqual(['Venus', 'Moon'])
    // ChamberDNAEngine, ScaleEngine, ResultsScreen.
    expect(r.protocol.breath).toBe('long_exhale')
    expect(r.protocol.scale_override).toBe('lydian')
    expect(r.protocol.support_style).toBe('soften')
    expect(r.protocol.sound_character).toBe('warm')
    // The composer reads these three off every result.
    expect(r.planet).toBe('Saturn')
    expect(r.dominant_state).toBe('excess')
    expect(r.resourced).toBe(false)
  })

  it('the tri-source ranking weights never leave', () => {
    const shaped = shapeActivePlanetsForClient([
      { planet: 'Mars', urgency: 'high', transitDescription: 'd', calibrationWindow: 'w',
        score: 9.1, natalWeight: 3.2, transitPressure: 4.4, symptomScore: 1.5 },
    ] as never) as any[]
    expect(shaped[0].planet).toBe('Mars')
    expect(shaped[0].urgency).toBe('high')
    const blob = JSON.stringify(shaped)
    for (const k of ['score', 'natalWeight', 'transitPressure', 'symptomScore']) {
      expect(blob).not.toContain(k)
    }
  })

  it('the medicalAstrology routing keys never leave', () => {
    const shaped = shapeDiagnosticForClient({
      dominantPlanet: 'Saturn',
      symptomRouting: [
        {
          reportedSymptom: 'tension', primaryPlanet: 'Saturn',
          matchedSubtypeDescription: 'a readable description',
          rootCause: 'r', activationScore: 7, evidence: ['e'],
          matchedRootCauseKey: 'NEVER SHIPPED', matchedSignature: 'NEVER SHIPPED',
          matchedSubtype: 'NEVER SHIPPED',
          recommendedCellSalt: { saltShort: 'Kali Phos', epithet: 'x', traditionalPreparation: 'NEVER SHIPPED' },
        },
      ],
    } as never) as any
    const blob = JSON.stringify(shaped)
    expect(blob).not.toContain('NEVER SHIPPED')
    // What a person is shown survives.
    expect(shaped.symptomRouting[0].matchedSubtypeDescription).toBe('a readable description')
    expect(shaped.symptomRouting[0].recommendedCellSalt.saltShort).toBe('Kali Phos')
    expect(shaped.dominantPlanet).toBe('Saturn')
  })

  it('passes odd input through without inventing structure', () => {
    expect(shapePolarityResultsForClient(undefined)).toBeUndefined()
    expect(shapeActivePlanetsForClient(null)).toBeNull()
    expect(shapeDiagnosticForClient(undefined)).toBeUndefined()
    expect(shapeDominantPolarityForClient(undefined)).toBeUndefined()
  })

  it('the route shapes ALL FOUR doors — a fifth copy must come through here too', () => {
    const ROUTE = readFileSync(join(process.cwd(), 'src', 'app', 'api', 'protocol', 'route.ts'), 'utf8')
    expect(ROUTE).toMatch(/shapePolarityResultsForClient\(/)
    expect(ROUTE).toMatch(/shapeDominantPolarityForClient\(/)
    expect(ROUTE).toMatch(/shapeActivePlanetsForClient\(/)
    expect(ROUTE).toMatch(/shapeDiagnosticForClient\(/)
  })
})
