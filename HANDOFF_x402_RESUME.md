# ASTRYX — x402 lane · RESUME HERE
### Running head for the Calibration Standard build. Written 2026-09-15. Supersedes the progress blocks in `HANDOFF_x402_Worker_Port.md` (keep that for the original scope and the plain-English x402 explainer).

---

## 0. Orientation in one paragraph

Astryx's calibration engine has been lifted out of the Next app into a sealed
Cloudflare Worker, proven to give byte-identical answers, wrapped in a
compliance envelope, shaped so the method never leaves, put behind a metered
HTTP API, and fitted with an x402 payment door. The Worker is **live**. The door
is **open on testnet** and returning correct payment challenges. **One thing is
broken and it is the next thing to fix: the Coinbase credentials are one
character long** (see §2). Nothing is taking real money and nothing can, by
construction.

---

## 1. Where everything is

| | |
|---|---|
| **App repo** | `MARKETING/astryx_v14` → GitHub `shabless1/astryx` → Vercel `astryx` → **myastryx.com** |
| **Worker repo** | `MARKETING/astryx-core-worker` → GitHub `shabless1/astryx-core-worker` (**private**) |
| **Worker live** | **https://astryx-core.shabless1.workers.dev** |
| **Deploy app** | `npx vercel --prod --yes` from `astryx_v14` |
| **Deploy worker** | `npx wrangler deploy` from `astryx-core-worker` (OAuth'd as shabless1@gmail.com) |
| **Standard** | myastryx.com/standard · `ASTRYX_CALIBRATION_STANDARD_v0.md` §8 = the machine contract |
| **Roadmap** | `ASTRYX_POSITIONING_ROADMAP_v1.md` §3 Phase 1 |

---

## 2. ⛔ THE BLOCKER — do this first

`GET https://astryx-core.shabless1.workers.dev/health/facilitator` currently returns:

```json
{ "authenticated": false,
  "detail": "Invalid key format - must be either PEM EC key or base64 Ed25519 key",
  "secretShape": { "length": 1, "looksLike": "unrecognised" },
  "idShape":     { "length": 1, "looksLikeUuid": false } }
```

**Both CDP credentials are exactly one character.** `npx wrangler secret put`
uses a *masked* prompt, and on SHA's Windows terminal a paste into it captured a
single keypress. The 402 challenges looked perfect the whole time because they
are built locally and never touch the credentials.

### The fix — SHA does this, in the Cloudflare dashboard, not a terminal

1. **dash.cloudflare.com** → Workers & Pages → **astryx-core** → Settings →
   **Variables and Secrets**
2. Edit **`CDP_API_KEY_ID`** → paste the API Key ID (~36-char UUID) → Save
3. Edit **`CDP_API_KEY_SECRET`** → paste the secret (~88-char base64, usually
   ends `==`) → Save

Her CDP key was created with: **Ed25519**, **IP allowlisting OFF** (Workers have
no stable outbound IP), and **no account permissions ticked** (x402 needs none —
money goes buyer → her Ledger; Coinbase only verifies and settles).

If the secret was never saved anywhere, she creates a fresh Secret API Key at
**portal.cdp.coinbase.com/api-keys/secret** — the secret is shown once.

### Then verify

```bash
curl -s https://astryx-core.shabless1.workers.dev/health/facilitator
```

Want `"authenticated": true` and a `networks` list including `base-sepolia`.
**Never ask SHA to paste a credential into chat.** The probe reports shape only.

---

## 3. What is done

| Step | State |
|---|---|
| 1 · App hygiene — clock out of the core | ✅ live |
| 2 · Worker repo, sealed core | ✅ |
| 3 · `computeChart(input, asOf)` | ✅ |
| 4 · **Parity proven** | ✅ 197/197 vs live app · workerd exact |
| 5 · Compliance envelope | ✅ |
| 6 · Tiered shaping | ✅ |
| 7 · HTTP layer + Durable-Object metering | ✅ |
| 8 · x402 door | ⚠️ built, open on testnet, **blocked on §2** |
| 9 · MCP server | ❌ |
| 10 · Bazaar listing | ❌ |
| 11 · Machine-output guardrails | ❌ |
| 12 · App consumes the Worker | ❌ ← also what finally closes the app's corrective-row exposure |

**Test counts:** app 324 · worker 90 hermetic + 48 workerd · parity 197/197.

---

## 4. Next actions, in order

1. **Fix the credentials** (§2) and confirm the probe authenticates.
2. **Prove settlement on testnet.** SHA chose this over letting a real caller be
   the first. Needs a throwaway Base-Sepolia wallet with test USDC + a little
   test ETH for gas. **She authorised creating a throwaway TESTNET key for this
   (2026-09-15).** It must never touch mainnet and must be discarded after.
   CDP has a faucet API her key can call.
3. **Answer the cold-start cost.** First request through an open door ≈ 8.4 s
   locally (module eval + facilitator `supported` call); ~0.585 s live; every
   request after ≈ 10–34 ms. A cold isolate lands on somebody's real request —
   cache the facilitator descriptor before go-live.
4. **Only then** consider `X402_NETWORK=base`. That is the real-money switch and
   it is a separate, deliberate decision.
5. Then steps 9 → 12.

---

## 5. Invariants — do not break these

- **THE CRISIS SCREEN RUNS BEFORE THE PAYWALL.** It is a middleware in
  `src/http/index.ts`, ahead of the door. A paywall runs *before* its handler, so
  moving the screen back inside the calibrate handler would charge a person in
  crisis and then refuse them. Four tests hold it. Never move it back.
- **Two locks on real money.** `X402_ENABLED === 'true'` **and** an address;
  network then defaults to `base-sepolia`. Real money needs
  `X402_NETWORK === 'base'` exactly. `'yes'`, `'1'`, `'Base'`, `'mainnet'`,
  `'8453'` all stay on testnet, and there are tests saying so.
- **Determinism.** No `Math.random`, `Date.now`, `new Date()`, `process.env`,
  `window` or `fetch` anywhere in `src/core`. The clock is `asOf`, an argument.
  The router is the only place allowed to decide "now" is now.
- **Sell the output, never the dataset.** `src/shape/fields.ts` is the boundary
  and every list carries its reason. `assert.ts` is a name-based backstop that
  throws — it trips on 75 fields in an unshaped protocol.
- **Both gates fail closed.** `sealEnvelope` is the only way to build a response;
  it runs the IP backstop then the compliance gate, and throws rather than
  quietly editing output.
- **Never regenerate `test/golden/__snapshots__`** in the Worker. It is the app's
  file, copied byte-for-byte. Regenerating makes the parity test agree with
  itself and prove nothing.
- **Never reorder `PLANET_BODIES`.** Key insertion order drives `JSON.stringify`,
  which drives every snapshot.
- **Human payments stay Shopify-only. No tokens, ever.**
- **A wallet address is public and fine. A private key or seed phrase is never
  requested, never accepted, never stored.**

---

## 6. Gotchas already paid for — do not rediscover these

| Trap | What to do |
|---|---|
| `wrangler secret put`'s masked prompt truncates a paste to 1 char on SHA's Windows terminal | Use the **Cloudflare dashboard**, or `printf '…' \| npx wrangler secret put NAME` (piping works — that is how `X402_PAY_TO` was set) |
| `port-core.mjs --resync` **overwrites deliberate divergences** | It now NAMES them by file and line. Restore with `git checkout HEAD -- <file>`, then re-apply only the upstream delta. Never retype from memory |
| …and template literals come back with real newlines instead of `\n` | Identical behaviour, noisy diff. Convert back to escapes |
| CDP auth is a **signed JWT per request and path**, not a bearer token | Use `createCdpAuthHeaders` from `@coinbase/x402`. A hand-rolled `Bearer id:secret` fails every verify/settle |
| `createFacilitatorConfig` returns the **v2** `FacilitatorConfig`; `x402-hono` v1 wants **v1** | Supply the URL yourself (`https://api.cdp.coinbase.com/platform/v2/x402`) and borrow only the auth factory |
| `@cloudflare/vitest-pool-workers` 0.22 needs **two** pieces | `cloudflareTest()` as a Vite **plugin** *and* `cloudflarePool()` as the **pool**. One alone dies on `Cannot find package 'cloudflare:test'` |
| `compatibility_date` newer than the installed workerd | The Worker refuses to start, including under the test pool. Pin to what the binary implements |
| The x402 stack is **4.7 MB** | Switches live in `doorConfig.ts` (no heavy imports); `door.ts` is imported **dynamically** only when the door is open. Worker startup is 8 ms |
| A **402 challenge proves nothing about settlement** | It is built locally. Only verify/settle touch Coinbase. Use `/health/facilitator` |
| `can'?t` missed `cannot` | Fixed. A person types "can't"; an **agent** writes "the user reports they cannot breathe" — and agents are who this API is for |
| The zodiac sign **Cancer** is not the disease | Fixed in `CLINICAL_CONDITION_TERMS`. Lowercase `cancer` = disease; capitalised only in disease company |
| Safety fields **may** name a condition | `safetyNote` / `contraindications` are exempt from basic-tier disease-naming. "Osteoporosis of the cervical spine" is what stops a fork causing harm |
| Never run `detectCrisis` on **outbound** text | Our own corpus is not a disclosure. "deep unconscious processing" matched on "unconscious" |

---

## 7. Commands

```bash
# Worker
npm test            # 90 hermetic
npm run workerd     # 48, inside the real runtime
npm run parity      # 197 tuples vs the LIVE app
npm run port:check  # upstream drift since the port
npm run size        # bundle weight
npx wrangler deploy

# App
npm run test -- --run ; npm run lint:determinism ; npm run lint:copy ; npm run build:local
npx vercel --prod --yes

# Live checks
curl -s https://astryx-core.shabless1.workers.dev/health
curl -s https://astryx-core.shabless1.workers.dev/health/facilitator
```

---

## 8. Open for SHA — not code

1. **The attorney.** The legal copy is still marked draft, pending review, since
   July. Every safeguard enforces that text faithfully; none can tell her whether
   the text is right. All strings are in `src/legal/copy.ts` — a one-file swap.
   Offered and not yet done: prepare a package (current copy + gap analysis +
   machine-caller terms + numbered questions) so she buys a flat-fee **review**
   rather than a drafting engagement.
2. **The free tier.** The Worker serves free anonymous basic calibrations at
   10/min to anyone with the URL. Rate-limited, enumeration-detected, and nobody
   has the URL — but it is a decision to make deliberately before any launch.
3. **`mineral.traditionalPreparation`** renders on the free surface (HomeScreen,
   with a hardcoded fallback that is itself preparation guidance). A compliance
   question for counsel, not an IP one. Left untouched on purpose.
4. **The app's corrective-row exposure.** `/api/protocol` still sends the
   `remedyPolarity` row to signed-in users, trimmed to the screens' own slice
   lengths. It cannot be withheld while the app's client renders it. **Step 12
   is the real fix.**

---

## 9. Opening prompt for the next session

```
Astryx x402 lane — resume.

Read, in order:
1. astryx_v14/HANDOFF_x402_RESUME.md   ← this file, the running head
2. astryx_v14/HANDOFF_x402_Worker_Port.md  (original scope + the x402 explainer)
3. Memory: astryx-calibration-standard-program, astryx-deploy-path, astryx-security-posture

Then: git status clean in BOTH repos; run the gates (§7).
START AT §2 — the CDP credentials are one character long and must be re-entered
via the Cloudflare dashboard, not a terminal prompt. Verify with
/health/facilitator before anything else.

Rules: §5 invariants are not negotiable — especially the crisis screen sitting
ahead of the paywall. Read §6 before debugging anything; those traps are paid
for. Determinism, sell the output never the dataset, compliance on every machine
output, human payments Shopify-only, no secrets in git, commit as Sha Blyss,
deploy and verify. You are the developer; never ask SHA to code, and never ask
her for a private key.
```
