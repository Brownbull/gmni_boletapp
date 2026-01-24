import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: services (13 files)
 * All service tests except heavy ones (insightEngineService, pendingScanStorage)
 */
export default defineConfig(createGroupConfig('services', [
  'tests/unit/services/**/*.test.{ts,tsx}',
]))
