/**
 * ASTRYX — The Teacher · POST /api/teach
 * ════════════════════════════════════════════════════════════════════
 * The sixth sense's server entry point. This route is the IP-containment
 * boundary: the operating contract, grounding, and Gemini call all live
 * server-side (in src/lib/teacher/*, imported ONLY here). The client sends
 * its own report + question and receives rendered text — nothing more.
 *
 * Pipeline:
 *   1. Validate input.
 *   2. Crisis-keyword gate (COMPLIANCE.md §8) — return resources, no model call.
 *   3. Resolve tier from session (isPremium → practitioner, else individual).
 *   4. Daily metering (Individual/anon allowance; Practitioner unmetered).
 *   5. callTeacher() → grounded gemini-2.5-flash-lite, output banned-phrase guard.
 *   6. Attach micro-disclaimer + suggested concept; return.
 *
 * NOTE (v1 limitations, documented for the next iteration):
 *   - Metering is in-memory and resets on serverless cold start. Real
 *     per-user metering needs the DB on the roadmap (Prisma + Postgres).
 *   - Grounding uses the curated GLOSSARY shelf, not the full JSON library
 *     set; deep retrieval + Gemini context caching is the next optimization.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  detectCrisis, CRISIS_RESOURCES_CARD, MICRO_DISCLAIMER,
} from '@/lib/compliance'
import { callTeacher, type TeacherTurn } from '@/lib/teacher/teach'
import { pickSuggestedConcept } from '@/lib/teacher/grounding'

export const runtime = 'nodejs'

// Daily allowance for Individual / anonymous users. Practitioner+ is unmetered.
const INDIVIDUAL_DAILY_LIMIT = 10
const MAX_MESSAGE_CHARS = 2000

// In-memory daily counters: key = `${identity}:${YYYY-MM-DD}` → count.
// Resets on cold start (see header note). A backstop, not a billing ledger.
const dailyCounts = new Map<string, number>()

function dayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function identityFor(req: NextRequest, userId: string | null): string {
  if (userId) return `user:${userId}`
  const fwd = req.headers.get('x-forwarded-for') ?? ''
  const ip = fwd.split(',')[0].trim() || 'anon'
  return `ip:${ip}`
}

interface TeachBody {
  message?: string
  report?: any
  taughtConcepts?: string[]
  history?: TeacherTurn[]
}

export async function POST(req: NextRequest) {
  try {
    const body: TeachBody = await req.json().catch(() => ({}))
    const message = (body.message ?? '').trim()
    const report = body.report ?? null
    const taughtConcepts = Array.isArray(body.taughtConcepts) ? body.taughtConcepts : []
    const history = Array.isArray(body.history) ? body.history : []

    // ── 1. Validate ──────────────────────────────────────────────
    if (!message) {
      return NextResponse.json({ error: 'Empty message.' }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_MESSAGE_CHARS} characters).` },
        { status: 400 },
      )
    }
    if (!report) {
      return NextResponse.json(
        { error: 'No report in context. Generate your calibration first, then ask the Teacher.' },
        { status: 400 },
      )
    }

    // ── 2. Crisis gate — trumps everything, no model call ─────────
    const crisis = detectCrisis(message)
    if (crisis.isCrisis) {
      return NextResponse.json({
        crisis: true,
        reply: CRISIS_RESOURCES_CARD,
        disclaimer: MICRO_DISCLAIMER,
      })
    }

    // ── 3. Tier from session ──────────────────────────────────────
    const session = await getSession()
    const userId = session?.user?.id ?? null
    const isPremium = session?.user?.isPremium ?? false
    const tier: 'individual' | 'practitioner' | 'verified' =
      isPremium ? 'practitioner' : 'individual'

    // ── 4. Metering (Individual / anon) ───────────────────────────
    const metered = tier === 'individual'
    const key = `${identityFor(req, userId)}:${dayKey()}`
    let used = dailyCounts.get(key) ?? 0
    if (metered && used >= INDIVIDUAL_DAILY_LIMIT) {
      return NextResponse.json(
        {
          limited: true,
          reply:
            `You've reached today's free allowance of ${INDIVIDUAL_DAILY_LIMIT} Teacher questions. ` +
            `Your calibration, prescriptions, and a new session are still fully available. ` +
            `Practitioner access removes the daily limit — and your allowance refreshes tomorrow.`,
          disclaimer: MICRO_DISCLAIMER,
          tier,
          remaining: 0,
        },
        { status: 200 },
      )
    }

    // ── 5. Call the Teacher (grounded + output guard) ─────────────
    const result = await callTeacher({ message, report, taughtConcepts, tier, history })

    // Count this turn against the allowance (only successful, non-crisis).
    if (metered) {
      used += 1
      dailyCounts.set(key, used)
    }

    // ── 6. Suggested concept + disclaimer ─────────────────────────
    const suggested = pickSuggestedConcept(report, taughtConcepts)

    return NextResponse.json({
      reply: result.reply,
      disclaimer: MICRO_DISCLAIMER,
      tier,
      remaining: metered ? Math.max(0, INDIVIDUAL_DAILY_LIMIT - used) : null,
      suggestedConcept: suggested ? { key: suggested.key } : null,
      flagged: result.flagged,
      fallback: result.fallback,
    })
  } catch (err: any) {
    console.error('[teach] route error:', err)
    return NextResponse.json(
      { error: err?.message || 'The Teacher is unavailable right now. Please try again.' },
      { status: 500 },
    )
  }
}
