/**
 * Tests for AnimationContext Provider
 *
 * Story 14.1: Animation Framework
 * Epic 14: Core Implementation
 *
 * Tests context provider and hook functionality.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, screen, act } from '@testing-library/react';
import {
  AnimationProvider,
  useAnimationContext,
} from '../../../../src/components/animation/AnimationContext';
import { STAGGER } from '../../../../src/components/animation/constants';

// Mock useReducedMotion
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from '../../../../src/hooks/useReducedMotion';

describe('AnimationContext', () => {
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

  describe('AnimationProvider', () => {
    it('should render children', () => {
      render(
        <AnimationProvider>
          <div data-testid="child">Test Child</div>
        </AnimationProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should start with animations enabled', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.animationsEnabled).toBe(true);
    });

    it('should respect initialEnabled prop', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnimationProvider initialEnabled={false}>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.animationsEnabled).toBe(false);
    });
  });

  describe('useAnimationContext', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AnimationProvider>{children}</AnimationProvider>
    );

    it('should provide breathingPhase', () => {
      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(typeof result.current.breathingPhase).toBe('number');
      expect(result.current.breathingPhase).toBeGreaterThanOrEqual(0);
      expect(result.current.breathingPhase).toBeLessThanOrEqual(1);
    });

    it('should provide isReducedMotion', () => {
      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.isReducedMotion).toBe(false);
    });

    it('should provide getStaggerDelay function', () => {
      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(typeof result.current.getStaggerDelay).toBe('function');
    });

    it('should provide setAnimationsEnabled function', () => {
      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(typeof result.current.setAnimationsEnabled).toBe('function');
    });
  });

  describe('breathing phase updates', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AnimationProvider>{children}</AnimationProvider>
    );

    it('should update breathingPhase during animation', () => {
      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      const initialPhase = result.current.breathingPhase;

      // Advance animation frames
      advanceRAF(16);
      advanceRAF(500);

      expect(result.current.breathingPhase).not.toBe(initialPhase);
    });

    it('should stop animation when animations are disabled', () => {
      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      // Disable animations
      act(() => {
        result.current.setAnimationsEnabled(false);
      });

      advanceRAF(500);

      expect(result.current.breathingPhase).toBe(0);
    });
  });

  describe('reduced motion', () => {
    it('should disable animations when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.isReducedMotion).toBe(true);
      expect(result.current.animationsEnabled).toBe(false);
    });

    it('should return zero stagger delay when reduced motion', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.getStaggerDelay(5)).toBe(0);
    });
  });

  describe('getStaggerDelay', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AnimationProvider>{children}</AnimationProvider>
    );

    it('should calculate correct stagger delays', () => {
      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.getStaggerDelay(0)).toBe(0);
      expect(result.current.getStaggerDelay(1)).toBe(STAGGER.DEFAULT);
      expect(result.current.getStaggerDelay(2)).toBe(STAGGER.DEFAULT * 2);
    });

    it('should respect staggerMs option', () => {
      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.getStaggerDelay(1, { staggerMs: 50 })).toBe(50);
    });

    it('should respect initialDelayMs option', () => {
      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.getStaggerDelay(0, { initialDelayMs: 200 })).toBe(200);
      expect(result.current.getStaggerDelay(1, { initialDelayMs: 200 })).toBe(300);
    });

    it('should compress for long lists with totalItems', () => {
      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      // 50 items would exceed max duration
      const delay = result.current.getStaggerDelay(49, { totalItems: 50 });

      // Should be less than 49 * 100 = 4900ms
      expect(delay).toBeLessThan(4900);
      expect(delay).toBeLessThanOrEqual(STAGGER.MAX_DURATION);
    });

    it('should respect maxDurationMs option', () => {
      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      // 20 items × 100ms = 1900ms, but max is 1000ms
      const delay = result.current.getStaggerDelay(19, {
        totalItems: 20,
        maxDurationMs: 1000,
      });

      expect(delay).toBeLessThanOrEqual(1000);
    });
  });

  describe('setAnimationsEnabled', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AnimationProvider>{children}</AnimationProvider>
    );

    it('should toggle animations enabled state', () => {
      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.animationsEnabled).toBe(true);

      act(() => {
        result.current.setAnimationsEnabled(false);
      });

      expect(result.current.animationsEnabled).toBe(false);

      act(() => {
        result.current.setAnimationsEnabled(true);
      });

      expect(result.current.animationsEnabled).toBe(true);
    });
  });

  describe('without provider', () => {
    it('should return default values when used outside provider', () => {
      const { result } = renderHook(() => useAnimationContext());

      // Should have default values without throwing
      expect(result.current.breathingPhase).toBe(0);
      expect(result.current.isReducedMotion).toBe(false);
      expect(result.current.animationsEnabled).toBe(true);
      expect(result.current.getStaggerDelay(1)).toBe(0);
    });
  });
});
