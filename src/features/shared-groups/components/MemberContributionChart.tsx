/**
 *
 * Visualizes spending contribution breakdown by group member.
 * Shows each member's share of total group spending with horizontal bar chart.
 *
 * AC4: Per-Member Contribution Breakdown
 * - Can see each member's contribution to the total
 * - Shown as bar chart or percentage list
 * - Can identify who spent what
 *
 * @example
 * ```tsx
 * <MemberContributionChart
 *   contributions={[
 *     { memberId: 'user-1', memberName: 'Alice', total: 500, percentage: 50, ... },
 *     { memberId: 'user-2', memberName: 'Bob', total: 300, percentage: 30, ... },
 *   ]}
 *   currency="CLP"
 *   theme="light"
 * />
 * ```
 */

import { useMemo } from 'react';
import type { MemberContribution } from '@/hooks/useAnalyticsTransactions';

// =============================================================================
// Types
// =============================================================================

export interface MemberContributionChartProps {
    /** Array of member contributions (pre-calculated) */
    contributions: MemberContribution[];
    /** Currency code for formatting */
    currency?: string;
    /** Theme for styling */
    theme?: 'light' | 'dark';
    /** Title for the chart section */
    title?: string;
    /** Whether to show transaction count */
    showTransactionCount?: boolean;
    /** Maximum number of members to show (0 = all) */
    maxMembers?: number;
    /** Optional click handler for member drill-down */
    onMemberClick?: (memberId: string) => void;
    /** Compact mode - smaller bars, no transaction counts */
    compact?: boolean;
    /** Translation function for i18n */
    t?: (key: string) => string;
}

// =============================================================================
// Constants
// =============================================================================

/** Default member colors for fallback */
const DEFAULT_COLORS = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#6366F1', // indigo
    '#F97316', // orange
];

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
        return `${currency} ${amount.toLocaleString()}`;
    }
}

/**
 * Get initials from a name (first letter of first and last word)
 */
function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// =============================================================================
// Component
// =============================================================================

/**
 * MemberContributionChart - Horizontal bar chart showing member spending breakdown.
 */
