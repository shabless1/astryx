# ASTRYX — Bug Fix Directive
### For Claude Code | v1.0 | June 2026

---

## Context

Astryx is a deterministic multi-sensory wellness calibration app at `https://n-pi-jet.vercel.app`.
The codebase is at `astryx_v14/`. The tech stack is Next.js 14 / TypeScript / Tone.js.
**Read ASTRYX_CONCEPT.md and CLAUDE.md before touching any file.**

Two production bugs are making the app's core intelligence layer non-functional for every user.
Fix both in sequence. Do not start Bug 2 until Bug 1 is verified working.
Do not write new features. Do not refactor anything outside the files listed.
Deploy to Vercel with `vercel --prod --yes` after both are verified.

---

## BUG 1 — Sun Is Always Returned as the Dominant Planet

### Root cause

`extractDominantPattern` in `src/lib/ephemeris.ts` uses `PLANET_WEIGHTS` where
`Sun = 10` and `Moon = 10` (the maximum). Mercury is always within 28° of the Sun
in any natal chart, so a Sun-Mercury conjunction will almost always exist and score
very high (planet base 18 + conjunction 10 + exactness up to 20 = up to 48 total).
This consistently beats outer planet aspects (Mars-Saturn square maxes at ~42).

Additionally, `calculateSymptomBoost` in `src/app/api/chart/route.ts` fails to parse
multi-word symptom tags like `"anger inflammation"` — it replaces spaces with
underscores and tries to match `"anger_inflammation"` as a single slug, which doesn't
exist in symptoms.json. So the symptom boost is always 0 and never influences
which planet wins.

### Fix 1A — Rebalance PLANET_WEIGHTS in `src/lib/ephemeris.ts`

Find `const PLANET_WEIGHTS` (around line 461). Change it to:

```typescript
const PLANET_WEIGHTS: Record<string, number> = {
  Sun: 7, Moon: 7, Mercury: 7, Venus: 7, Mars: 8,
  Jupiter: 7, Saturn: 7, Uranus: 5, Neptune: 5, Pluto: 5,
}
```

Rationale: Sun and Moon drop from 10 to 7 so they no longer automatically dominate.
Mars stays at 8 because it's the most commonly activated planet in wellness contexts.
Outer planets rise so tight outer-planet aspects can compete.

### Fix 1B — Add `symptomPlanets` parameter to `extractDominantPattern` in `src/lib/ephemeris.ts`

Change the function signature from:

```typescript
export function extractDominantPattern(
  chart: NatalChart,
  symptomBoost = 0
): DominantPatternData {
```

to:

```typescript
export function extractDominantPattern(
  chart: NatalChart,
  symptomBoost = 0,
  symptomPlanets: string[] = [],
): DominantPatternData {
```

In the scoring block inside `extractDominantPattern`, find this line:

```typescript
const totalScore = planetScore + aspectScore + exactnessScore
```

Replace it with:

```typescript
// Symptom-planet boost: if user symptoms implicate one of the planets
// in this aspect, add +20 so symptom-flagged aspects rise above the
// Sun/Moon weight bias. This is the Planet ≠ Remedy principle at the
// detection level — symptoms tell us WHAT pattern is active.
const symptomBonus =
  (symptomPlanets.includes(asp.planet1) || symptomPlanets.includes(asp.planet2))
    ? 20
    : 0
const totalScore = planetScore + aspectScore + exactnessScore + symptomBonus
```

### Fix 1C — Fix `calculateSymptomBoost` in `src/app/api/chart/route.ts`

This function currently tries to match multi-word tags like `"anger inflammation"` as a
single underscored slug. Replace the entire `calculateSymptomBoost` function with:

```typescript
function calculateSymptomBoost(
  symptoms: string[],
  chart: ReturnType<typeof calculateNatalChart>
): { boost: number; symptomPlanets: string[] } {
  if (!symptoms?.length) return { boost: 0, symptomPlanets: [] }

  const symptomLib = symptomsData as Array<{
    symptom: string
    related_planets: string[]
    weight: number
  }>

  let boost = 0
  const planetHits: Record<string, number> = {}
  const topAspects = chart.aspects.slice(0, 5)

  for (const userSymptom of symptoms) {
    // Split multi-word tags ("anger inflammation") into individual tokens
    // so each word matches against the slug library independently.
    const tokens = userSymptom
      .toLowerCase()
      .replace(/[_\-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)

    for (const token of tokens) {
      const match = symptomLib.find(
        (s) =>
          s.symptom === token ||
          s.symptom.includes(token) ||
          token.includes(s.symptom)
      )
      if (!match) continue

      // Track which planets this symptom implicates
      for (const p of match.related_planets ?? []) {
        planetHits[p] = (planetHits[p] ?? 0) + (match.weight ?? 1)
      }

      for (const asp of topAspects) {
        if (
          (match.related_planets ?? []).includes(asp.planet1) ||
          (match.related_planets ?? []).includes(asp.planet2)
        ) {
          boost += match.weight * 1.5
        }
      }
    }
  }

  // symptomPlanets: planets implicated by symptoms, sorted by implication weight
  const symptomPlanets = Object.entries(planetHits)
    .sort((a, b) => b[1] - a[1])
    .map(([p]) => p)

  return { boost: Math.min(Math.round(boost), 15), symptomPlanets }
}
```

