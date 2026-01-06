/**
 * Tests for useSwipeNavigation hook
 *
 * Story 14.9: Swipe Time Navigation
 * Epic 14: Core Implementation
 *
 * Tests swipe gesture detection for time period navigation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipeNavigation } from '../../../src/hooks/useSwipeNavigation';

// Helper to create mock touch events
function createTouchEvent(clientX: number, clientY: number): Partial<TouchEvent> {
  return {
    touches: [{ clientX, clientY }] as unknown as TouchList,
    changedTouches: [{ clientX, clientY }] as unknown as TouchList,
    preventDefault: vi.fn(),
    cancelable: true, // Required for preventDefault to be called
  };
}

describe('useSwipeNavigation', () => {
  let vibrateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vibrateMock = vi.fn();
    vi.stubGlobal('navigator', { vibrate: vibrateMock });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('basic hook behavior', () => {
    it('should return touch handlers and state', () => {
      const { result } = renderHook(() => useSwipeNavigation({}));

      expect(result.current).toHaveProperty('onTouchStart');
      expect(result.current).toHaveProperty('onTouchMove');
      expect(result.current).toHaveProperty('onTouchEnd');
      expect(result.current).toHaveProperty('isSwiping');
      expect(result.current).toHaveProperty('swipeDirection');
      expect(result.current).toHaveProperty('swipeProgress');
    });

    it('should start with isSwiping false', () => {
      const { result } = renderHook(() => useSwipeNavigation({}));
      expect(result.current.isSwiping).toBe(false);
    });

    it('should start with null swipeDirection', () => {
      const { result } = renderHook(() => useSwipeNavigation({}));
      expect(result.current.swipeDirection).toBeNull();
    });

    it('should start with swipeProgress 0', () => {
      const { result } = renderHook(() => useSwipeNavigation({}));
      expect(result.current.swipeProgress).toBe(0);
    });
  });

  describe('swipe detection (AC #1)', () => {
    it('should detect left swipe when threshold is met', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation({ onSwipeLeft, threshold: 50 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchMove(createTouchEvent(40, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(40, 100) as TouchEvent);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should detect right swipe when threshold is met', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation({ onSwipeRight, threshold: 50 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchMove(createTouchEvent(160, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(160, 100) as TouchEvent);
      });

      expect(onSwipeRight).toHaveBeenCalled();
    });

    it('should not trigger swipe when threshold is not met', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation({ onSwipeLeft, onSwipeRight, threshold: 50 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchMove(createTouchEvent(70, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(70, 100) as TouchEvent);
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('should use default threshold of 50px', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipeNavigation({ onSwipeLeft }));

      // Swipe 49px - should not trigger (less than 50)
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(51, 100) as TouchEvent);
      });
      expect(onSwipeLeft).not.toHaveBeenCalled();

      // Swipe 50px - should trigger
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(50, 100) as TouchEvent);
      });
      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should support configurable threshold', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation({ onSwipeLeft, threshold: 100 })
      );

      // Swipe 80px - should not trigger (less than 100)
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(20, 100) as TouchEvent);
      });
      expect(onSwipeLeft).not.toHaveBeenCalled();

      // Swipe 100px - should trigger
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(0, 100) as TouchEvent);
      });
      expect(onSwipeLeft).toHaveBeenCalled();
    });
  });

  describe('time period change direction (AC #2)', () => {
    it('should call onSwipeLeft when swiping left (forward in time)', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipeNavigation({ onSwipeLeft }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(200, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(100, 100) as TouchEvent);
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('should call onSwipeRight when swiping right (back in time)', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipeNavigation({ onSwipeRight }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(200, 100) as TouchEvent);
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('visual feedback during swipe (AC #3)', () => {
    it('should set isSwiping true during swipe', () => {
      const { result } = renderHook(() => useSwipeNavigation({}));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchMove(createTouchEvent(80, 100) as TouchEvent);
      });

      expect(result.current.isSwiping).toBe(true);
    });

    it('should set isSwiping false after swipe ends', () => {
      const { result } = renderHook(() => useSwipeNavigation({}));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchMove(createTouchEvent(80, 100) as TouchEvent);
      });

      expect(result.current.isSwiping).toBe(true);

      act(() => {
        result.current.onTouchEnd(createTouchEvent(50, 100) as TouchEvent);
      });

      expect(result.current.isSwiping).toBe(false);
    });

    it('should indicate swipe direction during gesture', () => {
      const { result } = renderHook(() => useSwipeNavigation({}));

      // Swipe left
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchMove(createTouchEvent(80, 100) as TouchEvent);
      });

      expect(result.current.swipeDirection).toBe('left');
    });

    it('should indicate right swipe direction during gesture', () => {
      const { result } = renderHook(() => useSwipeNavigation({}));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchMove(createTouchEvent(120, 100) as TouchEvent);
      });

      expect(result.current.swipeDirection).toBe('right');
    });

    it('should provide swipe progress as 0-1 value', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({ threshold: 100 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchMove(createTouchEvent(50, 100) as TouchEvent);
      });

      // 50px moved out of 100px threshold = 0.5 progress
      expect(result.current.swipeProgress).toBe(0.5);
    });

    it('should cap swipe progress at 1', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({ threshold: 50 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchMove(createTouchEvent(0, 100) as TouchEvent);
      });

      // 100px moved out of 50px threshold = capped at 1
      expect(result.current.swipeProgress).toBe(1);
    });
  });

  describe('haptic feedback (AC #5)', () => {
    it('should trigger haptic feedback on successful left swipe', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipeNavigation({ onSwipeLeft }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(40, 100) as TouchEvent);
      });

      expect(vibrateMock).toHaveBeenCalledWith(10);
    });

    it('should trigger haptic feedback on successful right swipe', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation({ onSwipeRight })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(160, 100) as TouchEvent);
      });

      expect(vibrateMock).toHaveBeenCalledWith(10);
    });

    it('should not trigger haptic feedback when threshold not met', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipeNavigation({ onSwipeLeft }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(70, 100) as TouchEvent);
      });

      expect(vibrateMock).not.toHaveBeenCalled();
    });

    it('should handle missing vibrate API gracefully', () => {
      vi.stubGlobal('navigator', {});

      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipeNavigation({ onSwipeLeft }));

      // Should not throw
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(40, 100) as TouchEvent);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should respect hapticEnabled option', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation({ onSwipeLeft, hapticEnabled: false })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(40, 100) as TouchEvent);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
      expect(vibrateMock).not.toHaveBeenCalled();
    });
  });

  describe('scroll conflict prevention (AC #6)', () => {
    it('should abort swipe when vertical movement is greater', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipeNavigation({ onSwipeLeft }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        // Move more vertically (80 down) than horizontally (30 left)
        result.current.onTouchMove(createTouchEvent(70, 180) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(40, 200) as TouchEvent);
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(result.current.isSwiping).toBe(false);
    });

    it('should continue swipe when horizontal movement is greater', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipeNavigation({ onSwipeLeft }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        // Move more horizontally (80 left) than vertically (20 down)
        result.current.onTouchMove(createTouchEvent(20, 120) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(20, 120) as TouchEvent);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should lock direction after initial movement', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipeNavigation({ onSwipeLeft }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        // First move: horizontal (establishes swipe)
        result.current.onTouchMove(createTouchEvent(80, 105) as TouchEvent);
      });

      expect(result.current.isSwiping).toBe(true);

      // Continue moving - even with some vertical, should still work
      act(() => {
        result.current.onTouchMove(createTouchEvent(40, 115) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(40, 115) as TouchEvent);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should prevent default on horizontal swipe to avoid scroll', () => {
      const { result } = renderHook(() => useSwipeNavigation({}));

      const moveEvent = createTouchEvent(70, 100);
      moveEvent.preventDefault = vi.fn();

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchMove(moveEvent as TouchEvent);
      });

      expect(moveEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('enabled option', () => {
    it('should not respond to touch when disabled', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation({ onSwipeLeft, enabled: false })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchMove(createTouchEvent(40, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(40, 100) as TouchEvent);
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(result.current.isSwiping).toBe(false);
    });

    it('should respond to touch when enabled', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation({ onSwipeLeft, enabled: true })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(40, 100) as TouchEvent);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should default to enabled', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipeNavigation({ onSwipeLeft }));

      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(40, 100) as TouchEvent);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle touchEnd without touchStart gracefully', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipeNavigation({ onSwipeLeft }));

      // No error should be thrown
      act(() => {
        result.current.onTouchEnd(createTouchEvent(40, 100) as TouchEvent);
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('should handle touchMove without touchStart gracefully', () => {
      const { result } = renderHook(() => useSwipeNavigation({}));

      // No error should be thrown
      act(() => {
        result.current.onTouchMove(createTouchEvent(40, 100) as TouchEvent);
      });

      expect(result.current.isSwiping).toBe(false);
    });

    it('should reset state between independent swipes', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() =>
        useSwipeNavigation({ onSwipeLeft, onSwipeRight })
      );

      // First swipe left
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(40, 100) as TouchEvent);
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(result.current.isSwiping).toBe(false);

      // Second swipe right
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent);
        result.current.onTouchEnd(createTouchEvent(160, 100) as TouchEvent);
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });
});
