---
name: astryx-house-style
description: The Astryx and Sacred Tones house style — vibe, palette, the lit/printed light rule, imagery art direction, hard safety and accuracy constraints, and the build workflow SHA works by. Use whenever designing or writing ANY Astryx surface: the app, the marketing site, the user guide, the Calibration Standard, practitioner PDFs, product pages, emails, or generated imagery.
---

# ASTRYX HOUSE STYLE

## 1. The vibe, and the one principle that governs everything

**Astryx refuses to pick a side, and that refusal is the brand.**

Most things in this space choose. They go fully mystical and keep no rigour, or they go clinical and strip the soul out. Astryx holds both at once. The frequency is exact to two decimal places and derived from a real orbit. What it does is unmeasurable. Both are true and neither apologises for the other.

In one line: **the sacred, held to a tolerance.** Precision in service of mystery.

The physical fork is what keeps it honest. Steel cannot be faked. It is machined, engraved, and held against a real shoulder.

### THE GOVERNING PRINCIPLE

> **The subject carries the design. Decoration never does.**

This is the single reliable predictor of whether SHA accepts a design decision. Every accepted choice encoded something true. Every rejected one applied a rule for its own sake.

| Accepted | Why it survived |
|---|---|
| Dots on the tone ladder coloured per planet | Lifted verbatim from the app's `PLANET_COLORS` |
| Five session cards, five hues | Each hue is that session's own accent in `SessionModePicker.tsx` |
| Hero light climbing root to crown and back | The literal direction the Full Body session travels |
| Duration is the only coloured text on a session card | Lets the eye compare session lengths down the column |
| Outward column dark, inward column printed | The table itself shows instrument versus faculty |

| Rejected | Why it died |
|---|---|
| "Information is paper, experience is cosmos" applied to whole surfaces | Overpowering. Correct idea, wrong dose |
| Pure white cards | "Waaaay too bright" |
| Off-white pill with lavender type | A cascade bug, and the exact thing she had said not to do |

Before shipping any visual decision, answer: **what true thing does this encode?** If the answer is "it looks nice," rework it.

## 2. Palette

Astryx ships a dark ground with warm light used as trim and as reference surfaces. Never invent a colour. Pull from the app.

```css
--bg:#020208;        /* deep space, the ground, never leaves      */
--surface:#0B0B15;   /* card surface on the dark ground           */
--line:#1E1B4B;      /* structural border                          */
--gold:#F59E0B;      /* value, the sacred, prices, Earth Year      */
--purple:#C084FC;    /* the guide, the practitioner tier, threshold*/
--cyan:#38BDF8;      /* signal, frequency, measurement             */
--magenta:#FF006E;   /* heat, alert, emphasis                      */
--slate:#94A3B8;     /* body text on dark                          */
--trim:#DDD7CA;      /* THE light ground. warm stone. SHA's pick   */
--clay:#C4756A;      /* Mars, hard aspects, every caution          */
```

**Never reintroduce `#E8453C`.** That hot vermilion was doing three jobs at once — Mars's
accent, the hard-aspect line, and every warning/blocked state — so a Mars-dominant chart
washed the whole app in it, because the accent drives every card gradient, border and label.
SHA, 2026-09-12: *"the theme is bloody red everywhere... needs something softer, not so
offensive."* Replaced app-wide with **`#C4756A`**, a warm clay — iron-oxide, which is what
Mars actually is. Same hue family, far less saturation. The Root chakra moved with it
(`#E53935`/`#FF3D5C` → `#C06158`), which shifts the chakra golden snapshot; that update is
deliberate and expected, not a determinism break.

**`--trim:#DDD7CA` is the only light ground.** Not white. Pure white glares against near-black and fights the gold. It is one token driving every light surface, so it retunes in one line.

Ink on stone: `#15121C` for titles and body, `#7A4E05` deep gold for prices, `#0E6286` deep teal for frequencies, `#3E2775` deep violet for practitioner headings. **Never a tinted or pale font on a light fill.** Black on stone, always.

Per-planet dot and accent colours come from `src/lib/engineClient.ts` `PLANET_COLORS`. Darken for contrast on stone if needed; preserve the hue.

## 3. The light rule

> **Live things are lit. Reference things are printed.**

Anything that is running, playing, sensing or being felt stays on the dark ground: the hero, the oscilloscope, photographs, the chamber, session imagery. Anything you read, consult or compare goes on stone: the tone ladder key, the Clairs column, pricing, product cards, practitioner feature lists, labels.

