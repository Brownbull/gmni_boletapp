import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: hooks-other
 * All remaining hooks in tests/unit/hooks/ (~5,400 lines)
 * Story 15b: Batch hooks moved to features/batch-review/hooks/, scan hooks to features/scan/hooks/
 * This glob now only captures hooks that remain in the flat directory.
 */
export default defineConfig(createGroupConfig(
  'hooks-other',
  ['tests/unit/hooks/**/*.test.{ts,tsx}'],
))
