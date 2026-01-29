/**
 * Scan Feature Components
 *
 * Re-exports all scan-related UI components from the feature directory.
 * These components were migrated from src/components/scan/ for FSD compliance.
 *
 * @module @features/scan/components
 */

// Presentational components
export { ScanOverlay } from './ScanOverlay';
export { ScanStatusIndicator } from './ScanStatusIndicator';
export { ScanModeSelector } from './ScanModeSelector';
export { ScanProgress } from './ScanProgress';
export { ScanError } from './ScanError';
export { ScanReady } from './ScanReady';
export { ScanSkeleton } from './ScanSkeleton';
export { ScanCompleteModal } from './ScanCompleteModal';

// State components (Story 14e-9c)
// Phase-gated components for the scan feature orchestrator
export {
  IdleState,
  ProcessingState,
  ReviewingState,
  ErrorState,
} from './states';

export type {
  IdleStateProps,
  ProcessingStateProps,
  ReviewingStateProps,
  ErrorStateProps,
} from './states';

// Story 14e-23: Batch discard dialog (reads from scan store)
export { BatchDiscardDialog } from './BatchDiscardDialog';
