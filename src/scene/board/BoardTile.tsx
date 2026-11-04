import { DECORATION_CELLS, PATH_CELLS } from '../../game/config/map'
import { positionsMatch } from '../../game/rules/canPlaceTower'
import type { HexPosition } from '../../game/types/towerDefense'
import { hexToWorld } from '../../game/utils/hexCoordinates'
import { KenneyModel } from '../assets/KenneyModel'
import { MODEL_PATHS } from '../assets/modelPaths'
import { BuildTile } from './BuildTile'
import { PathTile } from './PathTile'
import { SceneryTile } from './SceneryTile'
import { getPathPresentation } from './boardPresentation'

const PATH_END = PATH_CELLS.at(-1)

interface TileProps {
  position: HexPosition
}

function CastleTile({ position }: TileProps) {
  const [x, , z] = hexToWorld(position)
  const { rotation } = getPathPresentation(position)
  return (
    <group position={[x, 0, z]}>
      <group scale={1.025}>
        <KenneyModel path={MODEL_PATHS.castle} />
      </group>
      <group position={[0, 0.202, 0]} rotation={[0, rotation, 0]}>
        <KenneyModel
          path={MODEL_PATHS.pathEnd}
          castShadow={false}
          receiveShadow
        />
      </group>
    </group>
  )
}

/** The land tile for one map hex: castle, path, scenery, or open grass. */
export function BoardTile({ position }: TileProps) {
  if (PATH_END && positionsMatch(position, PATH_END)) {
    return <CastleTile position={position} />
  }
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
