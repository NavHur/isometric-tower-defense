import { ENEMY_STATS, TOWER_STATS } from '../config/balance'
import { PATH_LENGTH } from '../config/map'
import { WAVES } from '../config/waves'
import { selectTarget } from '../rules/selectTarget'
import type {
  ProjectileState,
  SimulationState,
  TowerState,
} from '../types/towerDefense'
import { worldDistance } from '../utils/hexCoordinates'
import { pathProgressToHexPoint } from '../utils/pathProgressToHexPoint'

function spawnEnemies(state: SimulationState, delta: number): SimulationState {
  let countdown = state.spawnCountdown - delta
  const pending = [...state.pendingSpawns]
  const enemies = [...state.enemies]
  let { nextEnemyId } = state

  while (pending.length > 0 && countdown <= 0) {
    const spawn = pending.shift()
    if (!spawn) break
    const id = `enemy-${nextEnemyId}`
    enemies.push({
      id,
      kind: spawn.kind,
      health: ENEMY_STATS[spawn.kind].health,
      pathProgress: 0,
    })
    nextEnemyId += 1
    countdown += pending[0]?.delay ?? 0
  }

  return {
    ...state,
    enemies,
    pendingSpawns: pending,
    spawnCountdown: Math.max(0, countdown),
    nextEnemyId,
  }
}

function moveEnemies(state: SimulationState, delta: number): SimulationState {
  let leakedDamage = 0
  const enemies = state.enemies.flatMap((enemy) => {
    const pathProgress =
      enemy.pathProgress + ENEMY_STATS[enemy.kind].speed * delta
    if (pathProgress >= PATH_LENGTH) {
      leakedDamage += ENEMY_STATS[enemy.kind].leakDamage
      return []
    }
    return [{ ...enemy, pathProgress }]
  })

  const lives = Math.max(0, state.lives - leakedDamage)
  return {
    ...state,
    enemies,
    lives,
    phase: lives === 0 ? 'defeat' : state.phase,
    isPaused: lives === 0 ? false : state.isPaused,
    pendingSpawns: lives === 0 ? [] : state.pendingSpawns,
    projectiles: lives === 0 ? [] : state.projectiles,
  }
}

function resolveProjectiles(
  state: SimulationState,
  delta: number,
): SimulationState {
  const damageByEnemy = new Map<string, number>()
  const livingEnemyIds = new Set(state.enemies.map((enemy) => enemy.id))
  const projectiles = state.projectiles.flatMap((projectile) => {
    if (!livingEnemyIds.has(projectile.targetEnemyId)) return []
    const travelRemaining = projectile.travelRemaining - delta
    if (travelRemaining <= 0) {
      damageByEnemy.set(
        projectile.targetEnemyId,
        (damageByEnemy.get(projectile.targetEnemyId) ?? 0) + projectile.damage,
      )
      return []
    }
    return [{ ...projectile, travelRemaining }]
  })

  let { currency } = state
  const enemies = state.enemies.flatMap((enemy) => {
    const health = enemy.health - (damageByEnemy.get(enemy.id) ?? 0)
    if (health <= 0) {
      currency += ENEMY_STATS[enemy.kind].reward
      return []
    }
    return [{ ...enemy, health }]
  })

  return { ...state, enemies, projectiles, currency }
}

function updateTowerTarget(
  tower: TowerState,
  cooldownRemaining: number,
  targetEnemyId: string | null,
): TowerState {
  if (
    cooldownRemaining === tower.cooldownRemaining &&
    targetEnemyId === tower.targetEnemyId
  ) {
    return tower
  }
  return { ...tower, cooldownRemaining, targetEnemyId }
}

function fireTowers(state: SimulationState, delta: number): SimulationState {
  let { nextProjectileId } = state
  const projectiles: ProjectileState[] = [...state.projectiles]
  const towers: TowerState[] = state.towers.map((tower) => {
    const stats = TOWER_STATS[tower.kind]
    const cooldownRemaining = Math.max(0, tower.cooldownRemaining - delta)
    const target = selectTarget(tower, state.enemies)
    if (!target || cooldownRemaining > 0) {
      return updateTowerTarget(tower, cooldownRemaining, target?.id ?? null)
    }

    const targetPoint = pathProgressToHexPoint(target.pathProgress)
    const distance = worldDistance(targetPoint, tower.position)
    const travelDuration = Math.max(0.05, distance / stats.projectileSpeed)
    projectiles.push({
      id: `projectile-${nextProjectileId}`,
      sourceTowerId: tower.id,
      targetEnemyId: target.id,
      damage: stats.damage,
      travelDuration,
      travelRemaining: travelDuration,
    })
    nextProjectileId += 1
    return {
      ...tower,
      cooldownRemaining: stats.cooldown,
      targetEnemyId: target.id,
    }
  })

  return { ...state, towers, projectiles, nextProjectileId }
}

function resolveWave(state: SimulationState): SimulationState {
  if (
    state.phase !== 'wave-active' ||
    state.pendingSpawns.length > 0 ||
    state.enemies.length > 0 ||
    state.projectiles.length > 0
  ) {
    return state
  }
  const isFinalWave = state.currentWave >= WAVES.length
  return {
    ...state,
    phase: isFinalWave ? 'victory' : 'intermission',
    isPaused: false,
    selectedBuild: isFinalWave ? null : state.selectedBuild,
  }
}

export function advanceGame(
  state: SimulationState,
  delta: number,
): SimulationState {
  if (state.phase !== 'wave-active' || state.isPaused || delta <= 0)
    return state
  const spawned = spawnEnemies(state, delta)
  const moved = moveEnemies(spawned, delta)
  if (moved.phase === 'defeat') return moved
  const hit = resolveProjectiles(moved, delta)
  const fired = fireTowers(hit, delta)
  return resolveWave(fired)
}

export function startNextWave(state: SimulationState): SimulationState {
  if (state.phase !== 'ready' && state.phase !== 'intermission') return state
  const wave = WAVES.at(state.currentWave)
  if (wave === undefined) return state
  return {
    ...state,
    phase: 'wave-active',
    currentWave: state.currentWave + 1,
    pendingSpawns: wave,
    spawnCountdown: wave[0]?.delay ?? 0,
    placementMessage: null,
  }
}
