/**
 * SUBSCRIPTION GATE v1 — the access boundary, pinned.
 *
 * These are the two ways a paid gate quietly fails:
 *   1. it grants too much — an unrelated order unlocks the app (the leak that
 *      bit the Sacred Vault: buying tea let you into the library);
 *   2. it grants forever — a "subscription" with no expiry, so a member who
 *      stops paying keeps everything.
 * Both are invisible in manual testing because both look like a happy path.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHmac } from 'node:crypto'

const SECRET = 'test-webhook-secret'

// The route's side effects. Captured, never executed.
const upsert = vi.fn().mockResolvedValue({})
const leadUpsert = vi.fn().mockResolvedValue({ id: 'lead1', welcomeEmailAt: null })
const leadUpdate = vi.fn().mockResolvedValue({})
const sendMail = vi.fn().mockResolvedValue(true)

vi.mock('@/lib/db', () => ({
  prisma: {
    entitlement: { upsert: (...a: any[]) => upsert(...a) },
    buyerLead: { upsert: (...a: any[]) => leadUpsert(...a), update: (...a: any[]) => leadUpdate(...a) },
  },
}))
vi.mock('@/lib/mailer', async () => {
  const actual = await vi.importActual<typeof import('@/lib/mailer')>('@/lib/mailer')
  return { ...actual, mailEnabled: () => true, sendAstryxEmail: (...a: any[]) => sendMail(...a) }
})

process.env.SHOPIFY_WEBHOOK_SECRET = SECRET
process.env.SHOPIFY_ASTRYX_PRODUCT_ID = '10497531183383'

const { POST } = await import('@/app/api/webhooks/shopify/route')

/** A correctly-signed orders/paid delivery. */
function order(body: Record<string, unknown>): Request {
  const raw = JSON.stringify(body)
  return new Request('https://myastryx.com/api/webhooks/shopify', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-shopify-topic': 'orders/paid',
      'x-shopify-hmac-sha256': createHmac('sha256', SECRET).update(raw, 'utf8').digest('base64'),
    },
    body: raw,
  })
}

const ASTRYX_MONTHLY = { product_id: 10497531183383, title: 'ASTRYX — Cosmic Calibration Access', price: '9.99' }
const ASTRYX_YEARLY = { product_id: 10497531183383, title: 'ASTRYX — Cosmic Calibration Access', price: '99.00' }
const TEA = { product_id: 9731256123671, title: 'BLUE LOTUS MAGIC BLEND🌸', price: '39.95' }
const FORKS = { product_id: 10338601697559, title: 'SACRED TONES PLANETARY TUNING FORKS (stainless steel)', price: '499.00' }

const DAY = 24 * 3600 * 1000

beforeEach(() => {
  upsert.mockClear(); leadUpsert.mockClear(); leadUpdate.mockClear(); sendMail.mockClear()
  leadUpsert.mockResolvedValue({ id: 'lead1', welcomeEmailAt: null })
})

