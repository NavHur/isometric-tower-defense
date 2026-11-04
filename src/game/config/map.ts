import type { HexPosition } from '../types/towerDefense'
import { expandPath } from '../utils/expandPath'
import {
  HEX_DIRECTIONS,
  hexDistance,
  hexKey,
  hexToWorld,
} from '../utils/hexCoordinates'

export const PATH_WAYPOINTS: readonly HexPosition[] = [
  { q: -9, r: 2 },
  { q: -6, r: 2 },
  { q: -6, r: 5 },
  { q: -2, r: 5 },
  { q: 1, r: 2 },
  { q: 3, r: 2 },
  { q: 5, r: 0 },
  { q: 5, r: -2 },
  { q: 7, r: -4 },
  { q: 7, r: -6 },
  { q: 9, r: -8 },
]

export const PATH_CELLS = expandPath(PATH_WAYPOINTS)
export const PATH_LENGTH = PATH_CELLS.length - 1

const ISLAND_LOBES = [
  { center: { q: -5, r: 2 }, radius: 4 },
  { center: { q: -1, r: 3 }, radius: 3 },
  { center: { q: 1, r: 1 }, radius: 3 },
  { center: { q: 5, r: -2 }, radius: 4 },
  { center: { q: 7, r: -6 }, radius: 2 },
] as const

export const MAP_POSITIONS: readonly HexPosition[] = Array.from(
  { length: 21 * 21 },
  (_, index) => ({ q: (index % 21) - 10, r: Math.floor(index / 21) - 10 }),
).filter((position) =>
  ISLAND_LOBES.some(
    ({ center, radius }) => hexDistance(position, center) <= radius,
  ),
)

export const DECORATION_CELLS: readonly HexPosition[] = [
  { q: -8, r: 4 },
  { q: -7, r: 0 },
  { q: -7, r: 5 },
  { q: -6, r: 1 },
  { q: -5, r: -1 },
  { q: -4, r: 3 },
  { q: -4, r: 6 },
  { q: -3, r: 1 },
  { q: -3, r: 4 },
  { q: -2, r: 0 },
  { q: 0, r: 4 },
  { q: 0, r: -1 },
  { q: 1, r: 3 },
  { q: 3, r: 1 },
  { q: 3, r: -2 },
  { q: 4, r: 0 },
  { q: 4, r: -4 },
  { q: 5, r: 2 },
  { q: 6, r: -1 },
  { q: 6, r: -6 },
  { q: 7, r: -3 },
  { q: 7, r: -7 },
  { q: 8, r: -5 },
  { q: 9, r: -7 },
]

const mapKeys = new Set(MAP_POSITIONS.map((position) => hexKey(position)))
const waterByKey = new Map<string, HexPosition>()
for (const position of MAP_POSITIONS) {
  for (const direction of HEX_DIRECTIONS) {
    const neighbor = {
      q: position.q + direction.q,
      r: position.r + direction.r,
    }
    if (!mapKeys.has(hexKey(neighbor)))
      waterByKey.set(hexKey(neighbor), neighbor)
  }
}
export const WATER_POSITIONS = [...waterByKey.values()]

const worldPositions = MAP_POSITIONS.map((position) => hexToWorld(position))
const minX = Math.min(...worldPositions.map(([x]) => x))
const maxX = Math.max(...worldPositions.map(([x]) => x))
const minZ = Math.min(...worldPositions.map((position) => position[2]))
const maxZ = Math.max(...worldPositions.map((position) => position[2]))

export const BOARD_CENTER_OFFSET: readonly [number, number, number] = [
  -(minX + maxX) / 2,
  0,
  -(minZ + maxZ) / 2,
]
