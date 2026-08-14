/**
 * GET /api/cron/trial-emails — the trial lifecycle mailer (FUNNEL v1).
 *
 * Runs daily from Vercel Cron. For every account still on the trial clock:
 *   • 3 days left  → `trialEnding` (first time the subscribe link appears)
 *   • clock spent  → `trialEnded`  (the door closed; here is the way back)
 *
 * Anyone holding live access — a founding fork buyer, an allowlisted email, a
 * paying subscriber — is skipped. Nobody gets asked to buy what they already
 * have.
 *
 * SEND-ONCE is a database stamp, not a schedule assumption: a mail is only
 * sent when its stamp is null, and the stamp is written only after Resend
 * accepts it. So the cron is safe to run twice, to re-run after a failure, or
 * to be triggered by hand — and a send that fails today is simply retried
 * tomorrow rather than lost.
 *
 * `?dryRun=1` reports exactly who WOULD be mailed, sends nothing, stamps
 * nothing. Use it before turning the funnel on.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TRIAL_DAYS } from '@/lib/subscription'
import { sendAstryxEmail, mailEnabled } from '@/lib/mailer'
import { trialEnding, trialEnded } from '@/lib/emails'

export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000
/** Send the heads-up with this many days left. */
const ENDING_AT_DAYS_LEFT = 3

/** Addresses that can only bounce — test accounts, reserved TLDs. */
function undeliverable(email: string): boolean {
  return /\.(test|invalid|local|localhost|example)$/i.test(email.split('@')[1] ?? '')
}

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  // No secret configured → only Vercel's own cron header gets in.
  if (!secret) return req.headers.get('x-vercel-cron') !== null
  return (
    req.headers.get('authorization') === `Bearer ${secret}` ||
    req.headers.get('x-vercel-cron') !== null
  )
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dryRun = new URL(req.url).searchParams.get('dryRun') === '1'

  try {
    const now = Date.now()

    // Everyone who currently holds live access, in one read: lifetime rows
    // (currentPeriodEnd NULL) plus any period still in the future.
    const liveRows = await prisma.entitlement.findMany({
      where: {
        status: 'active',
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date(now) } }],
      },
      select: { email: true },
    })
    const holdsAccess = new Set(liveRows.map((r) => r.email))
    for (const e of (process.env.BETA_ALLOWLIST || '').split(',')) {
      const t = e.trim().toLowerCase()
      if (t) holdsAccess.add(t)
    }

    const candidates = await prisma.user.findMany({
      where: { trialStartedAt: { not: null }, email: { not: null } },
      select: {
        id: true, email: true, name: true, trialStartedAt: true,
        trialEndingEmailAt: true, trialEndedEmailAt: true,
      },
    })

    const sent: Array<{ email: string; kind: string; daysLeft: number }> = []
    const skipped = { hasAccess: 0, alreadySent: 0, notDue: 0, undeliverable: 0 }
    const failed: string[] = []

    for (const u of candidates) {
      const email = (u.email ?? '').toLowerCase()
      if (!email) continue
      if (holdsAccess.has(email)) { skipped.hasAccess++; continue }
      if (undeliverable(email)) { skipped.undeliverable++; continue }

      const elapsed = Math.floor((now - u.trialStartedAt!.getTime()) / DAY_MS)
      const daysLeft = Math.max(0, TRIAL_DAYS - elapsed)

      // Expired first: someone who blew past day 27 without the cron running
      // should get the "door closed" mail, not a heads-up about a day gone by.
      if (daysLeft <= 0) {
        if (u.trialEndedEmailAt) { skipped.alreadySent++; continue }
        const mail = trialEnded(u.name)
        if (dryRun) { sent.push({ email, kind: 'trialEnded', daysLeft }); continue }
        if (await sendAstryxEmail(email, mail.subject, mail.html)) {
          await prisma.user.update({ where: { id: u.id }, data: { trialEndedEmailAt: new Date() } })
          sent.push({ email, kind: 'trialEnded', daysLeft })
        } else failed.push(email)
        continue
      }

      if (daysLeft <= ENDING_AT_DAYS_LEFT) {
        if (u.trialEndingEmailAt) { skipped.alreadySent++; continue }
        const mail = trialEnding(u.name, daysLeft)
        if (dryRun) { sent.push({ email, kind: 'trialEnding', daysLeft }); continue }
        if (await sendAstryxEmail(email, mail.subject, mail.html)) {
          await prisma.user.update({ where: { id: u.id }, data: { trialEndingEmailAt: new Date() } })
          sent.push({ email, kind: 'trialEnding', daysLeft })
        } else failed.push(email)
        continue
      }

      skipped.notDue++
    }

    // Bought forks, never made an account — the activation leak, surfaced on
    // every run so it can't quietly grow again.
    const leads = await prisma.buyerLead.findMany({ select: { email: true } })
    const accounts = new Set(candidates.map((u) => (u.email ?? '').toLowerCase()))
    const seenLead = new Set<string>()
    const neverActivated: string[] = []
    leads.forEach((l) => {
      if (accounts.has(l.email) || seenLead.has(l.email)) return
      seenLead.add(l.email)
      neverActivated.push(l.email)
    })

    return NextResponse.json({
      ok: true,
      dryRun,
      mailConfigured: mailEnabled(),
      sent,
      failed,
      skipped,
      neverActivated,
      ranAt: new Date(now).toISOString(),
    })
  } catch (e) {
    console.error('[cron/trial-emails] failed:', e)
    return NextResponse.json({ error: 'run failed' }, { status: 500 })
  }
}
