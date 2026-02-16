import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: hooks-other
 * All remaining hooks (~5,400 lines)
 * Excludes: batch hooks (hooks-batch), useScanStateMachine (heavy)
 * Story 15b-1i: Scan hooks moved to features/scan/hooks/ (no longer in this glob)
 */
export default defineConfig(createGroupConfig(
  'hooks-other',
  ['tests/unit/hooks/**/*.test.{ts,tsx}'],
  [
    // Batch hooks (in hooks-batch group)
    'tests/unit/hooks/useBatchSession.test.ts',
    'tests/unit/hooks/useBatchReview.test.ts',
    'tests/unit/hooks/useBatchProcessing.test.ts',
  ]
))
