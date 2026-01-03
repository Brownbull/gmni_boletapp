/**
 * Tests for useNavigationDirection Hook
 *
 * Story 14.2: Screen Transition System
 * Epic 14: Core Implementation
 *
 * Tests navigation direction tracking for slide animations (AC #5).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigationDirection } from '../../../../src/components/animation/useNavigationDirection';

describe('useNavigationDirection', () => {
  describe('initial state', () => {
    it('should initialize with none direction', () => {
      const { result } = renderHook(() => useNavigationDirection('dashboard'));

      expect(result.current.direction).toBe('none');
    });

    it('should initialize history with current view', () => {
      const { result } = renderHook(() => useNavigationDirection('dashboard'));

      expect(result.current.history).toEqual(['dashboard']);
    });

    it('should start with canGoBack as false', () => {
      const { result } = renderHook(() => useNavigationDirection('dashboard'));

      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe('forward navigation', () => {
    it('should detect forward direction when view changes', () => {
      const { result, rerender } = renderHook(
        ({ view }) => useNavigationDirection(view),
        { initialProps: { view: 'dashboard' } }
      );

      rerender({ view: 'trends' });

      expect(result.current.direction).toBe('forward');
    });

    it('should add new view to history', () => {
      const { result, rerender } = renderHook(
        ({ view }) => useNavigationDirection(view),
        { initialProps: { view: 'dashboard' } }
      );

      rerender({ view: 'trends' });

      expect(result.current.history).toEqual(['dashboard', 'trends']);
    });

    it('should enable canGoBack after forward navigation', () => {
      const { result, rerender } = renderHook(
        ({ view }) => useNavigationDirection(view),
        { initialProps: { view: 'dashboard' } }
      );

      rerender({ view: 'trends' });

      expect(result.current.canGoBack).toBe(true);
    });

    it('should work with navigate function', () => {
      const { result } = renderHook(() => useNavigationDirection('dashboard'));

      act(() => {
        result.current.navigate('settings');
      });

      expect(result.current.direction).toBe('forward');
      expect(result.current.history).toEqual(['dashboard', 'settings']);
    });
  });

  describe('back navigation', () => {
    it('should detect back direction when returning to previous view', () => {
      const { result, rerender } = renderHook(
        ({ view }) => useNavigationDirection(view),
        { initialProps: { view: 'dashboard' } }
      );

      // Navigate forward
      rerender({ view: 'trends' });
      expect(result.current.direction).toBe('forward');

      // Navigate back
      rerender({ view: 'dashboard' });
      expect(result.current.direction).toBe('back');
    });

    it('should trim history when going back', () => {
      const { result, rerender } = renderHook(
        ({ view }) => useNavigationDirection(view),
        { initialProps: { view: 'dashboard' } }
      );

      rerender({ view: 'trends' });
      rerender({ view: 'settings' });
      expect(result.current.history).toEqual(['dashboard', 'trends', 'settings']);

      // Go back to dashboard
      rerender({ view: 'dashboard' });
      expect(result.current.history).toEqual(['dashboard']);
    });

    it('should work with goBack function', () => {
      const { result } = renderHook(() => useNavigationDirection('dashboard'));

      act(() => {
        result.current.navigate('trends');
      });
      expect(result.current.history).toEqual(['dashboard', 'trends']);

      let previousView: string | null = null;
      act(() => {
        previousView = result.current.goBack();
      });

      expect(previousView).toBe('dashboard');
      expect(result.current.direction).toBe('back');
      expect(result.current.history).toEqual(['dashboard']);
    });

    it('should return null from goBack when no history', () => {
      const { result } = renderHook(() => useNavigationDirection('dashboard'));

      let previousView: string | null = null;
      act(() => {
        previousView = result.current.goBack();
      });

      expect(previousView).toBeNull();
      expect(result.current.history).toEqual(['dashboard']);
    });
  });

  describe('edge cases', () => {
    it('should not add duplicate consecutive entries', () => {
      const { result, rerender } = renderHook(
        ({ view }) => useNavigationDirection(view),
        { initialProps: { view: 'dashboard' } }
      );

      rerender({ view: 'dashboard' }); // Same view
      rerender({ view: 'dashboard' }); // Same view again

      expect(result.current.history).toEqual(['dashboard']);
    });

    it('should prevent duplicate when using navigate function', () => {
      const { result } = renderHook(() => useNavigationDirection('dashboard'));

      act(() => {
        result.current.navigate('dashboard');
      });

      expect(result.current.history).toEqual(['dashboard']);
    });

    it('should handle complex navigation sequences', () => {
      const { result, rerender } = renderHook(
        ({ view }) => useNavigationDirection(view),
        { initialProps: { view: 'dashboard' } }
      );

      // Forward: dashboard -> trends -> settings
      rerender({ view: 'trends' });
      rerender({ view: 'settings' });
      expect(result.current.history).toEqual(['dashboard', 'trends', 'settings']);

      // Back: settings -> trends
      rerender({ view: 'trends' });
      expect(result.current.direction).toBe('back');
      expect(result.current.history).toEqual(['dashboard', 'trends']);

      // Forward: trends -> insights
      rerender({ view: 'insights' });
      expect(result.current.direction).toBe('forward');
      expect(result.current.history).toEqual(['dashboard', 'trends', 'insights']);
    });
  });

  describe('reset function', () => {
    it('should reset history to single view', () => {
      const { result, rerender } = renderHook(
        ({ view }) => useNavigationDirection(view),
        { initialProps: { view: 'dashboard' } }
      );

      rerender({ view: 'trends' });
      rerender({ view: 'settings' });

      act(() => {
        result.current.reset();
      });

      expect(result.current.history).toEqual(['settings']);
      expect(result.current.direction).toBe('none');
    });

    it('should reset to specified initial view', () => {
      const { result } = renderHook(() => useNavigationDirection('settings'));

      act(() => {
        result.current.navigate('trends');
      });

      act(() => {
        result.current.reset('dashboard');
      });

      expect(result.current.history).toEqual(['dashboard']);
      expect(result.current.canGoBack).toBe(false);
    });
  });

  describe('history limit', () => {
    it('should limit history to prevent memory issues', () => {
      const { result } = renderHook(() => useNavigationDirection('view0'));

      // Add many views
      for (let i = 1; i <= 100; i++) {
        act(() => {
          result.current.navigate(`view${i}`);
        });
      }

      // History should be capped (MAX_HISTORY_SIZE = 50)
      expect(result.current.history.length).toBeLessThanOrEqual(50);
    });
  });
});
