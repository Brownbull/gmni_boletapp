/**
 * InviteMembersDialog Component
 *
 * Story 14d-v2-1-5c: Invitation UI (Components & Integration)
 * Epic 14d-v2: Shared Groups v2
 *
 * Simplified modal dialog for sharing group invite link/code.
 * Features:
 * - "Copy Link" button that copies /join/{shareCode} to clipboard
 * - "Copy Code" button that copies just the share code
 * - Expiration notice: "Link expires in 7 days"
 * - Accessible (keyboard navigation, ARIA)
 *
 * @example
 * ```tsx
 * <InviteMembersDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   shareCode="Ab3dEf7hIj9kLm0p"
 *   groupName="🏠 Home Expenses"
 *   t={t}
 * />
 * ```
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Link2, Copy, Check } from 'lucide-react';
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from '@/shared/hooks';
import { Z_INDEX } from '@/constants';

// =============================================================================
// Types
// =============================================================================

export interface InviteMembersDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog should close */
    onClose: () => void;
    /** The share code for the invite link */
    shareCode: string;
    /** Group name (for display) */
    groupName: string;
    /** Translation function */
    t: (key: string) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

// =============================================================================
// Constants
// =============================================================================

const INVITE_LINK_BASE = 'https://gastify.app/join/';

// =============================================================================
// Component
// =============================================================================

