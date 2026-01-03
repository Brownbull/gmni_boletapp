/**
 * Scan Components - Stories 11.1, 11.2, 11.5 & 14.3
 *
 * @see docs/sprint-artifacts/epic11/story-11.1-one-image-one-transaction.md
 * @see docs/sprint-artifacts/epic11/story-11.2-quick-save-card.md
 * @see docs/sprint-artifacts/epic11/story-11.5-scan-status-clarity.md
 * @see docs/sprint-artifacts/epic14/stories/story-14.3-scan-overlay-flow.md
 */

// Story 11.5: Status indicator components
export { ScanStatusIndicator } from './ScanStatusIndicator';
export type { ScanStatusIndicatorProps } from './ScanStatusIndicator';

export { ScanProgress } from './ScanProgress';
export type { ScanProgressProps } from './ScanProgress';

export { ScanSkeleton } from './ScanSkeleton';
export type { ScanSkeletonProps } from './ScanSkeleton';

export { ScanReady } from './ScanReady';
export type { ScanReadyProps } from './ScanReady';

export { ScanError } from './ScanError';
export type { ScanErrorProps } from './ScanError';

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

// Story 14.3: Scan Overlay component
export { ScanOverlay } from './ScanOverlay';
export type { ScanOverlayProps, ScanOverlayState } from './ScanOverlay';

// Default export
export { ScanStatusIndicator as default } from './ScanStatusIndicator';
