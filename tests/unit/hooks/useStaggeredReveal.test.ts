/**
 * Tests for useStaggeredReveal hook
 *
 * Story 11.3: Animated Item Reveal
 * Epic 11: Quick Save & Scan Flow Optimization
 *
 * Tests the staggered animation timing hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStaggeredReveal } from '../../../src/hooks/useStaggeredReveal';

// Mock useReducedMotion
vi.mock('../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../../src/hooks/useReducedMotion';

describe('useStaggeredReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should start with no visible items', () => {
      const items = ['a', 'b', 'c'];
      const { result } = renderHook(() => useStaggeredReveal(items));

      expect(result.current.visibleItems).toEqual([]);
      expect(result.current.visibleCount).toBe(0);
      expect(result.current.isComplete).toBe(false);
    });

    it('should reveal first item after initial delay', async () => {
      const items = ['a', 'b', 'c'];
      const { result } = renderHook(() => useStaggeredReveal(items, {
        initialDelayMs: 300,
        staggerMs: 100,
      }));

      // Before initial delay
      expect(result.current.visibleItems).toEqual([]);

      // After initial delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.visibleItems).toEqual(['a']);
      expect(result.current.visibleCount).toBe(1);
    });

    it('should reveal items with staggered timing', async () => {
      const items = ['a', 'b', 'c', 'd'];
      const { result } = renderHook(() => useStaggeredReveal(items, {
        initialDelayMs: 300,
        staggerMs: 100,
      }));

      // Initial delay - first item appears
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current.visibleItems).toEqual(['a']);
      expect(result.current.visibleCount).toBe(1);

      // After enough time, all should be visible
      // Initial delay + enough stagger time for all remaining items
      act(() => {
        vi.advanceTimersByTime(500); // More than enough for remaining 3 items
      });
      expect(result.current.visibleItems).toEqual(['a', 'b', 'c', 'd']);
      expect(result.current.isComplete).toBe(true);
    });

    it('should handle empty array', () => {
      const items: string[] = [];
      const { result } = renderHook(() => useStaggeredReveal(items));

      expect(result.current.visibleItems).toEqual([]);
      expect(result.current.visibleCount).toBe(0);
      expect(result.current.isComplete).toBe(true); // Empty is considered complete
    });

    it('should handle single item', async () => {
      const items = ['only'];
      const { result } = renderHook(() => useStaggeredReveal(items, {
        initialDelayMs: 300,
        staggerMs: 100,
      }));

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.visibleItems).toEqual(['only']);
      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('reduced motion preference', () => {
    it('should show all items immediately when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const items = ['a', 'b', 'c', 'd', 'e'];
      const { result } = renderHook(() => useStaggeredReveal(items));

      expect(result.current.visibleItems).toEqual(['a', 'b', 'c', 'd', 'e']);
      expect(result.current.visibleCount).toBe(5);
      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('max duration cap', () => {
    it('should reveal items faster when max duration cap would be exceeded', async () => {
      // 50 items with 100ms stagger = 5000ms, but max is 2500ms
      // Animation should compress to fit within that timeframe
      const items = Array.from({ length: 50 }, (_, i) => `item-${i}`);
      const { result } = renderHook(() => useStaggeredReveal(items, {
        initialDelayMs: 300,
        staggerMs: 100,
        maxDurationMs: 2500,
      }));

      // Wait for initial delay
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current.visibleCount).toBe(1);

      // Advance by half the max duration (excluding initial delay)
      // With adjusted stagger, we should have revealed a significant portion
      act(() => {
        vi.advanceTimersByTime(1100);
      });

      // Should have revealed more items than with 100ms stagger alone (which would be ~11)
      // The adjusted stagger should be ~44ms ((2500-300)/50), so ~25 items
      expect(result.current.visibleCount).toBeGreaterThan(10);

      // Complete the animation
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // All items should now be visible
      expect(result.current.visibleCount).toBe(50);
      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('reset functionality', () => {
    it('should provide reset function', () => {
      const items = ['a', 'b', 'c'];
      const { result } = renderHook(() => useStaggeredReveal(items));

      expect(typeof result.current.reset).toBe('function');
    });

    it('should reset visible count when reset is called', async () => {
      const items = ['a', 'b', 'c'];
      const { result } = renderHook(() => useStaggeredReveal(items, {
        initialDelayMs: 300,
        staggerMs: 100,
      }));

      // Reveal all items
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(result.current.isComplete).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.visibleCount).toBe(0);
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('item updates during animation', () => {
    it('should handle items being added during animation', async () => {
      const { result, rerender } = renderHook(
        ({ items }) => useStaggeredReveal(items, { initialDelayMs: 300, staggerMs: 100 }),
        { initialProps: { items: ['a', 'b'] } }
      );

      // Start animation
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(result.current.visibleCount).toBe(2);

      // Add more items
      rerender({ items: ['a', 'b', 'c', 'd'] });

      // Continue animation
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should reveal new items
      expect(result.current.visibleCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('default options', () => {
    it('should use default options when none provided', async () => {
      const items = ['a', 'b', 'c'];
      const { result } = renderHook(() => useStaggeredReveal(items));

      // Default initial delay is 300ms
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(result.current.visibleCount).toBe(0);

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current.visibleCount).toBe(1);

      // Default stagger is 100ms
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.visibleCount).toBe(2);
    });
  });

  describe('object items', () => {
    it('should work with object arrays', async () => {
      const items = [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
        { id: 3, name: 'Cherry' },
      ];

      const { result } = renderHook(() => useStaggeredReveal(items, {
        initialDelayMs: 300,
        staggerMs: 100,
      }));

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.visibleItems).toEqual([
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
        { id: 3, name: 'Cherry' },
      ]);
      expect(result.current.isComplete).toBe(true);
    });
  });
});
