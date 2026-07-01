/**
 * Astryx Compliance & Language Enforcement
 *
 * Programmatic enforcement of COMPLIANCE.md (project root).
 * READ that document before touching this file.
 *
 * This module provides:
 *   • Tier-aware language wrappers
 *   • Universal & micro disclaimers (constants)
 *   • Attestation text generators
 *   • PDF footer generator
 *   • Banned-phrase guard (dev linter)
 *   • Crisis keyword detector
 *
 * Every output-facing string in the app should pass through one of these
 * helpers OR be reviewed manually against COMPLIANCE.md before shipping.
 */

export const COMPLIANCE_VERSION = '1.0'

// ─── DISCLAIMERS (EXACT TEXT — DO NOT EDIT WITHOUT VERSION BUMP) ─────

export const MICRO_DISCLAIMER = 'ⓘ Reference tool · Not medical advice'

export const FULL_DISCLAIMER = `This information is provided for educational and observational reference only. Astryx does not diagnose, treat, cure, or prescribe. The astrological correlations presented are drawn from classical sources and are intended as a complement to — not a replacement for — care provided by a licensed healthcare professional.

Consult your physician or qualified practitioner for any persistent symptom, health decision, or concern. Do not stop or alter prescribed medication based on this information. In an emergency, call your local emergency services.

By using Astryx, you acknowledge and accept these terms.`

export const PRACTITIONER_ADDENDUM = `The information presented is observational reference. Clinical interpretation, diagnosis, and any recommended interventions are the sole responsibility of the practitioner accessing this output.`

// ─── TIERS ───────────────────────────────────────────────────────────

export type ComplianceTier = 'individual' | 'practitioner' | 'verified'

export const TIER_PRICING = {
  individual:   { monthly: 9.95,  display: '$9.95/mo'  },
  practitioner: { monthly: 39.95, display: '$39.95/mo' },
  verified:     { monthly: 59.00, display: '$59/mo'    },
} as const

// ─── BANNED PHRASES (NEVER USE) ──────────────────────────────────────

export const BANNED_PHRASES: ReadonlyArray<RegExp> = [
  /\byou have\b/i,
  /\byou are suffering from\b/i,
  /\byou suffer from\b/i,
  /\bthis causes\b/i,
  /\bthis is causing\b/i,
  /\bthe cause is\b/i,
  /\bdiagnose\b/i,
  /\bdiagnosis\b/i,           // OK in source titles — see allowlist
  /\btreat\b/i,
  /\btreatment\b/i,
  /\bcure(s)?\b/i,
  /\bprescribe\b/i,
  /\bprescription\b/i,        // OK in "cell-salt prescription" with disclaimer
  /\bguarantee(d)?\b/i,
  /\bwill resolve\b/i,
  /\bwill cure\b/i,
  /\bpermanently\b/i,
  /\bsafe for everyone\b/i,
  /\bno side effects\b/i,
  /\bcompletely natural\b/i,
]

// Phrases allowed in specific contexts (e.g., quoted source titles)
const BANNED_ALLOWLIST: ReadonlyArray<RegExp> = [
  /Cornell.*Diagnosis of Disease/i,                          // 1918 source title
  /Encyclopaedia of Medical Astrology/i,                     // Cornell title
  /astro-medical diagnosis/i,                                // Charak preface usage
  /cell.?salt prescription/i,                                // Term of art, OK with disclaimer
  /Reiki .*treatment session/i,                              // Reiki term of art (TBD)
]

/**
 * Returns the array of banned-phrase matches in a string. Empty if clean.
 * Used as a dev linter — call on output strings during testing.
 */
export function lintForBannedPhrases(text: string): string[] {
  if (!text) return []
  // First strip allowlisted phrases so they don't false-positive
  let stripped = text
  for (const allow of BANNED_ALLOWLIST) {
    stripped = stripped.replace(allow, '')
  }
  const hits: string[] = []
  for (const banned of BANNED_PHRASES) {
    const match = stripped.match(banned)
    if (match) hits.push(match[0])
  }
  return hits
}

