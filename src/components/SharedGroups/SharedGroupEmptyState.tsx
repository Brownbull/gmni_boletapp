/**
 * SharedGroupEmptyState Component
 *
 * Story 14c.10: Empty States & Loading
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Displays friendly empty state when a shared group has no transactions.
 * Shows different messaging based on whether the user is the only member
 * (encourages inviting others) or if the group has members but no data
 * (encourages scanning receipts).
 *
 * Features:
 * - Friendly illustration icon
 * - Context-aware messaging
 * - Primary CTA: Scan receipt OR Invite members (based on context)
 * - Secondary CTA: Alternative action
 */

import React from 'react';
import { Camera, Users, ClipboardList } from 'lucide-react';

export interface SharedGroupEmptyStateProps {
    /** Name of the shared group */
    groupName: string;
    /** Number of members in the group */
    memberCount: number;
    /** Callback when "Scan Receipt" button is clicked */
    onScanReceipt: () => void;
    /** Callback when "Invite Members" button is clicked */
    onInviteMembers: () => void;
    /** Translation function */
    t: (key: string) => string;
}

/**
 * Empty state component for shared groups without transactions.
 * Adapts messaging based on member count to guide user actions.
 */
export const SharedGroupEmptyState: React.FC<SharedGroupEmptyStateProps> = ({
    groupName,
    memberCount,
    onScanReceipt,
    onInviteMembers,
    t,
}) => {
    const isSoloMember = memberCount <= 1;

    return (
        <div
            className="flex flex-col items-center justify-center py-12 px-6 text-center"
            data-testid="shared-group-empty-state"
            role="region"
            aria-label={t('sharedGroupNoTransactions')}
        >
            {/* Illustration */}
            <div
                className="w-20 h-20 mb-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                aria-hidden="true"
            >
                <ClipboardList
                    size={36}
                    strokeWidth={1.5}
                    style={{ color: 'var(--text-tertiary)' }}
                />
            </div>

            {/* Title */}
            <h2
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
            >
                {t('sharedGroupNoTransactionsTitle')}
            </h2>

            {/* Description */}
            <p
                className="text-sm mb-6 max-w-xs"
                style={{ color: 'var(--text-secondary)' }}
            >
                {isSoloMember
                    ? t('sharedGroupInviteMembersToStart')
                    : t('sharedGroupScanToAddFirst')
                }
            </p>

            {/* Primary CTA */}
            {isSoloMember ? (
                <button
                    onClick={onInviteMembers}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors mb-3"
                    style={{
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                    }}
                    data-testid="empty-state-invite-btn"
                >
                    <Users size={18} strokeWidth={2} />
                    {t('sharedGroupInviteMembers')}
                </button>
            ) : (
                <button
                    onClick={onScanReceipt}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors mb-3"
                    style={{
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                    }}
                    data-testid="empty-state-scan-btn"
                >
                    <Camera size={18} strokeWidth={2} />
                    {t('sharedGroupScanFirstReceipt')}
                </button>
            )}

            {/* Secondary CTA */}
            {!isSoloMember && (
                <button
                    onClick={onInviteMembers}
                    className="text-sm transition-colors hover:opacity-80 focus:outline-none focus:underline"
                    style={{ color: 'var(--text-secondary)' }}
                    data-testid="empty-state-invite-secondary-btn"
                >
                    {t('sharedGroupOrInviteMore')}
                </button>
            )}

            {/* Group name context */}
            <p
                className="text-xs mt-6"
                style={{ color: 'var(--text-tertiary)' }}
            >
                {groupName}
            </p>
        </div>
    );
};

export default SharedGroupEmptyState;
