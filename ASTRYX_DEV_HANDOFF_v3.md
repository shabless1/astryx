# Astryx Engineering Handoff — Hologram Pivot, Phase Engine, Schema Upgrade
**Monday Brief | v14 → v15 | Owner: Eng Lead**

---

### Executive Summary

- **Aesthetic system: ~35% complete.** BodyMap component renders the target cyan hologram language correctly inside its bezel. Every other surface (cards, hero, transit rows, prescription tiles, fork cards, session HUD, CTAs) still renders as warm amber/violet luxury glass. Fix is a token swap — accent default `#F59E0B` → `#22D3EE`, nebulae → scanline+grid mesh, box-shadows → 0.5px cyan hairlines + inset top-light — not a rewrite.
- **Visual engine: ~15% complete (placeholder).** `VisualEngineCanvas.tsx` renders one static composition keyed off `aspect` at mount; quincunx falls through to circles, no phase awareness, no time-driven evolution, `sessionTime` never reaches the canvas. Needs phase engine + per-aspect geometry rewrite per the audit's six implementation approaches.
- **Sound engine: ~55% complete.** All 8 layers are wired and audibly correct at attack. Zero phase automation — `startSessionSound` ramps gains once, `stopSessionSound` ramps them to zero, nothing happens in between. No `Tone.Transport` schedule, no layer entry/exit, no pulse-rate or filter automation. Fix is additive: schedule phase transitions and `rampTo` automation onto the existing chain.
- **Protocol schema: ~50% complete.** `ProtocolOutput.plan.sound` and `plan.sight` were shaped for UI cards, not renderers. Missing semantic color slots, geometry base/overlay split, structured regulator object, aspect behavior block, and the shared `session_phases` timeline that visual and sound both need. Schema upgrade is the unblocker for both engines and must land first.

---

### Aesthetic System — Hologram Pivot

Visual benchmark: `public/images/body-anterior.png` and `public/images/body-posterior.png`. Pure `#020208` ground, saturated cyan (`#22D3EE` core / `#5EE0FF` rim) polygonal wireframe body, amber (`#F59E0B` / `#FF8A1A`) restricted to internal viscera glow, two sharp vertical scanner bezels framing the body. Medical scanner / HoloLens, not Apple Vision Pro luxury glass.

### Core Token Swap

Replace warm-glass defaults with hologram tokens across `src/components/ui/index.tsx` and `src/styles/globals.css`:

```css
/* globals.css :root */
--bg-base:          #020208;
--cyan-core:        #22D3EE;
--cyan-rim:         #5EE0FF;
--cyan-deep:        #0A2540;
--cyan-hairline:    rgba(94, 224, 255, 0.35);   /* primary border */
--cyan-hairline-lo: rgba(94, 224, 255, 0.22);   /* secondary border */
--cyan-glow-inset:  rgba(255, 255, 255, 0.12);  /* scan-pass top rim */
--cyan-grid:        rgba(94, 224, 255, 0.04);   /* mesh lines */
--cyan-scanline:    rgba(94, 224, 255, 0.025);  /* horizontal scanlines */
--amber-signal:     #F59E0B;   /* RESERVED: active-signal pulses only */
--planet-color:     var(--cyan-core);  /* was #8B5CF6 */
```

In `ui/index.tsx`, change every `accent = '#F59E0B'` and `accentColor || '#F59E0B'` default to `'#22D3EE'`. Per-planet tints remain as overrides layered on a cyan baseline border, not as wholesale chrome replacements.

### Card Recipe — `GlassCard` → `HologramCard`

```ts
// Drop in ui/index.tsx GlassCard
background: 'linear-gradient(180deg, rgba(8,14,28,0.72) 0%, rgba(2,2,8,0.92) 100%)',
border: '1px solid rgba(94,224,255,0.22)',
borderTop: '1px solid rgba(94,224,255,0.35)',     // scan-pass rim
boxShadow: [
  'inset 0 1px 0 rgba(255,255,255,0.06)',         // top-light
  '0 0 0 1px rgba(94,224,255,0.08)',              // hairline halo
  '0 24px 60px -24px rgba(94,224,255,0.25)',      // soft cyan drop
].join(', '),
borderRadius: 12,
```

Per-planet tint: keep planet color on `borderLeft: 3px solid ${planetColor}` only (channel-coding rail). Never let it bleed into the body fill.

### Glow Specs

| Element | Spec |
|---|---|
| Hairline border | `1px solid rgba(94,224,255,0.35)` top, `0.22` other sides |
| Scan-pass rim | `inset 0 1px 0 rgba(255,255,255,0.12)` |
| Soft halo (idle) | `0 0 24px -10px rgba(94,224,255,0.25)` |
| Active halo | `0 0 24px -4px rgba(94,224,255,0.7)` |
| Text glow (Hz, telemetry) | `textShadow: '0 0 16px rgba(94,224,255,0.6)'` |
| Signal-lock dot | `8px circle, background #22D3EE, boxShadow 0 0 12px #22D3EE` |
| Amber accent | Reserved for "ACTIVE NOW" chips, fork-applied confirmation, viscera glow only |

### Background System — `CosmicBackground.tsx` Rebuild

Delete the four nebula divs (L196-227) and the hue-rotated video unless clipped to a HUD lower-third readout. Stack four layers in this order on `#020208`:

