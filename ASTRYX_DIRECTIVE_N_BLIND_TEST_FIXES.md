# ASTRYX — Directive N: Post-Blind-Test Fixes
### Claude Code handoff · 2026-06-28 · from the live blind test on www.myastryx.com
**Read with:** `ASTRYX_BLIND_TEST_2026-06-28.md`, `ASTRYX_DIRECTIVE_K_FORK_PLACEMENT.md` (N.1 re-asserts it), `ASTRYX_DIRECTIVE_L_ASTRYX_INTELLIGENCE.md` (N.2), `lib/BodyPlacementEngine.ts`, `components/engine/ChamberBodyMap.tsx`, `components/screens/SessionScreen.tsx`, `lib/engine.ts`, `COMPLIANCE.md`.

> Five fixes from a real first-time walkthrough. The engine + Astryx brain tested excellent; these are the refinements. Gating: `npx tsc --noEmit` → 0 · `npm run build` ✓ · verify each · `rm -rf .next` → `vercel --prod --yes` · append "Part N — Blind-Test Fixes" to `FIXES_COMPLETE_v3.md`. Determinism/compliance intact; engine output unchanged.

---

## FIX N.1 — Fork placement: dual orbs + per-planet accuracy (HIGHEST PRIORITY — core experience)

**Evidence from the blind test:** on the Mercury phase, the chamber body map showed **ONE** glowing orb **centered on the chest** — not the **two** placements (traditional + natal) Directive K specified, and the chest position is wrong for Mercury (which governs **throat / lungs / hands / nervous pathways**). So Directive K either did not deploy or did not render.

**What to do:**
1. **Confirm Directive K actually shipped.** If it wasn't built/deployed, build it now per `ASTRYX_DIRECTIVE_K_FORK_PLACEMENT.md` (dual anchors, glowing orbs, Scorpio womb-lift + genital clamp).
2. **Render BOTH placements** per fork: the **traditional** medical-astrology home AND the **natal** placement (the planet's natal-sign region) — distinct glowing orbs with labels ("Traditional · {region}", "Natal · {sign} · {region}"), merging to one only when the regions are genuinely identical.
3. **Fix per-planet anatomical accuracy.** The Mercury orb on the chest is wrong. Each orb must sit on the correct region from `planetBodyRulershipLibrary` / `signBodyRulershipLibrary` (Mercury → throat/lungs/hands; etc.). Validate a few planets against `signs.json` body_regions, not a center default.
4. **Scorpio/reproductive womb-lift + clamp** (from K.3) — verify no orb renders on the genitals.

**Verify:** Mercury phase shows two orbs — one at the throat/hands area (traditional), one at the natal-sign region — both glowing, labeled; Scorpio/Pluto sits in the womb/pelvic area; no central-default orb.

## FIX N.2 — Astryx must know the user's chosen intention (grounding accuracy)

**Evidence:** asked why Jupiter was in the sequence, Astryx attributed it to the chart dynamic — but the real driver was the user's **Abundance** intention. She doesn't have the selected intention in her grounding, so she rationalizes.

**What to do:** add the user's selected **intention** (chips + the resolved intention planet from `intentionMap.ts`) to Astryx's grounding context (`buildContextBlock` / the `/api/astryx` payload), within the existing data-minimization rules. Then she can say accurately: "Jupiter is here because you set **Abundance** as your intention — and it also bridges your Neptune/Sun dynamic."

**Verify:** with an Abundance intention set, asking "why is Jupiter here?" yields an answer that names the intention as the driver. No engine change; chat-surface only.

## FIX N.3 — "Today's Element" must cohere with the reading (calibration coherence)

**Evidence:** the reading was DIFFUSED · Neptune (diffuse / low-energy / foggy), but "Today's Element" read **"Fire is loud — you may run hot."** That contradicts the personal signal and breaks the coherence the app is built on.

**What to do:** the element-of-the-day line is the daily **transit/sky** weather, not the personal signal — so:
- **Label it clearly** as the collective sky (e.g. "Today's Sky" / "Today's transit weather"), visually distinct from the personal reading, so it never reads as the user's own signal.
- **Reconcile the guidance** with the personal state instead of contradicting it — e.g. "The sky runs Fire today, but your signal is diffuse, so…" The advice should harmonize the transit element with the user's signalHierarchy, not assert a mood the reading just denied.
- Keep probabilistic framing.

**Where:** the "Today's Element" generator (`lib/engine.ts` daily-element / `dailyElement.ts`) + the reading/results render. Honor `signalHierarchy` as the source of truth.

**Verify:** a diffuse/low-energy reading no longer shows a contradictory "you may run hot" as if it were the personal signal; the sky element is badged as such and its advice references the personal signal.

## FIX N.4 — Duplicate "BIRTH LOCATION" label (cosmetic)

**Evidence:** intake shows "BIRTH LOCATION" twice — a section header AND the field label inside the card.

**What to do:** remove the redundant label so it appears once. **Where:** `IntakeScreen.tsx` (birth-location section + `BirthLocationField`).

**Verify:** one "Birth Location" label on intake.

## FIX N.5 — www.myastryx.com flashes the raw Vercel preview URL (infra/polish)

**Evidence:** navigating to `www.myastryx.com` briefly showed `astryx-msuy4l1hb-…vercel.app` in the address bar before settling on the custom domain. The domain may be aliased to a **pinned preview deployment** rather than tracking **production**.

**What to do:**
- Ensure `myastryx.com` / `www.myastryx.com` are assigned to the **project's production deployment** (so they always serve the latest prod and show the clean domain — no redirect through a preview hash). Re-point if currently aliased to a specific preview build.
- Confirm the **bare apex** `myastryx.com` (no www) resolves, and set the **canonical redirect** (apex ↔ www) the intended direction (apex primary per the earlier plan).
- Re-verify `NEXTAUTH_URL` matches the final canonical host so logins stay clean.

**Verify:** typing either `myastryx.com` or `www.myastryx.com` lands on the clean canonical URL with no Vercel-hash flash; SSL valid.

---

## NICE-TO-HAVE (respects SHA's design — optional)
**Player default-collapsed in Body/Combined mode.** SHA confirmed the player must overlay and is collapsible by design — keep that. As a small win so the fixed dual-orbs are seen on arrival, **default the player to collapsed when the user is in Body or Combined mode** (still one tap to expand). Music/breath modes can default expanded. This isn't a redesign — just the initial state.

## GLOBAL RULES
Determinism for the engine is absolute (N.1/N.3 must not change the deterministic reading/protocol — N.3 only fixes labeling + the transit-element copy logic, which can stay deterministic). Compliance gates intact (probabilistic framing, disclaimer, crisis, Malachite). Astryx stays chat-surface only. No new `any`.

## AFTER
`tsc` 0 → `npm run build` ✓ → verify N.1–N.5 → `rm -rf .next` → `vercel --prod --yes` → append "Part N — Blind-Test Fixes (dual-orb placement + per-planet accuracy, Astryx intention grounding, Today's-Sky coherence, duplicate label, domain→prod alias)" to `FIXES_COMPLETE_v3.md`.
