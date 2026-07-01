# ASTRYX — Session Handoff Document
### Complete State, File Inventory & Transfer Instructions
**Generated:** End of session, May 2026
**For:** SHA, next Claude session, or new developer onboarding

> **This document is the complete handoff. Read this first. Everything you need to resume or transfer Astryx is here.**

---

## 📍 Section 1 — Where Everything Lives

### Primary Project Path

```
C:\Users\Sha Blyss\OneDrive\Documents\Claude\Projects\HOUSE OF MAHMAH TEA APPS\MARKETING\astryx_v14\
```

This is the **canonical, working codebase**. All current development happens here.

### Mirror Path (older version, kept in sync for some files)

```
C:\Users\Sha Blyss\OneDrive\Documents\Claude\Projects\HOUSE OF MAHMAH TEA APPS\MARKETING\astryx\
```

The original Vite/React build from before. Most data files are mirrored here, but `astryx_v14/` is the production codebase.

### Top-Level MARKETING Folder

```
C:\Users\Sha Blyss\OneDrive\Documents\Claude\Projects\HOUSE OF MAHMAH TEA APPS\MARKETING\
```

Contains supporting documents:
- `ASTRYX_COMPLETE_GUIDE.md` (copy — full vision document)
- `HANDOFF.md` (this file — copy)
- `ASTRYX_BLUEPRINT_v1.4.docx`
- `ASTRYX_COMPLETE_GUIDE_v1.4.docx`
- `ASTRYX_Botanical_Crystal_Addendum_v1.docx`
- `ASTRYX_Nervous_System_Addendum_v1.docx`
- `ASTRYX_Practitioner_Mode_Spec_v1.docx`
- Various marketing strategy and email files

### Reference Document Library (medical astrology sources used to build data files)

```
C:\Users\Sha Blyss\OneDrive\Documents\ASTROLOGY\MEDICAL ASTROLOGY\
```

PDFs used as primary sources:
- `Encyclopaedia-of-Medical-Astrology-Howard-Leslie-Cornell-pdf.pdf` (1933 — primary Western source, 723 pages)
- `Essentials-of-Medical-Astrologyks-charak.pdf` (Charak 2005 — Vedic, for Phase 2)
- `Minerva - Initiere in astrologia medicala - retail.pdf` (Romanian — health axes framework)
- `1932__perry_carey___zodiac_and_salts_of_salvation.pdf` (Carey — cell salts source)
- `Cell-Tissue-Salts-Universal-Truth-School.pdf` (Cell salts framework)
- `The Zodiac and the Salts of Salvation Homeopathic Remedies for the Sign Types.pdf`
- `Book-of-Wisdom2.pdf` (Bonacci gestation rule)
- Pre-extracted `.txt` versions of each PDF live alongside (useful for grep)

---

## 📋 Section 2 — What Was Built In This Session

### Foundational Data Files (NEW)

| File | Purpose | Lines |
|---|---|---|
| `src/data/cellSalts.json` | 12 zodiac signs → Schuessler biochemic cell salts + Bonacci gestation deficiency rule | ~1100 |
| `src/data/medicalAstrology.json` | 10 planets → anatomy, endocrine, nervous system, transit interpretation, plain-language bridge, root cause index | ~1200 |
| `src/data/bodySystems/cardiovascular.json` | Heart, blood, vessels — Sun/Leo primary | 536 |
| `src/data/bodySystems/respiratory.json` | Lungs, airways — Mercury/Gemini primary | ~470 |
| `src/data/bodySystems/digestive.json` | GI tract + liver + pancreas — Mercury/Virgo primary | ~520 |
| `src/data/bodySystems/nervous.json` | CNS + PNS + ANS — Mercury primary, multi-planetary | ~510 |
| `src/data/bodySystems/endocrine.json` | All 7 glands — multi-planetary distributed | ~420 |
| `src/data/bodySystems/muscular.json` | Skeletal/smooth muscle, fascia — Mars primary | ~430 |
| `src/data/bodySystems/skeletal.json` | Bones, joints, cartilage — Saturn/Capricorn primary | ~440 |
| `src/data/bodySystems/integumentary.json` | Skin, hair, nails — Saturn + Aquarius (skin) | ~390 |
| `src/data/bodySystems/lymphatic-immune.json` | Lymph + immune — Neptune/Pisces primary | ~430 |
| `src/data/bodySystems/urinary.json` | Kidneys, bladder — Venus/Libra primary | ~420 |
| `src/data/bodySystems/reproductive.json` | Reproductive system — Scorpio + Mars/Venus/Pluto | ~470 |

