/**
 * Astryx action envelope (Directive v4.4 · Fix 2) — chat → chamber, hands on.
 *
 * DETERMINISTIC AND LLM-FREE: this pure function derives the available session
 * actions from (a) keyword intent in the user's message and (b) the engine's
 * ALREADY-COMPUTED daily state carried in the protocol. The LLM never
 * generates, selects, or configures an action — its reply text merely refers
 * to the button naturally. Used identically by /api/astryx (server), the
 * offline sovereign brain (client), and the golden test.
 *
 * sessionHash values are the app's single routing vocabulary (deep-link shim):
 *   #session/custom · #session/full-body ·
 *   #session/chakra-planetary · #session/chakra-solfeggio
 */

export interface AstryxAction {
  label: string
  sessionHash: string
  context: string
}

const CUSTOM = /transit|today|sky|calibrat|recalibrat|session|what should i do|daily/i
const FULL_BODY = /full.?body|ladder|whole body|head to (toe|feet)|feet to head/i
const CHAKRA = /chakra|seven centers|root to crown/i
const SOLFEGGIO = /solfeggio/i

/** The daily lead planet, straight from the engine's computed output. */
function dailyLeadPlanet(report: any): string | null {
  return (
    report?.diagnostic?.headlineTransit?.transitingPlanet ??
    report?.signalHierarchy?.primary?.planet ??
    report?.dominant_pattern?.planets?.[0] ??
    null
  )
}

export function deriveAstryxActions(message: string, report: any): AstryxAction[] {
  const m = (message ?? '').toLowerCase()
  const actions: AstryxAction[] = []

  // Specific modes first — a chakra/full-body ask should lead with its own door.
  if (FULL_BODY.test(m)) {
    actions.push({
      label: 'Set up the Full Body ladder →',
      sessionHash: '#session/full-body',
      context: 'All twelve forks, ground to crown and back',
    })
  }
  if (CHAKRA.test(m)) {
    const solf = SOLFEGGIO.test(m)
    actions.push({
      label: 'Begin Chakra Recalibration →',
      sessionHash: solf ? '#session/chakra-solfeggio' : '#session/chakra-planetary',
      context: solf ? 'Seven centers · Solfeggio forks' : 'Seven centers · Planetary forks',
    })
  }
  // The daily door — transits/today/session asks carry today's engine session.
  if (actions.length === 0 && CUSTOM.test(m)) {
    const lead = dailyLeadPlanet(report)
    actions.push({
      label: 'Begin today’s calibration →',
      sessionHash: '#session/custom',
      context: lead ? `${lead}-led · tuned to today’s sky` : 'Tuned to your chart and today’s sky',
    })
  }

  return actions
}
