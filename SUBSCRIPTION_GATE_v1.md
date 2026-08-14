# ASTRYX — Subscription Gate v1
**Shipped 2026-08-14 · prod (myastryx.com) · commits `daa34bd`, `5eda172`**

The Sacred Vault access protocol, ported onto ASTRYX. Shopify is the only
billing rail; access is time-bound; the trial clock is server-side.

---

## ⚠️ Two things left for SHA

### 1. The yearly plan currently charges $9.99, not $99 — fix in Shopify

The product is live (**UNLISTED**, `requiresSellingPlan: true`) with a plan
group **Astryx** (`86032089367`) carrying "Deliver every month" and "Deliver
every year". Both are correct on *frequency*. But **both have an empty
`pricingPolicies` array**, which means neither overrides the variant price — so
they both charge **$9.99**. A yearly subscriber would pay $9.99 for a full year.

The Vault's plans carry an explicit fixed price per plan
(`adjustmentType: PRICE` → $19.99 / $199.99). ASTRYX's need the same.

I tried to patch it by API and got:
> Access denied for `sellingPlanGroupUpdate`. Required: `write_products` plus
> `write_own_subscription_contracts` or `write_purchase_options`.

So this one is yours:
1. Shopify admin → the ASTRYX product → the **Astryx** purchase-option group
2. Monthly plan → set the price to **$9.99**
3. Yearly plan → set the price to **$99.00**
4. Re-check: the product page should show two prices, not two identical ones

**Also worth verifying with one real test order:** the group's `appId` is
`null`, where the Vault's group is stamped with its subscription app
(`66228322305`). A selling plan needs a subscription app behind it to actually
run the rebills — a plan with no billing engine takes the first payment and
never charges again, which only becomes visible 30 days later. Buy it once
yourself and confirm a subscription contract appears in the admin.

### 2. Turn the email funnel on — `RESEND_API_KEY`

The funnel is built and inert. Read the copy in `src/lib/emails.ts`, then set
`RESEND_API_KEY` in Vercel (same Resend account as the Vault — it sends from
`noreply@mail.sacredtea.net`, a domain already verified there). No key, no
sends. That's the approval switch.

**Deadline: 2026-08-18** — `setkhinekyaw@gmail.com` hits the paywall then, and
is the first person who will meet the subscribe link for real. Two more follow
on 08-22 and 09-01.

The `orders/paid` webhook is already pointed at
`https://myastryx.com/api/webhooks/shopify` (the fork entitlement has used it
since July), so the subscription grant needs no extra wiring.

---

## The funnel — fork buyer → subscriber

```
buys forks ──► orders/paid webhook
                 ├─ BuyerLead recorded (account or not)
                 └─ "Your Sacred Tones are coming" ──► myastryx.com + /guide
                                                          │
                                              creates account, 30-day clock
                                                          │
                     day 27 ──► "Your access pauses in 3 days" ──► subscribe link
                     day 30 ──► "Your 30 days are complete"   ──► subscribe link
                                                          │
                                              subscribes on sacredtea.net
                                                          │
                        orders/paid ──► entitlement +33d / +367d ──► unlocked
```

**Three emails, all in `src/lib/emails.ts`** — that one file is the whole
customer-facing voice, and the build lints every word of it against
`COMPLIANCE.md` (it already caught a banned "you have" in my first draft).

**Nobody is asked to buy what they already hold.** Founding fork buyers,
allowlisted emails and live subscribers are all skipped.

**Send-once is a database stamp, not a schedule assumption.** The stamp is
written only after Resend accepts, so the daily cron is safe to re-run, a failed
send retries tomorrow instead of vanishing, and an account that lapsed a
fortnight ago gets the door-closed mail rather than a stale "3 days left".

**The cron:** `/api/cron/trial-emails`, daily at 15:00 UTC (10am Central) via
`vercel.json`. Add `?dryRun=1` to see exactly who would be mailed while sending
and stamping nothing.

### Dry run against production, 2026-08-14

```json
{"mailConfigured": false, "sent": [], "skipped": {"hasAccess": 8, "notDue": 3, "undeliverable": 1},
 "neverActivated": ["nijohn7@yahoo.com", "l.jones@livebenevolent.org",
                    "ruthyrodgers19@gmail.com", "cgcooks721@gmail.com"]}
```

Nobody is due today, and `mailConfigured: false` confirms the gate is shut.
`neverActivated` lists Nina's *yahoo* address because that is the address she
bought under — she is active on gmail. The other three are the real activation
gap.

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
CRON_SECRET                 = (generated — protects the daily mailer)
RESEND_API_KEY              = ← NOT SET. This is the funnel's on-switch.
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
| `tests/subscriptionGate.test.ts` | 14 tests pinning the access boundary |
| `src/lib/emails.ts` | **Every customer-facing word.** SHA's file to edit |
| `src/lib/mailer.ts` | Resend door · no key = no sends |
| `src/app/api/cron/trial-emails/route.ts` | Daily lifecycle mailer · `?dryRun=1` |
| `prisma/migrations/20260814010000_funnel_v1/` | BuyerLead + send-once stamps |
| `tests/funnel.test.ts` | 15 tests — who gets mailed, once, and the copy lint |
