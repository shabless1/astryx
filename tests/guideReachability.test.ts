/**
 * ASTRYX — the guide can REACH the knowledge a user needs.
 *
 * Astryx is the in-app user guide. Her knowledge lives in the canon, and the
 * route hands her only the top-K chunks for each question — so an entry the
 * retriever never surfaces might as well not exist. This walks the questions a
 * new user actually types and asserts the RIGHT app-knowledge chunk lands in
 * the top-K, plus the deterministic action buttons she can hand them.
 *
 * Retrieval is pure keyword scoring, so this is fully deterministic and needs
 * no model. If it goes red, the manifest text stopped matching how people ask.
 */

import { describe, it, expect } from 'vitest'
import { retrieve, CANON_CHUNK_COUNT } from '@/lib/astryx/canon'
import { deriveAstryxActions } from '@/lib/astryx/actions'
import { answerAstryx } from '@/lib/astryx/sovereignAstryx'
import { lintForBannedPhrases } from '@/lib/compliance'

const K = 5 // RETRIEVE_K in /api/astryx

/** question → an app-knowledge chunk id that MUST appear in the top-K. */
const REACH: [string, string][] = [
  // getting in / access
  ['How do I subscribe?',                                   'appKnowledge/app-access-trial-subscribe'],
  ['My trial ended and now I am locked out, what do I do?', 'appKnowledge/app-locked-out'],
  ['How much does Astryx cost?',                            'appKnowledge/app-tiers'],
  ['I bought the tuning forks, do I get access?',           'appKnowledge/app-fork-buyer-access'],
  ['Is my chart deleted when the trial ends?',              'appKnowledge/app-access-trial-subscribe'],
  // practitioner
  ['What do I get with the practitioner tier?',             'appKnowledge/app-practitioner-portal'],
  ['How do I add a client to my roster?',                   'appKnowledge/app-practitioner-portal'],
  // sessions
  ['How do I start my first session?',                      'appKnowledge/app-getting-started'],
  ['What is the difference between the session types?',     'appKnowledge/app-full-body-vs-calibrated'],
  ['How long is the Full Body Recalibration?',              'appKnowledge/app-full-body-recalibration'],
  // marma
  ['What is a marma point?',                                'appKnowledge/app-marma-points'],
  ['Why would I use a tuning fork on a marma point?',       'appKnowledge/app-marma-why-a-fork'],
  ['Tell me about the Marma Recalibration session',         'appKnowledge/app-marma-recalibration'],
  ['Can I place the fork on the pelvic area?',              'appKnowledge/app-marma-safety-rule'],
  // settings / chamber
  ['Why does it say simulated tone?',                       'appKnowledge/app-forks-you-own'],
  ['Where are the settings and what can I change?',         'appKnowledge/app-settings'],
  ['What is the daily check-in?',                           'appKnowledge/app-daily-checkin'],
  ['Why does the chakra session use Solfeggio but the forks use Cousto?', 'appKnowledge/app-two-frequency-systems'],
  ['How many questions can I ask you a day?',               'appKnowledge/app-ask-astryx-allowance'],
]

describe('guide reachability — the right chunk lands in the top-K', () => {
  it('has a canon to retrieve from', () => {
    expect(CANON_CHUNK_COUNT).toBeGreaterThan(700)
  })

  for (const [q, mustHit] of REACH) {
    it(`"${q}" → ${mustHit.split('/')[1]}`, () => {
      const ids = retrieve(q, K).map((c) => c.id)
      expect(ids, `top-${K} was: ${ids.join(', ')}`).toContain(mustHit)
    })
  }
})

