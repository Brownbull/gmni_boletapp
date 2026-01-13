/**
 * FAB Colors Configuration Tests
 *
 * Story 14d.8: FAB Visual States
 *
 * Tests for the color scheme helper functions that determine:
 * - AC#1-5: Mode colors (single=green, batch=amber, statement=violet, error=red)
 * - AC#11-14: Shine animation triggers
 * - AC#18: Pulse animation for batch reviewing
 */

import { describe, it, expect } from 'vitest'
import {
  FAB_COLORS,
  getFABColorScheme,
  shouldShowShineAnimation,
  shouldShowPulseAnimation,
} from '../../../src/config/fabColors'

describe('FAB Colors Configuration', () => {
  describe('FAB_COLORS constant', () => {
    it('should define single mode colors with primary gradient', () => {
      expect(FAB_COLORS.single.gradient).toContain('var(--primary)')
      expect(FAB_COLORS.single.text).toBe('text-white')
      expect(FAB_COLORS.single.iconColor).toBe('white')
    })

    it('should define batch mode colors with amber gradient', () => {
      expect(FAB_COLORS.batch.gradient).toContain('#fbbf24')
      expect(FAB_COLORS.batch.gradient).toContain('#f59e0b')
      expect(FAB_COLORS.batch.text).toBe('text-white')
    })

    it('should define statement mode colors with violet gradient', () => {
      expect(FAB_COLORS.statement.gradient).toContain('#8b5cf6')
      expect(FAB_COLORS.statement.gradient).toContain('#7c3aed')
      expect(FAB_COLORS.statement.text).toBe('text-white')
    })

    it('should define error colors with red gradient', () => {
      expect(FAB_COLORS.error.gradient).toContain('#ef4444')
      expect(FAB_COLORS.error.gradient).toContain('#dc2626')
      expect(FAB_COLORS.error.text).toBe('text-white')
    })
  })

  describe('getFABColorScheme', () => {
    describe('AC#1: Single mode uses emerald/green', () => {
      it('should return single colors for single mode at idle', () => {
        const scheme = getFABColorScheme('single', 'idle')
        expect(scheme).toBe(FAB_COLORS.single)
      })

      it('should return single colors for single mode at capturing', () => {
        const scheme = getFABColorScheme('single', 'capturing')
        expect(scheme).toBe(FAB_COLORS.single)
      })

      it('should return single colors for single mode at scanning', () => {
        const scheme = getFABColorScheme('single', 'scanning')
        expect(scheme).toBe(FAB_COLORS.single)
      })
    })

    describe('AC#2: Batch mode uses amber/orange', () => {
      it('should return batch colors for batch mode at idle', () => {
        const scheme = getFABColorScheme('batch', 'idle')
        expect(scheme).toBe(FAB_COLORS.batch)
      })

      it('should return batch colors for batch mode at capturing', () => {
        const scheme = getFABColorScheme('batch', 'capturing')
        expect(scheme).toBe(FAB_COLORS.batch)
      })

      it('should return batch colors for batch mode at scanning', () => {
        const scheme = getFABColorScheme('batch', 'scanning')
        expect(scheme).toBe(FAB_COLORS.batch)
      })

      it('should return batch colors for batch mode at reviewing', () => {
        const scheme = getFABColorScheme('batch', 'reviewing')
        expect(scheme).toBe(FAB_COLORS.batch)
      })
    })

    describe('AC#3: Statement mode uses violet/purple', () => {
      it('should return statement colors for statement mode at idle', () => {
        const scheme = getFABColorScheme('statement', 'idle')
        expect(scheme).toBe(FAB_COLORS.statement)
      })

      it('should return statement colors for statement mode at capturing', () => {
        const scheme = getFABColorScheme('statement', 'capturing')
        expect(scheme).toBe(FAB_COLORS.statement)
      })
    })

    describe('AC#4: Error state takes priority over mode', () => {
      it('should return error colors for single mode at error', () => {
        const scheme = getFABColorScheme('single', 'error')
        expect(scheme).toBe(FAB_COLORS.error)
      })

      it('should return error colors for batch mode at error', () => {
        const scheme = getFABColorScheme('batch', 'error')
        expect(scheme).toBe(FAB_COLORS.error)
      })

      it('should return error colors for statement mode at error', () => {
        const scheme = getFABColorScheme('statement', 'error')
        expect(scheme).toBe(FAB_COLORS.error)
      })
    })

    describe('Default handling', () => {
      it('should default to single colors for unknown mode', () => {
        // @ts-expect-error Testing invalid input
        const scheme = getFABColorScheme('unknown', 'idle')
        expect(scheme).toBe(FAB_COLORS.single)
      })
    })
  })

  describe('shouldShowShineAnimation', () => {
    describe('AC#11-14: Shine animation during processing', () => {
      it('AC#11: should show shine during scanning phase', () => {
        expect(shouldShowShineAnimation('scanning', true)).toBe(true)
      })

      it('AC#11: should show shine when isProcessing is true', () => {
        expect(shouldShowShineAnimation('idle', true)).toBe(true)
      })

      it('AC#14: should NOT show shine during idle phase', () => {
        expect(shouldShowShineAnimation('idle', false)).toBe(false)
      })

      it('AC#14: should NOT show shine during capturing phase', () => {
        expect(shouldShowShineAnimation('capturing', false)).toBe(false)
      })

      it('AC#14: should NOT show shine during reviewing phase', () => {
        expect(shouldShowShineAnimation('reviewing', false)).toBe(false)
      })

      it('AC#14: should NOT show shine during saving phase', () => {
        expect(shouldShowShineAnimation('saving', false)).toBe(false)
      })

      it('AC#14: should NOT show shine during error phase', () => {
        expect(shouldShowShineAnimation('error', false)).toBe(false)
      })
    })
  })

  describe('shouldShowPulseAnimation', () => {
    describe('AC#18: Pulse for batch reviewing', () => {
      it('should show pulse for batch mode during reviewing', () => {
        expect(shouldShowPulseAnimation('batch', 'reviewing')).toBe(true)
      })

      it('should NOT show pulse for batch mode during other phases', () => {
        expect(shouldShowPulseAnimation('batch', 'idle')).toBe(false)
        expect(shouldShowPulseAnimation('batch', 'capturing')).toBe(false)
        expect(shouldShowPulseAnimation('batch', 'scanning')).toBe(false)
        expect(shouldShowPulseAnimation('batch', 'saving')).toBe(false)
        expect(shouldShowPulseAnimation('batch', 'error')).toBe(false)
      })

      it('should NOT show pulse for single mode during reviewing', () => {
        expect(shouldShowPulseAnimation('single', 'reviewing')).toBe(false)
      })

      it('should NOT show pulse for statement mode during reviewing', () => {
        expect(shouldShowPulseAnimation('statement', 'reviewing')).toBe(false)
      })
    })
  })
})
