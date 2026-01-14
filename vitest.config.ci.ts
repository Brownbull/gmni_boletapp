import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vitest configuration optimized for CI environments
 *
 * Key optimizations:
 * - fileParallelism: true (parallel test execution within each shard)
 * - pool: 'threads' with optimized thread count
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
    // Enable parallelization - CI shards handle file distribution
    fileParallelism: true,
    // Use threads pool for better CI performance
    pool: 'threads',
    poolOptions: {
      threads: {
        // GitHub Actions runners have 2 cores, use all available
        maxThreads: 4,
        minThreads: 1,
      },
    },
    // Reduced reporter for faster CI output
    reporters: ['basic'],
    // Disable watch mode for CI
    watch: false,
  },
})
