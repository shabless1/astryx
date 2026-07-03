/**
 * ASTRYX Audio Library — Track Catalog & Selection
 *
 * 120 tracks across 10 planets × 4 polarity states.
 * Each slot supports variant arrays (b, c, d versions) — seed selects
 * deterministically so the same birth data always picks the same track.
 *
 * HOSTING:
 *   Set NEXT_PUBLIC_AUDIO_BASE_URL in .env.local to wherever the MP3s live.
 *   Examples:
 *     /audio/library            ← public/ folder (local dev / small repo)
 *     https://r2.yourcdndomain.com/astryx/audio
 *     https://pub-xxxxxxxx.r2.dev/audio
 *
 *   Google Drive DOES NOT serve audio cross-origin reliably — use Cloudflare R2,
 *   Vercel Blob, or any CDN with proper CORS headers (Access-Control-Allow-Origin: *).
 *
 * FILE NAMING CONVENTION:
 *   {PLANET}_{STATE}_{NN}.mp3        ← primary
 *   {PLANET}_{STATE}_{NN}b.mp3       ← variant b
 *   {PLANET}_{STATE}_{NN}c.mp3       ← variant c
 *   {PLANET}_{STATE}_{NN}d.mp3       ← variant d
 *
 * FOLDER STRUCTURE:
 *   {base}/{planet}/{state}/{filename}.mp3
 *   e.g. .../mars/exc/MARS_EXC_01.mp3
 *
 * ADDING VARIANTS:
 *   Edit the arrays below. Each inner string is a filename without .mp3.
 *   e.g. ['SUN_NAT_01', 'SUN_NAT_01b', 'SUN_NAT_01c']
 */

import type { ChamberDNA } from '@/lib/chamber/ChamberDNAEngine'

// ─── TYPES ────────────────────────────────────────────────────────────────────

/** Polarity state folder — maps to subfolder under planet directory. */
export type AudioFolderState = 'nat' | 'exc' | 'def' | 'blk'

/** Resolved track info ready for audio player. */
export interface AstryxTrack {
  url: string
  filename: string
  planet: string
  state: AudioFolderState
}

// ─── COMPLETE TRACK CATALOG ───────────────────────────────────────────────────
// Structure: planet (lowercase) → state → array of filename stems
// Add variant filenames (b, c, d) to any array as they are created.

