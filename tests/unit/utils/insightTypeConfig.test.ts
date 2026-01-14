/**
 * insightTypeConfig Unit Tests
 *
 * Story 14.33a: Insight Card Types & Styling
 * Story 14.33a.1: Theme-Aware Insight Type Colors
 * Tests for the visual type configuration and helper functions.
 *
 * Acceptance Criteria Coverage:
 * - AC #1: Insight type mapping (InsightCategory to visual types)
 * - AC #5: Backward compatibility (defaults to 'actionable')
 * - AC1-6 (14.33a.1): Theme-aware CSS variables for all types
 */

import { describe, it, expect } from 'vitest';
import {
  getVisualType,
  getVisualConfig,
  INSIGHT_VISUAL_CONFIG,
  InsightVisualType,
} from '../../../src/utils/insightTypeConfig';

// ============================================================================
// getVisualType() Tests
// ============================================================================

describe('getVisualType', () => {
  describe('AC1: Category to Visual Type Mapping', () => {
    it('maps QUIRKY_FIRST category to quirky visual type', () => {
      expect(getVisualType('QUIRKY_FIRST')).toBe('quirky');
    });

    it('maps CELEBRATORY category to celebration visual type', () => {
      expect(getVisualType('CELEBRATORY')).toBe('celebration');
    });

    it('maps ACTIONABLE category to actionable visual type', () => {
      expect(getVisualType('ACTIONABLE')).toBe('actionable');
    });
  });

  describe('AC1: InsightId Override for Trend Type', () => {
    it('returns trend for insightId containing "trend"', () => {
      expect(getVisualType('ACTIONABLE', 'category_trend')).toBe('trend');
    });

    it('returns trend for insightId containing "favorite_day"', () => {
      expect(getVisualType('ACTIONABLE', 'favorite_day_friday')).toBe('trend');
    });

    it('returns trend for insightId containing "day_pattern"', () => {
      expect(getVisualType('QUIRKY_FIRST', 'day_pattern')).toBe('trend');
    });

    it('returns trend for insightId containing "time_pattern"', () => {
      expect(getVisualType('QUIRKY_FIRST', 'time_pattern')).toBe('trend');
    });

    it('returns trend for insightId containing "spending_pattern"', () => {
      expect(getVisualType('ACTIONABLE', 'spending_pattern')).toBe('trend');
    });
  });

  describe('AC1: InsightId Override for Tradeoff Type', () => {
    it('returns tradeoff for insightId containing "tradeoff"', () => {
      expect(getVisualType('ACTIONABLE', 'tradeoff_coffee')).toBe('tradeoff');
    });

    it('returns tradeoff for insightId containing "varied"', () => {
      expect(getVisualType('ACTIONABLE', 'varied_spending')).toBe('tradeoff');
    });

    it('returns tradeoff for insightId containing "category_variety"', () => {
      expect(getVisualType('QUIRKY_FIRST', 'category_variety')).toBe('tradeoff');
    });
  });

  describe('AC5: Backward Compatibility', () => {
    it('defaults to actionable when category is undefined', () => {
      expect(getVisualType(undefined)).toBe('actionable');
    });

    it('defaults to actionable when category is undefined and insightId has no special pattern', () => {
      expect(getVisualType(undefined, 'merchant_frequency')).toBe('actionable');
    });

    it('uses insightId override even with undefined category', () => {
      expect(getVisualType(undefined, 'category_trend')).toBe('trend');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty insightId string', () => {
      expect(getVisualType('CELEBRATORY', '')).toBe('celebration');
    });

    it('insightId takes precedence over category for trend patterns', () => {
      // Even if category is CELEBRATORY, insightId pattern wins
      expect(getVisualType('CELEBRATORY', 'day_pattern')).toBe('trend');
    });

    it('insightId takes precedence over category for tradeoff patterns', () => {
      // Even if category is QUIRKY_FIRST, insightId pattern wins
      expect(getVisualType('QUIRKY_FIRST', 'varied_purchase')).toBe('tradeoff');
    });
  });
});

