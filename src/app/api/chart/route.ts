/**
 * POST /api/chart
 *
 * Calculates a complete natal chart from birth data.
 * Returns planet positions, house cusps, angles, and detected aspects.
 *
 * Request body:
 * {
 *   birthDate: "1990-05-15",       // YYYY-MM-DD
 *   birthTime: "14:30",            // HH:MM (local time at birth location)
 *   latitude: 40.7128,             // decimal degrees, N positive
 *   longitude: -74.0060,           // decimal degrees, E positive
 *   tzOffset: -4,                  // hours offset from UTC (optional, default 0)
 *   symptoms?: string[],           // for symptom-boosted confidence scoring
 * }
 *
 * Response:
 * {
 *   success: true,
 *   chart: NatalChart,
 *   dominantPattern: DominantPatternData,
 *   meta: { calculatedAt, birthData }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  calculateNatalChart,
  extractDominantPattern,
  calculateTransits,
  signFromLongitude,
  type BirthData,
} from '@/lib/ephemeris'
import symptomsData from '@/data/symptoms.json'
import { getTimezoneFromCoords } from '@/lib/timezone'

// ─── SOLAR CHART BUILDER ─────────────────────────────────────
// When birth time is unknown: place Sun on Ascendant,
// houses = sign boundaries. Standard professional technique.

function buildSolarChart(birthData: BirthData) {
  // Use noon to get accurate Sun position
  const noonData = { ...birthData, hour: 12, minute: 0, latitude: 0, longitude: 0 }
  const noonChart = calculateNatalChart(noonData, 0)
  const sun = noonChart.planets.find(p => p.planet === 'Sun')!

  // Ascendant = start of Sun's sign
  const ascendant = Math.floor(sun.longitude / 30) * 30
  const midheaven = (ascendant + 270) % 360
  const houseCusps = Array.from({ length: 12 }, (_, i) => (ascendant + i * 30) % 360)

  // Re-assign all planets to Solar houses
  const planets = noonChart.planets.map(planet => {
    const houseIdx = Math.floor(((planet.longitude - ascendant + 360) % 360) / 30)
    return { ...planet, house: houseIdx + 1 }
  })

  return {
    ...noonChart,
    planets,
    angles: {
      ascendant,
      midheaven,
      descendant: (ascendant + 180) % 360,
      ic: (midheaven + 180) % 360,
      ascSign: signFromLongitude(ascendant),
      mcSign:  signFromLongitude(midheaven),
    },
    houses: houseCusps,
    isSolarChart: true,
  }
}

// ─── SYMPTOM BOOST ────────────────────────────────────────────

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
      // Prefer an EXACT slug match before any substring match, so "tension"
      // resolves to the "tension" slug (Mars/Saturn) — not "pelvic_tension"
      // (Mars/Pluto), which a loose substring match would grab first.
      const match =
        symptomLib.find((s) => s.symptom === token) ??
        symptomLib.find(
          (s) => s.symptom.includes(token) || token.includes(s.symptom),
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

// ─── VALIDATION ───────────────────────────────────────────────

function validateRequest(body: any): string | null {
  if (!body.birthDate) return 'birthDate is required (YYYY-MM-DD)'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.birthDate)) return 'birthDate must be YYYY-MM-DD'

  if (body.latitude === undefined || body.latitude === null)
    return 'latitude is required'
  if (body.longitude === undefined || body.longitude === null)
    return 'longitude is required'
  if (body.latitude < -90 || body.latitude > 90)
    return 'latitude must be between -90 and 90'
  if (body.longitude < -180 || body.longitude > 180)
    return 'longitude must be between -180 and 180'

  return null
}

// ─── HANDLER ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate
    const error = validateRequest(body)
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    // Parse birth date
    const [year, month, day] = body.birthDate.split('-').map(Number)

    // Parse birth time (default to noon if not provided)
    let hour = 12
    let minute = 0
    if (body.birthTime) {
      const parts = body.birthTime.split(':').map(Number)
      hour = parts[0] || 12
      minute = parts[1] || 0
    }

    const birthData: BirthData = {
      year, month, day,
      hour, minute,
      latitude: parseFloat(body.latitude),
      longitude: parseFloat(body.longitude),
    }

    const isSolarChart = body.solarChart === true

    // ── Timezone offset resolved AT THE BIRTH DATE (not the request date) ──
    // The client captures an offset when the city is picked, but that uses the
    // CURRENT date's DST. Re-resolve here from the birth instant so historical
    // DST and zone changes are honored (e.g. a 1990 Lisbon birth is UTC+0
    // standard time, not today's UTC+1 summer time). The Ascendant + all houses
    // depend on this, so it must be correct. Falls back to the client value only
    // if the coordinate→zone lookup fails.
    let tzOffset = parseFloat(body.tzOffset || '0')
    if (!isSolarChart && !Number.isNaN(birthData.latitude) && !Number.isNaN(birthData.longitude)) {
      try {
        const refDate = new Date(Date.UTC(year, month - 1, day, 12, 0))
        const tzInfo  = await getTimezoneFromCoords(birthData.latitude, birthData.longitude, refDate)
        if (tzInfo.iana !== 'UTC') tzOffset = tzInfo.offsetHours
      } catch {
        // keep client-provided offset on any resolver error
      }
    }

    // Calculate chart — natal or solar
    const chart = isSolarChart
      ? buildSolarChart(birthData)
      : calculateNatalChart(birthData, tzOffset)

    // Calculate symptom boost + which planets the symptoms implicate
    const { boost: symptomBoost, symptomPlanets } = calculateSymptomBoost(
      body.symptoms || [],
      chart as any,
    )

    // Extract dominant pattern — symptom-implicated planets boost their aspects
    const dominantPattern = extractDominantPattern(chart as any, symptomBoost, symptomPlanets)

    // ── Transits: current sky aspects to natal chart ──
    // Calculated fresh every request — this is the daily-return data layer.
    // Top 7 by weight = the "what's hitting your chart right now" surface.
    const allTransits = calculateTransits(chart as any, new Date())
    const transits    = allTransits.slice(0, 7)

    return NextResponse.json({
      success: true,
      chart,
      dominantPattern,
      symptomPlanets,
      transits,
      meta: {
        calculatedAt: new Date().toISOString(),
        chartMode: isSolarChart ? 'solar' : 'natal',
        transitDate: new Date().toISOString(),
        birthData: {
          date:      body.birthDate,
          time:      isSolarChart ? 'Solar Chart (Sun on ASC)' : (body.birthTime || '12:00 noon default'),
          latitude:  birthData.latitude,
          longitude: birthData.longitude,
          tzOffset,
        },
      },
    })
  } catch (err) {
    console.error('[/api/chart] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: 'Chart calculation failed',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

// ─── GET — health check ───────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status:      'ok',
    service:     'Astryx Chart Engine',
    engine:      'astronomy-engine (Don Cross)',
    houseSystem: 'Placidus (natal) / Equal Sign Houses (solar)',
    zodiac:      'Tropical',
    chartModes:  ['natal', 'solar'],
    planets:     ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'],
  })
}
