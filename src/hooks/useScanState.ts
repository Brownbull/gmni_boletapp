/**
 * Story 11.5: Scan Status Clarity - Scan State Machine Hook
 *
 * Provides a state machine for tracking scan status with clear visual feedback.
 * States: idle → uploading → processing → ready → (error at any point)
 *
 * @see docs/sprint-artifacts/epic11/story-11.5-scan-status-clarity.md
 */
import { useState, useCallback, useRef } from 'react';

/**
 * Scan state type representing the current phase of the scan process.
 *
 * - idle: Ready to scan, waiting for user action
 * - uploading: Image is being uploaded to server (has progress 0-100)
 * - processing: AI is processing the receipt image
 * - ready: Results are ready to display
 * - error: Something went wrong at any stage
 */
export type ScanState = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

/**
 * Error types for more specific error messages
 */
export type ScanErrorType =
  | 'network'      // Network/connectivity issues
  | 'timeout'      // Processing took too long
  | 'api'          // API returned an error
  | 'invalid'      // Invalid image or result
  | 'unknown';     // Unknown error

/**
 * Scan state hook return type
 */
export interface ScanStateHook {
  /** Current scan state */
  state: ScanState;
  /** Upload progress (0-100), only relevant during 'uploading' state */
  progress: number;
  /** Error details if state is 'error' */
  error: { type: ScanErrorType; message: string } | null;
  /** Estimated processing time in seconds (based on history) */
  estimatedTime: number | null;

  // State transitions
  /** Transition to uploading state */
  startUpload: () => void;
  /** Update upload progress (0-100) */
  setUploadProgress: (progress: number) => void;
  /** Transition to processing state */
  startProcessing: () => void;
  /** Transition to ready state */
  setReady: () => void;
  /** Transition to error state with details */
  setError: (type: ScanErrorType, message: string) => void;
  /** Reset to idle state (cancel or start over) */
  reset: () => void;
  /** Retry from error state (goes back to uploading) */
  retry: () => void;
}

/** Default estimated processing time in seconds */
const DEFAULT_ESTIMATED_TIME = 4;
/** Processing timeout in milliseconds (30 seconds) */
export const PROCESSING_TIMEOUT_MS = 30000;
/** Ready state display duration in milliseconds (500ms checkmark) */
export const READY_DISPLAY_MS = 500;

/**
 * Hook for managing scan state machine with progress and error tracking.
 *
 * @example
 * ```tsx
 * const { state, progress, startUpload, setUploadProgress, startProcessing, setReady, setError, reset } = useScanState();
 *
 * const handleScan = async (file: File) => {
 *   startUpload();
 *   await uploadWithProgress(file, setUploadProgress);
 *   startProcessing();
 *   const result = await processReceipt();
 *   setReady();
 * };
 * ```
 */
export function useScanState(): ScanStateHook {
  const [state, setState] = useState<ScanState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setErrorState] = useState<{ type: ScanErrorType; message: string } | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

  // Track processing start time for timeout handling
  const processingStartRef = useRef<number | null>(null);
  // Track historical processing times for estimation
  const processingTimesRef = useRef<number[]>([]);

  /**
   * Calculate estimated processing time based on historical data
   */
  const calculateEstimatedTime = useCallback((): number => {
    const times = processingTimesRef.current;
    if (times.length === 0) {
      return DEFAULT_ESTIMATED_TIME;
    }
    // Average of last 5 processing times
    const recentTimes = times.slice(-5);
    const avg = recentTimes.reduce((sum, t) => sum + t, 0) / recentTimes.length;
    return Math.round(avg);
  }, []);

  /**
   * Record a processing time for future estimation
   */
  const recordProcessingTime = useCallback((seconds: number) => {
    processingTimesRef.current.push(seconds);
    // Keep only last 10 times
    if (processingTimesRef.current.length > 10) {
      processingTimesRef.current = processingTimesRef.current.slice(-10);
    }
  }, []);

  const startUpload = useCallback(() => {
    setState('uploading');
    setProgress(0);
    setErrorState(null);
    setEstimatedTime(null);
  }, []);

  const setUploadProgress = useCallback((newProgress: number) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
  }, []);

  const startProcessing = useCallback(() => {
    setState('processing');
    setProgress(100); // Upload complete
    processingStartRef.current = Date.now();
    setEstimatedTime(calculateEstimatedTime());
  }, [calculateEstimatedTime]);

  const setReady = useCallback(() => {
    // Record processing time for future estimation
    if (processingStartRef.current) {
      const processingTime = Math.round((Date.now() - processingStartRef.current) / 1000);
      recordProcessingTime(processingTime);
      processingStartRef.current = null;
    }
    setState('ready');
    setEstimatedTime(null);
  }, [recordProcessingTime]);

  const setError = useCallback((type: ScanErrorType, message: string) => {
    setState('error');
    setErrorState({ type, message });
    setEstimatedTime(null);
    processingStartRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setProgress(0);
    setErrorState(null);
    setEstimatedTime(null);
    processingStartRef.current = null;
  }, []);

  const retry = useCallback(() => {
    // Reset error and go back to idle (caller will restart the process)
    setErrorState(null);
    setState('idle');
    setProgress(0);
    setEstimatedTime(null);
  }, []);

  return {
    state,
    progress,
    error,
    estimatedTime,
    startUpload,
    setUploadProgress,
    startProcessing,
    setReady,
    setError,
    reset,
    retry,
  };
}

export default useScanState;
