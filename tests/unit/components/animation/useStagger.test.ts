/**
 * Tests for useStagger Hook
 *
 * Story 14.1: Animation Framework
 * Epic 14: Core Implementation
 *
 * Tests stagger delay calculation logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStagger, calculateStaggerDelay } from '../../../../src/components/animation/useStagger';
import { STAGGER } from '../../../../src/components/animation/constants';

// Mock useReducedMotion
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../../../src/hooks/useReducedMotion';

describe('useStagger', () => {
  beforeEach(() => {
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic stagger calculation', () => {
    it('should return correct delay for each item', () => {
      const { result } = renderHook(() => useStagger(5));

      expect(result.current.getDelay(0)).toBe(0);
      expect(result.current.getDelay(1)).toBe(STAGGER.DEFAULT);
      expect(result.current.getDelay(2)).toBe(STAGGER.DEFAULT * 2);
      expect(result.current.getDelay(3)).toBe(STAGGER.DEFAULT * 3);
      expect(result.current.getDelay(4)).toBe(STAGGER.DEFAULT * 4);
    });

    it('should return CSS delay strings', () => {
      const { result } = renderHook(() => useStagger(3));

      expect(result.current.getCSSDelay(0)).toBe('0ms');
      expect(result.current.getCSSDelay(1)).toBe('100ms');
      expect(result.current.getCSSDelay(2)).toBe('200ms');
    });

    it('should calculate total duration', () => {
      const { result } = renderHook(() => useStagger(5));

      // 4 gaps between 5 items × 100ms = 400ms
      expect(result.current.totalDuration).toBe(400);
    });

    it('should provide delays array', () => {
      const { result } = renderHook(() => useStagger(4));

      expect(result.current.delays).toEqual([0, 100, 200, 300]);
    });
  });

  describe('custom options', () => {
    it('should respect custom staggerMs', () => {
      const { result } = renderHook(() => useStagger(3, { staggerMs: 50 }));

      expect(result.current.getDelay(0)).toBe(0);
      expect(result.current.getDelay(1)).toBe(50);
      expect(result.current.getDelay(2)).toBe(100);
    });

    it('should respect initialDelayMs', () => {
      const { result } = renderHook(() =>
        useStagger(3, { initialDelayMs: 200 })
      );

      expect(result.current.getDelay(0)).toBe(200);
      expect(result.current.getDelay(1)).toBe(300);
      expect(result.current.getDelay(2)).toBe(400);
    });

    it('should include initialDelayMs in total duration', () => {
      const { result } = renderHook(() =>
        useStagger(3, { initialDelayMs: 200 })
      );

      // 200 + 2 * 100 = 400
      expect(result.current.totalDuration).toBe(400);
    });
  });

  describe('compression for long lists', () => {
    it('should compress stagger when total exceeds maxDurationMs', () => {
      // 50 items with 100ms stagger = 4900ms total
      // maxDurationMs = 2500ms default
      // Available time = 2500 - 0 (initial) = 2500
      // Compressed stagger = 2500 / 49 ≈ 51ms
      const { result } = renderHook(() => useStagger(50));

      expect(result.current.effectiveStagger).toBeLessThan(STAGGER.DEFAULT);
      expect(result.current.totalDuration).toBeLessThanOrEqual(STAGGER.MAX_DURATION);
    });

    it('should respect custom maxDurationMs', () => {
      const { result } = renderHook(() =>
        useStagger(20, { maxDurationMs: 1000 })
      );

      // 19 gaps × 100ms = 1900ms > 1000ms
      // Should compress
      expect(result.current.effectiveStagger).toBeLessThan(100);
      expect(result.current.totalDuration).toBeLessThanOrEqual(1000);
    });

    it('should not compress when under maxDurationMs', () => {
      const { result } = renderHook(() =>
        useStagger(5) // 4 × 100 = 400ms < 2500ms
      );

      expect(result.current.effectiveStagger).toBe(STAGGER.DEFAULT);
    });
  });

  describe('reduced motion', () => {
    it('should return zero delays when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useStagger(5));

      expect(result.current.isActive).toBe(false);
      expect(result.current.getDelay(0)).toBe(0);
      expect(result.current.getDelay(4)).toBe(0);
      expect(result.current.totalDuration).toBe(0);
    });

    it('should fill delays array with zeros when reduced motion', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useStagger(3));

      expect(result.current.delays).toEqual([0, 0, 0]);
    });
  });

  describe('enabled option', () => {
    it('should return zero delays when disabled', () => {
      const { result } = renderHook(() => useStagger(5, { enabled: false }));

      expect(result.current.isActive).toBe(false);
      expect(result.current.getDelay(2)).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle zero items', () => {
      const { result } = renderHook(() => useStagger(0));

      expect(result.current.delays).toEqual([]);
      expect(result.current.totalDuration).toBe(0);
    });

    it('should handle single item', () => {
      const { result } = renderHook(() => useStagger(1));

      expect(result.current.delays).toEqual([0]);
      expect(result.current.totalDuration).toBe(0);
    });

    it('should handle negative index', () => {
      const { result } = renderHook(() => useStagger(5));

      expect(result.current.getDelay(-1)).toBe(0);
    });
  });
});

describe('calculateStaggerDelay (utility function)', () => {
  it('should calculate delay without hook', () => {
    expect(calculateStaggerDelay(0, 5)).toBe(0);
    expect(calculateStaggerDelay(1, 5)).toBe(100);
    expect(calculateStaggerDelay(4, 5)).toBe(400);
  });

  it('should compress for long lists', () => {
    const delay = calculateStaggerDelay(49, 50);
    // Should be less than 49 * 100 = 4900ms
    expect(delay).toBeLessThan(4900);
  });

  it('should respect options', () => {
    const delay = calculateStaggerDelay(1, 5, {
      staggerMs: 50,
      initialDelayMs: 100,
    });

    expect(delay).toBe(150); // 100 + 1 * 50
  });

  it('should return 0 when disabled', () => {
    expect(calculateStaggerDelay(2, 5, { enabled: false })).toBe(0);
  });
});
