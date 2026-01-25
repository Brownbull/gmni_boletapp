import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: components-misc
 * Root-level component tests + modal components (~3,800 lines)
 * Includes root level tests and modals subdirectory (Story 14e-4: CreditInfoModal)
 * Excludes Nav.test.tsx (in heavy group) - must be explicit due to glob match
 */
export default defineConfig(createGroupConfig(
  'components-misc',
  [
    'tests/unit/components/*.test.{ts,tsx}',
    'tests/unit/components/modals/**/*.test.{ts,tsx}',
  ],
  [
    // HistoryViewThumbnails is in components-history
    'tests/unit/components/HistoryViewThumbnails.test.tsx',
    // Nav.test.tsx is in heavy group (1,623 lines) - explicit exclude needed
    // because glob pattern `*.test.{ts,tsx}` matches it
    'tests/unit/components/Nav.test.tsx',
  ]
))
