/**
 *
 * Displays the combined total spending for a shared group.
 * Shows the sum of all members' tagged transactions for the selected period.
 *
 * AC6: Combined Total Spending
 * - Shows total combined spending at the top
 * - Total is for the current month by default
 * - Aggregates all members' tagged transactions
 *
 * @example
 * ```tsx
 * <SharedGroupTotalCard
 *   total={12450.50}
 *   currency="CLP"
 *   groupName="Gastos del Hogar"
 *   groupColor="#10b981"
 *   memberCount={3}
 *   isLoading={false}
 * />
 * ```
 */

// React is used for JSX transformation
import { safeCSSColor } from '@/utils/validationUtils';

// =============================================================================
// Types
// =============================================================================

export interface SharedGroupTotalCardProps {
    /** Total spending amount */
    total: number;
    /** Currency code (e.g., "CLP", "USD") */
    currency?: string;
    /** Group name for display */
    groupName: string;
    /** Group color (hex code) */
    groupColor: string;
    /** Number of active members */
    memberCount: number;
    /** Whether data is loading */
    isLoading?: boolean;
    /** Date range label (e.g., "Enero 2026") */
    dateRangeLabel?: string;
    /** Optional click handler for drill-down */
    onClick?: () => void;
    /** Label for "members" text (default: "miembros") */
    membersLabel?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format currency amount with proper locale formatting
 */
function formatAmount(amount: number, currency: string = 'CLP'): string {
    try {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency,
            minimumFractionDigits: currency === 'CLP' ? 0 : 2,
            maximumFractionDigits: currency === 'CLP' ? 0 : 2,
        }).format(amount);
    } catch {
        // Fallback for unsupported currencies
        return `${currency} ${amount.toLocaleString()}`;
    }
}

// =============================================================================
// Component
// =============================================================================

/**
 * SharedGroupTotalCard - Combined spending display for shared groups.
 */
export function SharedGroupTotalCard({
    total,
    currency = 'CLP',
    groupName,
    groupColor,
    memberCount,
    isLoading = false,
    dateRangeLabel,
    onClick,
    membersLabel = 'miembros',
}: SharedGroupTotalCardProps) {
    return (
        <div
            className={`rounded-xl p-4 text-white shadow-md ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
            style={{ backgroundColor: safeCSSColor(groupColor) }}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl opacity-90" role="img" aria-hidden="true">
                        {/* Extract emoji from group name if present */}
                        {groupName.match(/^\p{Emoji}/u)?.[0] || '\ud83d\udc65'}
                    </span>
                    <h3 className="font-semibold text-sm truncate max-w-[200px]">
                        {groupName.replace(/^\p{Emoji}\s*/u, '')}
                    </h3>
                </div>
                <div className="text-xs opacity-80 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    {memberCount} {membersLabel}
                </div>
            </div>

            {/* Total Amount */}
            <div className="text-center py-2">
                {isLoading ? (
                    <div className="animate-pulse">
                        <div className="h-10 bg-white/20 rounded w-48 mx-auto" />
                    </div>
                ) : (
                    <span className="text-3xl font-bold tracking-tight">
                        {formatAmount(total, currency)}
                    </span>
                )}
            </div>

            {/* Footer - Date Range */}
            {dateRangeLabel && (
                <div className="text-center mt-2">
                    <span className="text-xs opacity-75">
                        {dateRangeLabel}
                    </span>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

export function SharedGroupTotalCardSkeleton() {
    return (
        <div className="rounded-xl p-4 bg-gray-200 animate-pulse">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full" />
                    <div className="h-4 bg-gray-300 rounded w-24" />
                </div>
                <div className="h-3 bg-gray-300 rounded w-16" />
            </div>
            <div className="flex justify-center py-2">
                <div className="h-10 bg-gray-300 rounded w-48" />
            </div>
            <div className="flex justify-center mt-2">
                <div className="h-3 bg-gray-300 rounded w-20" />
            </div>
        </div>
    );
}

export default SharedGroupTotalCard;
