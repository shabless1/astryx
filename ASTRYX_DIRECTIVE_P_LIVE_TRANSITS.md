> ⚠ **SUPERSEDED — do not run this file.** Merged into **`ASTRYX_DIRECTIVE_PQ_ASTRYX_UPGRADE.md`** (run that instead). Kept for reference only.

# ASTRYX — Directive P: Live Transits + Full Astrology Scope
### Claude Code handoff · 2026-06-28 · give Astryx today's sky and the freedom to use it
**Read with:** `ASTRYX_DIRECTIVE_L_ASTRYX_INTELLIGENCE.md` (L.7 data-minimization), `lib/ephemeris.ts` (`calculateTransits`), `lib/dailyTemperature.ts` (`computeDailyTemperature`), `lib/dailyElement.ts`, `lib/teacher/grounding.ts` (`SYSTEM_INSTRUCTION` + `buildContextBlock`), `lib/astryx/persona.ts`, the live Astryx route (`app/api/astryx/route.ts` or the wired teach route), `COMPLIANCE.md`.

> **The problem (SHA, live test):** asked about current transits, Astryx gave **one** aspect then said she **can't access current positions** — a big fail. She should answer **any** astrology question — **mundane, medical, frequency** — speak to **today's full sky and how it hits the user's natal chart**, and recommend **which fork(s) to use today**.
>
> **Root cause:** an LLM can't know today's sky from training, and Astryx's grounding only includes the **single headline transit** (`headlineTransit` / `activeTransits[0]`). She also carries an over-narrow "I read only your chart" scope. **The app already computes the full sky** (`calculateTransits` + `computeDailyTemperature` via NASA-JPL `astronomy-engine`, offline + deterministic) — it just isn't fed to her.
>
> **The fix:** build a complete "today's sky" transit package from the existing ephemeris and inject it into Astryx's context, then widen her scope so she uses it (and general astrology knowledge) instead of refusing. **Model stays OpenAI** (SHA's choice) — this is grounding + scope, model-agnostic. Frugal: **no external ephemeris API** — reuse what's installed.
>
> **Gating:** `npx tsc --noEmit` → 0 · `npm run build` ✓ · verify P.6 · `rm -rf .next` → `vercel --prod --yes` · append "Part P — Live Transits & Full Astrology Scope" to `FIXES_COMPLETE_v3.md`. Determinism + compliance intact; the LLM still never recomputes the deterministic reading.

---

## FIX P.1 — Build the full "today's sky" transit package (FOUNDATION)

**Where:** new `lib/astryx/transitContext.ts` (server-only), composing the EXISTING engines.

**What to build:** `buildTransitContext(natalChart?, date = new Date())` returning a compact, model-ready object:
- **Today's sky (mundane, always available even with no natal chart):** the current sign + degree of **all ten planets** for `date` (compute via the same `astronomy-engine` calls `ephemeris.ts` already uses; if a helper for "positions only" doesn't exist, add one — do NOT pull an external API).
- **Transit-to-natal aspects (when a natal chart exists):** the FULL list from `calculateTransits(natalChart, date)` — every transiting-planet → natal-planet aspect, not just the headline.
- **Daily temperature + element:** from `computeDailyTemperature(natalChart, date)` / the daily-element engine (Cool/Warm/Hot + heaviest elemental weather).
- **Suggested fork(s) for today:** the dashboard's existing daily fork suggestion (headline-transit planet → fork via `forkFor`), plus the counterweight if the headline is overstimulating (reuse the never-amplify logic).
- Deterministic: same date + chart → identical package.

**Verify:** `buildTransitContext(chart)` returns all ten current positions + the full aspect list + temperature + suggested fork; `buildTransitContext()` (no chart) still returns the current sky.

## FIX P.2 — Inject the full package into Astryx's grounding

**Where:** the Astryx route + `buildContextBlock` in `grounding.ts`.

