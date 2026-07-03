/**
 * Astryx action envelope — determinism golden tests (Directive v4.4 · Fix 2).
 * The action generator is pure and LLM-free: same message + same engine report
 * → byte-identical actions, on the server route, the offline brain, and here.
 * sessionHash values are the app's single deep-link vocabulary.
 */

import { describe, it, expect } from 'vitest'
import { deriveAstryxActions } from '@/lib/astryx/actions'

// A frozen slice of an engine report — only the fields the generator reads.
const REPORT = {
  diagnostic: { headlineTransit: { transitingPlanet: 'Saturn' } },
  signalHierarchy: { primary: { planet: 'Mars' } },
  dominant_pattern: { planets: ['Venus'] },
}

describe('deriveAstryxActions — deterministic, LLM-free', () => {
  it('is byte-identical across identical calls', () => {
    const msg = 'what are today’s transits and what should I do?'
    const a = deriveAstryxActions(msg, REPORT)
    const b = deriveAstryxActions(msg, REPORT)
    expect(JSON.stringify(b)).toBe(JSON.stringify(a))
    expect(a).toMatchSnapshot()
  })

  it('transits/today ask → the daily door, led by the headline transit planet', () => {
    const [action, ...rest] = deriveAstryxActions('what are today’s transits?', REPORT)
    expect(rest).toHaveLength(0)
    expect(action.sessionHash).toBe('#session/custom')
    expect(action.context).toContain('Saturn-led')
  })

  it('daily lead falls back: signal hierarchy, then dominant pattern, then generic', () => {
    const viaHierarchy = deriveAstryxActions('today', { signalHierarchy: { primary: { planet: 'Mars' } } })
    expect(viaHierarchy[0].context).toContain('Mars-led')
    const viaPattern = deriveAstryxActions('today', { dominant_pattern: { planets: ['Venus'] } })
    expect(viaPattern[0].context).toContain('Venus-led')
    const generic = deriveAstryxActions('today', null)
    expect(generic[0].context).toBe('Tuned to your chart and today’s sky')
  })

  it('full body ask → the ladder door', () => {
    const actions = deriveAstryxActions('can you set up the full body ladder?', REPORT)
    expect(actions.map((a) => a.sessionHash)).toContain('#session/full-body')
  })

  it('chakra ask → chakra door, planetary unless solfeggio is named', () => {
    expect(deriveAstryxActions('I want a chakra session', REPORT)[0].sessionHash)
      .toBe('#session/chakra-planetary')
    expect(deriveAstryxActions('chakra session with the solfeggio forks', REPORT)[0].sessionHash)
      .toBe('#session/chakra-solfeggio')
  })

  it('a specific-mode ask does NOT also open the daily door', () => {
    const actions = deriveAstryxActions('run a full body session today', REPORT)
    expect(actions.map((a) => a.sessionHash)).toEqual(['#session/full-body'])
  })

  it('an unrelated question yields no actions', () => {
    expect(deriveAstryxActions('what does my Moon in Pisces mean?', REPORT)).toEqual([])
    expect(deriveAstryxActions('', REPORT)).toEqual([])
  })
})
