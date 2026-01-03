/**
 * useCountUp Hook Tests
 *
 * Story 14.8: Enhanced Existing Charts
 * Epic 14: Core Implementation
 *
 * Tests for animated count-up effect for money values.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountUp } from '../../../src/hooks/useCountUp';

// Mock useReducedMotion
vi.mock('../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../../src/hooks/useReducedMotion';

describe('useCountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('animation behavior', () => {
    it('should start at 0 and animate to target value', () => {
      const { result } = renderHook(() => useCountUp(1000));

      // Should start at 0
      expect(result.current).toBe(0);

      // Advance partial time
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should be somewhere between 0 and 1000
      expect(result.current).toBeGreaterThan(0);
      expect(result.current).toBeLessThan(1000);
    });

    it('should reach target value at the end of duration', () => {
      const { result } = renderHook(() => useCountUp(1000, { duration: 400 }));

      // Complete the animation
      act(() => {
        vi.advanceTimersByTime(450);
      });

      expect(result.current).toBe(1000);
    });

    it('should handle negative values', () => {
      const { result } = renderHook(() => useCountUp(-500, { duration: 300 }));

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(result.current).toBe(-500);
    });

    it('should handle zero target', () => {
      const { result } = renderHook(() => useCountUp(0, { duration: 300 }));

      expect(result.current).toBe(0);

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(result.current).toBe(0);
    });

    it('should use default duration of 400ms', () => {
      const { result } = renderHook(() => useCountUp(1000));

      // At 200ms (halfway), should be partially through
      act(() => {
        vi.advanceTimersByTime(200);
      });

      const halfwayValue = result.current;

      // At 400ms, should be complete
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(result.current).toBe(1000);
      expect(halfwayValue).toBeLessThan(1000);
    });

    it('should use ease-out curve (faster at start)', () => {
      const { result } = renderHook(() => useCountUp(1000, { duration: 400 }));

      // At 50% time, ease-out should be > 50% of value
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Ease-out: should be more than half by halfway point
      expect(result.current).toBeGreaterThanOrEqual(500);
    });
  });

  describe('reduced motion support', () => {
    it('should show final value immediately when reduced motion preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useCountUp(1000, { duration: 400 }));

      // Should immediately be at target value
      expect(result.current).toBe(1000);
    });

    it('should not run animation when reduced motion preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useCountUp(1000, { duration: 400 }));

      // Even after time advances, should still be target
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe(1000);
    });
  });

  describe('enabled option', () => {
    it('should skip animation when enabled is false', () => {
      const { result } = renderHook(() =>
        useCountUp(1000, { duration: 400, enabled: false })
      );

      // Should immediately show target value
      expect(result.current).toBe(1000);
    });

    it('should run animation when enabled is true', () => {
      const { result } = renderHook(() =>
        useCountUp(1000, { duration: 400, enabled: true })
      );

      // Should start at 0
      expect(result.current).toBe(0);
    });
  });

  describe('target value changes', () => {
    it('should restart animation when target changes', () => {
      const { result, rerender } = renderHook(
        ({ target }) => useCountUp(target, { duration: 400 }),
        { initialProps: { target: 1000 } }
      );

      // Complete first animation
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe(1000);

      // Change target
      rerender({ target: 2000 });

      // Complete second animation
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe(2000);
    });
  });

  describe('startValue option', () => {
    it('should animate from custom start value', () => {
      const { result } = renderHook(() =>
        useCountUp(1000, { duration: 400, startValue: 500 })
      );

      // Should start at startValue
      expect(result.current).toBe(500);

      // Complete animation
      act(() => {
        vi.advanceTimersByTime(450);
      });

      expect(result.current).toBe(1000);
    });
  });

  describe('decimal handling', () => {
    it('should round to integers by default', () => {
      const { result } = renderHook(() => useCountUp(999, { duration: 400 }));

      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Value should be an integer
      expect(Number.isInteger(result.current)).toBe(true);
    });
  });
});
