# ASTRYX — Directive P+Q: Astryx Intelligence Upgrade (Live Sky + Expanded Scope)
### Claude Code handoff · 2026-06-28 · ONE pass — supersedes the separate Directive P and Directive Q
**Read with:** `ASTRYX_DIRECTIVE_L_ASTRYX_INTELLIGENCE.md` (knowledge tiers + L.7 data-min + L.8 web stub), `lib/ephemeris.ts` (`calculateTransits`), `lib/dailyTemperature.ts`, `lib/dailyElement.ts`, `lib/teacher/grounding.ts` (`SYSTEM_INSTRUCTION` + `buildContextBlock`), `lib/astryx/persona.ts`, `lib/astryx/modelAdapter.ts`, `lib/astryx/webSources.ts`, `data/signs.json` + `data/medicalAstrology.json`, the live Astryx route, `COMPLIANCE.md`.

> **Use this file instead of Directive P and Directive Q** — it merges both (they touch the same grounding/context/route/persona files, so run them together in one deploy).
>
> **Two problems from SHA's live testing, one upgrade:**
> 1. **Blind to today's sky.** Asked for current transits, Astryx gave ONE aspect then said she can't access current positions. (An LLM can't know today's sky — but the app computes it and only feeds her the single headline transit.)
> 2. **Caged to the canon.** Asked "does Mercury rule the shoulders?" she said NO (wrong — Gemini/Mercury rules shoulders/arms/hands/fingers); asked which fork for shoulders she rambled about Mars. Directive L fenced her too hard ("canon is the only authority"). SHA wants her to operate **beyond the libraries** — full mundane/medical/frequency astrology — and to **go deep**.
>
> **Model stays OpenAI/GPT** (SHA's choice). **Citations stay on-request only** — do NOT reinstate the per-answer source scroll (already removed). Frugal: today's sky comes from `astronomy-engine` (already installed) — no external ephemeris API.
>
> **Gating:** `npx tsc --noEmit` → 0 · `npm run build` ✓ · verify §C · `rm -rf .next` → `vercel --prod --yes` · append "Part P+Q — Astryx Live Sky & Expanded Scope" to `FIXES_COMPLETE_v3.md`. Compliance intact; the LLM still never recomputes the deterministic reading.

---

# PART A — LIVE SKY (today's transits)

## A.1 — Build the full "today's sky" package (FOUNDATION)
**Where:** new `lib/astryx/transitContext.ts` (server-only), composing the EXISTING engines.
`buildTransitContext(natalChart?, date = new Date())` returns a compact, model-ready object:
- **Today's sky (always, even with no natal chart):** current sign + degree of **all ten planets** for `date` (same `astronomy-engine` calls `ephemeris.ts` uses; add a positions-only helper if needed — NO external API).
- **Transit→natal aspects (when a chart exists):** the FULL list from `calculateTransits(natalChart, date)`, not just the headline.
- **Temperature + element:** from `computeDailyTemperature` / the daily-element engine (Cool/Warm/Hot + heaviest element).
- **Suggested fork(s) for today:** the dashboard's existing daily fork suggestion (headline-transit planet → `forkFor`), plus its counterweight if the headline is overstimulating (never-amplify).
- Deterministic: same date + chart → identical package.

## A.2 — Inject the full package into Astryx's grounding
**Where:** the Astryx route + `buildContextBlock`. Replace the single-`headlineTransit` context with a labeled block:
```
TODAY'S SKY (date): Sun 12° Cancer · Moon 3° Scorpio · Mercury 28° Gemini · … (all 10)
TRANSIT → NATAL: tMoon square nSun; tSaturn trine nVenus; … (full list)
TEMPERATURE: Warm · heaviest element: Water
SUGGESTED FORK: Mercury (clarify) — counterweight to tMoon–nSun friction
```
Honor **L.7 data-minimization** — sky/aspects/fork are fine; never send raw birth time/location/account/payment (only derived positions).

## A.3 — Fork(s) for the day + no-chart case
- "Which fork today?" → name the best fork(s) for today's sky, explain why (headline contact + counterweight) + the **5-sense angle** (day's element → scent/taste/color/breath from canon).
- No natal chart yet → still answer the **current sky in mundane terms** + general astrology; invite a calibration for the personalized transit-to-natal read + fork-of-day. Never a hard refusal.

---

# PART B — EXPANDED SCOPE (canon as anchor, not cage)

