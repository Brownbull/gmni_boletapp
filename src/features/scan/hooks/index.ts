/**
 * Scan Feature Hooks
 *
 * Story 14e-30: Scan initiation handlers hook
 * Story 15b-1i: Consolidated scan hooks from src/hooks/
 *
 * Exports:
 * - useScanInitiation: Handlers for starting scans (handleNewTransaction, handleFileSelect, handleRescan)
 * - useScanState: Scan state machine with progress tracking
 * - useScanOverlayState: Overlay-specific state with ETA calculation
 * - useScanHandlers: Scan dialog and flow handlers
 */

// Story 14e-30: Scan initiation handlers
export { useScanInitiation } from './useScanInitiation';
export type {
  ScanInitiationProps,
  ScanInitiationHandlers,
  ToastMessage,
  UserCredits as ScanUserCredits,
} from './useScanInitiation';

// Story 15b-1i: Scan state machine
// Note: ScanState type not re-exported here — conflicts with store ScanState type.
// Import ScanState directly from '@features/scan/hooks/useScanState' if needed.
export { useScanState, PROCESSING_TIMEOUT_MS, READY_DISPLAY_MS } from './useScanState';
export type { ScanErrorType, ScanStateHook } from './useScanState';

// Story 15b-1i: Scan overlay state
export { useScanOverlayState } from './useScanOverlayState';
export type { ScanOverlayState, ScanOverlayStateHook } from './useScanOverlayState';

// Story 15b-1i: Scan handlers
export { useScanHandlers } from './useScanHandlers';
export type { UseScanHandlersProps, UseScanHandlersResult } from './useScanHandlers';