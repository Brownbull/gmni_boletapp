import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: hooks-batch
 * Batch-related hooks (~1,500 lines, ~70 tests)
 */
export default defineConfig(createGroupConfig('hooks-batch', [
  'tests/unit/hooks/useBatchSession.test.ts',
  'tests/unit/hooks/useBatchReview.test.ts',
  'tests/unit/hooks/useBatchProcessing.test.ts',
]))