## B.1 — Rebalance the knowledge hierarchy (the core change)
**Where:** `SYSTEM_INSTRUCTION` / tier rules in `grounding.ts` + `persona.ts`. Replace the "canon is the only authority" framing with:
- **Astryx is a fully knowledgeable astrologer** — she uses her complete established astrological + medical-astrology knowledge **freely** (mundane, natal, medical, frequency). She does **not** deny a well-known correspondence (e.g. Mercury/Gemini → shoulders, arms, hands, fingers) because the canon is silent. **Build on the canon; never be caged by it.**
- **Canon remains AUTHORITATIVE for the proprietary specifics** — Cousto fork Hz, the Lotus Spectrum, the exact 5-sense protocol logic, the cell-salt/botanical/crystal mappings she ships. For these, canon wins.
- **Canon silent/thinner than established astrology → use established knowledge** and say so ("classically, Mercury also governs the shoulders…"). Contested/fringe vs canon → prefer canon. Never present speculation as fact.
- Keep determinism (explain, don't recompute) and ALL compliance gates (probabilistic, no diagnosis, no prediction-as-fact, defer health decisions to the practitioner). Wider knowledge, same safety.

## B.2 — Body-part → fork reasoning chain
**Where:** route guidance / `SYSTEM_INSTRUCTION`. For "which fork for [body part/region/symptom]?":
1. body part → ruling **sign(s)**, 2. sign → ruling **planet**, 3. planet → **its fork** (Cousto Hz from canon), 4. if that planet is **overstimulated** for the user → lead with its **counterweight**, else the planet itself.
Correct target: *shoulders → Gemini → Mercury → Mercury fork.* No more "my Mars is placed, use the opposite."

## B.3 — Enrich body-rulership data (targeted)
**Where:** `data/signs.json` / `data/medicalAstrology.json`. Audit sign→body-region + planet→body-region for completeness — e.g. **Gemini = shoulders, arms, hands, fingers, lungs, nervous system**; verify the other 11 vs standard medical astrology (the engine uses these for placement/scoring, so they must be correct independent of B.1).

## B.4 — Credible online sources (curated web tier)
**Where:** activate `lib/astryx/webSources.ts` (L.8 stub) + `ASTRYX_WEB_ENABLED=true`. Allowlist (SHA-confirmed): **PubMed/NIH/.gov/.edu** (physiology), a **live ephemeris / sky source**, **established astrology/herbal references**. Use for **currency + citable depth** on top of un-fenced knowledge. Fenced + compliant; **allowlist only** — never the open web (its astrology content is unreliable). With the flag off she still answers from knowledge + canon.

## B.5 — Capable model + citations on request
- **Model (Where: `modelAdapter.ts`):** point the OpenAI provider at a **GPT-4-class** model (not the cheapest `mini`) so she goes deep; keep it in one config constant. *Note for SHA (not code): the app bills OpenAI **API** tokens via the API key — separate from the $20 ChatGPT **Plus** sub, which does not grant API access. A capable model is pennies per chat.*
- **Citations (Where: route/format):** do **NOT** reinstate the per-answer source scroll. Brief inline attribution when natural; full references **only when asked** ("want my sources?").

---

# §C — ACCEPTANCE TEST (SHA's exact cases)
1. **"What are the current transits?"** → today's planetary positions (multiple) + key aspects to natal + temperature + suggested fork. **Never** "I can't access current positions."
2. **"Which fork is best for me today?"** → a specific fork, reasoned from today's sky + a 5-sense note.
3. **"Does Mercury rule the shoulders?"** → **Yes** — Gemini/Mercury governs shoulders, arms, hands, fingers (confident, not a denial).
4. **"Which fork for my shoulders?"** → Mercury fork, via shoulders→Gemini→Mercury (counterweight only if Mercury overstimulated for that user).
5. **A deep / beyond-canon astrology question** → substantive answer, not "that's not in my library."
6. **No auto-citation scroll**; references appear only when asked.
7. **Determinism** (same day+chart → same sky package) and **compliance** (probabilistic, no diagnosis/prediction-as-fact, practitioner deferral; canon authoritative for Hz/Lotus/protocol) intact.

## GLOBAL RULES
Frugal/sovereign: reuse `astronomy-engine` (no external ephemeris API); web = allowlist only; only question + derived context leave to the model (L.7). Model = OpenAI/GPT capable tier. Engine determinism absolute; Astryx explains, never recomputes. No new `any`.

## AFTER
`tsc` 0 → `npm run build` ✓ → verify §C (lead with "what are the current transits?" and "does Mercury rule the shoulders?") → `rm -rf .next` → `vercel --prod --yes` → append "Part P+Q — Astryx Live Sky & Expanded Scope" to `FIXES_COMPLETE_v3.md`.
