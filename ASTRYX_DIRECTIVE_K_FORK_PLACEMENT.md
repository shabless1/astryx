# ASTRYX — Directive K: Fork Placement — Dual Anchors, Glowing Orbs, Scorpio Lift
### Claude Code handoff · 2026-06-28 · driven by SHA's live testing of the Directive J build
**Read with:** `CLAUDE.md`, `COMPLIANCE.md`, `lib/BodyPlacementEngine.ts`, `components/engine/ChamberBodyMap.tsx`, `components/engine/BodyMap.tsx`, `components/screens/SessionScreen.tsx`.

> **Context.** Directive J shipped. SHA's only outstanding issue is **fork placement** on the body map. Three corrections, all in the placement layer. Nothing else from J changes.
>
> **Gating:** `npx tsc --noEmit` → 0 · `npm run build` ✓ · verify K.1–K.3 · `rm -rf .next` → `vercel --prod --yes` · append "Part K — Fork Placement" to `FIXES_COMPLETE_v3.md`. Determinism + compliance intact.

---

## THE THREE CORRECTIONS (what SHA found)

1. **Each fork must show TWO placements, not one:** the **traditional** medical-astrological placement (the planet's rulership home — the zodiacal man) **and** the **natal** placement (where that planet actually sits in *this user's* chart, by its natal sign). Both rendered on the body map.
2. **Both placements are GLOWING ORBS, not small dots** — a luminous orb sitting on the anatomy, not a pinpoint.
3. **Scorpio (and all reproductive placements) sit too low — on the genitals.** Raise them so the orb sits in the **womb / pelvic** area. Astryx never places on the genitals.

---

## FIX K.1 — Dual placement anchors in `resolveForkPlacement` (FOUNDATION — do first)

**Where:** `lib/BodyPlacementEngine.ts` (the `ForkPlacement` type + `resolveForkPlacement`); thread the planet's natal sign from `components/screens/SessionScreen.tsx` (`resolvePlacement` at ~line 336 has `chartData.planets` available).

