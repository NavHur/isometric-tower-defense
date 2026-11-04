import { TOWER_STATS } from '../../game/config/balance'
import { canPlaceSelectedAt } from '../../game/rules/canPlaceTower'
import { useGameStore } from '../../game/state/useGameStore'
import { hexToWorld } from '../../game/utils/hexCoordinates'
import { KenneyModel } from '../assets/KenneyModel'
import { MODEL_PATHS } from '../assets/modelPaths'

export function PlacementPreview() {
  const selectedBuild = useGameStore((state) => state.selectedBuild)
  const hoveredTile = useGameStore((state) => state.hoveredTile)
  const isValid = useGameStore(
    (state) =>
      state.hoveredTile !== null &&
      canPlaceSelectedAt(state, state.hoveredTile),
  )
  if (!selectedBuild || !hoveredTile) return null

  const [x, , z] = hexToWorld(hoveredTile)
  const { range } = TOWER_STATS[selectedBuild]

  return (
    <group position={[x, 0.215, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[range - 0.045, range, 96]} />
        <meshBasicMaterial
          color={isValid ? '#36b898' : '#c84c4c'}
          transparent
          opacity={0.72}
          depthWrite={false}
        />
      </mesh>
      {isValid ? (
        <group position={[0, 0.01, 0]} scale={1.08}>
          <KenneyModel
            path={MODEL_PATHS.arcaneTower}
            castShadow={false}
            receiveShadow={false}
          />
        </group>
      ) : null}
    </group>
  )
}
