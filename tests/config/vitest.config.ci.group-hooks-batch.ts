import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: hooks-batch
 * Batch-related hooks (non-heavy) (~673 lines)
 * Note: useBatchProcessing, useBatchReview, useBatchReviewHandlers in heavy groups (Story 14.30.8)
 * Story 15b: Tests moved to features/batch-review/hooks/
 */
export default defineConfig(createGroupConfig('hooks-batch', [
  'tests/unit/features/batch-review/hooks/useBatchSession.test.ts',
  'tests/unit/features/batch-review/hooks/useBatchCapture.test.ts',
  'tests/unit/features/batch-review/hooks/useAtomicBatchActions.test.ts',
]))
