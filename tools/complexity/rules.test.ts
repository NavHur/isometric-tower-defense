// @vitest-environment node
import { Effect } from 'effect'
import { describe, expect, it } from 'vite-plus/test'
import { requireComplexityRules } from './rules.ts'

import type { OxlintConfig } from 'vite-plus/lint'

type Rules = NonNullable<OxlintConfig['rules']>

const cyclomatic: Rules['complexity'] = [
  'error',
  { max: 18, variant: 'classic' },
]
const cognitive: Rules['pbp/cognitive-complexity'] = ['error', { max: 6 }]

describe('requireComplexityRules', () => {
  it('returns the cyclomatic and cognitive settings', () => {
    const rules = Effect.runSync(
      requireComplexityRules({
        complexity: cyclomatic,
        'pbp/cognitive-complexity': cognitive,
        'no-debugger': 'error',
      }),
    )
    expect(rules).toStrictEqual({
      complexity: cyclomatic,
      'pbp/cognitive-complexity': cognitive,
    })
  })

  it.each([
    [{ 'pbp/cognitive-complexity': cognitive }, 'complexity'],
    [{ complexity: cyclomatic }, 'pbp/cognitive-complexity'],
    [{}, 'complexity'],
  ] as const)('identifies the missing rule in %o', (rules, rule) => {
    const failure = Effect.flip(requireComplexityRules(rules))
    expect(Effect.runSync(failure)).toMatchObject({
      _tag: 'MissingComplexityRule',
      rule,
    })
  })
})
