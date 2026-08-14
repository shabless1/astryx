/**
 * FUNNEL v1 — the trial lifecycle mailer, pinned.
 *
 * The expensive mistakes here are all about WHO gets mailed:
 *   • asking a founding fork buyer (lifetime access) to subscribe;
 *   • asking a paying subscriber to subscribe again;
 *   • sending the same mail every single day because the cron runs daily and
 *     nothing remembers that it already went.
 * Each of those reads as "the funnel is working" right up until a customer
 * replies asking why they are being billed twice.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lintForBannedPhrases } from '@/lib/compliance'

const DAY = 24 * 3600 * 1000
const ago = (days: number) => new Date(Date.now() - days * DAY)

const send = vi.fn().mockResolvedValue(true)
const userUpdate = vi.fn().mockResolvedValue({})
let users: any[] = []
let entitlements: any[] = []

vi.mock('@/lib/mailer', async () => {
  const actual = await vi.importActual<typeof import('@/lib/mailer')>('@/lib/mailer')
  return {
    ...actual,
    mailEnabled: () => true,
    sendAstryxEmail: (...a: any[]) => send(...a),
  }
})

vi.mock('@/lib/db', () => ({
  prisma: {
    entitlement: { findMany: async () => entitlements },
    user: { findMany: async () => users, update: (...a: any[]) => userUpdate(...a) },
    buyerLead: { findMany: async () => [{ email: 'neverjoined@buyer.com' }] },
  },
}))

process.env.CRON_SECRET = 'cron-test-secret'
process.env.BETA_ALLOWLIST = 'owner@sacredtea.net'

const { GET } = await import('@/app/api/cron/trial-emails/route')

const run = (query = '') =>
  GET(new Request(`https://myastryx.com/api/cron/trial-emails${query}`, {
    headers: { authorization: 'Bearer cron-test-secret' },
  }))

beforeEach(() => {
  send.mockClear(); userUpdate.mockClear()
  users = []; entitlements = []
})

describe('trial mailer — authorization', () => {
  it('refuses an unauthenticated call', async () => {
    const res = await GET(new Request('https://myastryx.com/api/cron/trial-emails'))
    expect(res.status).toBe(401)
    expect(send).not.toHaveBeenCalled()
  })
})

describe('trial mailer — who is left alone', () => {
  it('never asks a lifetime fork buyer to subscribe', async () => {
    users = [{ id: 'u1', email: 'founding@buyer.com', name: 'Fork Buyer', trialStartedAt: ago(40), trialEndingEmailAt: null, trialEndedEmailAt: null }]
    entitlements = [{ email: 'founding@buyer.com' }]  // route already filtered to live rows
    const body = await (await run()).json()
    expect(body.sent).toEqual([])
    expect(body.skipped.hasAccess).toBe(1)
    expect(send).not.toHaveBeenCalled()
  })

  it('never asks an allowlisted owner to subscribe', async () => {
    users = [{ id: 'u2', email: 'owner@sacredtea.net', name: 'SHA', trialStartedAt: ago(90), trialEndingEmailAt: null, trialEndedEmailAt: null }]
    const body = await (await run()).json()
    expect(body.sent).toEqual([])
    expect(send).not.toHaveBeenCalled()
  })

  it('leaves someone mid-trial alone', async () => {
    users = [{ id: 'u3', email: 'midway@user.com', name: null, trialStartedAt: ago(12), trialEndingEmailAt: null, trialEndedEmailAt: null }]
    const body = await (await run()).json()
    expect(body.sent).toEqual([])
    expect(body.skipped.notDue).toBe(1)
  })

  it('skips unroutable test addresses instead of bouncing them', async () => {
    users = [{ id: 'u4', email: 'betatest-fix1@astryx.test', name: null, trialStartedAt: ago(40), trialEndingEmailAt: null, trialEndedEmailAt: null }]
    const body = await (await run()).json()
    expect(body.skipped.undeliverable).toBe(1)
    expect(send).not.toHaveBeenCalled()
  })
})

describe('trial mailer — who gets mailed, and once', () => {
  it('sends the heads-up at 3 days left and stamps it', async () => {
    users = [{ id: 'u5', email: 'ending@user.com', name: 'Ada Lovelace', trialStartedAt: ago(27), trialEndingEmailAt: null, trialEndedEmailAt: null }]
    const body = await (await run()).json()
    expect(body.sent).toEqual([{ email: 'ending@user.com', kind: 'trialEnding', daysLeft: 3 }])
    expect(send.mock.calls[0][0]).toBe('ending@user.com')
    expect(userUpdate.mock.calls[0][0].data.trialEndingEmailAt).toBeInstanceOf(Date)
  })

  it('sends the door-closed mail once the clock is spent', async () => {
    users = [{ id: 'u6', email: 'over@user.com', name: null, trialStartedAt: ago(31), trialEndingEmailAt: new Date(), trialEndedEmailAt: null }]
    const body = await (await run()).json()
    expect(body.sent).toEqual([{ email: 'over@user.com', kind: 'trialEnded', daysLeft: 0 }])
  })

  it('does not re-send tomorrow — the stamp is the memory', async () => {
    users = [{ id: 'u7', email: 'done@user.com', name: null, trialStartedAt: ago(35), trialEndingEmailAt: new Date(), trialEndedEmailAt: new Date() }]
    const body = await (await run()).json()
    expect(body.sent).toEqual([])
    expect(body.skipped.alreadySent).toBe(1)
    expect(send).not.toHaveBeenCalled()
  })

  it('a long-expired account gets the door-closed mail, not a stale heads-up', async () => {
    // The cron missing a few days must not mail "3 days left" to someone who
    // ran out a fortnight ago.
    users = [{ id: 'u8', email: 'lapsed@user.com', name: null, trialStartedAt: ago(48), trialEndingEmailAt: null, trialEndedEmailAt: null }]
    const body = await (await run()).json()
    expect(body.sent[0].kind).toBe('trialEnded')
  })

  it('leaves no stamp when the send fails, so tomorrow retries', async () => {
    send.mockResolvedValueOnce(false)
    users = [{ id: 'u9', email: 'bounced@user.com', name: null, trialStartedAt: ago(31), trialEndingEmailAt: null, trialEndedEmailAt: null }]
    const body = await (await run()).json()
    expect(body.failed).toEqual(['bounced@user.com'])
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it('dryRun reports the exact list and touches nothing', async () => {
    users = [{ id: 'u10', email: 'ending@user.com', name: null, trialStartedAt: ago(28), trialEndingEmailAt: null, trialEndedEmailAt: null }]
    const body = await (await run('?dryRun=1')).json()
    expect(body.dryRun).toBe(true)
    expect(body.sent).toEqual([{ email: 'ending@user.com', kind: 'trialEnding', daysLeft: 2 }])
    expect(send).not.toHaveBeenCalled()
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it('surfaces fork buyers who never made an account', async () => {
    users = [{ id: 'u11', email: 'joined@buyer.com', name: null, trialStartedAt: ago(1), trialEndingEmailAt: null, trialEndedEmailAt: null }]
    const body = await (await run()).json()
    expect(body.neverActivated).toEqual(['neverjoined@buyer.com'])
  })
})

describe('funnel copy — compliance', () => {
  it('carries no banned phrases in any customer email', async () => {
    const { forkWelcome, trialEnding, trialEnded } = await import('@/lib/emails')
    const mails = [forkWelcome('Ada Lovelace'), trialEnding('Ada', 3), trialEnded('Ada')]
    for (const m of mails) {
      // Strip markup — we are linting the words, not the style attributes.
      const text = `${m.subject} ${m.html.replace(/<[^>]+>/g, ' ')}`
      expect(lintForBannedPhrases(text)).toEqual([])
    }
  })

  it('every email carries the reference-tool disclaimer', async () => {
    const { forkWelcome, trialEnding, trialEnded } = await import('@/lib/emails')
    for (const m of [forkWelcome(null), trialEnding(null, 1), trialEnded(null)]) {
      expect(m.html).toContain('Not medical advice')
    }
  })

  it('both prices and the subscribe link reach the customer', async () => {
    const { trialEnded } = await import('@/lib/emails')
    const { SUBSCRIBE_URL } = await import('@/lib/subscription')
    const m = trialEnded('Ada')
    expect(m.html).toContain(SUBSCRIBE_URL)
    expect(m.html).toContain('$9.99/mo')
    expect(m.html).toContain('$99/yr')
  })
})
