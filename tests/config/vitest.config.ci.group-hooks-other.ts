import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: hooks-other
 * All remaining hooks (~5,400 lines)
 * Excludes: batch hooks (hooks-batch), scan hooks (hooks-scan), useScanStateMachine (heavy)
 */
export default defineConfig(createGroupConfig(
  'hooks-other',
  ['tests/unit/hooks/**/*.test.{ts,tsx}'],
  [
    // Batch hooks (in hooks-batch group)
    'tests/unit/hooks/useBatchSession.test.ts',
    'tests/unit/hooks/useBatchReview.test.ts',
    'tests/unit/hooks/useBatchProcessing.test.ts',
    // Scan hooks (in hooks-scan group)
    'tests/unit/hooks/useScanState.test.ts',
    'tests/unit/hooks/useScanOverlayState.test.ts',
  ]
))