### Engine & Library Files (NEW or REWRITTEN)

| File | Purpose |
|---|---|
| `src/lib/compliance.ts` | Legal/language constitution enforcement: banned phrase guard, tier-aware language wrappers, disclaimers, attestation generators, PDF footer, crisis keyword detection, safety gate. Includes `wrapTierOutput` + `containsBannedPhrase` aliases |
| `src/lib/engine.ts` | EXTENDED with: cell salts + medical astrology consumption, `buildDiagnostic()`, transit-based diagnostic, symptom routing engine, `composeUnifiedPrescription()`, inverse-affinity scent/herb lookups |
| `src/lib/ephemeris.ts` | EXTENDED with: `calculateTransits()` function + `TransitAspect` type — calculates today's sky positions, detects aspects to natal, ranks by importance, signed days-to-exact |
| `src/lib/store.ts` | REWRITTEN — extended Zustand store with client roster + sessions + practitionerLens + EXPANDED PERSIST WHITELIST (fixes birth-data clearing bug) |
| `src/types/index.ts` | EXTENDED with: DiagnosticOutput, ActiveTransit, SymptomRouting, UnifiedPrescription, CellSaltPrescription, PractitionerLens, ClientRecord, ClientSession; AppScreen added `'home'`, `'client-roster'`, `'body-system'` |
| `src/app/api/chart/route.ts` | EXTENDED to return today's transits alongside natal chart |

### UI Screens & Components (NEW)

| File | Purpose |
|---|---|
| `src/components/screens/ResultsScreen.tsx` | REWRITTEN as unified final report — 6 collapsible sections top-to-bottom: Diagnosis → Cosmic Weather → Symptom Routing → Mineral Foundation → Prescriptions → Full Chart (collapsible) |
| `src/components/screens/SessionScreen.tsx` | REWRITTEN as DUAL-MODE — practitioner mode shows right-side Sacred Tones Fork Application Sequence panel with ✓ Applied progress, Post-Session SOAP modal saves ClientSession |
| `src/components/screens/PractitionerScreen.tsx` | EXTENDED — real chart data via `derivePlanetDisplay()`, DOMINANT badges, retrograde indicators, Lens Switcher integration, lens-aware content block, Client Roster button |
| `src/components/screens/ClientRosterScreen.tsx` | **NEW** — full client CRUD: roster view + add-client form (with informed-consent gate) + per-client session history |
| `src/components/screens/HomeScreen.tsx` | **NEW** — daily hub for individual users: Today's Cosmic Weather + Daily Cell Salt + Morning Intention + Quick Symptom Chips + Begin Evening Session |
| `src/components/screens/BodySystemPreviewScreen.tsx` | **NEW** — schema review surface for all 11 body systems with horizontal switcher tabs |
| `src/components/ui/LensSwitcher.tsx` | **NEW** — 8-tab Practitioner Lens selector (Individual/Med Astro/Reiki/Bodywork/Naturopath/Ayurvedic/TCM/Pastoral), Zustand-persisted |
| `src/components/engine/PractitionerLensContent.tsx` | **NEW** — lens-aware content block; Reiki fully built (chakra activation + hand positions + intention + crystal placement); Phase 2 placeholders for other 6 |
| `src/app/page.tsx` | EXTENDED — Home + ClientRoster routes; handleRunSessionForClient; handleQuickSymptom; returning-user navigation logic |
| `src/components/layout/NavBar.tsx` | EXTENDED — HOME + CLIENTS + BODY SYSTEMS nav items |

