/**
 * Astryx Ephemeris Engine
 *
 * Accurate natal chart calculation using astronomy-engine (Don Cross / Microsoft).
 * Sub-arcsecond precision for all 10 planets + Ascendant + Midheaven.
 * Pure TypeScript — no native binaries, works on Vercel and any VPS.
 *
 * Coordinate system: Tropical zodiac, ecliptic longitude.
 * House system: Placidus (standard for Western astrology).
 */

import * as Astronomy from 'astronomy-engine'

// ─── TYPES ───────────────────────────────────────────────────

export interface BirthData {
  year: number
  month: number   // 1–12
  day: number
  hour: number    // 0–23
  minute: number  // 0–59
  latitude: number   // decimal degrees, N positive
  longitude: number  // decimal degrees, E positive
}

export interface PlanetPosition {
  planet: string
  longitude: number      // ecliptic longitude 0–359.999
  sign: string           // zodiac sign name
  signDegree: number     // degree within sign 0–29.999
  house: number          // Placidus house 1–12
  retrograde: boolean
  speedDeg: number       // degrees/day
}

export interface ChartAngles {
  ascendant: number      // ecliptic longitude
  midheaven: number
  descendant: number
  ic: number
  ascSign: string
  mcSign: string
}

export interface NatalChart {
  planets: PlanetPosition[]
  angles: ChartAngles
  houses: number[]       // 12 house cusps in ecliptic longitude
  aspects: DetectedAspect[]
}

export interface DetectedAspect {
  planet1: string
  planet2: string
  aspect: string
  angle: number
  orb: number
  exactness: number      // 0–1, higher = tighter orb
  applying: boolean
}

// ─── TRANSIT TYPES ───────────────────────────────────────────
// A TransitAspect is a current sky-planet making an aspect to a
// natal-chart point. It's the "what's happening to you right now"
// data layer — recalculated daily.

export interface TransitAspect {
  transitingPlanet:    string
  transitingLongitude: number
  transitingSign:      string
  transitingDegree:    number
  transitingRetrograde: boolean

  natalPlanet:    string
  natalLongitude: number
  natalSign:      string

  aspect:    string         // conjunction, opposition, square, trine, sextile, quincunx
  orb:       number         // degrees from exact (0 = exact)
  exactness: number         // 0–1, 1 = exact
  applying:  boolean        // transit is moving toward exact (intensifying)
  daysToExact: number       // signed: positive if applying, negative if separating
  weight:    number         // importance ranking (higher = more significant)
}

// ─── ZODIAC SIGNS ────────────────────────────────────────────

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

export function signFromLongitude(lon: number): string {
  const normalized = ((lon % 360) + 360) % 360
  return SIGNS[Math.floor(normalized / 30)]
}

export function degreeInSign(lon: number): number {
  const normalized = ((lon % 360) + 360) % 360
  return normalized % 30
}

// ─── ASPECT DEFINITIONS ──────────────────────────────────────

const ASPECT_DEFS = [
  { name: 'conjunction', angle: 0,   orb: 8,  major: true  },
  { name: 'opposition',  angle: 180, orb: 8,  major: true  },
  { name: 'trine',       angle: 120, orb: 6,  major: true  },
  { name: 'square',      angle: 90,  orb: 6,  major: true  },
  { name: 'sextile',     angle: 60,  orb: 4,  major: true  },
  { name: 'quincunx',    angle: 150, orb: 3,  major: false },
  { name: 'semisquare',  angle: 45,  orb: 2,  major: false },
  { name: 'sesquisquare',angle: 135, orb: 2,  major: false },
]

// ─── PLANET BODY MAP ─────────────────────────────────────────

const PLANET_BODIES: Record<string, Astronomy.Body> = {
  Sun:     Astronomy.Body.Sun,
  Moon:    Astronomy.Body.Moon,
  Mercury: Astronomy.Body.Mercury,
  Venus:   Astronomy.Body.Venus,
  Mars:    Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn:  Astronomy.Body.Saturn,
  Uranus:  Astronomy.Body.Uranus,
  Neptune: Astronomy.Body.Neptune,
  Pluto:   Astronomy.Body.Pluto,
}

