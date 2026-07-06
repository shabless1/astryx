/**
 * ASTRYX — user-facing display labels (LEGAL SHIELD v1 · FIX 4).
 * ════════════════════════════════════════════════════════════════════════
 * Softened register for the free / Individual surface. This is a DISPLAY layer
 * only: internal type names (UnifiedPrescription, SOAPOutput, DiagnosticOutput,
 * SymptomRouting…), data keys (protocol.diagnostic, symptomRouting,
 * cellSaltPrescription…) and function names are UNCHANGED — so the engine and
 * the golden determinism suite are untouched. Render these labels instead of
 * hardcoding the clinical word.
 *
 * Rename map (per directive §5):
 *   symptom      → signal / "what you're noticing"
 *   diagnostic   → session summary / reflection
 *   SOAP         → session summary
 *   prescription → recommendation / session plan
 *   medical astrology → wellness / body-based astrology
 *   treatment channel → focus area / resonance channel
 */
export const DISPLAY = {
  signalRouting: 'Signal Routing',
  sessionSummary: 'Session Summary',
  quickSignalCheckIn: 'Quick Signal Check-In',
  wellnessAstrology: 'body-based wellness',
  focusArea: 'Focus Area',
} as const
