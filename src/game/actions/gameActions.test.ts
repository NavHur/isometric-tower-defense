import { describe, expect, it } from 'vite-plus/test'
import { TOWER_STATS } from '../config/balance'
import { PATH_LENGTH } from '../config/map'
import { createInitialState } from '../state/useGameStore'
import type { HexPosition, SimulationState } from '../types/towerDefense'
import { advanceGame, startNextWave } from './advanceGame'
import { placeTower } from './placeTower'

const PLANNED_TOWERS: readonly HexPosition[] = [
  { q: -7, r: 3 },
  { q: -5, r: 3 },
  { q: -4, r: 4 },
  { q: -2, r: 3 },
  { q: 0, r: 1 },
  { q: 3, r: 0 },
]
const TICK_SECONDS = 0.05
const MAX_TICKS_PER_WAVE = 900

/** A planned run's state and how many of PLANNED_TOWERS it has built. */
interface PlannedRun {
  state: SimulationState
  built: number
}

function canBuildNext({ state, built }: PlannedRun) {
  return (
    state.phase !== 'wave-active' &&
    state.currency >= TOWER_STATS.pulseTower.cost &&
    built < PLANNED_TOWERS.length
  )
}

/** Spends gold on the next planned hexes until it runs out. */
function buildWhileAffordable(run: PlannedRun): PlannedRun {
  let next = run
  while (canBuildNext(next)) {
    const { state } = placeTower(
      next.state,
      'pulseTower',
      PLANNED_TOWERS[next.built],
    )
    next = { state, built: next.built + 1 }
  }
  return next
}

/** Starts the next wave and ticks until it ends or times out. */
function playWave(state: SimulationState): SimulationState {
  let next = startNextWave(state)
  for (
    let tick = 0;
    next.phase === 'wave-active' && tick < MAX_TICKS_PER_WAVE;
    tick += 1
  ) {
    next = advanceGame(next, TICK_SECONDS)
  }
  return next
}

describe('game actions', () => {
  it('places a tower and deducts its cost once', () => {
    const outcome = placeTower(createInitialState(), 'pulseTower', {
      q: -4,
      r: 1,
    })
    expect(outcome.result).toStrictEqual({ ok: true, towerId: 'tower-1' })
    expect(outcome.state.currency).toBe(100)
    expect(outcome.state.towers).toHaveLength(1)
  })

  it('starts the first configured wave', () => {
    const state = startNextWave(createInitialState())
    expect(state.phase).toBe('wave-active')
    expect(state.currentWave).toBe(1)
    expect(state.pendingSpawns).toHaveLength(8)
  })

  it('does not advance while paused', () => {
    const state = { ...startNextWave(createInitialState()), isPaused: true }
    expect(advanceGame(state, 1)).toStrictEqual(state)
  })

  it('leaks enemies and ends the run at zero lives', () => {
    const state = {
      ...createInitialState(),
      phase: 'wave-active' as const,
      lives: 1,
      enemies: [
        {
          id: 'enemy-1',
          kind: 'normal' as const,
          health: 60,
          pathProgress: PATH_LENGTH - 0.01,
        },
      ],
    }
    const result = advanceGame(state, 0.05)
    expect(result.lives).toBe(0)
    expect(result.phase).toBe('defeat')
  })

  it('resolves projectile damage and grants a reward once', () => {
    const state = {
      ...createInitialState(),
      phase: 'wave-active' as const,
      currency: 0,
      enemies: [
        { id: 'enemy-1', kind: 'fast' as const, health: 20, pathProgress: 4 },
      ],
      projectiles: [
        {
          id: 'projectile-1',
          sourceTowerId: 'tower-1',
          targetEnemyId: 'enemy-1',
          damage: 20,
          travelDuration: 0.1,
          travelRemaining: 0.01,
        },
      ],
    }
    const result = advanceGame(state, 0.05)
    expect(result.enemies).toHaveLength(0)
    expect(result.currency).toBe(9)
  })

  it('enters victory when the final wave is clear', () => {
    const result = advanceGame(
      { ...createInitialState(), phase: 'wave-active', currentWave: 3 },
      0.05,
    )
    expect(result.phase).toBe('victory')
  })

  it('supports a complete winnable three-wave run with planned placements', () => {
    let run: PlannedRun = { state: createInitialState(), built: 0 }
    for (let wave = 0; wave < 3; wave += 1) {
      const prepared = buildWhileAffordable(run)
      run = { ...prepared, state: playWave(prepared.state) }
    }

    expect(run.state.phase).toBe('victory')
    expect(run.state.lives).toBeGreaterThan(0)
  })
})
