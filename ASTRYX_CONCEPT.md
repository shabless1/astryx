# ASTRYX — Concept Document

**For:** Any new Claude Code session or developer picking up this project.
**Read this BEFORE any code, any test guide, any technical spec.**
**If you only read one document, read this one.**

---

## What Astryx is

Astryx is a **deterministic multi-sensory frequency calibration instrument** that uses natal astronomy as a structured pattern recognition engine.

It is NOT:
- A horoscope app
- A meditation app
- A wellness journal
- A frequency player
- A music generator
- A planetary fan club

It IS:
- A medical-grade signal-detection system that translates birth-time astronomical positions + present-moment symptoms into a personalized 5-sense calibration protocol
- An environment the user walks INTO — sound, color, geometry, breath, scent, taste, body posture all calibrated to the same protocol
- The physical product (real metal tuning forks, herbal blends, crystals) bridged to a deterministic digital diagnostic

The architect's framing: **"calibration not prediction. blueprint not reading. signal not sign. system not mysticism."**

---

## The single most important principle

> **Detected planet identifies the pattern. State of the planet determines the remedy. Planet ≠ Remedy.**

Every prior version of this app got this wrong. Every horoscope app on the market gets this wrong.

Wrong logic (applies to ALL 10 planets):
```
User has <PLANET> dominant → output <PLANET>'s frequencies, colors, herbs, music
```

Correct logic (applies to ALL 10 planets):
```
User has <PLANET> dominant + symptoms suggest <PLANET> EXCESS
  → output corrective protocol that BALANCES the planet
  → DO NOT recommend more of that planet
```

```
User has <PLANET> dominant + symptoms suggest <PLANET> DEFICIENCY
  → output a stimulating / activating protocol appropriate to that deficiency
```

```
User has <PLANET> dominant + symptoms suggest <PLANET> BLOCKED
  → output a RELEASE / mobilization protocol
```

```
User has <PLANET> dominant + no symptom signals
  → output the planet's natural character (the only case where you "amplify")
```

**This applies to all 10 planets — Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.** The Mars example is just one of 30 corrective protocols (10 planets × 3 imbalance states). Each planet has its own excess pattern, its own deficiency pattern, its own blocked pattern, and its own corrective direction stored in `remedyPolarity.json`.

If a user reporting symptoms that point to ANY planetary imbalance gets a chamber that AMPLIFIES that imbalance — the whole intelligence layer has failed. That is the acceptance test, regardless of which planet was detected.

---

## The full polarity matrix — all 10 planets

This is the data that lives in `src/data/remedyPolarity.json`. Reproduced here so any developer reading this document understands the full scope of the corrective intelligence — not just the Mars example.

### SUN

**Excess** — Indicators: burnout · ego inflation · overheating · excessive pride · domination · inflammation · overexertion
  Corrective: cooling · humility · recovery · nourishment · Moon support · Venus support
  Avoid: excessive stimulation · excessive heat

**Deficiency** — Indicators: low vitality · poor confidence · fatigue · lack of direction · weak willpower
  Corrective: activation · warmth · motivation · gentle Mars support

**Blocked** — Indicators: lack of self-expression · creative blockage · suppressed identity
  Corrective: release · express · open · Jupiter and Venus support

---

### MOON

**Excess** — Indicators: emotional overwhelm · mood instability · hypersensitivity · fluid retention · dependency
  Corrective: grounding · structure · Saturn support · Mercury clarity
  Avoid: excessive emotional stimulation

**Deficiency** — Indicators: emotional numbness · poor connection to feelings · dryness · isolation
  Corrective: nourishment · hydration · softness · Venus support

**Blocked** — Indicators: stuck emotions · frozen grief · emotional rigidity · unable to cry
  Corrective: release · soften · permit · Venus and Neptune support

---

### MERCURY

**Excess** — Indicators: anxiety · overthinking · nervous tension · insomnia · scattered attention
  Corrective: grounding · slowing down · Saturn regulation · Moon calming
  Avoid: overstimulation

