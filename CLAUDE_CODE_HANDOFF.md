# CLAUDE CODE — HANDOFF BRIEF (Astryx Trust Fixes)
**From:** Cowork (architecture) → **To:** Claude Code (execution)
**Date:** 2026-06-08
**Your job:** VERIFY and FINISH the already-applied P0/P1 trust fixes, confirm a clean build, report results, then **STAND BY**. Do not start new work — the next directives come after SHA + Cowork finish consulting.

---

## ⚠️ READ FIRST — the code is ALREADY EDITED
The three fixes below were applied in a Cowork session and are on disk. **Verify them; do NOT re-apply** (re-applying will double-edit). The Cowork build couldn't be confirmed there because it ran over a OneDrive-synced mount that served stale/truncated file copies — a sandbox artifact, not a code problem. You're running locally on the real files, so just verify + build.

If any verification grep below comes back EMPTY (i.e., the edit didn't survive sync), fall back to `ASTRYX_TRUST_FIXES_DIRECTIVE.md` and apply that one fix, then continue.

---

## STEP 1 — Verify the 3 fixes are present
Run these greps; each must return a hit:

**Fix 1 — `src/lib/timezone.ts`** (historical timezone)
- `grep -n "atDate?: Date" src/lib/timezone.ts`
- `grep -n "getTimezoneFromCoords(lat, lon, refDate)" src/lib/timezone.ts`

**Fix 1b — `src/app/api/chart/route.ts`** (resolve offset at birth date — the live path)
- `grep -n "import { getTimezoneFromCoords }" src/app/api/chart/route.ts`
- `grep -n "getTimezoneFromCoords(birthData.latitude, birthData.longitude, refDate)" src/app/api/chart/route.ts`

**Fix 2+3 — `src/lib/engine.ts`** (regulator wired into prescription + single freq source)
- `grep -n "triggerLabel: string,\\s*$" src/lib/engine.ts` (then confirm `polarity?: PolarityResult,` is the next param of `composeUnifiedPrescription`)
- `grep -n "const correcting = shouldApplyPolarity(polarity)" src/lib/engine.ts`
- `grep -n "ONEIROGENS" src/lib/engine.ts`
- `grep -n "composeUnifiedPrescription(planet, source, triggerLabel, planetPolarity)" src/lib/engine.ts`

Detail of every change is in **`FIXES_COMPLETE_v3.md`**.

## STEP 2 — Build
- `npm run build` → expect **zero TypeScript errors**.
- Known pre-existing issue: `src/lib/sunoLibrary.ts` has encoding / "invalid character" damage **unrelated to these fixes** (it was already corrupted before this work). If — and only if — it blocks the build, restore that one file from git (`git checkout -- src/lib/sunoLibrary.ts`) or repair its encoding. Do not touch the three fixed files.

## STEP 3 — Run verification vectors
- **A (timezone):** `1990-03-22`, `21:42`, Lisbon, no symptoms → Ascendant must be **Scorpio** (≈7°), not Libra. (Swiss-Ephemeris confirmed.)
- **B (Planet≠Remedy):** Neptune-excess (tap "confused, foggy, spiritually unmoored") → prescription shows **peppermint / rosemary / ginger / gotu kola**, alternate-nostril breath, grounding palette; **NO mugwort, NO Blue Lotus**; and the Results "Sound" Hz **equals** the Chamber Hz (Mercury 141.27), labeled correctly.
- **C (generalize + no regression):** Mars-excess → cooling/calming (Moon/Venus) herbs, 4-7-8 breath. A **balanced** state → unchanged (keys off the dominant planet).

## STEP 4 — Report
Append a "Build & Verify Results" section to `FIXES_COMPLETE_v3.md`: build pass/fail, each vector's actual result, and anything you had to repair (e.g., sunoLibrary.ts). Commit with a clear message (e.g. `fix: historical timezone + regulator-wired prescription (P0/P1 trust fixes)`).

## STEP 5 — STAND BY
After Steps 1–4, **stop and await the next directive.** Do **not** begin any of the queued items below — they're coming in a separate, sequenced brief once SHA + Cowork finish the strategy pass:

**Queued (do NOT start yet):**
- IP hardening: move the planet×state mapping tables + correction logic server-side (trade-secret containment).
- P1-5: deterministic narrative→planet parsing (or honest copy).
- P2 polish: Cosmic-Weather "7 active vs 5", geocode autocomplete de-dup, duplicate "BIRTH LOCATION" label, 12h time-input PM, preview/chamber audio parity, remove persisted "Test Balanced" fixture, copy passes, BirthLocationField label date.

---

## Reference docs in repo root
- `ASTRYX_TRUST_FIXES_DIRECTIVE.md` — full source-verified directive (the fallback if a fix didn't survive sync).
- `FIXES_COMPLETE_v3.md` — exact changes, file/line, and the verification checklist.
- `ASTRYX_PRESSURE_TEST` findings live in Cowork; the build/IP roadmap is being finalized with SHA.
