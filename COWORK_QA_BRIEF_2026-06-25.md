# ASTRYX — Cowork QA / Pressure-Test Brief · 2026-06-25

For Claude Cowork: run an exhaustive functional pass against the latest build. This
lists what the app does, what changed recently (hammer these hardest), the expected
behavior, and known caveats so you can tell real bugs from known gaps.

---

## TEST TARGET
- **Preview URL:** https://astryx-cm1ghnit9-shabless1s-projects.vercel.app
- It's a Vercel **preview** (not production). Music env (`NEXT_PUBLIC_AUDIO_BASE_URL`) IS set for preview, so audio plays.
- Stack: Next.js 14 (App Router), client-rendered screens switched by Zustand `screen` state (NOT URL routes). State persists in localStorage (`astryx-storage`).
- No accounts needed — the free/individual flow works without sign-in.

---

## WHAT THE APP DOES (full surface to exercise)

**Core flow:** Intake (birth data) → Analysis (~3.5s) → Today's Reading (one card) → Chamber session → Dashboard.

1. **Intake** — name, birth date, birth time (or "I don't know my time" → Solar Chart), birth city (geocode autocomplete), symptoms, emotional state, intention. Submit → analysis.
2. **Today's Reading (one card)** — Signal · Carrier · why · today's fork sequence · today's element. Buttons: Enter Resonance Chamber, Ask Astryx. (The old "Go deeper" link was removed — depth lives in the Dashboard.)
3. **Chamber session** (the core experience) — fullscreen. Phase ribbon (e.g. 1/5), a fork sequence that advances through phases, and 4 visual modes via the toggle: **Body · Color · Mandala · Combined**.
   - **Music player** (bottom): Play/Pause, scrubber, prev/next song, stop, replay, volume/mute, Default|Customize song chooser. Music is the only chamber audio (no synth tone).
   - **Body / Combined** show the body map with a fork-placement dot + "Where to hold the fork" Front/Back.
4. **Dashboard** ("Daily Check-In") — horizontal tab nav: **Check-In · Today's Pulse · Summary Report · Explore Deeper · Chart · Body Map · History**.
5. **Global "✦ Ask Astryx"** — floating tab on the right edge of every screen (except auth/payment/analysis/subscribe-gate). Opens a sovereign chat (answers locally from the user's chart/reading/session — no third party).
6. **Music Library**, **Settings** (Animation Intensity Low/Med/High, mode), **History** (saved sessions + readings), **Practitioner** screens (premium-gated), **XRP Payment**, **Subscribe gate** (30-day trial clock).

---

## CHANGED THIS SESSION — TEST THESE HARDEST

### A. Recalibration song-selection engine (just rewritten — highest priority)
- **Overstimulated → counterweights.** If today's signal is **excess or blocked** (overstimulated), the session must be **led by the corrective regulator planets**, NOT the loud signal planet. Example: Mars-excess → you should hear/see **Venus and Moon** forks across the primary phases, NOT Mars repeating.
  - **Test:** run intakes that produce an excess/blocked dominant signal; confirm the fork sequence + the songs are the regulators, and the loud planet is NOT playing throughout.
- **Deficiency/balanced → primary.** An under-active signal should still draw on the primary planet itself. Confirm the contrast.
- **Songs match the fork per phase.** As the session advances phase to phase, the playing song must change to the current fork's planet (Venus phase = Venus song, etc.). No track should play through a phase it doesn't belong to.
- **Repeated fork → different song.** If the same planet appears twice in a session, the 2nd occurrence should play a DIFFERENT variant, not replay the same one.

### B. Earth bookends
- **Every session opens with an Earth Day song and closes with an Earth Year song** (audio only — the on-screen visual is the phase's own planet).
- **Earth default = 1st track** (not a random/3rd one).
- ⚠ **KNOWN CAVEAT:** this depends on the R2 bucket having `earthday/nat/EARTHDAY_NAT_0N.mp3` and `earthyear/nat/EARTHYEAR_NAT_0N.mp3`. SHA was uploading these. If the opening/closing shows "track unavailable", it's the file names not matching the catalog — flag it as a DATA gap, not a code bug.

### C. Mandala = REVERTED to the original SVG sacred-geometry view
- The Chamber **Mandala** tab shows the original SVG sacred-geometry mandala (per-planet). All the cymatic/3D/tesseract experiments were removed this session. If you see a flat SVG mandala, that's CORRECT/intended now. (Do not report "it's not 3D" as a bug — that was deliberately reverted.)

### D. Dashboard tabs + Explore Deeper
- Dashboard is a horizontal tab bar (no endless scroll). Each tab shows only its section.
- **Explore Deeper** has: **Current Pulse** (merged "what's going on" + "sky weather"), Where it comes from, Minerals for you, The full notes.
- **Summary Report** tab: after a session it holds the post-session check-in (how do you feel now) + Save to Progress + before/after.
- **Today's Pulse** tab: temperature + today's transits vs natal + suggested fork + Begin session.

### E. Body Map play-tones
- On Body Map, tapping a **chakra** plays its Solfeggio tone; tapping a **planet** region plays that planet's Cousto fork tone (▶ Play fork). One at a time; tapping another switches; closing the panel stops it.

### F. Post-session flow
- Finishing a Chamber session lands the user on the **Dashboard → Summary Report** tab (individual users) with the check-in + Save. (Practitioners keep the standalone post-session page.)

---

## REGRESSION / EDGE CASES TO HIT
- Solar Chart mode (birth time unknown) — must be labeled "☉ Solar Chart" in wheel/PDF; flow still completes.
- New day vs same day: returning the next day should open the Dashboard on the **Check-In** tab (recalibrate); same day opens on **Today's Pulse**.
- Crisis-keyword text in the Check-In / Ask Astryx free-text → must surface crisis resources, not a normal reading.
- Compliance: probabilistic framing everywhere ("may suggest"); micro-disclaimer "Reference tool · Not medical advice" in footers; Malachite always shows a red polished/sealed-only warning.
- Animation Intensity Low on a slow device — chamber should stay smooth.
- Audio: switching visual modes must NOT restart/duplicate the music; leaving the chamber must stop all audio (no audio bleeding into other screens).
- Music "Customize" chooser: picking a variant persists across sessions; "↺ reset all" clears it.

---

## KNOWN GAPS (not bugs — don't over-report)
1. **Ask Astryx depth.** It answers from the user's chart/reading/session only. It does NOT yet answer about *everything* (cell salts, anatomy, every transit) and cannot *act* (change the music, jump tabs). That's a planned next build.
2. **Earth track 404s** until R2 file names match the catalog (see B).
3. Nothing is in **production** yet — all on preview.
4. Practitioner/XRP/Supabase auth are scaffolded; full billing/persistence is later-phase.

---

## HOW TO REPORT
For each issue: screen + exact steps + what you expected vs saw. Tag each as **CODE BUG**, **DATA/CONTENT GAP**, or **KNOWN GAP (per this brief)**. Prioritize A (song engine) and B (Earth bookends) — those are the freshest and most likely to surface real bugs.
