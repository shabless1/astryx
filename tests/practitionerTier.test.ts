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
import { sacredTierFor, shapeSacredLayerForClient } from '@/lib/sacredShape'
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
