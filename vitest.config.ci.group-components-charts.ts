import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: components-charts
 * Charts and polygon components (~1,800 lines)
 */
export default defineConfig(createGroupConfig('components-charts', [
  'tests/unit/components/charts/**/*.test.{ts,tsx}',
  'tests/unit/components/polygon/**/*.test.{ts,tsx}',
]))
