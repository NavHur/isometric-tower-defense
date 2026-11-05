export interface HexPosition {
  q: number
  r: number
}

export interface HexPoint {
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

export interface TowerState {
  id: string
  kind: TowerKind
  position: HexPosition
  cooldownRemaining: number
  targetEnemyId: string | null
}

export interface EnemyState {
  id: string
  kind: EnemyKind
  health: number
  pathProgress: number
}

export interface ProjectileState {
  id: string
  sourceTowerId: string
  targetEnemyId: string
  damage: number
  travelDuration: number
  travelRemaining: number
}

export interface PendingSpawn {
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

export interface SimulationState {
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
