# ASTRYX — Daily Dashboard build spec (turnkey handoff)
### Written 2026-06-21 at a clean green boundary. Build this next.

**Read first:** `PHASE7_GOLIVE_HANDOFF.md` + agent memory `astryx-phase7-golive` (current state, constraints, the whole-sign chart, audio rules, the "Home = Intake now" change). Then this.

---

## 0. Working constraints (do not relearn the hard way)
- **You cannot see rendered output** — the Claude preview launcher fails on this OneDrive path (spaces). **SHA is the on-device visual gate.** Build to spec, verify `npx tsc --noEmit` (expect 0) + `npm run build` (expect green), deploy `vercel --prod --yes` from `astryx_v14/` (aliases to https://n-pi-jet.vercel.app), then ask SHA to look. Don't blind-rebuild complex layouts.
- Voice: energy/frequency/calibration; never ritual/occult/mystical. Compliance: "may suggest", "reference tool · not medical advice", **no dosages**.
- Chamber is **music-only** (no synthesized tone in the session). The chakra `pureTone.ts` is a separate deliberate feature, fine to reuse for tone previews.
- `new Date()` / `Math.random()` are fine in app runtime (the ban is only for Workflow scripts).

## 1. What SHA asked for (keep it SIMPLE — let the AI bot do the heavy lifting)
A daily-return hook. A small **"Today's Temperature"** read — **Cool / Warm / Hot** — from the day's transits to the user's natal chart, **weighted toward Sun/Moon hard aspects**. Plus: the headline transit in plain language, a **suggested fork**, and a one-tap **"Begin today's session"** → quick session → Chamber. *Taddah.* Later, the **Astryx chatbot** answers "what's today's temperature?" and auto-populates that session (chatbot = Phase 2; build the dashboard now, leave a clean hook for the bot).

## 2. The data — already solved
- **Today's transits:** `calculateTransits(natalChart, new Date())` in `src/lib/ephemeris.ts` (line ~625). Returns `TransitAspect[]` sorted by weight (highest first). Runs client-side. `natalChart` = the store's `chartData` (from `/api/chart`). Inspect the `TransitAspect` shape in `ephemeris.ts` (transiting planet, natal planet, aspect, applying, exactness/orb, weight).
- The engine's `protocol.diagnostic.activeTransits` (type `ActiveTransit` in `types/index.ts`) is the *reading-time* transit set WITH plain-language `interpretation.{effect,intervention,duration}` + `lifeEvent`. For an always-current dashboard prefer recomputing with `calculateTransits(..., new Date())`; reuse the `interpretation` lookup (see `engine.ts` transit-interpretation section, ~line 239) to add plain-language text.
- **Fork for a planet:** `PLANET_TO_FORK` map + `forkFor()` in `src/lib/chamber/forkRite.ts` (planet → SacredFork → `.hz`). Moon→'Full Moon'.

## 3. Temperature algorithm (concrete starting point — deterministic; tune later)
For each transit in `calculateTransits(natal, today)`:
- aspectHeat: conjunction/square/opposition = **+** (hot/active); trine/sextile = **−** (cool/supportive).
- planetHeat (transiting): Mars/Sun **+2**, Uranus/Pluto **+1.5**, Jupiter **+1**, Mercury/Venus **+0.5**, Saturn **−1** (heavy/cooling), Moon/Neptune **−0.5**.
- **Sun or Moon making a HARD aspect to a natal planet → ×1.5 weight** (SHA's emphasis).
- contribution = aspectHeat × planetHeat × exactness(0..1). Sum → `tempScore`.
- Map: `tempScore` below low threshold → **Cool**, mid → **Warm**, high → **Hot** (pick thresholds from a couple of real charts, document them).
- Headline transit = the highest-weight transit. Suggested fork = `forkFor(headline.transitingPlanet)` (or the corrective regulator if the transit is hard — your call; keep simple).

Put this in a small `src/lib/dailyTemperature.ts` (pure function: `(natalChart, date) => { temperature: 'Cool'|'Warm'|'Hot', score, headline, suggestedForkPlanet }`). Easy to unit-reason and reuse for the chatbot.

## 4. Screen + routing
- New `AppScreen` value `'dashboard'` in `src/types/index.ts`; render block in `src/app/page.tsx`; needs `protocol` + `chartData` (guard like other screens).
- **NOTE:** Home now routes to the Intake form (NavBar "Home" → `intake`, logo → `intake`, mount/return → `intake`; store coerces persisted `'home'`→`'intake'`). The old `HomeScreen.tsx` daily-hub is deprecated/unreachable — **you may repurpose it as the dashboard** (it already has the cosmic-weather + symptom-chip scaffolding) OR build a fresh `DashboardScreen.tsx`. Decide and document.
- Add a nav entry for the dashboard (e.g. a "Today" tab, `needsProtocol: true`) in `src/components/layout/NavBar.tsx`. Don't reintroduce a "Home"→hub item.
- One-tap session: set `chamberDurationKey` to `'15_PERSONAL'` and call the existing `handleStartSession()` in `page.tsx` (it routes to the Chamber). The session uses the current `protocol`; if you want the session keyed to the *transit* rather than the stored reading, that's a v2 — start with the stored protocol + a 15-min container.

## 5. Definition of done (v1)
1. A "Today" dashboard shows **Cool/Warm/Hot** + one headline transit (plain language) + a suggested fork + **"Begin today's session"** → Chamber.
2. Reads today's transits via `calculateTransits(chartData, new Date())`; temperature from `dailyTemperature.ts`.
3. Simple, low-scroll, mobile-first. No dosages, voice/compliance clean.
4. tsc 0 · build green · deployed · SHA confirms on device.
5. Leave a clean seam for the Astryx bot ("what's today's temperature?" → reuse `dailyTemperature.ts` → populate the quick session). Bot itself is Phase 2 — do NOT build the chatbot now.

## 6. Still-open small items (from prior session, optional)
Curved sign-name upright check (bottom half of chart wheel); Mars-twice alternating natal/traditional placement; app-wide 8-year-old language pass (post-session done, Intake/Today's Signal/Results remain); detail-panel copy → 8yo; on-device gut-checks (mandala vibrancy, Neptune session completes).