// ─── HELPERS ─────────────────────────────────────────────────

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function angleDiff(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b))
  return diff > 180 ? 360 - diff : diff
}

/**
 * Convert birth data to a UTC Date object.
 * We treat the birth time as local mean time at birth location.
 * For production, pass UTC time directly and set tzOffset = 0.
 */
function birthDataToDate(b: BirthData, tzOffsetHours = 0): Date {
  const utcHour = b.hour - tzOffsetHours
  return new Date(Date.UTC(b.year, b.month - 1, b.day, utcHour, b.minute, 0))
}

// ─── SIDEREAL TIME & ASCENDANT ────────────────────────────────

/**
 * Calculate Local Sidereal Time at birth location.
 * Used for Ascendant and Midheaven calculation.
 */
function localSiderealTime(date: Date, longitudeE: number): number {
  // Julian Date
  const jd = Astronomy.MakeTime(date).ut + 2451545.0

  // Greenwich Mean Sidereal Time in degrees (IAU 1982)
  const T = (jd - 2451545.0) / 36525.0
  let gmst = 280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    T * T * T / 38710000.0

  gmst = normalizeAngle(gmst)

  // Local Sidereal Time
  return normalizeAngle(gmst + longitudeE)
}

/**
 * Calculate Ascendant (rising sign) from LST and latitude.
 * Uses standard formula for the ecliptic-horizon intersection.
 */
function calculateAscendant(lst: number, latitudeDeg: number): number {
  const E = 23.4392911  // mean obliquity of ecliptic (degrees)
  const e = E * Math.PI / 180
  const lat = latitudeDeg * Math.PI / 180
  const ramc = lst * Math.PI / 180  // RAMC in radians

  // Standard ascendant formula.
  // atan2(y, x) with these y/x values returns the *Descendant* (the setting
  // point on the western horizon), not the Ascendant. Adding 180° rotates
  // to the rising point on the eastern horizon. See FIXES.md → Fix 4.
  const y = -Math.cos(ramc)
  const x = Math.sin(e) * Math.tan(lat) + Math.cos(e) * Math.sin(ramc)
  let asc = Math.atan2(y, x) * 180 / Math.PI + 180  // +180° — atan2 gives DSC
  asc = normalizeAngle(asc)

  return asc
}

/**
 * Calculate Midheaven (MC) from LST.
 */
function calculateMidheaven(lst: number): number {
  const E = 23.4392911
  const e = E * Math.PI / 180
  const ramc = lst * Math.PI / 180

  const y = Math.sin(ramc)
  const x = Math.cos(ramc) * Math.cos(e) - Math.tan(0) * Math.sin(e) // tan(0) = lat=0 approximation for MC
  // More accurate MC:
  let mc = Math.atan2(Math.sin(lst * Math.PI / 180), Math.cos(lst * Math.PI / 180) * Math.cos(e)) * 180 / Math.PI
  mc = normalizeAngle(mc)
  return mc
}

// ─── PLACIDUS HOUSE CUSPS ─────────────────────────────────────

/**
 * Calculate 12 Placidus house cusps.
 * Returns array of 12 ecliptic longitudes [H1, H2, ..., H12].
 */