### Fix 1D — Pass `symptomPlanets` through the chart route handler

In the POST handler in `src/app/api/chart/route.ts`, find:

```typescript
const symptomBoost = calculateSymptomBoost(body.symptoms || [], chart as any)
const dominantPattern = extractDominantPattern(chart as any, symptomBoost)
```

Replace with:

```typescript
const { boost: symptomBoost, symptomPlanets } = calculateSymptomBoost(
  body.symptoms || [],
  chart as any,
)
const dominantPattern = extractDominantPattern(chart as any, symptomBoost, symptomPlanets)
```

Also add `symptomPlanets` to the response so the engine can use it downstream:

```typescript
return NextResponse.json({
  success: true,
  chart,
  dominantPattern,
  symptomPlanets,   // ← add this line
  transits,
  meta: { ... },
})
```

### Fix 1E — Use `symptomPlanets` in `runEngine` in `src/lib/engine.ts`

Find `fetchChart` interface definition (around line 763):

```typescript
interface ChartRequestPayload {
  birthDate: string
  birthTime: string
  latitude: number
  longitude: number
  tzOffset?: number
  symptoms?: string[]
}
```

And the `fetchChart` return type (around line 772):

```typescript
async function fetchChart(payload: ChartRequestPayload): Promise<{
  dominantPattern: DominantPatternData
  chart: any
  transits: any[]
} | null> {
```

Change both to:

```typescript
interface ChartRequestPayload {
  birthDate: string
  birthTime: string
  latitude: number
  longitude: number
  tzOffset?: number
  symptoms?: string[]
}

async function fetchChart(payload: ChartRequestPayload): Promise<{
  dominantPattern: DominantPatternData
  chart: any
  transits: any[]
  symptomPlanets: string[]
} | null> {
  try {
    const res = await fetch('/api/chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data.success) {
      console.error('Chart API error:', data.error)
      return null
    }
    return {
      dominantPattern: data.dominantPattern,
      chart:           data.chart,
      transits:        data.transits ?? [],
      symptomPlanets:  data.symptomPlanets ?? [],
    }
  } catch (err) {
    console.error('Chart fetch failed:', err)
    return null
  }
}
```

In `runEngine`, find the section where `rawPattern` is assigned from the API result:

```typescript
if (result) {
  rawPattern = result.dominantPattern
  chart      = result.chart
  transits   = result.transits
}
```

Replace with:

```typescript
if (result) {
  rawPattern = result.dominantPattern
  chart      = result.chart
  transits   = result.transits
  apiSymptomPlanets = result.symptomPlanets
}
```

Add `let apiSymptomPlanets: string[] = []` near the top of `runEngine` alongside the other let declarations:

```typescript
let rawPattern: DominantPatternData | null = null
let chart: any = null
let transits: any[] = []
let apiSymptomPlanets: string[] = []  // ← add this
```

After the fallback block (after `rawPattern = fallbackPattern(intake)` if needed), add a
diagnostic log and verify the dominant planet:

```typescript
console.log('[engine] Bug1 trace — rawPattern.planet1:', rawPattern.planet1,
  '| apiSymptomPlanets:', apiSymptomPlanets)
```

---

## BUG 2 — Polarity Correction Does Not Reach the Live Chamber

### Root cause

After `determinePolarity` runs, `dominantPolarity = polarityResults[0]` selects the
highest-confidence polarity result across ALL detected planets. Because Bug 1 caused
`dominantPattern.planets[0]` to always be Sun, AND because Sun has high natal weight
and transit pressure that inflate its confidence score, Sun often wins the polarity race
even when the user's symptoms implicate Mars. The result: `dominantPolarity.planet = 'Sun'`,
so the corrective direction is a Sun correction, not the Mars correction the user needs.

After Bug 1 is fixed, Mars will correctly surface as the dominant planet. But we also need
to anchor `dominantPolarity` to the dominant pattern's primary planet explicitly, so the
polarity correction always matches the identified pattern.

### Fix 2A — Anchor `dominantPolarity` to the dominant pattern planet in `src/lib/engine.ts`

Find this line in `runEngine` (around line 1538):

```typescript
const dominantPolarity = polarityResults[0]
```

Replace with:

