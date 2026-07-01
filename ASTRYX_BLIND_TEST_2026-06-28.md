# ASTRYX — Blind Test (live, www.myastryx.com) · 2026-06-28
### First-time user, no instructions, no account. Real browser walkthrough.

> Method: arrived cold at www.myastryx.com, took the "continue without an account" path, and went Intake → Reading → Astryx chat → Chamber as a naive newcomer. Live site, real Gemini, real geocoding. The questionnaire/feedback widget is not in yet (expected).

---

## VERDICT: Strong, beta-ready. The two systems you pushed hardest on — the recalibration engine and the Astryx brain — both work, live, confirmed. Flags below are refinements, with ONE worth verifying before beta (the chamber fork placement).

---

## WHAT WORKS (and it's a lot)

**Landing.** Loads clean on `www.myastryx.com` with valid SSL. Instantly clear: "recalibration, not predictions," what you'll get (5-Sense Plan + Chamber), reassurance you don't need to know astrology, three obvious doors (Sign up / Sign in / continue without account), and the `ⓘ Reference tool · Not medical advice` disclaimer. A first-timer knows exactly what to do.

**Intake.** Guided 4-step tracker (Personal → Resonance → Narrative → Intention). Geocode autocomplete works (New York → suggestions), and it **auto-detected the timezone** ("EDT UTC-4 · precise chart enabled") — the chart engine inputs are solid. "I don't know" birth-time (Solar Chart) is present. The **balance option** ("This feels balanced & strong for me") is on every planet card — the I.1 capture shipped. Body-map selection present.

**The recalibration engine — your fixes are LIVE and confirmed.** I answered as someone stuck/foggy/depleted (Mercury, Mars, Saturn, Uranus) and chose **Abundance** as intention. Result — Today's Fork Sequence: **Mercury → Sun → Venus → Jupiter → Earth**:
- **≥4 distinct forks, no repeats** — the thin/repeating problem is fixed (J.7 floor holds).
- **Jupiter surfaced from the Abundance intention** even though I never marked it as a symptom — this is the *exact* complaint you raised ("I picked abundance and Jupiter never showed"), now resolved (J.5).
- **Mercury surfaced** from the foggy/stalled inputs, and leads as the clarifier.
- **Counterweight logic working** — Mercury shows as "Quieted" (calming an overstimulated mind), and the diffuse-Neptune signal gets a "Clarify. Structure. Ground." response. Never-amplify intact.

**The reading.** One clean card (DIFFUSED · Neptune), probabilistic framing, disclaimer. Coherent.

**Astryx chat — the biggest win.** I asked: "Why is Jupiter in my fork sequence, and what cell salt and herb support it for abundance?" She:
- Answered with real **depth** — reached into the cell-salts canon (Silicea for Sagittarius/Jupiter, the biochemic system) and medical-astrology canon she couldn't touch before.
- Spoke in **her own voice**, woven and warm, tied to *my* specific reading (Neptune-excess / Sun-deficiency) — not a verbatim data dump.
- **Cited her sources**: "Cornell's Encyclopaedia of Medical Astrology (1933), Culpeper (1652), Schuessler (1873), Carey & Perry, Bonacci."
- Stayed compliant: "Planet is not the Remedy" framing, probabilistic language, deferred symptoms/health decisions to the licensed practitioner.
- Footer reads "Grounded in your chart & the Astryx canon."
This is the full-canon RAG + the live Gemini `AQ.` key working exactly as designed. She has depth and personality now.

**Chamber.** Loaded with **no freeze**. Visual modes (Body / Color / Mandala / Combined), phase ribbon showing the full sequence, **breathwork opening** (4-Count Box Breath — the Directive J bookend), music cued to **Earth Day · Variant 1** (Earth bookend defaulting to track 1), and as I advanced a phase the **song followed the fork** (Mercury phase → "Mercury · Natural," accent shifted to Mercury's green). Full player transport (play/pause/prev/next/replay/stop/volume/Default·Customize).

---

## FLAGS (honest, prioritized)

**1. [VERIFY — core] Dual-orb fork placement (Directive K) isn't showing.** In the chamber body map I saw **one** glowing orb, centered on the chest — not the **two** placements (traditional + natal) K specified, and the position doesn't match Mercury's anatomy (throat / lungs / hands). The orb *is* a glowing orb (not a dot), so part of K may be in, but the dual placement + per-planet accuracy aren't visible. **Confirm Directive K actually deployed; if it did, placement accuracy needs a look.** This is the core paid experience, so it's the one flag worth resolving before beta users land.

**2. [UX — moderate] The music player buries the body map.** In Body and Combined modes the player panel occludes the body figure — I had to collapse the player to see "where to hold the fork." The body map *is* the point of the chamber; it shouldn't be hidden by default. Recommend the player dock smaller / the body map stay visible.

**3. [CONTENT/COHERENCE — minor-moderate] "Today's Element: Fire is loud — you may run hot"** contradicts a diffuse / low-energy / foggy reading. If that's the daily *transit* weather (today's sky), label it clearly as such so it doesn't read as contradicting the user's personal signal. Coherence is your whole ethos.

**4. [GROUNDING — minor] Astryx doesn't know the user's chosen intention.** She attributed Jupiter's presence to the chart dynamic, when the real driver was my **Abundance** intention. Add the selected intention to her grounding context so she's exactly right about *why* a fork is there.

**5. [COSMETIC] Duplicate "BIRTH LOCATION" label** on the intake (section header + field label). And body-map selection defaults to "Female" — confirm that's intended.

**6. [INFRA — minor] Apex/redirect:** initial navigation flashed the raw Vercel preview URL before settling on `www.myastryx.com`. Confirm the bare apex (`myastryx.com` without www) also resolves and that the www/apex canonical redirect is set the way you want.

---

## Bottom line
As a stranger handed this link with zero explanation, I understood it, completed a full calibration, got a coherent reading, had a genuinely impressive conversation with Astryx, and sat in the chamber — all without confusion. The engine and the brain — the hard parts — are working. Before beta users arrive I'd resolve **#1 (verify the fork placement)** and **#2 (player hiding the body map)**; the rest are polish you can fix from real beta feedback.