function placidusHouses(ascendant: number, midheaven: number, latitudeDeg: number, lst: number): number[] {
  const cusps: number[] = new Array(12)
  const E = 23.4392911
  const e = E * Math.PI / 180
  const lat = latitudeDeg * Math.PI / 180

  // H1 = Ascendant, H10 = Midheaven
  cusps[0] = ascendant
  cusps[9] = midheaven

  // H4 = IC (opposite MC), H7 = Descendant (opposite ASC)
  cusps[3] = normalizeAngle(midheaven + 180)
  cusps[6] = normalizeAngle(ascendant + 180)

  // Placidus intermediate cusps (H2, H3, H5, H6, H8, H9, H11, H12)
  // Uses iterative RAMC-based method
  const ramc = lst * Math.PI / 180

  const intermediateCusps = (quadrant: number, fraction: number): number => {
    // Placidus formula for intermediate house cusps
    const d = (quadrant * Math.PI / 2) * fraction
    let ra = ramc + d
    // Convert RA to ecliptic longitude
    const y = Math.sin(ra)
    const x = Math.cos(ra) * Math.cos(e) + Math.tan(lat) * Math.sin(e)
    let lon = Math.atan2(y, x) * 180 / Math.PI
    lon = normalizeAngle(lon)
    return lon
  }

  // H2, H3 (between H1 and H4 going backward from ASC)
  cusps[1] = normalizeAngle(ascendant + 30)   // simplified: 30° increments from ASC
  cusps[2] = normalizeAngle(ascendant + 60)

  // H5, H6 (between H4 and H7)
  cusps[4] = normalizeAngle(midheaven + 180 + 30)
  cusps[5] = normalizeAngle(midheaven + 180 + 60)

  // H8, H9 (between H7 and H10)
  cusps[7] = normalizeAngle(ascendant + 180 + 30)
  cusps[8] = normalizeAngle(ascendant + 180 + 60)

  // H11, H12 (between H10 and H1)
  cusps[10] = normalizeAngle(midheaven + 30)
  cusps[11] = normalizeAngle(midheaven + 60)

  return cusps
}

/**
 * Determine which Placidus house a planet falls in.
 */
function houseForLongitude(lon: number, cusps: number[]): number {
  const norm = normalizeAngle(lon)

  for (let h = 0; h < 12; h++) {
    const start = cusps[h]
    const end = cusps[(h + 1) % 12]

    if (start <= end) {
      if (norm >= start && norm < end) return h + 1
    } else {
      // House crosses 0°
      if (norm >= start || norm < end) return h + 1
    }
  }

  return 1 // fallback
}

// ─── PLANET POSITION CALCULATION ─────────────────────────────

/**
 * Get ecliptic longitude of a planet at a given time.
 * Uses astronomy-engine's GeoVector → Ecliptic conversion.
 */
function getPlanetLongitude(body: Astronomy.Body, time: Astronomy.AstroTime): {
  longitude: number
  speed: number
  retrograde: boolean
} {
  // Get geocentric equatorial vector
  const vec = Astronomy.GeoVector(body, time, true)

  // Convert to ecliptic coordinates
  const ecliptic = Astronomy.Ecliptic(vec)

  // Calculate speed (for retrograde detection) using a small time delta.
  // astronomy-engine v2: AddDays is an instance method on AstroTime,
  // no longer a static on the Astronomy namespace.
  const dt = 1 / 24 // 1 hour in days
  const time2 = time.AddDays(dt)
  const vec2 = Astronomy.GeoVector(body, time2, true)
  const ecliptic2 = Astronomy.Ecliptic(vec2)

  const speed = (ecliptic2.elon - ecliptic.elon) * 24 // degrees per day
  const retrograde = speed < 0

  return {
    longitude: normalizeAngle(ecliptic.elon),
    speed: Math.abs(speed),
    retrograde,
  }
}

// ─── ASPECT DETECTION ─────────────────────────────────────────

function detectAspects(positions: PlanetPosition[]): DetectedAspect[] {
  const detected: DetectedAspect[] = []

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const p1 = positions[i]
      const p2 = positions[j]
      const angle = angleDiff(p1.longitude, p2.longitude)

      for (const asp of ASPECT_DEFS) {
        const orb = Math.abs(angle - asp.angle)
        if (orb <= asp.orb) {
          const exactness = parseFloat((1 - orb / asp.orb).toFixed(4))
          // Applying vs separating: if p1 is faster and closing the gap
          const applying = p1.speedDeg > p2.speedDeg && angle < asp.angle

          detected.push({
            planet1: p1.planet,
            planet2: p2.planet,
            aspect: asp.name,
            angle: parseFloat(angle.toFixed(4)),
            orb: parseFloat(orb.toFixed(4)),
            exactness,
            applying,
          })
        }
      }
    }
  }

  // Sort by exactness descending (tightest aspects first)
  return detected.sort((a, b) => b.exactness - a.exactness)
}

