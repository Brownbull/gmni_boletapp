import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: managers
 * Manager tests (Zustand stores, orchestration logic)
 * Story 14e-1: Initial setup with Zustand verification tests
 * Story 14e-6d: Added src/features store tests (collocated test pattern)
 * Story 14e-8a: Added tests/unit/features for handler utility tests
 */
export default defineConfig(createGroupConfig(
  'managers',
  [
    'tests/unit/managers/**/*.test.{ts,tsx}',
    'src/features/**/store/__tests__/**/*.test.{ts,tsx}',
    'tests/unit/features/**/*.test.{ts,tsx}',
  ]
))
