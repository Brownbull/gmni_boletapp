import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: hooks-scan
 * Scan-related hooks (~1,200 lines, ~50 tests)
 * Note: useScanStateMachine is in heavy group
 */
export default defineConfig(createGroupConfig('hooks-scan', [
  'tests/unit/hooks/useScanState.test.ts',
  'tests/unit/hooks/useScanStateBridge.test.ts',
  'tests/unit/hooks/useScanOverlayState.test.ts',
]))
