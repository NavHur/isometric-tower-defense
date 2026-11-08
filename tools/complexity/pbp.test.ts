// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

function diagnostics(source: string, max: number) {
  const directory = mkdtempSync(join(tmpdir(), 'pbp-characterization-'))
  const input = join(directory, 'input.js')
  const config = join(directory, '.oxlintrc.json')
  try {
    writeFileSync(input, source)
    writeFileSync(
      config,
      JSON.stringify({
        categories: { correctness: 'off' },
        jsPlugins: [
          {
            name: 'pbp',
            specifier: resolve('tools/oxlint-plugin/pbp.mjs'),
          },
        ],
        rules: { 'pbp/cognitive-complexity': ['error', { max }] },
      }),
    )
    const result = spawnSync(
      process.execPath,
      [
        resolve('node_modules/oxlint/bin/oxlint'),
        '--config',
        config,
        '--format',
        'json',
        input,
      ],
      { encoding: 'utf8' },
    )
    expect(result.error).toBeUndefined()
    expect([0, 1]).toContain(result.status)
    expect(result.stderr).toBe('')
    return Array.from(
      result.stdout.matchAll(
        /Function `(?<name>.*?)` has cognitive complexity (?<score>\d+)/gu,
      ),
      ([, name, value]) => [name, Number(value)],
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
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
  it.each(CASES)('%s', (_label, source, expected) => {
    expect(diagnostics(source, 0)).toStrictEqual(expected)
  })

  it('only reports scores strictly above the configured maximum', () => {
    const source = 'function f() { if (a) b(); if (c) d() }'
    expect(diagnostics(source, 2)).toStrictEqual([])
    expect(diagnostics(source, 1)).toStrictEqual([['f', 2]])
  })
})