const CATALOG: Record<string, Record<AudioFolderState, string[]>> = {
  // AUTO-GENERATED from the live astryx-audio R2 bucket (normalized to
  // {planet}/{state}/{STEM}.mp3). Edit the bucket + re-run the catalog
  // generator rather than hand-editing. Seed selection picks deterministically.
  sun: {
    nat: ['SUN_NAT_01', 'SUN_NAT_02', 'SUN_NAT_03', 'SUN_NAT_04', 'SUN_NAT_04b', 'SUN_NAT_05', 'SUN_NAT_05b'],
    exc: ['SUN_EXC_01', 'SUN_EXC_02', 'SUN_EXC_02b', 'SUN_EXC_03'],
    def: ['SUN_DEF_01', 'SUN_DEF_01b', 'SUN_DEF_01c', 'SUN_DEF_02'],
    blk: ['SUN_BLK_01', 'SUN_BLK_01b', 'SUN_BLK_02', 'SUN_BLK_02b'],
  },
  moon: {
    nat: ['MOON_NAT_01', 'MOON_NAT_02', 'MOON_NAT_03', 'MOON_NAT_03b', 'MOON_NAT_04b'],
    exc: ['MOON_EXC_01', 'MOON_EXC_01a', 'MOON_EXC_01b', 'MOON_EXC_02', 'MOON_EXC_02b', 'MOON_EXC_03', 'MOON_EXC_03b'],
    def: ['MOON_DEF_01', 'MOON_DEF_02'],
    blk: ['MOON_BLK_01'],
  },
  mercury: {
    nat: ['MERCURY_NAT_01', 'MERCURY_NAT_01b', 'MERCURY_NAT_02', 'MERCURY_NAT_03'],
    exc: ['MERCURY_EXC_01', 'MERCURY_EXC_01b', 'MERCURY_EXC_02', 'MERCURY_EXC_03'],
    def: ['MERCURY_DEF_01', 'MERCURY_DEF_01b', 'MERCURY_DEF_02'],
    blk: ['MERCURY_BLK_01', 'MERCURY_BLK_01b', 'MERCURY_BLK_02', 'MERCURY_BLK_02b'],
  },
  venus: {
    nat: ['VENUS_NAT_01', 'VENUS_NAT_01b', 'VENUS_NAT_02', 'VENUS_NAT_02b', 'VENUS_NAT_02c'],
    exc: ['VENUS_EXC_01', 'VENUS_EXC_01b', 'VENUS_EXC_02', 'VENUS_EXC_03'],
    def: ['VENUS_DEF_01'],
    blk: ['VENUS_BLK_01', 'VENUS_BLK_01b', 'VENUS_BLK_02', 'VENUS_BLK_02b'],
  },
  mars: {
    nat: ['MARS_NAT_01', 'MARS_NAT_01b', 'MARS_NAT_02b'],
    exc: ['MARS_EXC_01', 'MARS_EXC_01b', 'MARS_EXC_02', 'MARS_EXC_02b', 'MARS_EXC_03', 'MARS_EXC_03b'],
    def: ['MARS_DEF_01', 'MARS_DEF_01b', 'MARS_DEF_02', 'MARS_DEF_02b'],
    blk: ['MARS_BLK_01', 'MARS_BLK_01b', 'MARS_BLK_02', 'MARS_BLK_02b'],
  },
  jupiter: {
    nat: ['JUPITER_NAT_01', 'JUPITER_NAT_01b', 'JUPITER_NAT_01c', 'JUPITER_NAT_02', 'JUPITER_NAT_02b', 'JUPITER_NAT_02c', 'JUPITER_NAT_03', 'JUPITER_NAT_03b', 'JUPITER_NAT_04b'],
    exc: ['JUPITER_EXC_01', 'JUPITER_EXC_01b', 'JUPITER_EXC_01c', 'JUPITER_EXC_02', 'JUPITER_EXC_02b', 'JUPITER_EXC_02c', 'JUPITER_EXC_03', 'JUPITER_EXC_03b'],
    def: ['JUPITER_DEF_01', 'JUPITER_DEF_01b'],
    blk: ['JUPITER_BLK_01', 'JUPITER_BLK_01b', 'JUPITER_BLK_02', 'JUPITER_BLK_02b', 'JUPITER_BLK_02c'],
  },
  saturn: {
    nat: ['SATURN_NAT_01', 'SATURN_NAT_01b', 'SATURN_NAT_02', 'SATURN_NAT_03b'],
    exc: ['SATURN_EXC_01', 'SATURN_EXC_01b', 'SATURN_EXC_02', 'SATURN_EXC_02b', 'SATURN_EXC_03', 'SATURN_EXC_03b'],
    def: ['SATURN_DEF_01', 'SATURN_DEF_01b', 'SATURN_DEF_01c', 'SATURN_DEF_02', 'SATURN_DEF_02b'],
    blk: ['SATURN_BLK_01', 'SATURN_BLK_01b', 'SATURN_BLK_02', 'SATURN_BLK_02b', 'SATURN_BLK_02c'],
  },
  uranus: {
    nat: ['URANUS_NAT_02', 'URANUS_NAT_03'],
    exc: ['URANUS_EXC_02', 'URANUS_EXC_02b', 'URANUS_EXC_03', 'URANUS_EXC_03b', 'URANUS_EXC_03c'],
    def: ['URANUS_DEF_01', 'URANUS_DEF_02', 'URANUS_DEF_02b'],
    blk: ['URANUS_BLK_01', 'URANUS_BLK_01b', 'URANUS_BLK_02', 'URANUS_BLK_02b'],
  },
  neptune: {
    nat: ['NEPTUNE_NAT_01', 'NEPTUNE_NAT_01b', 'NEPTUNE_NAT_02', 'NEPTUNE_NAT_02b', 'NEPTUNE_NAT_03', 'NEPTUNE_NAT_03b', 'NEPTUNE_NAT_04', 'NEPTUNE_NAT_04b'],
    exc: ['NEPTUNE_EXC_01', 'NEPTUNE_EXC_01b', 'NEPTUNE_EXC_02', 'NEPTUNE_EXC_02b', 'NEPTUNE_EXC_03', 'NEPTUNE_EXC_03b'],
    def: ['NEPTUNE_DEF_01', 'NEPTUNE_DEF_01b', 'NEPTUNE_DEF_01c', 'NEPTUNE_DEF_02', 'NEPTUNE_DEF_02b'],
    blk: ['NEPTUNE_BLK_01', 'NEPTUNE_BLK_01b', 'NEPTUNE_BLK_02', 'NEPTUNE_BLK_02b'],
  },
  pluto: {
    nat: ['PLUTO_NAT_01', 'PLUTO_NAT_02'],
    exc: ['PLUTO_EXC_02', 'PLUTO_EXC_03', 'PLUTO_EXC_03b'],
    def: ['PLUTO_DEF_02', 'PLUTO_DEF_02b'],
    blk: ['PLUTO_BLK_01', 'PLUTO_BLK_01b', 'PLUTO_BLK_02', 'PLUTO_BLK_02b'],
  },
  // EARTH foundation tones (NAT-only — Earth is the grounding baseline, not a
  // pathology, so it has no exc/def/blk corrective states). Not chart-selected;
  // used by the Earth attunement / grounding layer.
  earthday: {
    nat: ['EARTHDAY_NAT_01', 'EARTHDAY_NAT_02', 'EARTHDAY_NAT_03', 'EARTHDAY_NAT_04'],
    exc: [], def: [], blk: [],
  },
  // EARTH YEAR — the session-closing grounding layer. NOTE: these live directly
  // under earthyear/ (NO nat/ subfolder) with literal spaces in the names — see
  // the earthyear special-case in buildTrackUrl(). Verified live in R2 2026-06-28.
  earthyear: {
    nat: ['Earth Year', 'Earth Year 2', 'Earth Year 3'],
    exc: [], def: [], blk: [],
  },
}

