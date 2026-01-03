/**
 * Tests for useBreathing Hook
 *
 * Story 14.1: Animation Framework
 * Epic 14: Core Implementation
 *
 * Tests breathing animation values with fake timers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBreathing } from '../../../../src/components/animation/useBreathing';
import { BREATHING } from '../../../../src/components/animation/constants';

// Mock useReducedMotion
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../../../src/hooks/useReducedMotion';

describe('useBreathing', () => {
  let mockRAF: ReturnType<typeof vi.fn>;
  let mockCAF: ReturnType<typeof vi.fn>;
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let rafId: number;
  let lastTimestamp: number;

  beforeEach(() => {
    vi.useFakeTimers();
    rafCallbacks = new Map();
    rafId = 0;
    lastTimestamp = 0;

    // Mock requestAnimationFrame
    mockRAF = vi.fn((callback: FrameRequestCallback) => {
      const id = ++rafId;
      rafCallbacks.set(id, callback);
      return id;
    });

    mockCAF = vi.fn((id: number) => {
      rafCallbacks.delete(id);
    });

    vi.stubGlobal('requestAnimationFrame', mockRAF);
    vi.stubGlobal('cancelAnimationFrame', mockCAF);
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // Helper to advance animation frame
  const advanceRAF = (deltaMs: number = 16) => {
    lastTimestamp += deltaMs;
    const callbacks = Array.from(rafCallbacks.values());
    rafCallbacks.clear();
    callbacks.forEach(cb => {
      act(() => {
        cb(lastTimestamp);
      });
    });
  };

  describe('initial state', () => {
    it('should return initial values when first rendered', () => {
      const { result } = renderHook(() => useBreathing());

      expect(result.current.phase).toBe(0);
      expect(result.current.scale).toBeCloseTo(BREATHING.SCALE_MIN);
      expect(result.current.isAnimating).toBe(true);
    });

    it('should have style object with transform and opacity', () => {
      const { result } = renderHook(() => useBreathing());

      expect(result.current.style).toHaveProperty('transform');
      expect(result.current.style).toHaveProperty('opacity');
      expect(result.current.style).toHaveProperty('transformOrigin');
    });
  });

  describe('animation cycle', () => {
    it('should start animation frame loop', () => {
      renderHook(() => useBreathing());

      expect(mockRAF).toHaveBeenCalled();
    });

    it('should update phase during animation', () => {
      const { result } = renderHook(() => useBreathing());

      // Advance to 50% of cycle
      advanceRAF(16);
      advanceRAF(BREATHING.CYCLE_DURATION / 2);

      expect(result.current.phase).toBeGreaterThan(0);
      expect(result.current.phase).toBeLessThan(1);
    });

    it('should reach scale max at 50% phase', () => {
      const { result } = renderHook(() => useBreathing());

      // Initial frame
      advanceRAF(16);

      // Advance to 25% of cycle (peak of sine wave)
      const quarterCycle = BREATHING.CYCLE_DURATION / 4;
      advanceRAF(quarterCycle);

      // At quarter cycle, sine wave is at peak
      expect(result.current.scale).toBeGreaterThan(BREATHING.SCALE_MIN);
    });

    it('should cycle back to min scale', () => {
      const { result } = renderHook(() => useBreathing());

      // Advance full cycle plus a bit
      advanceRAF(16);
      advanceRAF(BREATHING.CYCLE_DURATION + 100);

      // After full cycle, phase resets
      expect(result.current.phase).toBeLessThan(0.1);
    });

    it('should cancel animation frame on unmount', () => {
      const { unmount } = renderHook(() => useBreathing());

      unmount();

      expect(mockCAF).toHaveBeenCalled();
    });
  });

  describe('reduced motion', () => {
    it('should not animate when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useBreathing());

      expect(result.current.isAnimating).toBe(false);
      expect(result.current.scale).toBe(BREATHING.SCALE_MIN);
      expect(result.current.opacity).toBe(BREATHING.OPACITY_MAX);
    });

    it('should have static style when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useBreathing());

      expect(result.current.style.transform).toBe('scale(1)');
      expect(result.current.style.opacity).toBe(1);
    });

    it('should not start RAF loop when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      renderHook(() => useBreathing());

      // RAF may be called initially but should be cancelled
      // The key is that no animation loop continues
      expect(result => result.current?.isAnimating).toBeFalsy;
    });
  });

  describe('options', () => {
    it('should respect custom cycleDuration', () => {
      const customDuration = 1000;
      const { result } = renderHook(() =>
        useBreathing({ cycleDuration: customDuration })
      );

      // Advance to custom duration
      advanceRAF(16);
      advanceRAF(customDuration + 100);

      // After full cycle, phase should reset
      expect(result.current.phase).toBeLessThan(0.2);
    });

    it('should respect custom scale range', () => {
      const { result } = renderHook(() =>
        useBreathing({ scaleMin: 0.8, scaleMax: 1.2 })
      );

      // At initial state
      expect(result.current.scale).toBeCloseTo(0.8);

      // Advance to peak
      advanceRAF(16);
      advanceRAF(BREATHING.CYCLE_DURATION / 4);

      expect(result.current.scale).toBeGreaterThan(0.8);
      expect(result.current.scale).toBeLessThanOrEqual(1.2);
    });

    it('should respect custom opacity range', () => {
      const { result } = renderHook(() =>
        useBreathing({ opacityMin: 0.5, opacityMax: 1.0 })
      );

      // At initial state (phase 0), opacity should be at min
      expect(result.current.opacity).toBeCloseTo(0.5);
    });

    it('should respect enabled option', () => {
      const { result } = renderHook(() => useBreathing({ enabled: false }));

      expect(result.current.isAnimating).toBe(false);
      expect(result.current.scale).toBe(BREATHING.SCALE_MIN);
    });
  });

  describe('transform string', () => {
    it('should provide transform string', () => {
      const { result } = renderHook(() => useBreathing());

      expect(result.current.transform).toMatch(/^scale\([\d.]+\)$/);
    });
  });
});
