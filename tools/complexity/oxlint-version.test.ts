// @vitest-environment node
import { layer as nodeFileSystem } from '@effect/platform-node-shared/NodeFileSystem'
import { Effect, FileSystem, Schema } from 'effect'
import { Struct as struct } from 'effect/Schema'
import { describe, expect, it } from 'vite-plus/test'

const readOxlint = Schema.decodeUnknownEffect(
  Schema.fromJsonString(struct({ version: Schema.NonEmptyString })),
)
const vitePlusDependencies = struct({ oxlint: Schema.NonEmptyString })
const readVitePlus = Schema.decodeUnknownEffect(
  Schema.fromJsonString(struct({ dependencies: vitePlusDependencies })),
)

describe('oxlint engine', () => {
  it('runs the complexity check on the oxlint that vite-plus pins', async () => {
    const versions = Effect.gen(function* readVersions() {
      const fs = yield* FileSystem.FileSystem
      const oxlint = yield* fs
        .readFileString('node_modules/oxlint/package.json')
        .pipe(Effect.flatMap(readOxlint))
      const vitePlus = yield* fs
        .readFileString('node_modules/vite-plus/package.json')
        .pipe(Effect.flatMap(readVitePlus))
      return { actual: oxlint.version, pinned: vitePlus.dependencies.oxlint }
    })
    const { actual, pinned } = await Effect.runPromise(
      Effect.provide(versions, nodeFileSystem),
    )
    expect(pinned).toBe(`=${actual}`)
  })
})
