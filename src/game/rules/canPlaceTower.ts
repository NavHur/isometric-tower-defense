import { DECORATION_CELLS, PATH_CELLS } from '../config/map'
import { TOWER_STATS } from '../config/balance'
import { hexKey } from '../utils/hexCoordinates'
import type {
  HexPosition,
  PlacementFailure,
  SimulationState,
  TowerKind,
} from '../types/towerDefense'

const UNBUILDABLE_CELL_KEYS = new Set(
  [...PATH_CELLS, ...DECORATION_CELLS].map((cell) => hexKey(cell)),
)

export function positionsMatch(left: HexPosition, right: HexPosition) {
  return left.q === right.q && left.r === right.r
}

export function getPlacementFailure(
  state: SimulationState,
  kind: TowerKind,
  position: HexPosition,
): PlacementFailure | null {
  if (state.phase === 'victory' || state.phase === 'defeat') return 'game-ended'
  if (UNBUILDABLE_CELL_KEYS.has(hexKey(position))) {
    return 'not-buildable'
  }
  if (state.towers.some((tower) => positionsMatch(tower.position, position))) {
    return 'occupied'
  }
  if (state.currency < TOWER_STATS[kind].cost) return 'insufficient-funds'
  return null
}

/** Whether the tower selected for building could go on `position` now. */
export function canPlaceSelectedAt(
  state: SimulationState,
  position: HexPosition,
): boolean {
  return (
    state.selectedBuild !== null &&
    getPlacementFailure(state, state.selectedBuild, position) === null
  )
}
