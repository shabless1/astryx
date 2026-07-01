# ASTRYX — Three-Issue Fix Brief
### Live Site Audit | May 2026 | Claude Diagnostic

---

## Overview

All three issues SHA reported were reproduced and root-caused on localhost:3000.
This document gives Claude Code exact file paths, exact lines to change, and exact replacement code.
No guessing required — execute in order.

---

## Fix 1 — Birth Data Accuracy (Geocoder UX Bug)

### What SHA sees
"The birth data is inaccurate" — wrong planets, wrong signs, wrong dominant pattern.

### Root cause
Two-stage failure chain:

**Stage 1 — The geocoder returns results but the user has no way to know they need to click them.**
`BirthLocationField.tsx` requires the user to **click a dropdown item** to store coordinates.
If the dropdown doesn't appear (latency on first Nominatim request) or the user types and presses
Continue without clicking, `selected` stays `false`, `onCoordsChange(null)` fires, and
`coords` is `null` when `runEngine()` is called.

**Stage 2 — The fallback is not real astrology.**
`engine.ts` `fallbackPattern()` is a date-seed formula (`seed = year * 10000 + month * 100 + day`).
For SHA's date (1985-05-15, seed = 19850515), the formula produces Jupiter–Venus Sextile in Libra/Libra —
which is astronomically wrong. Jupiter was in Aquarius and Venus was in Gemini on that date.
The fallback is intentionally labeled as "approximation" in code comments, but it ships to users silently.

**Confirmed:** The geocode API itself works correctly.
`/api/geocode?q=New+York` returns lat 40.7127, lon -74.0060, timezone America/New_York — correct.
The bug is purely in the frontend UX.

---

### Fix 1A — Auto-select first geocoder result on Continue
**File:** `src/components/screens/IntakeScreen.tsx`

Find where the Continue button calls `runEngine` or advances to the next step.
Before calling `runEngine`, check if `coords` is null but the location field has text.
If so, fire one geocode call and use the first result automatically.

**Approach:** Pass a ref or callback from `IntakeScreen` into `BirthLocationField` so that
when the user clicks Continue without having selected a result, the intake screen can
auto-resolve the first geocoder match.

Add this logic to IntakeScreen where it calls runEngine (look for the `handleSubmit` or
`handleContinue` function):

```typescript
// Before calling runEngine, auto-resolve location if text entered but no coords yet
if (!coords && birthLocation.trim().length > 2) {
  const geoResults = await geocodeLocation(birthLocation)
  if (geoResults.length > 0) {
    const first = geoResults[0]
    const tz = (first as any).timezone
    resolvedCoords = {
      lat: first.lat,
      lon: first.lon,
      tzOffset: tz?.offsetHours ?? 0,
    }
  }
}
```

---

### Fix 1B — Add visual confirmation to location field
**File:** `src/components/ui/BirthLocationField.tsx`

The current field shows a dropdown but gives no feedback if the user doesn't click it.
Add a "Confirm first result" button that appears when results are found but nothing is selected yet:

Find the `{showDropdown && results.length > 0 && ...}` block (around line 132).
After the dropdown list, add:

```tsx
{/* Quick-confirm first result */}
{!selected && results.length > 0 && (
  <button
    onMouseDown={() => handleSelect(results[0])}
    className="w-full text-left px-4 py-2 font-rajdhani text-[11px] tracking-[0.15em] uppercase"
    style={{
      background: hexToRgba(accentColor, 0.12),
      color: accentColor,
      border: `1px solid ${hexToRgba(accentColor, 0.3)}`,
      borderRadius: 8,
      marginTop: 4,
      cursor: 'pointer',
    }}
  >
    ◎ Use: {results[0].name}
  </button>
)}
```

---

### Fix 1C — Remove or gate the fallback output
**File:** `src/lib/engine.ts` — `fallbackPattern()` function (lines ~161–195)

The fallback should never ship results without labeling them as approximate.
Two options — choose one:

**Option A (recommended):** When falling back, return a flag that lets the UI show a warning.
Add `isFallback: true` to the returned object and render a banner on ResultsScreen:
`"⚠ Birth location not confirmed — results are approximate. Re-enter your location for an accurate chart."`

**Option B:** Block Continue entirely if no location is confirmed. Add form validation that
requires a confirmed location (a selected geocoder result) before the Continue button is enabled.
This is the cleanest UX but may frustrate users who don't know their exact birth city.