Applied as **trim first, surfaces second**. Section labels are stone pills with black type. Cards get a one-pixel warm highlight along the top lip. Hairlines are warmed off-white at low alpha, never indigo, because indigo on near-black is what makes a page feel shut in.

**A dark screenshot needs a light mount.** The app UI is near-black; on a dark card it dissolves. Mat it on stone with about ten pixels of padding.

## 3b. The title strip

> **A title is never loose text on the dark ground. It is printed, on stone, in black.**

SHA, 2026-09-12: *"I need the title strip in every card, every info card, even in the
chamber."* Every titled surface opens with `<TitleStrip>` from `@/components/ui` — a
full-bleed bone (`--trim`) band, a 5px accent bar at the left edge, the title in Cinzel 700
black, and an optional badge pill on the right. The accent bar is the ONLY place a card's
own colour appears in its header, which is exactly what stops a red-accented card from
reading as a red card.

`GlassCard` and `StonePanel` take `title` / `badge` / `bodyClass`. Padding moves to
`bodyClass` so the strip runs edge to edge and follows the radius — a card that keeps its
own `p-5` will inset the strip and look broken. On stone the strip cannot be stone, so it
steps one shade darker (`#D2CBBD`), the way a printed table heads its own columns.

**What does NOT get a strip:** empty states, accordions whose button IS the header, and
list rows. A strip announces a titled panel; putting one above a toggle gives the card two
headers. 38 of 56 cards carry one; the other 18 are those three shapes.

## 3c. THE CHROME LAW

> **Chrome is the room. A planet's identity colour never paints the room.**

Two rules, and they are not stylistic — the engine is the authority and the
presentation layer has to obey it.

1. **No chrome element may take a planet's `base` palette.** `base` in
   `planetColorTherapyLibrary.ts` is *identity*: Mars is Crimson, Pluto is
   Burgundy, Mercury is Cyan. Chrome is the nebula, buttons, borders, labels,
   card glows, nav pills, hairlines and accent bars — everything outside the
   mandala and the colour-therapy field. It never reads that column.
2. **No chrome element may render a hue listed in that planet-state's `avoid`.**
   The engine already names what must not be shown. Mars `elevated` says
   *intensifying red*; Pluto `elevated` says *overwhelming dark red*. A room that
   renders those is prescribing the opposite of its own reading.

**Why this is law.** Chrome took `PLANET_COLORS[dominant]` — the raw base hue —
and pushed it through the entire interface including the full-viewport
background. On a Mars or Pluto day the UI rendered the exact colour the engine
lists under `avoid`, while the reading on screen said *"let the heat dissolve
into the cool field."* SHA, 2026-09-12: *"if someone is having a mars pluto day,
what type of intelligence floods them with RED?? if this is what you call
calibration, we're dead before we even get started."* The intelligence was never
broken. The presentation layer was never wired to it.

**The red-band trap, if chrome ever follows the corrective palette.** The
corrective palette only *cools* on `elevated` (and mostly on `blocked`). On
`depleted` it deliberately *warms* — correct therapy inside a mandala, and the
original complaint all over again at full-viewport scale. Six of the forty
planet-states resolve to a red-band hue on the naive read: Mars depleted /
blocked / balanced, Pluto depleted, Venus depleted / blocked. So "chrome takes
the corrective colour" is only safe with a guard: **take the first member of the
state's palette that is not in the red band (H < 28° or H > 335° with S > 0.30),
then temper it to a chrome envelope (S ≤ 0.42, L clamped to 0.50–0.70).** All
forty states resolve under that rule; none needs a fallback.

**Chrome is never persisted.** `accentColor` is out of the zustand persist
whitelist and stripped in both `migrate` and `merge`. zustand merges the saved
blob over the defaults, so a stored hue replays on every load before any runtime
override — which is why three clean fixes were invisible on SHA's own device
while the served bundle was correct. Clearing the browser cache does not clear
localStorage. **Verify a chrome change on a real browser holding a poisoned
`astryx-storage`, never by grepping the bundle.** `tests/chromePersistence.test.ts`
asserts the persist config itself.

### 3c.2 THE SECOND LAW — no room may be stale

> **Avoiding red is half the law. The other half is that the room has to be alive.**

SHA, 2026-09-12, on the first chrome ladder — which passed every red test:
*"i do not like the palette you are choosing when it comes to color therapy. it
has no soul. no flavor, no vibe. you either kill me with red or deplete me with
stale colors."*

