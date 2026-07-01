# ASTRYX — Directive O: Tea Recommendations → Shop Link
### Claude Code handoff · 2026-06-28 · connect recommended teas to the House of MahMah Tea collection
**Read with:** `CLAUDE.md` (rule 8 — feature-flag the shop, never hard-code URLs), `lib/tea/SacredTeaMatchingEngine.ts` + `lib/tea/sacredTeaBlendProfiles.ts` (the blend engine), `lib/subscription.ts` (existing env-URL pattern), the surfaces that render the matched tea (Results reading · Dashboard "Explore Deeper / herbs for you" · Post-Session).

> **Goal:** every recommended Sacred Tea blend in the app gets a clear CTA that sends the user to SHA's collection: **https://sacredtea.net/collections/health-wellness**. All teas point to this one collection (per SHA). Wired through a feature flag + a single URL constant — no scattered hard-coded links.
>
> **Gating:** `npx tsc --noEmit` → 0 · `npm run build` ✓ · verify O.3 · `rm -rf .next` → `vercel --prod --yes` · append "Part O — Tea Shop Links" to `FIXES_COMPLETE_v3.md`.

---

## FIX O.1 — Per-blend product map + collection fallback + feature flag

**Where:** a small shop-link helper (e.g. `lib/shopLinks.ts`) + `.env` / Vercel env.

- Add env: `NEXT_PUBLIC_SHOP_LIVE=true` and `NEXT_PUBLIC_TEA_COLLECTION_URL=https://sacredtea.net/collections/health-wellness` (the fallback).
- Add a **per-blend deep-link map**, keyed to the exact `SacredTeaBlend` names in `lib/tea/sacredTeaBlendProfiles.ts` (SHA-provided 2026-06-28):
  ```ts
  const TEA_PRODUCT_URL: Partial<Record<SacredTeaBlend, string>> = {
    'The Phoenix — Sacred Gut Reset': 'https://sacredtea.net/products/%F0%9F%94%A5-the-phoenix-sacred-gut-reset-10-day-parasitic-cleanse-blend',
    'The Wise Elder':                 'https://sacredtea.net/products/the-wise-elder-tea-blend',
    'Blue Lotus Magic':               'https://sacredtea.net/products/blue-lotus-magic-tea-blend',
    'Equinox':                        'https://sacredtea.net/products/%F0%9F%8C%9E-equinox-sacred-citrus-glow-detox-blend-%F0%9F%8D%8B%E2%9C%A8',
    'Euphoria':                       'https://sacredtea.net/products/euphoria-botanical-blend-5-oz',
    'Egyptian Blue Lotus Flowers':    'https://sacredtea.net/products/egyptian-blue-lotus-flowers',
    // PENDING SHA confirmation — fall back to the collection until provided:
    // 'Blue Lotus Flowers', 'White Lotus Flowers'  → (combined? organic-whole-dried-blue-and-white-lotus-flowers)
    // 'Red Lotus Flowers'        → (no URL yet)
    // 'All Four Lotus Collection'→ (no URL yet)
  }
  ```
- Export `teaShopUrl(blend?: SacredTeaBlend)`: returns the blend's deep-link if present, else the collection URL — **but only when `NEXT_PUBLIC_SHOP_LIVE` is true**; otherwise `null` (CTA hidden). Mirror the `lib/subscription.ts` env-fallback pattern.
- **Never hard-code URLs in components** — they call `teaShopUrl(blend)` (CLAUDE.md rule 8). The map is the single source of truth; unmapped blends degrade to the collection, never a broken link.

## FIX O.2 — Add the CTA to every tea recommendation surface

**Where:** wherever the `matchSacredTea()` result / a recommended blend renders — the Results reading (Taste / 5-Sense plan), the Dashboard **Explore Deeper** ("Minerals/herbs for you" / tea block), and the **Post-Session** summary if it shows a tea.

- Under each recommended blend, render a CTA when `teaShopUrl(blend)` is non-null:
  - Label: **"Shop this blend →"** (or "Find this tea →"). On-brand styling (gold/cosmic), clearly tappable.
  - Links to `teaShopUrl(blend)` — the blend's **exact product page** when mapped, the collection otherwise — opens in a **new tab** with `target="_blank" rel="noopener noreferrer"`.
- If `NEXT_PUBLIC_SHOP_LIVE` is false, the CTA is hidden (the tea guidance still shows) — so it degrades cleanly.
- Keep compliance intact: the tea is wellness/reference, not a medical claim — no "treats/cures" language on or near the CTA.

## FIX O.3 — Verify
1. A reading that recommends a Sacred Tea blend shows a "Shop this blend →" CTA opening `https://sacredtea.net/collections/health-wellness` in a new tab.
2. The CTA appears on all tea surfaces (Results, Dashboard Explore Deeper, Post-Session).
3. Setting `NEXT_PUBLIC_SHOP_LIVE=false` hides every tea CTA (guidance remains). `tsc` 0; build ✓.

---

## GLOBAL RULES
- Frugal + sovereign: links to SHA's own Shopify collection — the incentive flows to her. No third-party tool.
- Feature-flagged + single URL constant (no scattered hard-codes). No new `any`. No engine/determinism changes.

## AFTER
`tsc` 0 → build ✓ → verify O.3 → `rm -rf .next` → `vercel --prod --yes` → append "Part O — Tea Shop Links" to `FIXES_COMPLETE_v3.md`.

## PENDING FROM SHA — 4 blends still need URLs (currently fall back to the collection)
- **Blue Lotus Flowers** + **White Lotus Flowers** — separate product pages, or both → `organic-whole-dried-blue-and-white-lotus-flowers` (combined)?
- **Red Lotus Flowers** — needs a product URL.
- **All Four Lotus Collection** — needs a product URL.
- Clarify `products/gut-reset` vs the full Phoenix URL (same product or different SKU?).
Add these to `TEA_PRODUCT_URL` when provided; until then they deep-link to the collection (no broken links).
