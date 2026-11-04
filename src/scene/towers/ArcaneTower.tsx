import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { TowerState } from '../../game/types/towerDefense'
import { hexToWorld } from '../../game/utils/hexCoordinates'
import { KenneyModel } from '../assets/KenneyModel'
import { MODEL_PATHS } from '../assets/modelPaths'
import { TabletopShadow } from '../effects/TabletopShadow'

interface ArcaneTowerProps {
  tower: TowerState
}

export function ArcaneTower({ tower }: ArcaneTowerProps) {
  const focus = useRef<Group>(null)
  const [x, , z] = hexToWorld(tower.position)

  useFrame((_, delta) => {
    if (focus.current) focus.current.rotation.y += delta * 1.4
  })

  return (
    <group position={[x, 0.205, z]}>
      <TabletopShadow radius={0.46} y={0.012} />
      <group scale={1.12}>
        <KenneyModel path={MODEL_PATHS.arcaneTower} />
      </group>
      <group ref={focus} position={[0, 1.05, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial
            color="#ffc46b"
            emissive="#d98555"
            emissiveIntensity={0.75}
            roughness={0.42}
          />
        </mesh>
        <pointLight color="#ffd88a" intensity={0.5} distance={1.6} decay={2} />
      </group>
    </group>
  )
}
