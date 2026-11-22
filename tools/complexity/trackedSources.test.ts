// @vitest-environment node
import { Effect, Sink, Stream } from 'effect'
import {
  ChildProcessSpawner,
  ExitCode as exitCodeOf,
  ProcessId as processIdOf,
  make,
  makeHandle,
} from 'effect/process/ChildProcessSpawner'
import { describe, expect, it } from 'vite-plus/test'
import { trackedSources } from './trackedSources.ts'

function listFilesWith(stdout: string, exitCode: number) {
  const unused = Effect.die('Not used by trackedSources')
  const handle = makeHandle({
    pid: processIdOf(1),
    exitCode: Effect.succeed(exitCodeOf(exitCode)),
    isRunning: Effect.succeed(false),
    kill: () => unused,
    stdin: Sink.drain,
    stdout: Stream.make(new TextEncoder().encode(stdout)),
    stderr: Stream.empty,
    all: Stream.empty,
    getInputFd: () => Sink.drain,
    getOutputFd: () => Stream.empty,
    unref: unused,
  })
  const spawner = make(() => Effect.succeed(handle))
  return trackedSources.pipe(
    Effect.provideService(ChildProcessSpawner, spawner),
    Effect.scoped,
  )
}

describe('trackedSources', () => {
  it('lists each NUL-terminated path', async () => {
    const files = await Effect.runPromise(
      listFilesWith('src/a.ts\0tools/b.mjs\0', 0),
    )
    expect(files).toStrictEqual(['src/a.ts', 'tools/b.mjs'])
  })

  it('lists nothing when Git prints nothing', async () => {
    const files = await Effect.runPromise(listFilesWith('', 0))
    expect(files).toStrictEqual([])
  })

  it('rejects output that is not NUL-terminated', async () => {
    const failure = await Effect.runPromise(
      listFilesWith('src/a.ts\0tools/b.ts', 0).pipe(Effect.flip),
    )
    expect(failure.message).toContain('NUL-terminated')
  })

  it('rejects an empty path between separators', async () => {
    const failure = await Effect.runPromise(
      listFilesWith('src/a.ts\0\0', 0).pipe(Effect.flip),
    )
    expect(failure).toMatchObject({ _tag: 'SchemaError' })
  })

  it('reports a failing git as a GitListError with its status', async () => {
    const failure = await Effect.runPromise(
      listFilesWith('', 128).pipe(Effect.flip),
    )
    expect(failure).toMatchObject({ _tag: 'GitListError', code: 128 })
  })
})
