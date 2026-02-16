import { defineConfig, mergeConfig, UserConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'
import pkg from '../../package.json'

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
  plugins: [react(), tsconfigPaths()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // Story 14.42: Alias for virtual PWA module that only exists during Vite build
  // Story 14e-11: Explicit path aliases for test files (tsconfig.json include only covers src/)
  resolve: {
    alias: {
      'virtual:pwa-register/react': path.resolve(__dirname, '../mocks/pwa-register.ts'),
      '@features': path.resolve(__dirname, '../../src/features'),
      '@entities': path.resolve(__dirname, '../../src/entities'),
      '@managers': path.resolve(__dirname, '../../src/managers'),
      '@shared': path.resolve(__dirname, '../../src/shared'),
      '@app': path.resolve(__dirname, '../../src/app'),
      '@helpers': path.resolve(__dirname, '../helpers'),
      '@': path.resolve(__dirname, '../../src'),
    },
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
      'tests/unit/components/Nav.test.tsx',
      'tests/unit/features/insights/services/insightEngineService.test.ts',
      'tests/unit/features/insights/utils/insightGenerators.test.ts',
      // Tier 2: 800-1100 lines each
      'tests/unit/csvExport.test.ts',
      'tests/unit/analytics/DrillDownCard.test.tsx',
      'tests/unit/analytics/DrillDownGrid.test.tsx',
      'tests/unit/components/session/SessionComplete.test.tsx',
      'tests/unit/services/pendingScanStorage.test.ts',
      'tests/unit/analytics/CategoryBreadcrumb.test.tsx',
      // Tier 3: 500-900 lines (Story 14.30.8, paths updated Story 15b)
      'tests/unit/features/batch-review/hooks/useBatchProcessing.test.ts',
      'tests/unit/features/batch-review/hooks/useBatchReview.test.ts',
      'tests/unit/features/batch-review/hooks/useBatchReviewHandlers.test.ts',
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

/**
 * Helper to create a heavy group config (doesn't exclude heavy files)
 * Story 14.30.8: Heavy tests need their own config without the heavy excludes
 */
export function createHeavyGroupConfig(
  groupName: string,
  includePatterns: string[]
): UserConfig {
  // Create a clean config for heavy tests - explicitly set all properties
  // to avoid inheriting heavy file excludes from baseCiConfig
  const heavyBaseConfig: UserConfig = {
    plugins: baseCiConfig.plugins,
    define: baseCiConfig.define,
    resolve: baseCiConfig.resolve, // Story 14e-11: Include path aliases for test files
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: './tests/setup/vitest.setup.ts',
      name: groupName,
      include: includePatterns,
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
      ],
      // Heavy tests run with single worker to prevent memory issues
      fileParallelism: false,
      pool: 'forks',
      maxWorkers: 1,
      isolate: true,
      reporters: ['dot'],
      watch: false,
      coverage: baseCiConfig.test?.coverage,
    },
  }

  return heavyBaseConfig
}

export default defineConfig(baseCiConfig)