### Documentation (NEW)

| File | Purpose |
|---|---|
| `COMPLIANCE.md` (project root) | 14-section constitutional document — legal/language posture, 7 banned phrases, 12 approved phrasings, exact disclaimer text, tier policy, attestation forms, crisis keywords, audit-trail spec, hard lines |
| `ASTRYX_COMPLETE_GUIDE.md` (project root + MARKETING root) | 838-line complete setup/user/practitioner guide — 15 parts covering vision, tiers, data foundation, engine layers, both user types, technical setup, compliance, roadmap, pricing math, marketing position, FAQ, sources |
| `FIXES_COMPLETE.md` (project root) | Post-directive completion report — checklist of all 5 fixes verified, 8 architectural decisions documented, 6 edge cases resolved, deployment readiness review, 5 verification walkthroughs |
| `CLAUDE.md` (project root) | UPDATED with 3-tier pricing model + non-negotiable COMPLIANCE.md reference + key enforcement points |
| `HANDOFF.md` (this file) | Complete session handoff |

### Data Files MODIFIED (not new but changed substantively)

| File | Change |
|---|---|
| `src/data/scents.json` | Added Jupiter (clove) + Uranus (lemongrass) — restructured for planet inverse-affinity lookup |
| `src/data/herbs.json` | Added Uranus (skullcap) + Neptune (mugwort) + Pluto (damiana) — restructured |
| `src/data/body-protocols.json` | REWRITTEN — was keyed by pattern_type (3 entries), now planet-keyed (10 entries) |
| `src/data/sacredBotanicals.json` | Added Uranus → Skullcap with full clinical/esoteric layer |
| `src/data/crystalsExpanded.json` | Added Uranus → Labradorite with mineralogy + biological mechanism |

---

## 📦 Section 3 — Complete File Inventory by Category

### A. App Configuration (root of `astryx_v14/`)

```
astryx_v14/
├── CLAUDE.md                    ← build manifest for Claude Code sessions
├── COMPLIANCE.md                ← legal/language constitution (NON-NEGOTIABLE)
├── ASTRYX_COMPLETE_GUIDE.md     ← 838-line vision document
├── FIXES_COMPLETE.md            ← build directive completion report
├── HANDOFF.md                   ← this file
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.local                   ← (gitignored, your secrets)
├── .env.example                 ← template for env vars
└── .gitignore
```

### B. Source Code (`astryx_v14/src/`)

