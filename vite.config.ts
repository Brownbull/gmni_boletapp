import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'
import pkg from './package.json'

// https://vitejs.dev/config/
// Note: Using vitest/config for defineConfig to support test configuration
export default defineConfig({
  // Inject app version from package.json at build time
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      // Use injectManifest to allow custom service worker with push handlers
      // Story 14c.13: VAPID web push notifications
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gastify',
        short_name: 'Gastify',
        description: 'Smart expense tracking with AI receipt scanning',
        theme_color: '#2d3a4a', // Night blue - matches Normal theme primary
        background_color: '#f5f0e8', // Warm cream - matches Normal theme bg
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Increase max file size limit for PWA precache (4MB to accommodate growing bundle)
        // TODO Epic 15: Implement code-splitting to reduce bundle size below 2MB
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
      }
    })
  ],
  server: {
    port: 5174,
  },
  preview: {
    port: 4175,
  },
  // Story 14e-9b: Explicit path aliases for test files in tests/ directory
  // tsconfig.json has include: ['src'], so tsconfigPaths doesn't resolve paths for test files
  // These aliases ensure imports like @/contexts/AuthContext work in tests/setup/test-utils.tsx
  resolve: {
    alias: {
      'virtual:pwa-register/react': path.resolve(__dirname, 'tests/mocks/pwa-register.ts'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@managers': path.resolve(__dirname, 'src/managers'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@helpers': path.resolve(__dirname, 'tests/helpers'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './tests/setup/vitest.setup.ts',
    // Run test files sequentially to avoid Firebase emulator race conditions
    // Integration tests share the same emulator instance and can interfere with each other
    fileParallelism: false,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/e2e/**', // Exclude Playwright E2E tests (use Playwright runner instead)
      // Exclude Cloud Functions tests - they use Jest syntax and firebase-functions-test
      'functions/src/__tests__/**',
      'functions/lib/**', // Compiled JS shouldn't be run as tests
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'json-summary', 'lcov'],
      exclude: [
        'tests/**',
        'scripts/**',
        '**/*.config.ts',
        '**/*.config.js',
        '**/node_modules/**',
        '**/dist/**',
      ],
      // Coverage thresholds - CI will fail if below these values
      // Story 3.7: Coverage enforcement infrastructure
      // Note: Vitest measures coverage only for files imported by tests
      // Baseline (2025-11-26): ~51% lines, ~38% branches, ~30% functions, ~46% statements
      // Thresholds set 5-10% below baseline to allow for variance while catching regressions
      // Future improvement: Raise thresholds as test coverage improves
      thresholds: {
        lines: 45,
        branches: 30,
        functions: 25,
        statements: 40,
      },
    },
  },
})
