/**
 * Feature: Batch Review
 *
 * Batch review Zustand store, handlers, hooks, and components.
 * Implemented in Stories 14e-12 through 14e-16, 14e-29a.
 *
 * Story 14e-12a: Store foundation + lifecycle/item actions (COMPLETE)
 * Story 14e-12b: Save/edit actions (COMPLETE)
 * Story 14e-13: Selectors (COMPLETE)
 * Story 14e-14a: Handler types + navigation handlers (COMPLETE)
 * Story 14e-14b: Edit and save handlers (COMPLETE)
 * Story 14e-14c: Discard and credit check handlers (COMPLETE)
 * Story 14e-14d: App.tsx integration (COMPLETE)
 * Story 14e-15: Feature components (COMPLETE)
 * Story 14e-16: BatchReviewFeature orchestrator (COMPLETE)
 * Story 14e-29a: Consolidated useBatchReviewHandlers hook (COMPLETE)
 */

// =============================================================================
// Feature Orchestrator (Story 14e-16)
// =============================================================================

export { BatchReviewFeature } from './BatchReviewFeature';
export type { BatchReviewFeatureProps } from './BatchReviewFeature';

// =============================================================================
// Store (Story 14e-12a)
// =============================================================================

export {
  useBatchReviewStore,
  initialBatchReviewState,
} from './store';

export type {
  BatchReviewPhase,
  BatchReviewState,
  BatchReviewActions,
} from './store';

// =============================================================================
// Selectors (Story 14e-13)
// =============================================================================

export {
  // Phase selectors
  useBatchReviewPhase,
  useIsBatchReviewing,
  useIsEditing,
  useIsSaving,
  useIsComplete,
  useHasBatchError,
  // Data selectors
  useBatchItems,
  useCurrentBatchItem,
  useCurrentBatchIndex,
  useEditingReceiptId,
  // Computed selectors
  useBatchProgress,
  useBatchTotalAmount,
  useValidBatchCount,
  useIsBatchEmpty,
  // Actions hook
  useBatchReviewActions,
  // Direct access
  getBatchReviewState,
  batchReviewActions,
} from './store';

export type { BatchReviewActionsType } from './store';

// =============================================================================
// Handlers (Story 14e-14a, 14e-14b, 14e-14c, 14e-14d)
// =============================================================================

export {
  // Navigation handlers (Story 14e-14a)
  navigateToPreviousReceipt,
  navigateToNextReceipt,
  // Edit handler (Story 14e-14b)
  editBatchReceipt,
  // Save handlers (Story 14e-14b)
  saveBatchTransaction,
  handleSaveComplete,
  // Discard handlers (Story 14e-14c)
  handleReviewBack,
  confirmDiscard,
  cancelDiscard,
  // Credit check handler (Story 14e-14c)
  confirmWithCreditCheck,
  // Utilities (Story 14e-14d)
  buildTransactionWithThumbnail,
} from './handlers';

export type {
  // Navigation types (Story 14e-14a)
  BatchNavigationContext,
  // Edit/Save types (Story 14e-14b)
  BatchEditContext,
  SaveContext,
  SaveCompleteContext,
  CategoryMappingResult,
  MerchantMatchResult,
  ItemNameMappingResult,
  BatchProcessingController,
  // Discard/Credit types (Story 14e-14c)
  DiscardContext,
  CreditCheckContext,
} from './handlers';

// =============================================================================
// Hooks (Story 14e-29a, 14e-34b) - Consolidated handler hook and atomic actions
// =============================================================================

export { useBatchReviewHandlers, useAtomicBatchActions, atomicBatchActions } from './hooks';
export type { BatchReviewHandlersProps, BatchReviewHandlers, AtomicBatchActions, AtomicBatchActionsType } from './hooks';

// =============================================================================
// Components (Story 14e-15)
// =============================================================================

export {
  // Main components
  BatchReviewCard,
  BatchProgressIndicator,
  // State components
  ProcessingState,
  ReviewingState,
  EmptyState,
} from './components';

export type {
  // Component props
  BatchReviewCardProps,
  BatchProgressIndicatorProps,
  ImageProcessingState,
  // State component props
  ProcessingStateProps,
  ReviewingStateProps,
  EmptyStateProps,
} from './components';
