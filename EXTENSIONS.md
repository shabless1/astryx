# ASTRYX — Sacred Layer Integration
### Extension Wiring Brief | v1.4 → Sacred Layer

---

## What This File Is

This file instructs Claude Code to wire the five Sacred Extension JSON files into the running v1.4 codebase. These files are already present in `src/data/`. They are not yet connected to the engine or UI. This document tells you exactly where each one plugs in — read it completely before writing a single line.

**Files to integrate:**
- `src/data/sacredTones_nervousSystem.json` — 13 planetary forks (Hz, nerve plexus, vagal data, binaural offsets, clinical notes)
- `src/data/sacredBotanicals.json` — 9 Sacred Botanicals, one master plant per planet
- `src/data/crystalsExpanded.json` — 9 featured crystals with biological mechanism and body placement
- `src/data/lotusSpectrum.json` — 4 lotus varieties, proprietary Astryx IP
- `src/data/starterKits.json` — 4 physical product kits, shop CTAs

**Do not modify any existing base library files** (`herbs.json`, `planets.json`, `planetary-anchors.json`, etc.). These are additive integrations only.

---

## Critical Rules Before You Start

1. **Malachite gets a red warning badge everywhere it appears.** `crystalsExpanded.json` → planet: "Pluto" → featuredCrystal: "Malachite". Every render of Malachite must show a red badge with text: "Raw form is toxic — polished/sealed only." Non-negotiable.
2. **The Lotus Spectrum is proprietary Astryx IP.** Render `lotusSpectrum.json` as a flagship feature with its own dedicated card — not a footnote, not a list item.
3. **All safety notes must render.** Every `safetyNote` field from every extension file must appear in the UI. Never omit one.
4. **Shop CTAs are feature-flagged.** All links to sacredtea.net must check `process.env.NEXT_PUBLIC_SHOP_LIVE === 'true'`. When false, show "Coming Soon" instead of a shop button.
5. **All assessment language is probabilistic.** Use "may support," "is associated with," "may suggest" — never "will" or "you have."
6. **Hz values come only from `sacredTones_nervousSystem.json` and `planetary-anchors.json`.** Do not invent Hz values.

---

## Planet Name Mapping

The engine uses standard planet names (`Sun`, `Moon`, `Mars`, etc.). The sacredTones file uses fork names. Use this map when looking up forks by dominant planet:

```typescript
const PLANET_TO_FORK: Record<string, string> = {
  Sun:     'Sun',
  Moon:    'Full Moon',
  Mercury: 'Mercury',
  Venus:   'Venus',
  Mars:    'Mars',
  Jupiter: 'Jupiter',
  Saturn:  'Saturn',
  Uranus:  'Uranus',
  Neptune: 'Neptune',
  Pluto:   'Pluto',
}
```

The chakra forks (`Earth Day`, `Earth Year`, `Platonic Year`) are always shown in the Practitioner screen as the grounding set — not looked up by dominant planet.

---

## Step 1 — Extend Types (`src/types/index.ts`)

Add these interfaces. Append them to the end of the file before the closing.

