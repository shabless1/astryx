/**
 * ASTRYX — The Teacher · Gemini caller
 * ════════════════════════════════════════════════════════════════════
 * SERVER-ONLY. Wraps the gemini-2.5-flash-lite REST endpoint. Builds the
 * grounded request (system instruction + pinned report/shelf context +
 * conversation), and enforces the compliance spine on the OUTPUT with a
 * regenerate-once-then-safe-fallback strategy.
 *
 * IP containment (blueprint Part III): the system instruction and the
 * grounding context are assembled here and never leave the server. The
 * client only ever receives rendered text.
 */

if (typeof window !== 'undefined') {
  throw new Error('teacher/teach.ts is server-only and must not be imported client-side')
}

import { lintForBannedPhrases } from '@/lib/compliance'
import { SYSTEM_INSTRUCTION, buildContextBlock } from './grounding'

/**
 * Teacher-scoped banned-phrase lint. The base compliance linter bans the
 * NOUN "prescription(s)" outright, but that word is core Astryx vocabulary —
 * the report literally has a "Your Prescriptions" section and a
 * UnifiedPrescription type. The Teacher must be able to name that artifact
 * ("the chamomile in your prescription") without falling back. We strip only
 * the noun before linting; the VERB "prescribe" stays banned, as do all the
 * genuinely-clinical phrases ("treat", "cure", "you have", "will", etc.).
 */
function teacherLint(text: string): string[] {
  if (!text) return []
  // Remove the noun "prescription"/"prescriptions" (NOT "prescribe").
  const stripped = text.replace(/\bprescriptions?\b/gi, '')
  return lintForBannedPhrases(stripped)
}

const MODEL = 'gemini-2.5-flash-lite'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

// A warm, in-scope fallback used if the model output can't pass the
// banned-phrase guard even after a stricter retry. Never leaves the user
// with a compliance-violating message.
const SAFE_FALLBACK =
  "Let me keep this to what your chart actually shows. I can explain why a particular tone, herb, color, or transit appears in your calibration, or walk you through a term like your Ascendant or what a transit is. For anything about a symptom or a health decision, that's a conversation for your licensed practitioner. What would you like me to explain?"

export type TeacherTurn = { role: 'user' | 'model'; text: string }

export interface TeacherResult {
  reply: string
  flagged: boolean        // true if output needed sanitizing/fallback
  fallback: boolean       // true if SAFE_FALLBACK was returned
  suggestedConceptKey?: string
}

interface GeminiContent { role: 'user' | 'model'; parts: { text: string }[] }

async function callGemini(
  apiKey: string,
  contents: GeminiContent[],
  extraSystem?: string,
): Promise<string> {
  const systemText = extraSystem
    ? `${SYSTEM_INSTRUCTION}\n\n${extraSystem}`
    : SYSTEM_INSTRUCTION

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemText }] },
      contents,
      generationConfig: {
        temperature: 0.4,        // grounded delivery, slight warmth
        maxOutputTokens: 700,
        topP: 0.9,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('') ?? ''
  return text.trim()
}

/**
 * Run a Teacher turn. Returns a compliance-clean reply.
 */
export async function callTeacher(params: {
  message: string
  report: any
  taughtConcepts: string[]
  tier: 'individual' | 'practitioner' | 'verified'
  history?: TeacherTurn[]
  suggestedConceptKey?: string
}): Promise<TeacherResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const { message, report, taughtConcepts, tier, history = [], suggestedConceptKey } = params

  const contextBlock = buildContextBlock({ report, taughtConcepts, tier })

  // Pin the grounding as the opening exchange, then replay recent history,
  // then the new question. Cap history to keep the call lean.
  const contents: GeminiContent[] = [
    { role: 'user', parts: [{ text: contextBlock }] },
    { role: 'model', parts: [{ text: 'Understood. I will explain only from this report and the reference shelf, in plain probabilistic language, and teach at most one new concept.' }] },
    ...history.slice(-6).map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    { role: 'user', parts: [{ text: message }] },
  ]

  // First pass.
  let reply = await callGemini(apiKey, contents)
  let flagged = false

  // Output compliance — banned-phrase guard (Teacher-scoped).
  if (teacherLint(reply).length > 0) {
    flagged = true
    const hits = teacherLint(reply)
    // Regenerate once with an explicit instruction to avoid the offending words.
    const stricter =
      `OUTPUT GUARD: your previous draft used disallowed phrasing (${hits.join(', ')}). ` +
      `Rewrite your answer with the SAME meaning but strictly probabilistic, non-clinical framing. ` +
      `Never use: "you have", "treats", "cures", "diagnose", "will", "guaranteed", "permanently", or the verb "prescribe". ` +
      `Refer to the report's recommendations as your "calibration" or "protocol". ` +
      `Use "may suggest", "may support", "is classically associated with" instead.`
    reply = await callGemini(apiKey, contents, stricter)
  }

  // If still non-compliant or empty, return the safe fallback.
  if (!reply || teacherLint(reply).length > 0) {
    return { reply: SAFE_FALLBACK, flagged: true, fallback: true, suggestedConceptKey }
  }

  return { reply, flagged, fallback: false, suggestedConceptKey }
}
