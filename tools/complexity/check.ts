import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { lint } from '../oxlint/config.ts'
import { requireComplexityRules } from './rules.ts'

// Include tracked tooling and tests even when application lint ignores them.
const files = execFileSync(
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
  { encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean)
const directory = mkdtempSync(join(tmpdir(), 'tower-defense-complexity-'))
const config = join(directory, '.oxlintrc.json')

try {
  writeFileSync(
    config,
    JSON.stringify({
      categories: { correctness: 'off' },
      jsPlugins: [
        { name: 'pbp', specifier: resolve('tools/oxlint-plugin/pbp.mjs') },
      ],
      rules: requireComplexityRules(lint.rules),
    }),
  )
  const result = spawnSync(
    process.execPath,
    [
      resolve('node_modules/oxlint/bin/oxlint'),
      '--config',
      config,
      '--no-ignore',
      ...files,
    ],
    { stdio: 'inherit' },
  )
  if (result.error) throw result.error
  if (result.signal) throw new Error(`Oxlint terminated by ${result.signal}`)
  process.exitCode = result.status ?? 1
} finally {
  rmSync(directory, { recursive: true, force: true })
}
