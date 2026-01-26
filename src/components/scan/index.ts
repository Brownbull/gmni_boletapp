/**
 * Scan Components - Stories 11.1, 11.2, 11.5 & 14.3
 *
 * NOTE: Core scan components were migrated to @features/scan/components in Story 14e-9a.
 * This barrel re-exports them for backward compatibility.
 *
 * Migrated components (now in src/features/scan/components/):
 * - ScanStatusIndicator, ScanProgress, ScanSkeleton, ScanReady, ScanError
 * - ScanOverlay, ScanModeSelector, ScanCompleteModal
 *
 * Remaining components (still in this directory):
 * - BatchUploadPreview, BatchProcessingProgress, BatchProcessingOverlay
 * - BatchCompleteModal, QuickSaveCard
 * - CurrencyMismatchDialog, TotalMismatchDialog, ProcessingOverlay
 *
 * @see docs/sprint-artifacts/epic11/story-11.1-one-image-one-transaction.md
 * @see docs/sprint-artifacts/epic11/story-11.2-quick-save-card.md
 * @see docs/sprint-artifacts/epic11/story-11.5-scan-status-clarity.md
 * @see docs/sprint-artifacts/epic14/stories/story-14.3-scan-overlay-flow.md
 * @see docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-9a-move-scan-components.md
 */

// =============================================================================
// Re-exports from @features/scan/components (Story 14e-9a migration)
// =============================================================================
export {
  ScanStatusIndicator,
  ScanProgress,
  ScanSkeleton,
  ScanReady,
  ScanError,
  ScanOverlay,
  ScanModeSelector,
  ScanCompleteModal,
} from '@features/scan/components';

// Type re-exports (maintain type exports for consumers)
export type { ScanStatusIndicatorProps } from '@features/scan/components/ScanStatusIndicator';
export type { ScanProgressProps } from '@features/scan/components/ScanProgress';
export type { ScanSkeletonProps } from '@features/scan/components/ScanSkeleton';
export type { ScanReadyProps } from '@features/scan/components/ScanReady';
export type { ScanErrorProps } from '@features/scan/components/ScanError';
export type { ScanOverlayProps, ScanOverlayState } from '@features/scan/components/ScanOverlay';
export type { ScanModeSelectorProps, ScanModeId } from '@features/scan/components/ScanModeSelector';
export type { ScanCompleteModalProps } from '@features/scan/components/ScanCompleteModal';

// =============================================================================
// Local components (not yet migrated)
// =============================================================================

// Story 11.1: Batch processing components
export { BatchUploadPreview, MAX_BATCH_IMAGES } from './BatchUploadPreview';
export type { BatchUploadPreviewProps } from './BatchUploadPreview';

export { BatchProcessingProgress } from './BatchProcessingProgress';
export type {
  BatchProcessingProgressProps,
  BatchItemResult,
  BatchItemStatus,
} from './BatchProcessingProgress';

// Story 11.2: Quick Save Card component
export { QuickSaveCard } from './QuickSaveCard';
export type { QuickSaveCardProps } from './QuickSaveCard';

// Story 14.15: Batch Complete Modal
export { BatchCompleteModal } from './BatchCompleteModal';
export type { BatchCompleteModalProps } from './BatchCompleteModal';

// Story 14.15b: Currency Mismatch Dialog
export { CurrencyMismatchDialog } from './CurrencyMismatchDialog';
export type { CurrencyMismatchDialogProps } from './CurrencyMismatchDialog';

// Total Mismatch Dialog (OCR error detection)
export { TotalMismatchDialog } from './TotalMismatchDialog';
export type { TotalMismatchDialogProps } from './TotalMismatchDialog';

// Story 14.23: Unified Transaction Editor components
export { ProcessingOverlay } from './ProcessingOverlay';
export type { ProcessingOverlayProps } from './ProcessingOverlay';

// Story 12.1 v9.7.0: Batch Processing Overlay
export { BatchProcessingOverlay } from './BatchProcessingOverlay';
export type { BatchProcessingOverlayProps } from './BatchProcessingOverlay';

// Default export
export { ScanStatusIndicator as default } from '@features/scan/components';
