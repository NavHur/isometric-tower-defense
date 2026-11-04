import type { HexPosition } from '../../game/types/towerDefense'
import { hexToWorld } from '../../game/utils/hexCoordinates'
import { KenneyModel } from '../assets/KenneyModel'
import { MODEL_PATHS } from '../assets/modelPaths'
import { getPathPresentation } from './boardPresentation'
import type { PathPresentation } from './boardPresentation'

const PATH_MODELS: Record<PathPresentation['kind'], string> = {
  start: MODEL_PATHS.pathStart,
  end: MODEL_PATHS.pathEnd,
  corner: MODEL_PATHS.pathCorner,
  cornerSharp: MODEL_PATHS.pathCornerSharp,
  straight: MODEL_PATHS.pathStraight,
}

interface PathTileProps {
  position: HexPosition
}

export function PathTile({ position }: PathTileProps) {
  const presentation = getPathPresentation(position)
  const path = PATH_MODELS[presentation.kind]
  const [x, , z] = hexToWorld(position)

  return (
    <group position={[x, 0, z]}>
      <group scale={1.025}>
        <KenneyModel
          path={MODEL_PATHS.grass}
          castShadow={false}
          receiveShadow
        />
      </group>
      <group position={[0, 0.202, 0]} rotation={[0, presentation.rotation, 0]}>
        <KenneyModel path={path} castShadow={false} receiveShadow />
      </group>
    </group>
  )
}
