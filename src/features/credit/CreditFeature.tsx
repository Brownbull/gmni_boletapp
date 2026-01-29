/**
 * Story 14e-18c: Credit Feature Orchestrator & App.tsx Integration
 *
 * CreditFeature orchestrator component that:
 * - Uses useCreditState hook for credit data
 * - Manages local state: showCreditWarning, creditCheckResult
 * - Provides handlers via context for credit operations
 * - Renders CreditWarningDialog when needed
 * - Headless component (no visible UI except dialog)
 * - Supports external triggering via `triggerCreditCheck` prop
 *
 * Pattern: Feature orchestrator pattern from Epic 14e-16 (BatchReviewFeature)
 * @see src/features/batch-review/BatchReviewFeature.tsx
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { useCreditState, type UseCreditStateResult, type CreditFirebaseServices } from './state';
import {
  type CreditHandlerContext,
  createBatchConfirmWithCreditCheck,
  createCreditWarningConfirm,
  createCreditWarningCancel,
} from './handlers';
import type { CreditCheckResult } from '@/services/creditService';
import { checkCreditSufficiency } from '@/services/creditService';
import { CreditWarningDialog } from '@/components/batch/CreditWarningDialog';

// =============================================================================
// Context Types
// =============================================================================

/**
 * Credit feature context value interface.
 * Extends UseCreditStateResult with dialog state and handlers.
 */
export interface CreditFeatureContextValue extends UseCreditStateResult {
  /** Whether credit warning dialog is visible */
  showCreditWarning: boolean;
  /** Credit check result for dialog display */
  creditCheckResult: CreditCheckResult | null;
  /** Handler to show credit warning before batch processing */
  handleBatchConfirmWithCreditCheck: () => void;
  /** Handler when user confirms in credit warning dialog */
  handleCreditWarningConfirm: () => void | Promise<void>;
  /** Handler when user cancels credit warning dialog */
  handleCreditWarningCancel: () => void;
  /** Handler to reduce batch size (for insufficient credits) */
  handleReduceBatch: () => void;
}

// =============================================================================
// Context
// =============================================================================

const CreditFeatureContext = createContext<CreditFeatureContextValue | null>(null);

/**
 * Hook to consume CreditFeature context.
 * Must be used within CreditFeature provider.
 *
 * @returns CreditFeatureContextValue
 * @throws Error if used outside CreditFeature provider
 *
 * @example
 * ```tsx
 * const { credits, handleBatchConfirmWithCreditCheck } = useCreditFeature();
 * ```
 */
export function useCreditFeature(): CreditFeatureContextValue {
  const ctx = useContext(CreditFeatureContext);
  if (!ctx) {
    throw new Error('useCreditFeature must be used within CreditFeature provider');
  }
  return ctx;
}

// =============================================================================
// Component Props
// =============================================================================

export interface CreditFeatureProps {
  /** Firebase Auth user (null when not authenticated) */
  user: User | null;
  /** Firebase services containing db and appId */
  services: CreditFirebaseServices | null;
  /** Callback when user confirms batch operation */
  onBatchConfirmed?: () => void | Promise<void>;
  /** Callback when batch size should be reduced */
  onReduceBatch?: (maxProcessable: number) => void;
  /**
   * Trigger to initiate credit check externally.
   * When this changes from false to true, the credit check flow starts.
   * Use with onCreditCheckComplete to reset the trigger after dialog closes.
   */
  triggerCreditCheck?: boolean;
  /**
   * Callback when credit check dialog closes (confirm or cancel).
   * Called with true if confirmed, false if cancelled.
   * Use this to reset triggerCreditCheck to false.
   */
  onCreditCheckComplete?: (confirmed: boolean) => void;
  /** Number of receipts in batch (for dialog display) */
  batchImageCount?: number;
  /** Current theme for dialog styling */
  theme?: 'light' | 'dark';
  /** Translation function for dialog text */
  t?: (key: string) => string;
  /** Children to render within provider */
  children?: React.ReactNode;
}

// =============================================================================
// Component Implementation
// =============================================================================

/**
 * CreditFeature orchestrator component.
 *
 * Provides credit state and handlers via context.
 * Renders CreditWarningDialog when showCreditWarning is true.
 *
 * @example
 * ```tsx
 * <CreditFeature
 *   user={user}
 *   services={services}
 *   onBatchConfirmed={startBatchProcessing}
 *   batchImageCount={batchImages.length}
 *   theme={theme}
 *   t={t}
 * >
 *   <BatchCaptureView />
 * </CreditFeature>
 * ```
 */