**The problem:** `ForkPlacement` carries a single `anchor`. `resolveForkPlacement` computes only the **traditional** (rulership) anchor; the **natal** anchor (planet's natal sign → body region) is never produced for the chamber.

**What to build:**
- Extend `ForkPlacement` to carry **two anchors**, each with its own region + label and the existing intimate-region/sweep treatment:
  - `traditionalPlacement: { anchor: {x,y}; region: string; label: string; view: BodyView; mode: 'contact'|'sweep'; sweep?: SweepPath }` — the planet's rulership home (current behavior, via `bodyZoneHomeFor` / `planetBodyRulershipLibrary`).
  - `natalPlacement: { …same shape… }` — the planet's **natal sign** → region. Resolve the planet's natal sign (passed in from `SessionScreen`'s `chartData.planets`), map sign → region via the existing `SIGN_TO_REGION` (lift it to a shared module or re-derive from `signBodyRulershipLibrary`), then `anchorFor(region)`.
- `resolveForkPlacement(...)` gains a `natalSign?: string` input. If `natalSign` is missing (e.g. Solar Chart edge), fall back to the traditional anchor for both and flag `natalPlacement.sameAsTraditional = true`.
- **Merge rule:** if traditional region === natal region (planet in its own ruling sign, e.g. Mars in Aries), set `sameAsTraditional = true` so the UI renders **one** orb, not two stacked identically.
- Keep `primaryLabel`/`how` working (back-compat) — they describe the traditional placement; add `natalLabel`/`natalHow` for the natal one.
- The existing **intimate-region → off-body sweep** rule (`deliveryModeFor` / `INTIMATE_REGIONS`) applies to **each** anchor independently.

**Verification:** for a user with (say) Mars in Gemini: `traditionalPlacement.region` = a Mars rulership region (e.g. solar_plexus/head), `natalPlacement.region` = Gemini's region (shoulders/lungs/arms), two distinct anchors. For Mars in Aries: `sameAsTraditional = true`, one anchor.

## FIX K.2 — Render both as glowing orbs in `ChamberBodyMap` (depends on K.1)

**Where:** `components/engine/ChamberBodyMap.tsx`

**The problem:** the current contact marker is a single small point (`anchor`, ~0-size pulsing dot at ~line 124-129). SHA wants two clearly luminous **orbs**.

**What to build:**
- Render **two glowing orbs**, one per placement from K.1 (one if `sameAsTraditional`):
  - A **radial-gradient luminous orb** in the planet's color — visibly larger than the old dot (an orb, not a pinpoint), with a soft pulsing halo. Reuse the existing glow filter/`breathe`/`corePulse` animation; keep it GPU-light (honor Animation Intensity Low).
  - **Distinguish the two** clearly: **Traditional** = filled bright core + strong halo; **Natal** = same planet color, rendered as a haloed **ring** (outline orb) so they read as a pair, not duplicates. Each gets a small caption: `Traditional · {region}` and `Natal · {sign} · {region}`.
  - Add a tiny **legend** under the map: `◉ Traditional placement   ◎ Natal placement`.
- If the two anchors prefer different `view`s (anterior/posterior), default to the **traditional** view, show the natal orb if it falls on the same view, and otherwise surface a one-line hint: `Natal point on the {view} — flip to view`. (Don't silently hide it.)
- Honor `hideForkDot` (the breathwork bookend renders the body only — no orbs).
- Keep the off-body **sweep** rendering for intimate placements (the `↯` sweep line), now applied per-anchor.

> **Visual-distinction note:** I (the directive author) chose filled-core = traditional, ringed = natal, both in planet color. This is adjustable after SHA sees it live — keep the two orb styles in clearly-named constants so it's a one-line restyle, not a refactor.

**Verification:** entering a corrective session, each fork phase shows two glowing orbs (or one when the planet is in its own sign), each labeled, both clearly orbs with a pulse — no tiny dots. Low animation intensity stays smooth.

## FIX K.3 — Raise Scorpio / reproductive placements to the womb-pelvic area (independent; can run anytime)

**Where:** BOTH coordinate tables — `lib/BodyPlacementEngine.ts` (`anchorFor` map, used by the chamber orb) **and** `components/engine/BodyMap.tsx` (`REGION_POS_ANTERIOR` / `REGION_POS_POSTERIOR`).

**The problem:** `pelvis` sits at `{x:50, y:53}` anterior / `{x:50, y:55}` posterior. On the body image that lands on the **genital line**. Scorpio → `pelvis`, so the Scorpio/Pluto orb renders on the genitals.

**What to build:**
- **Raise the pelvic/reproductive anchors** so the orb sits in the **womb / lower-pelvic** field, above the genitals:
  - Anterior `pelvis`: `y:53 → ~y:47` (womb / lower abdomen).
  - Posterior `pelvis`/sacrum: `y:55 → ~y:50` (sacral).
  - Any `sacral` / `reproductive_field` / `elimination_field` anchor in `anchorFor`: same lift.
- **Hard floor (compliance/brand rule):** clamp every placement anchor so **no orb renders below ~y:49 anterior / y:52 posterior** — i.e. nothing lands on the genitals, ever, for any planet or sign, on either body sex. Encode this as a single clamp in `anchorFor` (and mirror in `REGION_POS`) with a comment: *"Astryx places on the womb/sacral field — never the genitals."*
- Validate the new `y` against the actual `body-anterior.png` / `body-posterior.png` so the orb visually sits on the lower abdomen/sacral area for both `body_male` and `body_female` images. Adjust the exact value to the art if ~47 is slightly off; document the final number.
- Leave the existing **off-body sweep** for intimate regions in place — this fix lifts the *visual anchor*; the no-contact sweep instruction stays.

**Verification:** run a chart with Scorpio prominent (and one with Pluto) — the placement orb sits in the **womb/pelvic** area, not on the genitals, on both sexes and both views. No placement for any planet renders below the clamp line.

---

## GLOBAL RULES
- Determinism (no `Math.random`); same chart + fork = same two anchors, same render.
- Compliance: the womb-not-genitals clamp is a safety/brand rule — do not regress it. Intimate placements keep the off-body sweep + "no contact" language. Micro-disclaimer + crisis gate untouched.
- No new `any`; types extend cleanly from `ForkPlacement`.
- Performance: orbs must stay smooth at Animation Intensity Low.

## AFTER ALL FIXES
1. `npx tsc --noEmit` → 0. 2. `npm run build` ✓. 3. Verify K.1–K.3 (dual orbs incl. the merge case; Scorpio/Pluto lift on both sexes + views). 4. `rm -rf .next` → `vercel --prod --yes`. 5. Append **"Part K — Fork Placement (dual anchors, glowing orbs, womb-pelvic lift)"** to `FIXES_COMPLETE_v3.md`: the two-anchor model, the orb styles chosen, and the final pelvic `y` values + clamp.
