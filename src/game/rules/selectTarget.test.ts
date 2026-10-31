import { describe, expect, it } from 'vite-plus/test'
import type { EnemyState, TowerState } from '../types/towerDefense'
import { selectTarget } from './selectTarget'

const tower: TowerState = {
  id: 'tower-1',
  kind: 'pulseTower',
  position: { q: -7, r: 3 },
  cooldownRemaining: 0,
  targetEnemyId: null,
}

describe('selectTarget', () => {
  it('selects the in-range enemy furthest along the path', () => {
    const enemies: EnemyState[] = [
      { id: 'enemy-1', kind: 'normal', health: 60, pathProgress: 3 },
      { id: 'enemy-2', kind: 'normal', health: 60, pathProgress: 5 },
    ]
    expect(selectTarget(tower, enemies)?.id).toBe('enemy-2')
  })
  it('uses stable IDs to break equal-progress ties', () => {
    const enemies: EnemyState[] = [
      { id: 'enemy-2', kind: 'normal', health: 60, pathProgress: 5 },
      { id: 'enemy-1', kind: 'normal', health: 60, pathProgress: 5 },
    ]
    expect(selectTarget(tower, enemies)?.id).toBe('enemy-1')
  })
  it('ignores dead and out-of-range enemies', () => {
    expect(
      selectTarget(tower, [
        { id: 'dead', kind: 'normal', health: 0, pathProgress: 5 },
        { id: 'far', kind: 'normal', health: 60, pathProgress: 18 },
      ]),
    ).toBeNull()
  })
})