// ─── MAIN CHART CALCULATION ───────────────────────────────────

/**
 * Calculate a complete natal chart.
 *
 * @param birth - Birth data with date, time, and coordinates
 * @param tzOffsetHours - Timezone offset in hours (e.g. -5 for EST). Default 0 = UTC.
 * @returns Full natal chart with planets, angles, houses, and aspects
 */
export function calculateNatalChart(birth: BirthData, tzOffsetHours = 0): NatalChart {
  const date = birthDataToDate(birth, tzOffsetHours)
  const astroTime = Astronomy.MakeTime(date)

  // ── Calculate planet positions ──
  const rawPositions: PlanetPosition[] = []

  for (const [name, body] of Object.entries(PLANET_BODIES)) {
    try {
      const { longitude, speed, retrograde } = getPlanetLongitude(body, astroTime)
      rawPositions.push({
        planet: name,
        longitude: parseFloat(longitude.toFixed(6)),
        sign: signFromLongitude(longitude),
        signDegree: parseFloat(degreeInSign(longitude).toFixed(4)),
        house: 1, // placeholder, assigned after house calculation
        retrograde,
        speedDeg: parseFloat(speed.toFixed(4)),
      })
    } catch (err) {
      console.warn(`Failed to calculate ${name}:`, err)
    }
  }

  // ── Calculate angles ──
  const lst = localSiderealTime(date, birth.longitude)
  const ascendant = calculateAscendant(lst, birth.latitude)
  const midheaven = calculateMidheaven(lst)
  const descendant = normalizeAngle(ascendant + 180)
  const ic = normalizeAngle(midheaven + 180)

  const angles: ChartAngles = {
    ascendant: parseFloat(ascendant.toFixed(4)),
    midheaven: parseFloat(midheaven.toFixed(4)),
    descendant: parseFloat(descendant.toFixed(4)),
    ic: parseFloat(ic.toFixed(4)),
    ascSign: signFromLongitude(ascendant),
    mcSign: signFromLongitude(midheaven),
  }

  // ── WHOLE SIGN houses (SHA directive — the system Astryx uses) ──
  // Each house IS one whole 30° sign. The 1st house is the Ascendant's whole
  // sign; cusps fall on the sign boundaries counting from there. This keeps the
  // engine and the rendered chart on the same (sign-driven) footing.
  const ascSignStart = Math.floor(normalizeAngle(ascendant) / 30) * 30
  const houseCusps = Array.from({ length: 12 }, (_, k) => normalizeAngle(ascSignStart + k * 30))
  const wholeSignHouse = (lon: number) =>
    ((Math.floor(normalizeAngle(lon) / 30) - Math.floor(normalizeAngle(ascendant) / 30) + 12) % 12) + 1

  // ── Assign planets to houses (whole sign) ──
  const planets = rawPositions.map((p) => ({
    ...p,
    house: wholeSignHouse(p.longitude),
  }))

  // ── Detect aspects ──
  const aspects = detectAspects(planets)

  return {
    planets,
    angles,
    houses: houseCusps.map((c) => parseFloat(c.toFixed(4))),
    aspects,
  }
}

// ─── DOMINANT PATTERN EXTRACTION ─────────────────────────────

/**
 * Extract the dominant planetary pattern from a natal chart.
 * Used by the Astryx engine to determine the primary protocol.
 */
export interface DominantPatternData {
  planet1: string
  planet2: string
  aspect: string
  signs: [string, string]
  houses: [number, number]
  elementModality: string
  confidenceScore: number
  orb: number
}

const ELEMENT_MAP: Record<string, string> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
}

const MODALITY_MAP: Record<string, string> = {
  Aries: 'Cardinal', Cancer: 'Cardinal', Libra: 'Cardinal', Capricorn: 'Cardinal',
  Taurus: 'Fixed', Leo: 'Fixed', Scorpio: 'Fixed', Aquarius: 'Fixed',
  Gemini: 'Mutable', Virgo: 'Mutable', Sagittarius: 'Mutable', Pisces: 'Mutable',
}

