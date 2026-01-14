import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: analytics (12 files)
 * All analytics tests except heavy ones (DrillDownCard, DrillDownGrid, CategoryBreadcrumb)
 */
export default defineConfig(createGroupConfig('analytics', [
  'tests/unit/analytics/**/*.test.{ts,tsx}',
]))