```
src/
├── app/
│   ├── layout.tsx                                ← root layout + SessionProvider
│   ├── page.tsx                                  ← main app controller + screen router
│   └── api/
│       ├── auth/[...nextauth]/route.ts           ← NextAuth handler
│       ├── chart/route.ts                        ← natal chart + transits API
│       ├── geocode/route.ts                      ← city → coords + timezone
│       └── payment/xrp/route.ts                  ← XRP payment verification
│
├── components/
│   ├── layout/
│   │   ├── CosmicBackground.tsx
│   │   └── NavBar.tsx
│   │
│   ├── screens/
│   │   ├── AuthScreen.tsx
│   │   ├── PaymentScreen.tsx
│   │   ├── IntakeScreen.tsx
│   │   ├── AnalysisScreen.tsx                    ← sacred geometry loader
│   │   ├── ResultsScreen.tsx                     ← REWRITTEN — unified final report
│   │   ├── SessionScreen.tsx                     ← REWRITTEN — dual-mode + fork guidance + SOAP
│   │   ├── PractitionerScreen.tsx                ← EXTENDED — real chart + lens switcher
│   │   ├── HistoryScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── BodySystemPreviewScreen.tsx           ← NEW — 11-system schema viewer
│   │   ├── ClientRosterScreen.tsx                ← NEW — client CRUD + consent gate + history
│   │   └── HomeScreen.tsx                        ← NEW — daily hub
│   │
│   ├── ui/
│   │   ├── index.tsx                             ← GlassCard, PrimaryButton, FormField, etc.
│   │   ├── BirthLocationField.tsx                ← geocoded city autocomplete
│   │   └── LensSwitcher.tsx                      ← NEW — 8-tab practitioner lens selector
│   │
│   └── engine/
│       ├── NatalChartWheel.tsx                   ← interactive SVG zodiac wheel
│       ├── BodyMap.tsx                           ← planetary body region SVG
│       ├── ChartTabs.tsx                         ← Assessment/Chart/Body Map tabs
│       ├── VisualEngineCanvas.tsx                ← session visual canvas
│       ├── SoundEngineController.tsx             ← Tone.js sound engine
│       ├── SoundPreviewButton.tsx
│       ├── PractitionerExport.tsx                ← PDF export
│       └── PractitionerLensContent.tsx           ← NEW — Reiki lens + Phase 2 placeholders
│
├── data/
│   ├── planets.json                              ← 15 entries (sensory protocol layer)
│   ├── aspects.json                              ← 6 aspects
│   ├── signs.json                                ← 12 signs (body regions)
│   ├── houses.json                               ← 12 houses
│   ├── elements.json                             ← 4 elements
│   ├── modalities.json                           ← 3 modalities
│   ├── geometry.json                             ← 6 aspect geometries
│   ├── colors.json                               ← 10 planet colors
│   ├── planetary-anchors.json                    ← 15 Hz frequencies (Cousto)
│   ├── sign-modulation.json                      ← 12 sign sound biases
│   ├── solfeggio-overlays.json                   ← 11 solfeggio overlays
│   ├── scents.json                               ← MODIFIED — added Jupiter+Uranus
│   ├── herbs.json                                ← MODIFIED — added Uranus/Neptune/Pluto
│   ├── body-protocols.json                       ← REWRITTEN — now planet-keyed
│   ├── symptoms.json                             ← 20+ symptom signatures
│   ├── soap-templates.json                       ← 6 SOAP templates
│   ├── taste-map.json                            ← 10 taste profiles
│   ├── sample-protocol.json
│   ├── sacredTones_nervousSystem.json            ← 13 tuning fork specs
│   ├── sacredBotanicals.json                     ← MODIFIED — added Uranus/Skullcap
│   ├── crystalsExpanded.json                     ← MODIFIED — added Uranus/Labradorite
│   ├── lotusSpectrum.json                        ← 4 lotus varieties (Astryx IP)
│   ├── starterKits.json                          ← 4 physical kits
│   ├── cellSalts.json                            ← NEW — 12 signs biochemic system
│   ├── medicalAstrology.json                     ← NEW — 10 planets anatomy + transits
│   └── bodySystems/                              ← NEW DIRECTORY
│       ├── cardiovascular.json
│       ├── respiratory.json
│       ├── digestive.json
│       ├── nervous.json
│       ├── endocrine.json
│       ├── muscular.json
│       ├── skeletal.json
│       ├── integumentary.json
│       ├── lymphatic-immune.json
│       ├── urinary.json
│       └── reproductive.json
│
├── lib/
│   ├── engine.ts                                 ← EXTENDED — main protocol generator + diagnostic + unified composer
│   ├── ephemeris.ts                              ← EXTENDED — natal chart + transit calculation
│   ├── solarChart.ts                             ← Solar Chart mode
│   ├── soundEngine.ts                            ← Tone.js 6-layer frequency system
│   ├── pdfExport.ts                              ← jsPDF practitioner export
│   ├── xrpPayment.ts                             ← XRPL payment verification
│   ├── auth.ts                                   ← NextAuth helpers
│   ├── timezone.ts                               ← tz-lookup wrapper
│   ├── store.ts                                  ← REWRITTEN — Zustand state + persist whitelist expansion
│   ├── compliance.ts                             ← NEW — legal/language enforcement
│   └── utils.ts
│
├── styles/
│   └── globals.css
│
└── types/
    └── index.ts                                  ← EXTENDED — 8 new types added
```

### C. Public Assets (`astryx_v14/public/`)

