# ASTRYX — Mandala Art Guide (Midjourney → Chamber)

The Chamber now prefers **real mandala artwork** over the coded geometry. Drop your
Midjourney (or any) PNGs into the folder below and they appear automatically as
**living frequency lenses** — slowly rotating, breath-pulsing, glowing, with edges
blended into the cosmic black and signal-state colour grading applied on top.

If a planet has no art file yet, the Chamber falls back to the SVG kaleidoscope —
so you can add art one planet at a time and nothing ever breaks.

---

## Where the files go

```
astryx_v14/public/images/mandalas/
```

## File naming (lowercase planet)

- **Simplest — one image per planet** (covers all states):
  `venus.png`, `mars.png`, `saturn.png`, …
- **Optional — per signal state** (more precise; loaded first if present):
  `venus-depleted.png`, `mars-elevated.png`, `saturn-blocked.png`, …
  States: `elevated` · `depleted` · `blocked` · `balanced`

`.jpg` works too. Planet names: `sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto`.

## Image specs (for the best look)

- **Square**, at least **1024×1024** (1536² is great).
- **Centered, radially symmetric** mandala (it rotates slowly — symmetry keeps it seamless).
- **Deep black or transparent background** (`#020208`). The app masks the edges to fade into black, so let the design breathe toward the corners.
- Mandala fills roughly **80%** of the frame with soft glow falloff.
- Keep one luminous **central core** — it becomes the glowing heart of the lens.

---

## Midjourney prompts (one per planet)

Shared style suffix (paste at the end of each):

> *intricate sacred-geometry mandala, perfectly radially symmetric, kaleidoscopic, volumetric glowing light, bloom, ultra-detailed linework, deep space black background, centered square composition, ethereal, premium, cinematic, dark-tech spiritual, 8k* `--ar 1:1 --style raw --v 6`

| Planet | Prompt seed (prepend to the suffix) |
|---|---|
| **Sun** | Solar kaleidoscope mandala — concentric solar rings, radial sun-rays, a twelve-point soft star, luminous gold core. Colours: **gold, amber, soft white, warm solar yellow.** |
| **Moon** | Lunar water kaleidoscope — mirrored crescent arcs, concentric water ripples, soft pearl orbs, silver-blue mist. Colours: **pearl, silver, pale blue, soft aqua.** |
| **Mercury** | Circuit kaleidoscope — hexagonal lattice, fine glowing circuit pathways, small orbiting nodes, a cyan core. Colours: **cyan, electric blue, silver, pale yellow.** |
| **Venus** | Lotus kaleidoscope — layered mirrored lotus petals, flower-of-life rings, heart-field rings, rose-gold core. Colours: **emerald, rose, rose-gold, copper, soft pearl.** |
| **Mars** | Shield kaleidoscope — triangle + diamond shield geometry, directional rays, **cooled** containment field (NOT fiery). Colours: **blue-green, deep indigo, cool teal, muted earth, a single ember core.** |
| **Jupiter** | Expansion kaleidoscope — broad arcs, spirals, large expanding rings with an outer containment ring, gold-violet core. Colours: **royal blue, violet, gold, deep purple.** |
| **Saturn** | Crystalline architecture mandala — square + cube lattice, concentric containment rings, architectural grid, bone-white core. Colours: **charcoal, slate blue, muted gold, bone white, warm gray.** |
| **Uranus** | Electric star kaleidoscope — angular star lattice, lightning-branch lines, circuit grid (no glitch, smooth glow), teal-blue core. Colours: **teal, deep blue, electric blue, violet, muted gold.** |
| **Neptune** | Ocean veil kaleidoscope — watery spirals, soft wave mandala, blurred veil rings, lavender ocean mist, seafoam core. Colours: **seafoam, violet, lavender, ocean blue, silver.** |
| **Pluto** | Transformation vortex mandala — deep slow spiral, layered underworld rings, root-like geometry, black-blue with soft gold containment, deep violet core. Colours: **deep violet, burgundy, black-blue, dark crimson, soft gold accent.** |

> Tip: keep the palette per planet consistent so the set feels like one system.
> Mars especially — keep it **cool blue-green** (the app corrects an overactive Mars by cooling it; fiery red art would fight the calibration logic).

---

## After you add files

1. Save the PNG(s) into `public/images/mandalas/`.
2. Tell me (or redeploy) — they go live immediately.
3. In the Chamber, the Mandala/Combined views show your art; the corner label reads **`ART`** (vs `SVG`).
4. The renderer toggle still lets you compare **Auto (art) · 3D (WebGL) · SVG**.
