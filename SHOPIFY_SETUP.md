# Shopify → Astryx Fork-Buyer Auto-Unlock — Setup Guide for SHA

*Directive v4.0 · Fix 2. One-time setup, about 5 minutes. After this, anyone
who buys the Sacred Tones fork set on the Shopify store automatically gets
Astryx beta access when they sign in with their checkout email.*

---

## What happens automatically once this is set up

1. A customer pays for an order containing a Sacred Tones fork product.
2. Shopify sends the order to `https://myastryx.com/api/webhooks/shopify`.
3. Astryx records an entitlement for the customer's email.
4. The customer signs in (or signs up) at myastryx.com **with the same email
   they used at checkout** → full beta access, no code, no manual step.

---

## Step 1 — Create the webhook in Shopify

1. Open **Shopify Admin** for the sacredtea.net store
2. Click **Settings** (bottom-left gear)
3. Click **Notifications**
4. Scroll to the bottom → **Webhooks** section → click **Create webhook**
5. Fill in:
   - **Event:** `Order payment` (this is the `orders/paid` event)
   - **Format:** `JSON`
   - **URL:** `https://myastryx.com/api/webhooks/shopify`
   - **Webhook API version:** latest stable (whatever Shopify preselects)
6. Click **Save**

## Step 2 — Copy the signing secret

Right below the webhook list, Shopify shows a line like:

> *"Your webhooks will be signed with `xxxxxxxxxxxxxxxxxxxxxxxx`"*

Copy that value — it is the **webhook signing secret**.

## Step 3 — Add the secret to Vercel

1. Open **vercel.com** → project **astryx** → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `SHOPIFY_WEBHOOK_SECRET`
   - **Value:** the secret you copied in Step 2
   - **Environment:** Production (check Preview too if you want to test there)
3. Save.

## Step 4 — Tell Astryx which products are fork sets

Two options (do at least one):

**Option A — by SKU (precise, recommended):**
- In Shopify Admin → Products → open the fork set product → copy its **SKU**
- In Vercel env vars add: `SHOPIFY_FORK_SKUS` = the SKU (or several, comma-separated:
  `FORK-SET-12,FORK-SET-STARTER`)

**Option B — by title (zero-config fallback):**
- If `SHOPIFY_FORK_SKUS` is empty, Astryx grants access for any paid line item
  whose product title contains **"tuning fork"** (case-insensitive). If your
  product titles already say "tuning fork," you can skip Option A.

## Step 5 — Redeploy

Env var changes need a redeploy to take effect: Vercel → Deployments →
**Redeploy** the latest production deployment (or ask Claude to deploy).

---

## Granting access manually (no purchase)

Add emails to the `BETA_ALLOWLIST` env var in Vercel, comma-separated:

```
BETA_ALLOWLIST=friend@example.com,tester2@example.com
```

They get full beta access the next time they sign in. (Your own email is a
good first entry.)

## Sending a test

In Shopify's webhook section there is a **Send test notification** button —
note the test payload has no fork line items, so it will be accepted (HTTP 200)
but won't create an entitlement. The real test: place a real (or 100%-discount)
order for the fork product, then sign in at myastryx.com with that email.

## If a customer says they bought forks but the app is locked

1. Check they're signing in with their **checkout email** (most common issue).
2. If the webhook was created *after* their purchase, their order never reached
   Astryx — add their email to `BETA_ALLOWLIST` (redeploy) or ask Claude to
   insert the entitlement for their order.

---

*The webhook endpoint rejects anything not signed with the secret (HTTP 401),
so nobody can grant themselves access by posting fake orders.*
