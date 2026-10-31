export type HexPosition = {
  q: number
  r: number
}

export type HexPoint = {
  q: number
  r: number
}

export type GamePhase =
  | 'ready'
  | 'wave-active'
  | 'intermission'
  | 'victory'
  | 'defeat'

export type EnemyKind = 'normal' | 'fast'
export type TowerKind = 'pulseTower'

export type TowerState = {
  id: string
  kind: TowerKind
  position: HexPosition
  cooldownRemaining: number
  targetEnemyId: string | null
}

export type EnemyState = {
  id: string
  kind: EnemyKind
  health: number
  pathProgress: number
}

export type ProjectileState = {
  id: string
  sourceTowerId: string
  targetEnemyId: string
  damage: number
  travelDuration: number
  travelRemaining: number
}

export type PendingSpawn = {
  kind: EnemyKind
  delay: number
}

export type PlacementFailure =
  | 'not-buildable'
  | 'occupied'
  | 'insufficient-funds'
  | 'game-ended'

export type PlacementResult =
  | { ok: true; towerId: string }
  | { ok: false; reason: PlacementFailure }

export type SimulationState = {
  phase: GamePhase
  isPaused: boolean
  currency: number
  lives: number
  currentWave: number
  selectedBuild: TowerKind | null
  hoveredTile: HexPosition | null
  placementMessage: string | null
  towers: readonly TowerState[]
  enemies: readonly EnemyState[]
  projectiles: readonly ProjectileState[]
  pendingSpawns: readonly PendingSpawn[]
  spawnCountdown: number
  nextTowerId: number
  nextEnemyId: number
  nextProjectileId: number
}
