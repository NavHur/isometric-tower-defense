import { Data, Effect } from 'effect'
import { PATH_CELLS } from '../../game/config/map'
import { positionsMatch } from '../../game/rules/canPlaceTower'
import type { HexPosition } from '../../game/types/towerDefense'
import { HEX_DIRECTIONS } from '../../game/utils/hexCoordinates'

export interface PathPresentation {
  kind: 'start' | 'end' | 'straight' | 'corner' | 'cornerSharp'
  rotation: number
}

class InvalidPathTile extends Data.TaggedError('InvalidPathTile')<{
  position: HexPosition
  message: string
}> {}

function directionIndex(from: HexPosition, to: HexPosition) {
  const q = to.q - from.q
  const r = to.r - from.r
  const index = HEX_DIRECTIONS.findIndex(
    (direction) => direction.q === q && direction.r === r,
  )
  return index === -1
    ? Effect.fail(
        new InvalidPathTile({
          position: from,
          message: 'Path cells must be axial neighbors',
        }),
      )
    : Effect.succeed(index)
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
  position: HexPosition,
  baseDirections: readonly number[],
  desiredDirections: readonly number[],
) {
  const steps = Array.from({ length: 6 }, (_, index) => index).find((index) =>
    rotatedSetMatches(baseDirections, desiredDirections, index),
  )
  return steps === undefined
    ? Effect.fail(
        new InvalidPathTile({
          position,
          message: 'Unsupported path connection',
        }),
      )
    : Effect.succeed(steps * (Math.PI / 3))
}

const PATH_CONNECTIONS = {
  start: [3],
  end: [3],
  straight: [0, 3],
  cornerSharp: [2, 3],
  corner: [1, 3],
} as const

function cornerKind(left: number, right: number): PathPresentation['kind'] {
  const separation = Math.min((left - right + 6) % 6, (right - left + 6) % 6)
  if (separation === 3) return 'straight'
  return separation === 1 ? 'cornerSharp' : 'corner'
}

export const getPathPresentation = Effect.fn('getPathPresentation')(
  function* presentTile(position: HexPosition) {
    const index = PATH_CELLS.findIndex((cell) => positionsMatch(cell, position))
    if (index === -1)
      return yield* new InvalidPathTile({
        position,
        message: 'Path presentation requested for a grass tile',
      })
    const connections: number[] = []
    if (index > 0)
      connections.push(yield* directionIndex(position, PATH_CELLS[index - 1]))
    if (index < PATH_CELLS.length - 1)
      connections.push(yield* directionIndex(position, PATH_CELLS[index + 1]))
    let kind: PathPresentation['kind'] = 'end'
    if (index === 0) kind = 'start'
    else if (connections.length === 2)
      kind = cornerKind(connections[0], connections[1])
    const rotation = yield* findRotation(
      position,
      PATH_CONNECTIONS[kind],
      connections,
    )
    return { kind, rotation }
  },
)
