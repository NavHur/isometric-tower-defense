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

  it('rejects placement without a selected tool and leaves state unchanged', () => {
    const state = useGameStore.getState()
    expect(state.placeTower({ q: -4, r: 1 })).toStrictEqual({
      ok: false,
      reason: 'not-buildable',
    })
    expect(useGameStore.getState()).toBe(state)
  })

  it('clears the placement prompt when cancelling the build tool', () => {
    useGameStore.getState().selectBuild('pulseTower')
    expect(useGameStore.getState().placementMessage).toBe(
      'Choose an open grass hex.',
    )
    useGameStore.getState().selectBuild(null)
    expect(useGameStore.getState().placementMessage).toBeNull()
    expect(useGameStore.getState().selectedBuild).toBeNull()
  })

  it('only toggles pause during an active wave', () => {
    const ready = useGameStore.getState()
    ready.togglePause()
    expect(useGameStore.getState()).toBe(ready)
    ready.startWave()
    useGameStore.getState().togglePause()
    expect(useGameStore.getState().isPaused).toBe(true)
    const paused = useGameStore.getState()
    paused.advanceGame(1)
    expect(useGameStore.getState()).toBe(paused)
    paused.togglePause()
    expect(useGameStore.getState().isPaused).toBe(false)
  })
})
