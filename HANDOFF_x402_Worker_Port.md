# ASTRYX — Handoff: the x402 door · Worker port · MCP · Bazaar (Roadmap Phase 1.2–1.6)
### For a dedicated Claude Code session. Written 2026-09-12. Status: **NOT STARTED** (scoped only).

> Parent docs (read in this order): `ASTRYX_POSITIONING_ROADMAP_v1.md` (§3 Phase 1, §4 marketing lane) → `PHASE1_WORKER_PORT_SCOPE.md` (the full technical scope, still accurate) → `ASTRYX_CALIBRATION_STANDARD_v0.md` §8 (the machine contract, live at myastryx.com/standard) → this file.
> Verified 2026-09-12: no commit since the scoping docs (9c8f9ab, 20c32c5) touches x402, the Worker, MCP, or the Bazaar. No `astryx-core-worker` directory exists. The lane is open.

---

## 1. What x402 is, in one paragraph (so the session can explain it back to SHA)
x402 is an open payment protocol (started by Coinbase, adopted by Cloudflare and others) that revives the unused HTTP status code **402 Payment Required**. A server answers a request with 402 and a price; the caller, usually a software agent, pays in **USDC on the Base network** in the same HTTP exchange and gets the answer. No accounts, no API keys, no invoices, fractions of a cent per call. It is the rail that lets **machines buy a single answer from Astryx**: an agent asks "calibrate this birth data as of this date," pays ~$0.05, receives the 6-Sense Protocol. This is SHA's Uranus-in-Gemini window: the esoteric/wellness-interpretation lane in the agent economy is empty, and the first credible, deterministic, published-Standard provider becomes the default answer. **Human payments stay Shopify-only. x402 is the separate machine channel.** SHA never holds a private key in this system: the receiving wallet is a public address set as a Worker env var.

## 2. Why the Worker port comes first
The engine (`src/lib/engine.ts` + 22 data JSONs) ships to the browser today (Security FIX 1). The x402 door needs the engine **server-side, sealed, deterministic, and metered**. Porting the core to a Cloudflare Worker closes FIX 1 and creates the surface the door, the MCP server, and the Bazaar listing all sit on. The app can consume the same Worker later.

## 3. What is already done (do not redo)
| Item | Done | Where |
|---|---|---|
| Standard v0 published (§8 = machine contract; asOf; capabilities `calibrate`, `fork-map`, `sky-today`) | ✅ 09-10 | myastryx.com/standard · `ASTRYX_CALIBRATION_STANDARD_v0.md` |
| Owner decision 1 — API tiering | ✅ **basic** = interpreted protocol + session sequence; premium = polarity/diagnostic/sacred display fields; raw records never | roadmap; `src/lib/sacredShape.ts` is the shaping seam |
| Owner decision 2 — the app's live sacredLayer leak | ✅ contained at `/api/protocol` (1e68aa9); second leak (`prescriptions[]` unshaped copy) closed 9576ecf | `src/lib/sacredShape.ts`, `src/app/api/protocol/route.ts` |
| Owner decision 3 — solar-chart semantics | ✅ `runEngine(intake, coords, { solarChart })` threaded (1e68aa9) | `src/lib/engine.ts` |
| `cellSaltKeynotes` `process.env` guard (Worker-safe) | ✅ | `src/lib/cellSaltKeynotes.ts` |
| Outcome capture (0.2) — the flywheel the API later feeds | ✅ live | `ChamberSession` columns, `src/lib/outcomeCapture.ts` |
| Practitioner tier in the money path (P0) | ✅ live 09-10 | `src/lib/entitlement.ts`, Shopify SKU |
| Uranus / Neptune re-aligned to the engraved forks (207.33 / 211.45) | ✅ 144339f | data + goldens — **copy the CURRENT `tests/__snapshots__` + `tests/fixtures`, not the 07-01 set** |

