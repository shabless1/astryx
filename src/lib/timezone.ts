/**
 * Timezone detection from geographic coordinates.
 *
 * Uses tz-lookup (a fast, offline IANA timezone lookup by lat/lng).
 * No API calls — pure lookup table, works on Vercel, a VPS, and a Worker alike.
 *
 * Returns:
 * - IANA timezone string (e.g. "America/New_York")
 * - UTC offset in hours AT AN EXPLICIT INSTANT (respects historical DST)
 * - Human-readable label ("EST (UTC-5)")
 *
 * WORKER-PORT CONTRACT (Phase 1.2):
 * - `atDate` is REQUIRED. No hidden clock lives in this module; the caller — an
 *   HTTP handler — decides what "now" means and passes it in.
 * - tz-lookup is imported STATICALLY. The old `await import()` + `mod.default ||
 *   mod` interop could silently resolve to the module namespace object instead
 *   of the function; the call then threw, was swallowed, and EVERY chart came
 *   back with UTC offset 0 — a wrong Ascendant with no error anywhere. A
 *   one-time health assertion on a known coordinate makes that failure loud.
 */

import tzLookup from 'tz-lookup'

// ─── TZ-LOOKUP HEALTH ASSERTION ───────────────────────────────
// A wrong-but-silent UTC is the worst outcome here: a one-hour offset error
// moves the Ascendant ~15°, which can flip whole-sign houses and change the
// dominant pattern — a different protocol for the same person. So verify once,
// at first use, against a coordinate whose zone is stable in every tz database:
// Manhattan is America/New_York and has never been UTC.

const TZ_LOOKUP_BROKEN =
  'tz-lookup is not resolving IANA zones — refusing to fall back to UTC, which would silently produce a wrong Ascendant'

const HEALTH_PROBE = { lat: 40.7128, lon: -74.006, expected: 'America/New_York' }
let tzLookupHealthy: boolean | null = null

export function assertTzLookupHealthy(): void {
  if (tzLookupHealthy === true) return
  if (tzLookupHealthy === false) throw new Error(TZ_LOOKUP_BROKEN)

  let zone: unknown
  try {
    zone = (tzLookup as unknown as (lat: number, lon: number) => string)(
      HEALTH_PROBE.lat,
      HEALTH_PROBE.lon,
    )
  } catch (err) {
    tzLookupHealthy = false
    throw new Error(
      `${TZ_LOOKUP_BROKEN} (threw: ${err instanceof Error ? err.message : String(err)})`,
    )
  }

  if (typeof zone !== 'string' || zone !== HEALTH_PROBE.expected) {
    tzLookupHealthy = false
    throw new Error(`${TZ_LOOKUP_BROKEN} (got: ${String(zone)})`)
  }
  tzLookupHealthy = true
}

// ─── MAIN EXPORT ──────────────────────────────────────────────

export interface TimezoneInfo {
  iana: string          // e.g. "America/New_York"
  offsetHours: number   // e.g. -4 (during EDT) or -5 (during EST)
  label: string         // e.g. "EDT (UTC-4)"
  abbreviation: string  // e.g. "EDT"
}

/**
 * Resolve the IANA zone and its UTC offset at `atDate`.
 *
 * `atDate` is required by design (see the Worker-port contract above): the
 * offset in effect at a 1990 birth is not the offset in effect today.
 */
