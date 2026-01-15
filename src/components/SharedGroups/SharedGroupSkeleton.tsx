/**
 * SharedGroupSkeleton Component
 *
 * Story 14c.10: Empty States & Loading
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Full view skeleton showing multiple transaction card skeletons
 * with an optional loading text indicator. Used when loading
 * shared group transactions from IndexedDB or Firestore.
 */

import React from 'react';
import TransactionCardSkeleton from './TransactionCardSkeleton';

export interface SharedGroupSkeletonProps {
    /** Number of skeleton cards to display */
    count?: number;
    /** Optional loading message to display */
    loadingText?: string;
    /** Whether to show the loading text */
    showLoadingText?: boolean;
}

/**
 * Full view skeleton for shared group transaction lists.
 * Shows multiple card skeletons and optional progress text.
 */
export const SharedGroupSkeleton: React.FC<SharedGroupSkeletonProps> = ({
    count = 3,
    loadingText,
    showLoadingText = false,
}) => {
    return (
        <div
            className="space-y-3"
            data-testid="shared-group-skeleton"
            role="status"
            aria-busy="true"
            aria-label="Loading transactions"
        >
            {/* Skeleton cards */}
            {Array.from({ length: count }).map((_, index) => (
                <TransactionCardSkeleton key={index} />
            ))}

            {/* Optional loading text */}
            {showLoadingText && loadingText && (
                <p
                    className="text-center text-sm mt-2"
                    style={{ color: 'var(--text-tertiary)' }}
                >
                    {loadingText}
                </p>
            )}
        </div>
    );
};

export default SharedGroupSkeleton;
