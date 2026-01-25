import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: managers
 * Manager tests (Zustand stores, orchestration logic)
 * Story 14e-1: Initial setup with Zustand verification tests
 */
export default defineConfig(createGroupConfig(
  'managers',
  ['tests/unit/managers/**/*.test.{ts,tsx}']
))
