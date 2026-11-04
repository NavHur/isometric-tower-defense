import { defineConfig, lazyPlugins } from 'vite-plus'
import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { lint } from './tools/oxlint/config.ts'

// https://viteplus.dev/config/
export default defineConfig({
  lint,
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['tests/**', 'node_modules/**', 'dist/**'],
  },
  fmt: {
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
    printWidth: 80,
    sortPackageJson: false,
    ignorePatterns: [
      'dist',
      'node_modules',
      'playwright-report',
      'test-results',
      'bun.lock',
      'tools/oxlint-plugin',
    ],
  },
  // The unit tests run in jsdom; the Worker runtime would claim Vitest's server.
  plugins: lazyPlugins(() => [
    react(),
    process.env.VITEST === undefined ? cloudflare() : [],
  ]),
})
