import { Data, Effect, Schema, Stream } from 'effect'
import { ChildProcess } from 'effect/process'
import { ChildProcessSpawner } from 'effect/process/ChildProcessSpawner'

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

export const trackedSources = Effect.gen(function* listTrackedSources() {
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
