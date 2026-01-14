import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Heavy Test Group 3: insightEngineService + CategoryBreadcrumb
 * Story 14.30.8: Explicit heavy test grouping for predictable CI timing
 *
 * Total: ~2,211 lines
 * - insightEngineService.test.ts (1439 lines)
 * - CategoryBreadcrumb.test.tsx (772 lines)
 */
export default defineConfig(createGroupConfig('heavy-3', [
  'tests/unit/services/insightEngineService.test.ts',
  'tests/unit/analytics/CategoryBreadcrumb.test.tsx',
]))
