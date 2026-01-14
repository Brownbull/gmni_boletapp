import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: hooks (25 files)
 * All hook tests except heavy ones (useScanStateMachine)
 */
export default defineConfig(createGroupConfig('hooks', [
  'tests/unit/hooks/**/*.test.{ts,tsx}',
]))
