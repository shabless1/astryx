# ASTRYX — Session Handoff · 2026-06-25

This document lets the next session pick up cold. Read it first.

---

## 0. STATE AT A GLANCE

- **Everything built this session is on Vercel PREVIEW only. NOTHING has been promoted to production.**
- Latest preview (all changes below): **https://astryx-hg8ztjw71-shabless1s-projects.vercel.app**
- Verify gate every change: `npx tsc --noEmit` (expect 0) + `npm run build` (green) + `vercel --yes` (preview).
- Working dir: `astryx_v14/`. Build env: Windows, OneDrive path → **the local `preview_*` launcher does NOT work here; `vercel build` fails on an EPERM symlink. Use remote `vercel --yes` for previews. SHA is the on-device visual gate** — the agent cannot see rendered output.
- Production promote command (only when SHA says go): `vercel --prod --yes`.

---

## 1. WHAT WAS DONE THIS SESSION (chronological)

### A. Dashboard → horizontal tabbed "Daily Check-In"
- `src/components/screens/DashboardScreen.tsx` rebuilt: a horizontal tab nav (no endless scroll). Tabs: **Check-In · Today's Pulse · Summary Report · Explore Deeper · Chart · Body Map · History**.
- Title is **"Daily Check-In"**. Standalone old `DailyCheckInScreen` retitled too (rarely reached now).
- After a Chamber session, individual users land on the Dashboard with the **Summary Report** tab active (post-session check-in + Save live inside it). Practitioners still get `post-session`.
- New shared component `src/components/screens/dashboard/ExploreDeeperCards.tsx` — the deep cards, used by both Dashboard and `PostSessionSummary`.
- Routing in `src/app/page.tsx`: `goHome`/mount/`handleNav` route to `dashboard` (the dashboard opens its Check-In tab when the day is stale). `handleAnalyze(postTarget?)` added; `handleDailyCalibrate` → `handleAnalyze('dashboard')`. `handleCompleteSession` → individuals to `dashboard` (pendingSession drives the Summary tab).