// ─── APPROVED PHRASINGS (USE THESE) ──────────────────────────────────

export const APPROVED_PHRASINGS = [
  'may suggest',
  'may indicate',
  'may correlate with',
  'is classically associated with',
  'the chart indicates',
  'this combination has historically been linked to',
  'classical sources associate this with',
  'consider exploring with your practitioner',
  'reference / for reference',
  'observational pattern',
  'may benefit from',
  'general wellness alignment',
] as const

// ─── safePhrase — TIER-AWARE LANGUAGE WRAPPER ────────────────────────

/**
 * Wraps a raw clinical observation in tier-appropriate framing.
 *
 *   safePhrase('Saturn-Moon → cortisol dysregulation', 'individual')
 *     → 'The chart indicates a Saturn-Moon configuration that may correlate
 *        with patterns of stress regulation. Consider exploring this with
 *        your healthcare provider.'
 *
 *   safePhrase('Saturn-Moon → cortisol dysregulation', 'practitioner')
 *     → 'Saturn-Moon configuration — classical sources associate this with
 *        cortisol dysregulation and HPA-axis patterns. Observational pattern;
 *        clinical correlation rests with the practitioner.'
 *
 * Practitioners get the clinical terminology + source framing.
 * Individuals get plain language + always-on referral.
 */
export function safePhrase(
  observation: string,
  tier: ComplianceTier,
  options: { source?: string; bodyArea?: string } = {},
): string {
  const cleaned = observation.trim().replace(/\.$/, '')

  if (tier === 'individual') {
    // Plain language, always-on referral
    const bodyMention = options.bodyArea ? ` related to your ${options.bodyArea}` : ''
    return `The chart indicates a pattern${bodyMention} that may suggest ${cleaned}. Consider exploring this with your healthcare provider.`
  }

  // Practitioner + Verified — clinical terminology + source framing
  const sourceCitation = options.source ? ` (per ${options.source})` : ''
  return `${cleaned} — classical sources associate this configuration with the patterns described${sourceCitation}. Observational pattern; clinical interpretation rests with the practitioner.`
}

// ─── withDisclaimer — APPEND CONTEXT-APPROPRIATE DISCLAIMER ──────────

export type DisclaimerContext = 'output' | 'pdf' | 'session' | 'email'

export function withDisclaimer(content: string, ctx: DisclaimerContext): string {
  const disclaimer = ctx === 'pdf'
    ? formatPdfFooter('individual')   // default tier — caller can override
    : FULL_DISCLAIMER
  return `${content}\n\n---\n${disclaimer}`
}

// ─── PDF FOOTER GENERATOR ────────────────────────────────────────────

export function formatPdfFooter(
  tier: ComplianceTier,
  options: { practitionerName?: string; credential?: string; version?: string } = {},
): string {
  const today = new Date().toISOString().slice(0, 10)
  const version = options.version ?? `v${COMPLIANCE_VERSION}`

  const practitionerLine = (tier === 'practitioner' || tier === 'verified') && options.practitionerName
    ? `Prepared by ${options.practitionerName}${options.credential && tier === 'verified' ? ` · ${options.credential}` : ''}`
    : 'Individual Reference Export'

  return `Astryx · Observational reference only · Not medical advice
${practitionerLine}
Generated ${today} · This document does not constitute diagnosis, prescription, or treatment.
Consult a licensed healthcare provider for any health concern. astryx.app · compliance ${version}`
}

// ─── ATTESTATION FORM TEXT GENERATORS ────────────────────────────────

/**
 * Returns the EXACT versioned text shown at signup for the given tier.
 * The text returned by this function MUST be the text stored in the
 * audit-trail record (per COMPLIANCE.md §10).
 */
export function attestationFormText(tier: ComplianceTier): string {
  switch (tier) {
    case 'individual':
      return INDIVIDUAL_ATTESTATION_V1
    case 'practitioner':
      return PRACTITIONER_ATTESTATION_V1
    case 'verified':
      return VERIFIED_ATTESTATION_V1
  }
}

