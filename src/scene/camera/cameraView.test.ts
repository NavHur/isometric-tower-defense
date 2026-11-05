import { describe, expect, it } from 'vite-plus/test'
import { projectToScreenUnits } from './cameraView'

describe('projectToScreenUnits', () => {
  it('puts the look-at point at the canvas centre', () => {
    const { x, y } = projectToScreenUnits([0, 0, 0])
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(0)
  })

  it('sends world +x down-right and world -z up-right on screen', () => {
    const along = projectToScreenUnits([1, 0, 0])
    expect(along.x).toBeGreaterThan(0)
    expect(along.y).toBeGreaterThan(0)
    const behind = projectToScreenUnits([0, 0, -1])
    expect(behind.x).toBeGreaterThan(0)
    expect(behind.y).toBeLessThan(0)
  })

  it('moves a point up the screen as it rises', () => {
    const ground = projectToScreenUnits([1, 0, 1])
    const raised = projectToScreenUnits([1, 1, 1])
    expect(raised.x).toBeCloseTo(ground.x)
    expect(raised.y).toBeLessThan(ground.y)
  })

  it('matches a projection worked out by hand', () => {
    // Camera at (11, 12, 12): right = (12, 0, -11) / sqrt(265), so a point on
    // the x axis lands 12 / sqrt(265) right of the centre.
    const { x } = projectToScreenUnits([1, 0, 0])
    expect(x).toBeCloseTo(12 / Math.sqrt(265))
  })
})
