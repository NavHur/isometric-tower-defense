import { describe, expect, it } from 'vite-plus/test'
import { PATH_LENGTH } from '../config/map'
import { createInitialState } from '../state/useGameStore'
import { advanceGame, startNextWave } from './advanceGame'
import { placeTower } from './placeTower'

describe('game actions', () => {
  it('places a tower and deducts its cost once', () => {
    const outcome = placeTower(createInitialState(), 'pulseTower', {
      q: -4,
      r: 1,
    })
    expect(outcome.result).toEqual({ ok: true, towerId: 'tower-1' })
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
    expect(advanceGame(state, 1)).toEqual(state)
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
    const positions = [
      { q: -7, r: 3 },
      { q: -5, r: 3 },
      { q: -4, r: 4 },
      { q: -2, r: 3 },
      { q: 0, r: 1 },
      { q: 3, r: 0 },
    ]
    let state = createInitialState()
    let nextPosition = 0
    while (nextPosition < 3) {
      state = placeTower(state, 'pulseTower', positions[nextPosition]).state
      nextPosition += 1
    }

    for (let wave = 0; wave < 3; wave += 1) {
      state = startNextWave(state)
      let ticks = 0
      while (state.phase === 'wave-active' && ticks < 900) {
        state = advanceGame(state, 0.05)
        ticks += 1
      }
      while (
        state.phase === 'intermission' &&
        state.currency >= 50 &&
        nextPosition < positions.length
      ) {
        state = placeTower(state, 'pulseTower', positions[nextPosition]).state
        nextPosition += 1
      }
    }

    expect(state.phase).toBe('victory')
    expect(state.lives).toBeGreaterThan(0)
  })
})