const INDIVIDUAL_ATTESTATION_V1 = `By creating an account, I acknowledge:

  □ I am 18 years of age or older
  □ I understand Astryx provides observational reference only and is not medical, psychological, or therapeutic advice
  □ I will consult a licensed healthcare provider for any persistent symptom, health decision, or concern
  □ I will not stop or alter prescribed medication based on Astryx output
  □ I agree to the Terms of Service and Privacy Policy`

const PRACTITIONER_ATTESTATION_V1 = `Astryx Practitioner Access — Professional Attestation

I attest that I am a licensed, certified, or ordained practitioner in good standing in the modality I have selected.

I attest under penalty of perjury that:

  □ I am a licensed, certified, or ordained practitioner in the modality selected, in good standing
  □ I understand Astryx provides observational reference drawn from classical sources and does NOT constitute diagnosis, prescription, or treatment
  □ I will not present Astryx outputs to my clients as diagnosis, prescription, or guaranteed outcome
  □ I accept full professional responsibility for any clinical interpretation, recommendation, or intervention I make using Astryx as a reference tool
  □ I will obtain informed consent from my clients before using their birth data in Astryx
  □ I will comply with all applicable laws, regulations, and scope-of-practice requirements in my jurisdiction
  □ I understand Astryx reserves the right to suspend or terminate my account if my attestation is found to be false
  □ I agree to the Practitioner Terms of Service and the Astryx Compliance Framework`

const VERIFIED_ATTESTATION_V1 = `Verified Practitioner Upgrade — License Verification

By submitting these documents I attest:

  □ The documents I am uploading are authentic, current, and belong to me
  □ The credential is in good standing and has not been suspended or revoked
  □ I will notify Astryx within 30 days of any change to my credential status
  □ I authorize Astryx (or a designated verification service) to verify these documents with the issuing body
  □ I understand that false attestation may result in account termination and may constitute fraud`

// ─── ATTESTATION VERSIONING ─────────────────────────────────────────

/**
 * Each attestation text has a permanent version string. Store this in the
 * audit-trail record. When the text changes, bump the version. Old users
 * are grandfathered under the version they signed.
 */
export const ATTESTATION_VERSIONS = {
  individual:   'individual_v1',
  practitioner: 'practitioner_v1',
  verified:     'verified_v1',
} as const

// ─── CRISIS KEYWORD DETECTION ───────────────────────────────────────

