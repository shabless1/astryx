# ASTRYX — Cosmic Resonance System
### Claude Code Build Manifest | v1.4 | May 2026

---

## What Is This

Astryx is a **deterministic multi-sensory calibration system**. It uses natal astrology as a structured pattern recognition engine — not for prediction — to generate a personalized five-layer wellness protocol covering **Sound, Scent, Taste, Body, and Sight**.

Same birth data always produces the same output. The system is deterministic, repeatable, and grounded in real astronomical calculation.

**Positioning:** Calibration not prediction. Blueprint not reading. Signal not sign. System not mysticism.

**All assessment language uses probabilistic framing:** "may suggest," "may indicate," "may correlate with." This is intentional and non-negotiable throughout the app.

---

## Three Access Tiers (Compliance-Aware Pricing)

| Tier | Price | Access | Gate |
|------|------:|--------|------|
| **🌑 Individual** | **$9.95/mo** | Plain-language diagnostic, prescriptions, transit weather, daily home screen. Always-on referral framing. Symptom intake limited to general states (not medical conditions). | Account + Individual Attestation |
| **🌒 Practitioner** (self-attested) | **$39.95/mo** | Clinical terminology unlocked, classical references cited inline, client roster, session notes, PDF export with name + claimed modality on footer | Account + Professional Attestation (signed, audit-trailed) |
| **🌕 Verified Practitioner** | **$59/mo** | Verified badge on client-facing materials, PDF templates with credential auto-filled, client referral letter templates, insurance-grade SOAP, multi-client billing exports | Practitioner tier + License/cert uploaded & verified |

**Legacy XRP payment** remains available as alternate billing rail at any tier (5 XRP one-time = one year of equivalent tier access; see `xrpPayment.ts`).

**SHA is the architect, not a developer.** All technical decisions are yours. Never ask SHA to write or modify code. When you hit a fork, choose the better path, document what you chose, and move forward.

---

## 🚨 COMPLIANCE — NON-NEGOTIABLE

Before writing ANY output-facing text (UI strings, JSON data, PDF exports, email copy), READ `COMPLIANCE.md` at the project root. It is the constitutional document for every word the app emits.

**Key enforcement points:**

- All clinical language must pass through `lib/compliance.ts` helpers (`safePhrase()`, `withDisclaimer()`, `safetyGate()`)
- 7 banned phrases never appear in output (see COMPLIANCE.md §2)
- Universal Disclaimer renders on every output screen + every PDF
- Persistent micro-disclaimer (`ⓘ Reference tool · Not medical advice`) in every screen footer
- Crisis keyword detection runs on every text intake before processing
- Practitioner attestation captured + audit-trailed per COMPLIANCE.md §10
- Source citation discipline — every clinical claim traces to a cited classical source

If you write a string and you're unsure it complies, run it through `lintForBannedPhrases()` or `safetyGate()` before shipping.

**Posture in one sentence:** Astryx is the reference instrument; the licensed practitioner is the diagnostician. Tote the line, never cross it.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Next.js 14 (App Router)** | Full-stack React, API routes, SSR |
| Language | **TypeScript** | All source files are `.tsx` / `.ts` |
| Styling | Tailwind CSS | Utility-first responsive design |
| State | Zustand (persisted) | Global app state with localStorage sync |
| Auth | NextAuth.js v4 | Google OAuth + email/password, JWT |
| Ephemeris | astronomy-engine | NASA JPL natal chart calculation |
| Geocoding | OpenStreetMap Nominatim | City → lat/lng (free, no API key) |
| Timezone | tz-lookup | lat/lng → IANA timezone (offline) |
| Sound | Tone.js | Multi-layer 6-channel frequency synthesis |
| Payments | **XRPL (XRP Ledger)** | 5 XRP one-time payment → premium unlock |
| PDF Export | jsPDF | Client-side protocol report |
| Chart Wheel | Canvas / SVG (native) | Interactive natal chart visualization |
| Body Map | SVG (native) | Planetary body region mapping |

**Do NOT use:**
- Vite (this is Next.js 14)
- React Router (Next.js App Router handles routing)
- @react-pdf/renderer (use jsPDF)
- Web Audio API alone (use Tone.js)
- Supabase (auth is NextAuth.js)
- Three.js Phase 1 (native SVG for chart wheel and body map)

**Install:**
```bash
npm install
# All dependencies in package.json — do not add new packages without checking existing coverage
```

---

## Existing Codebase

