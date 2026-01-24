import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: components-forms
 * Form-like components: items, settings, reports (~1,400 lines)
 */
export default defineConfig(createGroupConfig('components-forms', [
  'tests/unit/components/items/**/*.test.{ts,tsx}',
  'tests/unit/components/settings/**/*.test.{ts,tsx}',
  'tests/unit/components/reports/**/*.test.{ts,tsx}',
]))
