import type { OxlintConfig } from 'vite-plus/lint'

/**
 * Every category except restriction and nursery runs at error. The rules
 * turned off below either fight another enabled rule or the stack (React's
 * JSX transform, react-three-fiber's props, three.js's mutable types), or
 * flag hundreds of lines of house style with no defect behind them.
 */
const offRules = {
  // The automatic JSX runtime needs no React import.
  'react/react-in-jsx-scope': 'off',
  // react-three-fiber elements take three.js props React does not know.
  'react/no-unknown-property': 'off',
  // three.js objects are mutable by design; readonly params fight every call.
  'typescript/prefer-readonly-parameter-types': 'off',
  // three.js and React use null as their empty value.
  'unicorn/no-null': 'off',
  // Named exports throughout; these pull the other way.
  'import/no-named-export': 'off',
  'import/prefer-default-export': 'off',
  'import/group-exports': 'off',
  'import/exports-last': 'off',
  // Game tuning lives in src/game/config; inline geometry numbers stay inline.
  'no-magic-numbers': 'off',
  // House style the codebase does not follow, with no defect behind it.
  'capitalized-comments': 'off',
  curly: 'off',
  'func-style': 'off',
  'id-length': 'off',
  'max-statements': 'off',
  'no-ternary': 'off',
  'one-var': 'off',
  'sort-imports': 'off',
  'sort-keys': 'off',
  'react/jsx-max-depth': 'off',
  'unicorn/filename-case': 'off',
  // Tests import their globals from vitest (prefer-importing-vitest-globals).
  'vitest/no-importing-vitest-globals': 'off',
  // Two suites reset the shared store in beforeEach; setup.ts runs afterEach(cleanup).
  'vitest/no-hooks': 'off',
  // Suites keep a plain title naming the function or component under test.
  'vitest/prefer-describe-function-title': 'off',
  // Every test would need an assertion count its straight-line expects already imply.
  'vitest/prefer-expect-assertions': 'off',
  // Only src/main.tsx trips it: the app entry renders at module scope.
  'vitest/require-hook': 'off',
  // prefer-strict-boolean-matchers asks for toBe(true) instead.
  'vitest/prefer-to-be-falsy': 'off',
  'vitest/prefer-to-be-truthy': 'off',
  // prefer-called-times covers the same calls.
  'vitest/prefer-called-once': 'off',
  // Wrapping callback APIs needs `new Promise`.
  'promise/avoid-new': 'off',
} as const satisfies OxlintConfig['rules']

/** Restriction rules worth having; the category as a whole bans async, `?.` and spread. */
const restrictionRules = {
  'default-case': 'error',
  eqeqeq: 'error',
  'no-alert': 'error',
  'no-console': 'error',
  'no-empty': 'error',
  'no-empty-function': 'error',
  'no-param-reassign': 'error',
  'no-sequences': 'error',
  'no-var': 'error',
  'no-void': ['error', { allowAsStatement: true }],
  'import/no-cycle': 'error',
  'promise/catch-or-return': 'error',
  'react/button-has-type': 'error',
  'react/no-danger': 'error',
  'typescript/no-dynamic-delete': 'error',
  'typescript/no-explicit-any': 'error',
  'typescript/no-non-null-assertion': 'error',
  'typescript/no-non-null-asserted-nullish-coalescing': 'error',
  'typescript/use-unknown-in-catch-callback-variable': 'error',
  'unicorn/no-abusive-eslint-disable': 'error',
  'unicorn/no-array-for-each': 'error',
  'unicorn/no-array-reduce': 'error',
  'unicorn/prefer-modern-math-apis': 'error',
  'unicorn/prefer-node-protocol': 'error',
  'unicorn/prefer-number-properties': 'error',
} as const satisfies OxlintConfig['rules']

/** React Compiler checks, carried over from the ESLint react-hooks preset. */
const reactCompilerRules = {
  'react/rules-of-hooks': 'error',
  'react/exhaustive-deps': 'error',
  'react/static-components': 'error',
  'react/use-memo': 'error',
  'react/preserve-manual-memoization': 'error',
  'react/incompatible-library': 'error',
  'react/immutability': 'error',
  'react/globals': 'error',
  'react/refs': 'error',
  'react/set-state-in-effect': 'error',
  'react/error-boundaries': 'error',
  'react/purity': 'error',
  'react/set-state-in-render': 'error',
  'react/unsupported-syntax': 'error',
  'react/only-export-components': ['error', { allowConstantExport: true }],
} as const satisfies OxlintConfig['rules']

/** The Oxlint config `vp lint` and `vp check` run, type-aware through tsgolint. */
export const lint: OxlintConfig = {
  plugins: [
    'oxc',
    'typescript',
    'unicorn',
    'import',
    'react',
    'jsx-a11y',
    'vitest',
    'promise',
  ],
  categories: {
    correctness: 'error',
    suspicious: 'error',
    perf: 'error',
    pedantic: 'error',
    style: 'error',
  },
  env: { builtin: true, browser: true },
  ignorePatterns: [
    'dist',
    'playwright-report',
    'test-results',
    // Vendored from fleet's pedro-best-practices skill; see its header.
    'tools/oxlint-plugin',
  ],
  jsPlugins: [
    { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
    { name: 'pbp', specifier: './tools/oxlint-plugin/pbp.mjs' },
  ],
  rules: {
    ...offRules,
    ...restrictionRules,
    ...reactCompilerRules,
    complexity: ['error', { max: 16, variant: 'classic' }],
    'pbp/cognitive-complexity': ['error', { max: 8 }],
    'typescript/no-confusing-void-expression': [
      'error',
      { ignoreArrowShorthand: true },
    ],
    // Type-only imports sit on their own line (consistent-type-specifier-style).
    'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
    'import/no-unassigned-import': [
      'error',
      { allow: ['**/*.css', '@testing-library/jest-dom/vitest'] },
    ],
    // Top-level suites keep the name of the component or function they test.
    'vitest/prefer-lowercase-title': [
      'error',
      { ignoreTopLevelDescribe: true },
    ],
    'vite-plus/prefer-vite-plus-imports': 'error',
  },
  overrides: [
    {
      // A describe block holds a file's tests; its length is not a smell.
      files: ['**/*.test.{ts,tsx}', 'tests/**'],
      rules: { 'max-lines-per-function': 'off' },
    },
    {
      // The setup file registers a global afterEach(cleanup); it has no suite.
      files: ['src/test/setup.ts'],
      rules: { 'vitest/require-top-level-describe': 'off' },
    },
    {
      files: ['*.config.ts', 'tools/**', 'tests/**'],
      env: { browser: false, node: true },
    },
    {
      // Playwright specs, which the vitest plugin mistakes for its own.
      files: ['tests/**'],
      rules: {
        'vitest/consistent-test-filename': 'off',
        'vitest/prefer-importing-vitest-globals': 'off',
      },
    },
  ],
  options: { typeAware: true, typeCheck: true },
}
