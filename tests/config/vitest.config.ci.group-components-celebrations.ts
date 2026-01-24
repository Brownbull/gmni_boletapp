import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: components-celebrations
 * Celebrations and analytics components (~1,500 lines)
 */
export default defineConfig(createGroupConfig('components-celebrations', [
  'tests/unit/components/celebrations/**/*.test.{ts,tsx}',
  'tests/unit/components/analytics/**/*.test.{ts,tsx}',
]))
