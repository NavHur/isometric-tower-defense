import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { useGameStore } from '../../game/state/useGameStore'
import { leaveBuildTarget } from './leaveBuildTarget'

const HOVERED = { q: -4, r: 1 }
const OTHER = { q: -3, r: 1 }

describe('leaveBuildTarget', () => {
  beforeEach(() => {
    useGameStore.getState().restart()
    document.body.style.cursor = 'crosshair'
  })

  it('resets the cursor and clears the hover when the pointer leaves the hovered tile', () => {
    useGameStore.getState().setHoveredTile(HOVERED)
    leaveBuildTarget(HOVERED)
    expect(document.body.style.cursor).toBe('default')
    expect(useGameStore.getState().hoveredTile).toBeNull()
  })

  it("keeps another tile's hover when the pointer leaves a different tile", () => {
    useGameStore.getState().setHoveredTile(HOVERED)
    leaveBuildTarget(OTHER)
    expect(document.body.style.cursor).toBe('default')
    expect(useGameStore.getState().hoveredTile).toStrictEqual(HOVERED)
  })

  it('leaves an empty hover empty', () => {
    leaveBuildTarget(HOVERED)
    expect(document.body.style.cursor).toBe('default')
    expect(useGameStore.getState().hoveredTile).toBeNull()
  })
})
