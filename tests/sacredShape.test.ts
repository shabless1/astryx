/**
 * Sacred-layer containment — golden guard (Positioning Roadmap Phase 1.6).
 * The /api/protocol door must never ship the full sacred records, the Lotus
 * Spectrum, or the starter kits to a client. These assertions are the fence:
 * if a future change widens the shaped response, this fails loudly.
 */

import { describe, it, expect } from 'vitest'
import { shapeSacredLayerForClient, sacredTierFor } from '@/lib/sacredShape'

// A fully-populated sacred layer with sentinel values for the crown-jewel fields.
const FULL = {
  botanical: {
    planet: 'Sun', sacredBotanical: 'Calendula', latinName: 'Calendula officinalis', tier: 2,
    color: '#F59E0B', colorVibration: 'CV_SECRET', esotericSignature: 'ESO_SECRET',
    biologicalSystem: 'bs', biologicalMechanism: 'MECH_SECRET', endocrineTarget: 'et',
    nervousSystem: 'ns', brainwaveAffinity: 'ba', wellnessBenefits: ['warmth'],
    teaSafe: true, teaProfile: 'steep 5 min', traditionalUse: 'TU_SECRET',
    bodyPlacement: 'solar plexus', safetyNote: 'safe', kitProduct: 'KIT_SECRET', kitEligible: true,
  },
  crystal: {
    planet: 'Sun', featuredCrystal: 'Citrine', existingGems: ['GEM_SECRET'], metal: 'METAL_SECRET', hex: '#FFD700',
    featuredCrystalData: {
      name: 'Citrine', mineralComposition: 'COMP_SECRET', biologicalMechanism: 'MECH_SECRET',
      biologicalSystem: 'bs', endocrineTarget: 'et', nervousSystem: 'ns',
      bodyPlacement: 'solar plexus', placementNote: 'rest it', safetyNote: 'polished', kitEligible: true,
    },
  },
  lotusSpectrum: [{ variety: 'Blue Lotus', esotericSignature: 'LOTUS_SECRET' }],
  dominantFork: {
    planet: 'Sun', chakra: 'Solar Plexus', hz: '126.22', solfeggioFallback: 528, note: 'C', color: '#F59E0B',
    nervePlexus: 'NP_SECRET', boneApplicationPoint: 'T10-T12', vagusConnection: 'VC_SECRET',
    vagusStrength: 'VS_SECRET', brainwaveAffinity: 'ba', brainwaveState: 'bs', ANSEffect: 'ANS_SECRET', clinicalNote: 'CLIN_SECRET',
  },
  starterKit: { kitId: 'k', kitName: 'KIT_SECRET', tagline: 't', description: 'd', variants: 'v', contents: ['c'], shopLink: 's', proposedPrice: '$', appIntegration: 'a', kitEligible: true },
} as any

const json = (v: unknown) => JSON.stringify(v)

describe('shapeSacredLayerForClient — sell the output, never the dataset', () => {
  it('never ships the Lotus Spectrum or the starter kits, at any tier', () => {
    for (const tier of ['basic', 'practitioner'] as const) {
      const out = shapeSacredLayerForClient(FULL, tier) as any
      expect(out.lotusSpectrum).toBeUndefined()
      expect(out.starterKit).toBeUndefined()
      expect(json(out)).not.toContain('LOTUS_SECRET')
      expect(json(out)).not.toContain('KIT_SECRET')
    }
  })

  it('basic tier = display fields only (what the Individual screens render)', () => {
    const out = shapeSacredLayerForClient(FULL, 'basic') as any
    // what SessionScreen / the tea + crystal steps actually read
    expect(out.botanical.sacredBotanical).toBe('Calendula')
    expect(out.botanical.teaProfile).toBe('steep 5 min')
    expect(out.botanical.safetyNote).toBe('safe')
    expect(out.crystal.featuredCrystal).toBe('Citrine')
    expect(out.crystal.featuredCrystalData.bodyPlacement).toBe('solar plexus')
    expect(out.dominantFork.hz).toBe('126.22')
    // the crown-jewel depth is absent
    const s = json(out)
    for (const secret of ['ESO_SECRET', 'CV_SECRET', 'TU_SECRET', 'MECH_SECRET', 'COMP_SECRET', 'GEM_SECRET', 'METAL_SECRET', 'NP_SECRET', 'VC_SECRET', 'VS_SECRET', 'ANS_SECRET', 'CLIN_SECRET']) {
      expect(s).not.toContain(secret)
    }
    expect(out.tier).toBe('basic')
  })

  it('practitioner tier adds exactly the fields the practitioner screen + PDF print — nothing more', () => {
    const out = shapeSacredLayerForClient(FULL, 'practitioner') as any
    expect(out.botanical.biologicalMechanism).toBe('MECH_SECRET')
    expect(out.crystal.featuredCrystalData.mineralComposition).toBe('COMP_SECRET')
    expect(out.dominantFork.clinicalNote).toBe('CLIN_SECRET')
    // still never: esoteric signature, kit/commerce internals, gems/metal, lotus, kits
    const s = json(out)
    for (const secret of ['ESO_SECRET', 'CV_SECRET', 'TU_SECRET', 'GEM_SECRET', 'METAL_SECRET', 'LOTUS_SECRET', 'KIT_SECRET']) {
      expect(s).not.toContain(secret)
    }
    expect(out.tier).toBe('practitioner')
  })

  it('is deterministic and null-safe', () => {
    expect(json(shapeSacredLayerForClient(FULL, 'basic'))).toBe(json(shapeSacredLayerForClient(FULL, 'basic')))
    expect(shapeSacredLayerForClient(null, 'basic')).toBeNull()
    expect(shapeSacredLayerForClient(undefined, 'practitioner')).toBeNull()
  })
})

describe('sacredTierFor — the tier seam', () => {
  it('practitioner requires practitioner mode AND an authenticated session', () => {
    expect(sacredTierFor('practitioner', true)).toBe('practitioner')
    expect(sacredTierFor('practitioner', false)).toBe('basic')
    expect(sacredTierFor('user', true)).toBe('basic')
    expect(sacredTierFor(undefined, true)).toBe('basic')
  })
})
