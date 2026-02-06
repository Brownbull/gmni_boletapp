/**
 * InviteMembersPrompt Component
 *
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * A prominent banner shown at the top of shared group views when
 * the user is the only member. Encourages inviting family or friends
 * to share expenses together.
 *
 * Features:
 * - Subtle but visible styling
 * - Clear CTA to share invite link
 * - Accessible with proper roles
 */

import React from 'react';
import { Users, Share2 } from 'lucide-react';

export interface InviteMembersPromptProps {
    /** The group ID (for tracking purposes) */
    groupId: string;
    /** Name of the group to display */
    groupName?: string;
    /** Callback when "Share Invite Link" is clicked */
    onOpenShare: () => void;
    /** Translation function */
    t: (key: string) => string;
}

/**
 * Inline prompt encouraging users to invite others to their shared group.
 * Shows when user is the only member of a shared group.
 */
export const InviteMembersPrompt: React.FC<InviteMembersPromptProps> = ({
    groupId,
    groupName,
    onOpenShare,
    t,
}) => {
    return (
        <div
            className="rounded-lg p-4 mb-4"
            style={{
                backgroundColor: 'var(--primary-light, #dbeafe)',
                border: '1px solid var(--primary)',
            }}
            data-testid="invite-members-prompt"
            data-group-id={groupId}
            role="region"
            aria-label={t('sharedGroupInvitePromptLabel')}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                        backgroundColor: 'var(--primary)',
                    }}
                    aria-hidden="true"
                >
                    <Users
                        size={20}
                        strokeWidth={2}
                        style={{ color: 'white' }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3
                        className="font-semibold text-sm mb-1"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {t('sharedGroupInviteFamilyOrFriends')}
                    </h3>
                    <p
                        className="text-xs mb-3"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {t('sharedGroupShareExpensesTogether')}
                        {groupName && (
                            <span
                                className="block mt-1 font-medium"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {groupName}
                            </span>
                        )}
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={onOpenShare}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-primary)',
                        }}
                        data-testid="invite-prompt-share-btn"
                    >
                        <Share2 size={14} strokeWidth={2} />
                        {t('sharedGroupShareInviteLink')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InviteMembersPrompt;
