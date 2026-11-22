import { layer as nodeSpawner } from '@effect/platform-node-shared/NodeChildProcessSpawner'
import { layer as nodeFileSystem } from '@effect/platform-node-shared/NodeFileSystem'
import { layer as nodePath } from '@effect/platform-node-shared/NodePath'
import { runMain } from '@effect/platform-node-shared/NodeRuntime'
import { Data, Effect, FileSystem, Layer, Path, Schema, Stream } from 'effect'
import { ChildProcess } from 'effect/process'
import { ChildProcessSpawner } from 'effect/process/ChildProcessSpawner'
import { lint } from '../oxlint/config.ts'
import { requireComplexityRules } from './rules.ts'

const { TaggedError: taggedError } = Data
class GitListError extends taggedError('GitListError')<{
  code: number
  message: string
}> {}

const gitOutput = Schema.String.check(
  Schema.makeFilter(
    (output) =>
      output.length === 0 ||
      output.endsWith('\0') ||
      'Expected NUL-terminated Git paths',
  ),
)
const { Array: array } = Schema
const decodeGitOutput = Schema.decodeUnknownEffect(gitOutput)
const decodePaths = Schema.decodeUnknownEffect(array(Schema.NonEmptyString))

// Include tracked tooling and tests even when application lint ignores them.
const listFiles = ChildProcess.make(
  'git',
  [
    'ls-files',
    '-z',
    '--',
    '*.js',
    '*.jsx',
    '*.mjs',
    '*.cjs',
    '*.ts',
    '*.tsx',
    '*.mts',
    '*.cts',
  ],
  { stderr: 'inherit' },
)

const trackedSources = Effect.gen(function* listTrackedSources() {
  const spawner = yield* ChildProcessSpawner
  const child = yield* spawner.spawn(listFiles)
  const output = yield* child.stdout.pipe(Stream.decodeText, Stream.mkString)
  const code = yield* child.exitCode
  if (code !== 0) {
    return yield* new GitListError({
      code,
      message: `git ls-files exited with status ${code}`,
    })
  }
  const paths = yield* decodeGitOutput(output)
  return yield* decodePaths(paths.split('\0').slice(0, -1))
})

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
