import type { ThreeEvent } from '@react-three/fiber'
import {
  canPlaceSelectedAt,
  positionsMatch,
} from '../../game/rules/canPlaceTower'
import { useGameStore } from '../../game/state/useGameStore'
import type { HexPosition } from '../../game/types/towerDefense'
import { hexToWorld } from '../../game/utils/hexCoordinates'
import { KenneyModel } from '../assets/KenneyModel'
import { MODEL_PATHS } from '../assets/modelPaths'
import { BUILD_TARGET_LIFT } from './buildTarget'

const HOVER_OPACITY = 0.34

interface BuildTileProps {
  position: HexPosition
}

function stopPropagation(event: ThreeEvent<MouseEvent>) {
  event.stopPropagation()
}

/** Pointer handlers that hover, and on click build on, one grass hex. */
function useBuildTargetHandlers(position: HexPosition) {
  const setHoveredTile = useGameStore((state) => state.setHoveredTile)
  const placeTower = useGameStore((state) => state.placeTower)

  return {
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation()
      if (placeTower(position).ok) setHoveredTile(null)
    },
    onPointerEnter: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      const building = useGameStore.getState().selectedBuild !== null
      document.body.style.cursor = building ? 'crosshair' : 'default'
      setHoveredTile(position)
    },
    onPointerLeave: () => {
      document.body.style.cursor = 'default'
      const current = useGameStore.getState().hoveredTile
      if (current && positionsMatch(current, position)) setHoveredTile(null)
    },
  }
}

function BuildTarget({ position }: BuildTileProps) {
  const showsHover = useGameStore(
    (state) =>
      state.selectedBuild !== null &&
      state.hoveredTile !== null &&
      positionsMatch(state.hoveredTile, position),
  )
  const canBuild = useGameStore((state) => canPlaceSelectedAt(state, position))
  const { onClick, onPointerEnter, onPointerLeave } =
    useBuildTargetHandlers(position)

  return (
    <mesh
      position={[0, BUILD_TARGET_LIFT, 0]}
      onClick={onClick}
      onContextMenu={stopPropagation}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <cylinderGeometry args={[0.55, 0.55, 0.055, 6]} />
      <meshBasicMaterial
        transparent
        opacity={showsHover ? HOVER_OPACITY : 0}
        color={canBuild ? '#f9fcfb' : '#c84c4c'}
        depthWrite={false}
      />
    </mesh>
  )
}

export function BuildTile({ position }: BuildTileProps) {
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
      <BuildTarget position={position} />
    </group>
  )
}