**Deficiency** — Indicators: sluggish thinking · poor communication · mental fog · low adaptability
  Corrective: stimulation · clarity · movement · light activation

**Blocked** — Indicators: communication blockage · stuck thoughts · inability to articulate · silenced expression
  Corrective: release · express · mobilize · Jupiter perspective

---

### VENUS

**Excess** — Indicators: indulgence · stagnation · excess comfort · fluid heaviness · avoidance
  Corrective: movement · circulation · mild Mars activation
  Avoid: excessive sweetness · passivity

**Deficiency** — Indicators: lack of pleasure · lack of self-worth · isolation · emotional dryness
  Corrective: beauty · pleasure · nourishment · softness

**Blocked** — Indicators: unable to receive love · stagnant relationships · blocked sensuality · heart restriction
  Corrective: open · permit · soften restriction · Moon support

---

### MARS

**Excess** — Indicators: inflammation · anger · irritation · heat · pressure · aggression · flare-ups
  Corrective: cooling · calming · Moon support · Venus support · Earth grounding
  Avoid: heat · overstimulation

**Deficiency** — Indicators: low drive · poor motivation · weak circulation · coldness · low energy
  Corrective: activation · warmth · movement · stimulation

**Blocked** — Indicators: tension · tightness · stagnation · stuck action · frustration · clenched jaw
  Corrective: release · mobilize · soften restriction · Saturn and Venus support

---

### JUPITER

**Excess** — Indicators: excess appetite · swelling · indulgence · overexpansion · excess accumulation
  Corrective: Saturn structure · moderation · containment · discipline
  Avoid: excess growth stimulation

**Deficiency** — Indicators: pessimism · lack of hope · contraction · poor confidence
  Corrective: expansion · optimism · opportunity · gentle growth

**Blocked** — Indicators: stuck growth · blocked opportunity · feeling trapped · lack of perspective
  Corrective: open · release · broaden · Mercury support

---

### SATURN

**Excess** — Indicators: rigidity · restriction · fear · dryness · stiffness · isolation · depression
  Corrective: warmth · movement · Venus softening · Jupiter expansion
  Avoid: excessive containment

**Deficiency** — Indicators: lack of discipline · poor boundaries · instability · weak structure
  Corrective: grounding · order · consistency · containment

**Blocked** — Indicators: frozen progress · stuck duty · blocked authority · calcification
  Corrective: release · soften restriction · mobilize · Venus and Moon support

---

### URANUS

**Excess** — Indicators: nervous overstimulation · instability · unpredictability · insomnia · scattered energy
  Corrective: grounding · Saturn structure · Earth stabilization
  Avoid: additional stimulation

**Deficiency** — Indicators: stagnation · fear of change · rigidity · lack of innovation
  Corrective: experimentation · movement · fresh input

**Blocked** — Indicators: unable to break free · stuck pattern · suppressed individuality
  Corrective: release · permit difference · open · Jupiter support

---

### NEPTUNE

**Excess** — Indicators: confusion · fog · escapism · poor boundaries · dissociation
  Corrective: Mercury clarity · Saturn structure · grounding
  Avoid: excessive dreaminess

**Deficiency** — Indicators: lack of imagination · poor intuition · creative blockage · spiritual dryness
  Corrective: inspiration · imagination · artistic stimulation · Moon support

**Blocked** — Indicators: stuck creativity · blocked intuition · unable to dream
  Corrective: release · permit · soften · Venus support

---

### PLUTO

**Excess** — Indicators: obsession · compulsion · control issues · intensity overload · fixation
  Corrective: release · trust · Venus softening · Jupiter perspective
  Avoid: additional intensity

**Deficiency** — Indicators: avoidance of transformation · fear of change · lack of depth · powerlessness
  Corrective: empowerment · courage · controlled transformation · Mars support

**Blocked** — Indicators: stuck transformation · blocked power · frozen change · unable to let go
  Corrective: release · permit transformation · soften grip · Venus support

---

### Master rule

