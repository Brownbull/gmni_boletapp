import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Boletapp',
        short_name: 'Boletapp',
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
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't cache API calls - only static assets
        // Firebase SDK handles its own caching
        runtimeCaching: []
      }
    })
  ],
  server: {
    port: 5174,
  },
  preview: {
    port: 4175,
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
