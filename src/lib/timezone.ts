/**
 * Timezone detection from geographic coordinates.
 *
 * Uses tz-lookup (a fast, offline IANA timezone lookup by lat/lng).
 * No API calls — pure lookup table, works on Vercel and VPS alike.
 *
 * Returns:
 * - IANA timezone string (e.g. "America/New_York")
 * - UTC offset in hours at current date (respects DST)
 * - Human-readable label ("EST (UTC-5)")
 */

// ─── IANA TIMEZONE LOOKUP ─────────────────────────────────────

let tzLookup: ((lat: number, lon: number) => string) | null = null

async function getTzLookup() {
  if (tzLookup) return tzLookup
  try {
    const mod = await import('tz-lookup')
    tzLookup = mod.default || mod
    return tzLookup
  } catch {
    return null
  }
}

// ─── MAIN EXPORT ──────────────────────────────────────────────

export interface TimezoneInfo {
  iana: string          // e.g. "America/New_York"
  offsetHours: number   // e.g. -4 (during EDT) or -5 (during EST)
  label: string         // e.g. "EDT (UTC-4)"
  abbreviation: string  // e.g. "EDT"
}

export async function getTimezoneFromCoords(lat: number, lon: number, atDate?: Date): Promise<TimezoneInfo> {
  try {
    const lookup = await getTzLookup()
    const iana = lookup ? lookup(lat, lon) : 'UTC'

    // Resolve the UTC offset AT THE GIVEN INSTANT (the birth date when supplied),
    // not "now". Intl/ICU carries historical DST rules, so passing the birth date
    // yields the offset that was actually in effect then. This fixes charts for
    // anyone born across a DST edge or in a region that changed zones (e.g. a
    // 1990 Lisbon birth was UTC+0 standard time, not today's UTC+1 summer time).
    const refDate = atDate ?? new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      timeZoneName: 'short',
    })
    const parts = formatter.formatToParts(refDate)
    const tzNamePart = parts.find((p) => p.type === 'timeZoneName')
    const abbreviation = tzNamePart?.value ?? 'UTC'

    // Calculate offset in hours at the reference instant
    const utcOffset = getUTCOffsetHours(iana, refDate)

    const sign = utcOffset >= 0 ? '+' : '-'
    const label = `${abbreviation} (UTC${sign}${Math.abs(utcOffset)})`

    return { iana, offsetHours: utcOffset, label, abbreviation }
  } catch (err) {
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
export async function birthTimeToUTC(
  birthDate: string,   // YYYY-MM-DD
  birthTime: string,   // HH:MM
  lat: number,
  lon: number
): Promise<{ utcDate: string; utcTime: string; tzInfo: TimezoneInfo }> {
  const [year, month, day] = birthDate.split('-').map(Number)
  const [hour, minute]     = birthTime.split(':').map(Number)

  // Resolve the offset AT THE BIRTH DATE, not today. Use local noon of the birth
  // day as the reference instant so the rare DST fold/gap around midnight can't
  // skew it; the offset is otherwise constant across the day.
  const refDate = new Date(Date.UTC(year, month - 1, day, 12, 0))
  const tzInfo  = await getTimezoneFromCoords(lat, lon, refDate)

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
