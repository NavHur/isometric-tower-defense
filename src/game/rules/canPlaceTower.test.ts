import { describe, expect, it } from 'vite-plus/test'
import { createInitialState } from '../state/useGameStore'
import { getPlacementFailure } from './canPlaceTower'

describe('getPlacementFailure', () => {
  it('allows an affordable empty grass tile', () => {
    expect(
      getPlacementFailure(createInitialState(), 'pulseTower', {
        q: -4,
        r: 1,
      }),
    ).toBeNull()
  })
  it('rejects path and decoration tiles', () => {
    const state = createInitialState()
    expect(getPlacementFailure(state, 'pulseTower', { q: -6, r: 3 })).toBe(
      'not-buildable',
    )
    expect(getPlacementFailure(state, 'pulseTower', { q: -8, r: 4 })).toBe(
      'not-buildable',
    )
  })
  it('rejects occupied and unaffordable tiles', () => {
    const state = createInitialState()
    const occupied = {
      ...state,
      towers: [
        {
          id: 'tower-1',
          kind: 'pulseTower' as const,
          position: { q: -4, r: 1 },
          cooldownRemaining: 0,
          targetEnemyId: null,
        },
      ],
    }
    expect(getPlacementFailure(occupied, 'pulseTower', { q: -4, r: 1 })).toBe(
      'occupied',
    )
    expect(
      getPlacementFailure({ ...state, currency: 0 }, 'pulseTower', {
        q: -4,
        r: 1,
      }),
    ).toBe('insufficient-funds')
  })
})