export function getTimezoneFromCoords(lat: number, lon: number, atDate: Date): TimezoneInfo {
  // Outside the try — a broken dependency must NOT degrade into a UTC chart.
  assertTzLookupHealthy()

  try {
    const iana = tzLookup(lat, lon)

    // Resolve the UTC offset AT THE GIVEN INSTANT. Intl/ICU carries historical
    // DST rules, so passing the birth date yields the offset that was actually
    // in effect then. This fixes charts for anyone born across a DST edge or in
    // a region that changed zones (e.g. a 1990 Lisbon birth was UTC+0 standard
    // time, not today's UTC+1 summer time).
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      timeZoneName: 'short',
    })
    const parts = formatter.formatToParts(atDate)
    const tzNamePart = parts.find((p) => p.type === 'timeZoneName')
    const abbreviation = tzNamePart?.value ?? 'UTC'

    // Calculate offset in hours at the reference instant
    const utcOffset = getUTCOffsetHours(iana, atDate)

    const sign = utcOffset >= 0 ? '+' : '-'
    const label = `${abbreviation} (UTC${sign}${Math.abs(utcOffset)})`

    return { iana, offsetHours: utcOffset, label, abbreviation }
  } catch (err) {
    // Reached only for a genuinely unresolvable coordinate — not for a broken
    // dependency, which throws above. Callers keep their own fallback.
    console.warn('[timezone] Lookup failed, defaulting to UTC:', err)
    return { iana: 'UTC', offsetHours: 0, label: 'UTC', abbreviation: 'UTC' }
  }
}

// ─── UTC OFFSET CALCULATION ───────────────────────────────────

function getUTCOffsetHours(iana: string, date: Date): number {
  try {
    // Use Intl.DateTimeFormat offset trick
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: iana }))
    const diffMs = localDate.getTime() - utcDate.getTime()
    return diffMs / (1000 * 60 * 60)
  } catch {
    return 0
  }
}

// ─── BIRTH DATETIME → UTC ──────────────────────────────────────

/**
 * Convert a local birth datetime to UTC, given coordinates.
 * This is what the chart engine needs for precise planet positions.
 */
export function birthTimeToUTC(
  birthDate: string,   // YYYY-MM-DD
  birthTime: string,   // HH:MM
  lat: number,
  lon: number
): { utcDate: string; utcTime: string; tzInfo: TimezoneInfo } {
  const [year, month, day] = birthDate.split('-').map(Number)
  const [hour, minute]     = birthTime.split(':').map(Number)

  // Resolve the offset AT THE BIRTH DATE, not today. Use local noon of the birth
  // day as the reference instant so the rare DST fold/gap around midnight can't
  // skew it; the offset is otherwise constant across the day.
  const refDate = new Date(Date.UTC(year, month - 1, day, 12, 0))
  const tzInfo  = getTimezoneFromCoords(lat, lon, refDate)

  // Local time → UTC
  const localMs   = Date.UTC(year, month - 1, day, hour, minute)
  const utcMs     = localMs - tzInfo.offsetHours * 60 * 60 * 1000
  const utcDt     = new Date(utcMs)

  const utcDateStr = utcDt.toISOString().slice(0, 10)
  const utcTimeStr = `${String(utcDt.getUTCHours()).padStart(2, '0')}:${String(utcDt.getUTCMinutes()).padStart(2, '0')}`

  return { utcDate: utcDateStr, utcTime: utcTimeStr, tzInfo }
}

// ─── COMMON TIMEZONE LIST (for manual fallback UI) ────────────

export const COMMON_TIMEZONES = [
  { label: 'UTC',                  value: 'UTC',                   offset: 0    },
  { label: 'EST (New York)',        value: 'America/New_York',      offset: -5   },
  { label: 'CST (Chicago)',         value: 'America/Chicago',       offset: -6   },
  { label: 'MST (Denver)',          value: 'America/Denver',        offset: -7   },
  { label: 'PST (Los Angeles)',     value: 'America/Los_Angeles',   offset: -8   },
  { label: 'GMT (London)',          value: 'Europe/London',         offset: 0    },
  { label: 'CET (Paris/Berlin)',    value: 'Europe/Paris',          offset: 1    },
  { label: 'EET (Athens)',          value: 'Europe/Athens',         offset: 2    },
  { label: 'IST (India)',           value: 'Asia/Kolkata',          offset: 5.5  },
  { label: 'CST (Shanghai)',        value: 'Asia/Shanghai',         offset: 8    },
  { label: 'JST (Tokyo)',           value: 'Asia/Tokyo',            offset: 9    },
  { label: 'AEST (Sydney)',         value: 'Australia/Sydney',      offset: 10   },
  { label: 'BRT (São Paulo)',       value: 'America/Sao_Paulo',     offset: -3   },
]
