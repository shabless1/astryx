# ASTRYX — Final QA Checklist (for human testers)
### Final QA Repair Pass · v1.4.0 · 2026-06-15 · https://n-pi-jet.vercel.app

Headless/automated QA cannot verify real audio fidelity or true sub-500px touch
behavior. These checklists are for a **human tester on real devices**. Mark each
item ✅ / ❌ and note device + browser + what you expected vs. what happened.

---

## A · Audio QA (must verify on a real device, headphones on)
- [ ] Enter Chamber → **silence**. Nothing plays until you press **▶ Play**.
- [ ] After Play: music begins; **❚❚ Pause** pauses and resumes.
- [ ] **■ Stop** fully stops audio (returns to the Play state).
- [ ] **Volume** slider changes loudness; **🔊/🔇 Mute** silences and restores.
- [ ] **Scrubber** seeks within the track; elapsed / total times update.
- [ ] **◄◄ / ►►** change the song (calibrated variant) for the current aspect.
- [ ] **↺ Replay** restarts the current track from 0:00.
- [ ] **Customize** → song list opens; picking a variant switches it and **persists** after leaving + returning.
- [ ] No audio plays **outside** the Chamber and Music tab (report screens are silent).
- [ ] No unintended **overlap** (two tracks at once) when changing songs or steps.
- [ ] Sound feels **dimensional**, not flat/thin.
- [ ] Chamber audio works on **desktop** AND **mobile** (mobile needs the Play tap to unlock audio).

## B · Mobile QA (must verify on devices)
- [ ] iPhone Safari · iPhone Chrome · Android Chrome · tablet · portrait · landscape.
- [ ] Intake fields are usable (date/time pickers, location autocomplete).
- [ ] All buttons visible and reachable (no off-screen/trapped controls).
- [ ] Chamber transport controls reachable with a thumb.
- [ ] Music list scrolls correctly; favorites/sequences usable.
- [ ] **Body Grid:** tapping a glowing region/glyph opens the detail panel (and it scrolls into view).
- [ ] Results page: no large blank black gaps while scrolling, including after **See Why** expands/collapses. *(Flagged for in-browser repro — see Notes.)*

## C · Accuracy QA (covered by Phase 1 — re-spot-check)
- [ ] Enter a known chart with birth time → Sun/Ascendant look correct.
- [ ] Enter the same with **unknown** time → "☉ Solar Chart" labels appear on Intake + Results; house/angle caveat shown.
- [ ] No false **Saturn Return** banner on charts that aren't near a Saturn return (e.g. a 1957 birth in 2026 should NOT show one). *(Validated in `ASTRYX_CHART_VALIDATION.md` — 10 charts, all pass.)*
- [ ] Transit ("Cosmic Weather") reflects the current sky.

---

## D · Full test paths (Phase 15)

### Individual mode
1. Enter birth data **with** known time → generate.
2. Enter birth data **with unknown** time → generate (Solar Chart labeled).
3. Complete the resonance scan (tap statements; tap a "balanced & strong" toggle — descriptors appear).
4. Add free-text narrative + an intention.
5. Review **Results**: Calibration Insight, Cosmic Weather, 5-Sense Calibration Plan, Prepare your Chamber.
6. Open a Cosmic Weather transit → see a fork suggestion (no audio).
7. Enter Chamber → Play / Pause / Stop / Skip / Mute / Replay / scrubber.
8. Customize a song variant → exit + return → variant persisted.
9. **Refresh the page** → the active reading is still there (Results/Chart/Body Grid/Chamber reachable).
10. Open **History** → the generated reading is listed; tap to reopen it.
11. Open **Chart** and **Body Grid** → tap body regions (detail panel opens).
12. Open **Music** → favorite a track; build & save a "My Chamber" sequence; play it.
13. Open **Settings** → version reads **1.4.0**; Chamber Audio copy matches manual (audio only in Chamber/Music).

### Practitioner mode
1. Toggle Practitioner.
2. Generate a client protocol → review the practitioner assessment + confidence %.
3. Add session notes; generate/verify the printable protocol sheet.
4. Confirm safety/probabilistic language; **no raw snake_case or audio codes** anywhere.
5. Client-ready language reads professional.

### Devices
- Desktop Chrome · Desktop Safari · iPhone Safari · Android Chrome · Tablet.

---

## Notes for the tester
- **Blank-gap (Results):** could not be reproduced in the headless build. Suspect the expanded **See Why → ChartTabs** (tall Natal Wheel / Body Map containers). Please capture a screenshot + the screen width if you see voids.
- **Raw codes:** Phase 3 humanized breath/body keys at the engine source and Phase 6 humanized track labels to "Planet · State · Variant". If you still spot a `snake_case` or a `SUN_NAT_01`-style code anywhere, note the exact screen.
- **Manifest growth (Music library):** new songs appear only after a real `catalog.json` is uploaded to the R2 bucket (the proxy + fallback are in place). The current 172-song seed already powers the variant chooser.