```ts
// 1. Top horizon glow
{ background: 'linear-gradient(180deg, rgba(94,224,255,0.08) 0%, transparent 240px)' }

// 2. Grid mesh (always on, all screens)
{
  backgroundImage: [
    'linear-gradient(rgba(94,224,255,0.04) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(94,224,255,0.04) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '64px 64px',
}

// 3. Horizontal scanlines (animated via existing scanLines keyframes)
{ background: 'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(94,224,255,0.025) 3px, rgba(94,224,255,0.025) 4px)' }

// 4. Scanner rails — fixed-position vertical gradient lines at left:24px / right:24px
{ background: 'linear-gradient(180deg, transparent, rgba(94,224,255,0.45) 30%, rgba(94,224,255,0.45) 70%, transparent)' }
```

Stars: cap at 80 total (50 far / 25 mid / 10 near). Tint cyan: `background: '#9BE9FF'` not `#ffffff`.

### Typography

Add `JetBrains Mono` to the Google Fonts import in `index.html`. Apply `font-mono` to every numeric readout: Hz values, orb degrees, days-to-exact, session timer, breath countdown, confidence `%`, vagal LEDs, coordinates. Reduce Cinzel to: ASTRYX wordmark + one heading per screen. All other headings → `Rajdhani semibold tracking-[0.05em]`.

### Signal-Lock Pattern (Global)

Add to `globals.css`:

```css
@keyframes signalSweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
@keyframes lockPulse   { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
.signal-lock::before {
  content: ''; position: absolute; top: 0; left: 0; width: 24px; height: 1px;
  background: linear-gradient(90deg, transparent, #22D3EE, transparent);
  animation: signalSweep 2.5s linear infinite;
}
.signal-dot {
  position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; border-radius: 50%;
  background: #22D3EE; box-shadow: 0 0 12px #22D3EE;
  animation: lockPulse 1.4s ease-in-out infinite;
}
```

Apply `.signal-lock` to the dominant prescription card, active transit, current step card, currently-applied fork.

### P0 Surfaces (this sprint)

`ui/index.tsx` defaults, `globals.css` base + planet-color variable, `CosmicBackground.tsx` rebuild, `ResultsScreen.tsx` diagnosis hero card, `SessionScreen.tsx` step card + breath pacer + telemetry strip, `PractitionerScreen.tsx` fork cards.

### P1 Surfaces (next sprint)

TransitCard rows, SenseTile prescription chips, BodyMap planet tokens + extended rails, PrimaryButton HUD treatment, HomeScreen "INITIATE SCAN SEQUENCE" CTA, SessionScreen VisualEngineCanvas overlay layers, typography cleanup.

### P2 Surfaces

Form fields (terminal-style underline), global signal-lock retrofit.

---

### Protocol Schema Upgrade

Current `ProtocolOutput.plan.sound` and `plan.sight` were designed for UI cards: `colors` is a flat 3-hex mix, `regulator` is a display string `'Earth Year Om — 136.10 Hz'`, geometry is a single string, and there is no shared phase timeline. The Visual Engine cannot identify which color belongs to which planet, the Sound Engine cannot play the regulator without parsing a string, and neither engine has a clock contract.

The upgrade splits colors into semantic slots, splits geometry into base/overlay layers, restructures `regulator` into `{name, hz}`, lifts `aspect_behavior` from `aspects.json music_behavior`, and adds `session_phases` as the shared timeline that propagates to both engines. The existing display fields (`style`, `duration`, `description`, `variants`, `delivery`) are retained as derivative — no breaking change to ResultsScreen / PractitionerScreen card text.

### Upgraded Types (paste verbatim into `src/types/index.ts`)

```ts
// ─── VISUAL PROTOCOL (renderer-ready) ──────────────────────
// Consumed by VisualEngineCanvas.tsx. All color fields are hex strings.
// geometry_base/overlay split lets the canvas stack a planet shape under
// an aspect shape. motion_type and kaleidoscope_mode are stable enum tokens.
export type MotionType =
  | 'center_intensification'
  | 'oscillation'
  | 'collision_pulse'
  | 'continuous_expansion'
  | 'harmonic_opening'
  | 'skewed_adjustment'

export type KaleidoscopeMode =
  | 'dense_bloom'
  | 'dual_reflection'
  | 'structured_tension'
  | 'flow_symmetry'
  | 'harmonic_weave'
  | 'adaptive_misalignment'

export interface AnimationPhase {
  name: 'induction' | 'build' | 'peak' | 'integration' | 'release'
  duration_seconds: number
  intensity: number          // 0..1 — drives opacity, scale, motion amplitude
  dominant_color: string     // hex pulled from primary_colors
  motion_modifier?: string   // e.g. 'slow_inhale', 'rapid_pulse', 'still'
}

export interface VisualProtocol {
  primary_colors:     string[]          // dominant planet hex palette (1-3 entries)
  secondary_colors:   string[]          // secondary planet hex palette (1-3 entries)
  regulator_color:    string             // single regulator hex from colors.json
  geometry_base:      string             // dominant planet shape (circle, square, triangle)
  geometry_overlay:   string             // aspect-driven shape from geometry.json
  motion_type:        MotionType         // stable token from geometry.json motion enum
  animation_phases:   AnimationPhase[]   // 3-5 phase timeline for the session
  kaleidoscope_mode:  KaleidoscopeMode   // already in geometry.json, now strongly typed
  // Display fields retained for UI cards (not used by renderer)
  delivery?:    string[]
  description?: string
}

// ─── SOUND PROTOCOL (renderer-ready) ───────────────────────
// Consumed by soundEngine.ts (Tone.js). regulator is structured so the
// engine can play it; aspect_behavior carries chord/interval logic from
// aspects.json music_behavior. session_phases is shared with VisualProtocol
// so audio and video sync on the same clock.
export type RhythmStyle =
  | 'steady'
  | 'syncopated'
  | 'call_response'
  | 'steady_or_heavy'
  | 'interactive'
  | 'corrective'

export type SoundMode =
  | 'tone_sequence'
  | 'ambient_drone'
  | 'binaural_layer'
  | 'pulsed_regulation'

export interface Regulator {
  name: string    // e.g. 'Earth Year Om'
  hz:   number    // e.g. 136.10
}

export interface AspectBehavior {
  interval_style: string[]   // e.g. ['minor_2nd', 'tritone']
  chord_style:    string     // 'dense' | 'cluster' | 'open' | 'alternating' | 'airy_support' | 'skewed'
  rhythm:         RhythmStyle
  resolution:     string     // 'delayed' | 'natural' | 'midpoint_merge' | 'supportive' | 'adaptive' | 'context_dependent'
}

export interface SessionPhase {
  name:              'induction' | 'entrainment' | 'integration' | 'release'
  duration_seconds:  number
  hz_focus:          number    // which anchor Hz dominates this phase
  intensity:         number    // 0..1 — amplitude / mix level
  binaural_offset?:  number    // Hz offset for binaural beat (left/right delta)
}

export interface SoundProtocol {
  mode:              SoundMode
  primary_anchors:   number[]         // [planet1Hz, planet2Hz]
  aspect_behavior:   AspectBehavior   // lifted from aspects.json music_behavior
  rhythm_style:      RhythmStyle      // raw token, not display label
  regulator:         Regulator        // structured, was a display string
  session_phases:    SessionPhase[]   // shared timeline with VisualProtocol
  // Display fields retained for UI cards
  style?:       string
  duration?:    string
  description?: string
  variants?:    string[]
}

// ─── PLAN (updated) ────────────────────────────────────────
export interface PlanProtocols {
  sound:  SoundProtocol
  scent:  ScentProtocol
  taste:  TasteProtocol
  body:   BodyProtocol
  visual: VisualProtocol   // renamed from `sight` for clarity; old SightProtocol can remain as alias during migration
}
```