**What to build:** include the P.1 package in Astryx's context on every message, clearly labeled, e.g.:
```
TODAY'S SKY (date): Sun 12° Cancer · Moon 3° Scorpio · Mercury 28° Gemini · … (all 10)
TRANSIT → NATAL ASPECTS: tMoon square nSun; tSaturn trine nVenus; … (full list)
TODAY'S TEMPERATURE: Warm · heaviest element: Water
TODAY'S SUGGESTED FORK: Mercury (clarify) — counterweight to tMoon–nSun friction
```
Replace the single-`headlineTransit`-only context with this full block. Honor **L.7 data-minimization** — the sky + derived aspects/fork are fine to send; never send raw birth time/location/account/payment (only derived signs/positions).

**Verify:** the outbound model payload contains all ten current positions + the full aspect list — inspect it.

## FIX P.3 — Widen Astryx's scope (stop the refusals)

**Where:** `SYSTEM_INSTRUCTION` / `persona.ts` / the route's tier rules.

**What to change:**
- **She now HAS today's sky** — she must speak to current positions and transit-to-natal contacts confidently. **Remove the "I can't access current positions" / "I read only your chart" failure mode.** (Keep the determinism rule: she explains, she never recomputes the protocol.)
- **Full astrology scope:** Astryx answers **any** astrology question —
  - **Mundane / general** (what a transit is, what Mercury retrograde is, today's sky in general terms) → from the live package + fenced general knowledge (Tier 2),
  - **Medical astrology** (sign/planet → body system, cell salt, herb) → from the **canon** (authority, cited),
  - **Frequency** (Cousto Hz, the fork system, solfeggio/chakra) → from the canon,
  and ties them together: *today's sky → how it applies to YOU → which fork(s) + 5-sense recalibration for the day.*
- **"Mundane, not fortune-telling."** She describes the pattern and its themes (probabilistic framing — "may correlate with"), never predicts fixed events or fate, never diagnoses; health decisions defer to the licensed practitioner. This is the line: full astrological fluency, zero prediction-as-fact.

**Verify:** "what's Mercury retrograde?" and "what are today's transits?" both get real answers; she never says she can't access current positions.

## FIX P.4 — Fork(s) for the day (tie sky → recalibration)

**Where:** the route's answer composition (uses P.1's suggested fork).

When asked "which fork today?" / "what should I work with today?", Astryx names the **fork(s) best for today's sky**, explains why (the headline contact + never-amplify counterweight), and adds the **5-sense angle** (the day's element → scent/taste/color/breath from the canon). Concise, in-voice, compliant.

**Verify:** "which fork should I use today?" → a specific fork + plain-language reason grounded in today's transits.

## FIX P.5 — No-natal-chart case

If the user hasn't generated a reading yet, Astryx still answers the **current sky in mundane terms** and general astrology questions, and invites them to run a calibration to get the **personalized** transit-to-natal read + fork-of-the-day. Never a hard refusal.

## FIX P.6 — Verify (the SHA acceptance test)
1. **"What are the current transits?"** → Astryx lists today's planetary positions (multiple, not one) + key aspects to the user's natal chart + temperature + suggested fork. **Never** "I can't access current positions."
2. **"Which fork is best for me today and why?"** → a specific fork + reasoning tied to today's sky + a 5-sense note.
3. **A mundane question** ("what does Saturn in [sign] mean generally?") → answered, fenced as general where appropriate.
4. **A medical/frequency question** → answered from canon, cited.
5. **Determinism:** same day + chart → same transit package. **Compliance:** probabilistic, no prediction-as-fact, no diagnosis, practitioner deferral intact.

---

## GLOBAL RULES
- **Frugal/sovereign:** reuse `astronomy-engine` (already installed) — NO external ephemeris API, no new paid dependency. The sky is computed in-stack; only the question + derived context go to the model.
- **Model:** stays **OpenAI/GPT** (SHA's choice) via the adapter — unchanged.
- Determinism for the engine is absolute; the LLM explains today's sky, never rewrites the reading/protocol. Compliance gates (probabilistic framing, crisis, disclaimer, no diagnosis/prediction-as-fact) wrap every answer. No new `any`.

## AFTER
`tsc` 0 → `npm run build` ✓ → verify P.6 (lead with SHA's exact test: "what are the current transits?") → `rm -rf .next` → `vercel --prod --yes` → append "Part P — Live Transits & Full Astrology Scope (full sky package from astronomy-engine → Astryx context; scope widened to mundane/medical/frequency; fork-of-the-day)" to `FIXES_COMPLETE_v3.md`.
