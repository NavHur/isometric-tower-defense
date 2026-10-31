import { describe, expect, it } from 'vite-plus/test'
import { getPathPresentation } from './boardPresentation'

describe('getPathPresentation', () => {
  it.each([
    [{ q: -9, r: 2 }, 'start', Math.PI],
    [{ q: -8, r: 2 }, 'straight', 0],
    [{ q: -6, r: 2 }, 'corner', (Math.PI * 2) / 3],
    [{ q: -2, r: 5 }, 'corner', 0],
    [{ q: 9, r: -8 }, 'end', Math.PI / 3],
  ] as const)('presents path tile %o', (position, kind, rotation) => {
    expect(getPathPresentation(position)).toEqual({ kind, rotation })
  })

  it('uses only gentle corners along the authored route', () => {
    const sharpCorners = [
      { q: -6, r: 2 },
      { q: -6, r: 5 },
      { q: -2, r: 5 },
      { q: 1, r: 2 },
      { q: 3, r: 2 },
      { q: 5, r: 0 },
      { q: 5, r: -2 },
      { q: 7, r: -4 },
      { q: 7, r: -6 },
    ].filter((position) => getPathPresentation(position).kind === 'cornerSharp')
    expect(sharpCorners).toHaveLength(0)
  })
})
