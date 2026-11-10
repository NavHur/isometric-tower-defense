import type { OxlintConfig } from 'vite-plus/lint'

const requiredRules = ['complexity', 'pbp/cognitive-complexity'] as const

// A missing entry would vanish from the JSON config and pass unchecked.
export function requireComplexityRules(rules: OxlintConfig['rules']) {
  return Object.fromEntries(
    requiredRules.map((name) => {
      const setting = rules?.[name]
      if (setting === undefined) {
        throw new Error(`tools/oxlint/config.ts does not configure ${name}`)
      }
      return [name, setting]
    }),
  )
}
