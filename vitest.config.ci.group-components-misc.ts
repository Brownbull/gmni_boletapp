import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: components-misc
 * Root-level component tests (~3,500 lines)
 * Excludes Nav.test.tsx (in heavy group)
 */
export default defineConfig(createGroupConfig(
  'components-misc',
  ['tests/unit/components/*.test.{ts,tsx}'],
  [
    // HistoryViewThumbnails is in components-history
    'tests/unit/components/HistoryViewThumbnails.test.tsx',
  ]
))
