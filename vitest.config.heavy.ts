import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

/**
 * Vitest configuration for HEAVY test files only
 *
 * These 4 test files are significantly larger than others (~1400-1700 lines each)
 * and cause shard imbalance when mixed with regular tests.
 *
 * Heavy test files:
 * - tests/unit/hooks/useScanStateMachine.test.ts (1680 lines)
 * - tests/unit/components/Nav.test.tsx (1623 lines)
 * - tests/unit/services/insightEngineService.test.ts (1439 lines)
 * - tests/unit/utils/insightGenerators.test.ts (1432 lines)
 *
 * Strategy:
 * - Run heavy tests in dedicated jobs (2 files each)
 * - Regular shards exclude these files for balanced timing
 *
 * This config is used by:
 * - CI: test-unit-heavy-1 and test-unit-heavy-2 jobs
 *
 * @see Story 14.30.6: Heavy test isolation
 */
export default defineConfig({
  plugins: [react()],
  // Define global constants (same as vite.config.ts)
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './tests/setup/vitest.setup.ts',
    // Only include the 4 heavy test files
    include: [
      'tests/unit/hooks/useScanStateMachine.test.ts',
      'tests/unit/components/Nav.test.tsx',
      'tests/unit/services/insightEngineService.test.ts',
      'tests/unit/utils/insightGenerators.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    // Use forks pool to isolate each test file - prevents memory leaks
    pool: 'forks',
    poolOptions: {
      forks: {
        // Limit concurrent forks to reduce memory pressure
        maxForks: 2,
        minForks: 1,
        isolate: true,
      },
    },
    // Limit concurrent test files
    maxConcurrency: 2,
    // Reduced reporter for faster CI output
    reporters: ['default'],
    // Disable watch mode for CI
    watch: false,
    // Coverage configuration (activated with --coverage flag)
    coverage: {
      provider: 'v8',
      reporter: ['json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/vite-env.d.ts',
      ],
    },
  },
})
