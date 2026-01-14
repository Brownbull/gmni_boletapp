import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: utils (23 files)
 * All utility tests except heavy ones (insightGenerators)
 */
export default defineConfig(createGroupConfig('utils', [
  'tests/unit/utils/**/*.test.{ts,tsx}',
]))
