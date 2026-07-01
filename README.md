# Astryx — Cosmic Resonance System

> A deterministic multi-sensory calibration system that translates astrological pattern intelligence into structured wellness protocols.

---

## What it is

Astryx is **not** a fortune-telling app. It is a **deterministic pattern engine** that:

1. Parses a natal chart from birth data
2. Detects planetary pair configurations and aspect scores
3. Cross-references symptom input for confirmation weighting
4. Generates a structured SOAP-format output
5. Builds a five-layer sensory protocol: Sound · Scent · Taste · Body · Sight

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Visual Engine | Canvas 2D / Three.js ready |
| State | Zustand (persisted) |
| Sound | Tone.js ready |
| Data | Local JSON libraries |
| PWA | Web manifest included |

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Copy env
cp .env.example .env.local

# 3. Add your assets to /public
#    Place your background videos:
#      /public/videos/ASTRYX_BACKGROUND_VIDEO.mp4
#      /public/videos/background_video_2.mp4
#    Place your images:
#      /public/images/ASTRYX_BACKGROUND.png
#      /public/images/background_male.png
#      /public/images/logo.png

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
astryx/
├── public/
│   ├── videos/              # MP4 background videos (add yours here)
│   ├── images/              # Background PNGs + logo
│   └── manifest.json        # PWA manifest
│
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout + fonts + metadata
│   │   └── page.tsx         # Main app controller
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── CosmicBackground.tsx   # Video + image + star field
│   │   │   └── NavBar.tsx             # Top navigation
│   │   ├── screens/
│   │   │   ├── IntakeScreen.tsx       # Step 1: Data collection
│   │   │   ├── AnalysisScreen.tsx     # Step 2: Sacred geometry loader
│   │   │   ├── ResultsScreen.tsx      # Step 3: SOAP + protocol cards
│   │   │   ├── SessionScreen.tsx      # Step 4: Immersive visual session
│   │   │   ├── PractitionerScreen.tsx # Step 5: Full pattern view
│   │   │   ├── HistoryScreen.tsx      # Session archive
│   │   │   └── SettingsScreen.tsx     # Preferences
│   │   ├── ui/
│   │   │   └── index.tsx              # Shared UI components
│   │   └── engine/
│   │       └── VisualEngineCanvas.tsx # Canvas 2D visual engine
│   │
│   ├── data/                # All JSON libraries (18 files)
│   ├── lib/
│   │   ├── engine.ts        # Core deterministic pattern engine
│   │   ├── store.ts         # Zustand state management
│   │   └── utils.ts         # Helper functions
│   ├── styles/
│   │   └── globals.css      # Global styles + animations
│   └── types/
│       └── index.ts         # TypeScript type definitions
```

---

## Engine Flow

```
Intake Data
    ↓
Natal Chart Positions (deterministic from birth data)
    ↓
Aspect Detection (conjunction, opposition, trine, square, sextile, quincunx)
    ↓
Pattern Scoring (orb exactness × symptom confirmation boost)
    ↓
Sign / House / Element / Modality Localization
    ↓
SOAP Output Builder
    ↓
Five-Layer Sensory Protocol
    Sound · Scent · Taste · Body · Sight
```

---

## Adding Your Assets

Place your media files in `/public/`:

```
public/
  videos/
    ASTRYX_BACKGROUND_VIDEO.mp4   ← primary loop
    background_video_2.mp4         ← secondary loop
  images/
    ASTRYX_BACKGROUND.png         ← female figure background
    background_male.png            ← male figure background
    logo.png                       ← Astryx logo
```

The `CosmicBackground` component handles:
- Video as primary layer (with fallback)
- PNG images as secondary layer
- CSS WebGL star field
- Nebula gradient overlays
- Accent color glow that reacts to the dominant planet

---

## Deployment

**Vercel (recommended):**
```bash
npm run build
vercel deploy
```

**Self-hosted (VPS/Docker):**
```bash
npm run build
npm start
# runs on port 3000
```

**Docker:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Extending the Engine

All interpretation data lives in `/src/data/*.json`. To extend:

- Add planets → `planets.json`
- Add symptoms → `symptoms.json`
- Add SOAP templates → `soap-templates.json`
- Add scent data → `scents.json`
- Add herb data → `herbs.json`

The engine reads from these files at runtime. No code changes needed to expand the libraries.

---

## Safety Language

Astryx uses non-diagnostic language throughout. All output uses:

- "may suggest"
- "may indicate"
- "may correlate with"
- "may support"

It never uses: diagnose · cure · treat · "you have"

See `src/data/soap-templates.json` for all assessment templates.

---

## XRP Payment Integration (Phase 2)

XRP payment support is planned for Phase 2. The architecture is payment-agnostic — drop in any payment provider at the API route layer.

---

*Astryx — Calibrate Your System*
