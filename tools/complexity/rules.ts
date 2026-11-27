import { Data, Effect } from 'effect'
import type { OxlintConfig } from 'vite-plus/lint'

const requiredRules = ['complexity', 'pbp/cognitive-complexity'] as const

class MissingComplexityRule extends Data.TaggedError('MissingComplexityRule')<{
  rule: (typeof requiredRules)[number]
}> {
  override get message() {
    return `tools/oxlint/config.ts does not configure ${this.rule}`
  }
}

// A missing entry would vanish from the JSON config and pass unchecked.
export function requireComplexityRules(rules: OxlintConfig['rules']) {
  return Effect.gen(function* collectRules() {
    const settings: Record<string, NonNullable<OxlintConfig['rules']>[string]> =
      {}
    for (const rule of requiredRules) {
      const setting = rules?.[rule]
      if (setting === undefined)
        return yield* new MissingComplexityRule({ rule })
      settings[rule] = setting
    }
    return settings
  })
}
