/**
 * Story 16-7: Batch Review Event Subscription Hook
 *
 * Subscribes to review:saved events and transitions batch-review state.
 * Replaces direct cross-feature import of batchReviewActions in
 * useTransactionEditorHandlers.
 *
 * The transaction-editor feature emits events; batch-review listens locally.
 */

import { useEffect } from 'react';
import { appEvents } from '@shared/events';
import { batchReviewActions } from '@features/batch-review';

/**
 * Subscribe to review:saved events and transition batch review state.
 *
 * When a transaction is saved from the editor during batch editing,
 * this hook receives the event and calls finishEditing() to transition
 * batch-review from editing → reviewing phase.
 *
 * AC-ARCH-PATTERN-3: Cleanup function returned in useEffect.
 */
export function useBatchReviewEventSubscription(): void {
  useEffect(() => {
    const handleReviewSaved = () => {
      batchReviewActions.finishEditing();
    };

    appEvents.on('review:saved', handleReviewSaved);
    return () => {
      appEvents.off('review:saved', handleReviewSaved);
    };
  }, []);
}
