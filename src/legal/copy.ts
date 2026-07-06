/**
 * ASTRYX — Legal copy (LEGAL SHIELD v1 · single source of truth)
 * ════════════════════════════════════════════════════════════════════════
 * EVERY user-facing legal string lives HERE and nowhere else, so counsel's
 * wording changes are a ONE-FILE edit + a version bump. Components and API
 * routes import from `@/legal` (this module's barrel) — never inline legal
 * prose in a component.
 *
 *   • Consent & assumption-of-risk gate  (FIX 1)
 *   • Micro / full disclaimers            (FIX 2 — re-exported by compliance.ts)
 *   • AI disclosure                        (FIX 2)
 *   • Beta banner                          (FIX 2)
 *
 * ┌─ ATTORNEY STATUS ──────────────────────────────────────────────────────┐
 * │ The companion doc ASTRYX_LEGAL_CLEANUP_DIRECTIVE_v1.md (the drafted,     │
 * │ attorney-pending strings) was NOT present when this was wired in. Per    │
 * │ the directive's GATE/HANDOFF ("ship the mechanism now; final language is │
 * │ a one-file edit"), the CONSENT strings below are DRAFT: assembled from   │
 * │ Astryx's already-approved compliance language (compliance.ts attestation │
 * │ clauses + FULL_DISCLAIMER) plus explicit assumption-of-risk clauses      │
 * │ marked [DRAFT]. When counsel returns final wording:                      │
 * │   1. Replace the DRAFT strings below.                                    │
 * │   2. Bump CONSENT_VERSION (returning users are re-prompted; old          │
 * │      acceptances are retained as an audit trail, never overwritten).     │
 * │ Until real language + the server-side record + server gate are live, do  │
 * │ NOT market the beta as "consent-protected" (directive dependency note).  │
 * └────────────────────────────────────────────────────────────────────────┘
 */

// ─── DISCLAIMERS ─────────────────────────────────────────────────────────
// These mirror the exact text compliance.ts has shipped since COMPLIANCE v1.0.
// compliance.ts now re-exports these so there is a single edit point.

export const MICRO_DISCLAIMER = 'ⓘ Reference tool · Not medical advice'

export const FULL_DISCLAIMER = `This information is provided for educational and observational reference only. Astryx does not diagnose, treat, cure, or prescribe. The astrological correlations presented are drawn from classical sources and are intended as a complement to — not a replacement for — care provided by a licensed healthcare professional.

Consult your physician or qualified practitioner for any persistent symptom, health decision, or concern. Do not stop or alter prescribed medication based on this information. In an emergency, call your local emergency services.

By using Astryx, you acknowledge and accept these terms.`

export const PRACTITIONER_ADDENDUM = `The information presented is observational reference. Clinical interpretation, diagnosis, and any recommended interventions are the sole responsibility of the practitioner accessing this output.`

// ─── AI DISCLOSURE (FIX 2 · shown on the Astryx chat before any output) ───

/** Persistent label pinned to the chat surface (compact). */
export const AI_DISCLOSURE_LABEL = 'AI-generated · reference only, not a person or a professional'

/** First-message / on-load line the chat renders before any model output. */
export const AI_DISCLOSURE_FULL = `Astryx is an AI reference companion — not a person, and not a licensed professional. It reflects patterns from classical sources for observation and reflection only. It does not diagnose, treat, prescribe, or replace care from a qualified provider. For any health decision or persistent concern, talk with your licensed practitioner.`

/** Same disclosure for the offline / sovereign fallback brain (no live model). */
export const AI_DISCLOSURE_OFFLINE = AI_DISCLOSURE_FULL

// ─── BETA BANNER (FIX 2 · dashboard, dismissible per CONSENT_VERSION) ─────

export const BETA_BANNER = `You're using Astryx in beta. Features are still being refined, and everything Astryx shows is observational reference — not medical advice. Thank you for helping shape it.`

// ─── CONSENT & ASSUMPTION-OF-RISK GATE (FIX 1) ───────────────────────────
// Blocking, first-authenticated-session agreement shown BEFORE intake or any
// reading/session is reachable. Server-verified (see src/lib/consent.ts).

/**
 * Consent text version. Bump on ANY change to the clauses/intro below.
 * Format: `<ISO date>.<rev>`. `v0-draft` marks pre-attorney copy.
 * When this changes, returning users are re-prompted and a fresh acceptance
 * is recorded; prior acceptances are retained for the audit trail.
 */
export const CONSENT_VERSION = '2026-07-05.v0-draft'

/** Heading + lead paragraph shown above the clause list. */
export const CONSENT_INTRO = `Before you begin, please read and agree to the terms below. Astryx is an observational reference and calibration tool — it is not medical, psychological, or therapeutic advice, and it does not diagnose, treat, cure, or prescribe.`

/**
 * The clauses the user affirmatively agrees to. Rendered as a list above a
 * single required checkbox. [DRAFT] clauses are the assumption-of-risk
 * additions pending attorney finalization; the rest reuse Astryx's already-
 * approved compliance language.
 */
export const CONSENT_CLAUSES: readonly string[] = [
  'I am 18 years of age or older.',
  'I understand Astryx provides observational reference and wellness calibration only, and is not medical, psychological, or therapeutic advice.',
  'I understand Astryx does not diagnose, treat, cure, or prescribe, and is not a substitute for care from a licensed healthcare professional.',
  'I will consult a licensed healthcare provider for any persistent symptom, health decision, or concern, and I will not stop or alter prescribed medication based on Astryx.',
  'I understand that in an emergency I should call my local emergency services, and that Astryx is not a crisis or emergency service.',
  // [DRAFT] — assumption of risk (pending attorney finalization)
  'I understand that any wellness practice, sound, scent, taste, movement, or other suggestion offered by Astryx is undertaken voluntarily and at my own risk.',
  'I accept full responsibility for how I choose to use the information Astryx provides, and I assume the risks of doing so.',
  'I understand Astryx makes no guarantee of any outcome or result.',
  'I consent to Astryx processing the birth data and inputs I provide in order to generate my reference blueprint.',
  'I have read, understand, and agree to the Terms of Service and Privacy Policy, and to this informed-consent and assumption-of-risk agreement.',
]

/** Label on the single required checkbox (must be affirmatively checked). */
export const CONSENT_CHECKBOX_LABEL = 'I have read, understood, and agree to the terms above.'

/** CTA once the box is checked. */
export const CONSENT_ACCEPT_CTA = 'Agree & Continue'

/** Footer/menu link label — reachable any time, not only at first use. */
export const CONSENT_LINK_LABEL = 'Terms & Consent'

/**
 * The full consent document, assembled from the parts above. This exact
 * string is what the server stores alongside CONSENT_VERSION as the record of
 * what the user agreed to. Do not hand-edit — edit the parts above.
 */
export const CONSENT_FULL_TEXT = `${CONSENT_INTRO}\n\n${CONSENT_CLAUSES.map((c) => `• ${c}`).join('\n')}`
