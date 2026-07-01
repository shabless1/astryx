# ASTRYX — Phase 7 Handoff: GO LIVE
### Cold-start brief for the next chat — June 18, 2026

**Read this first, then `FIXES_COMPLETE.md` (the running change log) and `CLAUDE.md` (build manifest) + `COMPLIANCE.md`.** The app is built, fixed across five QA passes, green, and deployed to a staging URL. Phase 7 is **launch**: production config, hosting the audio, finishing the desktop layout with real-device eyes, and the go-live checklist. Nothing below is broken — this is about shipping it for real.

---

## 0. Fast facts

| | |
|---|---|
| **Canonical codebase** | `…/MARKETING/astryx_v14/` (Next.js 14 · TypeScript · Tailwind · Zustand · NextAuth · Tone.js dormant) |
| **Live (staging) URL** | https://n-pi-jet.vercel.app (Vercel project `astryx`, aliased) |
| **Deploy** | from `astryx_v14/`: `vercel --prod --yes` (CLI installed + linked). **No git in this folder** — deploy straight from the directory. |
| **Verify before deploy** | `npx tsc --noEmit` (expect 0) then `npm run build` (expect 10/10 static pages). |
| **Current state** | tsc 0 · build 10/10 · deployed. All of v1–v5 QA directives complete (see `FIXES_COMPLETE.md`). |
| **Architect** | SHA — approves direction, supplies assets, **never writes code**. Make decisions, document them, move on. |

### Environment gotchas (real — hit repeatedly)
- **OneDrive path with spaces breaks the Claude preview launcher** (`preview_start` fails) — **I (the agent) cannot see rendered output.** Layout/visual work is verified by `tsc`/`build` + reasoning; **SHA is the on-device visual gate** (she tests on a real iPhone + desktop). This is the single most important working constraint.
- **No Python** on the machine. Don't rely on Python skill scripts.
- **No image generator** wired in — can't produce raster/mandala art here (prompt guides only).
- **Build flake:** an occasional `EINVAL readlink … .next/server/font-manifest.json` (OneDrive lock). Fix: `Remove-Item -Recurse -Force .next` then rebuild. Not a code error.
- Shell is **PowerShell**; quote the OneDrive path. Use `Set-Location "…/astryx_v14"; npx tsc --noEmit; npm run build`.

---

## 1. What's been done (5 QA passes since Phase 6 — all shipped & live)

Full detail in `FIXES_COMPLETE.md` (newest pass on top). Summary:

- **v1 — CORRECT & FINISH (14 fixes):** Suno→Astryx rename; **Chamber audio truth** (real LIVE state + Web Audio oscillator fallback); save date/timestamp + full payload + dedupe; **the recalibration intelligence engine** (free-text NarrativeSignalParser + intention now bias the sequence + reasoning trace); **fixed 15/30/60 session containers** with phase architecture; visible timer removed (phase-driven); single-source protocol; music follows fork; breath coherence; Sacred Tea polarity; distinct per-symptom guidance; History retention loop; honest intake copy; check-in mutual exclusivity.
- **v2 — polish:** pre-session `energyBefore` → BEFORE→AFTER delta; reading-card label from canonical signal; post-save → History; **energy-trend sparkline** in History; compliance pass on cell-salt dosing + "clinical"→"reference"; mobile tap targets; **intake collapse-and-fold + "n of 10 scanned"** (data-preserving). Backend persistence deferred.
- **v3 — cell-salt facets:** additive `cellSaltKeynotes.ts` — symptom routes by **domain overlap**, displays the matching **emotional/physical facet** + a "why" + honest %/loose-match. `cellSalts.json` untouched (Mineral Foundation + gestation surfaces preserved).
- **v4 — loose ends:** cell-salt "What To Do" uses the matching facet (no double-print); **Results fork label == Chamber == Summary** (shared `forkSequenceDisplay`); **forgiving geocode** ("Chicago" alone works); insight names only reported planets.
- **v5 — responsive + device findings:** `overscroll-behavior: contain` + persist `screen`/`sessionTime` → **reload resumes, no dump-to-Home**; **legibility** (brighter semantic text classes, 16px base/inputs); **expandable color field** (swatch → full-screen breathing hue); responsive foundation + **History/Intake grids** + widened Results; **Chamber mobile top-bar overlap fixed** (no flex-wrap, step-panel desktop-only, compact Exit); **removed the Auto/3D/SVG renderer pill**, centered the Body/Color/Mandala/Combined toggle.

