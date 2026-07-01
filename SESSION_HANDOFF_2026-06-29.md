# ASTRYX — Session Handoff · 2026-06-29

Pick up cold from here. Read this first, then `CLAUDE.md`, `COMPLIANCE.md`, and
`FIXES_COMPLETE_v3.md` (the running build log — Parts J, K, L, N are the most recent).

---

## 0. STATE AT A GLANCE

- **ASTRYX IS LIVE IN PRODUCTION** at **https://myastryx.com** (apex primary; `www` 301→apex).
  Vercel prod alias is also **https://n-pi-jet.vercel.app**. Single Vercel project: **astryx**.
- The app is a Next.js 14 SPA: screens switch via Zustand `screen` state (NOT URL routes);
  state persists in localStorage (`astryx-storage`). Free flow works without sign-in.
- **The Astryx chat brain runs on OpenAI `gpt-4o-mini`** (see §3). Gemini is the one-env-var
  fallback. Both keys live in Vercel **Production**.
- Working dir: `astryx_v14/`. Build env = Windows + OneDrive path.

## 1. BUILD / DEPLOY WORKFLOW (important — this machine has quirks)

- **CANNOT run a local preview** here: the OneDrive path breaks the `preview_*` launcher and
  `vercel build` hits an EPERM symlink. So **verify every change with**:
  `npx tsc --noEmit` (expect 0) → `npm run build` (green) → deploy.
- **SHA is the on-device visual gate** — the agent cannot see rendered output. For visual
  changes, deploy a **preview** (`vercel --yes`) and let SHA eyeball, OR (this session's rhythm
  for small/clear tweaks) deploy prod directly and she checks live.
- **Production is LIVE.** `vercel --prod --yes` updates the real site instantly. SHA has been
  approving rapid prod deploys for small tweaks; for anything large/risky, preview first and get
  her "ship it".
- **Vercel CLI is v54** and finicky: `vercel env add NAME production --value "X" --yes` works;
  the **Preview** env scope often won't take non-interactively (add Preview vars via the Vercel
  dashboard if ever needed). `vercel env rm NAME production --yes` then re-add to change a value.
- **Preview deploys fall back to the LOCAL brain** — the model key is only in the Production env
  scope, so `/api/astryx` on a preview returns `{fallback:true}` and TeacherChat uses the local
  `answerAstryx`. That's expected; test the live LLM brain on prod (myastryx.com).
- Canon corpus: if any `src/data/*.json` changes, run `npm run build:canon` to regenerate
  `src/data/astryxCanon.json` (committed; keyword retrieval, no embeddings).

## 2. WHAT SHIPPED THIS SESSION (all live in prod) — detail in `FIXES_COMPLETE_v3.md`

- **Part J** — Recalibration **composition engine** (corrective sessions run several DISTINCT
  forks, never repeat the primary; generalized never-amplify) + **Full-Spectrum** 10-fork
  feet-up attunement session + intention→fork map. `lib/chamber/forkRite.ts`,
  `lib/chamber/durationPresets.ts`, `lib/chamber/intentionMap.ts`.
- **Part K** — Fork placement: **dual glowing orbs** (traditional + natal) + Scorpio/reproductive
  **womb-lift & genital clamp**. `lib/BodyPlacementEngine.ts`, `components/engine/ChamberBodyMap.tsx`.
- **Part L** — **Astryx Intelligence**: full-canon RAG (582 cited chunks) + swappable model
  adapter + persona/character bible + sovereignty contract. `lib/astryx/*`,
  `app/api/astryx/route.ts`, `components/teacher/TeacherChat.tsx`. Gemini hotfix → `@google/genai`
  SDK for the new `AQ.` key format.
- **Part N** — Blind-test fixes: (N.1) **both** orbs always render + per-planet accuracy
  (traditional anchor now = `planetBodyRulershipLibrary`, e.g. Mercury→throat); (N.2) Astryx
  knows the user's **intention** (grounding); (N.3) "Today's Element" → **"Today's Sky"** +
  reconciled with the personal reading (`lib/dailyElement.ts`); (N.4) removed duplicate Birth
  Location label; (N.5) domain→prod alias + www→apex redirect (`next.config.js`). Plus: chamber
  player **default-collapsed** in Body/Combined.
- **Launch tweaks (this session):** new **Landing page** (`components/screens/LandingScreen.tsx`,
  default screen for new visitors) with slogan *"It's not about predictions, it's about
  recalibration"* + Sign Up/Sign In; intake hero trimmed to a simple ASTRYX header; **new logo**
  everywhere (`/images/astryx logo b.png`); **Google + email login** wired + sign-in-loop fix
  (session-aware routing in `page.tsx`) + **account dropdown w/ Sign out** (`NavBar.tsx`);
  **Practitioner portal padlocked** (`PRACTITIONER_LOCKED = true` in `IntakeScreen.tsx`);
  **XRP paywall → "Coming Soon"** (`PaymentScreen.tsx`); **source-list footers REMOVED** from chat
  (SHA: never volunteer sources; only on request — persona rule + UI removal).

