/**
 * ASTRYX — Placement-driven Chamber timing  (Directive v2.0 · FIX I)
 * ════════════════════════════════════════════════════════════════════════════
 * The session breathes with the body work: a fork's segment length = the SUM of
 * its stations' hold times (FIX H). More stations → longer segment. But it must
 * fit the chosen container (15 / 30 / 60), which is a HARD cap.
 *
 * Container-fit (DEFAULT = priorityCap):
 *   • priorityCap        — keep the highest-weighted forks/stations at FULL hold
 *                          until the container fills; DROP the lowest-weighted
 *                          overflow. Depth over breadth (no degraded holds).
 *   • proportionalCompress — scale every hold down to fit (SHA override).
 *
 * Pure + deterministic. No imports — unit-testable in isolation.
 */

export type ContainerFitMode = 'priorityCap' | 'proportionalCompress'

/** Base seconds for a single station (holdWeight 1). Symptom stations weigh more. */
export const BASE_STATION_SEC = 90
const MIN_HOLD_SEC = 12

/** One sequenced fork + the per-station hold weights from resolveForkStations(). */
export interface PlannedFork {
  planet: string
  weight: number          // the opposition/sequence weight (higher = matters more)
  stationWeights: number[] // holdWeight per station, in order (home, [natal], [symptom])
}

export interface TimedStation {
  planet: string
  stationIndex: number
  startSec: number
  holdSec: number
}

export interface SessionPlan {
  timeline: TimedStation[]
  totalSec: number
  droppedCount: number      // stations dropped by priorityCap
  mode: ContainerFitMode
  naturalSec: number        // uncapped total (sum of all station holds)
}

export function planSession(
  forks: PlannedFork[],
  containerSec: number,
  mode: ContainerFitMode = 'priorityCap',
): SessionPlan {
  type S = { planet: string; idx: number; hold: number; forkWeight: number; order: number }
  const all: S[] = []
  let order = 0
  for (const f of forks) {
    f.stationWeights.forEach((w, i) => {
      all.push({ planet: f.planet, idx: i, hold: Math.max(MIN_HOLD_SEC, Math.round(BASE_STATION_SEC * w)), forkWeight: f.weight, order: order++ })
    })
  }
  const naturalSec = all.reduce((s, x) => s + x.hold, 0)

  const emit = (items: S[]): TimedStation[] => {
    let cursor = 0
    return items.map((x) => { const t = { planet: x.planet, stationIndex: x.idx, startSec: cursor, holdSec: x.hold }; cursor += x.hold; return t })
  }

  // Fits as-is — full holds, sequence order.
  if (naturalSec <= containerSec) {
    return { timeline: emit(all), totalSec: naturalSec, droppedCount: 0, mode, naturalSec }
  }

  if (mode === 'proportionalCompress') {
    const scale = containerSec / naturalSec
    let cursor = 0
    const timeline = all.map((x) => {
      const hold = Math.max(MIN_HOLD_SEC, Math.round(x.hold * scale))
      const t = { planet: x.planet, stationIndex: x.idx, startSec: cursor, holdSec: hold }
      cursor += hold
      return t
    })
    return { timeline, totalSec: cursor, droppedCount: 0, mode, naturalSec }
  }

  // priorityCap (default): rank by fork weight (then heavier station, then order),
  // keep at FULL hold until the container fills; drop the lowest-weighted overflow.
  const ranked = [...all].sort((a, b) => (b.forkWeight - a.forkWeight) || (b.hold - a.hold) || (a.order - b.order))
  const keep = new Set<number>()
  let used = 0
  for (const x of ranked) {
    if (used + x.hold <= containerSec) { keep.add(x.order); used += x.hold }
  }
  const kept = all.filter((x) => keep.has(x.order))   // re-emit in original sequence order
  return { timeline: emit(kept), totalSec: used, droppedCount: all.length - kept.length, mode, naturalSec }
}
