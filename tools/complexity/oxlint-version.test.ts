// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vite-plus/test'

function manifest(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function hoistedOxlintVersion(): string {
  const oxlint = manifest('node_modules/oxlint/package.json')
  if (typeof oxlint === 'object' && oxlint !== null && 'version' in oxlint) {
    return String(oxlint.version)
  }
  throw new Error('node_modules/oxlint/package.json has no version')
}

describe('oxlint engine', () => {
  it('runs the complexity check on the oxlint that vite-plus pins', () => {
    expect(manifest('node_modules/vite-plus/package.json')).toMatchObject({
      dependencies: { oxlint: `=${hoistedOxlintVersion()}` },
    })
  })
})
