/**
 * MemberSelectorDialog Component
 *
 * Story 14d-v2-1-7d: Leave/Transfer UI + View Mode Auto-Switch
 * Epic 14d-v2: Shared Groups v2
 *
 * Modal dialog for selecting a group member (e.g., for ownership transfer).
 * Displays list of group members with their profile info, excluding the current user.
 *
 * Features:
 * - Shows member list with display name, email, and photo
 * - Excludes current user from selection
 * - Keyboard accessible (Escape to close)
 * - Accessible (ARIA attributes)
 * - Empty state when no other members
 * - Translation support (Spanish/English)
 *
 * @example
 * ```tsx
 * <MemberSelectorDialog
 *   isOpen={showSelector}
 *   group={selectedGroup}
 *   currentUserId={user.uid}
 *   onSelectMember={(memberId, memberName) => handleTransfer(memberId, memberName)}
 *   onClose={() => setShowSelector(false)}
 *   t={t}
 * />
 * ```
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { X, Crown, Users } from 'lucide-react';
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from '@/shared/hooks';
import { Z_INDEX } from '@/constants';
import type { SharedGroup } from '@/types/sharedGroup';

// =============================================================================
// Constants
// =============================================================================

/**
 * ECC Review Session 3: Defense-in-depth photoURL domain validation
 * Only allow images from trusted domains to prevent XSS/phishing
 */
const ALLOWED_PHOTO_DOMAINS = [
    'lh3.googleusercontent.com', // Google profile photos
    'firebasestorage.googleapis.com', // Firebase Storage
    'storage.googleapis.com', // Google Cloud Storage
    'gravatar.com', // Gravatar
    'www.gravatar.com',
    'secure.gravatar.com',
];

/**
 * Validates that a photoURL comes from a trusted domain
 */
const isValidPhotoUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return ALLOWED_PHOTO_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
    } catch {
        return false;
    }
};

// =============================================================================
// Types
// =============================================================================

export interface MemberSelectorDialogProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** The group to select members from */
    group: SharedGroup;
    /** Current user ID (to exclude from list) */
    currentUserId: string;
    /** Callback when a member is selected */
    onSelectMember: (memberId: string, memberName: string) => void;
    /** Callback when dialog is closed */
    onClose: () => void;
    /** Translation function */
    t: (key: string) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

// =============================================================================
// Component
// =============================================================================

export const MemberSelectorDialog: React.FC<MemberSelectorDialogProps> = ({
    isOpen,
    group,
    currentUserId,
    onSelectMember,
    onClose,
    t,
    lang = 'es',
}) => {
    // Refs
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Get selectable members (exclude current user)
    const selectableMembers = useMemo(() => {
        return group.members.filter((memberId) => memberId !== currentUserId);
    }, [group.members, currentUserId]);

    // Get member info helper
    const getMemberInfo = (memberId: string) => {
        const profile = group.memberProfiles?.[memberId];
        const displayName = profile?.displayName || profile?.email || memberId;
        const email = profile?.email || '';
        const photoURL = profile?.photoURL;

        return { displayName, email, photoURL };
    };

    // TD-7d-2: Shared dialog hooks for accessibility
    useEscapeKey(onClose, isOpen);
    useFocusTrap(modalRef, isOpen);
    useBodyScrollLock(isOpen);

    // Focus close button on open
    useEffect(() => {
        if (isOpen) {
            focusTimeoutRef.current = setTimeout(() => closeButtonRef.current?.focus(), 0);
        }
        return () => {
            if (focusTimeoutRef.current) {
                clearTimeout(focusTimeoutRef.current);
                focusTimeoutRef.current = null;
            }
        };
    }, [isOpen]);

    // Don't render if closed
    if (!isOpen) return null;

    // Translations with fallbacks
    const texts = {
        title: t('selectMember') || (lang === 'es' ? 'Seleccionar Miembro' : 'Select Member'),
        description: t('selectMemberDescription') || (lang === 'es'
            ? 'Elige un miembro para transferir la propiedad'
            : 'Choose a member to transfer ownership to'),
        noOtherMembers: t('noOtherMembers') || (lang === 'es'
            ? 'No hay otros miembros en este grupo'
            : 'No other members in this group'),
        close: t('close') || (lang === 'es' ? 'Cerrar' : 'Close'),
    };

    // Handle member click
    const handleMemberClick = (memberId: string) => {
        const { displayName } = getMemberInfo(memberId);
        onSelectMember(memberId, displayName);
    };

    // Get initials for avatar placeholder
    // Story 14d-v2-1-7d ECC Review: Added fallback for empty names
    const getInitials = (name: string): string => {
        if (!name || name.trim() === '') return '?';
        const initials = name
            .split(' ')
            .filter((part) => part.length > 0)
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        return initials || '?';
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: Z_INDEX.MODAL }}
            role="presentation"
            data-testid="member-selector-dialog-backdrop"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50"
                aria-hidden="true"
                onClick={onClose}
                data-testid="backdrop-overlay"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="member-selector-title"
                aria-describedby="member-selector-description"
                className="relative z-10 w-full max-w-sm mx-4 max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="member-selector-dialog"
            >
                {/* Close button */}
                <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 rounded-full transition-colors"
                    style={{ color: 'var(--secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                    aria-label={texts.close}
                    type="button"
                    data-testid="member-selector-close-btn"
                >
                    <X size={20} aria-hidden="true" />
                </button>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2 pr-10">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                            <Crown className="w-6 h-6" aria-hidden="true" style={{ color: 'var(--primary)' }} />
                        </div>
                        <h2
                            id="member-selector-title"
                            className="text-xl font-bold"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {texts.title}
                        </h2>
                    </div>

                    {/* Description */}
                    <p
                        id="member-selector-description"
                        className="text-sm mb-5"
                        style={{ color: 'var(--text-secondary)', marginLeft: '60px' }}
                    >
                        {texts.description}
                    </p>

                    {/* Member List */}
                    {selectableMembers.length === 0 ? (
                        <div
                            className="py-8 text-center"
                            style={{ color: 'var(--text-secondary)' }}
                            data-testid="empty-state"
                        >
                            <Users
                                className="w-12 h-12 mx-auto mb-3 opacity-30"
                                aria-hidden="true"
                                style={{ color: 'var(--text-tertiary)' }}
                            />
                            <p className="text-sm">{texts.noOtherMembers}</p>
                        </div>
                    ) : (
                        // max-h-64 (256px) shows ~5-6 members before scrolling
                        <div
                            className="max-h-64 overflow-y-auto -mx-2 px-2"
                            role="list"
                        >
                            {selectableMembers.map((memberId) => {
                                const { displayName, email, photoURL } = getMemberInfo(memberId);

                                return (
                                    <button
                                        key={memberId}
                                        onClick={() => handleMemberClick(memberId)}
                                        type="button"
                                        className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-left"
                                        style={{ color: 'var(--text-primary)' }}
                                        data-testid={`member-item-${memberId}`}
                                    >
                                        {/* Avatar - with domain validation for defense-in-depth */}
                                        {isValidPhotoUrl(photoURL) ? (
                                            <img
                                                src={photoURL}
                                                alt={displayName}
                                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium"
                                                style={{
                                                    backgroundColor: 'var(--primary)',
                                                    color: 'white',
                                                }}
                                                data-testid="avatar-placeholder"
                                            >
                                                {getInitials(displayName)}
                                            </div>
                                        )}

                                        {/* Member Info */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="font-medium truncate"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {displayName}
                                            </p>
                                            {email && email !== displayName && (
                                                <p
                                                    className="text-xs truncate"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    {email}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberSelectorDialog;