export function CreditFeature({
  user,
  services,
  onBatchConfirmed,
  onReduceBatch,
  triggerCreditCheck = false,
  onCreditCheckComplete,
  batchImageCount = 0,
  theme = 'light',
  t = (key: string) => key,
  children,
}: CreditFeatureProps): React.ReactElement {
  // Credit state from useCreditState hook
  const creditState = useCreditState(user, services);

  // Local dialog state
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [creditCheckResult, setCreditCheckResult] = useState<CreditCheckResult | null>(null);

  // Track previous trigger value to detect edge (false -> true)
  // Initialize to false so initial true prop triggers the check
  const prevTriggerRef = useRef(false);

  // Create handler context with wrapped onBatchConfirmed that also notifies completion
  const wrappedOnBatchConfirmed = useCallback(async () => {
    await onBatchConfirmed?.();
    onCreditCheckComplete?.(true);
  }, [onBatchConfirmed, onCreditCheckComplete]);

  const handlerContext: CreditHandlerContext = useMemo(
    () => ({
      credits: creditState.credits,
      setShowCreditWarning,
      setCreditCheckResult,
      onBatchConfirmed: wrappedOnBatchConfirmed,
    }),
    [creditState.credits, wrappedOnBatchConfirmed]
  );

  // Create handlers from factories
  const handleBatchConfirmWithCreditCheck = useMemo(
    () => createBatchConfirmWithCreditCheck(handlerContext),
    [handlerContext]
  );

  const handleCreditWarningConfirm = useMemo(
    () => createCreditWarningConfirm(handlerContext),
    [handlerContext]
  );

  // Wrap cancel handler to also notify completion
  const handleCreditWarningCancel = useCallback(() => {
    const cancelHandler = createCreditWarningCancel(handlerContext);
    cancelHandler();
    onCreditCheckComplete?.(false);
  }, [handlerContext, onCreditCheckComplete]);

  // Handle external trigger - detect edge from false to true
  useEffect(() => {
    if (triggerCreditCheck && !prevTriggerRef.current) {
      // Edge detected: false -> true, trigger the credit check
      handleBatchConfirmWithCreditCheck();
    }
    prevTriggerRef.current = triggerCreditCheck;
  }, [triggerCreditCheck, handleBatchConfirmWithCreditCheck]);

  // Reduce batch handler - rechecks credits after reducing images
  const handleReduceBatch = useCallback(() => {
    if (!creditCheckResult) return;
    const maxProcessable = creditCheckResult.maxProcessable;

    // Notify parent to reduce batch
    onReduceBatch?.(maxProcessable);

    // Close and reopen dialog with new credit check
    setShowCreditWarning(false);
    const newResult = checkCreditSufficiency(creditState.credits, 1, true);
    setCreditCheckResult(newResult);
    setShowCreditWarning(true);
  }, [creditCheckResult, creditState.credits, onReduceBatch]);

  // Context value with stable reference
  const value: CreditFeatureContextValue = useMemo(
    () => ({
      ...creditState,
      showCreditWarning,
      creditCheckResult,
      handleBatchConfirmWithCreditCheck,
      handleCreditWarningConfirm,
      handleCreditWarningCancel,
      handleReduceBatch,
    }),
    [
      creditState,
      showCreditWarning,
      creditCheckResult,
      handleBatchConfirmWithCreditCheck,
      handleCreditWarningConfirm,
      handleCreditWarningCancel,
      handleReduceBatch,
    ]
  );

  return (
    <CreditFeatureContext.Provider value={value}>
      {children}
      {/* CreditWarningDialog - rendered when showCreditWarning is true */}
      {showCreditWarning && creditCheckResult && (
        <CreditWarningDialog
          creditCheck={creditCheckResult}
          receiptCount={batchImageCount}
          theme={theme}
          t={t}
          onConfirm={handleCreditWarningConfirm}
          onCancel={handleCreditWarningCancel}
          onReduceBatch={creditCheckResult.maxProcessable > 0 ? handleReduceBatch : undefined}
        />
      )}
    </CreditFeatureContext.Provider>
  );
}

export default CreditFeature;
