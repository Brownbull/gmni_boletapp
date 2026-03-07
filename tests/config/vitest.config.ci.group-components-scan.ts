import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: components/scan + animation (21 files)
 * Scan and animation component tests
 */
export default defineConfig(createGroupConfig('components-scan', [
  'tests/unit/features/scan/components/**/*.test.{ts,tsx}',
  'tests/unit/components/animation/**/*.test.{ts,tsx}',
]))
