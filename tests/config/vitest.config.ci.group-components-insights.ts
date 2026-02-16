import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: components/insights (17 files)
 * Insights-related component tests
 */
export default defineConfig(createGroupConfig('components-insights', [
  'tests/unit/features/insights/components/**/*.test.{ts,tsx}',
]))
