import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { EnemyState } from '../../game/types/towerDefense'
import { hexToWorld } from '../../game/utils/hexCoordinates'
import { pathProgressToHexPoint } from '../../game/utils/pathProgressToHexPoint'
import { TabletopShadow } from '../effects/TabletopShadow'

interface EnemyProps {
  enemy: EnemyState
}

function Goblin() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#5f9f4a" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.49, 0.015]} castShadow>
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#78b958" roughness={0.84} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.19, 0.51, 0]}
          rotation={[0, 0, (side * -Math.PI) / 2]}
          castShadow
        >
          <coneGeometry args={[0.075, 0.2, 4]} />
          <meshStandardMaterial color="#78b958" roughness={0.84} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.065, 0.53, 0.16]}>
          <sphereGeometry args={[0.026, 6, 4]} />
          <meshBasicMaterial color="#243247" />
        </mesh>
      ))}
      <mesh position={[0.21, 0.24, 0]} rotation={[0, 0, -0.28]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 0.46, 5]} />
        <meshStandardMaterial color="#7a5036" roughness={0.95} />
      </mesh>
      <mesh position={[0.26, 0.45, 0]} castShadow>
        <dodecahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color="#66739a" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Slime() {
  return (
    <group>
      <mesh position={[0, 0.23, 0]} scale={[1, 0.78, 1]} castShadow>
        <icosahedronGeometry args={[0.27, 2]} />
        <meshStandardMaterial color="#55b9df" roughness={0.55} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.08, 0.3, 0.235]}>
          <mesh>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#f9fcfb" />
          </mesh>
          <mesh position={[0, 0, 0.038]}>
            <sphereGeometry args={[0.02, 6, 4]} />
            <meshBasicMaterial color="#243247" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Enemy({ enemy }: EnemyProps) {
  const creature = useRef<Group>(null)
  const elapsed = useRef(0)
  const point = pathProgressToHexPoint(enemy.pathProgress)
  const ahead = pathProgressToHexPoint(enemy.pathProgress + 0.08)
  const [x, , z] = hexToWorld(point)
  const [aheadX, , aheadZ] = hexToWorld(ahead)
  const rotation = Math.atan2(aheadX - x, aheadZ - z)

  useFrame((_, delta) => {
    elapsed.current += delta
    if (!creature.current) return
    const speed = enemy.kind === 'fast' ? 8.5 : 6
    creature.current.position.y =
      Math.abs(Math.sin(elapsed.current * speed)) * 0.055
  })

  return (
    <group position={[x, 0.215, z]} rotation={[0, rotation, 0]}>
      <TabletopShadow radius={enemy.kind === 'normal' ? 0.34 : 0.3} y={0.008} />
      <group ref={creature} scale={enemy.kind === 'normal' ? 0.88 : 0.82}>
        {enemy.kind === 'normal' ? <Goblin /> : <Slime />}
      </group>
    </group>
  )
}