**Verified posture:** clean of `ritual`/`rite`/`mystical`/`ceremony` (voice = energy/frequency/resonance/calibration); compliance language ("traditionally associated with", "reference tool · not medical advice"); deterministic engine (same birth data → same output, no `Math.random`).

---

## 2. Architecture essentials (so you don't re-discover them)

- **Routing is Zustand screen-state, NOT URL routes.** `screen` field in the store (`src/lib/store.ts`); add a screen = extend `AppScreen` union (`src/types/index.ts`) + a render block in `src/app/page.tsx`. **As of v5, `screen` + `sessionTime` ARE persisted** to `localStorage` key `astryx-storage` (reload resumes the last view).
- **The engine pipeline (`src/lib/engine.ts` `runEngine`):** intake → `/api/chart` (astronomy-engine) → tri-source scoring (`computeActivePlanets`) → **`NarrativeSignalParser`** folds free-text into the symptom signal + intention biases the regulator (`RemedyPolarityEngine`) → `buildSignalHierarchy` (primary/secondary/tertiary + `reportedPlanet`) → 5-sense protocol + diagnostic + cell salts + Sacred Tea. Emits `ProtocolOutput` (the ONE source of truth) incl. `signalHierarchy`, `dominantPolarity`, `reasoningTrace`.
- **Fork sequence (single source):** `src/lib/chamber/forkRite.ts` → `buildForkSequence({hierarchy, polarity, architecture, durationSec})` + **`forkSequenceDisplay(steps)`** (used by BOTH the Chamber/Summary snapshot AND the Results label so they always match). Containers + phase architectures live in `src/lib/chamber/durationPresets.ts` (`15_PERSONAL`/`30_DEEP`/`60_PRACTITIONER`).
- **Cell-salt facets:** `src/lib/cellSaltKeynotes.ts` (additive; `cellSalts.json` is the untouched physical/Mineral-Foundation source).
- **Audio:** `src/lib/astryxPlayer.ts` (HTMLAudio singleton, real `isLive`/`hasError`/`onStateChange`), `src/lib/astryxAudioLibrary.ts` (catalog + R2 URL builder + `/api/catalog` manifest merge), `src/lib/fallbackTone.ts` (Web Audio oscillator at the calibrated Hz when a track fails), `src/lib/audioSession.ts` (single panic-stop owner). Chamber is **music-only** (Tone.js `soundEngine.ts` is dormant).
- **Visuals:** Chamber view toggle (Body/Color/Mandala/Combined). Mandala renderer ladder = Art PNG → WebGL (gated OFF) → **SVG Sacred Geometry (default)**. Art pipeline ready: drop PNGs in `public/images/mandalas/{planet}[-{state}].png` (guide: `MANDALA_ART_GUIDE.md`). The user-facing Auto/3D/SVG pill was removed in v5 (renderer auto-selects).

---

## 3. PHASE 7 — GO-LIVE CHECKLIST (the actual work)

Ordered roughly by launch-blocker priority. Items marked **[SHA]** need her assets/accounts/decisions; items marked **[BUILD]** are codeable.

