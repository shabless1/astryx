# Vercel Environment Variables — Sprint v4.0 Checklist for SHA

*Project: `astryx` (myastryx.com) · vercel.com → astryx → Settings → Environment Variables*

## ✅ Already set (Claude set these via CLI/API during the sprint — no action needed)

| Var | Scope | What it is |
|---|---|---|
| `DATABASE_URL` | Production + Preview | Supabase pooled Postgres connection (Prisma runtime). Role `astryx_prisma` on project `gbalyncthcaxbzuwlbqo`. Value also in local `.env.local`. |
| `DIRECT_URL` | Production + Preview | Same DB, session mode (migrations during build). |
| `BETA_ALLOWLIST` | Production + Preview | Comma-separated emails with beta access, no purchase needed. Currently: `shabless1@gmail.com`. **Add tester emails here.** |
| `NEXT_PUBLIC_FORK_SHOP_URL` | Production + Preview | Fork-set product page the access screen links to. Currently `https://sacredtea.net` — **update to the exact product URL when live.** |

## ⚠️ FOR SHA TO SET (needs Shopify Admin access — see SHOPIFY_SETUP.md)

| Var | Scope | Where to get it |
|---|---|---|
| `SHOPIFY_WEBHOOK_SECRET` | Production | Shopify Admin → Settings → Notifications → Webhooks (after creating the `Order payment` webhook → the signing secret shown under the webhook list). Until set, the webhook endpoint rejects everything (safe) — fork buyers can be granted access via `BETA_ALLOWLIST` meanwhile. |
| `SHOPIFY_FORK_SKUS` | Production | The SKU(s) of the fork-set product(s), comma-separated. Optional — without it, any paid product whose title contains "tuning fork" grants access. |

## Optional (defaults are baked in — set only to change them)

| Var | Default | What it changes |
|---|---|---|
| `OPENAI_TTS_MODEL` | `gpt-4o-mini-tts` | The TTS model behind the Astryx voice. |
| `ASTRYX_TTS_VOICE` | `sage` | The brand voice. Pick once; do not expose a picker. |

## After changing any env var

Redeploy: Vercel → Deployments → ⋯ on the latest Production deployment → Redeploy
(or ask Claude to run `vercel --prod --yes`).
