/**
 * POST /api/webhooks/shopify — the ONLY path that grants ASTRYX access.
 *
 * SUBSCRIPTION GATE v1 (2026-08-14) — rebuilt on the Sacred Vault protocol:
 *
 *   1. HMAC FIRST, always. An unverified body is never parsed for meaning.
 *   2. PRODUCT-SCOPED. Only the ASTRYX subscription product grants access.
 *      Buying tea, music, a bracelet or divining rods must never unlock the
 *      app — that open-ended match was the leak that bit the Vault.
 *   3. TIME-BOUND. A subscription grant carries an expiry: 33 days for the
 *      monthly lane, 367 for the yearly (both carry the same 2-day grace so a
 *      rebill that lands a few hours late never locks a paying member out).
 *      Cancellation needs no handling at all — when the rebills stop, the
 *      granted period simply lapses on its own.
 *   4. APPEND-ONLY, one row per paid order, idempotent on shopifyOrderId
 *      (Shopify retries the same order id). Access reads the most generous
 *      live row, so a renewal can only extend — never shorten — what someone
 *      already holds. No read-modify-write, so no race to lose.
 *
 * FORKS — SHA ruling 2026-08-14: the founding fork buyers keep lifetime app
 * access (already granted, and grandfathered by the 20260814 migration). Forks
 * sold from the cutoff forward no longer carry app access; those buyers get the
 * same 30-day trial as everyone, then $9.99/mo or $99/yr.
 *
 * Always return 200 on a valid HMAC — Shopify retries non-200s.
 */

import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** The ASTRYX subscription product on sacredtea.net. */
const ASTRYX_PRODUCT_ID = process.env.SHOPIFY_ASTRYX_PRODUCT_ID || ''
const ASTRYX_TITLE_MATCH = 'astryx'

/**
 * The moment fork purchases stopped carrying lifetime app access. Orders paid
 * BEFORE this keep the founding promise (this also covers a webhook that
 * retries or arrives late for an order placed under the old terms).
 */
const FORK_LIFETIME_CUTOFF = Date.parse('2026-08-14T00:00:00Z')

/** Monthly is $9.99, yearly $99 — anything at $50+ is unambiguously the year. */
const YEARLY_PRICE_FLOOR = 50

function verifyShopifyHmac(rawBody: string, headerHmac: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret || !headerHmac) return false
  const digest = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
  const a = Buffer.from(digest)
  const b = Buffer.from(headerHmac)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

type LineItem = { product_id?: number | string; sku?: string; title?: string; name?: string; price?: string | number }

/** The ASTRYX subscription line item, if this order actually contains one. */
function findAstryxItem(items: LineItem[]): LineItem | undefined {
  return items.find(
    (li) =>
      (!!ASTRYX_PRODUCT_ID && String(li.product_id ?? '') === ASTRYX_PRODUCT_ID) ||
      String(li.title ?? li.name ?? '').toLowerCase().includes(ASTRYX_TITLE_MATCH),
  )
}

/** A Sacred Tones fork line item — scoped by SKU list, else by product title. */
function findForkItem(items: LineItem[]): LineItem | undefined {
  const skus = (process.env.SHOPIFY_FORK_SKUS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return items.find((li) => {
    const sku = String(li.sku ?? '').trim().toLowerCase()
    if (skus.length > 0 && sku && skus.includes(sku)) return true
    return /tuning fork/i.test(String(li.title ?? li.name ?? ''))
  })
}

export async function POST(req: Request) {
  // Raw body FIRST — the HMAC is computed over the exact bytes Shopify sent.
  const rawBody = await req.text()
  const headerHmac = req.headers.get('x-shopify-hmac-sha256')

  if (!verifyShopifyHmac(rawBody, headerHmac)) {
    return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 })
  }

  const topic = req.headers.get('x-shopify-topic') || ''
  // Only orders/paid grants access; ack anything else so Shopify stops retrying.
  if (topic && topic !== 'orders/paid') {
    return NextResponse.json({ ok: true, ignored: topic })
  }

  let order: any
  try {
    order = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: true, ignored: 'unparseable body' })
  }

  const email = String(order?.email ?? order?.customer?.email ?? '').trim().toLowerCase()
  const orderId = order?.id != null ? String(order.id) : null
  const customerId = order?.customer?.id != null ? String(order.customer.id) : null
  const lineItems: LineItem[] = Array.isArray(order?.line_items) ? order.line_items : []

  if (!email || !orderId) {
    return NextResponse.json({ ok: true, entitled: false, note: 'no email or order id' })
  }

  // ── What did they actually buy? ────────────────────────────────────────────
  const astryxItem = findAstryxItem(lineItems)
  const forkItem = astryxItem ? undefined : findForkItem(lineItems)

  // When the order was PAID — not when this webhook happens to arrive, so a
  // retry days later still lands on the right side of the fork cutoff.
  const paidAt = Date.parse(
    String(order?.processed_at ?? order?.created_at ?? '') || new Date().toISOString(),
  )
  const paidAtMs = Number.isNaN(paidAt) ? Date.now() : paidAt

  let plan: 'monthly' | 'yearly' | 'lifetime'
  let source: string
  let currentPeriodEnd: Date | null

  if (astryxItem) {
    const yearly = Number(astryxItem.price ?? 0) >= YEARLY_PRICE_FLOOR
    plan = yearly ? 'yearly' : 'monthly'
    source = 'shopify_subscription'
    currentPeriodEnd = new Date(paidAtMs + (yearly ? 367 : 33) * 24 * 3600 * 1000)
  } else if (forkItem && paidAtMs < FORK_LIFETIME_CUTOFF) {
    // A founding-era fork order (or a late retry of one) — honour the promise.
    plan = 'lifetime'
    source = 'shopify_fork_kit'
    currentPeriodEnd = null
  } else {
    // Everything else — including forks sold after the cutoff — grants nothing.
    // Those buyers still get the standard 30-day trial on sign-up.
    return NextResponse.json({ ok: true, entitled: false, note: 'no access-granting item' })
  }

  // Idempotent on the order id: a Shopify retry rewrites the same row rather
  // than stacking duplicates. A RENEWAL is a new order id → its own row, whose
  // later period end simply wins in resolveAccess().
  await prisma.entitlement.upsert({
    where: { shopifyOrderId: orderId },
    update: { email, plan, source, status: 'active', currentPeriodEnd, shopifyCustomerId: customerId },
    create: {
      email,
      source,
      plan,
      shopifyOrderId: orderId,
      shopifyCustomerId: customerId,
      status: 'active',
      currentPeriodEnd,
    },
  })

  return NextResponse.json({
    ok: true,
    entitled: true,
    plan,
    currentPeriodEnd: currentPeriodEnd?.toISOString() ?? null,
  })
}