### Wiring Points in `engine.ts`

- **`buildSoundProtocol` (L751-773):** return structured `regulator: {name, hz}` instead of the display string; read `aspectsData[aspect].music_behavior` and emit `aspect_behavior` and `rhythm_style` (raw token); generate `session_phases` array from a default `PHASE_PLAN` constant (see Sound Engine section).
- **`buildSightProtocol` → rename `buildVisualProtocol`:** fetch `p2Colors.primary_colors` (currently never fetched — secondary planet colors are dropped); emit `primary_colors`, `secondary_colors`, `regulator_color` as separate slots; split geometry into `geometry_base` (planet shape from `planetary-anchors.json`) and `geometry_overlay` (current `geo.geometry` from `aspects.json`); rename `motion` → `motion_type`; emit `animation_phases` array aligned with `session_phases` durations.
- **`runEngine` return shape:** `plan.sight` → `plan.visual`. Keep a `plan.sight` getter alias for one release to avoid breaking PDF export and Results card text reads.
- **`sample-protocol.json`:** regenerate to include all new structured fields. This is the contract test fixture — both engines should be developed against it before live `runEngine` output.

---

### Visual Engine Rebuild

`VisualEngineCanvas.tsx` (275 lines) renders a single static composition every frame, keyed off `aspect` at mount via if/else (L188-193). Effect deps are `[accentColor, aspect]` so geometry never changes mid-session. Quincunx has no branch — falls through `else` to `drawCircles`. Audio RMS modulates radius/alpha by small amounts; that is the only "motion." No phase awareness, no `sessionTime` input, no use of `elements.json`.

### Aspect → Geometry Specification

| Aspect | Current (placeholder) | Required Geometry | Kaleidoscope Mode | Color (CLAUDE.md) | Pulse Rate |
|---|---|---|---|---|---|
| conjunction | 6 concentric circles, fixed alpha decay | Dense bloom — 3 ring families (N=12) with density gradient inward to a hot core | `dense_bloom` | accent | 0.08 Hz |
| opposition | 4 mirrored diagonals | True mirrored axis — two equal clusters on opposite sides of a central axis, midpoint merge at Integration | `dual_reflection` | accent | 0.20 Hz |
| square | 6 nested rotated rects | Orthogonal grid lattice (4→8→12 cells by phase) with collision pulse + friction stress lines | `structured_tension` | `#E8453C` → green | **0.60 Hz** |
| trine | 5 nested rotated triangles | Three nodes at 120° connected by quadratic Bézier arcs, ribbon particles circulating | `flow_symmetry` | `#4CAF89` | 0.12 Hz |
| sextile | 5 nested rotated hexagons | Tessellated honeycomb lattice with outward harmonic waves illuminating rings | `harmonic_weave` | `#2EC4B6` | 0.25 Hz |
| quincunx | **falls through to circles** | Off-axis spiral with shear transform; corrects toward alignment at Integration | `adaptive_misalignment` | `#9B5DE5` | 0.18 Hz |

### Implementation Approach Per Aspect

**Conjunction.** 3 ring families `N=12` at `r_k = baseR * (1 + k/N * densityCurve(phase))`. `densityCurve` 0.3 → 1.0 → 0.7 across Entry → Peak → Integration. `shadowBlur = 8 + energy*16 + peakBoost`. Color HSL-interpolates `elements[0]` (cool) → accent (Peak) → `elements[1]` (warm). `globalCompositeOperation = 'screen'` at Peak only.