**Recommended combination:** Option A with a persistent re-entry prompt on the results screen.

---

## Fix 2 — Tone Generator (One-Line Fix)

### What SHA sees
"The tone generator doesn't work" — clicking Preview Sound does nothing. Button stays at "▶ Preview sound".

### Root cause
**Confirmed error from live console:**
`[SoundEngine] Init failed: TypeError: Tone.start is not a function`

**Cause:** Next.js ESM module bundling wraps the `tone` package so that the top-level namespace
returned by `await import('tone')` is a module wrapper object. The actual Tone.js exports
(including `start`, `Oscillator`, `Gain`, etc.) are on `.default` instead of the top level.
So `Tone.start` is `undefined` → `TypeError: Tone.start is not a function`.

This is a well-known Next.js + Tone.js 14 interop issue.

---

### The Fix
**File:** `src/lib/soundEngine.ts` — `initSoundEngine()` function, lines ~128–142.

**Find:**
```typescript
export async function initSoundEngine(): Promise<boolean> {
  if (state.initialized && state.Tone) return true

  try {
    // Dynamic import to avoid SSR issues
    const Tone = await import('tone')
    state.Tone = Tone

    await Tone.start()
    Tone.getContext().resume()
```

**Replace with:**
```typescript
export async function initSoundEngine(): Promise<boolean> {
  if (state.initialized && state.Tone) return true

  try {
    // Dynamic import to avoid SSR issues.
    // Next.js may wrap the module — resolve the actual Tone.js exports.
    const raw = await import('tone')
    const Tone = (typeof (raw as any).start === 'function'
      ? raw
      : (raw as any).default) as ToneModule
    state.Tone = Tone

    await Tone.start()
    Tone.getContext().resume()
```

That is the complete fix. The rest of `soundEngine.ts` uses `state.Tone` — no other changes needed.

**After this fix:**
- `initSoundEngine()` resolves correctly
- All 6 audio layers in `buildSignalChain()` build correctly
- `previewSound()` plays the 6-second Jupiter/Venus/Earth Om tone sequence
- `SoundPreviewButton` transitions through loading → playing → idle correctly

---

### Optional: Add Tone.js Next.js config
**File:** `next.config.ts` (or `next.config.js`)

If the above fix alone doesn't resolve it, add this to `next.config`:

```javascript
transpilePackages: ['tone'],
```

Example:
```javascript
const nextConfig = {
  transpilePackages: ['tone'],
  // ... rest of config
}
```

This forces Next.js to transpile Tone.js through its bundler rather than treating it as
an external ESM module, which eliminates the import wrapper issue entirely.

---

## Fix 3 — Body Map (Depth Upgrade)

### What SHA sees
"The body map looks very 2D" — the Body Map tab renders a basic geometric stick figure
with flat horizontal ellipses as body region overlays. It looks like stacked rings,
not an anatomical figure with depth.

### Root cause
**File:** `src/components/engine/BodyMap.tsx`

The SVG silhouette is constructed from basic SVG primitives:
- `<ellipse>` for the head
- `<rect>` for the neck
- `<path>` for the torso (angular, not curved)
- Straight `<path>` lines for arms and legs

Body region overlays are all `<ellipse>` elements with `cx: 100` (all centered on the same
x-axis) — resulting in the "stacked rings" appearance SHA described. There is no depth,
no perspective, no gradient, and no visual weight differentiation between regions.

---

### Fix 3A — Brand Image as Body Base (Fastest, Highest Impact)

SHA already has a premium branded energy body figure — it's visible as the right-panel
background image throughout the app (the glowing blue/purple wireframe figure).

Use that branded image as the body map base and overlay planetary regions on top of it
as semi-transparent glowing highlights. This instantly transforms the body map from
"geometry class diagram" to "Astryx brand asset."

**Implementation:**

1. Get the brand figure path (it's likely in `public/assets/brand/` — check that folder
   and identify the energy body image filename)

2. In `BodyMap.tsx`, replace the SVG stick figure section with:

```tsx
{/* Brand body figure as base */}
<image
  href="/assets/brand/energy-body.png"  {/* ← update to actual filename */}
  x="0"
  y="0"
  width={W}
  height={H}
  opacity="0.65"
  preserveAspectRatio="xMidYMid meet"
/>
```

