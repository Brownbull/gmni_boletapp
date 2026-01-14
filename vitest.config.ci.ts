import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vitest configuration optimized for CI environments
 *
 * Key optimizations:
 * - pool: 'forks' - isolates each test file in separate process, prevents memory accumulation
 * - isolate: true - ensures complete isolation between tests
 * - maxConcurrency: 2 - limits parallel tests to reduce memory pressure
 * - Reduced reporter verbosity for faster output
 * - No coverage by default (separate job handles coverage)
 *
 * Used by:
 * - CI unit test shards (test-unit-1, test-unit-2, test-unit-3)
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './tests/setup/vitest.setup.ts',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    // Use forks pool to isolate each test file - prevents memory leaks
    pool: 'forks',
    poolOptions: {
      forks: {
        // Limit concurrent forks to reduce memory pressure (GitHub runners have 7GB RAM)
        maxForks: 2,
        minForks: 1,
        // Isolate each test file to prevent memory accumulation
        isolate: true,
      },
    },
    // Limit concurrent test files
    maxConcurrency: 2,
    // Reduced reporter for faster CI output (default is verbose)
    reporters: ['default'],
    // Disable watch mode for CI
    watch: false,
  },
})
