// @vitest-environment node
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
    const rules = requireComplexityRules({
      complexity: cyclomatic,
      'pbp/cognitive-complexity': cognitive,
      'no-debugger': 'error',
    })
    expect(rules).toStrictEqual({
      complexity: cyclomatic,
      'pbp/cognitive-complexity': cognitive,
    })
  })

  it('fails when the cyclomatic rule is not configured', () => {
    expect(() =>
      requireComplexityRules({ 'pbp/cognitive-complexity': cognitive }),
    ).toThrow('does not configure complexity')
  })

  it('fails when the cognitive rule is not configured', () => {
    expect(() => requireComplexityRules({ complexity: cyclomatic })).toThrow(
      'pbp/cognitive-complexity',
    )
  })

  it('fails when the lint config has no rules', () => {
    expect(() => requireComplexityRules({})).toThrow(
      'does not configure complexity',
    )
  })
})
