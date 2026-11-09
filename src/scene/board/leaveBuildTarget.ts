import { positionsMatch } from '../../game/rules/canPlaceTower'
import { useGameStore } from '../../game/state/useGameStore'
import type { HexPosition } from '../../game/types/towerDefense'

/** Resets the cursor and clears the hover only if it is still on `position`. */
export function leaveBuildTarget(position: HexPosition) {
  document.body.style.cursor = 'default'
  const { hoveredTile, setHoveredTile } = useGameStore.getState()
  if (hoveredTile && positionsMatch(hoveredTile, position)) setHoveredTile(null)
}