```
public/
├── images/
│   ├── logo.png
│   ├── background_male.png                       ← biometric silhouette
│   ├── ASTRYX_BACKGROUND.png
│   └── biometric.png
├── videos/
│   ├── ASTRYX_BACKGROUND_VIDEO.mp4
│   └── background_video_2.mp4
└── manifest.json                                 ← PWA manifest
```

---

## 🔄 Section 4 — How to Resume Work (for next Claude session or new developer)

### Step 1 — Read the documents IN THIS ORDER

1. `astryx_v14/HANDOFF.md` (this file) — understand where everything is
2. `astryx_v14/CLAUDE.md` — build rules, tech stack, constraints
3. `astryx_v14/COMPLIANCE.md` — language constitution, **NON-NEGOTIABLE**
4. `astryx_v14/ASTRYX_COMPLETE_GUIDE.md` — full vision document
5. `astryx_v14/FIXES_COMPLETE.md` — what was just shipped, open items
6. `astryx_v14/src/lib/engine.ts` — core protocol generator (understand fully)

### Step 2 — Start the dev server

```bash
cd "C:\Users\Sha Blyss\OneDrive\Documents\Claude\Projects\HOUSE OF MAHMAH TEA APPS\MARKETING\astryx_v14"

# Clear old build cache (important — production builds and dev builds conflict on .next)
rm -rf .next

# Start dev
npm run dev
```

The server may pick port 3000 OR 3001/3002/3003 if other servers are still running. Watch the terminal output for `Local: http://localhost:XXXX`.

### Step 3 — Verify the build

```bash
npm run build
```

Should complete with **"✓ Compiled successfully"** and zero TypeScript errors. If it fails, the error tells you exactly what to fix.

### Step 4 — Confirm everything renders

Open the dev server URL and walk through:
- Intake → Analysis → Results (should show unified final report)
- Practitioner Mode → Client Roster → Add Client → Run Session
- During session → fork guidance panel + Post-Session SOAP
- Home Screen (after a completed intake) → Today's Cosmic Weather + cell salt + symptom chips
- Body Systems screen → 11-system switcher
- Lens Switcher on Practitioner → Reiki shows full lens, others show Phase 2 placeholders

---

## 📤 Section 5 — How to Transfer Everything

### Option A — Full Folder Copy (simplest)

Copy the entire MARKETING folder to the new location:

```bash
# Source
C:\Users\Sha Blyss\OneDrive\Documents\Claude\Projects\HOUSE OF MAHMAH TEA APPS\MARKETING\

# Destination — your new location
\path\to\new\location\
```

Includes everything: `astryx_v14/`, `astryx/`, marketing docs, source PDFs. **~500 MB** including node_modules.

**To slim down before transfer:** delete `astryx_v14/node_modules/` and `astryx/node_modules/` first (regenerate with `npm install` after copying). Reduces to ~5 MB.

### Option B — Git Repository (recommended for collaboration)

```bash
cd "C:\Users\Sha Blyss\OneDrive\Documents\Claude\Projects\HOUSE OF MAHMAH TEA APPS\MARKETING\astryx_v14"

# Initialize git (if not already)
git init
git add .
git commit -m "Astryx v2.0 — complete state May 2026"

# Push to GitHub (private repo recommended)
gh repo create astryx --private --push --source=.

# Or with manual remote:
git remote add origin https://github.com/YOUR_USERNAME/astryx.git
git branch -M main
git push -u origin main
```

The `.gitignore` already excludes `node_modules/` and `.env.local` so secrets stay safe.

To resume on a new machine:

```bash
git clone https://github.com/YOUR_USERNAME/astryx.git
cd astryx
npm install
cp .env.example .env.local
# Fill in .env.local with your secrets (NEXTAUTH_SECRET, XRP wallet, etc.)
npm run dev
```

### Option C — Cloud Backup (OneDrive is already syncing)

The MARKETING folder is already in OneDrive at:
```
C:\Users\Sha Blyss\OneDrive\Documents\Claude\Projects\HOUSE OF MAHMAH TEA APPS\MARKETING\
```