```
The active planet identifies the pattern.
The state determines the remedy.
The remedy should balance the pattern, not amplify it.

Planet ≠ Remedy
Planet + State = Corrective Direction
```

This applies to every single planet in every single chart. The engine must never default to a single planet's character without checking state. If the engine outputs Saturn-amplifying rigidity protocols to a user reporting Saturn-Excess symptoms (stiffness, fear, restriction), it has failed — same as it would fail if it outputs Mars-amplifying heat to a Mars-Excess user.

---

## The five-sense protocol — what gets calibrated

Every Astryx session calibrates the user across five sensory channels:

| Sense | What it delivers |
|---|---|
| **Sound** | Multi-layer chamber composition: drone, chord bed, melody motif, bass, texture, regulator. Generated from Cousto cosmic octave Hz frequencies (NOT Solfeggio). Evolves through 5 phases. |
| **Scent** | Essential oil blend — 2-3 oils, with action (e.g. "cool & calm") and delivery instruction |
| **Taste** | Herbal tea blend — ingredients + taste profile + preparation. Bridges to SHA's physical Sacred Tea product line. |
| **Body** | Breath pattern (4-7-8, box, alternate nostril, etc.) + movement + posture + touch + orientation |
| **Sight** | Color palette + sacred geometry shape + motion type + 5-phase animation timeline + chakra correspondence |

All five derive from the same protocol. They are not independent — they are facets of one calibration.

---

## The Cousto Hz system — frequency foundation

Astryx uses planetary Hz frequencies sourced from Hans Cousto's *Law of the Octave* (the cosmic octave). These are derived by octaving up orbital periods until they fall in audible range.

```
Sun     126.22 Hz       Mercury   141.27 Hz       Venus    221.23 Hz
Mars    144.72 Hz       Jupiter   183.58 Hz       Saturn   147.85 Hz
Uranus  207.36 Hz       Neptune   211.44 Hz       Pluto    140.25 Hz
Moon    210.42 Hz       Earth Om  136.10 Hz
```

These Hz are the **anchor frequencies** — the carrier signal of the chamber. They are NOT the music. The music is generated FROM them deterministically.

**Hard rule:** never use Solfeggio frequencies (396, 417, 528 Hz) as primary anchors. Solfeggio appears only as aspect-mapped overlays at minimal volume.

---

## The deterministic principle

Same birth data + same chart + same symptoms = **same chamber, every time, forever.**

This is non-negotiable. No randomness in the protocol generation. No AI-generated text. No neural network output. No external API beyond the NASA-JPL ephemeris.

A user comes back six months later with the same intake → identical sound, identical colors, identical breath, identical herbal blend.

This is what makes Astryx trustable as a clinical instrument. Same input = same output. Always.

(Symptoms can change → state may shift → corrective protocol may differ. But the underlying signature stays identical.)

---

## Three-tier subscription model (compliance-aware)

Astryx operates in regulated wellness territory. The pricing tier system is also a legal posture system:

| Tier | $/mo | What it unlocks | Gate |
|---|---|---|---|
| **Individual** | $9.95 | Plain-language diagnostic, daily home screen, body map, full chamber. Symptom intake is general states only. Always-on referral framing. | Account + Individual Attestation |
| **Practitioner** | $39.95 | Clinical terminology, classical references cited, client roster, session notes, PDF export with practitioner name + modality | Account + Professional Attestation (audit-trailed) |
| **Verified Practitioner** | $59 | Verified badge on client materials, insurance-grade SOAP, referral letter templates | License/cert uploaded + verified |

**Posture in one sentence:** Astryx is the reference instrument; the licensed practitioner is the diagnostician. The app supplies signal; the practitioner supplies diagnosis. Toe the line, never cross it.

Every output-facing string uses probabilistic framing:
- ✅ "may suggest", "may indicate", "may correlate with"
- ❌ NEVER "you have", "you are", "this is diagnostic"

This is enforced via `lib/compliance.ts` and a banned-phrase linter.

---

## The Sacred Tones bridge — physical products