// ─── RUNTIME CATALOG (Directive I.4 — manifest-driven, grows monthly) ─────────
// The static CATALOG above is the SEED / fallback. At runtime (client only) the
// app fetches `{base}/catalog.json` from the R2 bucket and MERGES it in, so new
// songs added to the bucket appear with NO redeploy. Selection stays
// deterministic (seed % pool.length) — the manifest only widens the pool.
//
// Manifest shape (either is accepted):
//   1. Flat path list:   { "tracks": ["mars/exc/MARS_EXC_07.mp3", ...] }
//   2. Nested map:        { "catalog": { "mars": { "exc": ["MARS_EXC_07", ...] } } }
// Regenerate it from the bucket whenever songs change — see
// scripts/generate-catalog-manifest.mjs and the audio R2 pipeline notes.

type Catalog = Record<string, Record<AudioFolderState, string[]>>

const STATES: AudioFolderState[] = ['nat', 'exc', 'def', 'blk']

function cloneCatalog(src: Catalog): Catalog {
  const out: Catalog = {}
  for (const [planet, states] of Object.entries(src)) {
    out[planet] = { nat: [...states.nat], exc: [...states.exc], def: [...states.def], blk: [...states.blk] }
  }
  return out
}

// Mutable runtime pool — starts as the static seed, replaced/augmented by manifest.
let runtimeCatalog: Catalog = cloneCatalog(CATALOG)
let manifestState: 'unloaded' | 'loading' | 'loaded' | 'failed' = 'unloaded'
let manifestPromise: Promise<void> | null = null

function activeCatalog(): Catalog {
  return runtimeCatalog
}

/** Ensure a planet/state slot exists before pushing into it. */
function ensureSlot(cat: Catalog, planet: string): Record<AudioFolderState, string[]> {
  if (!cat[planet]) cat[planet] = { nat: [], exc: [], def: [], blk: [] }
  return cat[planet]
}

/** Merge a flat list of `{planet}/{state}/{STEM}.mp3` paths into a catalog. */
function mergeFlatPaths(into: Catalog, paths: string[]): void {
  for (const raw of paths) {
    const parsed = parseTrackPath(raw)
    if (!parsed) continue
    const slot = ensureSlot(into, parsed.planet)
    if (!slot[parsed.state].includes(parsed.filename)) slot[parsed.state].push(parsed.filename)
  }
}

/** Merge a nested {planet:{state:[stems]}} map into a catalog (de-duped). */
function mergeNested(into: Catalog, nested: Record<string, Partial<Record<AudioFolderState, string[]>>>): void {
  for (const [planetRaw, states] of Object.entries(nested)) {
    const planet = planetRaw.toLowerCase()
    const slot = ensureSlot(into, planet)
    for (const st of STATES) {
      for (const stem of states[st] ?? []) {
        if (!slot[st].includes(stem)) slot[st].push(stem)
      }
    }
  }
}