**Opposition.** Two focal nodes at `(cx ± axis*phaseSep, cy)` with `phaseSep` 0.0 → 0.35 → 0.05. Mirror right cluster via `ctx.save / scale(-1,1) / restore`. Paired oscillation `sin(t)` left / `-sin(t)` right. In Integration, `lerp(focal, center, easeInOutCubic(progress))`. Midpoint flare radial gradient ignites at Peak → Regulation transition.

**Square.** N×N grid via `ctx.strokeRect` (N grows 4 → 8 → 12 by phase). Collision pulse: `cellSize *= 1 + 0.15 * sin(t * 0.60Hz * 2π)`. Use `Math.sign(sin())` (square-wave LFO) for hard-edge feel, not sine. Friction stress lines: at each pulse peak, draw a brief diagonal through random cells. Color `#E8453C` at Peak, blend toward green at Integration.

**Trine.** 3 nodes at `[−π/2, π/6, 5π/6]` at radius `R(phase)` (80 → 220 → 180). Quadratic Bézier per leg with control point pulled inward by `curvatureCurve(phase)`. Ribbon particles travel leg→leg, full circuit ≈ 4s. `ctx.lineCap='round'`, `ctx.lineJoin='round'`. Color `#4CAF89` with luminance breathing on phase.

**Sextile.** Tessellate flat-top hexagons via axial coords `(q,r)`: `x = hexSize * 1.5 * q`, `y = hexSize * sqrt(3) * (r + q/2)`. `ringIndex = round(dist(cell, center) / hexSize)`. Per-frame brightness `0.3 + 0.7 * sin(t * 0.25Hz * 2π - ringIndex * 0.4)` produces outward harmonic waves. At Peak, adjacent cells link via short line segments (the "weave"). Entry shows inner ring only; Peak fills lattice; Integration fades outer rings inward.

**Quincunx.** Parametric spiral `r(θ) = a + b*θ`, N=400 samples `θ ∈ [0, 6π]`. Center is OFFSET: `(cx + skewX(phase), cy + skewY(phase))` driven by low-freq Perlin noise. Apply `ctx.transform(1, 0.18, 0.12, 1, 0, 0)` for shear. Entry tightly coiled and skewed; Activation unwinds; Peak max extent off-axis; Regulation eases toward alignment; Integration settles near-symmetric at center. Color `#9B5DE5`.

### Five-Phase Visual Implementation

Create `src/lib/phaseEngine.ts` as authoritative source. Five proportional phases summing to 1.0:

```
Entry        0.10  energyEnvelope: easeInQuad         0 → 0.3
Activation   0.20  easeInOutCubic                     0.3 → 0.85
Peak         0.35  plateau + sin wobble ±0.05         0.85 → 1.0
Regulation   0.20  easeOutCubic                       1.0 → 0.5
Integration  0.15  easeOutExpo                        0.5 → 0.15
```

```ts
export type Phase = 'entry' | 'activation' | 'peak' | 'regulation' | 'integration'
export interface PhaseState {
  name: Phase
  localProgress: number    // 0..1 within this phase
  globalProgress: number   // 0..1 across whole session
  energyEnvelope: number   // 0..1 phase-shaped amplitude (ADSR-like)
}
export function getPhaseState(elapsedSec: number, totalSec: number): PhaseState
```

Default `totalDuration` = 1200s (20 min) for individual sessions, sum-of-step-durations for practitioner sessions.

`SessionScreen.tsx` L273 currently mounts `<VisualEngineCanvas protocol={protocol} accentColor={accentColor} />`. Change to pass `sessionTime`, `totalDuration`, and optionally `currentStep`. Inside `VisualEngineCanvas.animate()`, compute `phase = getPhaseState(sessionTime, totalDuration)` per frame — remove `[accentColor, aspect]`-only deps and pull phase computation into the RAF loop.

Per-phase behavior summary:

| Phase | Primitive Count | Color | Motion | Composition |
|---|---|---|---|---|
| Entry | Minimum (2 rings / 1 hex / 3 nodes) | `elements[0]` cool / `colors[2]` regulator | `rotSpeed × 0.3`, no pulse | `shadowBlur=0`, `source-over`, alpha mult 0.25-0.6 |
| Activation | Progressively added | HSL fade cool → accent | Pulse ramps 0 → 0.5 amp at aspect rate | `shadowBlur` 0 → 8 |
| Peak | Full count + active effects | Accent at max saturation | Full pulse + breath wobble `sin(t*0.1Hz)*0.05` | `screen` blend for bloom layer, `shadowBlur = 16 + energy*12` |
| Regulation | Same count, motion dampens | HSL fade accent → `elements[1]` warm regulator | Pulse amp decays 1.0 → 0.3 exponential, `rotSpeed × 0.7` | revert to `source-over`, `shadowBlur` 16 → 6 |
| Integration | Eases into resting positions | Cross-fade to `#020208`-tinted accent | Pulse ≈ 0, `rotSpeed × 0.2` | `shadowBlur` 6 → 0, alpha 0.5 → 0.1 |

### State Machine Inside `animate()`

```ts
const animate = () => {
  const phase = getPhaseState(sessionTime, totalDuration)
  const env = phase.energyEnvelope
  const audio = energyRef.current
  const combinedEnergy = env * 0.7 + audio * 0.3
  const palette = computePalette(phase, protocol, accentColor)
  const motion  = computeMotion(phase, aspect)

  ctx.clearRect(...)
  drawBackground(ctx, palette, env)
  drawAspectGeometry(ctx, aspect, phase, palette, motion, combinedEnergy)
  drawParticles(ctx, palette, env, audio)
  drawCore(ctx, palette, env, audio)
}
```

