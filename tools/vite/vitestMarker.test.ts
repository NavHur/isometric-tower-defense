// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test'
import { runsUnderVitest } from './vitestMarker.ts'

describe('runsUnderVitest', () => {
  it.each([
    ['unset', {}, false],
    ['empty', { VITEST: '' }, true],
    ['true', { VITEST: 'true' }, true],
  ])('treats a %s VITEST marker by its presence', (_name, env, expected) => {
    expect(runsUnderVitest(env)).toBe(expected)
  })
})