She was right about the cause. That ladder was built out of **avoidance**: the
red rule said where not to go, so the answer retreated into warm neutrals at
mid-saturation — Dry Stone, Tallow, Warm Gray. On a `#020208` ground that is the
one place colour neither glows nor recedes. A palette made of absences.
Meanwhile `planetColorTherapyLibrary.ts` had the life in it the whole time.
**Never-amplify means don't feed the heat. It never meant be beige.**

**No single number captures this, and don't pretend one does.** Measured per
colour the rejected values overlap the good ones: rejected House Gold `#C9A961`
sits at saturation 0.49 / chroma 0.41, *higher* than Lilac Release `#C98FE8`
(chroma 0.35) from a palette SHA loved. In isolation `#C9A961` is a decent
antique gold. The failure was the **ladder**:

```
rejected:  balanced 42°  ·  depleted 39°  ·  blocked 41°  ·  elevated 173°
```

Three of four rooms within 3° of hue — the room could barely change at all. So
the law is two checks, both in `src/lib/visual/chromeLaw.ts`, both throwing at
module load:

1. `isStale()` — saturation floor 0.45, catching genuinely drained values.
2. `assertPaletteRange()` — at least **3 hue families**, 40° apart. The rejected
   ladder scores 2; every shipped palette scores 3+.

It earns its keep: on first run it caught Smoke Violet washed out at s=0.33, and
Deep Water's Clear Blue set to `#3FA9F5` — which is Uranus's *and* Mercury's own
base identity hue, banned outright by §3c.

### 3c.3 The five rooms, and what a palette is

SHA, on seeing the five: *"I love them all! this is what i am talking about
baby!"* — so all five ship and the user picks, in Settings → **The Room**.

A palette is the instrument's **FINISH**. The room within it is still resolved by
the reading's STATE and never by the planet, so switching palettes changes what
the colour is made of, **never what it means**.

| Palette | At rest | Where it comes from |
|---|---|---|
| **Amethyst Chamber** *(default)* | `#9B6BE0` | Violet + gold, the brand's two originals; Pluto's own balanced field |
| **Aurora** | `#22C39B` | Jade for a coherent field; the deep indigo Mars prescribes for heat |
| **Obsidian & Ember** | `#F0A93C` | The Sun's Warm Gold; Pluto's Gold Containment |
| **Deep Water** | `#3E92E8` | Neptune's corrective field — Clear Blue, Seafoam |
| **Egyptian Blue** | `#4C7FE8` | The Lotus Spectrum's Egyptian Blue — proprietary Astryx IP |

**`chromePaletteId` IS persisted; `accentColor` is NOT.** That is the whole
distinction and it matters: a preference the user *set* is restored, a value
*derived* from a reading is resolved. Confusing the two is the bug in §3c.

### 3c.4 Glass, not surgery

> **Colour on deep space behaves like light, not pigment.**

SHA, 2026-09-12: *"this is have a glass look and feel — not a dry cold room to do
surgery."*

`GlassCard` already had the bones — backdrop blur, accent border, top rim, halo —
but its fill ran to **92% opaque**, so nothing behind it came through and it read
as a dark rectangle with a coloured edge. Three changes, all in that one
component so every surface moves at once:

- the fill is lightened and carries a breath of the accent, so the glass is
  **tinted by the room**;
- the backdrop filter gains `saturate(165%)`, so what shows through stays
  coloured instead of going grey;
- an **inset bloom** sits in the lower body — the difference between a surface
  that is lit and one that is filled.

Glass needs something to refract. The page bloom was clamped at `0.05`
(invisible) from the days a per-planet table could wash the viewport in Mars red.
No room can be red now, so it runs at **0.15–0.19** as two offset pools rather
than one flat vignette, giving the field direction and the glass an edge to
catch.

## 4. Typography

Cinzel Decorative for the wordmark, Cinzel for headings, Exo 2 for body. Load Cinzel at **400;500;600;700** — the 700 cut is required. Without it every title renders faint or browser-synthesised.

**All titles are bold.** Section headings 700, card titles 700, tier names 700, channel keys 700.

## 5. Voice

The register is metaphysical, esoteric, scientific and mathematical at once. Uranus, Gemini, Sagittarius, Scorpio and Cancer sharing one voice. Saturn supplies structure; Uranus supplies the genius. **Do not sterilise it into clinical help-desk tone.**

A known failure mode: Claude drafts in its own plain, measured register and produces competent wellness-product copy that is not Astryx. Write a line of beauty, then a line of use. Auric field, resonance, frequency signature, the Clairs, the sky as a living instrument are working terms, used precisely.

The only limits are the law and false claims. Probabilistic framing always. `COMPLIANCE.md` banned phrases hold. Note that **`treatment` is itself a banned word** — copy reading "not a treatment for any condition" silently trips the filter. Use "never medical care".

