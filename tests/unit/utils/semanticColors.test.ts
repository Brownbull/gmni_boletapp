/**
 * Tests for Semantic Color Utilities
 *
 * Story 14.16b: Semantic Color System Application
 * Epic 14: Core Implementation
 *
 * Tests the semanticColors.ts utility functions for accessing
 * theme-aware semantic colors via CSS variables.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SEMANTIC_COLORS,
  TREND_CSS_COLORS,
  getSemanticColor,
  getTrendColor,
  getTrendColorComputed,
  getSemanticCssVar,
  getSemanticBadgeStyle,
  getTrendBadgeStyle,
} from '../../../src/utils/semanticColors';

// Mock getComputedStyle for browser environment
const mockGetComputedStyle = vi.fn();

describe('semanticColors', () => {
  beforeEach(() => {
    // Reset mock
    mockGetComputedStyle.mockReset();

    // Mock document and getComputedStyle
    vi.stubGlobal('document', {
      documentElement: {},
    });
    vi.stubGlobal('getComputedStyle', mockGetComputedStyle);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('SEMANTIC_COLORS constant', () => {
    it('should have all four semantic states', () => {
      expect(SEMANTIC_COLORS.positive).toBeDefined();
      expect(SEMANTIC_COLORS.negative).toBeDefined();
      expect(SEMANTIC_COLORS.neutral).toBeDefined();
      expect(SEMANTIC_COLORS.warning).toBeDefined();
    });

    it('should have all variants for positive state', () => {
      expect(SEMANTIC_COLORS.positive.primary).toBe('var(--positive-primary)');
      expect(SEMANTIC_COLORS.positive.secondary).toBe('var(--positive-secondary)');
      expect(SEMANTIC_COLORS.positive.bg).toBe('var(--positive-bg)');
      expect(SEMANTIC_COLORS.positive.border).toBe('var(--positive-border)');
    });

    it('should have all variants for negative state', () => {
      expect(SEMANTIC_COLORS.negative.primary).toBe('var(--negative-primary)');
      expect(SEMANTIC_COLORS.negative.secondary).toBe('var(--negative-secondary)');
      expect(SEMANTIC_COLORS.negative.bg).toBe('var(--negative-bg)');
      expect(SEMANTIC_COLORS.negative.border).toBe('var(--negative-border)');
    });

    it('should have all variants for neutral state', () => {
      expect(SEMANTIC_COLORS.neutral.primary).toBe('var(--neutral-primary)');
      expect(SEMANTIC_COLORS.neutral.secondary).toBe('var(--neutral-secondary)');
      expect(SEMANTIC_COLORS.neutral.bg).toBe('var(--neutral-bg)');
      expect(SEMANTIC_COLORS.neutral.border).toBe('var(--neutral-border)');
    });

    it('should have all variants for warning state with --warning-semantic for primary', () => {
      expect(SEMANTIC_COLORS.warning.primary).toBe('var(--warning-semantic)');
      expect(SEMANTIC_COLORS.warning.secondary).toBe('var(--warning-secondary)');
      expect(SEMANTIC_COLORS.warning.bg).toBe('var(--warning-bg)');
      expect(SEMANTIC_COLORS.warning.border).toBe('var(--warning-border)');
    });
  });

  describe('TREND_CSS_COLORS constant', () => {
    it('should map up (spending increased) to negative color', () => {
      expect(TREND_CSS_COLORS.up).toBe('var(--negative-primary)');
    });

    it('should map down (spending decreased) to positive color', () => {
      expect(TREND_CSS_COLORS.down).toBe('var(--positive-primary)');
    });

    it('should map neutral to neutral color', () => {
      expect(TREND_CSS_COLORS.neutral).toBe('var(--neutral-primary)');
    });
  });

  describe('getSemanticColor', () => {
    it('should return computed CSS variable value', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue('  #3d8c5a  '),
      });

      const color = getSemanticColor('positive', 'primary');
      expect(color).toBe('#3d8c5a');
    });

    it('should default to primary variant if not specified', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: vi.fn((name) => {
          if (name === '--positive-primary') return '#3d8c5a';
          return '';
        }),
      });

      const color = getSemanticColor('positive');
      expect(mockGetComputedStyle).toHaveBeenCalled();
    });

    it('should use --warning-semantic for warning primary', () => {
      const getPropertyValue = vi.fn((name) => {
        if (name === '--warning-semantic') return '#a8842c';
        return '';
      });
      mockGetComputedStyle.mockReturnValue({ getPropertyValue });

      getSemanticColor('warning', 'primary');
      expect(getPropertyValue).toHaveBeenCalledWith('--warning-semantic');
    });

    it('should use --warning-bg for warning bg variant', () => {
      const getPropertyValue = vi.fn((name) => {
        if (name === '--warning-bg') return '#fcf4e0';
        return '';
      });
      mockGetComputedStyle.mockReturnValue({ getPropertyValue });

      getSemanticColor('warning', 'bg');
      expect(getPropertyValue).toHaveBeenCalledWith('--warning-bg');
    });
  });

  describe('getTrendColor', () => {
    it('should return negative primary for up trend (spending increased is bad)', () => {
      const color = getTrendColor('up');
      expect(color).toBe(SEMANTIC_COLORS.negative.primary);
    });

    it('should return positive primary for down trend (spending decreased is good)', () => {
      const color = getTrendColor('down');
      expect(color).toBe(SEMANTIC_COLORS.positive.primary);
    });

    it('should return neutral primary for neutral trend', () => {
      const color = getTrendColor('neutral');
      expect(color).toBe(SEMANTIC_COLORS.neutral.primary);
    });

    it('should support variant parameter for backgrounds', () => {
      const bgColor = getTrendColor('up', 'bg');
      expect(bgColor).toBe(SEMANTIC_COLORS.negative.bg);
    });
  });

  describe('getTrendColorComputed', () => {
    it('should call getSemanticColor for up direction', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue('#b85c4a'),
      });

      const color = getTrendColorComputed('up');
      expect(color).toBe('#b85c4a');
    });

    it('should call getSemanticColor for down direction', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue('#3d8c5a'),
      });

      const color = getTrendColorComputed('down');
      expect(color).toBe('#3d8c5a');
    });

    it('should call getSemanticColor for neutral direction', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue('#7a7268'),
      });

      const color = getTrendColorComputed('neutral');
      expect(color).toBe('#7a7268');
    });
  });

  describe('getSemanticCssVar', () => {
    it('should return CSS variable reference for given state and variant', () => {
      expect(getSemanticCssVar('positive', 'primary')).toBe('var(--positive-primary)');
      expect(getSemanticCssVar('negative', 'bg')).toBe('var(--negative-bg)');
      expect(getSemanticCssVar('neutral', 'border')).toBe('var(--neutral-border)');
      expect(getSemanticCssVar('warning', 'primary')).toBe('var(--warning-semantic)');
    });

    it('should default to primary variant', () => {
      expect(getSemanticCssVar('positive')).toBe('var(--positive-primary)');
    });
  });

  describe('getSemanticBadgeStyle', () => {
    it('should return style object for positive state', () => {
      const style = getSemanticBadgeStyle('positive');
      expect(style).toEqual({
        color: 'var(--positive-primary)',
        backgroundColor: 'var(--positive-bg)',
        borderColor: 'var(--positive-border)',
      });
    });

    it('should return style object for negative state', () => {
      const style = getSemanticBadgeStyle('negative');
      expect(style).toEqual({
        color: 'var(--negative-primary)',
        backgroundColor: 'var(--negative-bg)',
        borderColor: 'var(--negative-border)',
      });
    });

    it('should return style object for warning state', () => {
      const style = getSemanticBadgeStyle('warning');
      expect(style).toEqual({
        color: 'var(--warning-semantic)',
        backgroundColor: 'var(--warning-bg)',
        borderColor: 'var(--warning-border)',
      });
    });
  });

  describe('getTrendBadgeStyle', () => {
    it('should return negative badge style for up trend', () => {
      const style = getTrendBadgeStyle('up');
      expect(style.color).toBe('var(--negative-primary)');
      expect(style.backgroundColor).toBe('var(--negative-bg)');
    });

    it('should return positive badge style for down trend', () => {
      const style = getTrendBadgeStyle('down');
      expect(style.color).toBe('var(--positive-primary)');
      expect(style.backgroundColor).toBe('var(--positive-bg)');
    });

    it('should return neutral badge style for neutral trend', () => {
      const style = getTrendBadgeStyle('neutral');
      expect(style.color).toBe('var(--neutral-primary)');
      expect(style.backgroundColor).toBe('var(--neutral-bg)');
    });
  });

  describe('SSR safety design', () => {
    // Note: Full SSR testing requires isolated module environments.
    // These tests verify that the code structure supports SSR fallbacks.

    it('SEMANTIC_COLORS provides CSS variable references usable in SSR', () => {
      // SEMANTIC_COLORS are static CSS variable strings, safe for SSR
      expect(SEMANTIC_COLORS.positive.primary).toMatch(/^var\(--/);
      expect(SEMANTIC_COLORS.negative.primary).toMatch(/^var\(--/);
      expect(SEMANTIC_COLORS.neutral.primary).toMatch(/^var\(--/);
      expect(SEMANTIC_COLORS.warning.primary).toMatch(/^var\(--/);
    });

    it('getTrendColor returns CSS variable references safe for SSR', () => {
      // getTrendColor returns static CSS variable references
      const upColor = getTrendColor('up');
      const downColor = getTrendColor('down');
      const neutralColor = getTrendColor('neutral');

      expect(upColor).toMatch(/^var\(--/);
      expect(downColor).toMatch(/^var\(--/);
      expect(neutralColor).toMatch(/^var\(--/);
    });

    it('getSemanticCssVar returns CSS variable references safe for SSR', () => {
      expect(getSemanticCssVar('positive', 'primary')).toMatch(/^var\(--/);
      expect(getSemanticCssVar('warning', 'bg')).toMatch(/^var\(--/);
    });

    it('badge style functions return CSS variable references safe for SSR', () => {
      const positiveStyle = getSemanticBadgeStyle('positive');
      expect(positiveStyle.color).toMatch(/^var\(--/);
      expect(positiveStyle.backgroundColor).toMatch(/^var\(--/);
      expect(positiveStyle.borderColor).toMatch(/^var\(--/);

      const trendStyle = getTrendBadgeStyle('down');
      expect(trendStyle.color).toMatch(/^var\(--/);
      expect(trendStyle.backgroundColor).toMatch(/^var\(--/);
      expect(trendStyle.borderColor).toMatch(/^var\(--/);
    });
  });
});
