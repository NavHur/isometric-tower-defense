import { describe, expect, it } from 'vite-plus/test'
import { PATH_CELLS } from '../config/map'
import { expandPath } from './expandPath'

describe('expandPath', () => {
  it('expands axial waypoints without duplicating corners', () => {
    expect(
      expandPath({ q: 0, r: 0 }, [
        ['east', 2],
        ['northwest', 2],
      ]),
    ).toStrictEqual([
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 2, r: 0 },
      { q: 2, r: -1 },
      { q: 2, r: -2 },
    ])
  })

  it('creates the complete 26-cell authored route', () =>
    expect(PATH_CELLS).toHaveLength(26))

  it('keeps the start for a route without movement', () => {
    expect(expandPath({ q: 2, r: -1 }, [])).toStrictEqual([{ q: 2, r: -1 }])
  })
})
