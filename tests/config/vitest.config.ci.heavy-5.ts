import { defineConfig } from 'vitest/config'
import { createHeavyGroupConfig } from './vitest.config.ci.base'

/**
 * Heavy Test Group 5: csvExport + SessionComplete
 * Story 14.30.8: Explicit heavy test grouping for predictable CI timing
 *
 * Total: ~1,860 lines
 * - csvExport.test.ts (1061 lines)
 * - SessionComplete.test.tsx (799 lines)
 */
export default defineConfig(createHeavyGroupConfig('heavy-5', [
  'tests/unit/csvExport.test.ts',
  'tests/unit/components/session/SessionComplete.test.tsx',
]))