/**
 * Parse a `{planet}/{state}/{STEM}.mp3` path (optionally with leading segments)
 * into its parts. Returns null if it doesn't match the known shape.
 */
export function parseTrackPath(path: string): { planet: string; state: AudioFolderState; filename: string } | null {
  const clean = path.replace(/^\/+/, '').split('?')[0]
  const segs = clean.split('/').filter(Boolean)
  if (segs.length < 3) return null
  const filenameWithExt = segs[segs.length - 1]
  const state = segs[segs.length - 2].toLowerCase() as AudioFolderState
  const planet = segs[segs.length - 3].toLowerCase()
  if (!STATES.includes(state)) return null
  const filename = filenameWithExt.replace(/\.mp3$/i, '')
  if (!filename) return null
  return { planet, state, filename }
}

/** Parse a full track URL into {planet, state, filename}. */
export function parseTrackUrl(url: string): { planet: string; state: AudioFolderState; filename: string } | null {
  return parseTrackPath(url)
}

/**
 * Fetch + merge the bucket manifest (`{base}/catalog.json`). Idempotent and
 * safe to call repeatedly — only the first call hits the network. On any
 * failure it silently keeps the static seed catalog (current behavior).
 * Directive I.4: monthly additions appear with no redeploy.
 */
export function ensureManifestLoaded(): Promise<void> {
  if (manifestPromise) return manifestPromise
  if (typeof window === 'undefined') return Promise.resolve()
  // FIX 3 — fetch the SAME-ORIGIN proxy (`/api/catalog`), not the R2 bucket
  // directly. The bucket sends no CORS header, so a direct browser fetch throws;
  // the proxy server-fetches it for us. mp3 playback still hits the bucket.
  manifestState = 'loading'
  manifestPromise = fetch('/api/catalog', { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error(`manifest ${res.status}`)
      return res.json()
    })
    .then((data: any) => {
      const merged = cloneCatalog(CATALOG)
      if (Array.isArray(data?.tracks)) mergeFlatPaths(merged, data.tracks)
      else if (Array.isArray(data)) mergeFlatPaths(merged, data)
      if (data?.catalog && typeof data.catalog === 'object') mergeNested(merged, data.catalog)
      runtimeCatalog = merged
      manifestState = 'loaded'
    })
    .catch((err) => {
      console.warn('[AstryxAudio] manifest load failed — using seed catalog:', err)
      manifestState = 'failed'
    })
  return manifestPromise
}

export function manifestStatus(): typeof manifestState {
  return manifestState
}

// ─── TRACK KEY CONVENTION (v4.1 Fix 3 — the single source of truth) ──────────
// Catalog + bucket keys are `{planet}/{state}/{STEM}.mp3` where:
//   • planet  = LOWERCASE canonical planet name ('sun'…'pluto'), plus the two
//     app-played Earth layers 'earthday' / 'earthyear'. The PHYSICAL fork named
//     "Full Moon" maps to the 'moon' folder — normalizePlanetKey() owns that
//     mapping; never call .toLowerCase() directly on a planet for catalog work.
//   • state   = 'nat' | 'exc' | 'def' | 'blk' (audioStateFromPolarity maps the
//     engine's polarity states onto these folders).
//   • STEM    = UPPERCASE `{PLANET}_{STATE}_{NN}[variant]` (e.g. MARS_EXC_01b) —
//     except earthyear, which lives directly under earthyear/ with legacy
//     space-named files (see buildTrackUrl's special case).
export function normalizePlanetKey(planet: string): string {
  const key = planet.trim().toLowerCase()
  return key === 'full moon' ? 'moon' : key
}

/**
 * v4.2 Fix 1 — THE canonical track key: `planet/state/STEM` (lowercase planet
 * via normalizePlanetKey, lowercase state, STEM verbatim — uppercase with
 * optional variant suffix like `_03b`; the manifest CARRIES variant suffixes,
 * the selector requests them — both sides speak stems, never bare numbers).
 * Every lookup, log line, and manifest row must round-trip through this format;
 * scripts/generate-catalog-manifest.mjs writes the same shape (its parseKey
 * lowercases planet/state and preserves the stem — keep them in lockstep).
 * URL building adds `.mp3` + percent-encoding + the earthyear special case on
 * top of this key (see buildTrackUrl) — keys never contain encoding.
 */
export function normalizeTrackKey(planet: string, state: AudioFolderState | string, stem: string): string {
  return `${normalizePlanetKey(planet)}/${String(state).trim().toLowerCase()}/${stem.trim()}`
}

