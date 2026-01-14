import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Heavy Test Group 4: insightGenerators + pendingScanStorage
 * Story 14.30.8: Explicit heavy test grouping for predictable CI timing
 *
 * Total: ~2,218 lines
 * - insightGenerators.test.ts (1432 lines)
 * - pendingScanStorage.test.ts (786 lines)
 */
export default defineConfig(createGroupConfig('heavy-4', [
  'tests/unit/utils/insightGenerators.test.ts',
  'tests/unit/services/pendingScanStorage.test.ts',
]))