export const InviteMembersDialog: React.FC<InviteMembersDialogProps> = ({
    open,
    onClose,
    shareCode,
    groupName,
    t,
    lang = 'es',
}) => {
    // State
    const [linkCopied, setLinkCopied] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);

    // Refs
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Build the invite link
    const inviteLink = useMemo(() => {
        return `${INVITE_LINK_BASE}${shareCode}`;
    }, [shareCode]);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setLinkCopied(false);
            setCodeCopied(false);
        }
    }, [open]);

    // Reset link copied state after 2 seconds
    useEffect(() => {
        if (linkCopied) {
            const timer = setTimeout(() => setLinkCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [linkCopied]);

    // Reset code copied state after 2 seconds
    useEffect(() => {
        if (codeCopied) {
            const timer = setTimeout(() => setCodeCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [codeCopied]);

    // Handle close
    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    // TD-7d-2: Shared dialog hooks for accessibility
    useEscapeKey(handleClose, open);
    useFocusTrap(modalRef, open);
    useBodyScrollLock(open);

    // Copy to clipboard helper
    const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fallback for browsers that don't support clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    }, []);

    // Handle copy link
    const handleCopyLink = useCallback(async () => {
        const success = await copyToClipboard(inviteLink);
        if (success) {
            setLinkCopied(true);
            setCodeCopied(false);
        }
    }, [inviteLink, copyToClipboard]);

    // Handle copy code
    const handleCopyCode = useCallback(async () => {
        const success = await copyToClipboard(shareCode);
        if (success) {
            setCodeCopied(true);
            setLinkCopied(false);
        }
    }, [shareCode, copyToClipboard]);

    // Don't render if closed
    if (!open) return null;

    // Translations with direct groupName interpolation
    const texts = {
        title: t('inviteMembers') || (lang === 'es' ? 'Invitar Miembros' : 'Invite Members'),
        description: lang === 'es'
            ? `Comparte este enlace o código para invitar a otros a "${groupName}"`
            : `Share this link or code to invite others to "${groupName}"`,
        shareLink: t('shareLink') || (lang === 'es' ? 'Enlace de Invitación' : 'Invite Link'),
        shareCode: t('shareCode') || (lang === 'es' ? 'Código de Invitación' : 'Invite Code'),
        copyLink: t('copyInviteLink') || (lang === 'es' ? 'Copiar Enlace' : 'Copy Link'),
        copyCode: t('copyCode') || (lang === 'es' ? 'Copiar Código' : 'Copy Code'),
        linkCopied: t('linkCopied') || (lang === 'es' ? '¡Copiado!' : 'Copied!'),
        codeCopied: t('codeCopied') || (lang === 'es' ? '¡Copiado!' : 'Copied!'),
        linkExpiresIn: t('linkExpiresIn') || (lang === 'es'
            ? 'El enlace expira en 7 días'
            : 'Link expires in 7 days'),
        close: t('close') || (lang === 'es' ? 'Cerrar' : 'Close'),
        orUseCode: lang === 'es' ? 'O usa el código' : 'Or use the code',
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: Z_INDEX.MODAL }}
            role="presentation"
            data-testid="invite-members-dialog-backdrop"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50"
                aria-hidden="true"
                onClick={handleClose}
                data-testid="backdrop-overlay"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="invite-members-title"
                className="relative z-10 w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="invite-members-dialog"
            >
                {/* Close button */}
                <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    className="absolute right-4 top-4 p-2 rounded-full transition-colors"
                    style={{ color: 'var(--secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                    aria-label={texts.close}
                    data-testid="close-btn"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2 pr-10">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                            <Link2 className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                        </div>
                        <h2
                            id="invite-members-title"
                            className="text-xl font-bold"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {texts.title}
                        </h2>
                    </div>

                    {/* Description */}
                    <p
                        className="text-sm mb-6"
                        style={{ color: 'var(--text-secondary)', marginLeft: '60px' }}
                    >
                        {texts.description}
                    </p>

                    {/* Copy Link Section */}
                    <div
                        className="p-4 rounded-xl mb-4"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-light)',
                        }}
                    >
                        <label
                            className="block text-xs font-medium mb-2"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {texts.shareLink}
                        </label>

                        {/* Link display */}
                        <div
                            className="mb-3 p-3 rounded-lg text-xs font-mono break-all"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                            }}
                            data-testid="invite-link-display"
                        >
                            {inviteLink}
                        </div>

                        {/* Copy Link button */}
                        <button
                            onClick={handleCopyLink}
                            className="w-full py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: linkCopied ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary)',
                                color: linkCopied ? 'var(--success, #10b981)' : 'white',
                            }}
                            data-testid="copy-link-btn"
                        >
                            {linkCopied ? (
                                <>
                                    <Check size={18} />
                                    {texts.linkCopied}
                                </>
                            ) : (
                                <>
                                    <Copy size={18} />
                                    {texts.copyLink}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-light)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {texts.orUseCode}
                        </span>
                        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-light)' }} />
                    </div>

                    {/* Copy Code Section */}
                    <div
                        className="p-4 rounded-xl"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-light)',
                        }}
                    >
                        <label
                            className="block text-xs font-medium mb-2"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {texts.shareCode}
                        </label>

                        {/* Code display */}
                        <div
                            className="mb-3 p-3 rounded-lg text-lg font-mono text-center tracking-widest"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                letterSpacing: '0.15em',
                            }}
                            data-testid="invite-code-display"
                        >
                            {shareCode}
                        </div>

                        {/* Copy Code button */}
                        <button
                            onClick={handleCopyCode}
                            className="w-full py-3 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2"
                            style={{
                                borderColor: codeCopied ? 'var(--success, #10b981)' : 'var(--border-light)',
                                color: codeCopied ? 'var(--success, #10b981)' : 'var(--text-primary)',
                                backgroundColor: codeCopied ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                            }}
                            data-testid="copy-code-btn"
                        >
                            {codeCopied ? (
                                <>
                                    <Check size={18} />
                                    {texts.codeCopied}
                                </>
                            ) : (
                                <>
                                    <Copy size={18} />
                                    {texts.copyCode}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Expiration notice */}
                    <p
                        className="text-xs mt-4 text-center"
                        style={{ color: 'var(--text-tertiary)' }}
                        data-testid="expiration-notice"
                    >
                        {texts.linkExpiresIn}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InviteMembersDialog;
