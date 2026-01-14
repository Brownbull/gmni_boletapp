import { defineConfig, mergeConfig, UserConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

/**
 * Base Vitest configuration for CI environments
 *
 * Story 14.30.8: Explicit Test Groups
 * Instead of automatic sharding (--shard=1/5), we use explicit test groups
 * for predictable, debuggable CI runs.
 *
 * Key optimizations (from Story 14.30.7):
 * - fileParallelism: false - Prevents module cache bloat in parent process
 * - pool: 'forks' - Isolates each test file in separate process
 * - maxWorkers: 2 - Two parallel workers for speed while staying under memory limit
 * - isolate: true - Full isolation between tests
 *
 * Heavy tests are always excluded and run in dedicated jobs.
 *
 * @see vitest.config.ci.group-*.ts for individual group configs
 * @see vitest.config.heavy.ts for heavy test configuration
 */
export const baseCiConfig: UserConfig = {
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './tests/setup/vitest.setup.ts',
    // Heavy test files - always excluded, run in dedicated jobs
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // Tier 1: 1400-1700 lines each
      'tests/unit/hooks/useScanStateMachine.test.ts',
      'tests/unit/components/Nav.test.tsx',
      'tests/unit/services/insightEngineService.test.ts',
      'tests/unit/utils/insightGenerators.test.ts',
      // Tier 2: 800-1100 lines each
      'tests/unit/csvExport.test.ts',
      'tests/unit/analytics/DrillDownCard.test.tsx',
      'tests/unit/analytics/DrillDownGrid.test.tsx',
      'tests/unit/components/session/SessionComplete.test.tsx',
      'tests/unit/services/pendingScanStorage.test.ts',
      'tests/unit/analytics/CategoryBreadcrumb.test.tsx',
      // Tier 3: 500-700 lines (Story 14.30.8)
      'tests/unit/hooks/useBatchProcessing.test.ts',
      'tests/unit/hooks/useBatchReview.test.ts',
    ],
    // Memory-safe execution settings
    fileParallelism: false,
    pool: 'forks',
    maxWorkers: 2,
    isolate: true,
    reporters: ['dot'],
    watch: false,
    // Coverage configuration
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
}

/**
 * Helper to create a group-specific config
 * @param groupName - Name for the test group
 * @param includePatterns - Glob patterns to include
 * @param additionalExclude - Additional patterns to exclude (on top of heavy files)
 */
export function createGroupConfig(
  groupName: string,
  includePatterns: string[],
  additionalExclude?: string[]
): UserConfig {
  const config: UserConfig = {
    test: {
      name: groupName,
      include: includePatterns,
    },
  }

  if (additionalExclude && additionalExclude.length > 0) {
    config.test!.exclude = [
      ...baseCiConfig.test!.exclude as string[],
      ...additionalExclude,
    ]
  }

  return mergeConfig(baseCiConfig, config)
}

export default defineConfig(baseCiConfig)
