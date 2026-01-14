import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Heavy Test Group 2: Nav + useBatchProcessing
 * Story 14.30.8: Explicit heavy test grouping for predictable CI timing
 *
 * Total: ~2,269 lines
 * - Nav.test.tsx (1623 lines)
 * - useBatchProcessing.test.ts (646 lines)
 */
export default defineConfig(createGroupConfig('heavy-2', [
  'tests/unit/components/Nav.test.tsx',
  'tests/unit/hooks/useBatchProcessing.test.ts',
]))
