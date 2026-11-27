import type { HexPosition } from '../types/towerDefense'
import { HEX_DIRECTIONS } from './hexCoordinates'

const [east, northeast, northwest, west, southwest, southeast] = HEX_DIRECTIONS
const directions = { east, northeast, northwest, west, southwest, southeast }
type PathLeg = readonly [direction: keyof typeof directions, cells: number]

/** Walk each leg one axial neighbor at a time, emitting its endpoint once. */
export function expandPath(
  start: HexPosition,
  legs: readonly PathLeg[],
): readonly HexPosition[] {
  let position = start
  const cells = [position]
  for (const [direction, length] of legs) {
    const step = directions[direction]
    for (let index = 0; index < length; index += 1) {
      position = { q: position.q + step.q, r: position.r + step.r }
      cells.push(position)
    }
  }
  return cells
}
