// @vitest-environment node
import { Effect, FileSystem, Path, Stream } from 'effect'
import { ChildProcess } from 'effect/process'
import { ChildProcessSpawner } from 'effect/process/ChildProcessSpawner'
import { describe, expect, it } from 'vite-plus/test'
import { nodePlatform } from './nodePlatform.ts'

function diagnostics(source: string, max: number) {
  const run = Effect.gen(function* lintFixture() {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const spawner = yield* ChildProcessSpawner
    const directory = yield* fs.makeTempDirectoryScoped({
      prefix: 'pbp-characterization-',
    })
    const input = path.join(directory, 'input.js')
    const config = path.join(directory, '.oxlintrc.json')
    yield* fs.writeFileString(input, source)
    yield* fs.writeFileString(
      config,
      JSON.stringify({
        categories: { correctness: 'off' },
        jsPlugins: [
          {
            name: 'pbp',
            specifier: path.resolve('tools/oxlint-plugin/pbp.mjs'),
          },
        ],
        rules: { 'pbp/cognitive-complexity': ['error', { max }] },
      }),
    )
    const command = ChildProcess.make(process.execPath, [
      path.resolve('node_modules/oxlint/bin/oxlint'),
      '--config',
      config,
      '--format',
      'json',
      input,
    ])
    const child = yield* spawner.spawn(command)
    const [stdout, stderr, code] = yield* Effect.all(
      [
        child.stdout.pipe(Stream.decodeText, Stream.mkString),
        child.stderr.pipe(Stream.decodeText, Stream.mkString),
        child.exitCode,
      ],
      { concurrency: 'unbounded' },
    )
    expect([0, 1]).toContain(code)
    expect(stderr).toBe('')
    return Array.from(
      stdout.matchAll(
        /Function `(?<name>.*?)` has cognitive complexity (?<score>\d+)/gu,
      ),
      ([, name, value]) => [name, Number(value)],
    )
  })
  return Effect.runPromise(
    run.pipe(Effect.scoped, Effect.provide(nodePlatform)),
  )
}

const CASES: [string, string, [string, number][]][] = [
  ['straight line', 'function f() { return 1 }', []],
  ['if', 'function f(x) { if (x) return 1 }', [['f', 1]]],
  [
    'else-if and else',
    'function f(x) { if (x) a(); else if (x.y) b(); else c() }',
    [['f', 3]],
  ],
  [
    'else-if and else stay flat under nesting',
    'function f(xs) { for (const x of xs) { if (x) a(); else if (x.y) b(); else c() } }',
    [['f', 5]],
  ],
  [
    'nesting',
    'function f(xs) { for (const x of xs) { if (x) a() } }',
    [['f', 3]],
  ],
  [
    'loop forms',
    'function f(xs) { for (;;) break; for (const x in xs) a(x); while (xs) break; do a(); while (xs) }',
    [['f', 4]],
  ],
  ['conditional', 'const f = x => x ? (x.y ? 1 : 2) : 3', [['f', 3]]],
  [
    'switch branches',
    'function f(x) { switch (x) { case 1: if (x) a(); break; default: b() } }',
    [['f', 3]],
  ],
  [
    'catch and finally',
    'function f() { try { a() } catch (e) { if (e) b() } finally { c() } }',
    [['f', 3]],
  ],
  [
    'logical runs',
    'function f(a,b,c,d) { return a && b && c || d && a }',
    [['f', 3]],
  ],
  [
    'nullish chain boundary',
    'function f(a,b,c,d) { return (a && b) ?? (c || d) }',
    [['f', 2]],
  ],
  ['nullish is free', 'const f = x => x?.y ?? 0', []],
  [
    'labeled jumps',
    'function f(xs) { outer: for (const x of xs) { if (x) continue outer; break outer } }',
    [['f', 5]],
  ],
  ['recursion counted once', 'function f() { f(); f() }', [['f', 1]]],
  ['arrow recursion', 'const f = () => f()', [['f', 1]]],
  ['assignment recursion', 'let f; f = () => f()', [['f', 1]]],
  ['method recursion', 'class A { f() { this.f(); this.f() } }', [['f', 1]]],
  ['object recursion', 'const a = { f() { this.f() } }', [['f', 1]]],
  ['method bare name is external', 'const a = { f() { f() } }', []],
  ['computed method is anonymous', 'const a = { ["f"]() { this.f() } }', []],
  [
    'literal property name',
    'const a = { "f": function() { this.f() } }',
    [['f', 1]],
  ],
  [
    'nested function counted in parent',
    'function f() { const g = x => { if (x) g(x) }; return g }',
    [['f', 3]],
  ],
  [
    'nested recursion frame isolation',
    'function f() { function g() { f() } return g }',
    [],
  ],
  ['constructor recursion', 'function F() { return new F() }', [['F', 1]]],
  [
    'anonymous function',
    'consume(x => { if (x) return 1 })',
    [['<anonymous>', 1]],
  ],
  ['class field recursion', 'class A { f = () => this.f() }', [['f', 1]]],
]

describe('cognitive complexity plugin', () => {
  it.each(CASES)('%s', async (_label, source, expected) => {
    await expect(diagnostics(source, 0)).resolves.toStrictEqual(expected)
  })

  it('only reports scores strictly above the configured maximum', async () => {
    const source = 'function f() { if (a) b(); if (c) d() }'
    await expect(diagnostics(source, 2)).resolves.toStrictEqual([])
    await expect(diagnostics(source, 1)).resolves.toStrictEqual([['f', 2]])
  })
})