### B. Body-map planet "Play tone" parity
- `src/components/engine/BodyMap.tsx`: planet rows in the detail panel now have a **▶ Play fork** button (plays the planet's Cousto Hz via `pureTone`), mirroring the chakra Play Tone. One shared player; tapping another stops/swaps; auto-stops on panel close.

### C. Chamber mandala — the long saga (see §3 for the rejected lineage)
- Final approved engine: `src/components/engine/mandala/CymaticMandala.tsx` — **Canvas2D sacred-geometry forms drawn to an offscreen texture, echoed through a Three.js depth tunnel (stacked additive planes), gentle 3D turn/parallax.**
- Per-planet **5-colour palettes** + **clean single geometric form** (rose/orbital-ring "circle" decorations were REMOVED at SHA's request):
  - Sun=Seed of Life · Moon=Vesica · Mercury=Metatron · Venus=Flower of Life · Mars=Star(hexagram) · Jupiter=golden spiral · Saturn=Metatron · Uranus=Star · Neptune=Flower of Life · **Pluto=4D Tesseract** (real 4D hypercube, projected 4D→3D→2D).
  - Palettes (authored, used as-is) live in the `PLANETS` map in `CymaticMandala.tsx`.
- **Background is now PURE BLACK** (`renderer.setClearColor(0x000000, 1)`). All star/twinkle/colour-wash layers were REMOVED (SHA: "remove the lights... just a black background"). This was the LAST change of the session.
- Renderer mounts via `src/components/engine/KaleidoscopeMandalaCanvas.tsx` (cymatic primary, SVG fallback on reduced-motion / WebGL failure). `MandalaChamberView` / `CombinedChamberView` pass `phaseProgress`.

### D. Chamber + flow fixes (most recent punch list)
- `TodaySignalScreen`: removed the "Go deeper" section (now Dashboard-only) — `page.tsx` no longer passes `onGoDeeper`.
- `CombinedChamberView.tsx`: body map seated in a band BELOW the fork-label header (`top:196 bottom:176`) so they no longer overlap.
- Mandala bigger (plane 3.0, camera z 3.1, R=OS*0.34) + dimmer (glowPulse ceiling lowered, layer opacities lowered).
- `ChamberBodyMap.tsx`: contact fork-placement dot is now a bright white core + colored glow halo with a **slow in/out pulse** (`forkDotPulse`/`forkDotCore` keyframes in `globals.css`).
- Music (`SoundEngineController.tsx`): **session song rotation** — a fork repeated in a session advances to the next variant (never replays the same song); **auto-skip** past a track that fails to load (routes around catalog/bucket 404s).
- Page-title top spacing standardized to `paddingTop: 96` on the cramped screens (Dashboard, TodaySignal, DailyCheckIn, Results).
- **Global floating "✦ Ask Astryx"** launcher in `page.tsx` (right-edge tab, every screen except auth/payment/analysis/subscribe-gate) → opens `TeacherChat` (sovereign, local `answerAstryx`).

### E. Music infra (Vercel)
- `NEXT_PUBLIC_AUDIO_BASE_URL` was Production-only; added to **Preview** scope (via Vercel REST API) so previews play music. Value: `https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev`.

---

## 2. OPEN / PENDING (next session)

1. **Promote to production** when SHA approves: `vercel --prod --yes`. Bundles mandala + dashboard tabs + body-map tones + Ask Astryx + chamber fixes.
2. **Earth grounding songs** — SHA said she'd upload new Earth-fork songs (2026-06-25). The "track unavailable" clears once the MP3s are in R2 AND `catalog.json` mirrors the bucket (or the seed `CATALOG` in `sunoLibrary.ts`/`astryxAudioLibrary.ts` includes them). See `memory/suno-audio-r2-pipeline.md`.
3. **Ask Astryx depth (BIG, requested, NOT built):** make the bot answer about EVERYTHING (cell salts, anatomy, every transit, placements, crystals, herbs) and *act* (change the music, jump tabs). Needs: (a) full-library retrieval wired into `src/lib/astryx/sovereignAstryx.ts`; (b) a small command/tool layer so the chat can trigger app actions. Keep it sovereign (no third-party egress) per `memory/teacher-sixth-sense.md` + `astryx-voice-positioning.md`.
4. **Mandala visual is still SHA's pain point** — she is frustrated and considered scrapping it. It is currently: clean single geometric form per planet, neon gradient, 3D depth tunnel, **pure black background**. Do NOT add lights/fog/twinkles/colour washes again. If she wants changes, get a concrete reference first.

---

## 3. MANDALA — REJECTED LINEAGE (do NOT repeat)

Every one of these was built and rejected; see `memory/astryx-mandala-direction.md`:
1. 3D height-field "dome" → "blob/dish/pizza".
2. Nodal-line cymatic figure → "pizza", flat.
3. Particle "sand" field → "speckled… witches spell".
4. GLSL aurora/plasma shader → "creepy / nightmare on elm street / death chamber".
5. Light pastel aurora → rejected.
6. Liquid-wobble lines → "spaghetti".
**Approved:** crisp neon sacred-geometry, gradient sweep, breathing glow, 3D depth tunnel, Pluto=tesseract, **black background, no extra lights.** Iterations she liked were always: dark/black ground, clean lines, NOT busy, NOT bright-centered, NOT foggy.

---

## 4. KEY FILES TOUCHED THIS SESSION

- `src/components/engine/mandala/CymaticMandala.tsx` — the mandala engine (Canvas2D forms + Three.js tunnel, black bg).
- `src/components/engine/KaleidoscopeMandalaCanvas.tsx` — mount/fallback.
- `src/components/engine/MandalaChamberView.tsx`, `CombinedChamberView.tsx` — chamber views (phaseProgress, combined spacing).
- `src/components/engine/ChamberBodyMap.tsx` — pulsing fork dot.
- `src/components/engine/BodyMap.tsx` — planet play-tone.
- `src/components/engine/SoundEngineController.tsx` — song rotation + auto-skip.
- `src/components/screens/DashboardScreen.tsx` — tabbed dashboard.
- `src/components/screens/dashboard/ExploreDeeperCards.tsx` — deep cards (Current Pulse merge).
- `src/components/screens/PostSessionSummary.tsx` — embedded mode.
- `src/components/screens/TodaySignalScreen.tsx`, `DailyCheckInScreen.tsx`, `ResultsScreen.tsx` — title spacing / go-deeper removal.
- `src/app/page.tsx` — routing, global Ask Astryx, completion flow.
- `src/styles/globals.css` — `no-scrollbar`, `forkDotPulse`, `forkDotCore` keyframes.

Standalone proof artifacts at repo root (decision tools, not wired in): `sacredgeo_neon_proof.html` (approved 2D look), `liquidlight_proof.html`, `cymatics_proof.html`.

---

## 5. GROUND RULES (carry forward)

- SHA is the architect; never ask her to code. Decide, document, move.
- Cannot preview locally (OneDrive) — verify via tsc+build, deploy a Vercel **preview**, let SHA eyeball. Do NOT `--prod` without her word.
- Voice: energy/frequency/medical-astrology; no ritual/occult/mystical language. Probabilistic framing; compliance via `lib/compliance.ts`. Malachite red warning intact.
- Two frequency systems kept separate: planetary protocol = Cousto (`planetary-anchors.json`, `sacredTones_nervousSystem.json`); chakra layer = Solfeggio.

---

## 6. ADDENDUM — end of session (final two requests)

### Mandala FULLY REVERTED to pre-session
- SHA: "return all the mandalas to what they were before you first touched them this session." Done.
- `src/components/engine/KaleidoscopeMandalaCanvas.tsx` was rewritten back to the original WebGL→SVG ladder: it renders **`SacredGeometryMandalaView` (SVG sacred geometry, the original)** by default. `mandalaPerformanceFallback.ts` has `ENABLE_WEBGL = false`, so SVG is the default everywhere; WebGL only if forced + supported, with context-loss → SVG.
- `CymaticMandala.tsx` + `cymatics.ts` are now **unused dead files** (left on disk, not imported). The whole cymatic/3D/tesseract experiment is OUT of the app. The `astryx-mandala-direction` memory still documents the rejected lineage — but note the app is now back on the original SVG mandala. Do NOT re-introduce the cymatic engine unless SHA explicitly asks.

### Earth Day = session START, Earth Year = session END (locked)
- SHA added **Earth Day + Earth Year folders to R2** and wants an Earth Day song ALWAYS at the start of every chamber session and an Earth Year song ALWAYS at the end.
- `astryxAudioLibrary.ts` CATALOG: added **`earthyear`** (NAT-only), alongside existing **`earthday`**.
- `SessionScreen.tsx`: `audioForkPlanet` override — `stepIdx === 0` → **`earthday`**, `isClosingStep` → **`earthyear`**, else the normal fork planet. Passed to `SoundEngineController` as `currentForkPlanet` (AUDIO ONLY; the visual planet/mandala is unchanged).
- `SoundEngineController.tsx`: `PLANET_DISPLAY` map shows "Earth Day"/"Earth Year" instead of raw `earthday`/`earthyear` in the player.
- **⚠ R2 NAMING ASSUMPTION — verify against the actual bucket:** the app expects folder `earthday/nat/` with files `EARTHDAY_NAT_01..04.mp3` and folder `earthyear/nat/` with `EARTHYEAR_NAT_01..04.mp3` (URL shape `{base}/{folder}/nat/{FILE}.mp3`). If SHA's real folder/file names differ, either rename in R2 to match, or update the `earthday`/`earthyear` arrays in `astryxAudioLibrary.ts` (and/or upload a regenerated `catalog.json` to the bucket root so the manifest merges them — see `memory/suno-audio-r2-pipeline.md`). The session song-rotation + auto-skip already pick "any one of" the Earth songs and route around a 404.
- Latest preview with §6: https://astryx-phi9k6evv-shabless1s-projects.vercel.app

---

## 7. ADDENDUM — song-selection engine fix (final change of session)

SHA reported the recalibration song selection was wrong: session not ending on Earth Year, Earth default playing the 3rd track, tracks repeating / not matching the fork, and an OVERSTIMULATED Mars signal playing Mars throughout instead of Venus/Moon. Root cause + fixes:

- **Root cause:** the 15/30/60 container architectures (`durationPresets.ts`) place the **primary** planet into the Primary + Primary-Return phases. So an overstimulated (excess) primary dominated the whole session by design.
- **`forkRite.ts → resolvePlanets` (THE key change):** now branches on `polarity.dominant_state`.
  - **excess / blocked (overstimulated)** → Primary + Primary-Return phases are filled with the **corrective regulators** (`protocol.regulator_planets` reg0/reg1, e.g. Mars-excess → Venus + Moon). The fork held AND the song played are the regulators. The loud planet is no longer repeated.
  - **deficiency / balanced** → unchanged; still leads with the primary signal (activate it).
  - ⚠ This DELIBERATELY supersedes the old "play the primary's own EXC track (correction baked in), never the regulator" rule FOR OVER-STIMULATED STATES ONLY. Documented in `memory/suno-audio-r2-pipeline.md`. Do NOT revert without SHA.
- **`SoundEngineController.tsx`:** Earth layers (`earthday`/`earthyear`) now DEFAULT to the **1st track** (index 0), not the seed-picked one (`isEarthLayer` branch on `variantBase`). Other planets keep their seed default. (Session song-rotation + auto-skip-on-404 from §1.D still apply.)
- Songs now follow the fork per phase via `SessionScreen.audioForkPlanet` → controller (already wired in §6).
- **Still TODO / verify:** confirm the R2 Earth file names match (§6 caveat) — if they 404, Earth Day/Year won't sound. After SHA confirms the whole session audio is right on-device, **promote to production** (`vercel --prod --yes`).
- Latest preview with §7: **https://astryx-cm1ghnit9-shabless1s-projects.vercel.app**

### Companion doc
- `COWORK_QA_BRIEF_2026-06-25.md` (repo root) — the pressure-test brief handed to Cowork; mirrors the testable surface + known gaps.

---

## ADDENDUM — 2026-06-28 (domain + launch lock)
- **Domain attached (Vercel side done):** `myastryx.com` (apex) + `www.myastryx.com` added to the astryx project; awaiting SHA to create the Cloudflare DNS records (A @ → 76.76.21.21, CNAME www → cname.vercel-dns.com, grey-cloud, SSL Full). State reads "Invalid Configuration" in Vercel until DNS is added — expected. Vercel auto-verifies + issues the cert after.
- **Pending after DNS verifies:** set `NEXTAUTH_URL=https://myastryx.com` (Production) + redeploy so user logins are branded on the new domain. Held until DNS is live so current n-pi-jet login testing keeps working.
- **Practitioner portal LOCKED for launch:** `PRACTITIONER_LOCKED = true` in `IntakeScreen.tsx` — the mode toggle shows Practitioner with a padlock, non-clickable. Flip to false to re-open. Live in prod (deploy astryx-pm0cbt5t6).
- **Astryx brain LIVE:** Gemini via @google/genai SDK (new AQ. key), verified answering on n-pi-jet.vercel.app.
- **Google sign-in WIRED + LIVE (2026-06-28):** GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET set in Vercel Production; NEXTAUTH_URL set to https://n-pi-jet.vercel.app for now (verified: /api/auth/providers lists google + credentials). AT LAUNCH: switch NEXTAUTH_URL to https://myastryx.com + redeploy; the myastryx redirect URIs are already registered in Google Console.
- **myastryx.com LIVE (2026-06-28 night):** Cloudflare DNS set (A @ 76.76.21.21 grey, CNAME www → cname.vercel-dns.com grey, SSL Full). Both apex+www aliased to prod. www serving 200; apex SSL cert finishing. NEXTAUTH_URL flipped to https://myastryx.com + redeployed. Google redirect URIs for myastryx already registered. Optional polish later: set www→apex 301 redirect in Vercel project Domains (currently both serve directly).
