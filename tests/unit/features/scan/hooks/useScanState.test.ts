/**
 * useScanState Hook Tests
 *
 * Story 11.5: Scan Status Clarity - Unit tests for scan state machine hook
 * @see docs/sprint-artifacts/epic11/story-11.5-scan-status-clarity.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useScanState,
  PROCESSING_TIMEOUT_MS,
  READY_DISPLAY_MS,
  type ScanState,
  type ScanErrorType,
} from '@features/scan/hooks/useScanState';

// ============================================================================
// Test Setup
// ============================================================================

describe('useScanState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  describe('initial state', () => {
    it('should start in idle state', () => {
      const { result } = renderHook(() => useScanState());

      expect(result.current.state).toBe('idle');
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.estimatedTime).toBeNull();
    });
  });

  // ============================================================================
  // State Transition Tests
  // ============================================================================

  describe('state transitions', () => {
    it('should transition from idle to uploading when startUpload is called', () => {
      const { result } = renderHook(() => useScanState());

      act(() => {
        result.current.startUpload();
      });

      expect(result.current.state).toBe('uploading');
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
    });

    it('should update progress during uploading state', () => {
      const { result } = renderHook(() => useScanState());

      act(() => {
        result.current.startUpload();
      });

      act(() => {
        result.current.setUploadProgress(50);
      });

      expect(result.current.progress).toBe(50);

      act(() => {
        result.current.setUploadProgress(100);
      });

      expect(result.current.progress).toBe(100);
    });

    it('should clamp progress between 0 and 100', () => {
      const { result } = renderHook(() => useScanState());

      act(() => {
        result.current.startUpload();
      });

      act(() => {
        result.current.setUploadProgress(-10);
      });
      expect(result.current.progress).toBe(0);

      act(() => {
        result.current.setUploadProgress(150);
      });
      expect(result.current.progress).toBe(100);
    });

    it('should transition from uploading to processing', () => {
      const { result } = renderHook(() => useScanState());

      act(() => {
        result.current.startUpload();
        result.current.setUploadProgress(100);
        result.current.startProcessing();
      });

      expect(result.current.state).toBe('processing');
      expect(result.current.progress).toBe(100);
    });

    it('should set estimated time when entering processing state', () => {
      const { result } = renderHook(() => useScanState());

      act(() => {
        result.current.startUpload();
        result.current.startProcessing();
      });

      // Default estimated time should be 4 seconds
      expect(result.current.estimatedTime).toBe(4);
    });

    it('should transition from processing to ready', () => {
      const { result } = renderHook(() => useScanState());

      act(() => {
        result.current.startUpload();
        result.current.startProcessing();
        result.current.setReady();
      });

      expect(result.current.state).toBe('ready');
      expect(result.current.estimatedTime).toBeNull();
    });

    it('should transition to error state from any state', () => {
      const { result } = renderHook(() => useScanState());

      // From idle
      act(() => {
        result.current.setError('network', 'Network error');
      });
      expect(result.current.state).toBe('error');
      expect(result.current.error?.type).toBe('network');
      expect(result.current.error?.message).toBe('Network error');

      // Reset and try from uploading
      act(() => {
        result.current.reset();
        result.current.startUpload();
        result.current.setError('timeout', 'Timeout error');
      });
      expect(result.current.state).toBe('error');
      expect(result.current.error?.type).toBe('timeout');

      // Reset and try from processing
      act(() => {
        result.current.reset();
        result.current.startUpload();
        result.current.startProcessing();
        result.current.setError('api', 'API error');
      });
      expect(result.current.state).toBe('error');
      expect(result.current.error?.type).toBe('api');
    });
  });

  // ============================================================================
  // Reset and Retry Tests
  // ============================================================================

  describe('reset and retry', () => {
    it('should reset to idle state when reset is called', () => {
      const { result } = renderHook(() => useScanState());

      act(() => {
        result.current.startUpload();
        result.current.setUploadProgress(50);
        result.current.reset();
      });

      expect(result.current.state).toBe('idle');
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.estimatedTime).toBeNull();
    });

    it('should reset from error state when retry is called', () => {
      const { result } = renderHook(() => useScanState());

      act(() => {
        result.current.startUpload();
        result.current.setError('network', 'Network error');
      });

      expect(result.current.state).toBe('error');

      act(() => {
        result.current.retry();
      });

      expect(result.current.state).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(0);
    });
  });

  // ============================================================================
  // Processing Time Estimation Tests
  // ============================================================================

  describe('processing time estimation', () => {
    it('should use default estimated time when no history', () => {
      const { result } = renderHook(() => useScanState());

      act(() => {
        result.current.startUpload();
        result.current.startProcessing();
      });

      expect(result.current.estimatedTime).toBe(4); // Default
    });

    it('should calculate estimated time based on historical data', () => {
      const { result } = renderHook(() => useScanState());

      // Complete first scan (simulating 3 second processing)
      act(() => {
        result.current.startUpload();
        result.current.startProcessing();
      });

      // Advance time by 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
        result.current.setReady();
      });

      // Reset and start another scan
      act(() => {
        result.current.reset();
        result.current.startUpload();
        result.current.startProcessing();
      });

      // Estimated time should be based on the previous 3 second processing
      expect(result.current.estimatedTime).toBe(3);
    });
  });

  // ============================================================================
  // Error Type Tests
  // ============================================================================

  describe('error types', () => {
    const errorTypes: ScanErrorType[] = ['network', 'timeout', 'api', 'invalid', 'unknown'];

    errorTypes.forEach((errorType) => {
      it(`should handle ${errorType} error type`, () => {
        const { result } = renderHook(() => useScanState());

        act(() => {
          result.current.setError(errorType, `Test ${errorType} error`);
        });

        expect(result.current.error?.type).toBe(errorType);
        expect(result.current.error?.message).toBe(`Test ${errorType} error`);
      });
    });
  });

  // ============================================================================
  // Constants Tests
  // ============================================================================

  describe('exported constants', () => {
    it('should export PROCESSING_TIMEOUT_MS', () => {
      expect(PROCESSING_TIMEOUT_MS).toBe(30000);
    });

    it('should export READY_DISPLAY_MS', () => {
      expect(READY_DISPLAY_MS).toBe(500);
    });
  });

  // ============================================================================
  // Full Flow Tests
  // ============================================================================

  describe('full scan flow', () => {
    it('should handle complete successful scan flow', () => {
      const { result } = renderHook(() => useScanState());

      // Start upload
      act(() => {
        result.current.startUpload();
      });
      expect(result.current.state).toBe('uploading');

      // Progress through upload
      act(() => {
        result.current.setUploadProgress(25);
      });
      expect(result.current.progress).toBe(25);

      act(() => {
        result.current.setUploadProgress(50);
      });
      expect(result.current.progress).toBe(50);

      act(() => {
        result.current.setUploadProgress(100);
      });
      expect(result.current.progress).toBe(100);

      // Start processing
      act(() => {
        result.current.startProcessing();
      });
      expect(result.current.state).toBe('processing');
      expect(result.current.estimatedTime).toBeDefined();

      // Complete
      act(() => {
        result.current.setReady();
      });
      expect(result.current.state).toBe('ready');
    });

    it('should handle scan flow with error and retry', () => {
      const { result } = renderHook(() => useScanState());

      // Start upload
      act(() => {
        result.current.startUpload();
        result.current.setUploadProgress(50);
      });

      // Error during upload
      act(() => {
        result.current.setError('network', 'Connection lost');
      });
      expect(result.current.state).toBe('error');

      // Retry
      act(() => {
        result.current.retry();
      });
      expect(result.current.state).toBe('idle');

      // Successfully complete after retry
      act(() => {
        result.current.startUpload();
        result.current.setUploadProgress(100);
        result.current.startProcessing();
        result.current.setReady();
      });
      expect(result.current.state).toBe('ready');
    });

    it('should handle cancel during upload', () => {
      const { result } = renderHook(() => useScanState());

      act(() => {
        result.current.startUpload();
        result.current.setUploadProgress(50);
      });

      expect(result.current.state).toBe('uploading');

      act(() => {
        result.current.reset();
      });

      expect(result.current.state).toBe('idle');
      expect(result.current.progress).toBe(0);
    });

    it('should handle cancel during processing', () => {
      const { result } = renderHook(() => useScanState());

      act(() => {
        result.current.startUpload();
        result.current.setUploadProgress(100);
        result.current.startProcessing();
      });

      expect(result.current.state).toBe('processing');

      act(() => {
        result.current.reset();
      });

      expect(result.current.state).toBe('idle');
      expect(result.current.estimatedTime).toBeNull();
    });
  });
});
