import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { useGameStore } from './useGameStore'

describe('useGameStore', () => {
  beforeEach(() => useGameStore.getState().restart())
  it('selects a build tool and places a tower', () => {
    useGameStore.getState().selectBuild('pulseTower')
    const result = useGameStore.getState().placeTower({ q: -4, r: 1 })
    expect(result.ok).toBe(true)
    expect(useGameStore.getState().currency).toBe(100)
  })
  it('restarts the complete run', () => {
    useGameStore.getState().selectBuild('pulseTower')
    useGameStore.getState().placeTower({ q: -4, r: 1 })
    useGameStore.getState().startWave()
    useGameStore.getState().restart()
    expect(useGameStore.getState()).toMatchObject({
      phase: 'ready',
      currency: 150,
      lives: 10,
      currentWave: 0,
      towers: [],
      enemies: [],
    })
  })
})
