/**
 * Story 14e-29a: Batch Review Hooks Module
 *
 * Barrel export for batch review hooks.
 * Contains useBatchReviewHandlers hook that consolidates
 * all batch review handler logic.
 *
 * This hook replaces the dependency injection pattern used
 * in handlers/ with direct store access.
 */

export { useBatchReviewHandlers } from './useBatchReviewHandlers';
export type {
  BatchReviewHandlersProps,
  BatchReviewHandlers,
} from './useBatchReviewHandlers';