/**
 * All version filename-stems available for a planet/state (the FULL pool —
 * seed + manifest). Directive I.4: the user can switch between versions of the
 * called-for aspect in the chamber.
 */
export function versionsFor(planet: string, state: AudioFolderState): string[] {
  return activeCatalog()[normalizePlanetKey(planet)]?.[state] ?? []
}

// ─── HUMAN-READABLE TRACK LABELS (Directive I-FIX Phase 6) ─────────────────────
// Raw stems (SUN_NAT_01) must never show in the UI. These are CALIBRATED VARIANTS
// within one planet+state frequency family — not a generic playlist. The user
// picks a variant; they can never pick unrelated music that breaks the protocol.
const STATE_WORDS: Record<AudioFolderState, string> = {
  nat: 'Natural',
  exc: 'Excess Regulation',
  def: 'Deficiency Activation',
  blk: 'Blocked Release',
}
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

function titlePlanet(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
}

/** Short human label for the variant ordinal, e.g. "Variant II" (default = "Variant I · Default"). */
export function variantOrdinal(planet: string, state: AudioFolderState, filename: string, seed?: number): string {
  const versions = versionsFor(planet, state)
  const idx = Math.max(0, versions.indexOf(filename))
  const roman = ROMAN[idx] ?? String(idx + 1)
  const isDefault = seed !== undefined && idx === (Math.abs(seed) % Math.max(1, versions.length))
  return `Variant ${roman}${isDefault ? ' · Default' : ''}`
}

/** Full calibrated-variant label, e.g. "Sun · Natural · Variant II". */
export function variantLabel(planet: string, state: AudioFolderState, filename: string): string {
  const versions = versionsFor(planet, state)
  const idx = Math.max(0, versions.indexOf(filename))
  const roman = ROMAN[idx] ?? String(idx + 1)
  return `${titlePlanet(planet)} · ${STATE_WORDS[state] ?? state} · Variant ${roman}`
}

// ─── STATE DERIVATION ─────────────────────────────────────────────────────────

/**
 * Derives the correct AudioFolderState from ChamberDNA.
 * - Not corrective / balanced → 'nat'
 * - Corrective excess → 'exc'
 * - Corrective deficiency → 'def'
 * - Corrective blocked → 'blk'
 */
export function stateFromChamberDNA(dna: ChamberDNA): AudioFolderState {
  if (!dna.applyCorrective || !dna.polarity) return 'nat'
  const ds = dna.polarity.dominant_state
  if (ds === 'excess')      return 'exc'
  if (ds === 'deficiency')  return 'def'
  if (ds === 'blocked')     return 'blk'
  return 'nat'
}

// ─── TRACK SELECTION ──────────────────────────────────────────────────────────

/**
 * Deterministically selects a track filename from the catalog.
 * Uses: seed % variants.length — same birth data always picks the same track.
 *
 * @param planet  Planet name (case-insensitive: 'Mars', 'mars', 'MARS' all work)
 * @param state   Polarity state folder ('nat' | 'exc' | 'def' | 'blk')
 * @param seed    ChamberDNA.seed (32-bit integer hash of birth data)
 * @returns Filename stem WITHOUT extension, or null if not found
 */
export function selectTrackFilename(
  planet: string,
  state: AudioFolderState,
  seed: number,
): string | null {
  const key = normalizePlanetKey(planet)
  const planetCatalog = activeCatalog()[key]
  if (!planetCatalog) {
    console.warn(`[AstryxAudio] Unknown planet: "${planet}"`)
    return null
  }
  const tracks = planetCatalog[state]
  if (!tracks || tracks.length === 0) {
    console.warn(`[AstryxAudio] No tracks for ${planet}/${state}`)
    return null
  }
  // Deterministic: use absolute value of seed to avoid negative modulo issues
  const idx = Math.abs(seed) % tracks.length
  return tracks[idx]
}

// ─── URL BUILDER ──────────────────────────────────────────────────────────────

/**
 * Builds the full CDN URL for a track.
 *
 * NEXT_PUBLIC_AUDIO_BASE_URL should point to wherever the MP3s are hosted.
 * If unset, falls back to /audio/library (public/ folder — local dev only).
 *
 * URL shape: {base}/{planet}/{state}/{filename}.mp3
 * Example:   https://r2.yourdomain.com/audio/mars/exc/MARS_EXC_01.mp3
 *
 * NOTE — Google Drive cannot serve audio cross-origin.
 * Upload tracks to Cloudflare R2 or Vercel Blob for production.
 */
