import { defineConfig } from 'vitest/config'
import { createGroupConfig } from './vitest.config.ci.base'

/**
 * Test Group: components/other (~35 files)
 * All remaining component tests (excluding insights, scan, batch, animation, session, Nav)
 */
export default defineConfig(createGroupConfig('components-other', [
  'tests/unit/components/*.test.{ts,tsx}',  // Root component files
  'tests/unit/components/settings/**/*.test.{ts,tsx}',
  'tests/unit/components/polygon/**/*.test.{ts,tsx}',
  'tests/unit/components/history/**/*.test.{ts,tsx}',
  'tests/unit/components/celebrations/**/*.test.{ts,tsx}',
  'tests/unit/components/reports/**/*.test.{ts,tsx}',
  'tests/unit/components/items/**/*.test.{ts,tsx}',
  'tests/unit/components/charts/**/*.test.{ts,tsx}',
  'tests/unit/components/analytics/**/*.test.{ts,tsx}',
]))
