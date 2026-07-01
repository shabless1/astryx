/**
 * Solar Chart Mode
 *
 * When birth time is unknown, use the Solar Chart technique:
 * - Place the Sun exactly on the Ascendant (0° of Sun's sign)
 * - House cusps = sign cusps (each house starts at the sign boundary)
 * - This is standard professional practice for unknown birth times
 *
 * Add this to ephemeris.ts exports
 */

import { calculateNatalChart, signFromLongitude, type BirthData, type NatalChart } from '@/lib/ephemeris'

export type ChartMode = 'natal' | 'solar'

/**
 * Build a Solar Chart from a known birth date (no time required).
 * Sun is placed at the Ascendant, houses align with sign boundaries.
 */
export function buildSolarChart(birthData: Omit<BirthData, 'hour' | 'minute'>): NatalChart {
  // Use noon birth time to calculate Sun position accurately
  const noonData: BirthData = {
    ...birthData,
    hour: 12,
    minute: 0,
    // Use Greenwich for Solar Chart — location doesn't affect sign-based houses
    latitude: 0,
    longitude: 0,
  }

  const noonChart = calculateNatalChart(noonData, 0)
  const sun = noonChart.planets.find(p => p.planet === 'Sun')!

  // Ascendant = Sun's position (start of Sun's sign, 0° within sign)
  const sunSignStart = Math.floor(sun.longitude / 30) * 30
  const ascendant = sunSignStart
  const midheaven = (ascendant + 270) % 360  // MC is 3 signs before ASC in solar chart

  // House cusps = sign boundaries starting from Sun's sign
  const houseCusps = Array.from({ length: 12 }, (_, i) =>
    (ascendant + i * 30) % 360
  )

  // Re-assign all planets to Solar Chart houses
  const planets = noonChart.planets.map(planet => {
    const houseIdx = Math.floor(((planet.longitude - ascendant + 360) % 360) / 30)
    return {
      ...planet,
      house: houseIdx + 1,
    }
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
      mcSign: signFromLongitude(midheaven),
    },
    houses: houseCusps,
    isSolarChart: true,
  } as NatalChart & { isSolarChart: boolean }
}
