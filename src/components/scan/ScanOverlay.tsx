/**
 * ScanOverlay Component
 *
 * Story 14.3: Scan Overlay Flow
 * Epic 14: Core Implementation
 *
 * Non-blocking overlay displayed during receipt processing.
 * Shows progress feedback and allows user to navigate away.
 *
 * Features:
 * - Semi-transparent backdrop with blur effect
 * - State machine: idle → uploading → processing → ready → error
 * - ETA calculation based on average processing time
 * - Non-blocking navigation support
 * - Transitions to ready state (progressive item reveal handled by EditView via animateItems prop)
 *
 * @see docs/sprint-artifacts/epic14/stories/story-14.3-scan-overlay-flow.md
 * @see docs/uxui/mockups/01_views/scan-overlay.html
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Upload, Loader2, Check, AlertCircle, X, RefreshCw, Info } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { READY_DISPLAY_MS } from '../../hooks/useScanState';
import type { ScanErrorType } from '../../hooks/useScanState';
import type { ScanOverlayState } from '../../hooks/useScanOverlayState';
import { DURATION } from '../animation/constants';

// Re-export type for consumers
export type { ScanOverlayState };

/**
 * Props for ScanOverlay component
 */
export interface ScanOverlayProps {
  /** Current state of the scan overlay */
  state: ScanOverlayState;
  /** Upload progress (0-100), used in 'uploading' state */
  progress: number;
  /** Estimated time remaining in seconds, shown in 'processing' state */
  eta: number | null;
  /** Error details for 'error' state */
  error: { type: ScanErrorType; message: string } | null;
  /** Callback when user cancels the scan */
  onCancel: () => void;
  /** Callback when user clicks retry after error */
  onRetry: () => void;
  /** Callback when ready animation completes (for auto-dismiss) */
  onDismiss?: () => void;
  /** Theme for styling ('light' | 'dark') */
  theme: 'light' | 'dark';
  /** Translation function */
  t: (key: string) => string;
  /** Whether the overlay is visible */
  visible: boolean;
  /** Optional captured image URL to show behind the overlay (AC #1: User can see image during processing) */
  capturedImageUrl?: string;
}

/**
 * ScanOverlay - Non-blocking overlay during receipt processing
 *
 * Visual design from scan-overlay.html mockup:
 * - Semi-transparent backdrop with blur
 * - Centered progress card
 * - Circular progress indicator
 * - Status text with ETA
 * - Navigation tip
 */
