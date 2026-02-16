import { defineConfig } from 'vitest/config'
import { createHeavyGroupConfig } from './vitest.config.ci.base'

/**
 * Heavy Test Group 2: Nav + useBatchProcessing
 * Story 14.30.8: Explicit heavy test grouping for predictable CI timing
 *
 * Total: ~2,282 lines
 * - Nav.test.tsx (1623 lines)
 * - useBatchProcessing.test.ts (659 lines)
 * Story 15b: useBatchProcessing moved to features/batch-review/hooks/
 */
export default defineConfig(createHeavyGroupConfig('heavy-2', [
  'tests/unit/components/Nav.test.tsx',
  'tests/unit/features/batch-review/hooks/useBatchProcessing.test.ts',
]))
