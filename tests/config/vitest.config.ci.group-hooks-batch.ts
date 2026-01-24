import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: hooks-batch
 * Batch-related hooks (~250 lines, ~15 tests)
 * Note: useBatchProcessing.test.ts and useBatchReview.test.ts moved to heavy group (Story 14.30.8)
 */
export default defineConfig(createGroupConfig('hooks-batch', [
  'tests/unit/hooks/useBatchSession.test.ts',
]))