`drawAspectGeometry` switches on aspect to per-aspect phase-aware renderers. Each draw function signature: `(ctx, phase, palette, motion, energy)`. Quincunx gets its own `drawQuincunx` — the single most visible visible bug.

### Data Extension

Extend `geometry.json` to encode per-phase parameters so visual evolution is data-driven, not hard-coded:

```json
{
  "aspect": "conjunction",
  "geometry": "circle",
  "phases": {
    "entry":       { "ringCount": 2,  "alphaMax": 0.4, "rotSpeed": 0.3 },
    "activation":  { "ringCount": 6,  "alphaMax": 0.7, "rotSpeed": 0.6 },
    "peak":        { "ringCount": 12, "alphaMax": 1.0, "rotSpeed": 1.0, "blendMode": "screen" },
    "regulation":  { "ringCount": 12, "alphaMax": 0.6, "rotSpeed": 0.7 },
    "integration": { "ringCount": 6,  "alphaMax": 0.2, "rotSpeed": 0.2 }
  }
}
```

---

### Sound Engine Rebuild

`soundEngine.ts` builds a static 8-layer chain in `startSessionSound`, ramps all gains from 0 to target over `behavior.attackTime`, sustains at constant level, then ramps to 0 in `stopSessionSound`. No `Tone.Transport`, no `setTimeout` phase sequencing (the only `setInterval` is the melodic phrase scheduler that loops forever, phase-unaware), no `behavior` re-evaluation. `SoundEngineController.tsx` calls `startSessionSound` once when `sessionActive` becomes true and never feeds phase state. The 10-step `SessionScreen` UI never calls into the sound engine when `stepIdx` changes.

### Per-Layer Status

| Layer | File:Line | Status | Gap |
|---|---|---|---|
| 1. Drone | L337-355 | Implemented | Static sine at `freq1`; never crossfades; Earth Om sub-bass bolted in instead of being its own controllable voice |
| 2. Harmonics | L360-368 | Implemented | 2nd + 3rd overtones fixed at -18 dB; `aspect_behavior.interval_style` (trine = maj_3rd/perf_5th/maj_6th) ignored |
| 3. Melodic | L373-400 | Implemented | `setInterval` not `Tone.Transport`; phrases never align to phases; never silences in Entry/Regulation |
| 4. Counter | L405-421 | Implemented | Pan LFO only; `chord_style: call_response / alternating` from `aspects.json` not honored |
| 5. Pulse | L427-435 | Implemented | Pulse rate set once at build time; never accelerates/decelerates per phase |
| 6. Binaural | L440-452 | Implemented | Always 4 Hz theta offset; should engage at Peak and back off at Integration |
| 7. Texture | L457-468 | Implemented | Pink noise + AutoFilter on at constant level; should swell Activation/Peak, fade Integration |
| 8. Solfeggio | L473-479 | Implemented | Static `ASPECT_SOLFEGGIO[aspect]`; `solfeggio-overlays.json` has 11 role-tagged entries (release, coherence, grounding) but `role` metadata never consulted |

### Five-Phase Sound Implementation

Add `PHASE_PLAN` as the timeline contract. Default = 900s (15 min), overridable from `ProtocolOutput.plan.sound.session_phases`:

```ts
const PHASE_PLAN = [
  { key: 'entry',       startSec: 0,    durSec: 120, layers: { drone: 1.0, earthOm: 1.0, harmonics: 0.0, melodic: 0.0, counter: 0.3, pulse: 0.6, binaural: 0.0, texture: 0.4, solfeggio: 0.0 }, pulseMul: 0.5, delayWet: 0.45, solfeggioRole: 'structural_grounding_overlay' /* 174 Hz */ },
  { key: 'activation',  startSec: 120,  durSec: 180, layers: { drone: 1.0, earthOm: 0.7, harmonics: 0.6, melodic: 0.4, counter: 0.8, pulse: 1.0, binaural: 0.4, texture: 0.8, solfeggio: 0.5 }, pulseMul: 1.0, delayWet: 0.35, solfeggioRole: 'corrective_overlay' /* 417 Hz */ },
  { key: 'peak',        startSec: 300,  durSec: 240, layers: { drone: 1.0, earthOm: 0.5, harmonics: 1.0, melodic: 1.0, counter: 1.0, pulse: 1.0, binaural: 1.0, texture: 1.0, solfeggio: 1.0 }, pulseMul: 1.4, delayWet: 0.40, solfeggioRole: 'coherence_overlay' /* 528 Hz */ },
  { key: 'regulation',  startSec: 540,  durSec: 180, layers: { drone: 0.9, earthOm: 0.9, harmonics: 0.4, melodic: 0.6, counter: 0.4, pulse: 0.5, binaural: 0.3, texture: 0.6, solfeggio: 0.6 }, pulseMul: 0.6, delayWet: 0.55, solfeggioRole: 'release_overlay' /* 396 Hz */ },
  { key: 'integration', startSec: 720,  durSec: 180, layers: { drone: 0.6, earthOm: 1.0, harmonics: 0.0, melodic: 0.0, counter: 0.0, pulse: 0.2, binaural: 0.0, texture: 0.2, solfeggio: 0.3 }, pulseMul: 0.3, delayWet: 0.60, solfeggioRole: 'depth_overlay' /* 936 Hz */ },
]
```

