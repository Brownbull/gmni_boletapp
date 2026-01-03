/**
 * useScanOverlayState Hook
 *
 * Story 14.3: Scan Overlay Flow - Task 2
 * Epic 14: Core Implementation
 *
 * State machine hook for managing scan overlay state with:
 * - State transitions: idle → uploading → processing → ready → error
 * - ETA calculation based on average processing time history
 * - Progress tracking for upload state
 *
 * This extends the existing useScanState hook with overlay-specific features
 * like ETA calculation and coordinated state management.
 *
 * @see docs/sprint-artifacts/epic14/stories/story-14.3-scan-overlay-flow.md
 * @see src/hooks/useScanState.ts - Base state machine
 */

import { useState, useCallback, useRef } from 'react';
import type { ScanErrorType } from './useScanState';

/**
 * Scan overlay state types
 */
export type ScanOverlayState = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

/**
 * Return type for useScanOverlayState hook
 */
export interface ScanOverlayStateHook {
  /** Current state of the overlay */
  state: ScanOverlayState;
  /** Upload progress (0-100) */
  progress: number;
  /** Estimated time remaining in seconds (based on history) */
  eta: number | null;
  /** Error details if in error state */
  error: { type: ScanErrorType; message: string } | null;

  // State transitions
  /** Transition to uploading state */
  startUpload: () => void;
  /** Update upload progress (0-100) */
  setProgress: (progress: number) => void;
  /** Transition to processing state */
  startProcessing: () => void;
  /** Transition to ready state */
  setReady: () => void;
  /** Transition to error state */
  setError: (type: ScanErrorType, message: string) => void;
  /** Reset to idle state */
  reset: () => void;
  /** Retry from error state */
  retry: () => void;
}

/** Default estimated processing time in seconds (when no history) */
const DEFAULT_ESTIMATED_TIME = 4;

/** Maximum number of processing times to keep in history */
const MAX_HISTORY_SIZE = 10;

/** Number of recent times to use for average calculation */
const RECENT_TIMES_COUNT = 5;

/**
 * Hook for managing scan overlay state with ETA calculation.
 *
 * Provides a complete state machine for the scan overlay flow:
 * - Tracks upload progress (0-100)
 * - Calculates ETA based on historical processing times
 * - Handles error states and retry logic
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   progress,
 *   eta,
 *   error,
 *   startUpload,
 *   setProgress,
 *   startProcessing,
 *   setReady,
 *   setError,
 *   reset,
 *   retry,
 * } = useScanOverlayState();
 *
 * // In scan handler:
 * async function handleScan(file: File) {
 *   startUpload();
 *   await uploadFile(file, setProgress);
 *   startProcessing();
 *   try {
 *     const result = await processReceipt();
 *     setReady();
 *     return result;
 *   } catch (e) {
 *     setError('api', e.message);
 *   }
 * }
 * ```
 */
export function useScanOverlayState(): ScanOverlayStateHook {
  const [state, setState] = useState<ScanOverlayState>('idle');
  const [progress, setProgressState] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const [error, setErrorState] = useState<{ type: ScanErrorType; message: string } | null>(null);

  // Track processing start time for ETA calculation
  const processingStartRef = useRef<number | null>(null);

  // Track historical processing times for ETA estimation
  const processingTimesRef = useRef<number[]>([]);

  /**
   * Calculate estimated processing time based on historical data.
   * Uses average of last N processing times, or default if no history.
   */
  const calculateEstimatedTime = useCallback((): number => {
    const times = processingTimesRef.current;

    if (times.length === 0) {
      return DEFAULT_ESTIMATED_TIME;
    }

    // Use last N times for average
    const recentTimes = times.slice(-RECENT_TIMES_COUNT);
    const sum = recentTimes.reduce((acc, time) => acc + time, 0);
    const avg = sum / recentTimes.length;

    return Math.round(avg);
  }, []);

  /**
   * Record a completed processing time for future ETA estimation.
   */
  const recordProcessingTime = useCallback((seconds: number) => {
    processingTimesRef.current.push(seconds);

    // Keep only last N times
    if (processingTimesRef.current.length > MAX_HISTORY_SIZE) {
      processingTimesRef.current = processingTimesRef.current.slice(-MAX_HISTORY_SIZE);
    }
  }, []);

  /**
   * Start the upload phase.
   */
  const startUpload = useCallback(() => {
    setState('uploading');
    setProgressState(0);
    setErrorState(null);
    setEta(null);
  }, []);

  /**
   * Update upload progress.
   * Clamps value between 0 and 100.
   */
  const setProgress = useCallback((newProgress: number) => {
    const clamped = Math.min(100, Math.max(0, newProgress));
    setProgressState(clamped);
  }, []);

  /**
   * Start the processing phase.
   * Records start time for ETA calculation.
   */
  const startProcessing = useCallback(() => {
    setState('processing');
    setProgressState(100); // Upload complete
    processingStartRef.current = Date.now();
    setEta(calculateEstimatedTime());
  }, [calculateEstimatedTime]);

  /**
   * Mark processing as complete.
   * Records processing time for future ETA estimates.
   */
  const setReady = useCallback(() => {
    // Record processing time if we were processing
    if (processingStartRef.current !== null) {
      const processingTime = Math.round((Date.now() - processingStartRef.current) / 1000);
      recordProcessingTime(processingTime);
      processingStartRef.current = null;
    }

    setState('ready');
    setEta(null);
  }, [recordProcessingTime]);

  /**
   * Set error state with details.
   */
  const setError = useCallback((type: ScanErrorType, message: string) => {
    setState('error');
    setErrorState({ type, message });
    setEta(null);
    processingStartRef.current = null;
  }, []);

  /**
   * Reset to idle state.
   */
  const reset = useCallback(() => {
    setState('idle');
    setProgressState(0);
    setErrorState(null);
    setEta(null);
    processingStartRef.current = null;
  }, []);

  /**
   * Retry after error - resets to idle for caller to restart.
   */
  const retry = useCallback(() => {
    setErrorState(null);
    setState('idle');
    setProgressState(0);
    setEta(null);
  }, []);

  return {
    state,
    progress,
    eta,
    error,
    startUpload,
    setProgress,
    startProcessing,
    setReady,
    setError,
    reset,
    retry,
  };
}

export default useScanOverlayState;
