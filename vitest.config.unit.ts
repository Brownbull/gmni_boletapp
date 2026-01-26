import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'
import pkg from './package.json'

/**
 * Vitest configuration for UNIT tests only
 *
 * Key difference from main config:
 * - fileParallelism: true (unit tests don't share state)
 * - maxWorkers: uses available CPU cores for speed
 *
 * This config is used by:
 * - npm run test:unit:fast (quick validation during development)
 * - npm run test:unit:parallel (full unit tests with parallelization)
 *
 * Story 14e-5: Added tsconfigPaths() for @managers/*, @/* path aliases
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  // Define global constants (same as vite.config.ts)
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // Story 14.42: Alias for virtual PWA module that only exists during Vite build
  // Story 14e-9a: Explicit path aliases for test files (tsconfig.json include only covers src/)
  resolve: {
    alias: {
      'virtual:pwa-register/react': path.resolve(__dirname, 'tests/mocks/pwa-register.ts'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@managers': path.resolve(__dirname, 'src/managers'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './tests/setup/vitest.setup.ts',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    // Enable parallelization for unit tests (no shared state)
    fileParallelism: true,
    // Use pool threads for better performance
    pool: 'threads',
    poolOptions: {
      threads: {
        // Use half of available cores to avoid overwhelming the system
        maxThreads: 6,
        minThreads: 2,
      },
    },
  },
})
