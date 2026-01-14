import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

/**
 * Vitest configuration for HEAVY test files only
 *
 * These test files are significantly larger than others and cause shard imbalance.
 *
 * Tier 1 (1400-1700 lines each):
 * - tests/unit/hooks/useScanStateMachine.test.ts (1680 lines)
 * - tests/unit/components/Nav.test.tsx (1623 lines)
 * - tests/unit/services/insightEngineService.test.ts (1439 lines)
 * - tests/unit/utils/insightGenerators.test.ts (1432 lines)
 *
 * Tier 2 (800-1100 lines each):
 * - tests/unit/csvExport.test.ts (1061 lines)
 * - tests/unit/analytics/DrillDownCard.test.tsx (872 lines)
 * - tests/unit/analytics/DrillDownGrid.test.tsx (829 lines)
 * - tests/unit/components/session/SessionComplete.test.tsx (799 lines)
 * - tests/unit/services/pendingScanStorage.test.ts (786 lines)
 * - tests/unit/analytics/CategoryBreadcrumb.test.tsx (772 lines)
 *
 * Strategy:
 * - Run heavy tests in 4 dedicated jobs (sharded 1/4, 2/4, 3/4, 4/4)
 * - Regular shards exclude these files for balanced timing (~2-3 min each)
 *
 * This config is used by:
 * - CI: test-unit-heavy-1 through test-unit-heavy-4 jobs
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
    // Include all heavy test files (Tier 1 + Tier 2)
    include: [
      // Tier 1: 1400-1700 lines
      'tests/unit/hooks/useScanStateMachine.test.ts',
      'tests/unit/components/Nav.test.tsx',
      'tests/unit/services/insightEngineService.test.ts',
      'tests/unit/utils/insightGenerators.test.ts',
      // Tier 2: 800-1100 lines
      'tests/unit/csvExport.test.ts',
      'tests/unit/analytics/DrillDownCard.test.tsx',
      'tests/unit/analytics/DrillDownGrid.test.tsx',
      'tests/unit/components/session/SessionComplete.test.tsx',
      'tests/unit/services/pendingScanStorage.test.ts',
      'tests/unit/analytics/CategoryBreadcrumb.test.tsx',
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
