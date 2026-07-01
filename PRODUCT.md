# PRODUCT.md — Astryx Brand Register

This file is read by the Impeccable skill before any design command runs.
Rules here OVERRIDE all default anti-pattern guidance.

---

## Product Identity

**Name:** Astryx — Cosmic Resonance System
**Category:** Medical-astrology diagnostic wellness app
**Positioning:** Calibration not prediction. Blueprint not reading. Signal not sign. System not mysticism.
**Audience:** Wellness practitioners, self-directed individuals interested in astrology-based calibration, holistic health

---

## Intentional Brand Aesthetic — DO NOT "FIX" THESE

The following design choices are NOT anti-patterns. They are the brand. Impeccable must treat them as gospel.

### Colors — Sacred and Intentional

| Token | Value | Sacred? |
| --- | --- | --- |
| `--color-bg` | `#020208` — deep space black | ✅ Yes |
| `--color-gold` | `#F59E0B` — amber gold | ✅ Yes |
| `--color-purple` | `#C084FC` — cosmic purple | ✅ Yes |
| `--color-cyan` | `#38BDF8` — electric cyan | ✅ Yes |
| `--color-magenta` | `#FF006E` — energy magenta | ✅ Yes |
| `--color-surface` | `#0F0F1A` — deep panel | ✅ Yes |

**The cosmic purple glow is intentional brand identity.** It is not AI slop. It is the primary atmospheric signature of the Astryx universe. Do not mute it, replace it, or reduce it.

**Purple-to-deep-space gradients are intentional.** This is not the generic SaaS purple-to-blue gradient. It is a purpose-built deep space palette.

**Neon accent colors (cyan, magenta) are intentional.** They mark active states and frequency resonance. Do not neutralize them.

### Backgrounds and Atmosphere

The black background (`#020208`) is the foundational "deep space" environment. It is not a dark mode toggle — it is the only mode. Do not suggest light mode alternatives.

**Radial gradient nebula effects** (glowing ellipses in purple, cyan, and planet-reactive RGB values) are core to the visual language. They are not "dark glows on dark backgrounds" — they are the cosmic atmosphere system. Do not remove or reduce them.

**The video background** (`ASTRYX_BACKGROUND_VIDEO.mp4`) at 8-12% opacity provides living depth. Sacred.

### Glassmorphism

All panels and cards use glassmorphism: `background: rgba(...)`, `backdrop-filter: blur(20px)`, `border: 1px solid rgba(255,255,255,0.1)`. This is intentional and consistent. Do not replace with flat surfaces.

### Typography

| Role | Font | Sacred? |
| --- | --- | --- |
| Wordmark | Cinzel Decorative | ✅ Yes |
| Headings | Cinzel | ✅ Yes |
| Body/UI | Exo 2 | ✅ Yes |

These are cosmic, ceremonial typefaces chosen deliberately. Do not suggest Inter, system UI, or generic alternatives.

### Animations

The animation system uses named keyframes (`bodyFloat`, `breathe`, `corePulse`, `orb1/2/3`, `nodeAura`). These are brand animations, not generic CSS. The star field twinkle system (380 stars), parallax layers, and planet-reactive color temperature transitions are core features — not decorative filler.

Slower, more deliberate animation timing (7s float cycles, 5s breathe cycles) is intentional. This is a calibration tool, not a productivity app. The tempo is meditative.

---

## What IS Open to Improvement

Impeccable CAN improve:

- **Accessibility** — contrast ratios, focus states, ARIA labels, keyboard navigation
- **Performance** — `transition: all` → specific properties, hardware acceleration
- **UX copy** — button labels, error messages, empty states
- **Component responsiveness** — mobile layout, touch targets
- **Loading states** — analysis screen, skeleton states
- **Interaction feedback** — hover states on buttons and cards
- **Typography hierarchy** — size/weight relationships within the existing type system
- **Spacing rhythm** — within the existing dark surface system
- **Error handling** — form validation, API failure states

---

## Compliance Non-Negotiables

Astryx has strict compliance requirements (see `COMPLIANCE.md`). When writing or suggesting UX copy:

- Use probabilistic framing: "may suggest," "may indicate," "may correlate with"
- Never write: "you have," "you are," "diagnoses," "treats," "cures," "heals," "prevents"
- Every output screen must include the universal disclaimer
- Persistent micro-disclaimer (`ⓘ Reference tool · Not medical advice`) must appear in every screen footer

---

## Sacred Products Referenced in UI

- **Sacred Tones** — physical planetary tuning forks (real metal, Cousto Hz). The fork product page at `sacredtea.net/products/planetary-tuning-forks` is gate-flagged by `NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE`. Do not remove or hard-code shop links.
- **The Lotus Spectrum** — proprietary Astryx IP (4 lotus species). Treat as flagship, not footnote.
- **House of MahMah Tea** — the parent brand. All wellness content must align with this ecosystem.

---

## Register: Brand vs Product

| Layer | Classification |
| --- | --- |
| Deep space palette | **Brand** — never change |
| Cosmic purple glow | **Brand** — never change |
| Glassmorphism panels | **Brand** — never change |
| Cinzel/Exo 2 fonts | **Brand** — never change |
| Meditative animation tempo | **Brand** — never change |
| Component spacing rhythm | **Product** — open to improvement |
| UX copy and labels | **Product** — open to improvement |
| Interaction states | **Product** — open to improvement |
| Responsive layout | **Product** — open to improvement |
| Accessibility | **Product** — must improve |