**This is NOT a greenfield project.** The v1.4 codebase is fully built. Read the existing source before writing anything. The structure is:

```
astryx/
├── public/
│   ├── images/
│   │   ├── logo.png                    ← Brand logo
│   │   ├── background_male.png         ← Male low-poly body mesh reference
│   │   ├── ASTRYX_BACKGROUND.png       ← Primary cosmic background
│   │   └── biometric.png               ← Biometric body reference
│   ├── videos/
│   │   ├── ASTRYX_BACKGROUND_VIDEO.mp4 ← Looping cosmic background video
│   │   └── background_video_2.mp4
│   └── manifest.json                   ← PWA manifest
├── src/
│   ├── app/
│   │   ├── layout.tsx                  ← Root layout + SessionProvider
│   │   ├── page.tsx                    ← Main app controller
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── chart/route.ts          ← Natal + Solar Chart calculation
│   │       ├── geocode/route.ts        ← City → coords + timezone
│   │       └── payment/xrp/route.ts   ← XRPL payment verification
│   ├── components/
│   │   ├── layout/
│   │   │   ├── CosmicBackground.tsx    ← Video/canvas cosmic background
│   │   │   └── NavBar.tsx
│   │   ├── screens/
│   │   │   ├── AuthScreen.tsx
│   │   │   ├── IntakeScreen.tsx        ← Birth data + Solar Chart toggle
│   │   │   ├── AnalysisScreen.tsx      ← Sacred geometry loader
│   │   │   ├── ResultsScreen.tsx       ← Assessment + ChartTabs
│   │   │   ├── SessionScreen.tsx       ← Fullscreen visual + sound + 4-7-8 breath
│   │   │   ├── PractitionerScreen.tsx  ← Premium — planet grid, forks, PDF
│   │   │   ├── PaymentScreen.tsx       ← XRP upgrade flow
│   │   │   ├── HistoryScreen.tsx       ← Previous session archive
│   │   │   └── SettingsScreen.tsx
│   │   ├── ui/
│   │   │   ├── index.tsx               ← Shared UI components
│   │   │   └── BirthLocationField.tsx  ← Geocode autocomplete field
│   │   └── engine/
│   │       ├── NatalChartWheel.tsx     ← Interactive SVG zodiac wheel
│   │       ├── BodyMap.tsx             ← Planetary body region SVG
│   │       ├── ChartTabs.tsx           ← Assessment | Natal Chart | Body Map tabs
│   │       ├── VisualEngineCanvas.tsx  ← Session screen visual engine
│   │       ├── SoundEngineController.tsx
│   │       ├── SoundPreviewButton.tsx
│   │       └── PractitionerExport.tsx  ← PDF export component
│   ├── data/                           ← ALL JSON libraries (see Data Files section)
│   ├── lib/
│   │   ├── engine.ts                   ← Protocol generator (SOAP + 5 layers)
│   │   ├── ephemeris.ts                ← Chart calculation (astronomy-engine)
│   │   ├── solarChart.ts               ← Solar Chart mode (birth time unknown)
│   │   ├── soundEngine.ts              ← Tone.js 6-layer frequency system
│   │   ├── pdfExport.ts                ← jsPDF practitioner report
│   │   ├── xrpPayment.ts               ← XRPL payment verification
│   │   ├── auth.ts                     ← NextAuth helpers
│   │   ├── timezone.ts                 ← tz-lookup wrapper
│   │   ├── store.ts                    ← Zustand state
│   │   └── utils.ts
│   ├── styles/globals.css
│   └── types/index.ts
├── .env.example
├── CLAUDE.md                           ← this file
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## Screen Map

| Screen | Purpose | Gate |
|--------|---------|------|
| Auth | Sign in / sign up (email or Google) | None |
| Intake | Birth data entry + Solar Chart toggle | None |
| Analysis | Sacred geometry loader (~3.5s) | None |
| Results | SOAP Assessment + Natal Chart Wheel + Body Map tabs | None |
| Session | Fullscreen visual + sound engine + 4-7-8 breath guide | None |
| Practitioner | Planet grid, tuning forks, session controls, Chart + Body Map + PDF | **Premium** |
| Payment | XRP upgrade flow (5 XRP → premium unlock) | Auth required |
| History | Previous session archive | None |
| Settings | Preferences, mode, session defaults | None |

---

## Engine Flow

```
1. Intake — name, birth date/time (or "unknown"), birth city, symptoms, emotional state, intention
2. Geocode — birth city → lat/lng + IANA timezone (OpenStreetMap + tz-lookup)
3. Chart mode — birth time known → Natal Chart (Placidus) | unknown → Solar Chart (Sun on ASC)
4. POST /api/chart → astronomy-engine calculates planets, houses, ASC/MC, aspects
5. Protocol engine → dominant aspect pattern scored → SOAP assessment + 5 sensory protocols
6. Results screen → ChartTabs: Assessment | Natal Chart Wheel | Body Map
```

---

## Solar Chart Mode

When birth time is unknown, Astryx switches to **Solar Chart mode** — a standard professional technique:
- Sun placed exactly on the Ascendant (0° of Sun's sign)
- House cusps align with sign boundaries
- All 10 planetary positions and aspects remain astronomically accurate
- Labelled clearly as "☉ Solar Chart" throughout UI, PDF, and API response
- `isSolarChart: true` flag propagates through chart wheel, body map, and PDF export
- Confidence score is NOT reduced — only house-based scoring is approximate
- User taps "I don't know my birth time →" to activate. Can revert with "Enter time."

---

## Data Files — Complete Library (23 files)

### Base v1.4 Library (18 files — do not modify schemas)

| File | Records | Used By |
|------|---------|---------|
| `planets.json` | 15 | Sound Hz, scent, taste, body protocols, body map |
| `aspects.json` | 6 | Sound behavior, visual geometry, aspect lines |
| `signs.json` | 12 | Body regions, body map overlays, sound modulation |
| `houses.json` | 12 | House themes, body areas |
| `elements.json` | 4 | Elemental wellness profiles |
| `modalities.json` | 3 | Behavioral patterns |
| `geometry.json` | 6 | Aspect → sacred geometry + motion |
| `colors.json` | 10 | Planet → color therapy palette |
| `planetary-anchors.json` | 15 | Planet Hz frequencies + Earth Om (Cousto) |
| `sign-modulation.json` | 12 | Sign → sound Hz bias |
| `solfeggio-overlays.json` | 11 | Aspect → solfeggio Hz |
| `scents.json` | 10 | Planet → essential oils |
| `herbs.json` | 10 | Planet → herbal blend + tea |
| `body-protocols.json` | 10 | Planet → breath, movement, posture, orientation |
| `symptoms.json` | 20+ | Symptom → planet/sign cross-reference for scoring |
| `soap-templates.json` | 6 | Dominant aspect → SOAP text templates |
| `taste-map.json` | 10 | Planet → taste profile |
| `sample-protocol.json` | 1 | Complete sample output for testing |

### Sacred Extension Library (5 files — Astryx proprietary layer)

These files are the Astryx-specific Sacred Tones and botanical/crystal system. They sit on top of the base library and power the Practitioner Portal's differentiating features.

| File | Records | Purpose |
|------|---------|---------|
| `sacredTones_nervousSystem.json` | 13 | Physical tuning fork specs — Hz, nerve plexus, vagal data, binaural offsets, chakra mapping |
| `sacredBotanicals.json` | 9 | Tier 2 Sacred Botanicals — one master plant per planet, full biological spec |
| `crystalsExpanded.json` | 9 | Featured crystal per planet — mineralogy, biological mechanism, body placement |
| `lotusSpectrum.json` | 4 | Red, White, Blue, Egyptian Blue lotus — proprietary Astryx IP |
| `starterKits.json` | 4 | Physical product kits linking to sacredtea.net shop |

---

## Sound Engine — 6 Layers (Tone.js)

| Layer | Source | Channel | Purpose |
|-------|--------|---------|---------|
| 1 — Primary | Dominant planet Hz | Left | Dominant planetary tone |
| 2 — Secondary | Planet 2 Hz + binaural | Right | Secondary + binaural depth |
| 3 — Earth Om | 136.10 Hz | Center | Grounding regulator |
| 4 — Binaural | Planet 1 Hz + 2× offset | Right | Binaural beat |
| 5 — Solfeggio | Aspect-mapped Hz | Center | Harmonic overlay |
| 6 — Noise pad | Pink noise + sweep | Center | Cosmic texture |

Pulse rates by aspect: Conjunction 0.08 Hz | Square 0.60 Hz | Opposition 0.20 Hz | Trine 0.12 Hz | Sextile 0.25 Hz | Quincunx 0.18 Hz

---

## Natal Chart Wheel — NatalChartWheel.tsx

Interactive SVG zodiac wheel — no external charting library:
- 12 zodiac sign segments with glyphs, color-coded by element
- 12 Placidus house cusps, angular houses (1,4,7,10) highlighted in accent color
- Aspect lines — solid for hard aspects, dashed for soft
- Planet glyphs at correct ecliptic longitudes with degree lines
- Hover any planet → highlight aspect lines + detail card
- Toggle controls: show/hide aspects and houses independently
- Solar Chart badge when `isSolarChart: true`

---

## Body Map — BodyMap.tsx

Human silhouette SVG with planetary region overlays from `signs.json`:
- Each planet's sign → body_regions + organs_systems from signs.json
- Active regions glow in planet color with planet glyph inside
- Multiple planets sharing a region stack glyphs side by side
- Hover any region → detail panel (planet, sign, house, body systems, organs)
- Inactive regions shown as faint dashed outlines

---

## Authentication — NextAuth.js

- Email/password sign-up — works immediately, no OAuth setup required
- Google OAuth — optional, configure `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- Users can continue without an account (free tier works fully, sessions not saved)
- JWT-based session, `isPremium` flag stored in token after XRP payment confirmed

