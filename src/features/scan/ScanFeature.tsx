/**
 * Story 14e-10: ScanFeature Orchestrator Component
 *
 * Orchestrates all scan-related rendering based on Zustand store phase.
 * This is the single entry point for scan functionality in App.tsx.
 *
 * Phase → Component Mapping:
 * - idle: IdleState (optional - often handled by FAB)
 * - capturing: BatchCaptureView (batch) / CameraView (single) / StatementPlaceholder
 * - scanning: ProcessingState (shows progress)
 * - reviewing: ReviewingState (wrapper for TransactionEditorView/BatchReviewView)
 * - saving: SavingState (saving indicator)
 * - error: ErrorState (error display with retry)
 *
 * @see docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-10-scan-feature-orchestrator.md
 */
import React from 'react';
import {
  useScanPhase,
  useScanMode,
  useScanActions,
} from './store';
import {
  IdleState,
  // Story 14e-11: ProcessingState, ErrorState, SavingState not used during partial integration
  // These phases are handled by existing ScanOverlay in AppOverlays.tsx
  // ProcessingState,
  ReviewingState,
  // ErrorState,
  // SavingState,
  // StatementPlaceholder,
} from './components/states';

// =============================================================================
// Types
// =============================================================================

/**
 * Props for single mode capturing state
 * Used when user is taking a photo in single scan mode
 */
export interface SingleCaptureProps {
  /** Callback when capture is initiated */
  onCapture?: () => void;
  /** Callback to cancel and return */
  onCancel: () => void;
}

/**
 * Props for batch capture view
 * Minimal set needed by ScanFeature - full props passed through
 */
export interface BatchCaptureProps {
  /** Whether batch mode is active */
  isBatchMode: boolean;
  /** Toggle between modes */
  onToggleMode: (isBatch: boolean) => void;
  /** Process batch images */
  onProcessBatch: (images: string[]) => void;
  /** Switch to individual scan */
  onSwitchToIndividual: () => void;
  /** Go back */
  onBack: () => void;
  /** Processing state */
  isProcessing?: boolean;
  /** Theme */
  theme: 'light' | 'dark';
  /** Translation function */
  t: (key: string) => string;
  /** Super credits available */
  superCreditsAvailable?: number;
  /** Normal credits available */
  normalCreditsAvailable?: number;
  /** Credit info click handler */
  onCreditInfoClick?: () => void;
}

// StatementPlaceholderProps - now exported from ./components/states/StatementPlaceholder

/**
 * Props for the review state wrapper
 * Can wrap existing TransactionEditorView or BatchReviewView
 */
export interface ReviewProps {
  /** Children to render (TransactionEditorView or BatchReviewView) */
  children?: React.ReactNode;
  /** Called when user wants to review/edit */
  onReview?: () => void;
  /** Called when user wants to save */
  onSave?: () => void;
}

// SavingStateProps - now exported from ./components/states/SavingState

/**
 * Main props for ScanFeature orchestrator
 */
export interface ScanFeatureProps {
  /** Translation function */
  t: (key: string) => string;

  /** Theme */
  theme: 'light' | 'dark';

  /**
   * Whether to render idle state
   * Set to false if idle is handled elsewhere (e.g., FAB)
   * @default false
   */
  showIdleState?: boolean;

  /**
   * Callback when user taps to start scanning (from IdleState)
   */
  onStartScan?: () => void;

  /**
   * Callback to cancel processing
   */
  onCancelProcessing?: () => void;

  /**
   * Callback when error is dismissed
   */
  onErrorDismiss?: () => void;

  /**
   * Custom retry handler for errors
   */
  onRetry?: () => void;

  // =========================================================================
  // Capture Phase Props
  // =========================================================================

  /**
   * Component to render for batch capture
   * If provided, rendered when phase='capturing' and mode='batch'
   */
  batchCaptureView?: React.ReactNode;

  /**
   * Component to render for single capture (camera UI)
   * If provided, rendered when phase='capturing' and mode='single'
   */
  singleCaptureView?: React.ReactNode;

  /**
   * Component to render for statement capture placeholder
   * If provided, rendered when phase='capturing' and mode='statement'
   */
  statementView?: React.ReactNode;

  // =========================================================================
  // Review Phase Props
  // =========================================================================

  /**
   * Component to render for reviewing results
   * If provided, wrapped by ReviewingState when phase='reviewing'
   */
  reviewView?: React.ReactNode;

  // =========================================================================
  // Saving Phase Props
  // =========================================================================

  /**
   * Custom saving message
   */
  savingMessage?: string;
}

// =============================================================================
// Inline components extracted to ./components/states/ per 14e-10 Archie review
// SavingState and StatementPlaceholder now imported from states barrel
// =============================================================================

