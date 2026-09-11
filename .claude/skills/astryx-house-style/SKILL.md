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
```

**`--trim:#DDD7CA` is the only light ground.** Not white. Pure white glares against near-black and fights the gold. It is one token driving every light surface, so it retunes in one line.

Ink on stone: `#15121C` for titles and body, `#7A4E05` deep gold for prices, `#0E6286` deep teal for frequencies, `#3E2775` deep violet for practitioner headings. **Never a tinted or pale font on a light fill.** Black on stone, always.

Per-planet dot and accent colours come from `src/lib/engineClient.ts` `PLANET_COLORS`. Darken for contrast on stone if needed; preserve the hue.

## 3. The light rule

> **Live things are lit. Reference things are printed.**

Anything that is running, playing, sensing or being felt stays on the dark ground: the hero, the oscilloscope, photographs, the chamber, session imagery. Anything you read, consult or compare goes on stone: the tone ladder key, the Clairs column, pricing, product cards, practitioner feature lists, labels.

Applied as **trim first, surfaces second**. Section labels are stone pills with black type. Cards get a one-pixel warm highlight along the top lip. Hairlines are warmed off-white at low alpha, never indigo, because indigo on near-black is what makes a page feel shut in.

**A dark screenshot needs a light mount.** The app UI is near-black; on a dark card it dissolves. Mat it on stone with about ten pixels of padding.

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

1. **The pelvic rule.** No image, copy or protocol ever shows or states a fork contacting the reproductive organs, genitals, perineum or pelvic floor. That zone is a six-inch field sweep only. This is absolute.
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
