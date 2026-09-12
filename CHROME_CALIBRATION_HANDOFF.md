# THE ROOM DOES NOT CALIBRATE
### Open directive for the next session · SHA, 2026-09-12

---

## SHA's words

> *"if someone is having a mars pluto day, what type of intelligence floods them with RED?? if this is what you call calibration, we're dead before we even get started."*

She is right, and the finding is worse and better than it looks.

---

## The finding

**The therapeutic intelligence already exists and is already correct.** It is in
`src/lib/visual/planetColorTherapyLibrary.ts`. Every planet carries a `base` identity palette
*and* a per-state corrective palette. The `elevated` (excess) state cools — and each one
names, explicitly, what must never be shown:

| Planet | `base` (identity) | `elevated` → what the engine prescribes | `avoid` |
|---|---|---|---|
| **Mars** | Crimson · Amber · Deep Orange | **Blue-Green · Deep Indigo · Earth Brown** | *intensifying red*, fire bursts, rapid pulses |
| **Pluto** | Deep Violet · Burgundy · Black-Blue | Deep Violet · Black-Blue · **Gold Containment** | *overwhelming dark red*, rapid vortex, violent pulsing |
| **Sun** | Gold · Amber · Soft White | Restorative Gold · **Pale Blue** · Soft White | intense orange-red, blinding white |
| **Saturn** | Charcoal · Slate Blue · Muted Gold | **Warm Gray** · Muted Gold · Soft Blue | heavy black fields, claustrophobic visuals |
| **Uranus** | Electric Blue · Cyan · Violet | **Teal** · Deep Blue · Muted Gold | sharp electric flicker, glitch, flashing white |

So on a Mars-excess day the engine's own instruction is *"let the heat dissolve into the cool
field"* and its palette is blue-green.

**The app then wrapped that advice in a red room.** Chrome never consulted this library. It
took `PLANET_COLORS[dominant]` — the raw **base** hue, the un-corrected identity colour — and
pushed it through every button, border, label, card glow, nav pill and the full-viewport
background nebula. Mars base is Crimson. Pluto base is Burgundy. The UI was doing the exact
thing the engine lists under `avoid`.

**The intelligence is not broken. The presentation layer was never wired to it.**

---

## Why "pick a softer default" is only half an answer

A fixed neutral never amplifies — but it never calibrates either. It solves the harm and
throws away the medicine. Astryx's whole claim is *calibration, not prediction*; a room that
is the same for everyone is just a theme.

The real move is the one the engine is already computing:

> **Chrome takes the CORRECTIVE colour for the user's current state, never the planet's base
> identity hue.**

Mars running hot → the room goes blue-green and settles. Mars depleted → steady warmth builds.
That is calibration expressed in the interface itself, per user, per day, and it can never
amplify because the corrective palette is defined as the counter to the state.

This is the same principle as **never-amplify**, which already governs fork selection. Colour
was simply exempt from a law it should always have obeyed.

---

## What is live right now (2026-09-12)

Shipped, and deliberately conservative — it stops the harm, it does not yet do the work:

- `HOUSE_ACCENT = '#C9A961'` in `src/lib/engineClient.ts`; `getAccentColor()` returns it
  unconditionally. Chrome no longer swings with the chart.
- `SessionScreen`'s `accentColor` was `fork.color` → now `HOUSE_ACCENT`.
- `CosmicBackground` always resolves `DEFAULT_ATMOSPHERE`; the per-planet nebula table is
  disconnected (Mars was `'220,60,50'` at strength 0.14, the strongest of ten; Pluto
  `'150,40,40'`).
- `#E8453C` retired app-wide → `#C4756A`; Root chakra → `#C06158`.
- `#C9A961` is a placeholder, NOT an approved brand decision. SHA has not signed off on it.

---

## ⚠ The bug that made three fixes invisible

`accentColor` is in the zustand **persist whitelist** (`astryx-storage`,
`src/lib/store.ts` partialize ~line 602). zustand merges the saved blob *over* the defaults,
so a browser that stored the old per-planet hue replays it on every load — before any runtime
override runs. Clearing the browser cache does not clear localStorage.

**SHA is still seeing red on her own device for this reason, not because the code is wrong.**

Fix before anything else, or the next change will also appear to do nothing:
1. Remove `accentColor` from `partialize`.
2. Add a `version` bump + `migrate` (or extend the existing `merge:` at ~line 621) that drops
   any stored `accentColor`, so existing users are released from the hue they are pinned to.
3. Same trap applies to `record.accentColor` on saved sessions and `reading.accentColor`.

---

## The session's job

1. **Land the persistence fix first** — nothing is verifiable until it is done.
2. **Decide the model with SHA:**
   - (a) corrective-state chrome — the room calibrates, per the table above; or
   - (b) a fixed therapeutic neutral, with the corrective palette confined to the chamber; or
   - (c) neutral chrome that warms or cools *only* by state, never by planet identity.
   Recommendation is **(a)**, because the data already exists and it is the product's actual claim.
3. **Define what chrome may never do**, and put it in the house-style skill: no chrome element
   may take a planet's `base` palette, and no chrome element may render a hue listed in that
   planet-state's `avoid`.
4. **Verify on SHA's own device**, not just in the bundle. Three prior fixes passed a bundle
   grep and still showed red on her screen.

---

## Standing constraints

Metaphysical voice. 12 forks, Cousto for planets / Solfeggio for chakra. Never-amplify.
Womb-safe. Account-only. Payments Shopify-only. RLS on every table. No secrets in git.
Commit as Sha Blyss. Deploy `npx vercel deploy --prod` and verify live.
**Claude is the developer — never ask SHA to write code.**