## 6. Imagery art direction

House style line, appended to every generation prompt:

> Cinematic still on a near-black cosmic ground (#020208). Volumetric depth, amber-gold and electric-cyan rim light, a whisper of magenta bloom in the shadows. Dark-skinned subjects, natural skin texture, real hands. Somatic and grounded, not clinical: no lab coats, no white studio, no medical staging. Futuristic but warm. Shallow depth of field, fine film grain, no text, no logos, no watermark.

Vibration is rendered visible: concentric rings from struck metal, light travelling under skin, standing waves, cymatic patterns. Warm candlelight for the room, cool cyan for the signal. Practitioners wear their own clothes.

**A composited screen must be dimmer than it feels right to make it,** with a faint surface reflection, or it reads as a pasted rectangle.

## 7. Hard constraints that keep biting

1. **The sweep rule — name the point, not the region (SHA, 2026-09-11).** Two named points are swept at six inches rather than touched: **Basti**, the reproductive point on the midline below the navel, and **Trik**, the coccyx. That holds for every fork, chart and person. **No region is withheld.** The pelvis is a skeletal region and the rest of it is ordinary bodywork — the sacrum (Kati, worked from the back) is normal weighted contact. An earlier pass widened this to "the whole pelvic zone" and then quoted it back to SHA as her own ruling; it was not. Do not re-widen it, and do not flag anatomical imagery of the pelvic girdle as a violation.
2. **The metal is the source of truth.** Where a shipped fork is engraved with a frequency, the app matches the engraving. Uranus is **207.33**, Neptune is **211.45**, deliberately diverging from strict Cousto derivation. Do not "correct" it back.
3. **Generated type cannot hold twelve decimal frequencies.** AI-generated fork engravings came back with Mars at 514.47 Hz, a duplicate Venus, and no Pluto. Product shots of real products use real photographs, or the prompt specifies unengraved metal.
4. **Never Solfeggio for the planetary protocol.** Cousto for planets and forks, Solfeggio for the chakra layer only.
5. **Payments are Shopify-only.** Every buy CTA links a product page. Never build a payment portal.
6. **Malachite carries a red warning badge** everywhere it appears.

## 8. Workflow

**Division of labour, proposed by SHA and it works.** Claude builds the frame and labels the holes. SHA makes the art. So: design with **named image slots carrying an id, a subject, an aspect ratio and a prompt-ready description**, and hand over a shot list. Never wait on images to design.

**Show a visual before wiring anything.** SHA approves a rendered proposal, then it gets built.

**Render your own work before showing it.** Claude cannot view its own published artifacts. Render the local file with headless Chrome and look at it:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
  --hide-scrollbars --force-device-scale-factor=2 --window-size=1240,1000 \
  --virtual-time-budget=6000 --screenshot="out.png" "file:///C:/path/to/page.html"
```

For a section, extract it plus the page's `<style>` and font `<link>` into a standalone file and render that at legible size. This check has caught a broken grid, stale frequencies and unreadable type that would otherwise have reached her.

### Traps, all of which have bitten

- **Cascade order.** Put house-style rules in the LAST block of the stylesheet. A later `.label{color:var(--purple)}` beat an earlier black one and shipped lavender on off-white. `.hero > div` (0,1,1) beat `.chakra-field` (0,1,0) and forced an absolute backdrop into the grid.
- **Bash heredocs mangle `\n` and `\u`** inside Python bodies. Use the Write and Edit tools for anything containing escapes.
- **Artifact CSP blocks external images.** Inline every image as a base64 data URI. Resize first, via PowerShell `System.Drawing`; PIL is not installed.
- **Next.js ignores `_`-prefixed app folders.** A screenshot harness at `src/app/_shots` 404s. Use a normal name and delete it afterwards.
- **Percent signs break Python `%` formatting** in CSS strings. Use placeholder tokens and `.replace()`.

### Capturing real app screens

Run the dev server, render the real screens with a temporary client-only harness seeded from `tests/fixtures/chart-a.json` and a real `runEngine` report, capture with headless Chrome at `--force-device-scale-factor=2`, then **delete the harness**. Real screens beat mockups and they composite into practitioner scenes.

## 9. Astra

Astryx is the instrument. **Astra is the guide who explains it.** Keep the names separate; collapsing them is what made the old copy muddy.

She has a face. Her portrait leads her section and a round crop sits in the chat header. In any transcript the two speakers are visually distinct: **Astra speaks on stone in black type, the user speaks in a dark violet box**, because her answers are the long ones and that is where reading is easiest.
