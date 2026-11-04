import { useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import { AdditiveBlending } from 'three'
import type {
  BufferGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PointLight,
} from 'three'
import { FIXED_STEP_SECONDS } from '../../game/config/balance'
import { useGameStore } from '../../game/state/useGameStore'
import type { SimulationState } from '../../game/types/towerDefense'
import { hexToWorld } from '../../game/utils/hexCoordinates'
import { pathProgressToHexPoint } from '../../game/utils/pathProgressToHexPoint'
import { BloomMaterial } from './BloomMaterial'
import { MAGIC_LIGHT_COLOR } from './effectPalette'

const IMPACT_DURATION_SECONDS = 0.3
const IMPACT_HEIGHT = 0.78
const LANDING_TOLERANCE_SECONDS = 0.001
const MAX_IMPACTS = 20
const LIGHT_PEAK_INTENSITY = 2.4
const SHARD_DIRECTIONS = [
  [0.78, 0.48, 0.12],
  [-0.56, 0.64, 0.42],
  [0.22, 0.72, -0.68],
  [-0.7, 0.38, -0.44],
] as const

type BloomMesh = Mesh<BufferGeometry, MeshBasicMaterial>

/** How one glow mesh grows and fades over a burst. */
interface Pulse {
  baseScale: number
  growth: number
  peakOpacity: number
}

const CORE_PULSE: Pulse = { baseScale: 0.7, growth: 2.8, peakOpacity: 0.82 }
const HALO_PULSE: Pulse = { baseScale: 0.8, growth: 3.8, peakOpacity: 0.18 }
const RING_PULSE: Pulse = { baseScale: 0.7, growth: 5, peakOpacity: 0.7 }

interface ImpactEffect {
  id: string
  position: readonly [number, number, number]
}

type ImpactBurstProps = ImpactEffect & {
  onComplete: (id: string) => void
}

function applyPulse(mesh: BloomMesh | null, pulse: Pulse, progress: number) {
  if (!mesh) return
  mesh.scale.setScalar(pulse.baseScale + progress * pulse.growth)
  mesh.material.opacity = (1 - progress) * pulse.peakOpacity
}

function scatterShards(shards: Group | null, progress: number) {
  if (!shards) return
  for (const [index, shard] of shards.children.entries()) {
    const [x, y, z] = SHARD_DIRECTIONS[index]
    shard.position.set(
      x * progress * 0.72,
      y * progress * 0.55,
      z * progress * 0.72,
    )
    shard.scale.setScalar((1 - progress) * 0.85)
  }
}

function ImpactShards({ ref }: { ref: Ref<Group> }) {
  return (
    <group ref={ref}>
      {SHARD_DIRECTIONS.map((direction, index) => (
        <mesh
          key={direction.join(',')}
          rotation={[index, index * 0.7, index * 0.35]}
        >
          <octahedronGeometry args={[0.055, 0]} />
          <BloomMaterial opacity={0.9} blending={AdditiveBlending} />
        </mesh>
      ))}
    </group>
  )
}

/** Drives one burst's meshes frame by frame and reports when it finishes. */
function useImpactAnimation(onFinish: () => void) {
  const elapsed = useRef(0)
  const finished = useRef(false)
  const core = useRef<BloomMesh>(null)
  const halo = useRef<BloomMesh>(null)
  const ring = useRef<BloomMesh>(null)
  const light = useRef<PointLight>(null)
  const shards = useRef<Group>(null)

  useFrame((_, delta) => {
    elapsed.current += delta
    const progress = Math.min(elapsed.current / IMPACT_DURATION_SECONDS, 1)
    const fade = 1 - progress
    applyPulse(core.current, CORE_PULSE, progress)
    applyPulse(halo.current, HALO_PULSE, progress)
    applyPulse(ring.current, RING_PULSE, progress)
    if (light.current) {
      light.current.intensity = fade * fade * LIGHT_PEAK_INTENSITY
    }
    scatterShards(shards.current, progress)

    if (progress === 1 && !finished.current) {
      finished.current = true
      onFinish()
    }
  })

  return { core, halo, ring, light, shards }
}

function ImpactBurst({ id, position, onComplete }: ImpactBurstProps) {
  const { core, halo, ring, light, shards } = useImpactAnimation(() =>
    onComplete(id),
  )

  return (
    <group position={position}>
      <pointLight
        ref={light}
        color={MAGIC_LIGHT_COLOR}
        intensity={LIGHT_PEAK_INTENSITY}
        distance={2.2}
        decay={2}
      />
      <mesh ref={core}>
        <icosahedronGeometry args={[0.13, 1]} />
        <BloomMaterial opacity={CORE_PULSE.peakOpacity} />
      </mesh>
      <mesh ref={halo}>
        <icosahedronGeometry args={[0.2, 2]} />
        <BloomMaterial
          opacity={HALO_PULSE.peakOpacity}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh ref={ring} position={[0, -0.54, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.13, 24]} />
        <BloomMaterial
          opacity={RING_PULSE.peakOpacity}
          blending={AdditiveBlending}
        />
      </mesh>
      <ImpactShards ref={shards} />
    </group>
  )
}

/** Bursts for the projectiles that reached their target between two states. */
function landedImpacts(
  state: SimulationState,
  previous: SimulationState,
): ImpactEffect[] {
  const inFlight = new Set(state.projectiles.map((projectile) => projectile.id))
  return previous.projectiles
    .filter(
      (projectile) =>
        !inFlight.has(projectile.id) &&
        projectile.travelRemaining <=
          FIXED_STEP_SECONDS + LANDING_TOLERANCE_SECONDS,
    )
    .flatMap((projectile) => {
      const target = previous.enemies.find(
        (enemy) => enemy.id === projectile.targetEnemyId,
      )
      if (!target) return []
      const [x, , z] = hexToWorld(pathProgressToHexPoint(target.pathProgress))
      return [
        {
          id: `${projectile.id}:${performance.now()}`,
          position: [x, IMPACT_HEIGHT, z] as const,
        },
      ]
    })
}

export function CombatEffects() {
  const [impacts, setImpacts] = useState<readonly ImpactEffect[]>([])

  useEffect(
    () =>
      useGameStore.subscribe((state, previousState) => {
        const landed = landedImpacts(state, previousState)
        if (landed.length === 0) return
        setImpacts((current) => [...current, ...landed].slice(-MAX_IMPACTS))
      }),
    [],
  )

  const removeImpact = useCallback((id: string) => {
    setImpacts((current) => current.filter((impact) => impact.id !== id))
  }, [])

  return impacts.map((impact) => (
    <ImpactBurst
      key={impact.id}
      id={impact.id}
      position={impact.position}
      onComplete={removeImpact}
    />
  ))
}
