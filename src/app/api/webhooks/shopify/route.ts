/**
 * POST /api/webhooks/shopify — fork-buyer entitlement (Directive v4.0 · Fix 2).
 *
 * Shopify Admin → orders/paid webhook lands here. We verify the HMAC against
 * SHOPIFY_WEBHOOK_SECRET (raw body BEFORE JSON parse — App Router: req.text()
 * first), and when a paid order contains a Sacred Tones fork line item we
 * upsert an Entitlement keyed by shopifyOrderId with the customer's email
 * (lowercased). Signing up / signing in with that email unlocks the beta.
 *
 * Always return 200 fast on a valid HMAC — Shopify retries non-200s.
 */

import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function verifyShopifyHmac(rawBody: string, headerHmac: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret || !headerHmac) return false
  const digest = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
  const a = Buffer.from(digest)
  const b = Buffer.from(headerHmac)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** True when a line item is one of the Sacred Tones fork products. */
function isForkLineItem(item: any): boolean {
  const skus = (process.env.SHOPIFY_FORK_SKUS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const sku = String(item?.sku ?? '').trim().toLowerCase()
  if (skus.length > 0 && sku && skus.includes(sku)) return true
  // Fallback: product title contains "tuning fork" (case-insensitive)
  const title = String(item?.title ?? item?.name ?? '')
  return /tuning fork/i.test(title)
}

export async function POST(req: Request) {
  // Raw body FIRST — the HMAC is computed over the exact bytes Shopify sent.
  const rawBody = await req.text()
  const headerHmac = req.headers.get('x-shopify-hmac-sha256')

  if (!verifyShopifyHmac(rawBody, headerHmac)) {
    return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 })
  }

  const topic = req.headers.get('x-shopify-topic') || ''
  // Only orders/paid grants entitlement; ack anything else so Shopify stops retrying.
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
  const lineItems: any[] = Array.isArray(order?.line_items) ? order.line_items : []
  const hasFork = lineItems.some(isForkLineItem)

  if (!email || !orderId || !hasFork) {
    return NextResponse.json({ ok: true, entitled: false })
  }

  // Single upsert BEFORE responding (fast enough; Shopify wants a quick 200).
  await prisma.entitlement.upsert({
    where:  { shopifyOrderId: orderId },
    update: { email, status: 'active' },
    create: {
      email,
      source: 'shopify_fork_kit',
      shopifyOrderId: orderId,
      status: 'active',
    },
  })

  return NextResponse.json({ ok: true, entitled: true })
}