// ============================================================================
// getVisualConfig() Tests
// ============================================================================

describe('getVisualConfig', () => {
  const visualTypes: InsightVisualType[] = ['quirky', 'celebration', 'actionable', 'tradeoff', 'trend'];

  describe('Story 14.33a.1: Returns CSS Variable References', () => {
    it.each(visualTypes)('returns CSS variables for %s type', (type) => {
      const config = getVisualConfig(type);
      const expected = INSIGHT_VISUAL_CONFIG[type];

      expect(config.bgColor).toBe(expected.bgColor);
      expect(config.iconColor).toBe(expected.iconColor);
    });
  });

  describe('Story 14.33a.1: Theme-Aware CSS Variables', () => {
    it('quirky type uses --insight-quirky-* CSS variables', () => {
      const config = getVisualConfig('quirky');
      expect(config.bgColor).toBe('var(--insight-quirky-bg)');
      expect(config.iconColor).toBe('var(--insight-quirky-icon)');
    });

    it('celebration type uses --insight-celebration-* CSS variables', () => {
      const config = getVisualConfig('celebration');
      expect(config.bgColor).toBe('var(--insight-celebration-bg)');
      expect(config.iconColor).toBe('var(--insight-celebration-icon)');
    });

    it('actionable type uses --insight-actionable-* CSS variables', () => {
      const config = getVisualConfig('actionable');
      expect(config.bgColor).toBe('var(--insight-actionable-bg)');
      expect(config.iconColor).toBe('var(--insight-actionable-icon)');
    });

    it('tradeoff type uses --insight-tradeoff-* CSS variables', () => {
      const config = getVisualConfig('tradeoff');
      expect(config.bgColor).toBe('var(--insight-tradeoff-bg)');
      expect(config.iconColor).toBe('var(--insight-tradeoff-icon)');
    });

    it('trend type uses --insight-trend-* CSS variables', () => {
      const config = getVisualConfig('trend');
      expect(config.bgColor).toBe('var(--insight-trend-bg)');
      expect(config.iconColor).toBe('var(--insight-trend-icon)');
    });
  });

  describe('Fallback Behavior', () => {
    it('returns actionable config for invalid type', () => {
      // Cast to test fallback behavior
      const config = getVisualConfig('invalid' as InsightVisualType);
      expect(config.bgColor).toBe('var(--insight-actionable-bg)');
      expect(config.iconColor).toBe('var(--insight-actionable-icon)');
    });
  });
});

// ============================================================================
// INSIGHT_VISUAL_CONFIG Tests
// ============================================================================

describe('INSIGHT_VISUAL_CONFIG', () => {
  it('contains all 5 visual types', () => {
    expect(Object.keys(INSIGHT_VISUAL_CONFIG)).toHaveLength(5);
    expect(INSIGHT_VISUAL_CONFIG).toHaveProperty('quirky');
    expect(INSIGHT_VISUAL_CONFIG).toHaveProperty('celebration');
    expect(INSIGHT_VISUAL_CONFIG).toHaveProperty('actionable');
    expect(INSIGHT_VISUAL_CONFIG).toHaveProperty('tradeoff');
    expect(INSIGHT_VISUAL_CONFIG).toHaveProperty('trend');
  });

  describe('Story 14.33a.1: Simplified Config Structure', () => {
    it('each type has bgColor and iconColor properties', () => {
      Object.values(INSIGHT_VISUAL_CONFIG).forEach(config => {
        expect(config).toHaveProperty('bgColor');
        expect(config).toHaveProperty('iconColor');
      });
    });

    it('bgColor values are CSS variable references', () => {
      Object.values(INSIGHT_VISUAL_CONFIG).forEach(config => {
        expect(config.bgColor).toMatch(/^var\(--insight-\w+-bg\)$/);
      });
    });

    it('iconColor values are CSS variable references', () => {
      Object.values(INSIGHT_VISUAL_CONFIG).forEach(config => {
        expect(config.iconColor).toMatch(/^var\(--insight-\w+-icon\)$/);
      });
    });
  });
});