// =============================================================================
// Main ScanFeature Component
// =============================================================================

/**
 * ScanFeature Orchestrator Component
 *
 * Reads phase/mode from Zustand store and renders appropriate UI.
 * This is the single entry point for all scan-related rendering.
 *
 * Architecture:
 * - Phase-driven rendering (not view-based)
 * - Can wrap existing views (BatchCaptureView, TransactionEditorView)
 * - Or render internal state components for simpler phases
 *
 * @example
 * ```tsx
 * <ScanFeature
 *   t={t}
 *   theme={theme}
 *   onCancelProcessing={handleCancel}
 *   batchCaptureView={<BatchCaptureView {...batchProps} />}
 *   reviewView={<TransactionEditorView {...editorProps} />}
 * />
 * ```
 */
export function ScanFeature({
  t,
  theme,
  showIdleState = false,
  onStartScan,
  // Story 14e-11: Unused during partial integration (handled by ScanOverlay)
  onCancelProcessing: _onCancelProcessing,
  onErrorDismiss: _onErrorDismiss,
  onRetry: _onRetry,
  batchCaptureView,
  singleCaptureView,
  statementView,
  reviewView,
  savingMessage: _savingMessage,
}: ScanFeatureProps): React.ReactElement | null {
  const phase = useScanPhase();
  const mode = useScanMode();
  // Story 14e-11: reset not needed during partial integration
  useScanActions(); // Keep hook call to maintain hook order

  // =========================================================================
  // Phase-based rendering
  // =========================================================================

  switch (phase) {
    // -----------------------------------------------------------------------
    // IDLE: No active scan
    // -----------------------------------------------------------------------
    case 'idle':
      // Only render if showIdleState is true
      // Usually idle is handled by FAB, not ScanFeature
      if (!showIdleState) {
        return null;
      }
      return (
        <IdleState
          t={t}
          theme={theme}
          onStartScan={onStartScan}
        />
      );

    // -----------------------------------------------------------------------
    // CAPTURING: Camera/file selection active
    // -----------------------------------------------------------------------
    case 'capturing':
      // Story 14e-11: Only render if capture views are provided
      // Otherwise, return null to let existing view-based rendering handle it
      // (BatchCaptureView, StatementScanView are already rendered by App.tsx)

      // Mode determines which capture UI to show
      if (mode === 'batch') {
        // Batch mode: render BatchCaptureView if provided
        if (batchCaptureView) {
          return <>{batchCaptureView}</>;
        }
        // No batchCaptureView provided - let existing views handle it
        return null;
      }

      if (mode === 'statement') {
        // Statement mode: render if statementView provided
        if (statementView) {
          return <>{statementView}</>;
        }
        // StatementPlaceholder only if explicitly using ScanFeature for statement mode
        // Currently App.tsx uses StatementScanView directly, so return null
        return null;
      }

      // Single mode: render camera UI if provided
      if (singleCaptureView) {
        return <>{singleCaptureView}</>;
      }
      // Fallback for single mode (usually camera is triggered externally)
      return null;

    // -----------------------------------------------------------------------
    // SCANNING: Processing receipt image
    // -----------------------------------------------------------------------
    case 'scanning':
      // Story 14e-11: ScanOverlay in AppOverlays already handles processing state
      // as a fixed overlay. Return null to avoid duplicate UI and layout issues.
      // ScanFeature is rendered outside AppLayout, so any content here would
      // push the actual views down (causing the header-in-middle issue).
      return null;

    // -----------------------------------------------------------------------
    // REVIEWING: Showing scan results for review
    // -----------------------------------------------------------------------
    case 'reviewing':
      // Story 14e-11: Only render if reviewView is provided
      // Otherwise, return null to let existing view-based rendering handle it
      // (TransactionEditorView, BatchReviewView are already rendered by App.tsx)
      if (!reviewView) {
        return null;
      }
      return (
        <ReviewingState
          t={t}
          theme={theme}
        >
          {reviewView}
        </ReviewingState>
      );

    // -----------------------------------------------------------------------
    // SAVING: Transaction is being saved
    // -----------------------------------------------------------------------
    case 'saving':
      // Story 14e-11: Return null during partial integration
      // The save operation shows QuickSaveCard's "Guardando..." state
      // or navigates away. Rendering SavingState here would cause layout issues.
      return null;

    // -----------------------------------------------------------------------
    // ERROR: Something went wrong
    // -----------------------------------------------------------------------
    case 'error':
      // Story 14e-11: ScanOverlay in AppOverlays already handles error state
      // as a fixed overlay. Return null to avoid duplicate UI.
      return null;

    // -----------------------------------------------------------------------
    // Default: Unknown phase - render nothing
    // -----------------------------------------------------------------------
    default:
      return null;
  }
}

export default ScanFeature;
