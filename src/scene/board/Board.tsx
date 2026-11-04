import {
  BOARD_CENTER_OFFSET,
  MAP_POSITIONS,
  PATH_CELLS,
  WATER_POSITIONS,
} from '../../game/config/map'
import type { HexPosition } from '../../game/types/towerDefense'
import { hexKey, hexToWorld } from '../../game/utils/hexCoordinates'
import { KenneyModel } from '../assets/KenneyModel'
import { MODEL_PATHS } from '../assets/modelPaths'
import { BoardTile } from './BoardTile'
import { RuneGate } from './RuneGate'

/** Every ninth water hex carries rocks. */
const WATER_ROCK_INTERVAL = 9

interface WaterTileProps {
  position: HexPosition
  index: number
}

function WaterTile({ position, index }: WaterTileProps) {
  const [x, , z] = hexToWorld(position)
  const path =
    index % WATER_ROCK_INTERVAL === 0
      ? MODEL_PATHS.waterRocks
      : MODEL_PATHS.water
  return (
    <group position={[x, -0.14, z]} scale={1.025}>
      <KenneyModel path={path} castShadow={false} receiveShadow />
    </group>
  )
}

export function Board() {
  const [startX, , startZ] = hexToWorld(PATH_CELLS[0])

  return (
    <group position={BOARD_CENTER_OFFSET}>
      {WATER_POSITIONS.map((position, index) => (
        <WaterTile
          key={`water:${hexKey(position)}`}
          position={position}
          index={index}
        />
      ))}
      {MAP_POSITIONS.map((position) => (
        <BoardTile key={hexKey(position)} position={position} />
      ))}
      <group position={[startX, 0.52, startZ]}>
        <RuneGate />
      </group>
    </group>
  )
}
