import { describe, expect, it } from 'vite-plus/test'
import { pathProgressToHexPoint } from './pathProgressToHexPoint'

describe('pathProgressToHexPoint', () => {
  it('interpolates between neighboring hex centers', () =>
    expect(pathProgressToHexPoint(1.5)).toEqual({ q: -7.5, r: 2 }))
  it('continues through an axial turn', () =>
    expect(pathProgressToHexPoint(4)).toEqual({ q: -6, r: 3 }))
  it('clamps beyond the castle exit', () =>
    expect(pathProgressToHexPoint(999)).toEqual({ q: 9, r: -8 }))
})