```typescript
// ─── SACRED EXTENSION TYPES ──────────────────────────────────

export interface SacredBotanical {
  planet: string
  sacredBotanical: string
  latinName: string
  tier: number
  color: string
  colorVibration: string
  esotericSignature: string
  biologicalSystem: string
  biologicalMechanism: string
  endocrineTarget: string
  nervousSystem: string
  brainwaveAffinity: string
  wellnessBenefits: string[]
  teaSafe: boolean
  teaProfile: string
  ritualUse: string
  bodyPlacement: string
  safetyNote: string
  kitProduct?: string
  kitEligible?: boolean
}

export interface CrystalExpanded {
  planet: string
  featuredCrystal: string
  existingGems: string[]
  metal: string
  hex: string
  featuredCrystalData: {
    name: string
    mineralComposition: string
    biologicalMechanism: string
    biologicalSystem: string
    endocrineTarget: string
    nervousSystem: string
    bodyPlacement: string
    placementNote: string
    safetyNote: string
    kitEligible?: boolean
  }
}

export interface LotusEntry {
  variety: string
  latinName: string
  sanskritName: string
  primaryPlanet: string
  secondaryPlanet: string
  element: string
  chakra: string
  color: string
  colorVibration: string
  esotericSignature: string
  biologicalSystem: string
  biologicalMechanism: string
  endocrineTarget: string
  nervousSystem: string
  wellnessBenefits: string[]
  teaSafe: boolean
  teaProfile: string
  ritualUse: string
  bodyPlacement: string
  safetyNote: string
  kitEligible?: boolean
}

export interface StarterKit {
  kitId: string
  kitName: string
  tagline: string
  description: string
  variants: string
  contents: string[]
  shopLink: string
  proposedPrice: string
  appIntegration: string
  kitEligible: boolean
}

export interface SacredFork {
  planet: string
  chakra: string
  hz: string
  note: string
  color: string
  nervePlexus: string
  boneApplicationPoint: string
  vagusConnection: string
  vagusStrength: string
  brainwaveAffinity: string
  brainwaveState: string
  ANSEffect: string
  clinicalNote: string
}

// ─── EXTEND PROTOCOL OUTPUT ───────────────────────────────────
// Add this to the existing ProtocolOutput interface:
// (replace the existing ProtocolOutput interface with this version)
export interface ProtocolOutput {
  dominant_pattern: DominantPattern
  soap: SOAPOutput
  plan: {
    sound: SoundProtocol
    scent: ScentProtocol
    taste: TasteProtocol
    body: BodyProtocol
    sight: SightProtocol
  }
  // Sacred Extension Layer — populated by engine.ts from extension JSON files
  sacredLayer?: {
    botanical: SacredBotanical | null
    crystal: CrystalExpanded | null
    lotusSpectrum: LotusEntry[]
    dominantFork: SacredFork | null
    starterKit: StarterKit | null
  }
}
```

---

## Step 2 — Extend the Engine (`src/lib/engine.ts`)

### 2a — Add imports at the top of the file (after existing imports)

```typescript
import sacredBotanicalsData from '@/data/sacredBotanicals.json'
import crystalsExpandedData from '@/data/crystalsExpanded.json'
import lotusSpectrumData from '@/data/lotusSpectrum.json'
import starterKitsData from '@/data/starterKits.json'
import sacredTonesData from '@/data/sacredTones_nervousSystem.json'
import type { SacredBotanical, CrystalExpanded, LotusEntry, StarterKit, SacredFork } from '@/types'
```

### 2b — Add the planet-to-fork map (after PLANET_COLORS constant)

```typescript
const PLANET_TO_FORK: Record<string, string> = {
  Sun:     'Sun',
  Moon:    'Full Moon',
  Mercury: 'Mercury',
  Venus:   'Venus',
  Mars:    'Mars',
  Jupiter: 'Jupiter',
  Saturn:  'Saturn',
  Uranus:  'Uranus',
  Neptune: 'Neptune',
  Pluto:   'Pluto',
}
```

### 2c — Add the sacred layer resolver function (add before the main `generateProtocol` function)

```typescript
function resolveSacredLayer(dominantPlanet: string) {
  const botanicals = sacredBotanicalsData as SacredBotanical[]
  const crystals   = crystalsExpandedData  as CrystalExpanded[]
  const lotus      = lotusSpectrumData     as LotusEntry[]
  const kits       = starterKitsData       as StarterKit[]
  const forks      = sacredTonesData       as SacredFork[]

  const forkName     = PLANET_TO_FORK[dominantPlanet] ?? dominantPlanet
  const botanical    = botanicals.find(b => b.planet === dominantPlanet) ?? null
  const crystal      = crystals.find(c => c.planet === dominantPlanet) ?? null
  const dominantFork = forks.find(f => f.planet === forkName) ?? null

  // Starter kit: use 'planetary-sign-kit' as the default — one kit per sun sign
  const starterKit   = kits.find(k => k.kitId === 'planetary-sign-kit') ?? kits[0] ?? null

  return { botanical, crystal, lotusSpectrum: lotus, dominantFork, starterKit }
}
```

### 2d — Call the resolver inside `generateProtocol`

Find the `return` statement at the end of the `generateProtocol` (or equivalent main export function) that returns the `ProtocolOutput` object. Add the `sacredLayer` field to that return value:

```typescript
// Add this before the return statement:
const sacredLayer = resolveSacredLayer(dominantPlanet)  
// dominantPlanet is whatever variable holds the top planet name (e.g. pattern.planets[0])

// Then in the returned object:
return {
  dominant_pattern: ...,
  soap: ...,
  plan: { ... },
  sacredLayer,   // ← add this line
}
```

If the engine uses a fallback/seed path, add `sacredLayer: resolveSacredLayer(seedPlanet)` there too.

---

## Step 3 — Results Screen (`src/components/screens/ResultsScreen.tsx`)