---

## Payment — XRP (XRPL)

- **5 XRP** = permanent premium unlock (not a subscription)
- User taps Upgrade → Payment screen → unique destination tag generated
- User sends 5 XRP to SHA's wallet with their destination tag
- App polls `/api/payment/xrp` every 8 seconds
- On ledger confirmation → `grantPremium(userId)` → JWT updated → Practitioner unlocked
- Development: `XRP_NETWORK=testnet` — use faucet.altnet.rippletest.net for free test XRP
- Production: `XRP_NETWORK=mainnet` + SHA's real XRP wallet address

---

## Environment Variables

```bash
# .env.local — required
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://yourdomain.com          # http://localhost:3000 for local dev
NEXT_PUBLIC_XRP_ADDRESS=rYourXRPWalletAddress
XRP_NETWORK=testnet                          # switch to mainnet for live payments

# .env.local — optional
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Feature Flags (Astryx extension layer)
NEXT_PUBLIC_SHOP_LIVE=false                  # Set true when sacredtea.net product pages are live
NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE=false     # Set true when tuning fork product page is live
```

**Shop URL when live:** `https://sacredtea.net`
**Sacred Tones URL when live:** `https://sacredtea.net/products/planetary-tuning-forks`

---

## Design System

### Colors
```css
--color-bg:        #020208;   /* deep space black — primary background */
--color-gold:      #F59E0B;   /* amber gold — primary brand, headings, accents */
--color-purple:    #C084FC;   /* cosmic purple — secondary accent */
--color-cyan:      #38BDF8;   /* electric cyan — highlights, active states */
--color-magenta:   #FF006E;   /* magenta — energy, alerts, emphasis */
--color-slate:     #94A3B8;   /* slate — body text, labels */
--color-surface:   #0F0F1A;   /* card/panel background */
--color-border:    #1E1B4B;   /* subtle borders */
```

