import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
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