Add a **Sacred Layer section** after the existing ChartTabs `GlassCard`. This section contains three cards rendered in order: Sacred Botanical → Featured Crystal → Lotus Spectrum. A Shop Kit card appears at the bottom only when `NEXT_PUBLIC_SHOP_LIVE=true`.

Insert this block after the ChartTabs GlassCard closing tag and before the "Sound Protocol" or action buttons section:

```tsx
{/* ── Sacred Layer ── */}
{protocol.sacredLayer && (
  <div className="mt-4 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>

    {/* Sacred Botanical */}
    {protocol.sacredLayer.botanical && (() => {
      const b = protocol.sacredLayer.botanical!
      return (
        <GlassCard accentColor={b.color} opacity={0.05} className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ background: b.color }} />
            <SectionLabel>Sacred Botanical</SectionLabel>
            <span className="text-[10px] tracking-widest text-white/30 uppercase ml-auto">Tier II · {b.planet}</span>
          </div>
          <h3 className="font-cinzel text-lg text-white mb-0.5">{b.sacredBotanical}</h3>
          <p className="text-[11px] italic text-white/40 mb-3">{b.latinName}</p>
          <p className="text-[13px] text-white/70 mb-3">{b.esotericSignature}</p>
          <DataPoint label="Biological System" value={b.biologicalSystem} />
          <DataPoint label="Mechanism" value={b.biologicalMechanism} />
          <DataPoint label="Endocrine Target" value={b.endocrineTarget} />
          <DataPoint label="Nervous System" value={b.nervousSystem} />
          <DataPoint label="Brainwave Affinity" value={b.brainwaveAffinity} />
          {b.teaSafe && (
            <div className="mt-3 p-3 rounded-lg border border-white/10 bg-white/5">
              <p className="text-[11px] tracking-widest text-white/40 uppercase mb-1">Tea Profile</p>
              <p className="text-[13px] text-white/70">{b.teaProfile}</p>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {b.wellnessBenefits.map((benefit) => (
              <Tag key={benefit} label={benefit} accent={b.color} small />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-white/40 italic">{b.safetyNote}</p>
        </GlassCard>
      )
    })()}

    {/* Featured Crystal */}
    {protocol.sacredLayer.crystal && (() => {
      const c = protocol.sacredLayer.crystal!
      const cd = c.featuredCrystalData
      const isMalachite = cd.name === 'Malachite'
      return (
        <GlassCard accentColor={c.hex} opacity={0.05} className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ background: c.hex }} />
            <SectionLabel>Featured Crystal</SectionLabel>
            <span className="text-[10px] tracking-widest text-white/30 uppercase ml-auto">{c.planet}</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-cinzel text-lg text-white">{cd.name}</h3>
            {isMalachite && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-red-600 text-white">
                ⚠ RAW FORM TOXIC — POLISHED ONLY
              </span>
            )}
          </div>
          <DataPoint label="Composition" value={cd.mineralComposition} />
          <DataPoint label="Biological Mechanism" value={cd.biologicalMechanism} />
          <DataPoint label="Biological System" value={cd.biologicalSystem} />
          <DataPoint label="Endocrine Target" value={cd.endocrineTarget} />
          <DataPoint label="Nervous System" value={cd.nervousSystem} />
          <div className="mt-4 p-3 rounded-lg border border-white/10 bg-white/5">
            <p className="text-[11px] tracking-widest text-white/40 uppercase mb-1">Body Placement</p>
            <p className="text-[13px] text-white/70 mb-1">{cd.bodyPlacement}</p>
            <p className="text-[12px] text-white/50 italic">{cd.placementNote}</p>
          </div>
          <p className="mt-3 text-[11px] text-white/40 italic">{cd.safetyNote}</p>
          <DataPoint label="Ruling Metal" value={`${c.metal} — ${c.existingGems.join(', ')}`} />
        </GlassCard>
      )
    })()}

    {/* Lotus Spectrum — Proprietary Astryx IP */}
    {protocol.sacredLayer.lotusSpectrum.length > 0 && (
      <GlassCard accentColor="#C084FC" opacity={0.05} className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-purple-400" />
          <SectionLabel>Lotus Spectrum</SectionLabel>
          <span className="text-[10px] tracking-widest text-purple-300/50 uppercase ml-auto">Astryx Proprietary</span>
        </div>
        <p className="text-[12px] text-white/50 mb-5">
          Four sacred lotus varieties — each mapped to planetary frequency, chakra, and biological system.
          The only complete lotus resonance protocol in existence.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {protocol.sacredLayer.lotusSpectrum.map((lotus) => (
            <div
              key={lotus.variety}
              className="p-3 rounded-lg border border-white/10"
              style={{ background: `${lotus.color}14` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: lotus.color }} />
                <span className="font-cinzel text-[12px] text-white">{lotus.variety}</span>
              </div>
              <p className="text-[10px] italic text-white/40 mb-1">{lotus.latinName}</p>
              <p className="text-[10px] text-white/50">{lotus.primaryPlanet} · {lotus.element} · {lotus.chakra}</p>
              <p className="text-[11px] text-white/60 mt-1 line-clamp-2">{lotus.esotericSignature}</p>
              {lotus.teaSafe && (
                <p className="text-[10px] text-white/40 mt-1 italic">{lotus.teaProfile}</p>
              )}
              <p className="text-[10px] text-white/30 italic mt-1">{lotus.safetyNote}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    )}

    {/* Shop Kit — feature-flagged */}
    {protocol.sacredLayer.starterKit && process.env.NEXT_PUBLIC_SHOP_LIVE === 'true' && (
      <GlassCard accentColor={accentColor} opacity={0.04} className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <SectionLabel>Physical Kit</SectionLabel>
            <h3 className="font-cinzel text-base text-white mb-1">{protocol.sacredLayer.starterKit.kitName}</h3>
            <p className="text-[12px] text-white/50 mb-2">{protocol.sacredLayer.starterKit.tagline}</p>
            <p className="text-[12px] text-white/40 mb-3">{protocol.sacredLayer.starterKit.description}</p>
            <ul className="space-y-1">
              {protocol.sacredLayer.starterKit.contents.map((item) => (
                <li key={item} className="text-[12px] text-white/60 flex gap-2">
                  <span className="text-white/30">·</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-right shrink-0">
            <div className="font-cinzel text-lg mb-2" style={{ color: accentColor }}>
              {protocol.sacredLayer.starterKit.proposedPrice}
            </div>
            <a
              href={protocol.sacredLayer.starterKit.shopLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 rounded text-[12px] font-semibold tracking-wider"
              style={{ background: accentColor, color: '#020208' }}
            >
              Shop Your Kit →
            </a>
          </div>
        </div>
      </GlassCard>
    )}

  </div>
)}
```

