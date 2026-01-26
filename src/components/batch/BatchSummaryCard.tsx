/**
 * BatchSummaryCard Component - DEPRECATED
 *
 * Story 14e-15: Re-exports BatchReviewCard from @features/batch-review/components
 * for backwards compatibility during migration.
 *
 * @deprecated Use `BatchReviewCard` from `@features/batch-review/components` instead.
 * This re-export will be removed in Story 14e-16.
 */

export {
  BatchReviewCard as BatchSummaryCard,
  BatchReviewCard as default,
} from '@features/batch-review/components/BatchReviewCard';

export type { BatchReviewCardProps as BatchSummaryCardProps } from '@features/batch-review/components/BatchReviewCard';