### A. Production configuration **[SHA + BUILD]** — launch blocker
Set real values in Vercel project env (`astryx`), then redeploy:
- `NEXTAUTH_SECRET` (`openssl rand -base64 32`), `NEXTAUTH_URL` = the real production domain.
- `NEXT_PUBLIC_AUDIO_BASE_URL` → the R2 bucket base (see B).
- Payments: `NEXT_PUBLIC_XRP_ADDRESS` = SHA's real wallet, `XRP_NETWORK=mainnet` (currently testnet).
- Optional: `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (Google sign-in).
- Feature flags when ready: `NEXT_PUBLIC_SHOP_LIVE`, `NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE` (gate sacredtea.net CTAs — keep false until product pages live).
- Custom domain on Vercel (replace n-pi-jet.vercel.app); update `NEXTAUTH_URL` to match.

### B. Audio hosting — reduce tone-only fallback (v5 FIX 5) **[SHA + BUILD]**
The oscillator fallback is correct and should stay. But tracks shouldn't routinely 404 (SHA saw "Track unavailable" on Mercury). Host the fork MP3s on the project's own **Cloudflare R2** bucket, point `NEXT_PUBLIC_AUDIO_BASE_URL` at it, and regenerate `catalog.json` so the manifest mirrors the bucket (the catalog-must-mirror-bucket rule). Path shape: `{base}/{planet}/{state}/{FILE}.mp3`. SHA supplies the audio files + bucket; agent wires/validates.

### C. Desktop layout — finish the responsive recomposition (v5 FIX 1 remainder) **[BUILD + SHA eyes]**
Mobile is good. Still **deferred pending on-device review** (don't build blind — it's how overlap regressions ship):
- **Results** = true desktop 3-column dashboard (left signal/chart, center insight/weather/routing, right protocol/salts/tea + sticky Enter Chamber). Currently widened single-column.
- **Chamber** = desktop panel regions (centered visual, left fork-info, right controls/music). Mobile overlap is fixed; desktop panelization remains.
- **Ask SHA for 2–3 screenshots** (desktop Results, desktop Chamber, mobile) and compose to match what she sees.

### D. Two UI items SHA flagged to verify/clean **[BUILD]**
- The breath caption showed **"Alternate Nostril · 02:41"** — confirm whether that `02:41` is a leftover **visible timer** (v1 Fix 6 removed timers; this may be a missed breath/phase countdown). If so, remove/relabel.
- Re-confirm the visual-mode toggle row reads clean on mobile after the v5 pill removal (SHA last verified the overlap fix; confirm this too).

### E. Backend persistence (original Phase 2 roadmap item) **[decision + BUILD]**
History/sessions are `localStorage`-only. For cross-device + the Practitioner client roster + Sacred Vault tie-in, migrate to **Supabase** keyed to the authenticated user (keep localStorage as offline cache; trim large `protocol` blobs to references). **Decide at launch:** ship v1 device-local (fine for individual free tier) vs. require this for paid/practitioner. Not a hard blocker for an individual-tier soft launch.

### F. Billing / tiers **[SHA decision]**
`CLAUDE.md` describes 3 tiers ($9.95 / $39.95 / $59) but only the **XRP one-time unlock** rail is built. Decide launch billing: XRP-only to start, or wire Stripe subscriptions (not built). Practitioner gating already keys off `session.isPremium`.

### G. Launch hygiene **[BUILD]**
- PWA manifest/icons, OG/meta tags + favicon, page `<title>`/description.
- Legal pages: Terms + Privacy; confirm the persistent micro-disclaimer renders on every screen + the practitioner attestation flow (COMPLIANCE.md §10).
- Analytics (privacy-respecting) if desired.
- Final cross-device pass (desktop / tablet 768 / iPhone 390–430) once C is done.

### H. Nice-to-have / later
- Mandala AI art into `public/images/mandalas/` (engine + guide ready).
- WebGL mandala re-enable (gated off; validate on target GPUs first).
- Frequency Lab + PDF export (original roadmap, not built).

---

## 4. How to work in this repo
```
cd "…/MARKETING/astryx_v14"
npx tsc --noEmit            # must be 0
npm run build               # must be 10/10 (if EINVAL readlink → rm -rf .next, rebuild)
vercel --prod --yes         # deploy → aliases to n-pi-jet.vercel.app (until custom domain)
```
- **You can't see rendered output here** — lean on `tsc`/build + ask SHA for device screenshots for any layout/visual work. Don't blind-rebuild complex absolute-positioned screens.
- Compliance + vocabulary lock on every changed string: **frequency / resonance / session / system / tone / scan / calibration**; never ritual/rite/ceremony/mystical/occult. "Traditionally associated with…", "reference tool · not medical advice."
- Verify visual components SSR-side by temp-routing + `curl` + grep markup when needed (no GPU).

---

## 5. Decisions log (don't re-litigate)
- Routing = Zustand screen-state (not URL); `screen`+`sessionTime` persisted (v5) so reload resumes.
- ONE `ProtocolOutput` + ONE `buildForkSequence`/`forkSequenceDisplay`; every surface reads from it (no separately-derived display strings).
- Cell-salt fix is an **additive** `cellSaltKeynotes.ts` — `cellSalts.json` stays untouched (Mineral Foundation + Carey/Bonacci gestation surfaces).
- Tone-only audio fallback is **correct** — keep it; just reduce how often it triggers via real hosting.
- Voice: energy/frequency/medical-astrology, NOT spiritual/occult/ritual — SHA is personally spiritual; the **app** is not. (Persisted in agent memory: `astryx-voice-positioning`.)
- The Auto/3D/SVG renderer pill is intentionally **gone** (renderer auto-selects; SVG default).
- Desktop multi-panel layout is intentionally **paused for on-device iteration**, not forgotten.

---

*End of Phase 7 handoff. The app is built, green, and deployed to staging. Phase 7 = configure production (A), host the audio (B), finish desktop layout with SHA's eyes (C), verify D, decide E/F, ship hygiene (G), launch.*
