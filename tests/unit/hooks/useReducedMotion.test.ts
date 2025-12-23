/**
 * Tests for useReducedMotion hook
 *
 * Story 11.3: Animated Item Reveal
 * Epic 11: Quick Save & Scan Flow Optimization
 *
 * Tests the accessibility hook that detects user's motion preferences.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../../../src/hooks/useReducedMotion';

describe('useReducedMotion', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let addEventListenerMock: ReturnType<typeof vi.fn>;
  let removeEventListenerMock: ReturnType<typeof vi.fn>;
  let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;

  beforeEach(() => {
    addEventListenerMock = vi.fn((event: string, handler: (event: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        changeHandler = handler;
      }
    });
    removeEventListenerMock = vi.fn();

    matchMediaMock = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      addListener: addEventListenerMock, // Deprecated but for compatibility
      removeListener: removeEventListenerMock, // Deprecated but for compatibility
      dispatchEvent: vi.fn(),
    }));

    vi.stubGlobal('matchMedia', matchMediaMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    changeHandler = null;
  });

  it('should return false when prefers-reduced-motion is not set', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('should return true when prefers-reduced-motion: reduce is set', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      addListener: addEventListenerMock,
      removeListener: removeEventListenerMock,
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('should query the correct media query', () => {
    renderHook(() => useReducedMotion());
    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('should add event listener on mount', () => {
    renderHook(() => useReducedMotion());
    expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should update when preference changes', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    // Simulate preference change
    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });

  it('should handle preference change back to normal motion', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      addListener: addEventListenerMock,
      removeListener: removeEventListenerMock,
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);

    // Simulate preference change back to normal
    act(() => {
      if (changeHandler) {
        changeHandler({ matches: false } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(false);
  });
});