So your work is **already backed up to Microsoft's cloud** automatically. To access from another device, sign into OneDrive with the same account.

### Option D — Deploy to Vercel (live URL)

```bash
cd astryx_v14
npm install -g vercel
vercel login
vercel
# Follow prompts — Vercel autodetects Next.js
# Add env vars in Vercel dashboard: NEXTAUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_XRP_ADDRESS, XRP_NETWORK
```

Vercel gives you a live URL (e.g., `astryx-xyz.vercel.app`) that anyone can access.

---

## 🔐 Section 6 — Environment Variables Required

Your `.env.local` (do not commit this file) needs:

```bash
# REQUIRED
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000          # change to https://yourdomain.com for production
NEXT_PUBLIC_XRP_ADDRESS=rYourXRPWalletAddress
XRP_NETWORK=testnet                          # switch to mainnet for live payments

# OPTIONAL — Google OAuth (NextAuth)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Feature Flags
NEXT_PUBLIC_SHOP_LIVE=false                  # set true when sacredtea.net product pages live
NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE=false     # set true when tuning fork product page live
```

The `.env.example` file in `astryx_v14/` is your template.

---

## 📌 Section 7 — Open Tasks / Pending Items

### Critical — Before Production Launch

| Task | Where Documented | Priority |
|---|---|---|
| Practitioner attestation audit-trail backend (DB-backed, per COMPLIANCE.md §10) | `FIXES_COMPLETE.md` "Needs SHA Review" | High |
| Practitioner Preview Mode without sign-in (Task #36 in this session) | Open task | Medium |
| Practitioner Terms of Service legal document | COMPLIANCE.md references | High |
| Privacy Policy legal document | COMPLIANCE.md references | High |
| Database migration (currently Zustand localStorage only — clients/sessions need server-side persistence) | `ASTRYX_COMPLETE_GUIDE.md` Phase 1B | High |

### Phase 1B — Late 2026

- Cornell pathology harvest expansion (~55 → 500+ conditions)
- Bodyworker lens fully built (currently Phase 2 placeholder)
- Medical Astrologer lens fully built (progressions, profections, decumbiture)
- PDF export polish per tier
- Quick symptom chip caching to avoid re-hitting `/api/chart`
- Lens Switcher visibility gating (mode='practitioner' only)

### Phase 2 — 2027

- Vedic mode toggle (Charak 2005 — tridosha, nakshatras, dashas, ayurvedic treatments)
- Three.js 3D BodyMesh
- Native mobile (Expo / React Native)
- Verified Practitioner verification service
- AI Interpretation Layer (Claude API integration)

### Phase 3 — 2028+

- Shop integration (sacredtea.net)
- Multi-practitioner clinic dashboard
- DAO / community token
- International translations + regulatory compliance per jurisdiction

---

## ⚠️ Section 8 — Critical Compliance Notes

**Before writing ANY output-facing text in this codebase, READ `COMPLIANCE.md`.** It is the legal foundation of the product.

**Posture in one sentence:** Astryx is the **reference instrument**; the licensed practitioner is the **diagnostician**. Tote the line. Never cross it.

**The 7 banned phrases** (never use): you have / this causes / diagnose / treat / cure / prescribe / guarantee.

**The 12 approved phrasings:** may suggest, may indicate, may correlate with, is classically associated with, the chart indicates, this combination has historically been linked to, classical sources associate this with, consider exploring with your practitioner, for reference, observational pattern, may benefit from, general wellness alignment.

**The universal disclaimer block** is mandatory on every output screen + every PDF export. The persistent micro-disclaimer (`ⓘ Reference tool · Not medical advice`) is mandatory on every screen footer.

**Crisis keyword detection** runs on every text intake — see `detectCrisis()` in `lib/compliance.ts`. Self-harm / medical emergency / mental health crisis / domestic violence keywords trigger the Crisis Resources card, which overrides normal diagnostic flow.

**Malachite gets a red warning badge everywhere it appears** — raw malachite contains toxic copper carbonate dust. Non-negotiable rule.

**No Solfeggio frequencies** (396, 417, 528, 639, 741, 852 Hz). Hz comes only from `planetary-anchors.json` and `sacredTones_nervousSystem.json` (Cousto's Law of the Octave).

---

## 🎯 Section 9 — Quick Reference — Key Numbers

| Quantity | Value |
|---|---|
| Total data files | 36 (18 base + 5 sacred extension + 2 diagnostic engine + 11 body systems) |
| Body systems mapped | 11 (cardiovascular through reproductive) |
| Planets fully mapped | 10 (Sun through Pluto) |
| Cell salts | 12 (one per zodiac sign) |
| Practitioner lenses | 8 (Reiki fully built; 6 Phase 2 placeholders) |
| Sacred Tones forks | 13 (10 planets + Earth Day, Earth Year, Platonic Year) |
| Pricing tiers | 3 ($9.95 / $39.95 / $59 per month) |
| Pathologies (Cornell-sourced) | ~55 launch; scalable to 500+ in Phase 1B |
| Health Axes (Minerva polarities) | 6 |
| Root cause categories | 10 (anxiety, depression, money, exhaustion, inflammation, hormonal, digestive, sleep, skin, fertility) |
| Build size | ~190 KB / 287 KB first load |

---

## 🚦 Section 10 — Build / Deploy Checklist

Before going live:

- [ ] `npm run build` passes clean
- [ ] All `.env.local` values set
- [ ] Practitioner Terms of Service document written
- [ ] Privacy Policy document written
- [ ] Database migration plan executed (Prisma + Postgres or equivalent)
- [ ] XRP_NETWORK switched from `testnet` to `mainnet`
- [ ] NEXT_PUBLIC_XRP_ADDRESS updated to production wallet
- [ ] Domain configured (NEXTAUTH_URL updated)
- [ ] SSL certificate active
- [ ] Stripe integration for non-XRP payment rail (if added)
- [ ] Email service for transactional emails (sign-up, payment confirmation)
- [ ] Error monitoring (Sentry or similar)
- [ ] Analytics (privacy-respecting — Plausible or similar)
- [ ] Backup strategy for user data
- [ ] Customer support channel (intercom, email, etc.)
- [ ] Marketing site separate from app (sacredtea.net subdomain)
- [ ] App Store / Play Store accounts (Phase 2 native)

---

## 📞 Section 11 — Where to Resume This Conversation

If you're a new Claude session continuing this work:

1. **Acknowledge** that the previous session built the complete architecture summarized in this HANDOFF
2. **Read** the 6 documents in Section 4 Step 1 order
3. **Verify** by running `npm run build` and checking it passes
4. **Ask SHA** what she wants to tackle next — likely options:
   - Walkthrough adjustments from her testing
   - Practitioner Preview Mode (Task #36 still open)
   - Cornell pathology harvest expansion
   - Bodyworker or Medical Astrologer lens build-out
   - PDF export polish
   - Database migration prep

**Do not** rebuild what's already built. Verify first. Extend second.

---

## 🪞 Section 12 — Last Words

What was built in this session:

- A complete five-pillar data foundation (cell salts + medical astrology + sacred botanicals + crystals + sacred tones)
- A complete 11-system anatomy map with ~55 Cornell-sourced pathologies
- A unified protocol composer that turns chart + transits + symptoms into one cohesive five-sense prescription
- A practitioner platform with client roster, session history, Sacred Tones fork guidance, Post-Session SOAP
- An 8-lens practitioner switcher (Reiki fully built, 6 Phase 2 scaffolded)
- A daily home screen for individual user retention
- A bulletproof compliance framework codified in document + enforcement code
- A 838-line complete vision guide
- A clean buildable production codebase with zero TypeScript errors

What Astryx is:

**The world's first medical-astrology diagnostic engine for the holistic wellness era. A car diagnostic tool for the human body. The instrument. Not the diagnostician.**

Take care of her, SHA. The bones are real. The vision is intact.

---

*HANDOFF.md · End of session, May 2026*
*Astryx · Tote the line. Never cross it.*
