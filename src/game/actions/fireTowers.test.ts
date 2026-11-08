import { describe, expect, it } from 'vite-plus/test'
import { TOWER_STATS } from '../config/balance'
import { createInitialState } from '../state/useGameStore'
import type { SimulationState, TowerState } from '../types/towerDefense'
import { pathProgressToHexPoint } from '../utils/pathProgressToHexPoint'
import { advanceGame } from './advanceGame'

const DELTA = 0.05
const TOWER: TowerState = {
  id: 'tower-1',
  kind: 'pulseTower',
  position: pathProgressToHexPoint(4),
  cooldownRemaining: 0,
  targetEnemyId: null,
}

function combatState(tower: TowerState): SimulationState {
  return {
    ...createInitialState(),
    phase: 'wave-active',
    towers: [tower],
    enemies: [{ id: 'enemy-1', kind: 'normal', health: 60, pathProgress: 4 }],
    nextProjectileId: 7,
  }
}

describe('tower firing', () => {
  it('fires once per ready tower with consecutive projectile IDs', () => {
    const state = combatState(TOWER)
    state.towers = [TOWER, { ...TOWER, id: 'tower-2' }]
    const next = advanceGame(state, DELTA)
    expect(next.projectiles).toStrictEqual([
      {
        id: 'projectile-7',
        sourceTowerId: 'tower-1',
        targetEnemyId: 'enemy-1',
        damage: TOWER_STATS.pulseTower.damage,
        travelDuration: 0.05,
        travelRemaining: 0.05,
      },
      {
        id: 'projectile-8',
        sourceTowerId: 'tower-2',
        targetEnemyId: 'enemy-1',
        damage: TOWER_STATS.pulseTower.damage,
        travelDuration: 0.05,
        travelRemaining: 0.05,
      },
    ])
    expect(next.nextProjectileId).toBe(9)
    expect(next.towers[0]).toStrictEqual({
      ...TOWER,
      cooldownRemaining: TOWER_STATS.pulseTower.cooldown,
      targetEnemyId: 'enemy-1',
    })
    expect(state.towers[0]).toBe(TOWER)
    expect(state.projectiles).toStrictEqual([])
  })

  it('updates the target while cooling down without firing', () => {
    const next = advanceGame(
      combatState({ ...TOWER, cooldownRemaining: 0.5 }),
      DELTA,
    )
    expect(next.towers[0]).toStrictEqual({
      ...TOWER,
      cooldownRemaining: 0.45,
      targetEnemyId: 'enemy-1',
    })
    expect(next.projectiles).toStrictEqual([])
    expect(next.nextProjectileId).toBe(7)
  })

  it('fires when the cooldown reaches zero in this step', () => {
    const next = advanceGame(
      combatState({ ...TOWER, cooldownRemaining: DELTA }),
      DELTA,
    )
    expect(next.projectiles).toHaveLength(1)
  })

  it('clears a lost target without resetting the cooldown', () => {
    const state = combatState({
      ...TOWER,
      targetEnemyId: 'gone',
      cooldownRemaining: 0.5,
    })
    state.enemies = []
    const next = advanceGame(state, DELTA)
    expect(next.towers[0]).toStrictEqual({
      ...TOWER,
      cooldownRemaining: 0.45,
    })
    expect(next.projectiles).toStrictEqual([])
  })

  it('keeps an idle tower object when its target and cooldown are unchanged', () => {
    const state = combatState(TOWER)
    state.enemies = []
    const next = advanceGame(state, DELTA)
    expect(next.towers[0]).toBe(TOWER)
  })
})