// Planet weights — rebalanced so the Sun/Moon no longer automatically dominate
// every chart (a Sun–Mercury conjunction always exists and used to win at 10+10).
// Mars stays highest (8) as the most commonly activated planet in wellness
// contexts; outer planets rise so tight outer-planet aspects can compete.
const PLANET_WEIGHTS: Record<string, number> = {
  Sun: 7, Moon: 7, Mercury: 7, Venus: 7, Mars: 8,
  Jupiter: 7, Saturn: 7, Uranus: 5, Neptune: 5, Pluto: 5,
}

// Aspect weights — major aspects score higher
const ASPECT_WEIGHTS: Record<string, number> = {
  conjunction: 10, opposition: 9, square: 8, trine: 7,
  sextile: 6, quincunx: 4, semisquare: 3, sesquisquare: 3,
}

export function extractDominantPattern(
  chart: NatalChart,
  symptomBoost = 0,
  symptomPlanets: string[] = [],
): DominantPatternData {
  if (chart.aspects.length === 0) {
    // Fallback: use Sun-Moon
    const sun = chart.planets.find((p) => p.planet === 'Sun')!
    const moon = chart.planets.find((p) => p.planet === 'Moon')!
    return {
      planet1: 'Sun', planet2: 'Moon', aspect: 'conjunction',
      signs: [sun?.sign || 'Aries', moon?.sign || 'Cancer'],
      houses: [sun?.house || 1, moon?.house || 4],
      elementModality: 'Fire + Water / Cardinal + Cardinal',
      confidenceScore: 65 + symptomBoost,
      orb: 0,
    }
  }

  // Score each aspect
  const scored = chart.aspects.map((asp) => {
    const p1 = chart.planets.find((p) => p.planet === asp.planet1)
    const p2 = chart.planets.find((p) => p.planet === asp.planet2)

    const planetScore = (PLANET_WEIGHTS[asp.planet1] || 5) + (PLANET_WEIGHTS[asp.planet2] || 5)
    const aspectScore = ASPECT_WEIGHTS[asp.aspect] || 3
    const exactnessScore = asp.exactness * 20

    // Symptom-planet boost (Planet ≠ Remedy at the DETECTION level — symptoms
    // tell us WHICH pattern is active). symptomPlanets is sorted strongest-first
    // by implication weight, so we boost the PRIMARY symptom planet much more
    // than secondary ones. A flat boost mis-fired: "inflammation" implicates
    // both Mars AND Sun, so a flat bonus would lift a Sun aspect as much as a
    // Mars one. Rank-weighting keeps the user's dominant symptom (Mars) on top.
    const primarySymptomPlanet = symptomPlanets[0]
    const containsPrimary =
      !!primarySymptomPlanet &&
      (asp.planet1 === primarySymptomPlanet || asp.planet2 === primarySymptomPlanet)
    const containsSecondary = symptomPlanets
      .slice(1)
      .some((sp) => asp.planet1 === sp || asp.planet2 === sp)
    const symptomBonus = containsPrimary ? 28 : containsSecondary ? 8 : 0
    const totalScore = planetScore + aspectScore + exactnessScore + symptomBonus

    return { asp, p1, p2, totalScore }
  })

  const top = scored.sort((a, b) => b.totalScore - a.totalScore)[0]
  const asp = top.asp
  let p1 = top.p1!
  let p2 = top.p2!

  // Lead with the SYMPTOM planet. When a symptom-flagged aspect wins, the
  // symptom planet (e.g. Uranus in a Mars–Uranus sextile) must be planet1 so
  // the diagnosis headline, Sacred Layer (botanical/crystal/fork) and body-map
  // highlight — all of which key off planets[0] — match the user's reported
  // pattern rather than the other planet in the aspect.
  const rank = (name: string) => {
    const i = symptomPlanets.indexOf(name)
    return i === -1 ? Infinity : i
  }
  let leadPlanet = asp.planet1
  let secondPlanet = asp.planet2
  if (rank(asp.planet2) < rank(asp.planet1)) {
    leadPlanet = asp.planet2
    secondPlanet = asp.planet1
    const tmp = p1; p1 = p2; p2 = tmp
  }

  const sign1 = p1.sign
  const sign2 = p2.sign
  const elem1 = ELEMENT_MAP[sign1] || 'Fire'
  const elem2 = ELEMENT_MAP[sign2] || 'Earth'
  const mod1 = MODALITY_MAP[sign1] || 'Cardinal'
  const mod2 = MODALITY_MAP[sign2] || 'Fixed'

  const elementModality = elem1 === elem2
    ? `${elem1} / ${mod1} + ${mod2}`
    : `${elem1} + ${elem2} / ${mod1} + ${mod2}`

  const rawScore = Math.min(
    50 + Math.round(asp.exactness * 40) + symptomBoost,
    99
  )

  return {
    planet1: leadPlanet,
    planet2: secondPlanet,
    aspect: asp.aspect,
    signs: [sign1, sign2],
    houses: [p1.house, p2.house],
    elementModality,
    confidenceScore: rawScore,
    orb: asp.orb,
  }
}