const CRISIS_PATTERNS: ReadonlyArray<{ category: string; pattern: RegExp }> = [
  { category: 'self-harm',  pattern: /\b(suicide|suicidal|kill myself|end it all|want to die|self.?harm|cutting myself)\b/i },
  { category: 'medical',    pattern: /\b(can'?t breathe|chest pain|stroke|severe bleeding|overdose|overdosed|unconscious)\b/i },
  { category: 'mh-acute',   pattern: /\b(psychosis|hallucinating|hearing voices telling me|breaking down|can'?t cope)\b/i },
  { category: 'dv',         pattern: /\b(he'?s hurting me|she'?s hurting me|being abused|scared of (my )?partner)\b/i },
]

export interface CrisisDetection {
  isCrisis: boolean
  categories: string[]
  matchedPhrases: string[]
}

/**
 * Scan any user input for crisis keywords. If detected, the app MUST:
 *   1. Pause normal flow
 *   2. Display Crisis Resources card
 *   3. Log the trigger for review
 *
 * Returns { isCrisis: true, categories, matchedPhrases } if any match.
 */
export function detectCrisis(input: string): CrisisDetection {
  if (!input) return { isCrisis: false, categories: [], matchedPhrases: [] }
  const categories: string[] = []
  const matchedPhrases: string[] = []
  for (const { category, pattern } of CRISIS_PATTERNS) {
    const m = input.match(pattern)
    if (m) {
      categories.push(category)
      matchedPhrases.push(m[0])
    }
  }
  return {
    isCrisis: categories.length > 0,
    categories: Array.from(new Set(categories)),
    matchedPhrases,
  }
}

// ─── PAIN / CONDITION RED-FLAG (Directive S · sibling of detectCrisis) ──
// NOT a crisis (no 988 card) — a gentle, firm nudge to a hands-on professional
// when input signals severe, persistent, or alarming physical symptoms. The
// named-condition handler routes to the body ZONE; this trips the referral line.
const PAIN_REDFLAG_PATTERN =
  /\b(severe|excruciating|unbearable|getting worse|worsening|for (months|years|weeks)|won'?t go away|persistent|chronic|can'?t (walk|move|sleep|stand)|numb(ness)?|swelling that|fracture|broken bone|dislocat|herniat|infection|fever|sudden (vision|weakness|numbness))\b/i

export interface PainRedFlag {
  flagged: boolean
  matchedPhrases: string[]
}

/**
 * Scan somatic/condition intake for severe-or-persistent markers. When flagged,
 * the UI/Astryx adds the warm referral line ("have a licensed professional look
 * at that") — the engine still recalibrates the zone; it never blocks care.
 */
export function detectPainRedFlag(input: string): PainRedFlag {
  if (!input) return { flagged: false, matchedPhrases: [] }
  const matched: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(PAIN_REDFLAG_PATTERN.source, 'gi')
  while ((m = re.exec(input)) !== null) matched.push(m[0])
  return { flagged: matched.length > 0, matchedPhrases: matched }
}

/** The warm referral line shown when a pain red-flag trips (not a crisis card). */
export const PAIN_REFERRAL_LINE =
  'That sounds worth having a licensed professional look at in person — Astryx can calibrate the area for comfort, but anything persistent or severe deserves hands-on care.'

// ─── CRISIS RESOURCES CARD CONTENT ──────────────────────────────────

export const CRISIS_RESOURCES_CARD = `We hear you. What you're experiencing deserves immediate human support.

Astryx is a reference tool — not a replacement for crisis care.

Please reach out now:

🇺🇸 988 Suicide & Crisis Lifeline — call or text 988
🇺🇸 Crisis Text Line — text HOME to 741741
🇺🇸 Domestic Violence Hotline — 1-800-799-7233
🌍 International: findahelpline.com
🚨 Medical emergency: call your local emergency services

Astryx is here when you're ready to return to reflection and reference.`

// ─── DIRECTIVE-ALIGNED ALIASES ──────────────────────────────
// The Build Directive v1.0 references `wrapTierOutput()` and
// `containsBannedPhrase()`. Provide them as semantic aliases so directive
// code reads cleanly while the underlying implementation stays canonical.
// DECISION: alias rather than rename — preserves existing call-sites in
// the engine without churn, lets future code use either naming.
export const wrapTierOutput = safePhrase
export function containsBannedPhrase(text: string): boolean {
  return lintForBannedPhrases(text).length > 0
}

// ─── HARD-LINE GUARDS ───────────────────────────────────────────────

/**
 * Returns true if content includes Vedic Maraka (death-timing) language
 * that requires the Verified Practitioner tier. Used to gate sensitive output.
 */
export function requiresVerifiedTier(content: string): boolean {
  return /\b(maraka|death timing|longevity calculation|untimely death)\b/i.test(content)
}

/**
 * Top-level safety check — call before rendering any clinical output.
 * Returns { safe: true } or { safe: false, reason: '...' } with an explanation
 * the caller can surface in error logs.
 */
export function safetyGate(
  content: string,
  tier: ComplianceTier,
): { safe: true } | { safe: false; reason: string } {
  // Crisis trumps everything
  const crisis = detectCrisis(content)
  if (crisis.isCrisis) {
    return { safe: false, reason: `Crisis keywords detected (${crisis.categories.join(', ')}). Redirect to Crisis Resources.` }
  }
  // Maraka requires Verified tier
  if (requiresVerifiedTier(content) && tier !== 'verified') {
    return { safe: false, reason: 'Content requires Verified Practitioner tier.' }
  }
  // Banned phrases in clinical output
  const banned = lintForBannedPhrases(content)
  if (banned.length > 0) {
    return { safe: false, reason: `Output contains banned phrases: ${banned.join(', ')}. Rewrite per COMPLIANCE.md §3.` }
  }
  return { safe: true }
}
