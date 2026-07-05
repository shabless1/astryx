# ASTRYX — SECURITY AUDIT (Directive v1.1 · Phase 0)
**Date:** 2026-07-04 · **Baseline commit:** `559cc9d` · **Auditor:** Claude (developer)
**Method:** source import-chain tracing (5 parallel passes) + empirical grep of the built client bundle (`.next/static`) + git-history/`.gitignore` checks + golden determinism suite.

> **Headline:** The app is in **far better security shape than the directive assumed.** FIX 2 (auth + persistence) is **already fully built**. Most of FIX 3 (Shopify webhook + entitlement) and FIX 4 (secrets server-only, compliance server-enforced) are **already done**. **The one large real exposure is FIX 1:** the deterministic engine and ~45 of 47 data files still ship to the browser. The canon corpus (`astryxCanon.json`) is already server-only.

---

## DETERMINISM BASELINE (the pass condition for every FIX 1 change)
- Golden suite at `559cc9d`: **20 tests pass** across `engine.golden`, `chakra.golden`, `fullbody.golden`, `actions.golden`.
- Snapshot files (the byte-identical reference): `tests/__snapshots__/{engine,chakra,fullbody,actions}.golden.test.ts.snap`.
- **FIX 1 pass rule:** after relocation, this suite must remain byte-identical (20/20, no snapshot diff). Any snapshot change = logic was altered = revert and relocate only.

---

## ITEM 1 — ENGINE LOCATION & CLIENT EXPOSURE  → **EXPOSED (critical)**

`runEngine()` and every sub-engine execute **client-side**. Proven both by source import-tracing and by grepping the built bundle (`.next/static` contains `"base of the spine"`, `"boneApplicationPoint"`, `"signalHierarchy"`, and distinctive prose from `medicalAstrology`/`remedyPolarity`/`signBodyZones`).

| Engine / sub-engine | File | Client-exposed? | Proof (import chain) |
|---|---|---|---|
| `runEngine` (orchestrator + 5 sensory builders, SOAP, signal hierarchy) | `src/lib/engine.ts` | **YES** | `src/app/page.tsx` (`'use client'`, line 6) imports & calls `runEngine` at line 431 |
| RemedyPolarityEngine | `src/lib/RemedyPolarityEngine.ts` | **YES** | called by `runEngine` → transitively via page.tsx |
| ReflexEngine | `src/lib/ReflexEngine.ts` | **YES** | `runEngine` + `SessionScreen.tsx` (line 38) import directly |
| bodyZoneResolver | `src/lib/bodyZoneResolver.ts` | **YES** | imported by `runEngine` (line 40) |
| BodyPlacementEngine | `src/lib/BodyPlacementEngine.ts` | **YES** | `SessionScreen.tsx` (line 47), `ReflexEngine` |
| NarrativeSignalParser | `src/lib/NarrativeSignalParser.ts` | **YES** | called by `runEngine` |
| Fork builders (`buildForkSequence`, `buildChakraSequence`, `buildFullSpectrumSequence`, `buildFullBodySequence`, `forkSequenceDisplay`) | `src/lib/chamber/forkRite.ts` | **YES** | `ResultsScreen.tsx` (line 42) + `SessionScreen.tsx` (line 52) import & call directly |
| ChamberDNAEngine | `src/lib/chamber/ChamberDNAEngine.ts` | **YES** | `ResultsScreen.tsx` (line 38) |
| 5 sensory builders (sound/scent/taste/body/sight) | inside `engine.ts` (not exported) | **YES** | bundled with `runEngine` |
| Natal chart calc (ephemeris) | `src/app/api/chart/route.ts` | **NO — server** ✓ | already server-only via `/api/chart` |

**Nuance for the fix:** `engine.ts` also exports small **client-safe utilities** used by **14 client files**: `PLANET_COLORS`, `freshTransitInterpretation`, `feltStateLanguage`, `geocodeLocation`, `getAccentColor`. So `engine.ts` must be **SPLIT** (heavy compute + data → server-only; small presentational utils → a client-safe module), not merely moved. This is relocation, not logic change.

---

## ITEM 2 — DATA CORPUS  → **~45 of 47 files EXPOSED; canon PROTECTED**

**(a) `src/data/*` domain JSON (46 files incl. `bodySystems/` subdir): ~45 CLIENT-BUNDLED.**
Because `engine.ts` (client-reachable) statically imports the whole domain library, essentially every domain JSON ships to the browser, including the proprietary model files:

| Proprietary file | Imported by | Exposed? |
|---|---|---|
| `medicalAstrology.json` | `engine.ts` | **YES** |
| `remedyPolarity.json` | `RemedyPolarityEngine.ts` | **YES** |
| `signBodyZones.json` | `bodyZoneResolver.ts` | **YES** |
| `qualityLexicon.json` | `bodyZoneResolver.ts` | **YES** |
| `signPolarities.json` | `ReflexEngine.ts` | **YES** |
| `sign-modulation.json` | `SignModulationEngine.ts` | **YES** |
| planets/aspects/signs/houses/geometry/soap-templates/scents/herbs/body-protocols/planetary-anchors/symptoms/sacredBotanicals/crystalsExpanded/lotusSpectrum/starterKits/sacredTones_nervousSystem/cellSalts/solfeggio-overlays/planet-intake-map | `engine.ts` + various client screens | **YES** |
| `bodySystems/*.json` (11) | `BodySystemPreviewScreen.tsx` | **YES** |