The architect (SHA) makes physical planetary tuning forks called **Sacred Tones** — 13 real metal forks tuned to Cousto cosmic Hz. The Practitioner Portal's crown feature is **Sacred Tones Session Mode**: during a live session, the app shows the practitioner which fork to apply to which chakra/body point for this specific client.

No other wellness platform does this. It is the reason Practitioners pay $39.95 instead of $0.

There's also a physical Sacred Tea line (planetary herbal blends → sacredtea.net) and starter kits including crystals, lotus blends, and forks.

The digital protocol always ends with physical-product references — when the shop is live, every prescription card shows "Brew this →" / "Get this fork →" CTAs to sacredtea.net. Feature-flagged behind `NEXT_PUBLIC_SHOP_LIVE`.

---

## The Lotus Spectrum — proprietary IP

Four lotus varieties (Red, White, Blue, Egyptian Blue) form a proprietary correspondence matrix mapping lotus → chakra → planet → tea → ritual. Treat this as a flagship feature, not a footnote. It lives in `lotusSpectrum.json`.

---

## The Chamber — what the user actually experiences

When the user taps "Enter Chamber" they enter a 3 / 7 / 11 / 22 / 33 minute multi-sensory calibration session:

1. **Sound** — a deterministic chamber composition starts. Drone anchors. Chord bed enters. Melody motif begins. Bass grounds (for Earth-heavy charts). Reverb and chorus give space. Phase plan automates evolution through Entry → Activation → Peak → Regulation → Integration.
2. **Visual** — full-screen sacred geometry canvas. Aspect-driven (conjunction = concentric circles, square = grid lattice, trine = triangle flow, etc.). Colors evolve through 5 phases.
3. **Breath** — guided breath pacer on screen synced to the user's element-derived breath pattern (or the corrective breath if polarity correction applies).
4. **Body** — posture, movement, and touch instructions shown for the practitioner to guide the client or for the individual to self-guide.

The chamber is named environmentally not astrologically: "Pressure Chamber" (square), "Flow Chamber" (trine), "Dialogue Chamber" (opposition), "Convergence Chamber" (conjunction), "Connection Chamber" (sextile), "Adjustment Chamber" (quincunx). This is how Astryx becomes accessible to someone who knows zero about astrology.

The chamber duration menu uses experiential labels:
- **Preview** (15s — taste of the chamber)
- **Quick** (3 min)
- **Daily** (7 min — default)
- **Deep** (11 min)
- **Immersion** (22 min)
- **Practitioner** (33 min)

Numbers like 3 / 7 / 11 / 22 / 33 are intentional (they "feel" right). Don't change to 5 / 10 / 15.

---

## What gets detected from the chart

The engine reads the user's natal chart and resolves a **Dominant Pattern**:
- Primary planet (e.g. Mars)
- Secondary planet (e.g. Saturn)
- Aspect connecting them (conjunction / square / trine / sextile / opposition / quincunx)
- Signs both planets are in
- Houses both planets are in
- Element + modality of the pattern (e.g. "earth cardinal")

This pattern is the **diagnosis**. It tells us WHAT's active.

The Remedy Polarity Engine then determines the **state** of the primary planet (excess / deficiency / blocked / balanced) by reading:
- User-reported symptoms (highest weight)
- User-reported emotional state
- Tri-source planet scoring (natal weight + transit pressure + symptom score)
- Hard aspects on the planet (square / opposition lean toward excess or blocked)
- Sign modality (fixed → blocked bias, cardinal → excess bias, mutable → deficiency bias)
- House placement (6/8/12 → blocked bias)

The combined signal yields a confidence score (0-2 weak, 3-5 moderate, 6+ strong) and the dominant state.

The corrective direction is then looked up in `remedyPolarity.json` per planet per state.

---

## What downstream engines do with state

Once state is determined:

- **`engine.ts` 5 protocol builders** (sound, scent, taste, body, sight) read the corrective protocol and emit corrective protocols instead of raw planetary protocols
- **`ChamberDNAEngine`** sets `effectivePlanet = regulator_planets[0]` (Moon for Mars Excess) — all chamber engines downstream read this instead of `primaryPlanet`
- **`ScaleEngine`** uses the corrective `scale_override` (Major for Mars Excess) instead of the planet's natural scale
- **`ChordEngine`** uses the regulator planet's chord voicing (soft sus for Moon vs power-intervals for Mars)
- **`MelodyGenerator`** uses the regulator's motif shape
- **`InstrumentationEngine`** uses the regulator's pad and bell voices (Moon's lush amsine vs Mars's sharp triangle)
- **`ResultsScreen`** displays the state badge ("Mars excess detected") and corrective description ("This chamber is designed to cool, calm, regulate")

The identity of the chamber (its NAME) stays tied to the aspect — "Pressure Chamber" for a square pattern. But the SOUND and COLOR character flips to the regulator. The diagnosis stays. The treatment corrects.

---

## What success looks like — examples across planets

The same correction logic plays out for every planet × every state. Four representative cases:

**Mars Excess** (user has Mars-Saturn square + reports anger / inflammation / flare-ups)

| Layer | Output |
|---|---|
| Chamber name | "Pressure Chamber" (from the square aspect — identity comes from the aspect, not the planet) |
| Polarity badge | "Mars excess detected · strong signal" |
| Sound | Moon character: lush amsine pad, Major scale, floating sus chords, soft motif |
| Scent | Lavender, rose, chamomile |
| Taste | Peppermint, chamomile, lemon balm, rose |
| Body | 4-7-8 extended exhale breath, cooling abdominal touch |
| Sight | Blue / green / seafoam palette |

**Saturn Excess** (user has Saturn dominant + reports rigidity / stiffness / fear / depression)

| Layer | Output |
|---|---|
| Chamber name | "Convergence" / "Flow" / etc. (from the aspect type) |
| Polarity badge | "Saturn excess detected" |
| Sound | Venus character: lush warm AM pad, Lydian-warm scale, soft chord voicings |
| Scent | Rose, frankincense, ylang ylang (warming) |
| Taste | Ginger, chamomile, tulsi, rose (warming + softening) |
| Body | Warm expansive breath, warming heart placement |
| Sight | Pink / gold / amber palette (NOT charcoal/dry tones) |

**Mercury Excess** (user has Mercury dominant + reports anxiety / overthinking / insomnia / scattered attention)

| Layer | Output |
|---|---|
| Chamber name | (from aspect) |
| Polarity badge | "Mercury excess detected" |
| Sound | Saturn character: grounded structured pad, Aeolian-grounded scale, slow rhythm |
| Scent | Lavender, sandalwood, vetiver |
| Taste | Chamomile, lemon balm, skullcap, passionflower, lavender |
| Body | 4-7-8 grounding breath, structured touch |
| Sight | Charcoal / earth / pale-blue palette (NOT electric yellow) |

**Pluto Excess** (user has Pluto dominant + reports obsession / control issues / fixation / intensity overload)

| Layer | Output |
|---|---|
| Chamber name | (from aspect) |
| Polarity badge | "Pluto excess detected" |
| Sound | Venus character: warm AM pad, Lydian-warm scale, softening voicings |
| Scent | Rose, frankincense, ylang ylang |
| Taste | Rose, tulsi, mullein, ashwagandha |
| Body | Soft extended breath, softening touch |
| Sight | Pink / gold / violet palette (NOT crimson / black) |

The pattern is the same every time: **identify the planet's state → swap to the corrective regulator's character → soften every output away from amplification**. The Mars example is just one case study among 30 (10 planets × 3 imbalance states). If even ONE planet's excess produces an amplifying chamber, the intelligence layer has failed for that user.

---

## What is NOT Astryx (anti-patterns)

