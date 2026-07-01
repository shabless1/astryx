# ASTRYX — Developer Handover Package
*Principal-Architect handover for the incoming dev team · target: myastryx.com (LIVE) · Vercel project `astryx`*

> **Read order for a new engineer:** this file → `COMPLIANCE.md` → `CLAUDE.md` → `FIXES_COMPLETE_v3.md` (running change log, Parts J–S + Addendum 1 = the latest decisions) → `SESSION_HANDOFF_2026-06-29.md`.

---

## 1. PROJECT OVERVIEW & TECH STACK

**What it is:** a deterministic, multi-sensory wellness "calibration" app. Birth data + a light somatic/emotional intake → a real natal chart (astronomy-engine) → a "signal" (dominant planetary pattern + polarity state) → a personalized five-layer protocol (**Sound · Scent · Taste · Body · Sight**) delivered in an audio-visual "Resonance Chamber," with a conversational AI ("Astryx") that explains the reading.

**Positioning is legally load-bearing:** *calibration, not prediction; reference tool, not medical advice.* Compliance (probabilistic framing, crisis gate, disclaimers) is enforced in `src/lib/compliance.ts`, not just copy.

**HARD INVARIANT — determinism:** same birth data + intake → byte-identical reading, protocol, fork sequence, audio selection. **No `Math.random` in the reading/protocol/audio-selection path.** The LLM only touches the chat surface; it never recomputes the deterministic output.

### Tech stack (from `package.json`)
- **Next.js 14.2.3 (App Router) + TypeScript 5 + React 18**
- **Tailwind CSS 3.4** (+ PostCSS, Autoprefixer)
- **Zustand 4.5** (persisted → `localStorage` key `astryx-storage`)
- **NextAuth 4.24** (Google OAuth + Credentials/bcryptjs)
- **astronomy-engine 2.1** (ephemeris), **tz-lookup** (offline tz), OSM Nominatim (geocode)
- **Tone.js 14.7** (live synth) + native Web Audio (streamed MP3 chamber music from Cloudflare R2)
- **three 0.164 + @react-three/fiber + drei** (WebGL mandala/kaleidoscope), **framer-motion**
- **jsPDF** (practitioner PDF), **xrpl 3** (XRP payment — gated)
- **LLM:** OpenAI `gpt-4o` (prod) via REST; **@google/genai** (Gemini) fallback; Anthropic (optional, intake interpret). Swappable adapter + keyword-RAG canon + offline sovereign fallback brain.

### Architecture patterns
- **SPA-over-App-Router:** the whole app renders from `src/app/page.tsx`; navigation is a Zustand `screen` string (NOT URL routes). `src/app/api/*` are the only server endpoints.
- **Deterministic engine core** (`lib/engine.ts` `runEngine`): chart → dominant pattern → symptom/body-zone resolution → Remedy Polarity → Signal Hierarchy → 5 sensory builders → Sacred Layer → prescriptions → reflex placements.
- **"Planet ≠ Remedy" (Remedy Polarity Engine):** user's reported signal is authority; chart adjusts confidence only; imbalance is met with a corrective **counterweight**, not amplification.
- **Two-axis medical-astrology model (Directive S):** PLANET = action (WHAT), SIGN = body part (WHERE); reflex zones (opposite/squares) via `ReflexEngine.ts`.
- **Swappable LLM adapter + sovereign fallback** (`lib/astryx/*`): keyword RAG over `astryxCanon.json` (633 chunks); hard data-minimization (only question + derived summary + canon leave to the model).
- **Modular audio/visual engines** (`lib/chamber/*`, `lib/visual/*`, `components/engine/mandala/*`).
- **Compliance as middleware** (`lib/compliance.ts`): banned-phrase lint, crisis gate, pain red-flag, disclaimers, LLM output guard.

---

## 2. SYSTEM ARCHITECTURE & DATA SCHEMA

**No database.** Persistence = Zustand + `localStorage` (client) + 44 JSON reference files in `src/data/` (read-only domain corpus). Auth users are an **in-memory array** (`DEMO_USERS` in `lib/auth.ts`) — does NOT survive serverless cold starts.

**Canonical data model:** `src/types/index.ts` — `IntakeData`, `ProtocolOutput`, `ReflexPlacement`, `SignalHierarchy`, `SOAPOutput`, `DiagnosticOutput`, `UnifiedPrescription`, `ActivePlanet`, `PolarityResultLike`, `EnvironmentLayer`, `ReasoningTrace`. Ephemeris shapes in `lib/ephemeris.ts` (`NatalChart`, `PlanetPosition`, `DetectedAspect`, `TransitAspect`, `SkyPosition`). Polarity shapes in `lib/RemedyPolarityEngine.ts`.