## 4. What remains (the build)
Follow `PHASE1_WORKER_PORT_SCOPE.md` §9 exactly; the remaining steps are:
1. **App-side hygiene still open:** required-date signatures in `ephemeris.ts` / `dailyTemperature.ts` / `timezone.ts` (no `= new Date()` defaults); static `tz-lookup` import + the non-UTC assertion; `engine.ts` `fallbackPattern` → `getUTC*`; delete the `window` tripwire.
2. **Scaffold `astryx-core-worker`** as its OWN repo at `MARKETING/astryx-core-worker/` (wrangler, TypeScript, vitest). Layout: `src/core/*` sealed (no I/O, no globals, no clock), `src/http/*`, `src/compliance/*`, `src/data/*` (the 22 JSONs; NOT astryxCanon/appKnowledge/catalog/bodySystems/delineations), `test/golden/*`.
3. **Extract `computeChart(input, asOf)`** from `src/app/api/chart/route.ts` into `core/chart.ts`; delete `engine.ts` `fetchChart()`; thread `asOf` end to end (`calculateTransits`, `computeDailyTemperature`). Default asOf **only in the HTTP handler**. Every response carries `{ standardVersion, engineVersion, dataVersion, asOf }`.
4. **Golden parity:** the app's `.snap` files must reproduce byte-for-byte in the Worker. Then the 200-tuple timezone/rounding suite (DST edges, historical zone changes). Add a temporary `X-Astryx-AsOf` debug header to the app's `/api/chart` for parity runs. Invariant: never reorder `PLANET_BODIES`.
5. **Compliance envelope** (the engine has none): `detectCrisis` on inbound free text before computing; `lintForBannedPhrases` on outbound prose in CI; `FULL_DISCLAIMER` / `MICRO_DISCLAIMER` on every envelope; licensee display requirement in the terms.
6. **Response shaping per tier** (decision 1). Basic vs premium. Raw mapping tables never leave the Worker.
7. **HTTP layer:** Hono router, CORS, per-caller metering in a Durable Object or KV (the app's in-memory `rateLimit.ts` does not work across isolates), enumeration anomaly detection.
8. **1.3 The x402 door:** `x402-hono` middleware on `POST /v1/calibrate` (~$0.05), `/v1/fork-map` (~$0.02), `/v1/sky-today` (~$0.01); USDC on Base via the protocol's facilitator (Coinbase Developer Platform). Prices are starting points.
9. **1.4 MCP server:** the same three capabilities as `paidTool`s so any agent framework adds "the Astryx tool" in one line.
10. **1.5 Bazaar listing** under Data, machine-readable description citing the Standard.
11. **1.6 Guardrails:** reference-not-medical framing on every response; rate limits per wallet; interpreted results per input only; phrasing variation on interpretive text.
12. Later: the Next app consumes the Worker (drop the client-side engine bundle → FIX 1 fully closed).

**Acceptance (roadmap):** Worker serves identical output to the app (golden parity) · a real agent pays and receives a calibration end-to-end · listed in the Bazaar · zero raw tables exposed.

## 5. Owner-side prerequisites (SHA) — needed at step 8, not before
- A **receiving wallet address** for USDC on Base. **Public address only. Never a key, never a seed phrase.** Set as a Worker secret/env var. If SHA does not have one, the session explains the options (Coinbase account wallet, or any self-custody wallet that supports Base) and she creates it herself; Claude never creates accounts or handles credentials.
- A free **Coinbase Developer Platform** account for the x402 facilitator. This IS the rail (SHA's "no outside services" rule is about email; the facilitator is the protocol itself, like Shopify is the store).
- Cloudflare: the account already exists (the Vault Workers live there; the Cloudflare connector is attached to SHA's Claude). Deploy with `wrangler` from the worker repo; secrets via `wrangler secret put`, never in git.

## 6. Guardrails that stand
Determinism (no `Math.random`, no `Date.now` in the core; `asOf` explicit) · sell the output, never the dataset · compliance on every machine output · human payments Shopify-only · wallet = public address only · never commit secrets · North Node stays separate (its engine is NOT part of this port) · commit as Sha Blyss <shabless1@gmail.com> · the app repo stays green (`tsc`, vitest, `lint:determinism`, `lint:copy`, `build:local`) after every app-side hygiene change, and every change deploys via `npx vercel --prod --yes` + `vercel inspect --wait`.

## 7. Marketing hook (so the session keeps the point in view)
This lane is the marketing plan: **be the dependency.** The Standard is the claim, the Worker is the product, the door is how machines pay, the Bazaar is how they find it, and every paid call is proof the method is used. When step 8 lands, the first real agent-paid calibration is a launch moment SHA will want to show. Say so when it happens.

---

## Opening prompt for the dedicated session
```
Astryx x402 session — Roadmap Phase 1.2–1.6 (Worker port → x402 door → MCP → Bazaar).

Read, in order:
1. astryx_v14/HANDOFF_x402_Worker_Port.md (this lane's handoff; verified not started as of 2026-09-12)
2. astryx_v14/ASTRYX_POSITIONING_ROADMAP_v1.md (§3 Phase 1, §4)
3. astryx_v14/PHASE1_WORKER_PORT_SCOPE.md (full technical scope)
4. astryx_v14/ASTRYX_CALIBRATION_STANDARD_v0.md §8 (machine contract)
5. Memory: astryx-calibration-standard-program, astryx-security-posture, astryx-deploy-path

Then: git status must be clean; run the gates (handoff §6). Start at handoff §4 step 1 (app-side hygiene), then scaffold astryx-core-worker as its own repo, then computeChart + asOf, then golden parity. Stop and show me the parity result before building the HTTP layer. Do not ask me for a wallet or a Coinbase account until you reach the x402 door (step 8); when you do, tell me exactly what to create myself and what to hand you (a public address only, never a key).

Rules: determinism, sell the output never the dataset, compliance on every machine output, human payments Shopify-only, no secrets in git, North Node stays separate, commit as Sha Blyss, deploy and verify. You are the developer; never ask me to code.
```