Aspect line colors: Conjunction #F4A940 | Opposition/Square #E8453C | Trine #4CAF89 | Sextile #2EC4B6 | Quincunx #9B5DE5

### Typography
```
Wordmark: Cinzel Decorative (Google Font)
Headings: Cinzel (Google Font)
Body/UI:  Exo 2 (Google Font)
```

### Animation System
- `bodyFloat` — 7s ease-in-out infinite — vertical float on body figure
- `breathe` — 5s ease-in-out infinite — aura glow scales 1→1.25 and back
- `corePulse` — 3.5s — orbital ring core sphere pulse
- `orb1/2/3` — 9s/13s/17s linear — three gold rings at different speeds
- `nodeAura` — 2.2s — chakra node aura rings scale and fade
- Star field — 380 stars, individually twinkling

---

## Key Rules

1. **Never ask SHA to code.** Make the best decision and document what you chose.
2. **TWO frequency systems, kept separate.** (a) The **PLANETARY protocol** — forks, chamber audio, planetary anchors — comes from `planetary-anchors.json` and `sacredTones_nervousSystem.json` only, sourced from Hans Cousto's Law of the Octave. Do NOT use Solfeggio for the planetary protocol. (b) The **CHAKRA layer** uses the standard chakra **Solfeggio** tones (Root 396 · Sacral 417 · Solar Plexus 528 · Heart 639 · Throat 741 · Third Eye 852 · Crown 963), drawn from `solfeggio-overlays.json` (which also feeds the aspect harmonic overlay). The chakra Hz live in the `CHAKRAS` array in `BodyMap.tsx`. (SHA directive 2026-06-20 — corrected from the old C-scale 256–480 values.)
3. **All probabilistic framing is non-negotiable.** Every assessment output must use "may suggest," "may indicate," "may correlate with." Never say "you have" or "you are."
4. **Malachite gets a red warning badge everywhere it appears.** Non-negotiable. Raw malachite contains toxic copper carbonate dust — only polished/sealed is safe.
5. **The Lotus Spectrum is proprietary Astryx IP.** Treat `lotusSpectrum.json` as a flagship feature, not a footnote.
6. **All safety notes from data files must render in the UI.** Never omit a safety warning.
7. **Solar Chart mode must always be labeled clearly** — "☉ Solar Chart" badge in wheel, PDF, and API response. Never hide or downplay it.
8. **Feature flags are sacred.** Never hard-code sacredtea.net shop URLs — always check `NEXT_PUBLIC_SHOP_LIVE` and `NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE`.
9. **Sacred Tones = physical products.** SHA makes real metal planetary tuning forks (13 forks, Cousto Hz). The Practitioner screen's fork data comes from `sacredTones_nervousSystem.json`. The shop link gates the product page until it goes live.
10. **Scorpio dual-ruler:** `planets.json` assigns Mars to Scorpio for Phase 1. Pluto dual-ruler is Phase 2.
11. **Do not import Three.js.** The Chart Wheel and Body Map are native SVG. Three.js upgrade is Phase 3+.
12. **The Astryx.jsx artifact** (in the parent folder) is the working Claude-preview version of the app — a useful reference, but the canonical codebase is the `src/` TypeScript source.

