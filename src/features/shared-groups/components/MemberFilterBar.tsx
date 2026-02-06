/**
 *
 * Avatar toggle buttons for filtering transactions by member.
 * Allows multi-select to show transactions from specific members.
 *
 * AC7: Filter by Member
 * - Can filter to show only specific member's transactions
 * - Filter shows member avatars as toggle buttons
 * - Supports multi-select (show multiple members)
 * - "All" option to reset filter
 *
 * @example
 * ```tsx
 * <MemberFilterBar
 *   members={group.members}
 *   memberProfiles={group.memberProfiles}
 *   selectedMembers={selectedMembers}
 *   onToggleMember={toggleMember}
 *   onSelectAll={selectAllMembers}
 *   spendingByMember={spendingByMember}
 * />
 * ```
 */

// React is used for JSX transformation
import { ProfileIndicator } from './ProfileIndicator';
import type { MemberProfile } from '@/types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

export interface MemberFilterBarProps {
    /** Array of member user IDs */
    members: string[];
    /** Map of userId to MemberProfile */
    memberProfiles?: Record<string, MemberProfile>;
    /** Currently selected member IDs (empty = all selected) */
    selectedMembers: string[];
    /** Toggle member selection */
    onToggleMember: (memberId: string) => void;
    /** Select all members (clear filter) */
    onSelectAll: () => void;
    /** Optional spending breakdown by member for display */
    spendingByMember?: Map<string, number>;
    /** Currency code for formatting spending amounts */
    currency?: string;
    /** Label for "All" button (default: "Todos") */
    allLabel?: string;
    /** Label for unknown users (default: "Usuario") */
    userLabel?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format currency amount compactly (e.g., "$1.2k")
 */
function formatCompact(amount: number, _currency: string = 'CLP'): string {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}k`;
    }
    return amount.toLocaleString('es-CL');
}

// =============================================================================
// Component
// =============================================================================

/**
 * MemberFilterBar - Avatar-based member filter for shared group transactions.
 */
export function MemberFilterBar({
    members,
    memberProfiles = {},
    selectedMembers,
    onToggleMember,
    onSelectAll,
    spendingByMember,
    currency = 'CLP',
    allLabel = 'Todos',
    userLabel = 'Usuario',
}: MemberFilterBarProps) {
    // Whether "All" is selected (no specific members selected)
    const allSelected = selectedMembers.length === 0;

    return (
        <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-hide">
            {/* "All" Button */}
            <button
                type="button"
                onClick={onSelectAll}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px] ${
                    allSelected
                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                        : 'bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
                }`}
                aria-pressed={allSelected}
                aria-label={allLabel}
            >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    allSelected ? 'bg-white/20' : 'bg-[var(--color-surface-alt)]'
                }`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                </div>
                <span className="text-[10px] font-medium truncate max-w-[50px]">
                    {allLabel}
                </span>
            </button>

            {/* Member Buttons */}
            {members.map((memberId) => {
                const profile = memberProfiles[memberId];
                const isSelected = selectedMembers.includes(memberId);
                const spending = spendingByMember?.get(memberId);

                return (
                    <button
                        key={memberId}
                        type="button"
                        onClick={() => onToggleMember(memberId)}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px] ${
                            isSelected
                                ? 'bg-[var(--color-primary)] text-white shadow-md'
                                : 'bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
                        }`}
                        aria-pressed={isSelected}
                        aria-label={profile?.displayName || memberId}
                    >
                        <ProfileIndicator
                            userId={memberId}
                            profile={profile}
                            size="small"
                            className={isSelected ? 'ring-2 ring-white ring-offset-1' : ''}
                        />
                        <span className="text-[10px] font-medium truncate max-w-[50px]">
                            {profile?.displayName?.split(' ')[0] || userLabel}
                        </span>
                        {spending !== undefined && (
                            <span className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>
                                {formatCompact(spending, currency)}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

export function MemberFilterBarSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto py-2 px-1">
            {/* All button skeleton */}
            <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-gray-200 animate-pulse min-w-[60px]">
                <div className="w-8 h-8 rounded-full bg-gray-300" />
                <div className="h-2 w-8 bg-gray-300 rounded" />
            </div>
            {/* Member skeletons */}
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-gray-200 animate-pulse min-w-[60px]">
                    <div className="w-6 h-6 rounded-full bg-gray-300" />
                    <div className="h-2 w-8 bg-gray-300 rounded" />
                    <div className="h-1.5 w-6 bg-gray-300 rounded" />
                </div>
            ))}
        </div>
    );
}

export default MemberFilterBar;
