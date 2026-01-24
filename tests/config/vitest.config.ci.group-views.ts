import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: views + root (16 files)
 * All view tests plus root-level test files
 */
export default defineConfig(createGroupConfig('views', [
  'tests/unit/views/**/*.test.{ts,tsx}',
  'tests/unit/*.test.{ts,tsx}',  // Root level files
  'tests/unit/types/**/*.test.{ts,tsx}',
  'tests/unit/config/**/*.test.{ts,tsx}',
  'tests/unit/lib/**/*.test.{ts,tsx}',
  'tests/unit/contexts/**/*.test.{ts,tsx}',
]))
