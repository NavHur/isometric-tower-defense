import { describe, expect, it } from 'vite-plus/test'
import { BOARD_CENTER_OFFSET, MAP_POSITIONS } from '../config/map'
import { hexDistance, hexToWorld } from './hexCoordinates'

describe('hex coordinates', () => {
  it('maps axial neighbors to Kenney pointy-hex spacing', () => {
    expect(hexToWorld({ q: 1, r: 0 })).toEqual([1, 0, 0])
    const [x, y, z] = hexToWorld({ q: 0, r: 1 })
    expect(x).toBe(0.5)
    expect(y).toBe(0)
    expect(z).toBeCloseTo(Math.sqrt(3) / 2)
  })

  it('supports fractional and scaled coordinates', () => {
    const [x, , z] = hexToWorld({ q: -1, r: 0.5 }, 2)
    expect(x).toBe(-1.5)
    expect(z).toBeCloseTo(Math.sqrt(3) / 2)
  })

  it('measures distance across all three axial axes', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -2 })).toBe(2)
    expect(hexDistance({ q: -1, r: -1 }, { q: 1, r: 1 })).toBe(4)
  })

  it('centers the complete island around the scene origin', () => {
    const positions = MAP_POSITIONS.map((position) => {
      const [x, , z] = hexToWorld(position)
      return {
        x: x + BOARD_CENTER_OFFSET[0],
        z: z + BOARD_CENTER_OFFSET[2],
      }
    })
    const minX = Math.min(...positions.map(({ x }) => x))
    const maxX = Math.max(...positions.map(({ x }) => x))
    const minZ = Math.min(...positions.map(({ z }) => z))
    const maxZ = Math.max(...positions.map(({ z }) => z))
    expect(minX + maxX).toBeCloseTo(0)
    expect(minZ + maxZ).toBeCloseTo(0)
  })
})
