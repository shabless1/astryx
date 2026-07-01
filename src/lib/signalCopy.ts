/**
 * ASTRYX — Signal Card copy (Build Directive v1.1 · Appendix A + Why Matrix)
 *
 * The 40-line Why matrix (10 planets × 4 states) + resonance state vocabulary
 * that replaces "running high / excess". SHA's 10 [approved] lines are verbatim;
 * the other 30 match their voice. Non-diagnostic, COMPLIANCE-safe ("support",
 * never "treat/cure"). If a planet/state is missing, a safe template fallback is
 * used rather than inventing a clinical phrase.
 *
 * Engine state → display state:
 *   excess → elevated · deficiency → depleted · blocked → blocked · balanced → balanced
 */

export type DisplayState = 'elevated' | 'depleted' | 'blocked' | 'balanced'

export function toDisplayState(engineState: string | undefined): DisplayState {
  switch (engineState) {
    case 'excess':      return 'elevated'
    case 'deficiency':  return 'depleted'
    case 'blocked':     return 'blocked'
    default:            return 'balanced'
  }
}

interface SignalCopy { word: string; why: string }

const MATRIX: Record<string, Record<DisplayState, SignalCopy>> = {
  Sun: {
    elevated:  { word: 'Over-radiant', why: 'The Sun is connected to vitality, identity, and life force, so when this signal appears over-radiant, Astryx responds with cooling support and restorative pacing.' },
    depleted:  { word: 'Eclipsed',     why: 'The Sun is connected to vitality, identity, and life force, so when this signal appears eclipsed, Astryx responds with warming, restorative support to rebuild your vitality.' },
    blocked:   { word: 'Obscured',     why: 'The Sun is connected to vitality, identity, and life force, so when this signal appears obscured, Astryx responds with clearing, opening support to let your life force shine through again.' },
    balanced:  { word: 'Radiant',      why: 'The Sun is connected to vitality, identity, and life force, so when this signal appears radiant and steady, Astryx draws on that life force to support the rest of your field.' },
  },
  Moon: {
    elevated:  { word: 'Flooded',         why: 'The Moon is connected to emotional rhythm, rest, and inner nourishment, so when this signal appears flooded, Astryx responds with steadying, containing support to settle the emotional tide.' },
    depleted:  { word: 'Under-supported', why: 'The Moon is connected to emotional rhythm, rest, and inner nourishment, so when this signal appears under-supported, Astryx responds with softness, hydration, and steadying support.' },
    blocked:   { word: 'Held',            why: 'The Moon is connected to emotional rhythm, rest, and inner nourishment, so when this signal appears held, Astryx responds with gentle, opening support to let feeling move and release.' },
    balanced:  { word: 'Nourished',       why: 'The Moon is connected to emotional rhythm, rest, and inner nourishment, so when this signal appears nourished, Astryx draws on that inner steadiness to support the rest of your field.' },
  },
  Mercury: {
    elevated:  { word: 'Amplified', why: 'Mercury is connected to thought, communication, and nervous system rhythm, so when this signal is amplified, Astryx responds with grounding support to help steady the mental field.' },
    depleted:  { word: 'Quieted',   why: 'Mercury is connected to thought, communication, and nervous system rhythm, so when this signal appears quieted, Astryx responds with gentle, clarifying support to wake the mind without overstimulating it.' },
    blocked:   { word: 'Tangled',   why: 'Mercury is connected to thought, communication, and nervous system rhythm, so when this signal appears tangled, Astryx responds with clearing support to loosen the static and let thought move again.' },
    balanced:  { word: 'Clear',     why: 'Mercury is connected to thought, communication, and nervous system rhythm, so when this signal appears clear, Astryx draws on that steady rhythm to support the rest of your field.' },
  },
  Venus: {
    elevated:  { word: 'Over-saturated', why: 'Venus is connected to pleasure, value, connection, and sweetness, so when this signal appears over-saturated, Astryx responds with movement, circulation, and gentle clearing.' },
    depleted:  { word: 'Dimmed',         why: 'Venus is connected to pleasure, value, connection, and sweetness, so when this signal appears dimmed, Astryx responds with warming, replenishing support to restore sweetness and connection.' },
    blocked:   { word: 'Withheld',       why: 'Venus is connected to pleasure, value, connection, and sweetness, so when this signal appears withheld, Astryx responds with opening, circulating support to let connection flow again.' },
    balanced:  { word: 'Harmonized',     why: 'Venus is connected to pleasure, value, connection, and sweetness, so when this signal appears harmonized, Astryx draws on that warmth to support the rest of your field.' },
  },
  Mars: {
    elevated:  { word: 'Overactivated', why: 'Mars is connected to drive, heat, action, and pressure, so when this signal appears overactivated, Astryx responds with cooling support instead of adding more fire.' },
    depleted:  { word: 'Depleted',      why: 'Mars is connected to drive, heat, action, and pressure, so when this signal appears depleted, Astryx responds with warming, rebuilding support to restore drive without forcing it.' },
    blocked:   { word: 'Stalled',       why: 'Mars is connected to drive, heat, action, and pressure, so when this signal appears stalled, Astryx responds with mobilizing support to free the held energy and let action move.' },
    balanced:  { word: 'Tempered',      why: 'Mars is connected to drive, heat, action, and pressure, so when this signal appears tempered, Astryx draws on that steady fire to power the rest of your field.' },
  },
  Jupiter: {
    elevated:  { word: 'Overextended', why: 'Jupiter is connected to growth, expansion, and appetite, so when this signal appears overextended, Astryx responds with containment, pacing, and moderation.' },
    depleted:  { word: 'Contracted',   why: 'Jupiter is connected to growth, expansion, and appetite, so when this signal appears contracted, Astryx responds with warming, encouraging support to restore room to grow.' },
    blocked:   { word: 'Stuck',        why: 'Jupiter is connected to growth, expansion, and appetite, so when this signal appears stuck, Astryx responds with opening support to free expansion and let it move at a steady pace.' },
    balanced:  { word: 'Expansive',    why: 'Jupiter is connected to growth, expansion, and appetite, so when this signal appears expansive and steady, Astryx draws on that growth to support the rest of your field.' },
  },
  Saturn: {
    elevated:  { word: 'Compressed',   why: 'Saturn is connected to structure, boundaries, and containment, so when this signal appears compressed, Astryx responds by softening rigidity while keeping the field grounded.' },
    depleted:  { word: 'Unstructured', why: 'Saturn is connected to structure, boundaries, and containment, so when this signal appears unstructured, Astryx responds with grounding, organizing support to rebuild a steady frame.' },
    blocked:   { word: 'Walled',       why: 'Saturn is connected to structure, boundaries, and containment, so when this signal appears walled, Astryx responds with softening support to ease the boundary without losing ground.' },
    balanced:  { word: 'Grounded',     why: 'Saturn is connected to structure, boundaries, and containment, so when this signal appears grounded, Astryx draws on that structure to steady the rest of your field.' },
  },
  Uranus: {
    elevated:  { word: 'Electrified',   why: 'Uranus is connected to change, insight, and sudden activation, so when this signal appears electrified, Astryx responds with grounding support to stabilize the current.' },
    depleted:  { word: 'Flat',          why: 'Uranus is connected to change, insight, and sudden activation, so when this signal appears flat, Astryx responds with gentle, enlivening support to invite fresh insight without a jolt.' },
    blocked:   { word: 'Locked',        why: 'Uranus is connected to change, insight, and sudden activation, so when this signal appears locked, Astryx responds with releasing support to let change move through cleanly.' },
    balanced:  { word: 'Clear-current', why: 'Uranus is connected to change, insight, and sudden activation, so when this signal appears steady, Astryx draws on that clear current to support the rest of your field.' },
  },
  Neptune: {
    elevated:  { word: 'Diffused', why: 'Neptune is connected to imagination, dreams, and sensitivity, so when this signal appears diffused, Astryx responds with grounding, clarity, and stronger energetic edges.' },
    depleted:  { word: 'Faded',    why: 'Neptune is connected to imagination, dreams, and sensitivity, so when this signal appears faded, Astryx responds with gentle, restorative support to bring imagination and softness back.' },
    blocked:   { word: 'Clouded',  why: 'Neptune is connected to imagination, dreams, and sensitivity, so when this signal appears clouded, Astryx responds with clearing support to lift the fog and restore clarity.' },
    balanced:  { word: 'Attuned',  why: 'Neptune is connected to imagination, dreams, and sensitivity, so when this signal appears attuned, Astryx draws on that sensitivity to support the rest of your field.' },
  },
  Pluto: {
    elevated:  { word: 'Intensified', why: 'Pluto is connected to depth, transformation, and release, so when this signal appears intensified, Astryx responds with steady containment and gentle integration.' },
    depleted:  { word: 'Faint',       why: 'Pluto is connected to depth, transformation, and release, so when this signal appears faint, Astryx responds with grounding, deepening support to restore steady inner depth.' },
    blocked:   { word: 'Buried',      why: 'Pluto is connected to depth, transformation, and release, so when this signal appears buried, Astryx responds with gentle releasing support to let what’s ready move and complete its cycle.' },
    balanced:  { word: 'Integrated',  why: 'Pluto is connected to depth, transformation, and release, so when this signal appears integrated, Astryx draws on that depth to support the rest of your field.' },
  },
}

// Generic, non-clinical fallbacks (used if the engine returns an uncovered combo).
const FALLBACK_WORD: Record<DisplayState, string> = {
  elevated: 'Amplified', depleted: 'Under-supported', blocked: 'Held', balanced: 'Steady',
}

/** The Frequency Signal word for the card (resonance vocabulary, never "excess"). */
export function signalWord(planet: string, engineState: string | undefined): string {
  const st = toDisplayState(engineState)
  return MATRIX[planet]?.[st]?.word ?? FALLBACK_WORD[st]
}

/** The card's "Why" line — one plain, resonance-based, non-diagnostic sentence. */
export function whyLine(planet: string, engineState: string | undefined): string {
  const st = toDisplayState(engineState)
  const hit = MATRIX[planet]?.[st]?.why
  if (hit) return hit
  const verb = st === 'elevated' ? 'cooling and grounding support'
    : st === 'depleted' ? 'warming, rebuilding support'
    : st === 'blocked'  ? 'gentle, opening support'
    : 'steady support that draws on its strength'
  return `${planet} is one of your active signals, so when it appears ${signalWord(planet, engineState).toLowerCase()}, Astryx responds with ${verb}.`
}