export const ScanOverlay: React.FC<ScanOverlayProps> = ({
  state,
  progress,
  eta,
  error,
  onCancel,
  onRetry,
  onDismiss,
  theme,
  t,
  visible,
  capturedImageUrl,
}) => {
  const isDark = theme === 'dark';
  const prefersReducedMotion = useReducedMotion();

  // Track animation state for transitions
  const [isVisible, setIsVisible] = useState(false);

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // SVG circle calculations for progress indicator
  const circleRadius = 36;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const progressOffset = circleCircumference - (clampedProgress / 100) * circleCircumference;

  // Handle visibility transitions
  useEffect(() => {
    if (visible && state !== 'idle') {
      setIsVisible(true);
    } else if (!visible || state === 'idle') {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible, state]);

  // Auto-dismiss on ready state
  useEffect(() => {
    if (state === 'ready' && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, READY_DISPLAY_MS);
      return () => clearTimeout(timer);
    }
  }, [state, onDismiss]);

  // Get aria-label based on current state
  const getAriaLabel = useCallback(() => {
    switch (state) {
      case 'uploading':
        return t('scanUploading');
      case 'processing':
        return t('scanProcessing');
      case 'ready':
        return t('scanReady');
      case 'error':
        return t('scanError');
      default:
        return '';
    }
  }, [state, t]);

  // Don't render if not visible or idle
  if (!visible || state === 'idle') {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={getAriaLabel()}
      className={`fixed inset-x-0 top-0 z-40 flex items-center justify-center transition-opacity ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        transitionDuration: `${DURATION.NORMAL}ms`,
        // Leave space for nav bar (approx 80px + safe area) so user can still navigate
        bottom: 'calc(80px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))',
      }}
    >
      {/* AC #1: Captured image background - user can see the image during processing */}
      {capturedImageUrl && (
        <div className="absolute inset-0">
          <img
            src={capturedImageUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Backdrop - more transparent when image is shown */}
      <div
        data-testid="scan-overlay-backdrop"
        className={`absolute inset-0 ${capturedImageUrl ? 'bg-black/50' : 'bg-black/40'} backdrop-blur-sm ${
          !prefersReducedMotion ? 'transition-opacity' : ''
        }`}
        style={!prefersReducedMotion ? { transitionDuration: `${DURATION.NORMAL}ms` } : undefined}
        onClick={state === 'error' ? onCancel : undefined}
      />

      {/* Content container */}
      <div
        role="status"
        aria-live="polite"
        className={`relative z-10 flex flex-col items-center gap-5 ${
          !prefersReducedMotion ? 'transition-transform' : ''
        } ${isVisible ? 'scale-100' : 'scale-95'}`}
        style={!prefersReducedMotion ? { transitionDuration: `${DURATION.NORMAL}ms` } : undefined}
      >
        {/* Progress card */}
        <div
          className={`flex flex-col items-center gap-4 p-8 rounded-2xl shadow-xl ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}
          style={{
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          }}
        >
          {/* Uploading state */}
          {state === 'uploading' && (
            <>
              {/* Circular progress */}
              <div className="relative w-20 h-20">
                <svg
                  className="w-20 h-20 transform -rotate-90"
                  viewBox="0 0 80 80"
                >
                  {/* Track */}
                  <circle
                    cx="40"
                    cy="40"
                    r={circleRadius}
                    fill="none"
                    stroke={isDark ? '#1e293b' : '#e2e8f0'}
                    strokeWidth="6"
                  />
                  {/* Progress fill */}
                  <circle
                    cx="40"
                    cy="40"
                    r={circleRadius}
                    fill="none"
                    stroke="var(--accent, #3b82f6)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={progressOffset}
                    className="transition-[stroke-dashoffset] ease-out"
                    style={{ transitionDuration: `${DURATION.SLOW}ms` }}
                  />
                </svg>
                {/* Upload icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Upload
                    size={28}
                    className={`${!prefersReducedMotion ? 'animate-pulse' : ''}`}
                    style={{ color: 'var(--accent, #3b82f6)' }}
                  />
                </div>
              </div>

              {/* Progress bar for accessibility */}
              <div className="sr-only">
                <div
                  role="progressbar"
                  aria-valuenow={clampedProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>

              {/* Status text */}
              <div className="text-center">
                <div
                  className="text-base font-semibold mb-1"
                  style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                >
                  {t('scanUploading')}
                </div>
                <div
                  className="text-sm font-mono"
                  style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                >
                  {clampedProgress}%
                </div>
              </div>

              {/* Cancel button */}
              <button
                onClick={onCancel}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                aria-label={t('cancel')}
              >
                <X size={16} />
                {t('cancel')}
              </button>
            </>
          )}

          {/* Processing state */}
          {state === 'processing' && (
            <>
              {/* Circular progress - indeterminate spinner */}
              <div className="relative w-20 h-20">
                <svg
                  className={`w-20 h-20 ${!prefersReducedMotion ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '1.5s' }}
                  viewBox="0 0 80 80"
                >
                  {/* Track */}
                  <circle
                    cx="40"
                    cy="40"
                    r={circleRadius}
                    fill="none"
                    stroke={isDark ? '#1e293b' : '#e2e8f0'}
                    strokeWidth="6"
                  />
                  {/* Spinner arc */}
                  <circle
                    cx="40"
                    cy="40"
                    r={circleRadius}
                    fill="none"
                    stroke="var(--accent, #3b82f6)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circleCircumference * 0.25}
                    strokeDashoffset={0}
                  />
                </svg>
                {/* Loader icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2
                    size={28}
                    className={`${!prefersReducedMotion ? 'animate-spin' : ''}`}
                    style={{ color: 'var(--accent, #3b82f6)', animationDuration: '2s' }}
                  />
                </div>
              </div>

              {/* Status text */}
              <div className="text-center">
                <div
                  className="text-base font-semibold mb-1"
                  style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                >
                  {t('scanProcessing')}
                </div>
                {eta !== null && (
                  <div
                    className="text-sm"
                    style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                  >
                    ~{eta} {t('seconds')}
                  </div>
                )}
              </div>

              {/* Cancel button */}
              <button
                onClick={onCancel}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                aria-label={t('cancel')}
              >
                <X size={16} />
                {t('cancel')}
              </button>
            </>
          )}

          {/* Ready state */}
          {state === 'ready' && (
            <>
              {/* Success checkmark */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  !prefersReducedMotion ? 'animate-[checkmark-bounce_0.4s_ease-out_forwards]' : ''
                }`}
                style={{
                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                }}
              >
                <Check
                  size={32}
                  className="text-green-500"
                  strokeWidth={3}
                />
              </div>

              {/* Ready text */}
              <div
                className={`text-lg font-bold text-green-500 ${
                  !prefersReducedMotion
                    ? 'animate-[fade-slide-up_0.3s_ease-out_0.2s_forwards] opacity-0'
                    : ''
                }`}
              >
                {t('scanReady')}
              </div>
            </>
          )}

          {/* Error state */}
          {state === 'error' && error && (
            <>
              {/* Error icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                }}
              >
                <AlertCircle
                  size={32}
                  className="text-red-500"
                />
              </div>

              {/* Error text */}
              <div className="text-center max-w-xs">
                <div
                  className="text-lg font-bold mb-2"
                  style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                >
                  {t('scanError')}
                </div>
                <div
                  className="text-sm"
                  style={{ color: isDark ? '#94a3b8' : '#64748b' }}
                >
                  {error.message}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={onRetry}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors w-full"
                  aria-label={t('retry')}
                >
                  <RefreshCw size={16} />
                  {t('retry')}
                </button>
                <button
                  onClick={onCancel}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full ${
                    isDark
                      ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  aria-label={t('cancel')}
                >
                  <X size={16} />
                  {t('cancel')}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation tip - shown during processing */}
        {state === 'processing' && (
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-md ${
              isDark ? 'bg-slate-800' : 'bg-white/95'
            }`}
          >
            <Info size={16} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
            <span
              className="text-xs text-center"
              style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              {t('tipCanNavigateWhileProcessing')}
            </span>
          </div>
        )}
      </div>

      {/* Inline keyframes for animations */}
      <style>
        {`
          @keyframes checkmark-bounce {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); }
          }

          @keyframes fade-slide-up {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default ScanOverlay;