**rampTo Automation.** Refactor `buildSignalChain` to tag every layer with a stable key (`'drone' | 'harmonics' | …`) and capture `baseGainDb` per layer. Also return references to: master pulse LFO, shared `FeedbackDelay`, texture `AutoFilter`, binaural right oscillator, solfeggio oscillator. The chain is built once and never disposed mid-session — only faded — so phases can re-enter the same nodes.

**Scheduler.** Use `Tone.Transport` (survives suspend/resume) — not `setTimeout`:

```ts
Tone.Transport.stop(); Tone.Transport.position = 0
for (const phase of PHASE_PLAN) {
  Tone.Transport.scheduleOnce((time) => applyPhase(phase, time), phase.startSec)
}
Tone.Transport.start()

function applyPhase(phase, time) {
  for (const layer of state.layers) {
    const target = baseGain[layer.key] * phase.layers[layer.key]
    layer.gain.gain.cancelScheduledValues(time)
    layer.gain.gain.rampTo(target, 8, time)             // 8s crossfade, no clicks
  }
  pulseLFO.frequency.rampTo(phase.pulseMul * behavior.pulseRate, 4, time)
  sharedDelay.wet.rampTo(phase.delayWet, 6, time)
  textureAutoFilter.baseFrequency.rampTo(phase.key === 'peak' ? 600 : 200, 8, time)
  binauralR.frequency.rampTo(freq1 + (phase.layers.binaural * 4), 6, time)
  solfeggio.frequency.rampTo(ROLE_HZ[phase.solfeggioRole], 4, time)
}
```

**Layer Entry/Exit Timing.** All transitions are 8s crossfades on layer gains, 4-6s on parameter automation. Melodic scheduler stays a `setInterval` but reads a module-level `currentPhase` and gates `triggerAttackRelease` on `phase.layers.melodic > 0`. Solfeggio Hz hops via `rampTo` with 4s glide — pick frequency by role from `solfeggio-overlays.json` using a `ROLE_HZ` map.

**Parameter Targets (Peak).** Pulse rate ×1.4 multiplier on aspect base, texture filter center 600 Hz, binaural offset full 4 Hz, all layers at 1.0 multiplier. Regulation pulse ×0.6, filter back to 200 Hz, binaural to 1.2 Hz, harmonics to 0.4. Integration pulse ×0.3, binaural to 0, harmonics + melodic + counter to 0, drone to 0.6 (the bed remains).

**Phase Callback.** Add `onPhaseChange?: (phase: string) => void` arg to `startSessionSound` so `SessionScreen` can highlight the active stage and `SoundEngineController` can label the spectrum bar.

**Step Coupling (optional).** When user presses Next into 'crystal' or 'forks' steps, call a new `setSoundPhase('peak')` exported by `soundEngine` to fast-forward `Tone.Transport`. Keeps the audio narrative aligned with practitioner pacing instead of running on wall-clock alone.

---

### Five-Phase Session Envelope (Shared Contract)

Visual and sound must agree on a single timeline. The contract lives in `SoundProtocol.session_phases` (emitted by `engine.ts buildSoundProtocol`). `VisualProtocol.animation_phases` mirrors it with the same durations and a `dominant_color` per phase.

Naming alignment: the audit uses `Entry / Activation / Peak / Regulation / Integration` for the visual engine and `induction / entrainment / integration / release` for the sound timeline in the type definitions. **Decision: standardize on the visual five-name scheme** (`entry | activation | peak | regulation | integration`) and update the `SessionPhase.name` union in the type upgrade accordingly. This must be a unified enum or phase propagation breaks.

**Propagation model.** `SessionScreen` is the clock authority. It owns `sessionTime` and `totalDuration` and computes `phase = getPhaseState(sessionTime, totalDuration)` once per RAF tick. The current phase is:
- read by `VisualEngineCanvas` directly via props (`sessionTime`, `totalDuration`) — it computes its own phase per frame for sub-frame accuracy
- read by `SoundEngineController` which subscribes to `soundEngine.onPhaseChange` — the sound engine is the authority on what audio phase is playing because `Tone.Transport` is the master audio clock

**Drift handling.** If sound is the audio clock and visual is the wall clock, allow up to 2s drift before re-sync. On significant drift (>2s, e.g. tab was backgrounded), `SessionScreen` calls `soundEngine.syncToTime(sessionTime)` which calls `Tone.Transport.seconds = sessionTime` and re-runs `applyPhase` for the current phase at full `rampTo` duration.

**Step coupling.** When `currentStep` changes in `SessionScreen`, both engines receive the new step key. Optional override: practitioner-paced sessions can map step → phase explicitly (steps 1-2 → Entry, step 3 → Activation, fork sequence → Peak, breath → Regulation, close → Integration) instead of clock-driven.

**Per-phase shared targets:**

| Phase | Visual energyEnvelope | Sound pulseMul | Solfeggio Role | Binaural Hz |
|---|---|---|---|---|
| Entry | 0.0 → 0.3 | 0.5 | 174 grounding | 0 |
| Activation | 0.3 → 0.85 | 1.0 | 417 corrective | 1.6 |
| Peak | 0.85 → 1.0 + wobble | 1.4 | 528 coherence | 4.0 |
| Regulation | 1.0 → 0.5 | 0.6 | 396 release | 1.2 |
| Integration | 0.5 → 0.15 | 0.3 | 936 depth | 0 |

---

### File-by-File Change List