export function buildTrackUrl(
  planet: string,
  state: AudioFolderState,
  filename: string,
): string {
  const base = process.env.NEXT_PUBLIC_AUDIO_BASE_URL?.replace(/\/$/, '')
    ?? '/audio/library'
  const folder = normalizePlanetKey(planet)
  // encodeURIComponent leaves clean stems (EARTHDAY_NAT_01, MERCURY_EXC_01) intact
  // and turns spaces ("Earth Year") into %20 so messy R2 names still resolve.
  const file = `${encodeURIComponent(filename)}.mp3`
  // Earth Year files live directly under earthyear/ (no state subfolder) in R2.
  if (folder === 'earthyear') return `${base}/earthyear/${file}`
  return `${base}/${folder}/${state}/${file}`
}

// ─── MAIN RESOLVER ────────────────────────────────────────────────────────────

/**
 * Primary entry point. Given a ChamberDNA, returns the resolved AstryxTrack
 * (URL + metadata) ready to hand to the Astryx player.
 *
 * Returns null if NEXT_PUBLIC_AUDIO_BASE_URL is not set (feature disabled)
 * or if the catalog has no entry for this planet/state combination.
 */
export function resolveTrack(dna: ChamberDNA): AstryxTrack | null {
  // Feature gate: if no base URL configured, the audio layer is silent
  if (
    typeof window !== 'undefined' &&
    !process.env.NEXT_PUBLIC_AUDIO_BASE_URL
  ) {
    // In production SSR this env var is embedded at build time — this guard
    // prevents runtime errors on a fresh local install with no env configured.
    return null
  }

  const state = stateFromChamberDNA(dna)
  // Use primaryPlanet for folder selection (which planet's corrective library)
  // effectivePlanet drives the Tone.js character; primaryPlanet drives the audio folder.
  const planet = dna.primaryPlanet
  const filename = selectTrackFilename(planet, state, dna.seed)
  if (!filename) return null

  return {
    url: buildTrackUrl(planet, state, filename),
    filename,
    planet,
    state,
  }
}

// ─── TIER RESOLVER (Directive B.1 — the audio journey) ────────────────────────
// Map a polarity state to its audio folder. The CORRECTION IS BAKED INTO THE
// TRACK (MARS_EXC already sounds cooling), so we select the planet's OWN state
// track — NEVER the regulator's NAT track. No double-correction.
const POLARITY_TO_FOLDER: Record<string, AudioFolderState> = {
  excess: 'exc', deficiency: 'def', blocked: 'blk', balanced: 'nat',
}

export function audioStateFromPolarity(state?: string): AudioFolderState {
  return POLARITY_TO_FOLDER[state ?? 'balanced'] ?? 'nat'
}

/**
 * Resolve a single tier's track (planet + its OWN polarity state), deterministic
 * by seed. Returns null when the CDN is unconfigured or the planet is unknown.
 * Used by SoundEngineController to pre-resolve the primary / secondary / tertiary
 * journey tracks from the signalHierarchy-filled ChamberDNA.
 */
export function resolveTierTrack(
  planet: string | undefined,
  polarityState: string | undefined,
  seed: number,
): AstryxTrack | null {
  if (!planet) return null
  if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_AUDIO_BASE_URL) return null
  const state = audioStateFromPolarity(polarityState)
  const filename = selectTrackFilename(planet, state, seed)
  if (!filename) return null
  return { url: buildTrackUrl(planet, state, filename), filename, planet, state }
}

// ─── CATALOG INFO (for diagnostics) ──────────────────────────────────────────

/** Returns all track counts per planet for a quick sanity check. */
export function catalogStats(): Record<string, Record<AudioFolderState, number>> {
  const result: Record<string, Record<AudioFolderState, number>> = {}
  for (const [planet, states] of Object.entries(activeCatalog())) {
    result[planet] = {
      nat: states.nat.length,
      exc: states.exc.length,
      def: states.def.length,
      blk: states.blk.length,
    }
  }
  return result
}

/** Total tracks across all planets and states. */
export function totalTrackCount(): number {
  return Object.values(activeCatalog()).reduce((sum, states) => {
    return sum + Object.values(states).reduce((s, arr) => s + arr.length, 0)
  }, 0)
}
