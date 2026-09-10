#!/usr/bin/env node
/**
 * ASTRYX — fork promo cohort grants (SHA ruling 2026-09-10)
 * ════════════════════════════════════════════════════════════════════════════
 * Three cohorts, one rule each:
 *
 *   1. LIFETIME LITE  — bought the original stainless / aluminium sets (July).
 *      Already correct in the database: 10 rows, plan 'lifetime',
 *      currentPeriodEnd NULL, tier 'individual'. THIS SCRIPT DOES NOT TOUCH THEM.
 *
 *   2. 90-DAY PROMO   — bought within the two weeks before the paywall opened.
 *      Written here, dated from the PURCHASE, not from signup.
 *
 *   3. 30 DAYS        — everyone from the paywall date onward. Needs no row:
 *      the standard signup trial (TRIAL_DAYS = 30, lib/subscription.ts) already
 *      does exactly this, and dating it from signup rather than purchase is the
 *      more forgiving behaviour for someone who buys forks and activates later.
 *
 * Idempotent: keyed on shopifyOrderId, so a re-run or a webhook replay updates
 * the same row instead of stacking duplicates.
 *
 *   node scripts/grant-fork-promo.mjs           # dry run, prints the plan
 *   node scripts/grant-fork-promo.mjs --commit  # writes
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'

// Load .env.local without a dependency.
try {
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
} catch { /* CI / prod supplies real env */ }

const COMMIT = process.argv.includes('--commit')
const prisma = new PrismaClient()

const DAY = 24 * 60 * 60 * 1000

/** Cohort 2 — verified against Shopify by SKU (ST-RF12-W), 2026-09-10. */
const PROMO_90D = [
  { orderId: '7232430833943', email: 'ishman.ware@aol.com',    who: 'Peggy Mims',     paidAt: '2026-09-01T03:26:50Z' },
  { orderId: '7235835166999', email: 'liferocks724@gmail.com', who: 'Damali Ajanaku', paidAt: '2026-09-03T04:06:29Z' },
]

/**
 * The owner's own access, as a durable row rather than an env var.
 * BETA_ALLOWLIST works, but it is one mis-set environment variable away from
 * locking SHA out of her own app on the day the paywall opens.
 */
const OWNER = { id: 'ent_owner_shablyss', email: 'shabless1@gmail.com', tier: 'practitioner' }

async function main() {
  console.log(COMMIT ? '── COMMITTING ──' : '── DRY RUN (pass --commit to write) ──')

  // Guard: never silently downgrade the grandfathered cohort.
  const lifers = await prisma.entitlement.findMany({
    where: { status: 'active', currentPeriodEnd: null, source: 'shopify_fork_kit' },
    select: { email: true },
  })
  console.log(`\nLifetime-lite cohort already in place: ${lifers.length} rows — untouched.`)

  console.log('\n90-day promo grants:')
  for (const g of PROMO_90D) {
    const ends = new Date(new Date(g.paidAt).getTime() + 90 * DAY)
    console.log(`  ${g.email.padEnd(26)} ${g.who.padEnd(16)} paid ${g.paidAt.slice(0, 10)} → expires ${ends.toISOString().slice(0, 10)}`)
    if (!COMMIT) continue
    await prisma.entitlement.upsert({
      where: { shopifyOrderId: g.orderId },
      update: { email: g.email.toLowerCase(), plan: 'promo_90d', tier: 'individual', status: 'active', currentPeriodEnd: ends },
      create: {
        email: g.email.toLowerCase(),
        source: 'shopify_fork_kit',
        plan: 'promo_90d',
        tier: 'individual',
        status: 'active',
        shopifyOrderId: g.orderId,
        currentPeriodEnd: ends,
      },
    })
  }

  console.log('\nOwner access (durable row, not an env var):')
  console.log(`  ${OWNER.email} → lifetime · ${OWNER.tier}`)
  if (COMMIT) {
    await prisma.entitlement.upsert({
      where: { id: OWNER.id },
      update: { email: OWNER.email, tier: OWNER.tier, status: 'active', currentPeriodEnd: null },
      create: {
        id: OWNER.id,
        email: OWNER.email,
        source: 'owner',
        plan: 'lifetime',
        tier: OWNER.tier,
        status: 'active',
        currentPeriodEnd: null,
      },
    })
  }

  if (COMMIT) {
    const rows = await prisma.entitlement.findMany({
      where: { status: 'active' },
      select: { email: true, source: true, plan: true, tier: true, currentPeriodEnd: true },
      orderBy: { createdAt: 'asc' },
    })
    console.log(`\n── After ── ${rows.length} active entitlements`)
    for (const r of rows) {
      const until = r.currentPeriodEnd ? r.currentPeriodEnd.toISOString().slice(0, 10) : 'never expires'
      console.log(`  ${r.email.padEnd(30)} ${r.plan.padEnd(10)} ${r.tier.padEnd(12)} ${until}`)
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
