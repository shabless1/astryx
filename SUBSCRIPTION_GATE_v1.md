# ASTRYX — Subscription Gate v1
**Shipped 2026-08-14 · prod (myastryx.com) · commits `daa34bd`, `5eda172`**

The Sacred Vault access protocol, ported onto ASTRYX. Shopify is the only
billing rail; access is time-bound; the trial clock is server-side.

---

## ⚠️ The one thing left for SHA

**Attach the two selling plans, then activate the product.** Until then the
gate's Subscribe button falls through to the shop root instead of the product.

**Deadline: 2026-08-18** — that's when the first real user
(`setkhinekyaw@gmail.com`) hits the paywall. Two more follow on 08-22 and 09-01.

The draft product is built and waiting:

| | |
|---|---|
| Product | **ASTRYX — Cosmic Calibration Access** |
| Shopify ID | `10497531183383` |
| Handle | `astryx-cosmic-calibration-access` |
| Status | **DRAFT** — invisible to shoppers until you activate |
| Variant | $9.99 · SKU `ASTRYX-ACCESS` · no shipping, no inventory tracking |

### Why I didn't create the selling plans by API

A selling plan group belongs to whichever app creates it, and **only a
subscription app with a billing engine can actually charge the rebills.** The
Vault's plans are owned by *Digital Library Access* (Shopify app
`66228322305`). If I had created plans from this connector instead, the product
would have *looked* subscribable and taken orders that never billed a second
time — a worse failure than no plans at all, and one that only shows up 30 days
later.

**Do this in the same subscription app that runs the Vault pass:**
1. Open the subscription app → create a plan group on **ASTRYX — Cosmic Calibration Access**
2. Monthly — **$9.99**, every 1 month
3. Yearly — **$99.00**, every 1 year
4. Set the product to require a selling plan (no one-time purchase)
5. Set product status **Active**

Then point the `orders/paid` webhook at
`https://myastryx.com/api/webhooks/shopify` if it isn't already (it is — the
fork entitlement has been using it since July).

---

## What shipped

### Access is time-bound
`Entitlement` now carries `plan` + `currentPeriodEnd`. **One append-only row per
paid order.** Access = the most generous live row, so a renewal can only extend,
never shorten, what someone already holds — the Vault's "never shorten"
guarantee expressed as data instead of branching logic.

- `currentPeriodEnd = NULL` → lifetime, never lapses
- monthly → **33 days** (one cycle + 2-day rebill grace)
- yearly → **367 days** (same grace)
- **Cancellation needs no handling.** When the rebills stop, the period lapses.

### The webhook is product-scoped
Only `SHOPIFY_ASTRYX_PRODUCT_ID` grants access. Tea, music, divining rods, an
album — none of them can unlock the app. That open-ended match is exactly how
the Vault leaked, and it's now pinned by a test.

Dates are computed from **when the order was paid**, not when the webhook
arrived — Shopify retries for days, and clocking off "now" would hand out free
time for every failed delivery.

### Fork buyers (SHA ruling 2026-08-14)
- The **10 founding buyers keep lifetime**, grandfathered in the migration.
- Forks sold from `2026-08-14T00:00:00Z` forward **no longer carry app access**.
  Those buyers get the same 30-day trial as everyone, then $9.99/mo or $99/yr.
- The cutoff is a constant in the webhook, so a late retry of a founding-era
  order still lands on the right side of it.
- **Update the fork product listing** so it no longer promises app access.

### The trial clock moved to the server
It used to live only in `localStorage` — clearing site data, or opening the app
on a second device, minted a fresh 30 days. It's now `User.trialStartedAt`,
claimed **once** by an atomic conditional update. Existing accounts were seeded
from their signup date, which reproduces the clock they already saw.

### The gate works now
`verifySubscription()` was a stub that returned `false`, so **"I've subscribed —
restore my access" could never succeed.** It now asks
`GET /api/subscription/status`, which reads the live entitlement. The gate shows
both lanes and links the one Shopify product page.

---

## Activation fix — Nina Johnson

She bought the forks (**order #4035**, `nijohn7@yahoo.com`) but signed up as
`nijohn7@gmail.com`, so the email-keyed entitlement never reached her. She has
been sitting behind the trial wall as a paying founding buyer. Same first and
last name on both records — granted lifetime, `source = manual_buyer_email_match`.

**Still unactivated (bought forks, never made an account):**
`l.jones@livebenevolent.org` · `ruthyrodgers19@gmail.com` · `cgcooks721@gmail.com`

That's 3 of 11 paying buyers who have never opened the app. Same growth leak
flagged in the July briefing — worth an email with the guide link.

---

## Health check — 2026-08-14

| Check | Result |
|---|---|
| myastryx.com, /guide, /api/catalog, auth endpoints | **200**, sub-second |
| `/api/subscription/status` unauthenticated | **401** (correctly gated) |
| Webhook, unsigned body | **401**, no DB write |
| Supabase advisors | 9 × INFO only (RLS on, no policies — fail-closed; Prisma bypasses as owner) |
| Test suite | **31 passing** (10 new gate tests) |
| Prod build | green |

**Registered users 12 · entitlements 11 active · readings 20 · sessions 20 · consents 11.**
Latest signup 2026-08-02 — no new accounts in 12 days.

### Trial standing
| Account | Gate date |
|---|---|
| setkhinekyaw@gmail.com | **2026-08-18** |
| finance.hawkeye@gmail.com | 2026-08-22 |
| comfortcateringss@gmail.com | 2026-09-01 |

Everyone else holds lifetime (founding forks) or is on the allowlist.

### Two pre-existing snags, unrelated to this work
1. **`npm run build` fails locally** on untracked report-engine WIP in
   `src/data/delineations/` (7 banned-phrase findings) and type errors in
   `src/lib/report/`. Untracked, so prod is unaffected — but **`vercel --prod`
   uploads the working directory, not git**, so those files have to be moved
   aside for any CLI deploy until they're cleaned up.
2. **No git auto-deploy.** Every production deploy is manual CLI.

---

## Env added (Vercel production)

```
SHOPIFY_ASTRYX_PRODUCT_ID   = 10497531183383
NEXT_PUBLIC_SUBSCRIBE_URL   = https://sacredtea.net/products/astryx-cosmic-calibration-access
```

`SUBSCRIBE_URL` falls back to the shop root when unset — a draft product 404s,
and a dead link at the gate is worse than the storefront's front door.

---

## Files

| File | What |
|---|---|
| `prisma/migrations/20260814000000_subscription_gate/` | Schema + grandfather + Nina + clock seed |
| `src/app/api/webhooks/shopify/route.ts` | Product-scoped, time-bound grant |
| `src/app/api/subscription/status/route.ts` | GET state · POST claim trial |
| `src/lib/entitlement.ts` | `resolveAccess()` — most generous live row |
| `src/lib/subscription.ts` | Clock + client calls + both prices |
| `src/components/screens/SubscribeGateScreen.tsx` | Two-lane gate |
| `tests/subscriptionGate.test.ts` | 10 tests pinning the boundary |
