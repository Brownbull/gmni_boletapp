import { defineConfig } from 'vitest/config'
import { createHeavyGroupConfig } from './vitest.config.ci.base'

/**
 * Heavy Test Group 6: DrillDownCard + DrillDownGrid
 * Story 14.30.8: Explicit heavy test grouping for predictable CI timing
 *
 * Total: ~1,701 lines
 * - DrillDownCard.test.tsx (872 lines)
 * - DrillDownGrid.test.tsx (829 lines)
 */
export default defineConfig(createHeavyGroupConfig('heavy-6', [
  'tests/unit/analytics/DrillDownCard.test.tsx',
  'tests/unit/analytics/DrillDownGrid.test.tsx',
]))