```typescript
// Always use the polarity result for the dominant pattern's primary planet.
// polarityResults[0] is sorted by confidence and may be a different planet
// (especially Sun, which has high natal weight). We want the polarity for
// the planet we actually diagnosed — not just the highest scorer overall.
const dominantPolarity =
  polarityResults.find((r) => r.planet === dominantPattern.planets[0]) ??
  polarityResults[0]

console.log('[engine] Bug2 trace — dominantPattern.planet1:', dominantPattern.planets[0],
  '| dominantPolarity.planet:', dominantPolarity?.planet,
  '| state:', dominantPolarity?.dominant_state,
  '| confidence:', dominantPolarity?.confidence_band)
```

### Fix 2B — Verify `IntakeScreen` passes symptom tags in the correct format

Open `src/components/screens/IntakeScreen.tsx`. Find where `onToggleSymptom` is called
and how `selectedSymptoms` is constructed. The symptom tags must match the keys in
`INTAKE_TAG_TO_SLUGS` in engine.ts — short tags like `"anger inflammation"`,
`"stagnant drive"`, `"chronic tension"` (not full statement text).

Find the planet card rendering in IntakeScreen. For each question, verify it passes
`question.symptomTag` (from planet-intake-map.json) to `onToggleSymptom` — NOT the
full `question.text` (the statement sentence).

If you find that `question.text` is being passed instead of `question.symptomTag`,
change every `onToggleSymptom(question.text)` call to `onToggleSymptom(question.symptomTag)`.

### Fix 2C — Add a verification log in `src/lib/engine.ts`

After `canonicalSymptoms` is computed (around line 1486), add:

```typescript
console.log('[engine] Bug2 trace — intake.symptoms (raw):', intake.symptoms)
console.log('[engine] Bug2 trace — canonicalSymptoms:', canonicalSymptoms)
```

This lets you verify in DevTools that symptom tags are being bridge-mapped correctly.

---

## VERIFICATION SEQUENCE

After making all changes, run `npm run build` locally to confirm no TypeScript errors.
Then deploy with `vercel --prod --yes`.

Open `https://n-pi-jet.vercel.app` in an incognito window. Open DevTools Console.
Hard refresh (Cmd+Shift+R).

### Test A — Mars Excess (the canonical test)

1. Complete intake with any birth data
2. In the Resonance Scan (Step 1), tap the Mars card and select:
   - "I'm carrying anger, frustration, or inflammation in my body" (symptomTag: `anger inflammation`)
3. Submit → wait for Analysis → go to Results
4. In the DevTools console, verify all of these logs appear:
   - `[engine] Bug1 trace — rawPattern.planet1: Mars` (not Sun)
   - `[engine] Bug2 trace — intake.symptoms (raw): ["anger inflammation"]`
   - `[engine] Bug2 trace — canonicalSymptoms: ["anger", "inflammation"]`
   - `[engine] Bug2 trace — dominantPolarity.planet: Mars | state: excess | confidence: strong`
5. In the Results screen UI, verify:
   - The Chamber CTA card (titled "Pressure Chamber" or another chamber name) shows a tinted callout box
   - The callout badge reads: **"Mars excess detected"** with "strong signal"
   - The body text includes "cool, calm, regulate"
   - The color palette in the chamber area is **blue/green/seafoam**, NOT red
6. Tap "Hear Preview · 15s" — audio should be SOFT and lush (Moon character), not harsh or fiery

### Test B — Balanced (no symptoms)

1. Fresh intake with no symptoms tapped at all
2. Results: no polarity callout box should appear
3. Chamber uses planet's natural character (whatever dominant planet the chart calculates)

### Test C — Mars Deficiency

1. Fresh intake, tap Mars card, select "My physical energy, libido, or motivation is depleted" (symptomTag: `depleted drive`)
2. Results: callout should say "Mars deficiency detected" with warming/activating direction
3. Color palette should be reds/oranges

### If any test fails

Check DevTools console for the `[engine] Bug1 trace` and `[engine] Bug2 trace` logs.
The logs tell you exactly where the chain breaks. Share the console output before
making any further code changes.

---

## DEPLOY

```bash
npm run build        # must pass with 0 TypeScript errors
vercel --prod --yes  # deploy to production
```

After deploy: hard-refresh the production URL, run Test A, confirm the callout appears.
Remove the `console.log` lines added for verification after confirming both bugs are fixed,
then deploy once more.

---

## DO NOT

- Do not touch `src/lib/chamber/` files
- Do not touch `src/lib/soundEngine.ts`
- Do not touch any `.json` data files
- Do not modify the compliance layer (`src/lib/compliance.ts`)
- Do not add new npm packages
- Do not refactor anything not listed in this directive
- Do not ask SHA to make decisions — this directive is complete

---

*ASTRYX Bug Fix Directive v1.0 — authored by Cowork analysis session June 2026*
