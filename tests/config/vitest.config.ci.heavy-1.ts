import { defineConfig } from 'vitest/config'
import { createHeavyGroupConfig } from './vitest.config.ci.base'

/**
 * Heavy Test Group 1: useBatchReviewHandlers + useBatchReview
 * Story 14.30.8: Explicit heavy test grouping for predictable CI timing
 * Story 15b: Tests moved to features/batch-review/hooks/, useScanStateMachine decomposed
 *
 * Total: ~1,493 lines
 * - useBatchReviewHandlers.test.ts (901 lines)
 * - useBatchReview.test.ts (592 lines)
 */
export default defineConfig(createHeavyGroupConfig('heavy-1', [
  'tests/unit/features/batch-review/hooks/useBatchReviewHandlers.test.ts',
  'tests/unit/features/batch-review/hooks/useBatchReview.test.ts',
]))
