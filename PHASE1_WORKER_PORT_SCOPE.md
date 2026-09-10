# Phase 1.2 — Porting the Calibration Core to a Cloudflare Worker · Scoping Spec
**Scoped:** 2026-09-09 (read-only audit of the deterministic core) · **Verdict:** very portable — the core is ~95% already severed from the app. **Effort: M–L (~1 week clean + tested).** Bundle ~200 KB gzip (2% of the 10 MB Worker budget). CPU: single-digit ms per calibration.
**Parent:** `ASTRYX_POSITIONING_ROADMAP_v1.md` (Phase 1.2–1.6)

## 1. What the core is
- `src/lib/engine.ts` (2,271 L) — crown jewel: signal hierarchy → polarity → 6-sense protocol.
- `src/lib/chamber/forkRite.ts` (640 L) + `durationPresets.ts` — session composition (never-amplify, ladder, chakra). Currently CLIENT-side only.
- `src/lib/ephemeris.ts` (753 L, `astronomy-engine`) + `timezone.ts` (`tz-lookup` + Intl) + `dailyTemperature.ts`.
- Helpers (move as-is): `RemedyPolarityEngine`, `NarrativeSignalParser`, `bodyZoneResolver`, `BodyPlacementEngine`, `bodyMapPlacement`, `ReflexEngine`, `forkClass`, `intentionMap`, `cellSaltKeynotes`, `signalCopy`, `engineClient`, `types/index.ts`, `legal/copy.ts`.
- **22 data JSONs, 282 KB raw** (medicalAstrology 78 KB, cellSalts 55 KB, remedyPolarity 33 KB …). NOT needed: astryxCanon (577 KB), appKnowledge, catalogManifest, bodySystems/*, delineations/*.
- **npm deps on the path: exactly two.** `astronomy-engine` 2.1.19 (true ESM, zero Node builtins, zero clock/random — Worker-safe) and `tz-lookup` 6.1.25 (CJS, zero builtins — needs interop, see risks).
- **Zero** React / zustand / Prisma / NextAuth / `fs` / `Math.random` / `Date.now` on the core path. The determinism ESLint gate already enforces this.

## 2. Blockers to fix in the port (all small)
| Where | Problem | Fix |
|---|---|---|
| `engine.ts:914-950` `fetchChart()` | **The engine makes an HTTP call to its own `/api/chart`** (+ `process.env.NEXTAUTH_URL/VERCEL_URL`). The only real architectural coupling. | Delete; replace with a direct in-process `computeChart()` call. |
| `api/chart/route.ts:41-243` | Chart logic lives inside the Next route handler. | Extract `buildSolarChart`, `calculateSymptomBoost`, `validateRequest`, and the handler body → pure `core/chart.ts` `computeChart(input, asOf)`. **Biggest new-code item.** |
| `cellSaltKeynotes.ts:190-193` | Module-level `process.env.NODE_ENV` — **throws ReferenceError at import in a Worker** (kills the isolate). | Delete or guard with `typeof process !== 'undefined'`. |
| `ephemeris.ts:597, 667` · `dailyTemperature.ts:147` · `timezone.ts:47` | `= new Date()` default params. | Make the date argument required. |
| `timezone.ts:20` | `await import('tz-lookup')` + `mod.default \|\| mod` — CJS/ESM interop can silently resolve to the namespace → lookup throws → caught → **every chart gets UTC offset 0 with no error**. | Static import + an assertion that a known coordinate returns a non-UTC zone. |
| `engine.ts:62-64` | `window` tripwire. | Harmless in a Worker; delete for clarity. |
| `engine.ts:956` | `fallbackPattern` uses local-time getters on a UTC date. | Switch to `getUTC*`. |

## 3. THE determinism contract: `asOf` must be explicit
**Finding:** "today" is derived internally — `calculateTransits(chart, new Date())` at `chart/route.ts:222`, plus the default params above, plus `calculatedAt`/`transitDate` stamped with `new Date()` (`chart/route.ts:232,234`). Today's date silently participates in the signal hierarchy → polarity → protocol → fork composition. The existing golden suite hides this by stubbing `fetch` with frozen chart fixtures (captured 2026-07-01) — determinism is verified *given a pinned chart*, not end-to-end from birth data.
This is BY DESIGN for the app (the calibration changes with the sky) but it is a hazard for an API contract.
**Required:** every Worker endpoint takes an explicit `asOf` ISO-8601 instant, threaded `computeChart(..., asOf)` → `calculateTransits(chart, asOf)` → `computeDailyTemperature(chart, asOf)`. Default it to request time **in the HTTP handler only, never in the engine.** Every response carries `{ standardVersion, engineVersion, dataVersion, asOf }` so goldens are pinnable. For Worker↔app parity runs, add a temporary `X-Astryx-AsOf` debug header to the Next app's `/api/chart`.

**Contract (Standard §8):**
```
POST /v1/calibrate    { birthDate, birthTime?, latitude, longitude, tzOffset?, solarChart?, asOf, intake? }
POST /v1/fork-map     { planet, chart? }
POST /v1/sky-today    { natalChart | birth inputs, asOf }
```
Guarantee: (all inputs incl. asOf) → byte-identical output.

## 4. Port plan
- **Move as-is (S, ~3,800 L, zero logic edits — only the `@/` alias):** types, signalCopy, engineClient, bodyMapPlacement, forkClass, BodyPlacementEngine, RemedyPolarityEngine, NarrativeSignalParser, bodyZoneResolver, ReflexEngine, intentionMap, durationPresets, forkRite, legal/copy.
- **Shim (S–M):** cellSaltKeynotes (guard), ephemeris/dailyTemperature/timezone (required dates, static tz import), engine.ts (~60 lines: drop fetchChart + tripwire, add asOf, getUTC*).
- **New (M):** `core/chart.ts` (`computeChart`), `worker/index.ts` (router, auth, CORS, envelopes), metering (Durable Object / KV — the app's in-memory `rateLimit.ts` Map does NOT work across isolates), **compliance envelope** (§6).
- **Do not port:** the two `route.ts` wrappers, auth/consent/db/rateLimit/chartHash, `solarChart.ts` (DEAD code — zero importers; the live impl is inline in chart/route.ts), all components/store/soundEngine/pdf/astryx LLM layer.
- **Layout:** `src/core/*` = the SEALED core (no I/O, no globals, no clock) · `src/http/*` · `src/compliance/*` · `src/data/*` (22 JSONs) · `test/golden/*` = copy `tests/__snapshots__` + `tests/fixtures` verbatim — if the Worker reproduces the existing `.snap` files byte-for-byte, protocol-layer parity is proven for free.

## 5. Parity risks (golden-test blockers), ranked
1. **Intl/ICU timezone divergence (HIGHEST).** `timezone.ts:74-75` derives UTC offsets by string round-trip of `toLocaleString('en-US',{timeZone})`. ICU versions differ between Vercel Node and workerd. A 1-hour offset error moves the Ascendant ~15° → whole-sign house flip → different dominant pattern → entirely different protocol. Mitigate: a 200-tuple (lat, lon, birthDate) parity suite spanning DST edges + historical zone changes; consider `Intl.DateTimeFormat(...,{timeZoneName:'longOffset'})` or a pinned offset table.
2. `asOf` itself is a parity break until the app is pinned the same way (debug header above).
3. Float rounding boundaries (`.toFixed` at ephemeris 381-386/401-406/430/604-606) — low probability, catastrophic (sign flip). Same 200-tuple suite covers it.
4. Object key-insertion order drives `JSON.stringify` output (`PLANET_BODIES` iteration) — **any reorder of `PLANET_BODIES` silently breaks every golden.** Document as an invariant.
5. tz-lookup interop silent-UTC failure (§2).
6. **Dual `/api/chart` call:** `page.tsx` calls it WITH `solarChart: birthTimeUnknown`; `runEngine`'s internal fetch calls it WITHOUT → the displayed chart and the protocol-driving chart can differ for the same user, and **the protocol never honors "birth time unknown"** (always natal with a noon default). Decide semantics before freezing goldens — this is also a latent APP bug.

## 6. Compliance is NOT on the engine path — the API must enforce it itself
`engine.ts` imports nothing from `compliance.ts`; disclaimers, `lintForBannedPhrases`, `detectCrisis`, and tier gating (`safePhrase`/`requiresVerifiedTier`) all live in the React screens + `/api/astryx`. A Worker returning raw `ProtocolOutput` ships **no disclaimer, no lint, no crisis detection.** Per `COMPLIANCE.md` this is a first-class **M** work item: run `detectCrisis` on inbound free text before computing; lint outbound prose in CI; attach `FULL_DISCLAIMER`/`MICRO_DISCLAIMER` to every envelope; contractually require licensees to display it. Without it we'd be licensing an unlabeled medical-adjacent oracle.

## 7. IP containment — the crown jewels and a LIVE leak
**Crown jewels (never return raw), ranked:** `remedyPolarity.json` (#1 — the Planet≠Remedy corrective mapping; dumping it reproduces the intelligence layer), `medicalAstrology.json`, `cellSalts.json`, `sacredTones_nervousSystem.json` (**the spec sheet for a physical product SHA manufactures**), `lotusSpectrum.json` (CLAUDE.md Rule 5), `sacredBotanicals.json` + `crystalsExpanded.json`, and the routing vocabularies (`symptoms`, `qualityLexicon`, `signBodyZones`, `signPolarities`).
**LIVE finding:** `ProtocolOutput.sacredLayer` (`types/index.ts:400-406`) returns whole `SacredBotanical`, `CrystalExpanded`, `LotusEntry[]`, `SacredFork`, `StarterKit` records **verbatim** — today, via the app's own `/api/protocol`, to any authenticated user. Enumerating planets over ~10 requests dumps the entire sacred layer. This is Security FIX 1 made concrete and it predates the Worker.
**Containment:** return computed, prose-shaped output only; gate `sacredLayer`/`diagnostic`/`polarityResults` behind higher tiers and return display fields only; never expose "slug/planet → record" lookups; tiered response shaping (basic = `soap`, `reasoningTrace.whyThisSequence`, `plan`; higher = polarity/diagnostic/sacred display fields); enumeration anomaly detection on top of quotas; keep `tests/fixtures/chart-*.json` + the engine `.snap` OUT of any public repo (three complete worked examples of the model).

## 8. Product decisions this raises (owner)
1. **API tiering** — what the basic (cheap) call returns vs. what a premium call unlocks. Recommendation: basic = the interpreted protocol + session sequence (what a person sees); premium = polarity detail + diagnostic + sacred-layer display fields. Raw records: never.
2. **The app's own leak** — should `/api/protocol` stop returning raw `sacredLayer` records to logged-in users now (response shaping), given the Results screen consumes them? Recommendation: yes — ship display fields only; the screen needs no change if the shaped fields are the ones it renders.
3. **Solar-chart semantics** — the protocol should honor "birth time unknown" (pass `solarChart` through `runEngine`). Behavior change → goldens regen. Recommendation: fix it as part of the port.

## 9. Execution order for the port
1. App-side hygiene that is safe now: cellSaltKeynotes guard; required-date signatures; static tz import + assertion.
2. Scaffold the Worker repo (`astryx-core-worker`), copy the sealed core, bundle the 22 JSONs, copy goldens.
3. Extract `computeChart`; thread `asOf`; delete `fetchChart`.
4. Golden parity: existing `.snap` files must reproduce byte-for-byte. Then the 200-tuple timezone/rounding suite.
5. Compliance envelope + crisis gate.
6. Response shaping (tiering) per SHA's call.
7. HTTP layer: router, API keys, Durable-Object metering, then the x402 door (`x402-hono`) + MCP `paidTool`s + Bazaar listing (Phase 1.3–1.5).

*Proprietary — House of MahMah Tea LLC. Repo-only.*