export function MemberContributionChart({
    contributions,
    currency = 'CLP',
    theme = 'light',
    title,
    showTransactionCount = true,
    maxMembers = 0,
    onMemberClick,
    compact = false,
    t,
}: MemberContributionChartProps) {
    // Fallback translations (Spanish defaults) for components without t prop
    const getText = (key: string): string => {
        if (t) return t(key);
        const fallbacks: Record<string, string> = {
            noContributionData: 'No hay datos de contribución',
            transaction: 'transacción',
            transactions: 'transacciones',
            groupTotal: 'Total del grupo',
        };
        return fallbacks[key] || key;
    };
    // Sort by total (highest first) and optionally limit
    const sortedContributions = useMemo(() => {
        const sorted = [...contributions].sort((a, b) => b.total - a.total);
        return maxMembers > 0 ? sorted.slice(0, maxMembers) : sorted;
    }, [contributions, maxMembers]);

    // Calculate the maximum for bar scaling
    const maxTotal = useMemo(() => {
        if (sortedContributions.length === 0) return 0;
        return Math.max(...sortedContributions.map(c => c.total));
    }, [sortedContributions]);

    // Grand total for percentage display
    const grandTotal = useMemo(
        () => contributions.reduce((sum, c) => sum + c.total, 0),
        [contributions]
    );

    // Total transaction count across all members
    const totalTransactionCount = useMemo(
        () => contributions.reduce((sum, c) => sum + c.transactionCount, 0),
        [contributions]
    );

    // Empty state
    if (sortedContributions.length === 0) {
        return (
            <div className="p-4 text-center text-[var(--color-text-secondary)]">
                <p className="text-sm">{getText('noContributionData')}</p>
            </div>
        );
    }

    return (
        <div
            className={`rounded-xl p-4 ${
                theme === 'dark'
                    ? 'bg-[var(--color-card)] border border-[var(--color-border)]'
                    : 'bg-white border border-gray-200'
            }`}
        >
            {/* Title */}
            {title && (
                <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">
                    {title}
                </h3>
            )}

            {/* Bar Chart */}
            <div className={`space-y-${compact ? '2' : '3'}`}>
                {sortedContributions.map((contrib, index) => {
                    const barWidth = maxTotal > 0 ? (contrib.total / maxTotal) * 100 : 0;
                    const color = contrib.avatarColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

                    return (
                        <div
                            key={contrib.memberId}
                            className={`${onMemberClick ? 'cursor-pointer hover:opacity-80' : ''}`}
                            onClick={() => onMemberClick?.(contrib.memberId)}
                            role={onMemberClick ? 'button' : undefined}
                            tabIndex={onMemberClick ? 0 : undefined}
                            onKeyDown={
                                onMemberClick
                                    ? (e) => e.key === 'Enter' && onMemberClick(contrib.memberId)
                                    : undefined
                            }
                        >
                            {/* Member Row */}
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div
                                    className={`${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
                                    style={{ backgroundColor: color }}
                                    aria-hidden="true"
                                >
                                    {getInitials(contrib.memberName)}
                                </div>

                                {/* Name and Stats */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-[var(--color-text)] truncate`}>
                                            {contrib.memberName}
                                        </span>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-[var(--color-text)]`}>
                                                {formatAmount(contrib.total, currency)}
                                            </span>
                                            <span className="text-xs text-[var(--color-text-secondary)]">
                                                ({contrib.percentage.toFixed(0)}%)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div
                                        className={`${compact ? 'h-1.5' : 'h-2'} rounded-full overflow-hidden`}
                                        style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                                    >
                                        <div
                                            className="h-full rounded-full transition-all duration-300 ease-out"
                                            style={{
                                                width: `${barWidth}%`,
                                                backgroundColor: color,
                                            }}
                                        />
                                    </div>

                                    {/* Transaction Count (optional) */}
                                    {showTransactionCount && !compact && (
                                        <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                                            {contrib.transactionCount} {contrib.transactionCount === 1 ? getText('transaction') : getText('transactions')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Total Summary */}
            {!compact && grandTotal > 0 && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-[var(--color-text)]">
                                {getText('groupTotal')}
                            </span>
                            <span className="text-xs text-[var(--color-text-secondary)]">
                                {totalTransactionCount} {totalTransactionCount === 1 ? getText('transaction') : getText('transactions')}
                            </span>
                        </div>
                        <span className="text-sm font-bold text-[var(--color-text)]">
                            {formatAmount(grandTotal, currency)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

export interface MemberContributionChartSkeletonProps {
    /** Number of member rows to show */
    count?: number;
    /** Compact mode */
    compact?: boolean;
}

export function MemberContributionChartSkeleton({
    count = 3,
    compact = false,
}: MemberContributionChartSkeletonProps) {
    return (
        <div className="rounded-xl p-4 bg-[var(--color-card)] border border-[var(--color-border)] animate-pulse">
            {/* Title skeleton */}
            <div className="h-4 bg-gray-300 rounded w-32 mb-4" />

            {/* Rows */}
            <div className={`space-y-${compact ? '2' : '3'}`}>
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gray-300`} />

                        {/* Content */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <div className="h-3 bg-gray-300 rounded w-20" />
                                <div className="h-3 bg-gray-300 rounded w-16" />
                            </div>
                            <div className={`${compact ? 'h-1.5' : 'h-2'} bg-gray-200 rounded-full`}>
                                <div
                                    className="h-full bg-gray-300 rounded-full"
                                    style={{ width: `${(3 - i) * 25}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Total skeleton */}
            {!compact && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-300 rounded w-24" />
                        <div className="h-4 bg-gray-300 rounded w-20" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default MemberContributionChart;
