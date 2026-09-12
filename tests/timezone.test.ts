/**
 * Timezone resolution — the silent-UTC fence (Worker port, Phase 1.2).
 *
 * The failure this guards against is not loud. `timezone.ts` used to load
 * tz-lookup through `await import()` + `mod.default || mod`; when that interop
 * resolved to the module namespace instead of the function, the call threw, the
 * throw was swallowed, and EVERY chart came back with UTC offset 0. A one-hour
 * offset error moves the Ascendant ~15°, which can flip whole-sign houses and
 * hand the same person a different protocol — with nothing in any log.
 *
 * So: the lookup must resolve real zones, the offset must be read at an explicit
 * instant (historical DST included), and the date argument must be required.
 */

import { describe, it, expect } from 'vitest'
import {
  assertTzLookupHealthy,
  getTimezoneFromCoords,
  birthTimeToUTC,
} from '@/lib/timezone'

describe('tz-lookup health', () => {
  it('resolves a known coordinate to a real IANA zone — never UTC', () => {
    expect(() => assertTzLookupHealthy()).not.toThrow()
    const tz = getTimezoneFromCoords(40.7128, -74.006, new Date('2026-01-15T12:00:00Z'))
    expect(tz.iana).toBe('America/New_York')
    expect(tz.offsetHours).not.toBe(0)
  })

  it('is idempotent (memoized) and stays healthy across calls', () => {
    assertTzLookupHealthy()
    expect(() => assertTzLookupHealthy()).not.toThrow()
  })
})

describe('offset is resolved at the given instant, not "now"', () => {
  it('honours DST on either side of the same year', () => {
    const winter = getTimezoneFromCoords(40.7128, -74.006, new Date('2026-01-15T12:00:00Z'))
    const summer = getTimezoneFromCoords(40.7128, -74.006, new Date('2026-07-15T12:00:00Z'))
    expect(winter.offsetHours).toBe(-5)
    expect(summer.offsetHours).toBe(-4)
  })

  it('honours a historical zone change (Lisbon 1990 was UTC+0 standard time)', () => {
    const then = getTimezoneFromCoords(38.7223, -9.1393, new Date('1990-01-15T12:00:00Z'))
    expect(then.iana).toBe('Europe/Lisbon')
    expect(then.offsetHours).toBe(0)
  })

  it('handles a half-hour zone', () => {
    const tz = getTimezoneFromCoords(19.076, 72.8777, new Date('2026-03-01T12:00:00Z'))
    expect(tz.iana).toBe('Asia/Kolkata')
    expect(tz.offsetHours).toBe(5.5)
  })

  it('is deterministic — same coordinate + same instant → same result', () => {
    const at = new Date('2026-03-01T12:00:00Z')
    const a = getTimezoneFromCoords(-33.8688, 151.2093, at)
    const b = getTimezoneFromCoords(-33.8688, 151.2093, at)
    expect(JSON.stringify(b)).toBe(JSON.stringify(a))
  })
})

describe('birthTimeToUTC', () => {
  it('converts a local birth time using the offset in effect at the birth date', () => {
    // 1990-03-15 14:30 in Atlanta = EST (UTC-5) → 19:30 UTC.
    const { utcDate, utcTime, tzInfo } = birthTimeToUTC('1990-03-15', '14:30', 33.749, -84.388)
    expect(tzInfo.iana).toBe('America/New_York')
    expect(tzInfo.offsetHours).toBe(-5)
    expect(utcDate).toBe('1990-03-15')
    expect(utcTime).toBe('19:30')
  })
})