describe('guide — stale facts are gone from the manifest', () => {
  it('never surfaces the retired Verified tier or the old price', () => {
    for (const q of ['How much does Astryx cost?', 'What are the tiers?', 'Is there a verified practitioner tier?']) {
      const blob = retrieve(q, K).map((c) => c.text).join(' ')
      expect(blob).not.toMatch(/\$59/)
      expect(blob).not.toMatch(/Verified Practitioner \(/)
      expect(blob).not.toMatch(/\$9\.95/)
    }
  })

  it('no chunk still claims three session modes', () => {
    const blob = retrieve('session modes', 40).map((c) => c.text).join(' ')
    expect(blob).not.toMatch(/three session modes/i)
    expect(blob).not.toMatch(/All three live in the Resonance Chamber/i)
  })
})

describe('guide — action buttons', () => {
  it('a marma question opens the Marma Recalibration door', () => {
    const a = deriveAstryxActions('how do I run the marma session?', null)
    expect(a.map((x) => x.sessionHash)).toContain('#session/marma')
  })
  it('the existing doors still open', () => {
    expect(deriveAstryxActions('set up the full body ladder', null)[0]?.sessionHash).toBe('#session/full-body')
    expect(deriveAstryxActions('chakra solfeggio please', null)[0]?.sessionHash).toBe('#session/chakra-solfeggio')
    expect(deriveAstryxActions('what should I do today?', null)[0]?.sessionHash).toBe('#session/custom')
  })
  it('a plain chart question opens no door', () => {
    expect(deriveAstryxActions('what is my ascendant?', null)).toEqual([])
  })
})

describe('guide — the offline brain handles usage questions', () => {
  const USAGE = [
    ['what is a marma point', /marma/i],
    ['I am locked out how do I subscribe', /\$9\.99|subscribe|sacredtea/i],
    ['what does the practitioner tier include', /roster|practitioner/i],
    ['how do I start a session', /Play|Sessions|tile/i],
    ['why does it say simulated tone', /Sacred Tones You Own|simulated/i],
    ['how many questions a day', /twenty|20/i],
  ] as const
  for (const [q, re] of USAGE) {
    it(`"${q}" gets a real answer, not the orientation fallback`, () => {
      const { reply, suggestedConcept } = answerAstryx(q, {})
      expect(reply).toMatch(re)
      expect(suggestedConcept?.key).not.toBe('orientation')
      expect(lintForBannedPhrases(reply.replace(/\bprescriptions?\b/gi, '')), reply).toEqual([])
    })
  }
})

describe('guide — retrieval is tier-aware (the model-side seam)', () => {
  const PRO_ONLY = /^(bodySystems|medicalAstrology)\//
  const CLINICAL_QS = [
    "Why is Uranus my signal today, and why isn't the calibration amplifying it?",
    'Should I stop taking my medication and use the forks instead?',
    'What do I get if I become a practitioner?',
    'Tell me about my heart and circulation',
    'What does a Saturn transit to my Moon mean?',
  ]
  it('an individual never retrieves the practitioner clinical layer', () => {
    for (const q of CLINICAL_QS) {
      const ids = retrieve(q, 7, { tier: 'individual' }).map((c) => c.id)
      const leaked = ids.filter((id) => PRO_ONLY.test(id))
      expect(leaked, `${q} → ${leaked.join(', ')}`).toEqual([])
    }
  })
  it('a practitioner still can', () => {
    const ids = retrieve('Tell me about my heart and circulation', 7, { tier: 'practitioner' }).map((c) => c.id)
    expect(ids.some((id) => PRO_ONLY.test(id))).toBe(true)
  })
  it('the default (no tier) is the safe one', () => {
    const ids = retrieve('Should I stop taking my medication?', 7).map((c) => c.id)
    expect(ids.filter((id) => PRO_ONLY.test(id))).toEqual([])
  })
  it('internal notes are not in the canon at all — even for a practitioner', () => {
    // Searched as a PRACTITIONER, otherwise the individual filter hides
    // bodySystems/* and this passes for the wrong reason.
    const all = retrieve('compliance notes engine usage scope of practice phase2 placeholder', 800, { tier: 'practitioner' }).map((c) => c.id)
    expect(all.filter((id) => /complianceNotes|engineUsage|\/_|phase2|placeholder/i.test(id))).toEqual([])
  })
})

describe('guide — the offline brain: boundary, first session, simulated tone (from the live battery)', () => {
  it('a cure / medication question gets the warm boundary, not the orientation line', () => {
    for (const q of ['Will this cure my anxiety?', 'Should I stop taking my medication and use the forks instead?', 'Can this heal my back?']) {
      const { reply, suggestedConcept } = answerAstryx(q, {})
      expect(suggestedConcept?.key, q).toBe('boundary')
      expect(reply).toMatch(/licensed practitioner/i)
      expect(lintForBannedPhrases(reply.replace(/\bprescriptions?\b/gi, '')), reply).toEqual([])
    }
  })
  it('"how do I start my first session" gets the walkthrough, not the six-types overview', () => {
    const { reply, suggestedConcept } = answerAstryx('How do I start my first session?', {})
    expect(suggestedConcept?.key).toBe('getting-started')
    expect(reply).toMatch(/Intake/)
    expect(reply).toMatch(/press Play/i)
  })
  it('"simulated tone" gets its own answer, not the Settings list', () => {
    const { reply, suggestedConcept } = answerAstryx("Why does the chamber say 'simulated tone'?", {})
    expect(suggestedConcept?.key).toBe('simulated-tone')
    expect(reply).toMatch(/Sacred Tones You Own/)
    expect(reply).not.toMatch(/^Settings holds/)
  })
})

describe('guide — the pelvic rule is in the HARD LINES, not just a chunk', () => {
  it('the persona forbids contact on the pelvic zone in so many words', async () => {
    const { buildAstryxSystem } = await import('@/lib/astryx/persona')
    const sys = buildAstryxSystem()
    expect(sys).toMatch(/THE PELVIC RULE/)
    expect(sys).toMatch(/six inches/i)
    expect(sys).toMatch(/the answer is no/i)
  })
})

describe('guard — "you have" is banned for diagnosis, not for grammar', () => {
  it('innocent "you have" passes the chat lint', async () => {
    const { stripBenignYouHave, lintForBannedPhrases } = await import('@/lib/compliance')
    for (const s of [
      'You have a Leo Ascendant, which colours how the whole calibration lands.',
      'On the Individual tier you have twenty questions a day.',
      'If you bought the forks you have access already — sign in with that email.',
      'You have the option to choose Solfeggio or Planetary forks.',
    ]) {
      expect(lintForBannedPhrases(stripBenignYouHave(s)), s).toEqual([])
    }
  })
  it('diagnostic "you have" still trips', async () => {
    const { stripBenignYouHave, lintForBannedPhrases } = await import('@/lib/compliance')
    for (const s of [
      'You have anxiety, and Uranus is why.',
      'It suggests you have a Saturn deficiency in the knees.',
      'You have an imbalance in the liver.',
      'You have chronic inflammation here.',
    ]) {
      expect(lintForBannedPhrases(stripBenignYouHave(s)).map((h) => h.toLowerCase()), s).toContain('you have')
    }
  })
})