**Data files (44):** `planets, aspects, signs, houses, elements, modalities, geometry, colors, planetary-anchors, sign-modulation, solfeggio-overlays, scents, herbs, body-protocols, symptoms, soap-templates, taste-map, sample-protocol, cellSalts, medicalAstrology, planet-intake-map, remedyPolarity, appKnowledge, sacredTones_nervousSystem, sacredBotanicals, crystalsExpanded, lotusSpectrum, starterKits, signBodyZones, qualityLexicon, signPolarities, planetTreatmentChannels` + `astryxCanon.json` (GENERATED — `npm run build:canon`, do not hand-edit) + `data/bodySystems/*.json` (11).

**Primary data flow:**
```
IntakeScreen → /api/geocode (OSM+tz) → runEngine(intake,coords)
  → /api/chart (astronomy-engine → NatalChart+pattern+transits)
  → bodyZoneResolver → RemedyPolarityEngine → SignalHierarchy → 5 builders → ReflexEngine → ProtocolOutput (Zustand/localStorage)
ResultsScreen → SessionScreen → lib/chamber/* score → astryxAudioLibrary.resolveTrack → R2 MP3 (/api/catalog proxies R2 manifest)
                             → SoundEngineController (Tone.js) + Mandala/Visual (three)
TeacherChat → /api/astryx (crisis gate → RAG canon → transitContext → LLM → compliance guard) ; on failure/preview → local sovereignAstryx
```

**API routes (8):** `chart` (ephemeris), `geocode` (OSM), `astryx` (chat brain), `teach` (legacy Gemini — DORMANT), `intake/interpret` (Anthropic, optional), `catalog` (R2 CORS proxy), `payment/xrp` (gated), `auth/[...nextauth]` (Google + Credentials).

**Third-party:** Vercel, Cloudflare R2 (audio + `catalog.json`), Cloudflare Registrar/DNS, OpenAI, Gemini, Anthropic(opt), Google OAuth, OSM Nominatim, XRP Ledger, sacredtea.net (flagged).

**Environment variables (complete):**
```
# Auth
NEXTAUTH_SECRET= NEXTAUTH_URL= GOOGLE_CLIENT_ID= GOOGLE_CLIENT_SECRET=
# LLM brain
ASTRYX_MODEL_PROVIDER=openai   OPENAI_API_KEY=  OPENAI_MODEL(=gpt-4o)  OPENAI_EMBED_MODEL
GEMINI_API_KEY=  ASTRYX_WEB_ENABLED=false  SELFHOST_LLM_URL=  SELFHOST_LLM_MODEL=  ANTHROPIC_API_KEY=(opt)
# Audio (Cloudflare R2)
NEXT_PUBLIC_AUDIO_BASE_URL=  AUDIO_BASE_URL=      # prod value https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev (marked Sensitive in Vercel)
# Payments / shop flags
NEXT_PUBLIC_XRP_ADDRESS= XRP_NETWORK= NEXT_PUBLIC_SHOP_LIVE= NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE=
NEXT_PUBLIC_SUBSCRIBE_URL= NEXT_PUBLIC_SUBSCRIBE_TEST_UNLOCK= NEXT_PUBLIC_APP_URL=
```
> Note: OpenAI key is **Production-scope only** → chat on Vercel *preview* URLs falls back to the offline keyword brain. Test chat on myastryx.com only.

---

## 3. README (see repo `README.md` — generate/keep in sync)
Prereqs: Node ≥ 18.17 (20 LTS rec.), npm ≥ 9, Vercel + Cloudflare R2 accounts, API keys.
```bash
npm install
cp .env.example .env.local        # fill values
npm run build:canon               # if any src/data/*.json changed → regenerates astryxCanon.json
npm run dev                       # http://localhost:3000
# gates: npx tsc --noEmit (expect 0)  ·  npm run build (green)  ·  no test runner installed
# deploy: vercel --yes (preview, offline chat)  ·  vercel --prod --yes (→ myastryx.com)
```

---

## 4. CURRENT STATE, BUGS & COMPONENT STATUS

**✅ Fully functional:** intake→chart→reading pipeline; natal + Solar Chart; medical-astrology engine (Remedy Polarity, Signal Hierarchy, two-axis separation, Reflex engine, reconciled counterweights, treatment channels); Results screen (SOAP, chart wheel, body map w/ 2 placements per fork, prescriptions, Explore Deeper, Ask-Astryx nudges); Resonance Chamber session (Tone.js + R2 music, Body/Color/Mandala modes, 4-7-8 breath, fork placement, grounding bookends breath-only); Astryx chat (gpt-4o + 633-chunk RAG + live-sky + sovereignty + compliance guard); live sky/daily temperature/element; compliance layer; Google auth + account dropdown; landing; PDF export.

