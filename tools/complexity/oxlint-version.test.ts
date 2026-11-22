// @vitest-environment node
import { readFileSync } from 'node:fs'
import { Schema } from 'effect'
import { Struct as struct } from 'effect/Schema'
import { describe, expect, it } from 'vite-plus/test'

const readOxlint = Schema.decodeUnknownSync(
  Schema.fromJsonString(struct({ version: Schema.NonEmptyString })),
)
const vitePlusDependencies = struct({ oxlint: Schema.NonEmptyString })
const readVitePlus = Schema.decodeUnknownSync(
  Schema.fromJsonString(struct({ dependencies: vitePlusDependencies })),
)

describe('oxlint engine', () => {
  it('runs the complexity check on the oxlint that vite-plus pins', () => {
    const oxlint = readOxlint(
      readFileSync('node_modules/oxlint/package.json', 'utf8'),
    )
    const vitePlus = readVitePlus(
      readFileSync('node_modules/vite-plus/package.json', 'utf8'),
    )
    expect(vitePlus.dependencies.oxlint).toBe(`=${oxlint.version}`)
  })
})
