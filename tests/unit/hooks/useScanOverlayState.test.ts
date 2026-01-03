/**
 * useScanOverlayState Hook Tests
 *
 * Story 14.3: Scan Overlay Flow - Task 2
 * Epic 14: Core Implementation
 *
 * Tests for the scan overlay state machine hook:
 * - State transitions: idle → uploading → processing → ready → error
 * - ETA calculation from historical processing times
 * - Progress tracking for upload state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useScanOverlayState,
  ScanOverlayStateHook,
} from '../../../src/hooks/useScanOverlayState';

describe('useScanOverlayState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial state', () => {
    it('should start in idle state', () => {
      const { result } = renderHook(() => useScanOverlayState());
      expect(result.current.state).toBe('idle');
    });

    it('should have zero progress initially', () => {
      const { result } = renderHook(() => useScanOverlayState());
      expect(result.current.progress).toBe(0);
    });

    it('should have null ETA initially', () => {
      const { result } = renderHook(() => useScanOverlayState());
      expect(result.current.eta).toBeNull();
    });

    it('should have null error initially', () => {
      const { result } = renderHook(() => useScanOverlayState());
      expect(result.current.error).toBeNull();
    });
  });

  describe('State transitions', () => {
    it('should transition to uploading state', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
      });

      expect(result.current.state).toBe('uploading');
      expect(result.current.progress).toBe(0);
    });

    it('should update progress during upload', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.setProgress(50);
      });

      expect(result.current.progress).toBe(50);
    });

    it('should clamp progress between 0 and 100', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.setProgress(-10);
      });
      expect(result.current.progress).toBe(0);

      act(() => {
        result.current.setProgress(150);
      });
      expect(result.current.progress).toBe(100);
    });

    it('should transition to processing state', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.startProcessing();
      });

      expect(result.current.state).toBe('processing');
      expect(result.current.progress).toBe(100); // Upload complete
    });

    it('should transition to ready state', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.startProcessing();
        result.current.setReady();
      });

      expect(result.current.state).toBe('ready');
    });

    it('should transition to error state with details', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.setError('network', 'Failed to connect');
      });

      expect(result.current.state).toBe('error');
      expect(result.current.error).toEqual({
        type: 'network',
        message: 'Failed to connect',
      });
    });

    it('should reset to idle state', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.setProgress(50);
        result.current.reset();
      });

      expect(result.current.state).toBe('idle');
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.eta).toBeNull();
    });

    it('should retry from error state', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.setError('api', 'Server error');
        result.current.retry();
      });

      expect(result.current.state).toBe('idle');
      expect(result.current.error).toBeNull();
    });
  });

  describe('ETA calculation', () => {
    it('should return default ETA when no history exists', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.startProcessing();
      });

      // Default ETA is 4 seconds
      expect(result.current.eta).toBe(4);
    });

    it('should calculate ETA from historical processing times', () => {
      const { result } = renderHook(() => useScanOverlayState());

      // Simulate a few processing cycles to build history
      // First cycle: 3 seconds
      act(() => {
        result.current.startUpload();
        result.current.startProcessing();
      });
      act(() => {
        vi.advanceTimersByTime(3000);
        result.current.setReady();
      });

      // Second cycle: 5 seconds
      act(() => {
        result.current.reset();
        result.current.startUpload();
        result.current.startProcessing();
      });
      act(() => {
        vi.advanceTimersByTime(5000);
        result.current.setReady();
      });

      // Third cycle: should show average of previous times
      act(() => {
        result.current.reset();
        result.current.startUpload();
        result.current.startProcessing();
      });

      // Average of 3 and 5 is 4 (rounded)
      expect(result.current.eta).toBe(4);
    });

    it('should use last 5 processing times for average', () => {
      const { result } = renderHook(() => useScanOverlayState());

      // Simulate 6 processing cycles with varying times
      const times = [2, 4, 6, 8, 10, 12]; // seconds

      for (const time of times) {
        act(() => {
          result.current.reset();
          result.current.startUpload();
          result.current.startProcessing();
        });
        act(() => {
          vi.advanceTimersByTime(time * 1000);
          result.current.setReady();
        });
      }

      // Start new cycle
      act(() => {
        result.current.reset();
        result.current.startUpload();
        result.current.startProcessing();
      });

      // Should use last 5 times: 4, 6, 8, 10, 12
      // Average: (4 + 6 + 8 + 10 + 12) / 5 = 8
      expect(result.current.eta).toBe(8);
    });

    it('should clear ETA when ready', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.startProcessing();
      });

      expect(result.current.eta).not.toBeNull();

      act(() => {
        result.current.setReady();
      });

      expect(result.current.eta).toBeNull();
    });

    it('should clear ETA on error', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.startProcessing();
      });

      expect(result.current.eta).not.toBeNull();

      act(() => {
        result.current.setError('timeout', 'Processing timed out');
      });

      expect(result.current.eta).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple rapid state transitions', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.setProgress(25);
        result.current.setProgress(50);
        result.current.setProgress(75);
        result.current.setProgress(100);
        result.current.startProcessing();
      });

      expect(result.current.state).toBe('processing');
      expect(result.current.progress).toBe(100);
    });

    it('should handle reset during processing', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.startProcessing();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
        result.current.reset();
      });

      expect(result.current.state).toBe('idle');
    });

    it('should handle error during upload', () => {
      const { result } = renderHook(() => useScanOverlayState());

      act(() => {
        result.current.startUpload();
        result.current.setProgress(30);
        result.current.setError('network', 'Upload failed');
      });

      expect(result.current.state).toBe('error');
      expect(result.current.error?.type).toBe('network');
    });
  });
});