**🟡 In-progress / partial:** Practitioner Portal (scaffolded, `PRACTITIONER_LOCKED=true`); Payments (`PaymentScreen` = "Coming Soon", xrpPayment + route exist, no card checkout); account persistence (NONE — in-memory); **Directive S · Addendum 2 (guided one-position-at-a-time placement) — NOT built** (spec written; reflex-orb flood removed, 2 placements/fork, COMBINED mode retired); Astryx web tier (`ASTRYX_WEB_ENABLED=false`, stub); self-host LLM (stub); advanced Mandala engine (paused on SVG); `/api/teach` (dormant, delete candidate).

**🐞 Known bugs / tech debt (priority order):**
1. **In-memory auth** — `DEMO_USERS` doesn't persist across cold starts; Google login is the only reliable path → add Prisma + Postgres NextAuth adapter.
2. **R2 `catalog.json` 404** — `/api/catalog` gets `upstream 404`; app silently uses the static seed catalog (audio still plays). Fix: run `scripts/generate-catalog-manifest.mjs`, upload `catalog.json` to bucket root. (All Mars tracks verified 200 — the occasional "track isn't available" was a transient load blip, not a missing file.)
3. **Local fallback brain is a keyword script** (`lib/astryx/sovereignAstryx.ts`) — runs whenever the model is unreachable (always on preview). Personable + placement-aware now, but inherently limited. Keep OpenAI credit funded; don't judge chat on preview URLs.
4. **No automated tests / CI** — verify determinism + compliance manually. Add Vitest golden-file snapshots for `runEngine` + a compliance-lint gate.
5. **`NEXT_PUBLIC_AUDIO_BASE_URL` marked Sensitive** in Vercel (misleading empty `env pull`) — confirm intended.
6. **Dead code** after Directive-S walk-back: unused reflex props in `ChamberBodyMap.tsx`, unreferenced `CombinedChamberView.tsx`. `noUnusedLocals` is OFF in tsconfig. Clean up next pass.
7. **SPA routing** has no URL/deep-link/back-button (screen = Zustand state).
8. **Determinism guard by convention only** — add an eslint rule banning `Math.random` in `lib/engine.ts`, `lib/chamber/*`, `lib/*Engine.ts`.

---

## 5. CODE EXPORT — RECOMMENDED ORDER

Full source is 148 TS/TSX + 44 data files. **Recommended read/export batches (foundation → surface):**

1. **Root config + entry:** `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `.env.example`, `src/app/{layout,page,providers}.tsx`
2. **Type model:** `src/types/index.ts`
3. **Deterministic engine core:** `lib/ephemeris.ts` → `lib/solarChart.ts` → `lib/engine.ts` → `lib/RemedyPolarityEngine.ts` → `lib/ReflexEngine.ts` → `lib/bodyZoneResolver.ts` → `lib/BodyPlacementEngine.ts` → `lib/NarrativeSignalParser.ts` → `lib/cellSaltKeynotes.ts`
4. **API routes:** `src/app/api/*` (8)
5. **AI brain:** `lib/astryx/*` (canon, modelAdapter, persona, sovereignAstryx, transitContext, webSources) + `lib/teacher/*` + `lib/compliance.ts` + `components/teacher/TeacherChat.tsx`
6. **Audio/session:** `lib/chamber/*` (14) + `lib/soundEngine.ts`, `pureTone.ts`, `fallbackTone.ts`, `transitAudio.ts`, `audioSession.ts`, `astryxAudioLibrary.ts`, `astryxPlayer.ts`, `forkClass.ts`
7. **Daily/support:** `lib/dailyTemperature.ts`, `dailyElement.ts`, `signalCopy.ts`, `bodyMapPlacement.ts`, `subscription.ts`, `auth.ts`, `xrpPayment.ts`, `pdfExport.ts`, `timezone.ts`, `store.ts`, `utils.ts`, `version.ts`
8. **Screens:** `components/screens/*` (21 + dashboard/)
9. **Engine components:** `components/engine/*` + `components/engine/mandala/*`
10. **Visual/tea/protocol libs:** `lib/visual/*` (17), `lib/tea/*` (6), `lib/protocol/*` (4)
11. **UI/layout:** `components/ui/*`, `components/layout/*`, `src/styles/globals.css`
12. **Data + scripts:** `src/data/*` (44 + bodySystems/), `scripts/*`

*Companion docs in repo:* `CLAUDE.md`, `COMPLIANCE.md`, `FIXES_COMPLETE_v3.md`, `SESSION_HANDOFF_2026-06-29.md`.