describe('shopify webhook — who gets in', () => {
  it('rejects an unsigned body without touching the database', async () => {
    const res = await POST(new Request('https://myastryx.com/api/webhooks/shopify', {
      method: 'POST', body: JSON.stringify({ id: 1, email: 'a@b.c', line_items: [ASTRYX_MONTHLY] }),
    }))
    expect(res.status).toBe(401)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('rejects a body signed with the WRONG secret', async () => {
    const raw = JSON.stringify({ id: 1, email: 'a@b.c', line_items: [ASTRYX_MONTHLY] })
    const res = await POST(new Request('https://myastryx.com/api/webhooks/shopify', {
      method: 'POST',
      headers: {
        'x-shopify-topic': 'orders/paid',
        'x-shopify-hmac-sha256': createHmac('sha256', 'not-the-secret').update(raw).digest('base64'),
      },
      body: raw,
    }))
    expect(res.status).toBe(401)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('a tea order grants NOTHING — the Vault leak, refused', async () => {
    const res = await POST(order({
      id: 900001, email: 'tea@buyer.com', processed_at: '2026-09-01T00:00:00Z', line_items: [TEA],
    }))
    expect(await res.json()).toMatchObject({ entitled: false })
    expect(upsert).not.toHaveBeenCalled()
  })

  it('a fork order AFTER the cutoff grants nothing — those buyers get the 30-day trial', async () => {
    const res = await POST(order({
      id: 900002, email: 'newfork@buyer.com', processed_at: '2026-09-01T00:00:00Z', line_items: [FORKS],
    }))
    expect(await res.json()).toMatchObject({ entitled: false })
    expect(upsert).not.toHaveBeenCalled()
  })
})

describe('shopify webhook — the fork buyer becomes a tracked lead', () => {
  it('records the buyer and mails them the app, even with no access granted', async () => {
    await POST(order({
      id: 900010, email: 'NewFork@Buyer.com', processed_at: '2026-09-01T00:00:00Z',
      customer: { id: 55, first_name: 'Ada', last_name: 'Lovelace' }, line_items: [FORKS],
    }))
    expect(leadUpsert.mock.calls[0][0].create).toMatchObject({
      email: 'newfork@buyer.com', name: 'Ada Lovelace', product: 'forks',
    })
    expect(sendMail).toHaveBeenCalledTimes(1)
    expect(sendMail.mock.calls[0][0]).toBe('newfork@buyer.com')
    // Stamped only after the mail is accepted, so a failure retries later.
    expect(leadUpdate.mock.calls[0][0].data.welcomeEmailAt).toBeInstanceOf(Date)
  })

  it('does not welcome the same buyer twice when Shopify retries', async () => {
    leadUpsert.mockResolvedValue({ id: 'lead1', welcomeEmailAt: new Date() })
    await POST(order({
      id: 900011, email: 'repeat@buyer.com', processed_at: '2026-09-01T00:00:00Z', line_items: [FORKS],
    }))
    expect(sendMail).not.toHaveBeenCalled()
    expect(leadUpdate).not.toHaveBeenCalled()
  })

  it('a subscription order is not a fork lead', async () => {
    await POST(order({
      id: 900012, email: 'sub@buyer.com', processed_at: '2026-09-01T00:00:00Z', line_items: [ASTRYX_MONTHLY],
    }))
    expect(leadUpsert).not.toHaveBeenCalled()
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('a tea order is not a fork lead either', async () => {
    await POST(order({
      id: 900013, email: 'tea@buyer.com', processed_at: '2026-09-01T00:00:00Z', line_items: [TEA],
    }))
    expect(leadUpsert).not.toHaveBeenCalled()
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('a fork order BEFORE the cutoff still grants lifetime — the founding promise', async () => {
    const res = await POST(order({
      id: 900003, email: 'Founding@Buyer.com', processed_at: '2026-06-26T13:33:06Z', line_items: [FORKS],
    }))
    expect(await res.json()).toMatchObject({ entitled: true, plan: 'lifetime', currentPeriodEnd: null })
    // Lowercased on the way in, or sign-in by the same human never matches.
    expect(upsert.mock.calls[0][0].create).toMatchObject({
      email: 'founding@buyer.com', plan: 'lifetime', currentPeriodEnd: null,
    })
  })
})

describe('shopify webhook — for how long', () => {
  it('monthly grants 33 days: one cycle plus the rebill grace', async () => {
    const paid = '2026-09-01T00:00:00Z'
    const res = await POST(order({
      id: 900004, email: 'sub@buyer.com', processed_at: paid, line_items: [ASTRYX_MONTHLY],
    }))
    const body = await res.json()
    expect(body).toMatchObject({ entitled: true, plan: 'monthly' })
    expect(Date.parse(body.currentPeriodEnd) - Date.parse(paid)).toBe(33 * DAY)
  })

  it('yearly grants 367 days, told apart from monthly by price alone', async () => {
    const paid = '2026-09-01T00:00:00Z'
    const res = await POST(order({
      id: 900005, email: 'sub@buyer.com', processed_at: paid, line_items: [ASTRYX_YEARLY],
    }))
    const body = await res.json()
    expect(body).toMatchObject({ entitled: true, plan: 'yearly' })
    expect(Date.parse(body.currentPeriodEnd) - Date.parse(paid)).toBe(367 * DAY)
  })

  it('a subscription is NEVER lifetime — an expiry is always stamped', async () => {
    await POST(order({
      id: 900006, email: 'sub@buyer.com', processed_at: '2026-09-01T00:00:00Z', line_items: [ASTRYX_MONTHLY],
    }))
    expect(upsert.mock.calls[0][0].create.currentPeriodEnd).toBeInstanceOf(Date)
  })

  it('dates from the moment the order was PAID, not from when the webhook lands', async () => {
    // Shopify retries for days. Clocking a late delivery off "now" would hand
    // out free time for every failed delivery attempt.
    const paid = '2026-09-01T00:00:00Z'
    await POST(order({
      id: 900007, email: 'sub@buyer.com', processed_at: paid, line_items: [ASTRYX_MONTHLY],
    }))
    const end: Date = upsert.mock.calls[0][0].create.currentPeriodEnd
    expect(end.getTime()).toBe(Date.parse(paid) + 33 * DAY)
  })

  it('is idempotent on the order id — a retry rewrites, it does not stack', async () => {
    const o = { id: 900008, email: 'sub@buyer.com', processed_at: '2026-09-01T00:00:00Z', line_items: [ASTRYX_MONTHLY] }
    await POST(order(o))
    await POST(order(o))
    expect(upsert).toHaveBeenCalledTimes(2)
    expect(upsert.mock.calls[0][0].where).toEqual({ shopifyOrderId: '900008' })
    expect(upsert.mock.calls[1][0].where).toEqual({ shopifyOrderId: '900008' })
  })
})
