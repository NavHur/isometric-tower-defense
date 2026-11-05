import type { HexPosition } from '../types/towerDefense'

/** The cells after `start`, up to and including `end`, one axial step apart. */
function segmentCells(start: HexPosition, end: HexPosition): HexPosition[] {
  const qDelta = end.q - start.q
  const rDelta = end.r - start.r
  const steps = Math.max(
    Math.abs(qDelta),
    Math.abs(rDelta),
    Math.abs(qDelta + rDelta),
  )
  if (steps === 0) return []
  if (qDelta !== 0 && rDelta !== 0 && qDelta + rDelta !== 0) {
    throw new Error('Path segments must follow a straight axial direction')
  }

  const qStep = qDelta / steps
  const rStep = rDelta / steps
  return Array.from({ length: steps }, (_, index) => ({
    q: start.q + qStep * (index + 1),
    r: start.r + rStep * (index + 1),
  }))
}

export function expandPath(
  waypoints: readonly HexPosition[],
): readonly HexPosition[] {
  if (waypoints.length === 0) return []

  const cells: HexPosition[] = [{ ...waypoints[0] }]
  for (let index = 1; index < waypoints.length; index += 1) {
    cells.push(...segmentCells(waypoints[index - 1], waypoints[index]))
  }
  return cells
}