**Schema (foundation)**
- `src/types/index.ts` — replace `SoundProtocol`, replace `SightProtocol` with `VisualProtocol`, add `AnimationPhase / SessionPhase / AspectBehavior / Regulator / MotionType / KaleidoscopeMode / RhythmStyle / SoundMode`, update `ProtocolOutput.plan.sight` → `plan.visual` (keep alias one release)
- `src/lib/engine.ts` — rewrite `buildSoundProtocol` (L751-773) and `buildSightProtocol` → `buildVisualProtocol`; fetch `p2Colors.primary_colors` (currently dropped); emit structured `regulator`, `aspect_behavior`, `rhythm_style`, `session_phases`, `animation_phases`, geometry base/overlay split
- `src/data/sample-protocol.json` — regenerate as contract test fixture with all new fields
- `src/lib/pdfExport.ts` — switch reads from `plan.sight` → `plan.visual` (display fields preserved)

**Aesthetic (hologram pivot)**
- `src/styles/globals.css` — body bg `#020208`; remove purple from `.cosmic-bg::before/after`; add grid mesh, scanlines, scanner rails utilities; add `@keyframes signalSweep`, `lockPulse`, `scanSweep`; change `--planet-color` default `#8B5CF6` → `#22D3EE`; cyan replace in `.planet-card`, `.kowalski-card:hover`, `.kowalski-input:focus`
- `src/components/ui/index.tsx` — every `accent` default `#F59E0B` → `#22D3EE`; rebuild `GlassCard` recipe; `PrimaryButton` rounded-md + cyan inset top highlight + outset halo; `FormField` terminal underline; `ConfidenceBar` cyan default; `SectionLabel` cyan inline style
- `src/components/layout/CosmicBackground.tsx` — `#050714` → `#020208`; delete 4 nebula divs; clip or remove `<video>`; add top horizon glow / grid mesh / scanlines / scanner rails; stars cap 80, tint `#9BE9FF`
- `src/components/screens/ResultsScreen.tsx` — diagnosis hero double-bezel (cyan rim + 4-corner brackets + cyan radial 0.12); TransitCard rows (cyan left-rail, circular planet token w/ dashed outer ring, mono numerics, READOUT pill, hover sweep line); SenseTile HUD chips (cyan top-border, planet left-rail, glyph circle, mono Hz, signal-dot when in dominant signature)
- `src/components/screens/SessionScreen.tsx` — `topPanelStyle` cyan rim + inset top + mono timer; `StepCard` 4-corner brackets; breath pacer 3-ring scanner target (outer dashed rotating, middle scan-line sweep, inner planet disk); progress bar as 10 discrete tick segments; replace single overlay vignette with layered radial + scanSweep bar + corner brackets + bottom telemetry strip
- `src/components/screens/PractitionerScreen.tsx` — fork cards: cyan top hairline + planet left-rail, large mono Hz with text-glow, application point as `[ T-04 SACRUM ]` chip, vagal strength as 5-LED bar
- `src/components/screens/HomeScreen.tsx` — `Begin Evening Session` → `INITIATE SCAN SEQUENCE` rectangular bar w/ planet-color left rail, mono uppercase tracking, terminal chevron `>>`, hover scanline fill
- `src/components/engine/BodyMap.tsx` — planet tokens translucent cyan disks (not solid black pucks) + secondary planet-color ring; scanner rails extend out of bezel to screen edges; SVG meridian tick marks every 10%
- `public/images/body-anterior.png`, `public/images/body-posterior.png` — visual benchmark, no changes
- `index.html` — add `&family=JetBrains+Mono:wght@400;500;600` to Google Fonts link
- `tailwind.config.js` — add `fontFamily.mono: ['JetBrains Mono', 'ui-monospace', 'monospace']`, `colors.cyan.brand: '#22D3EE'`

**Visual Engine**
- `src/lib/phaseEngine.ts` — NEW. Export `Phase`, `PhaseState`, `getPhaseState(elapsed, total)`, ADSR `energyEnvelope` shaping per phase
- `src/components/engine/VisualEngineCanvas.tsx` — add `sessionTime` / `totalDuration` / `currentStep` props; compute phase per RAF frame (not in useEffect deps); rewrite all 6 draw functions to `(ctx, phase, palette, motion, energy)` signature per aspectGeometryMap implementation approaches; add dedicated `drawQuincunx`; add `computePalette` (HSL phase fade) and `computeMotion` (aspect-specific pulse rate); add `globalCompositeOperation` switching for Peak bloom
- `src/data/geometry.json` — extend each entry with `phases: { entry, activation, peak, regulation, integration }` parameter blocks (ringCount, alphaMax, rotSpeed, blendMode)
- `src/data/aspects.json` — no schema change; consumed by engine.ts for aspect_behavior emission
- `src/data/elements.json` — no schema change; consumed by VisualEngineCanvas for cool/warm endpoints of phase color fade

**Sound Engine**
- `src/lib/soundEngine.ts` — add `PHASE_PLAN` constant; refactor `buildSignalChain` to tag layers with stable keys + return refs to pulseLFO, sharedDelay, textureAutoFilter, binauralR, solfeggio; add `applyPhase(phase, time)` with `rampTo` automation across gains and parameters; replace one-shot ramp in `startSessionSound` with `Tone.Transport.scheduleOnce` loop; add `onPhaseChange` callback arg; add `setSoundPhase(key)` and `syncToTime(seconds)` exports; gate melodic scheduler on `currentPhase.layers.melodic > 0`; map solfeggio role → Hz via `solfeggio-overlays.json`
- `src/components/engine/SoundEngineController.tsx` — pass `onPhaseChange` callback when calling `startSessionSound`; expose current phase to `SessionScreen` for UI labeling
- `src/data/solfeggio-overlays.json` — no schema change; ensure all 11 role-tagged entries are accessible by `role` key

