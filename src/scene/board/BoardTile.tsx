import { DECORATION_CELLS, PATH_CELLS } from '../../game/config/map'
import { positionsMatch } from '../../game/rules/canPlaceTower'
import type { HexPosition } from '../../game/types/towerDefense'
import { BuildTile } from './BuildTile'
import { PathTile } from './PathTile'
import { SceneryTile } from './SceneryTile'

interface TileProps {
  position: HexPosition
}

/** The land tile for one map hex: castle, path, scenery, or open grass. */
export function BoardTile({ position }: TileProps) {
  if (PATH_CELLS.some((cell) => positionsMatch(cell, position))) {
    return <PathTile position={position} />
  }
  const sceneryIndex = DECORATION_CELLS.findIndex((cell) =>
    positionsMatch(cell, position),
  )
  if (sceneryIndex !== -1) {
    return <SceneryTile index={sceneryIndex} position={position} />
  }
  return <BuildTile position={position} />
}