**(b) `astryxCanon.json` (577 KB generated corpus): SERVER-ONLY ✓.**
- Imported only by `src/lib/astryx/canon.ts`, which has a hard runtime guard (verified):
  `if (typeof window !== 'undefined') throw new Error('astryx/canon.ts is server-only …')` (canon.ts:10–11).
- Consumed only by `/api/astryx/route.ts`. **Confirmed not in the client bundle.**
- `catalogManifest.json` is also server-only (`/api/catalog`).

**Note:** `planetTreatmentChannels.json` (named in the directive) does **not exist as a live imported file** — the string only appears inside `astryxCanon.json` content. No action needed beyond noting it.

**`/public`:** no data/canon JSON served from `/public`. ✓

---

## ITEM 3 — AUTH STATE  → **DB-PERSISTED (FIX 2 already done)** ✓
- **Not** in-memory. `DEMO_USERS` was removed in Directive v4.0. `src/lib/auth.ts` uses `PrismaAdapter(prisma)` → Supabase Postgres (`User`/`Account`/`Session` models in `prisma/schema.prisma`).
- Providers: **Credentials** (bcrypt `passwordHash`) **and Google OAuth** (conditional on `GOOGLE_CLIENT_ID/SECRET`).
- Session: JWT strategy; `entitled`/`isPremium` stamped in the token at sign-in. Survives reload/device-switch via the session cookie.
- **Decision (per directive "decide & document"):** keep **both** Credentials + Google for beta (Credentials already works with no OAuth setup; removing it would reduce access with no security gain since both are DB-backed).

## ITEM 4 — READINGS PERSISTENCE  → **Postgres source-of-truth + localStorage cache** ✓
- Server: `Reading` + `ChamberSession` tables (`prisma/schema.prisma`), written via `/api/readings` (POST) and `/api/sessions`, read via `/api/readings/latest` — all `getServerSession()`-guarded, filtered by `userId`.
- Client: Zustand persisted to `localStorage` key `astryx-storage` as a **cache**; `page.tsx` rehydrates from `/api/readings/latest` on a fresh device. Device-switch verified by design.

## ITEM 5 — ENTITLEMENT  → **SERVER-VERIFIED (FIX 3 core already done)** ✓
- `src/lib/entitlement.ts::hasEntitlement(email)` checks `BETA_ALLOWLIST` env + the `Entitlement` table (`status='active'`), server-side. Stamped into the JWT at sign-in; the client `entitled` flag is derived from the signed token, not user-settable.
- **Gap (FIX 3):** entitlement is a **boolean** today. The directive wants **roles** `seeker` / `calibrated` / (reserved) `practitioner`. And there is **no per-request server gate on engine output** because the engine runs client-side — that gate only becomes meaningful once FIX 1 creates the engine API.

## ITEM 6 — SECRETS  → **No leaks; one hardcoded fallback to fix**
**(a) Real secrets — all server-only, none committed, none in bundle:**
`DATABASE_URL`, `DIRECT_URL` (Supabase), `NEXTAUTH_SECRET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (+ `OPENAI_TTS_MODEL`, `OPENAI_EMBED_MODEL`), `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `SHOPIFY_WEBHOOK_SECRET`.
- `.env` / `.env.local` are **git-ignored and NOT tracked** (only `.env.example` is tracked). No secrets in git history. **Bundle grep for `sk-`, `sk-ant`, `AIzaSy`, `whsec_`, `postgres://` → zero matches.** ✓
- **FINDING (fix in FIX 4):** `src/lib/auth.ts:51` — `secret: process.env.NEXTAUTH_SECRET || 'astryx-dev-secret-change-in-production'`. A hardcoded fallback must never be reachable in production → make it throw when `NODE_ENV==='production'`.

**(b) Intentionally public `NEXT_PUBLIC_*` (verified non-sensitive):** `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_XRP_ADDRESS`, `NEXT_PUBLIC_AUDIO_BASE_URL` (R2 CDN), `NEXT_PUBLIC_FORK_SHOP_URL`, `NEXT_PUBLIC_SHOP_LIVE`, `NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE`, `NEXT_PUBLIC_SUBSCRIBE_URL`. Nothing sensitive is mislabeled `NEXT_PUBLIC_`. ✓

**SHA action (I cannot do this — external dashboards):** per the directive's "assume every key is compromised, rotate all," rotate on the provider side: Supabase DB password, `NEXTAUTH_SECRET`, OpenAI, Gemini, Anthropic, Google OAuth secret, and `SHOPIFY_WEBHOOK_SECRET`, then update Vercel env. Rotation is the reliable fix (no git-history rewrite needed — nothing sensitive was ever committed).

