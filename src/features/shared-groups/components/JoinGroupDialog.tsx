/**
 * Story 14c-refactor.5: JoinGroupDialog - SIMPLIFIED (Feature Disabled)
 *
 * STUB: Shared Groups feature is temporarily unavailable.
 *
 * This simplified JoinGroupDialog shows a "Coming soon" message
 * instead of the full join flow.
 *
 * Original functionality will be restored in Epic 14d (Shared Groups v2).
 *
 * @example
 * ```tsx
 * <JoinGroupDialog
 *   isOpen={isOpen}
 *   onCancel={() => setIsOpen(false)}
 *   t={t}
 * />
 * ```
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
// Types kept for backwards compatibility but not used
import type { SharedGroupPreview } from '@/types/sharedGroup';
import type { JoinLinkState, JoinError } from '@/hooks/useJoinLinkHandler';

export interface JoinGroupDialogProps {
    /** Whether the modal is currently open */
    isOpen: boolean;
    /** @deprecated Current state of the join flow - IGNORED (feature disabled) */
    state?: JoinLinkState;
    /** @deprecated Group preview data - IGNORED (feature disabled) */
    groupPreview?: SharedGroupPreview | null;
    /** @deprecated Error that occurred - IGNORED (feature disabled) */
    error?: JoinError | null;
    /** @deprecated Callback when user confirms joining - IGNORED (feature disabled) */
    onConfirm?: () => void;
    /** Callback when dialog is closed/canceled */
    onCancel: () => void;
    /** @deprecated Callback to dismiss error state - IGNORED (feature disabled) */
    onDismissError?: () => void;
    /** Translation function */
    t: (key: string) => string;
    /** @deprecated Language for fallback text - IGNORED (feature disabled) */
    lang?: 'en' | 'es';
}

/**
 * Simplified join group dialog that shows "Coming soon" message.
 */
export const JoinGroupDialog: React.FC<JoinGroupDialogProps> = ({
    isOpen,
    onCancel,
    t,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElement = useRef<Element | null>(null);

    // Store the previously focused element when modal opens
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement;
            setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 0);
        }
    }, [isOpen]);

    // Restore focus when modal closes
    const handleClose = useCallback(() => {
        onCancel();
        setTimeout(() => {
            (previousActiveElement.current as HTMLElement)?.focus?.();
        }, 0);
    }, [onCancel]);

    // Handle Escape key to close modal
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]);

    // Focus trap within modal
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const modalElement = modalRef.current;
        const focusableElements = modalElement.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable?.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleTabKey);
        return () => document.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Translations with fallbacks
    const title = t('featureComingSoon') || 'Próximamente';
    const description = t('featureComingSoonDescription') || 'Esta función está siendo rediseñada para una mejor experiencia. ¡Mantente atento!';
    const closeText = t('close') || 'Cerrar';
    const okText = t('ok') || 'OK';

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            role="presentation"
            data-testid="join-group-dialog-backdrop"
            onClick={handleClose}
        >
            {/* Full-screen backdrop */}
            <div
                className="fixed inset-0 bg-black/50"
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="join-group-modal-title"
                aria-describedby="join-group-modal-description"
                className="relative z-10 w-full max-w-sm mx-4 rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface, #ffffff)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="join-group-dialog"
            >
                {/* Close button */}
                <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    className="absolute right-4 top-4 p-2 rounded-full transition-colors"
                    style={{
                        color: 'var(--secondary, #64748b)',
                        backgroundColor: 'var(--bg-tertiary, #f1f5f9)',
                    }}
                    aria-label={closeText}
                    data-testid="join-group-close-btn"
                >
                    <X size={20} aria-hidden="true" />
                </button>

                {/* Content - Coming Soon Message */}
                <div className="p-6 pt-12 text-center">
                    {/* House emoji icon */}
                    <div
                        className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                        style={{ backgroundColor: 'var(--primary-bg, #eff6ff)' }}
                        aria-hidden="true"
                    >
                        🏠
                    </div>

                    {/* Title */}
                    <h2
                        id="join-group-modal-title"
                        className="text-xl font-bold mb-2"
                        style={{ color: 'var(--text-primary, #0f172a)' }}
                    >
                        {title}
                    </h2>

                    {/* Description */}
                    <p
                        id="join-group-modal-description"
                        className="text-sm mb-6"
                        style={{ color: 'var(--text-secondary, #64748b)' }}
                    >
                        {description}
                    </p>

                    {/* OK button */}
                    <button
                        onClick={handleClose}
                        className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                        style={{ backgroundColor: 'var(--primary, #2563eb)' }}
                        data-testid="join-group-ok-btn"
                    >
                        {okText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JoinGroupDialog;
