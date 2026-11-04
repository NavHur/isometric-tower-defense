import type { HexPosition } from '../../game/types/towerDefense'
import { hexToWorld } from '../../game/utils/hexCoordinates'
import { KenneyModel } from '../assets/KenneyModel'
import { MODEL_PATHS } from '../assets/modelPaths'

const SCENERY_MODELS = [
  MODEL_PATHS.grassForest,
  MODEL_PATHS.village,
  MODEL_PATHS.grassHill,
  MODEL_PATHS.grassForest,
  MODEL_PATHS.stoneRocks,
  MODEL_PATHS.farm,
  MODEL_PATHS.archery,
  MODEL_PATHS.grassForest,
  MODEL_PATHS.stoneMountain,
  MODEL_PATHS.grassHill,
  MODEL_PATHS.cabin,
  MODEL_PATHS.grassForest,
  MODEL_PATHS.mill,
  MODEL_PATHS.stoneRocks,
  MODEL_PATHS.mine,
  MODEL_PATHS.grassForest,
  MODEL_PATHS.market,
  MODEL_PATHS.grassHill,
  MODEL_PATHS.sheep,
  MODEL_PATHS.grassForest,
  MODEL_PATHS.wizardTower,
  MODEL_PATHS.stoneRocks,
  MODEL_PATHS.grassHill,
  MODEL_PATHS.grassForest,
] as const

interface SceneryTileProps {
  index: number
  position: HexPosition
}

export function SceneryTile({ index, position }: SceneryTileProps) {
  const [x, , z] = hexToWorld(position)
  return (
    <group position={[x, 0, z]} scale={1.025}>
      <KenneyModel path={SCENERY_MODELS[index % SCENERY_MODELS.length]} />
    </group>
  )
}
