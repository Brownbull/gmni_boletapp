import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: hooks-scan
 * Scan-related hooks (~2,564 lines)
 * Story 15b-1i: Tests moved to features/scan/hooks/
 * Story 15b: Added useScanInitiation (was missing from CI)
 */
export default defineConfig(createGroupConfig('hooks-scan', [
  'tests/unit/features/scan/hooks/useScanState.test.ts',
  'tests/unit/features/scan/hooks/useScanOverlayState.test.ts',
  'tests/unit/features/scan/hooks/useScanHandlers.test.ts',
  'tests/unit/features/scan/hooks/useScanInitiation.test.ts',
]))
