import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: components-history
 * History-related components (~1,200 lines)
 */
export default defineConfig(createGroupConfig('components-history', [
  'tests/unit/components/history/**/*.test.{ts,tsx}',
  'tests/unit/components/HistoryViewThumbnails.test.tsx',
]))