## ITEM 7 — COMPLIANCE ENFORCEMENT  → **SERVER-ENFORCED (FIX 4 already done)** ✓
`src/lib/compliance.ts` guards run **server-side in the response path** of `/api/astryx` and `/api/teach`:
- **Crisis gate** (`detectCrisis`) on the **incoming** message before any model call (astryx route ~L155, teach route ~L86).
- **Banned-phrase lint** (`lintForBannedPhrases`/`teacherLint`) on the **outgoing** LLM reply → regenerate-once-stricter → `SAFE_FALLBACK` (astryx ~L255).
- **Disclaimer** injected server-side (`MICRO_DISCLAIMER` in every response) and rendered on every client footer + PDF.
- Build-time `scripts/lint-data-copy.mjs` blocks banned phrases in static `src/data` copy.
- A direct API call **cannot bypass** these. The offline "sovereign" brain also enforces the same guards.

---

## REMEDIATION PLAN (reframed to actual state)

| Fix | Directive assumption | Actual state | Remaining work |
|---|---|---|---|
| **FIX 1 — engine + data server-side** | client-side | **client-side (confirmed)** | **THE work.** Split `engine.ts`; stand up authenticated `/api/protocol` (+ move fork/placement compute server-side); client fetches computed output only. Preserve determinism. |
| **FIX 2 — auth + persistence** | in-memory / localStorage | **DONE** (Prisma+Supabase, readings persisted) | Verify + document only. |
| **FIX 3 — entitlement + abuse** | manual/client | webhook + server entitlement **DONE**; metering partial | Add durable **rate-limiting** on the new engine route + chat; add **tier roles** (`seeker`/`calibrated`/reserved `practitioner`) to the Entitlement model + `hasEntitlement`; enforce entitlement **per-request** on the engine route. |
| **FIX 4 — secrets / determinism / compliance** | leaky/client | secrets clean; compliance **server-enforced DONE**; determinism lint present | Fix `NEXTAUTH_SECRET` fallback (done in this pass); **SHA rotates keys**; keep `lint:determinism`. |

**Chosen FIX 1 staging (relocate, never refactor):**
1. **1A — Protocol engine → `POST /api/protocol`** (highest IP value, most contained): split `engine.ts` into `engine.server.ts` (compute + all domain data, `import 'server-only'`) and `engineClient.ts` (the 5 presentational utils the 14 client files need). `page.tsx` fetches `/api/protocol` instead of calling `runEngine`. Removes `medicalAstrology`/`remedyPolarity`/`signBodyZones`/`qualityLexicon`/the sensory builders/etc. from the browser.
2. **1B — Fork/chamber + placement compute → server** (`build*Sequence`, `resolveForkPlacement`, `chakraCenterPlacement`, `reflexPointsFor`): these run reactively in `SessionScreen`/`ResultsScreen`; relocate to a `/api/session-plan` route returning the computed step-list/placements. Higher UI-rewiring effort; lower core-IP value than 1A.
3. Re-grep bundle to prove zero engine/data matches; re-run golden suite for byte-identical determinism; then FIX 3 rate-limit/tiers on the new routes.

**Verification gates for every FIX 1 step:** `npm run build` (0 TS errors) · golden suite byte-identical (20/20) · bundle grep `"base of the spine"`/`"excessive stimulation"`/`medicalAstrology` prose → **0 matches** · `lint:determinism` clean.

---

## FIX 3 — ABUSE CONTROLS (rate limiting) · IMPLEMENTED

**Named residual risk (accepted):** because the engine is deterministic, the API is an input→output **oracle** — a logged-in or guest caller could script it to reconstruct the model from pairs without ever seeing the code. FIX 1 relocated the code/data off the client; this **raises the cost** of scraping and makes heavy volume visible — it does **not** eliminate it.

**Mechanism (`src/lib/rateLimit.ts`):** in-memory fixed-window burst limiter, keyed per caller (`user:<id>` when signed in, else `ip:<x-forwarded-for>`). Fails **open** on any internal error (a limiter bug can never lock out legitimate users). Heavy volume is `console.warn`-logged (visible in Vercel logs). Same backstop pattern as the existing chat/teach daily metering. Per-serverless-instance (resets on cold start) — a durable Postgres-backed limiter is a future hardening if abuse is observed.

**Chosen limits (per caller):**
| Route | Limit | Window | Layered with |
|---|---|---|---|
| `POST /api/protocol` (engine oracle) | 20 | 5 min | — (was fully open) |
| `POST /api/astryx` (chat) | 15 | 60 s (burst) | existing 20/day individual metering |
| `POST /api/teach` (teacher) | 15 | 60 s (burst) | existing 10/day individual metering |

Over-limit → HTTP **429** + `Retry-After`. Generous for humans (a reading/question is occasional); tight enough to throttle scripted extraction. **Verified live:** 21st rapid `/api/protocol` call returns 429.

**Tier roles (seeker/calibrated/practitioner):** intentionally deferred (SHA — "skip payment tiers for now"). Entitlement stays the existing server-verified boolean (`hasEntitlement`). Not a blocker for the abuse-control goal.

*Proprietary — keep inside the project + MAHMAH_ECOSYSTEM relay only.*
