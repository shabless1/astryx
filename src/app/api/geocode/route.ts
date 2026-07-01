/**
 * GET /api/geocode?q=New+York,+USA
 *
 * Converts a city name or address to latitude/longitude.
 * Uses OpenStreetMap Nominatim — completely free, no API key required.
 *
 * We proxy this server-side to:
 * 1. Set proper User-Agent (Nominatim requires it)
 * 2. Cache results to avoid repeated requests
 * 3. Keep client code clean
 *
 * Response:
 * {
 *   success: true,
 *   results: [{ name, lat, lon, country, displayName }],
 * }
 */

import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory cache (resets on server restart, but that's fine)
const cache = new Map<string, any>()

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')

  if (!q || q.trim().length < 2) {
    return NextResponse.json(
      { success: false, error: 'Query parameter q is required (min 2 chars)' },
      { status: 400 }
    )
  }

  const cacheKey = q.toLowerCase().trim()
  if (cache.has(cacheKey)) {
    return NextResponse.json({ success: true, results: cache.get(cacheKey), cached: true })
  }

  try {
    // v4 FIX 3 — dedupe + a slightly wider result set so partial city names
    // ("Chicago") surface ranked suggestions.
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&dedupe=1`

    const res = await fetch(url, {
      headers: {
        // Nominatim requires a proper User-Agent identifying the app
        'User-Agent': 'Astryx-CosmicResonanceSystem/1.0 (contact@astryx.app)',
        'Accept-Language': 'en',
      },
      // 5 second timeout
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      throw new Error(`Nominatim returned ${res.status}`)
    }

    const data = await res.json()

    const results = data.slice(0, 6).map((item: any) => {
      const structured = [
        item.address?.city || item.address?.town || item.address?.village ||
          item.address?.hamlet || item.address?.municipality || item.address?.county,
        item.address?.state,
        item.address?.country,
      ].filter(Boolean).join(', ')
      // v4 FIX 3 — fall back to a trimmed display_name so a bare-city search still
      // surfaces a selectable suggestion instead of being dropped when the
      // structured "city" field is absent.
      const name = structured ||
        (item.display_name ? item.display_name.split(',').slice(0, 3).map((s: string) => s.trim()).join(', ') : '')
      return {
        name,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        country: item.address?.country || '',
        countryCode: item.address?.country_code?.toUpperCase() || '',
      }
    }).filter((r: any) => r.name)

    // Enrich first result with timezone info (server-side tz-lookup)
    try {
      const { getTimezoneFromCoords } = await import('@/lib/timezone')
      for (const result of results) {
        const tz = await getTimezoneFromCoords(result.lat, result.lon)
        ;(result as any).timezone = tz
      }
    } catch (tzErr) {
      console.warn('[geocode] Timezone enrichment failed:', tzErr)
    }

    // Cache for the session
    cache.set(cacheKey, results)

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('[/api/geocode] Error:', err)

    // Return a helpful error but don't crash
    return NextResponse.json(
      {
        success: false,
        error: 'Geocoding lookup failed',
        detail: err instanceof Error ? err.message : String(err),
        hint: 'Try a more specific city name, e.g. "London, UK" or "New York, USA"',
      },
      { status: 500 }
    )
  }
}