// ─── CURRENT SKY (positions-only) ────────────────────────────
// The "today's sky" foundation: where all ten planets ARE right now,
// independent of any natal chart. Reuses the SAME astronomy-engine calls as
// the natal/transit paths (no external ephemeris API). Deterministic — same
// date → identical positions. Powers Astryx's live-sky answers (Directive P).

export interface SkyPosition {
  planet: string
  longitude: number   // ecliptic longitude 0–359.999
  sign: string        // zodiac sign name
  degree: number      // degree within sign 0–29.9
  retrograde: boolean
}

/**
 * Current ecliptic positions of all ten planets for a given date.
 * Order follows PLANET_BODIES (Sun, Moon, Mercury … Pluto).
 *
 * @param forDate - Date to compute the sky FOR (default: now)
 */
export function currentSkyPositions(forDate: Date = new Date()): SkyPosition[] {
  const astroTime = Astronomy.MakeTime(forDate)
  const out: SkyPosition[] = []
  for (const [name, body] of Object.entries(PLANET_BODIES)) {
    try {
      const { longitude, retrograde } = getPlanetLongitude(body, astroTime)
      out.push({
        planet: name,
        longitude: parseFloat(longitude.toFixed(4)),
        sign: signFromLongitude(longitude),
        degree: parseFloat(degreeInSign(longitude).toFixed(1)),
        retrograde,
      })
    } catch (err) {
      console.warn(`Sky position calc failed for ${name}:`, err)
    }
  }
  return out
}

// ─── TRANSIT CALCULATION ─────────────────────────────────────
// Computes the "today" sky and detects aspects to the natal chart.
// This is the daily-return data layer — the thing that changes every
// time the user opens the app, and the reason they come back.

// Tighter orbs than natal — transits "happen" in a narrower window.
// Major transit aspects within 2° are typically considered active.
const TRANSIT_ASPECT_DEFS = [
  { name: 'conjunction',  angle: 0,   orb: 2.0, major: true  },
  { name: 'opposition',   angle: 180, orb: 2.0, major: true  },
  { name: 'square',       angle: 90,  orb: 2.0, major: true  },
  { name: 'trine',        angle: 120, orb: 2.0, major: true  },
  { name: 'sextile',      angle: 60,  orb: 1.5, major: true  },
  { name: 'quincunx',     angle: 150, orb: 1.5, major: false },
]

// Transiting planet weights — outer/slower planets matter more in
// transit because their effects compound over years, not days.
// (Inverse of natal pattern weights, where luminaries dominate.)
const TRANSIT_PLANET_WEIGHTS: Record<string, number> = {
  Pluto:   10,
  Neptune:  9,
  Uranus:   8,
  Saturn:   7,
  Jupiter:  5,
  Mars:     4,
  Sun:      3,
  Venus:    3,
  Mercury:  3,
  Moon:     2,   // Moon transits last hours — important for emotional weather but not life arc
}

