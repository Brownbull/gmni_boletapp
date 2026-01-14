import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Heavy Test Group 1: useScanStateMachine + useBatchReview
 * Story 14.30.8: Explicit heavy test grouping for predictable CI timing
 *
 * Total: ~2,272 lines
 * - useScanStateMachine.test.ts (1680 lines)
 * - useBatchReview.test.ts (592 lines)
 */
export default defineConfig(createGroupConfig('heavy-1', [
  'tests/unit/hooks/useScanStateMachine.test.ts',
  'tests/unit/hooks/useBatchReview.test.ts',
]))
