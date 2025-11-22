import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'tests/**',
        'scripts/**',
        '**/*.config.ts',
        '**/*.config.js',
        '**/node_modules/**',
        '**/dist/**',
      ],
    },
  },
})