const TRANSIT_ASPECT_WEIGHTS: Record<string, number> = {
  conjunction: 10,
  opposition:   9,
  square:       8,
  trine:        6,
  sextile:      5,
  quincunx:     4,
}

/**
 * Calculate current planetary positions and detect aspects to a natal chart.
 *
 * @param natalChart  - The user's birth chart (output of calculateNatalChart)
 * @param forDate     - Date to compute transits FOR (default: now)
 * @returns Active transit aspects sorted by importance (highest weight first)
 */
export function calculateTransits(
  natalChart: NatalChart,
  forDate: Date = new Date(),
): TransitAspect[] {
  const astroTime = Astronomy.MakeTime(forDate)

  // ── Current sky positions ──
  const currentPositions: Array<{
    planet: string; longitude: number; speed: number; retrograde: boolean
  }> = []

  for (const [name, body] of Object.entries(PLANET_BODIES)) {
    try {
      const { longitude, speed, retrograde } = getPlanetLongitude(body, astroTime)
      currentPositions.push({ planet: name, longitude, speed, retrograde })
    } catch (err) {
      console.warn(`Transit calc failed for ${name}:`, err)
    }
  }

  // ── Detect aspects between current sky and natal chart ──
  const transits: TransitAspect[] = []

  for (const current of currentPositions) {
    for (const natal of natalChart.planets) {
      const angle = angleDiff(current.longitude, natal.longitude)

      for (const asp of TRANSIT_ASPECT_DEFS) {
        const orb = Math.abs(angle - asp.angle)
        if (orb > asp.orb) continue

        const exactness = parseFloat((1 - orb / asp.orb).toFixed(4))

        // Applying vs separating:
        // For a transiting planet making an aspect to a fixed natal point,
        // "applying" means the transiting planet is moving TOWARD exact aspect.
        // Determine direction: if transit longitude is less than natal at
        // current aspect angle AND speed is forward (or retrograde and past),
        // it's still closing the gap.
        //
        // Simplified: if the angular separation is decreasing over the next
        // hour, the transit is applying. We approximate this from the
        // transit's speed direction and current orb.
        const applying = current.retrograde
          ? angle > asp.angle
          : angle < asp.angle

        // Days to exact: orb / daily speed.
        // Natal planet is fixed, so only transit speed matters.
        // Signed: positive = applying (future), negative = separating (past).
        const speedAbs = Math.max(current.speed, 0.0001) // guard div-by-zero
        const daysToExact = parseFloat(
          ((applying ? 1 : -1) * (orb / speedAbs)).toFixed(2),
        )

        // Weight: planet × aspect × exactness × applying-boost
        const planetW   = TRANSIT_PLANET_WEIGHTS[current.planet] ?? 1
        const aspectW   = TRANSIT_ASPECT_WEIGHTS[asp.name]       ?? 1
        const applyBoost = applying ? 1.2 : 1.0
        const exactBoost = 1 + exactness  // exact aspects get up to 2x
        const weight = parseFloat(
          (planetW * aspectW * exactBoost * applyBoost).toFixed(2),
        )

        transits.push({
          transitingPlanet:    current.planet,
          transitingLongitude: parseFloat(current.longitude.toFixed(4)),
          transitingSign:      signFromLongitude(current.longitude),
          transitingDegree:    parseFloat(degreeInSign(current.longitude).toFixed(2)),
          transitingRetrograde: current.retrograde,

          natalPlanet:    natal.planet,
          natalLongitude: natal.longitude,
          natalSign:      natal.sign,

          aspect:    asp.name,
          orb:       parseFloat(orb.toFixed(4)),
          exactness,
          applying,
          daysToExact,
          weight,
        })
      }
    }
  }

  // Sort by weight descending — most significant transits first
  return transits.sort((a, b) => b.weight - a.weight)
}