## 3. THE MODEL BRAIN (Astryx chat) — current config

- **Provider = OpenAI** `gpt-4o-mini`. Env in Vercel **Production**: `ASTRYX_MODEL_PROVIDER=openai`
  + `OPENAI_API_KEY` (paid account, has credit). Verified live: `provider:openai`, cited answer.
- **Adapter is swappable** (`lib/astryx/modelAdapter.ts`): flip `ASTRYX_MODEL_PROVIDER` to
  `gemini` (the `AQ.` `GEMINI_API_KEY` is still set, FREE-tier) or `selfhost` (Phase 2 stub).
- `/api/astryx` retries once (~700ms) on a transient model error, then falls back to the local
  `answerAstryx`. RETRIEVE_K=5. **OpenAI billing is separate from ChatGPT Plus** — if the balance
  runs dry it errors → local fallback; keep a little credit on the account.
- **Sovereignty (do not regress):** only the question + retrieved canon + a DERIVED reading
  summary (signs/states/labels + intention) leave to the model — never birth time/location,
  email, account, or wallet. The LLM touches ONLY the chat; the deterministic engine is untouched.

## 4. INFRA / ENV

- **Domain:** `myastryx.com` on Cloudflare Registrar. DNS: `A @ 76.76.21.21` (grey/DNS-only),
  `CNAME www cname.vercel-dns.com` (grey), **SSL/TLS = Full**. www→apex redirect in `next.config.js`.
- **`NEXTAUTH_URL=https://myastryx.com`** (Production). Google OAuth: redirect URIs for
  myastryx.com / www / n-pi-jet are registered in Google Cloud console; consent screen published.
- **Auth:** NextAuth (Google + email/password). ⚠ Email/password user store is **in-memory**
  (`DEMO_USERS` in `lib/auth.ts`) — accounts do NOT persist across serverless cold starts.
  **Google login is the reliable path** until a DB is added.

## 5. OPEN ITEMS / NEXT WORK (nothing blocking; app is live)

1. **DB-backed accounts** (Prisma + Postgres) — so email/password signups persist. Roadmap.
2. **Practitioner portal** — currently LOCKED (`PRACTITIONER_LOCKED`). Full build is its own effort.
3. **Real upgrade checkout** — Payment screen is a "Coming Soon" placeholder; build card-first
   (crypto optional) when Premium launches.
4. **Mandala visual** — intentionally on the original SVG; do NOT reintroduce the cymatic/3D
   engine unless SHA asks (see `memory/astryx-mandala-direction.md`).
5. **Earth Day/Year R2 songs** — verify bucket file names match the catalog if bookends 404
   (see `memory/suno-audio-r2-pipeline.md`).
6. **Phase-2 brain:** self-host model (`SELFHOST_LLM_URL`) + curated web (`ASTRYX_WEB_ENABLED`),
   both scaffolded OFF.

## 6. GROUND RULES (carry forward)

- SHA is the **architect, not a coder** — decide, document, move; never ask her to write code.
- **Voice:** energy/frequency/medical-astrology; probabilistic framing ("may suggest"); NO
  ritual/occult/mystical language. Compliance via `lib/compliance.ts` (crisis gate, banned
  phrases, disclaimer). Malachite always carries its red polished/sealed-only warning.
- **Determinism is absolute** for the engine (no `Math.random` in the reading/protocol/audio
  selection). The LLM lives only on the chat surface.
- **Two frequency systems kept separate:** planetary protocol = Cousto
  (`planetary-anchors.json`, `sacredTones_nervousSystem.json`); chakra layer = Solfeggio.
- SHA's working style (see `memory/sha-working-style.md`): decisive, honest-over-agreeable, simple
  language, deploy-and-let-her-be-the-eyes, momentum-driven. Verify keys/credentials BEFORE
  deploying (lesson from the Gemini/OpenAI key saga — test the key with a direct call first).

## 7. MEMORY POINTERS (persistent, auto-loaded)

`astryx-part-j-engine` (J+K live), `astryx-intelligence-canon` (Part L brain + OpenAI switch +
rate-limit note), `astryx-voice-positioning`, `astryx-mandala-direction`, `suno-audio-r2-pipeline`,
`sha-working-style`, `claude-is-the-developer`. The MEMORY.md index lists them all.

---
*End of handoff — Astryx is live, on OpenAI, with the full-canon brain, the composition engine,
dual-orb placement, logins, and the branded domain. Build log: `FIXES_COMPLETE_v3.md`.*