---

## Step 4 — Practitioner Screen (`src/components/screens/PractitionerScreen.tsx`)

### 4a — Add imports at the top

```typescript
import sacredTonesData from '@/data/sacredTones_nervousSystem.json'
import type { SacredFork } from '@/types'
```

### 4b — Replace the static `tuningForks` array

Find the existing `const tuningForks = [...]` block (it's currently built from `planetaryAnchors` lookups with hardcoded labels). **Replace it entirely** with:

```typescript
const allForks = sacredTonesData as SacredFork[]

const PLANET_TO_FORK: Record<string, string> = {
  Sun: 'Sun', Moon: 'Full Moon', Mercury: 'Mercury', Venus: 'Venus',
  Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn',
  Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto',
}

// Chakra grounding set — always shown first
const CHAKRA_FORK_NAMES = ['Earth Day', 'Earth Year', 'Platonic Year']
const chakraForks = allForks.filter(f => CHAKRA_FORK_NAMES.includes(f.planet))

// Dominant planet forks — from client's chart pattern
const dominantForkNames = p.planets
  .map(pl => PLANET_TO_FORK[pl])
  .filter(Boolean)
const dominantForks = allForks.filter(f => dominantForkNames.includes(f.planet))

// Deduplicate (chakra forks already include Earth Year which is Venus/Heart)
const sessionForks = [
  ...dominantForks,
  ...chakraForks.filter(cf => !dominantForkNames.includes(cf.planet)),
]
```

### 4c — Replace the tuning fork render block

Find the section that maps over `tuningForks` to render fork cards. **Replace it** with this implementation that uses `sessionForks` and renders the full Sacred Tones data:

```tsx
{/* ── Sacred Tones Session Protocol ── */}
<GlassCard accentColor={accentColor} opacity={0.05} className="p-6 mb-4">
  <SectionLabel>Sacred Tones Session Protocol</SectionLabel>
  <p className="text-[12px] text-white/40 mb-5">
    Apply forks in sequence — dominant planet forks first, then chakra regulators.
    Ground the client with Earth Day (sacrum/heel) before any other fork.
  </p>
  <div className="space-y-4">
    {sessionForks.map((fork, i) => {
      const isMalachiteRelated = false // crystal safety is handled in results screen
      return (
        <div
          key={fork.planet}
          className="p-4 rounded-xl border border-white/10"
          style={{ background: `${fork.color}0D` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-white/30 font-mono">#{i + 1}</span>
              <div>
                <span className="font-cinzel text-white text-[14px]">{fork.planet} Fork</span>
                <span className="ml-2 text-[11px]" style={{ color: fork.color }}>{fork.hz} Hz · {fork.note}</span>
              </div>
            </div>
            <Tag label={fork.chakra} accent={fork.color} small />
          </div>

          <div className="grid grid-cols-1 gap-2 text-[12px] text-white/60 mb-3">
            <div><span className="text-white/30">Nerve Plexus: </span>{fork.nervePlexus}</div>
            <div><span className="text-white/30">Application Point: </span>{fork.boneApplicationPoint}</div>
            <div><span className="text-white/30">Vagal Connection: </span>{fork.vagusConnection} · Strength: {fork.vagusStrength}</div>
            <div><span className="text-white/30">ANS Effect: </span>{fork.ANSEffect}</div>
            <div><span className="text-white/30">Brainwave: </span>{fork.brainwaveAffinity} — {fork.brainwaveState}</div>
          </div>

          {/* Clinical Note */}
          <div className="p-3 rounded-lg border" style={{ borderColor: `${fork.color}33`, background: `${fork.color}0A` }}>
            <p className="text-[10px] tracking-widest mb-1" style={{ color: fork.color }}>CLINICAL NOTE</p>
            <p className="text-[12px] text-white/70 italic">{fork.clinicalNote}</p>
          </div>
        </div>
      )
    })}
  </div>

  {/* Sacred Tones Shop CTA — feature-flagged */}
  {process.env.NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE === 'true' ? (
    <div className="mt-5 pt-4 border-t border-white/10">
      <a
        href="https://sacredtea.net/products/planetary-tuning-forks"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] tracking-widest"
        style={{ color: accentColor }}
      >
        Shop Physical Sacred Tones Forks → sacredtea.net
      </a>
    </div>
  ) : (
    <p className="mt-4 text-[11px] text-white/30 italic">
      Physical Sacred Tones tuning forks — coming soon at sacredtea.net
    </p>
  )}
</GlassCard>
```

### 4d — Add Sacred Botanical and Crystal to Practitioner Screen

After the Sacred Tones section, add the client's Sacred Botanical and Crystal for session reference. Use `protocol.sacredLayer` which is now populated from the engine.

```tsx
{/* ── Sacred Botanical & Crystal — Session Reference ── */}
{protocol.sacredLayer && (
  <div className="grid grid-cols-2 gap-4 mb-4">

    {/* Botanical */}
    {protocol.sacredLayer.botanical && (
      <GlassCard accentColor={protocol.sacredLayer.botanical.color} opacity={0.05} className="p-5">
        <SectionLabel>Sacred Botanical</SectionLabel>
        <h4 className="font-cinzel text-white text-[14px] mt-2 mb-1">
          {protocol.sacredLayer.botanical.sacredBotanical}
        </h4>
        <p className="text-[11px] italic text-white/40 mb-2">{protocol.sacredLayer.botanical.latinName}</p>
        <DataPoint label="System" value={protocol.sacredLayer.botanical.biologicalSystem} />
        <DataPoint label="Endocrine" value={protocol.sacredLayer.botanical.endocrineTarget} />
        <DataPoint label="Placement" value={protocol.sacredLayer.botanical.bodyPlacement} />
        <p className="text-[11px] text-white/40 italic mt-2">{protocol.sacredLayer.botanical.safetyNote}</p>
      </GlassCard>
    )}

    {/* Crystal */}
    {protocol.sacredLayer.crystal && (() => {
      const c  = protocol.sacredLayer.crystal!
      const cd = c.featuredCrystalData
      const isMalachite = cd.name === 'Malachite'
      return (
        <GlassCard accentColor={c.hex} opacity={0.05} className="p-5">
          <SectionLabel>Featured Crystal</SectionLabel>
          <div className="flex items-center gap-2 mt-2 mb-1">
            <h4 className="font-cinzel text-white text-[14px]">{cd.name}</h4>
            {isMalachite && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white">
                POLISHED ONLY
              </span>
            )}
          </div>
          <DataPoint label="System" value={cd.biologicalSystem} />
          <DataPoint label="Placement" value={cd.bodyPlacement} />
          <p className="text-[11px] text-white/40 italic mt-2">{cd.placementNote}</p>
          <p className="text-[11px] text-white/40 italic mt-1">{cd.safetyNote}</p>
        </GlassCard>
      )
    })()}

  </div>
)}
```

---

## Step 5 — PDF Export (`src/components/engine/PractitionerExport.tsx`)

The PDF report should include the Sacred Layer. Find the jsPDF export function and add a "Sacred Protocol" section after the existing sensory protocol sections:

```typescript
// After existing protocol sections — add Sacred Layer to PDF
if (protocol.sacredLayer) {
  const sl = protocol.sacredLayer

  doc.addPage()
  // Sacred Botanical
  if (sl.botanical) {
    doc.setFontSize(14)
    doc.setTextColor(245, 158, 11) // gold
    doc.text('Sacred Botanical', 20, 30)
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(`${sl.botanical.sacredBotanical} (${sl.botanical.latinName})`, 20, 42)
    doc.text(`Biological System: ${sl.botanical.biologicalSystem}`, 20, 52)
    doc.text(`Endocrine Target: ${sl.botanical.endocrineTarget}`, 20, 62)
    doc.text(`Body Placement: ${sl.botanical.bodyPlacement}`, 20, 72)
    doc.setTextColor(180, 180, 180)
    doc.text(`Safety: ${sl.botanical.safetyNote}`, 20, 82)
  }

  // Featured Crystal
  if (sl.crystal) {
    const cd = sl.crystal.featuredCrystalData
    const isMalachite = cd.name === 'Malachite'
    doc.setFontSize(14)
    doc.setTextColor(245, 158, 11)
    doc.text(`Featured Crystal — ${cd.name}${isMalachite ? ' ⚠ POLISHED ONLY' : ''}`, 20, 100)
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(`${cd.biologicalSystem} · ${cd.endocrineTarget}`, 20, 112)
    doc.text(`Placement: ${cd.bodyPlacement}`, 20, 122)
    doc.setTextColor(180, 180, 180)
    doc.text(`${cd.placementNote}`, 20, 132)
    doc.text(`Safety: ${cd.safetyNote}`, 20, 142)
  }

  // Sacred Tones fork for this client
  if (sl.dominantFork) {
    const f = sl.dominantFork
    doc.setFontSize(14)
    doc.setTextColor(245, 158, 11)
    doc.text(`Sacred Tones — ${f.planet} Fork (${f.hz} Hz)`, 20, 160)
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(`Nerve Plexus: ${f.nervePlexus}`, 20, 172)
    doc.text(`Application: ${f.boneApplicationPoint}`, 20, 182)
    doc.text(`ANS Effect: ${f.ANSEffect}`, 20, 192)
    doc.setTextColor(180, 180, 180)
    const noteLines = doc.splitTextToSize(f.clinicalNote, 170)
    doc.text(noteLines, 20, 202)
  }
}
```

---

## Verification Checklist

After implementing, verify each point before considering this complete:

- [ ] `protocol.sacredLayer` is populated in both the real chart path and the fallback/seed path in `engine.ts`
- [ ] `ProtocolOutput` type in `types/index.ts` includes `sacredLayer` as optional
- [ ] Results screen renders Sacred Botanical card with all fields including `safetyNote`
- [ ] Results screen renders Crystal card — Malachite (Pluto) shows red warning badge
- [ ] Results screen renders Lotus Spectrum grid — all 4 varieties shown
- [ ] Shop kit card is hidden when `NEXT_PUBLIC_SHOP_LIVE !== 'true'`
- [ ] Practitioner screen Sacred Tones section uses `sacredTones_nervousSystem.json` data (not `planetary-anchors.json` Hz values)
- [ ] Practitioner screen shows Clinical Note for each fork
- [ ] Practitioner screen shows Sacred Botanical + Crystal side-by-side reference cards
- [ ] Sacred Tones shop CTA is hidden when `NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE !== 'true'`
- [ ] PDF export includes Sacred Layer page
- [ ] No hardcoded sacredtea.net URLs outside of feature flag guards
- [ ] TypeScript compiles clean — no `any` in sacred layer code

---

*End of EXTENSIONS.md — ASTRYX Sacred Layer Integration*
*Source files: sacredTones_nervousSystem.json · sacredBotanicals.json · crystalsExpanded.json · lotusSpectrum.json · starterKits.json*
