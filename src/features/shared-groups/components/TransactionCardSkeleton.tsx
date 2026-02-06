/**
 * TransactionCardSkeleton Component
 *
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Animated skeleton placeholder for transaction cards during loading state.
 * Uses Tailwind's animate-pulse for the shimmer effect.
 * Matches the dimensions and layout of TransactionCard component.
 *
 * @see src/components/history/TransactionCard.tsx
 */

import React from 'react';

export interface TransactionCardSkeletonProps {
    /** Optional className for custom styling */
    className?: string;
}

/**
 * Skeleton placeholder that matches TransactionCard layout.
 * Shows animated pulse effect while data is loading.
 */
export const TransactionCardSkeleton: React.FC<TransactionCardSkeletonProps> = ({
    className = '',
}) => {
    return (
        <div
            className={`rounded-lg border animate-pulse ${className}`}
            style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-light)',
            }}
            data-testid="transaction-card-skeleton"
            role="status"
            aria-label="Loading transaction"
        >
            <div className="p-3">
                <div className="flex gap-[10px] items-start">
                    {/* Thumbnail placeholder */}
                    <div
                        className="flex-shrink-0 w-10 h-[46px] rounded-md"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    />

                    {/* Content section */}
                    <div className="flex-1 min-w-0">
                        {/* Row 1: Merchant + Amount placeholders */}
                        <div className="flex justify-between items-start mb-2">
                            {/* Merchant name placeholder */}
                            <div
                                className="h-4 rounded w-2/3"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            />
                            {/* Amount placeholder */}
                            <div
                                className="h-4 rounded w-16 flex-shrink-0 ml-2"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            />
                        </div>

                        {/* Row 2: Meta pills placeholders */}
                        <div className="flex gap-1.5 items-center">
                            {/* Time pill placeholder */}
                            <div
                                className="h-5 rounded-full w-16"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            />
                            {/* Location pill placeholder */}
                            <div
                                className="h-5 rounded-full w-20"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            />
                            {/* Items count pill placeholder */}
                            <div
                                className="h-5 rounded-full w-10"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionCardSkeleton;
