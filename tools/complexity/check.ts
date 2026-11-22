import { layer as nodeSpawner } from '@effect/platform-node-shared/NodeChildProcessSpawner'
import { layer as nodeFileSystem } from '@effect/platform-node-shared/NodeFileSystem'
import { layer as nodePath } from '@effect/platform-node-shared/NodePath'
import { runMain } from '@effect/platform-node-shared/NodeRuntime'
import { Effect, FileSystem, Layer, Path } from 'effect'
import { ChildProcess } from 'effect/process'
import { ChildProcessSpawner } from 'effect/process/ChildProcessSpawner'
import { lint } from '../oxlint/config.ts'
import { requireComplexityRules } from './rules.ts'
import { trackedSources } from './trackedSources.ts'

const check = Effect.gen(function* checkComplexity() {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const spawner = yield* ChildProcessSpawner
  const files = yield* trackedSources
  const directory = yield* fs.makeTempDirectoryScoped({
    prefix: 'tower-defense-complexity-',
  })
  const config = path.join(directory, '.oxlintrc.json')
  yield* fs.writeFileString(
    config,
    JSON.stringify({
      categories: { correctness: 'off' },
      jsPlugins: [
        { name: 'pbp', specifier: path.resolve('tools/oxlint-plugin/pbp.mjs') },
      ],
      rules: requireComplexityRules(lint.rules),
    }),
  )
  const oxlint = ChildProcess.make(
    process.execPath,
    [
      path.resolve('node_modules/oxlint/bin/oxlint'),
      '--config',
      config,
      '--no-ignore',
      ...files,
    ],
    { stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' },
  )
  process.exitCode = yield* spawner.exitCode(oxlint)
})

const platform = Layer.merge(nodeFileSystem, nodePath)
const layers = nodeSpawner.pipe(Layer.provideMerge(platform))
runMain(check.pipe(Effect.scoped, Effect.provide(layers)))
