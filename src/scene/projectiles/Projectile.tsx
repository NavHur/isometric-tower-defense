import { AdditiveBlending } from 'three'
import { useGameStore } from '../../game/state/useGameStore'
import type { ProjectileState } from '../../game/types/towerDefense'
import { hexToWorld } from '../../game/utils/hexCoordinates'
import { pathProgressToHexPoint } from '../../game/utils/pathProgressToHexPoint'
import { BloomMaterial } from '../effects/BloomMaterial'
import { MAGIC_LIGHT_COLOR } from '../effects/effectPalette'

const LAUNCH_HEIGHT = 1.25
const LANDING_HEIGHT = 0.75
const MUZZLE_FLASH_SECONDS = 0.11
const IMPACT_GLOW_SECONDS = 0.12

type Vector3Tuple = readonly [number, number, number]

interface GlowProps {
  position: Vector3Tuple
  /** 0 to 1: how intense the glow is this frame. */
  strength: number
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress
}

function MuzzleFlash({ position, strength }: GlowProps) {
  return (
    <group position={position}>
      <pointLight
        color={MAGIC_LIGHT_COLOR}
        intensity={strength * 1.8}
        distance={1.8}
        decay={2}
      />
      <mesh scale={0.16 + (1 - strength) * 0.22}>
        <icosahedronGeometry args={[1, 1]} />
        <BloomMaterial opacity={strength * 0.8} />
      </mesh>
      <mesh scale={0.3 + (1 - strength) * 0.3}>
        <icosahedronGeometry args={[1, 2]} />
        <BloomMaterial opacity={strength * 0.16} blending={AdditiveBlending} />
      </mesh>
    </group>
  )
}

function Bolt({ position, strength }: GlowProps) {
  return (
    <group position={position}>
      <pointLight
        color={MAGIC_LIGHT_COLOR}
        intensity={0.45 + strength * 0.7}
        distance={1.25}
        decay={2}
      />
      <mesh scale={0.16 + strength * 0.1}>
        <icosahedronGeometry args={[1, 1]} />
        <BloomMaterial opacity={0.5 + strength * 0.25} />
      </mesh>
      <mesh scale={0.3 + strength * 0.16}>
        <icosahedronGeometry args={[1, 2]} />
        <BloomMaterial
          opacity={0.13 + strength * 0.08}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

interface ProjectileProps {
  projectile: ProjectileState
}

export function Projectile({ projectile }: ProjectileProps) {
  const source = useGameStore((state) =>
    state.towers.find((tower) => tower.id === projectile.sourceTowerId),
  )
  const target = useGameStore((state) =>
    state.enemies.find((enemy) => enemy.id === projectile.targetEnemyId),
  )
  if (!source || !target) return null

  const { travelDuration, travelRemaining } = projectile
  const start = hexToWorld(source.position)
  const end = hexToWorld(pathProgressToHexPoint(target.pathProgress))
  const progress = 1 - travelRemaining / travelDuration
  const elapsed = travelDuration - travelRemaining
  const muzzleStrength = Math.max(0, 1 - elapsed / MUZZLE_FLASH_SECONDS)
  const impactStrength = Math.max(0, 1 - travelRemaining / IMPACT_GLOW_SECONDS)

  return (
    <>
      {muzzleStrength > 0 ? (
        <MuzzleFlash
          position={[start[0], LAUNCH_HEIGHT, start[2]]}
          strength={muzzleStrength}
        />
      ) : null}
      <Bolt
        position={[
          lerp(start[0], end[0], progress),
          lerp(LAUNCH_HEIGHT, LANDING_HEIGHT, progress),
          lerp(start[2], end[2], progress),
        ]}
        strength={impactStrength}
      />
    </>
  )
}