**Session Coordination**
- `src/components/screens/SessionScreen.tsx` — read `plan.visual` (was `plan.sight`); forward `sessionTime`, `totalDuration`, `currentStep` to `VisualEngineCanvas`; optionally call `soundEngine.setSoundPhase` on step transitions; render phase label in HUD telemetry strip
- `src/components/screens/ResultsScreen.tsx` — read `plan.visual.description` / `delivery` (UI-only)

---

### Phase Ordering

**Schema first. Non-negotiable.** Both engines read from `ProtocolOutput`. Until `engine.ts` emits structured `regulator`, `aspect_behavior`, `session_phases`, `animation_phases`, `primary_colors / secondary_colors / regulator_color`, and `geometry_base / geometry_overlay`, neither engine can be rebuilt against its target API — they'd be coded against a moving contract and re-rewritten when schema lands. Schema also unblocks `sample-protocol.json` as a fixture both engines develop against in parallel.

**Sound engine before visual engine.** Three reasons:

1. **Audio is the authoritative clock.** `Tone.Transport` is the master timeline in the runtime architecture. The visual engine's drift-correction depends on a sound-emitted phase callback. Wiring sound-as-clock first means visual can develop against a real `onPhaseChange` event source from day one rather than a mock.
2. **Sound engine work is additive, not destructive.** All 8 layers already exist and play correctly. The work is wrapping them in `Tone.Transport.scheduleOnce` + `rampTo`. The risk surface is small and the existing audio output is the regression baseline. Visual engine work requires deleting and rewriting the 6 draw functions — higher risk, longer cycle.
3. **Aesthetic pivot has no dependency on either engine.** The hologram CSS token swap is fully parallelizable. Sprint it alongside schema + sound on a second swimlane.

**Recommended sprint structure:**

- Sprint A (1 week): Schema upgrade + aesthetic P0 token swap. Two ICs.
- Sprint B (1 week): Sound engine phase scheduler + aesthetic P0/P1 surface fixes. Two ICs.
- Sprint C (2 weeks): Visual engine rebuild — `phaseEngine.ts`, all 6 aspect renderers, `geometry.json` phase parameter extension. One IC focused.
- Sprint D (1 week): Session coordination + drift handling + step coupling + signal-lock retrofit.

---

### Definitive Next Three Commits

**PR #1: `feat(schema): structured ProtocolOutput for renderer engines`**

Scope: `src/types/index.ts` (replace SoundProtocol, replace SightProtocol with VisualProtocol, add all new types), `src/lib/engine.ts` (rewrite `buildSoundProtocol` + `buildSightProtocol` → `buildVisualProtocol`, fetch p2 colors, emit `session_phases` with 5-phase contract `entry|activation|peak|regulation|integration`, structured `regulator`, `aspect_behavior` from `aspectsData.music_behavior`, geometry base/overlay split), `src/data/sample-protocol.json` (regenerate as contract fixture), `src/lib/pdfExport.ts` (`plan.sight` → `plan.visual`), back-compat `plan.sight` getter alias on `ProtocolOutput.plan`. Display strings preserved so existing UI cards still render. No engine consumer changes in this PR — pure contract.

**PR #2: `feat(aesthetic): hologram pivot — P0 token swap + CosmicBackground rebuild`**

Scope: `src/styles/globals.css` (body bg `#020208`, drop purple nebulae, add grid mesh / scanlines / scanner rails / signal-lock keyframes, swap `--planet-color` default cyan, cyan replace in `.planet-card` / `.kowalski-card` / `.kowalski-input`), `src/components/ui/index.tsx` (every accent default `#F59E0B` → `#22D3EE`, `GlassCard` hologram recipe, `PrimaryButton` rounded-md + cyan inset top + outset halo, `ConfidenceBar` cyan default, `SectionLabel` cyan), `src/components/layout/CosmicBackground.tsx` (full rebuild — delete 4 nebulae, add 4 layered overlays, cap stars at 80 + tint `#9BE9FF`), `index.html` (add JetBrains Mono import), `tailwind.config.js` (mono fontFamily + cyan.brand). Defers: ResultsScreen / SessionScreen / PractitionerScreen / HomeScreen / BodyMap surface rewrites — those land in PR #4.

**PR #3: `feat(sound): five-phase Tone.Transport scheduler with rampTo automation`**

Scope: `src/lib/soundEngine.ts` (add `PHASE_PLAN` constant reading from `protocol.plan.sound.session_phases` with default fallback, tag all layers with stable keys + capture `baseGainDb`, refactor `buildSignalChain` to return refs to pulseLFO / sharedDelay / textureAutoFilter / binauralR / solfeggio, add `applyPhase(phase, time)` with 8s gain `rampTo` + 4-6s parameter automation, replace one-shot ramp in `startSessionSound` with `Tone.Transport.scheduleOnce` loop, add `onPhaseChange` callback arg + `setSoundPhase(key)` + `syncToTime(seconds)` exports, gate melodic scheduler on `currentPhase.layers.melodic > 0`, add `ROLE_HZ` map for solfeggio overlay role → Hz), `src/components/engine/SoundEngineController.tsx` (pass `onPhaseChange`, expose current phase via context for SessionScreen labeling), `src/components/screens/SessionScreen.tsx` (subscribe to phase change, render phase name in HUD telemetry strip — minimal UI change, full session HUD overhaul lands later). Visual engine still receives no phase data in this PR — that wiring lands in PR #5 (phaseEngine.ts + VisualEngineCanvas rewrite).