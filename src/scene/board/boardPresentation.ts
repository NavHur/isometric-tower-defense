import { PATH_CELLS } from '../../game/config/map'
import { positionsMatch } from '../../game/rules/canPlaceTower'
import type { HexPosition } from '../../game/types/towerDefense'
import { HEX_DIRECTIONS } from '../../game/utils/hexCoordinates'

export interface PathPresentation {
  kind: 'start' | 'end' | 'straight' | 'corner' | 'cornerSharp'
  rotation: number
}

function directionIndex(from: HexPosition, to: HexPosition) {
  const q = to.q - from.q
  const r = to.r - from.r
  const index = HEX_DIRECTIONS.findIndex(
    (direction) => direction.q === q && direction.r === r,
  )
  if (index === -1) throw new Error('Path cells must be axial neighbors')
  return index
}

function rotatedSetMatches(
  baseDirections: readonly number[],
  desiredDirections: readonly number[],
  rotationSteps: number,
) {
  const rotated = new Set(
    baseDirections.map((direction) => (direction + rotationSteps) % 6),
  )
  return desiredDirections.every((direction) => rotated.has(direction))
}

function findRotation(
  baseDirections: readonly number[],
  desiredDirections: readonly number[],
) {
  const steps = Array.from({ length: 6 }, (_, index) => index).find((index) =>
    rotatedSetMatches(baseDirections, desiredDirections, index),
  )
  if (steps === undefined) throw new Error('Unsupported path connection')
  return steps * (Math.PI / 3)
}

export function getPathPresentation(position: HexPosition): PathPresentation {
  const index = PATH_CELLS.findIndex((cell) => positionsMatch(cell, position))
  if (index === -1)
    throw new Error('Path presentation requested for a grass tile')

  if (index === 0) {
    const connection = directionIndex(position, PATH_CELLS[1])
    return { kind: 'start', rotation: findRotation([3], [connection]) }
  }
  if (index === PATH_CELLS.length - 1) {
    const connection = directionIndex(position, PATH_CELLS[index - 1])
    return { kind: 'end', rotation: findRotation([3], [connection]) }
  }

  const connections = [
    directionIndex(position, PATH_CELLS[index - 1]),
    directionIndex(position, PATH_CELLS[index + 1]),
  ]
  const separation = Math.min(
    (connections[0] - connections[1] + 6) % 6,
    (connections[1] - connections[0] + 6) % 6,
  )

  if (separation === 3) {
    return {
      kind: 'straight',
      rotation: findRotation([0, 3], connections),
    }
  }
  if (separation === 1) {
    return {
      kind: 'cornerSharp',
      rotation: findRotation([2, 3], connections),
    }
  }
  return {
    kind: 'corner',
    rotation: findRotation([1, 3], connections),
  }
}
