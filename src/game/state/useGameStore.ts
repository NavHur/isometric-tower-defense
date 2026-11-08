import { create } from 'zustand'
import { advanceGame, startNextWave } from '../actions/advanceGame'
import { placeTower } from '../actions/placeTower'
import { STARTING_CURRENCY, STARTING_LIVES } from '../config/balance'
import type {
  HexPosition,
  PlacementResult,
  SimulationState,
  TowerKind,
} from '../types/towerDefense'

export type GameState = SimulationState & {
  selectBuild: (kind: TowerKind | null) => void
  setHoveredTile: (position: HexPosition | null) => void
  placeTower: (position: HexPosition) => PlacementResult
  startWave: () => void
  togglePause: () => void
  advanceGame: (deltaSeconds: number) => void
  restart: () => void
}

export function createInitialState(): SimulationState {
  return {
    phase: 'ready',
    isPaused: false,
    currency: STARTING_CURRENCY,
    lives: STARTING_LIVES,
    currentWave: 0,
    selectedBuild: null,
    hoveredTile: null,
    placementMessage: null,
    towers: [],
    enemies: [],
    projectiles: [],
    pendingSpawns: [],
    spawnCountdown: 0,
    nextTowerId: 1,
    nextEnemyId: 1,
    nextProjectileId: 1,
  }
}

function togglePausedState(state: GameState) {
  return state.phase === 'wave-active' ? { isPaused: !state.isPaused } : state
}

export const useGameStore = create<GameState>((set, get) => ({
  ...createInitialState(),
  selectBuild: (kind) =>
    set({
      selectedBuild: kind,
      placementMessage: kind ? 'Choose an open grass hex.' : null,
    }),
  setHoveredTile: (position) => set({ hoveredTile: position }),
  placeTower: (position) => {
    const kind = get().selectedBuild
    if (!kind) return { ok: false, reason: 'not-buildable' }
    const outcome = placeTower(get(), kind, position)
    set(outcome.state)
    return outcome.result
  },
  startWave: () => set((state) => startNextWave(state)),
  togglePause: () => set(togglePausedState),
  advanceGame: (deltaSeconds) =>
    set((state) => advanceGame(state, deltaSeconds)),
  restart: () => set(createInitialState()),
}))