---

## Sacred Tones — The Physical Product Bridge

SHA makes physical planetary tuning forks called **Sacred Tones** — real metal forks tuned to Cousto cosmic octave Hz. The Practitioner screen's crown feature is Sacred Tones Session Mode: the app shows which fork to apply to which body point for this specific client's chart.

The fork-to-body-point data lives in `sacredTones_nervousSystem.json`. The shop CTA gates until `NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE=true`.

---

## Deployment

**Vercel (start here):**
```bash
git init && git add . && git commit -m "Astryx v1.4"
gh repo create astryx --private --push
# vercel.com → New Project → Import → Framework: Next.js → add env vars → Deploy
```

**VPS (when revenue hits — Hetzner CPX11 €3.29/mo):**
```bash
npm install && npm run build
pm2 start npm --name astryx -- start
```

**PWA:** `manifest.json` already configured. iOS: Safari → Share → Add to Home Screen. Android: Chrome → Install App.

---

## Scaling Roadmap

| Phase | Feature | Priority |
|-------|---------|---------|
| **Now** | Bug fixes, Sacred Tones extension integration, shop feature flags | Immediate |
| 2 | Database persistence (Prisma + Postgres) | High — user sessions survive restarts |
| 3 | Swiss Ephemeris upgrade | Medium — academic-grade precision |
| 4 | Practitioner dashboard — multi-client roster, session history | High — B2B revenue |
| 5 | Native mobile (Expo / React Native) | Medium — after web revenue |
| 6 | AI interpretation layer (Claude API) | High — major differentiator |
| 7 | DAO / community token for IN THE BLACK | Long-term — XRP integration |

---

## Reference Documents (read these for deep context)

All documents are in the parent folder alongside this codebase.

| Document | What It Covers |
|----------|---------------|
| `ASTRYX_BLUEPRINT_v1.4.docx` | Full v1.4 technical architecture, API routes, all component specs, sound engine, deployment |
| `ASTRYX_COMPLETE_GUIDE_v1.4.docx` | User guide, practitioner guide, marketing strategy, deployment walkthrough |
| `ASTRYX_Practitioner_Mode_Spec_v1.docx` | Practitioner Portal deep spec — Sacred Tones Session Mode, client roster, PDF export, Supabase schemas (historical reference) |
| `ASTRYX_Nervous_System_Addendum_v1.docx` | Vagus nerve overlay, nervous system data for 13 planetary forks, binaural mode, Vagal Tone Tracker |
| `ASTRYX_Botanical_Crystal_Addendum_v1.docx` | Two-tier botanical library, Sacred Botanicals, Lotus Spectrum, crystal biological mechanisms, starter kit products |

---

*End of CLAUDE.md — ASTRYX v1.4 | Next.js 14 · Tone.js · astronomy-engine · XRPL*