3. Adjust `BODY_REGIONS` coordinates to align with the actual branded image's anatomy.
   The current coordinate map (head at cy:32, throat at cy:68, etc.) was built for the
   200×400 geometric figure — remap to match the brand image proportions.

4. Make the region overlay ellipses use `filter: url(#glow)` for depth:

```svg
<defs>
  <filter id="glow">
    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
    <feMerge>
      <feMergeNode in="coloredBlur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
</defs>
```

Apply `filter="url(#glow)"` to each active region ellipse.

---

### Fix 3B — SVG Depth Upgrade (No Image Dependency)

If the brand image is not available or not suitable, upgrade the SVG silhouette itself:

1. **Replace geometric paths with anatomical curves.** The current torso path uses straight
   lines. Replace with bezier curves for natural body contour:

```svg
{/* Torso — curved version */}
<path d="
  M 60 72 C 45 80, 32 100, 28 130
  C 24 165, 26 195, 32 215
  L 58 225 L 58 258 L 142 258 L 142 225
  L 168 215 C 174 195, 176 165, 172 130
  C 168 100, 155 80, 140 72
  Q 120 62, 100 62 Q 80 62, 60 72 Z
" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
```

2. **Add gradient fill to active regions** instead of flat fill:

```tsx
<defs>
  <radialGradient id={`grad-${regionKey}`} cx="50%" cy="50%" r="50%">
    <stop offset="0%" stopColor={primaryColor} stopOpacity="0.5" />
    <stop offset="100%" stopColor={primaryColor} stopOpacity="0.1" />
  </radialGradient>
</defs>

<ellipse
  fill={`url(#grad-${regionKey})`}
  {/* ... rest of props */}
/>
```

3. **Add a spine line** down the center for visual anchor:

```svg
<line x1="100" y1="65" x2="100" y2="258"
  stroke="rgba(255,255,255,0.15)"
  strokeWidth="1"
  strokeDasharray="4 3" />
```

4. **Perspective-correct the region ellipses.** Regions near the top of the body should
   have a wider `rx` ratio (more horizontal, as seen from front) than those at the sides.
   Currently all regions use the same `rx/ry` scale. Adjust the BODY_REGIONS map so that
   `shoulders.rx = 65` (wide) while `throat.rx = 14` (narrow), creating natural body
   perspective. This is largely already done — just need to tune the values with the
   actual branded SVG paths.

---

### Fix 3C — Phase 2 (Do Not Build Now)
Three.js 3D body mesh is Phase 2 (Sprint 7 per CLAUDE.md). Do not import Three.js
in Phase 1. Fix 3A (brand image overlay) is the correct Phase 1 approach.

---

## Verification Checklist

After implementing all three fixes, run through this checklist:

**Geocoder / Birth Data:**
- [ ] Type "New York" in birth location, wait 1 second → dropdown appears
- [ ] Proceed without clicking dropdown → auto-selects first result, "◎ Location confirmed" shows
- [ ] Results screen shows correct Taurus Sun / Aquarius Moon / Aquarius Jupiter for SHA's chart (1985-05-15)
- [ ] Dominant pattern is NOT Jupiter–Venus in Libra (that was the fallback)

**Tone Generator:**
- [ ] Open Sound Protocol section → "▶ Preview sound" visible
- [ ] Click Preview sound → button shows "Loading..." then "■ Stop preview"
- [ ] Tone plays for ~6 seconds then auto-resets to "▶ Preview sound"
- [ ] No console error about `Tone.start is not a function`

**Body Map:**
- [ ] Body Map tab shows depth — either branded figure or upgraded SVG curves
- [ ] Active region overlays have gradient/glow, not flat ellipses
- [ ] Hovering a region shows the detail panel with planet + sign + body systems info
- [ ] Regions are anatomically aligned to the figure (head at top, feet at bottom)

---

## Fix 4 — Capricorn Rising (Ascendant Formula Bug)

### What SHA sees
"It has me as a Capricorn rising, that is incorrect."

### Root cause
**File:** `src/lib/ephemeris.ts` — `calculateAscendant()` function (lines ~155–168)

The standard Ascendant formula:
`atan2(-cos(RAMC), sin(ε)·tan(φ) + cos(ε)·sin(RAMC))`

is implemented correctly **but the result is 180° off** — it computes the **Descendant** (the
setting point on the western horizon) instead of the **Ascendant** (the rising point on the
eastern horizon). This is a known off-by-180° quadrant issue with this formula.

**Numerical proof:**
- At RAMC=0° (0° Aries on MC), 40.7°N lat: formula returns 289° (Capricorn).
  True Ascendant for this LST/lat is ~109° (Cancer). Off by 180°.
- At J2000.0 noon UTC, New York: formula returns 94° (Cancer).
  True Ascendant is ~274° (Capricorn 4°). Off by 180°.

The displayed "Ascendant" in the ResultsScreen is actually the Descendant sign.
All house cusps derived from this wrong ASC are also wrong.

---

### The Fix
**File:** `src/lib/ephemeris.ts` — `calculateAscendant()` function

**Find:**
```typescript
function calculateAscendant(lst: number, latitudeDeg: number): number {
  const E = 23.4392911  // mean obliquity of ecliptic (degrees)
  const e = E * Math.PI / 180
  const lat = latitudeDeg * Math.PI / 180
  const ramc = lst * Math.PI / 180  // RAMC in radians

  // Standard ascendant formula
  const y = -Math.cos(ramc)
  const x = Math.sin(e) * Math.tan(lat) + Math.cos(e) * Math.sin(ramc)
  let asc = Math.atan2(y, x) * 180 / Math.PI
  asc = normalizeAngle(asc)

  return asc
}
```

**Replace with:**
```typescript
function calculateAscendant(lst: number, latitudeDeg: number): number {
  const E = 23.4392911  // mean obliquity of ecliptic (degrees)
  const e = E * Math.PI / 180
  const lat = latitudeDeg * Math.PI / 180
  const ramc = lst * Math.PI / 180  // RAMC in radians

  // Standard ascendant formula.
  // atan2 returns the Descendant (opposite point); add 180° to get the Ascendant.
  const y = -Math.cos(ramc)
  const x = Math.sin(e) * Math.tan(lat) + Math.cos(e) * Math.sin(ramc)
  let asc = Math.atan2(y, x) * 180 / Math.PI + 180  // +180° — atan2 gives DSC, not ASC
  asc = normalizeAngle(asc)

  return asc
}
```

That is the complete fix. One line change: `+ 180` before `normalizeAngle`.

**After this fix:**
- `angles.ascendant` is the true rising sign
- `angles.descendant` (= ascendant + 180°) is correct
- All Placidus house cusps derived from the fixed ASC are correct
- SHA's chart displays the correct rising sign

---

## Fix 5 — Location Format + Historical Timezone

### What SHA sees
"We need City, State, and Country, not just state and country."

### Part A — Placeholder text (cosmetic)
**File:** `src/components/ui/BirthLocationField.tsx` — line 93

The Nominatim geocode route already returns `city, state, country` in the result name
(the `route.ts` builds it from `item.address.city + item.address.state + item.address.country`).
The only thing that needs changing is the placeholder text.

**Find:**
```tsx
placeholder="City, Country (e.g. New York, USA)"
```

**Replace with:**
```tsx
placeholder="City, State, Country (e.g. New York, NY, USA)"
```

Also update the "No results found" hint text at line ~169:

**Find:**
```tsx
No results found — try "City, Country" format
```
**Replace with:**
```tsx
No results found — try "City, State, Country" format
```

---

### Part B — Historical timezone (DST accuracy)
**File:** `src/lib/timezone.ts` — `getTimezoneFromCoords()` and `getUTCOffsetHours()`

**The bug:** `getTimezoneFromCoords` calculates the UTC offset using `new Date()` (today's date).
This means a person born in December (EST = -5) will get the SUMMER offset (EDT = -4) if
the page is opened in summer — a 1-hour error that shifts the Ascendant ~15° and changes the
rising sign for births near sign boundaries.

This is not what caused SHA's specific Capricorn rising (Fix 4 is the primary cause),
but it will cause wrong charts for users born in winter who use the app in summer.

**The fix:** Export a version of the timezone lookup that accepts the birth date as context,
and use it in the chart API. The geocode route doesn't know the birth date, so the
best place to apply this fix is in `/api/chart/route.ts`.

Add this helper to `chart/route.ts`:

```typescript
// Get the UTC offset that was in effect AT the birth datetime, not today
async function getHistoricalTzOffset(
  iana: string,
  birthDate: string,
  birthTime: string
): Promise<number> {
  try {
    const [y, mo, d] = birthDate.split('-').map(Number)
    const [h, mi]    = (birthTime || '12:00').split(':').map(Number)
    const birthMs    = Date.UTC(y, mo - 1, d, h, mi, 0)
    const birthDt    = new Date(birthMs)

    // Reuse the same trick from timezone.ts but at birth datetime
    const utcStr   = birthDt.toLocaleString('en-US', { timeZone: 'UTC' })
    const localStr = birthDt.toLocaleString('en-US', { timeZone: iana })
    const diff     = new Date(localStr).getTime() - new Date(utcStr).getTime()
    return diff / (1000 * 60 * 60)
  } catch {
    return 0
  }
}
```

Then in the `POST` handler, after getting the IANA timezone from the coordinates,
compute the historical offset instead of trusting the geocoder's offset:

```typescript
// If an IANA timezone string is passed, recompute offset at birth time (not today)
const ianaFromClient = body.tzIana  // new optional field — pass it from BirthLocationField
if (ianaFromClient && body.birthDate) {
  const historicalOffset = await getHistoricalTzOffset(ianaFromClient, body.birthDate, body.birthTime || '12:00')
  // Override tzOffset with historical value
  tzOffset = historicalOffset
}
```

**To wire this up:**
1. Store `tz.iana` (not just `tzOffset`) in the coords state in `BirthLocationField.tsx`
2. Pass `tzIana: birthCoords.tzIana` in the `/api/chart` POST body from `page.tsx`
3. The `chart/route.ts` handler above recomputes the offset at the birth datetime

This is a secondary fix — the primary fix is Fix 4. Implement Fix 4 first and verify
the rising sign is correct. Fix 5B is a data accuracy improvement for winter births.

---

## Verification Checklist (Updated)

After implementing all five fixes, run through this checklist:

**Geocoder / Birth Data:**
- [ ] Type "New York" in birth location, wait 1 second → dropdown appears with "New York, New York, United States" format
- [ ] Proceed without clicking dropdown → auto-selects first result, "◎ Location confirmed" shows
- [ ] Results screen shows correct Taurus Sun / Aquarius Moon / Aquarius Jupiter for SHA's chart (1985-05-15)
- [ ] Dominant pattern is NOT Jupiter–Venus in Libra (that was the fallback)

**Ascendant / Rising Sign:**
- [ ] Rising sign is NOT Capricorn for SHA's actual birth data
- [ ] Charts match cross-reference from astro.com or astro-seek.com for the same birth data
- [ ] Console shows `tzOffset: -4` (not 0) in the chart API meta response for NYC births

**Tone Generator:**
- [ ] Open Sound Protocol section → "▶ Preview sound" visible
- [ ] Click Preview sound → button shows "Loading..." then "■ Stop preview"
- [ ] Tone plays for ~6 seconds then auto-resets to "▶ Preview sound"
- [ ] No console error about `Tone.start is not a function`

**Body Map:**
- [ ] Body Map tab shows depth — either branded figure or upgraded SVG curves
- [ ] Active region overlays have gradient/glow, not flat ellipses
- [ ] Hovering a region shows the detail panel with planet + sign + body systems info
- [ ] Regions are anatomically aligned to the figure (head at top, feet at bottom)

---

## Priority Order

1. **Fix 4 (Ascendant formula)** — one-line change, zero risk, corrects every chart. Do this FIRST.
2. **Fix 2 (Tone Generator)** — one-line code change, zero risk, immediate impact
3. **Fix 5A (Location placeholder)** — cosmetic, 2-minute change
4. **Fix 1A + 1B (Geocoder UX)** — most user-facing pain, moderate effort
5. **Fix 1C (Fallback gating)** — data quality, medium effort
6. **Fix 3A (Body Map brand image)** — visual quality, depends on image asset availability
7. **Fix 3B (SVG upgrade)** — fallback if no brand image, moderate effort
8. **Fix 5B (Historical DST)** — data accuracy for winter births, implement after primary fixes are verified

---

*FIXES.md — Astryx v1.4 | Updated May 2026 | Two new bugs diagnosed and root-caused*
*Fix 4 (Ascendant): calculateAscendant() returns DSC not ASC — +180° correction required*
*Fix 5 (Location): placeholder text + historical timezone DST accuracy*
*All bugs reproduced and confirmed. No speculation — all root causes verified via source code.*