- ❌ Outputting more of an already-excess planetary energy. This is amplification, not calibration.
- ❌ Using Solfeggio Hz (396, 417, 528) as primary anchors.
- ❌ Outputting medical diagnosis language ("you have...", "you are...").
- ❌ Generating non-deterministic audio (random walk, AI synthesis, etc.).
- ❌ Adding more screens / features when the existing 5-sense protocol isn't clean.
- ❌ Treating individual senses independently. The protocol is unified — sound + scent + taste + body + sight all derive from the same calibration.
- ❌ Using horoscope language ("Mars in your chart brings..."). Astryx never reads charts; it calibrates patterns.
- ❌ Making the practitioner mode "more features." Practitioner = clinical depth + audit trail + client roster + insurance-grade output. Not bonus content.

---

## Where the bugs live (as of this handoff)

Per the prior session's exit report, two production bugs remain:

### Bug 1 — Sun is always returned as dominant planet
Every intake returns Sun regardless of input. Symptom selections that exclude Sun still produce Sun-dominant patterns. The dominant pattern detection is broken somewhere between:
- `/api/chart` route (POST handler that calls calculateChart)
- `src/lib/ephemeris.ts` dominant-pattern scoring
- `src/lib/engine.ts fallbackPattern()` when /api/chart fails
- Narrative weight defaulting to Sun

### Bug 2 — Polarity correction doesn't reach the live protocols
Despite Phase A-D code being in place, entering Mars Excess symptoms doesn't produce a cooling chamber on the live deploy. Either:
- `protocol.dominantPolarity` is undefined at the live deploy
- Symptoms aren't reaching `determinePolarity` (intake.symptoms is empty)
- Confidence scores hit "weak" and `shouldApplyPolarity` returns false
- The polarity callout in ResultsScreen ChamberCTA is reading a stale field name
- The deploy succeeded but the build cache served stale code

Diagnose by adding console.logs around the polarity resolution and running a real intake. Trust nothing in the prior session's claims of "fixed and deployed" — verify each link in the chain.

---

## Where to start (concrete next steps)

1. Read this concept document (done)
2. Read `CLAUDE.md` (project manifest with tech stack, file structure, key rules)
3. Read `ASTRYX_TEST_GUIDE.md` (the 12-section test protocol)
4. Read `src/lib/RemedyPolarityEngine.ts` + `src/data/remedyPolarity.json` + `src/data/symptoms.json`
5. Read `src/lib/engine.ts` focusing on `runEngine()` and the polarity wiring around line 1244
6. Read `src/lib/chamber/ChamberDNAEngine.ts` focusing on the `applyCorrective` branch
7. Open the live URL https://n-pi-jet.vercel.app in incognito, hard refresh, do a fresh intake with `anger`, `inflammation`, `flare_ups` as symptoms
8. Open DevTools console — observe what `protocol.dominantPolarity` actually contains on the live deploy
9. Find why the polarity callout isn't rendering despite the code path existing
10. Find why every chart resolution returns Sun
11. Fix both
12. Deploy via `vercel --prod --yes`
13. Tell SHA what was broken in plain language + what symptom selections will now trigger the Mars Excess flow

---

## The architect (SHA)

SHA is the architect, not a developer. She approves direction and provides source assets. All technical decisions are yours. Never ask SHA to write or modify code. When you hit a fork in the road, choose the better path, document what you chose, and move forward.

She has been patient through hundreds of turns. Don't waste her tokens. Don't spawn Workflow agents to plan things you can execute directly. Work inline. Read files from disk to verify state, not from memory.

She built this app to help people recalibrate their nervous systems through real frequency science + classical medical astrology + her own physical product line. It is a labor of love and clinical seriousness. Treat it that way.

---

## One sentence to take with you

**Astryx is a deterministic clinical instrument that identifies what is active in a person's pattern — across any of the 10 planets — and prescribes what would balance it. It never amplifies the imbalance.**

If you remember nothing else, remember that. Sun excess gets cooled. Moon excess gets grounded. Mercury excess gets slowed. Venus excess gets moved. Mars excess gets calmed. Jupiter excess gets contained. Saturn excess gets warmed. Uranus excess gets stabilized. Neptune excess gets clarified. Pluto excess gets released. Same logic, ten planets, three states each — thirty distinct corrective protocols. None of them amplify. All of them balance.

The rest is implementation.
