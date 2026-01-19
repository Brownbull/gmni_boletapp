/**
 * JoinGroupDialog Component
 *
 * Story 14c.17: Share Link Deep Linking
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Dialog for joining a shared group via share link.
 * Shows group preview and confirmation before joining.
 *
 * Features:
 * - WCAG 2.1 Level AA compliant (role="dialog", aria-modal, aria-labelledby)
 * - Focus trap within modal while open
 * - Escape key closes modal
 * - Group preview (name, color, icon, member count)
 * - Loading state during join
 * - Error state with appropriate messages
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X, UserPlus, Users, Loader2, AlertCircle, UserCheck } from 'lucide-react';
import type { SharedGroupPreview } from '../../types/sharedGroup';
import type { JoinLinkState, JoinError } from '../../hooks/useJoinLinkHandler';

export interface JoinGroupDialogProps {
    /** Whether the modal is currently open */
    isOpen: boolean;
    /** Current state of the join flow */
    state: JoinLinkState;
    /** Group preview data (if available) */
    groupPreview: SharedGroupPreview | null;
    /** Error that occurred (if any) */
    error: JoinError | null;
    /** Callback when user confirms joining */
    onConfirm: () => void;
    /** Callback when dialog is closed/canceled */
    onCancel: () => void;
    /** Callback to dismiss error state */
    onDismissError: () => void;
    /** Translation function */
    t: (key: string) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

/**
 * Get user-friendly error message for each error type.
 */
function getErrorMessage(error: JoinError, lang: 'en' | 'es'): { title: string; description: string } {
    const messages: Record<JoinError, { en: { title: string; description: string }; es: { title: string; description: string } }> = {
        CODE_NOT_FOUND: {
            en: { title: 'Invalid Link', description: 'This share link is not valid. Please ask for a new one.' },
            es: { title: 'Enlace Inválido', description: 'Este enlace no es válido. Pide uno nuevo.' },
        },
        CODE_EXPIRED: {
            en: { title: 'Link Expired', description: 'This share link has expired. Ask the group owner for a new link.' },
            es: { title: 'Enlace Expirado', description: 'Este enlace ha expirado. Pide uno nuevo al dueño del grupo.' },
        },
        GROUP_FULL: {
            en: { title: 'Group Full', description: 'This group has reached the maximum of 10 members.' },
            es: { title: 'Grupo Lleno', description: 'Este grupo ha alcanzado el máximo de 10 miembros.' },
        },
        ALREADY_MEMBER: {
            en: { title: 'Already a Member', description: 'You\'re already a member of this group.' },
            es: { title: 'Ya Eres Miembro', description: 'Ya eres miembro de este grupo.' },
        },
        NETWORK_ERROR: {
            en: { title: 'Connection Error', description: 'Please check your internet connection and try again.' },
            es: { title: 'Error de Conexión', description: 'Por favor revisa tu conexión a internet e intenta de nuevo.' },
        },
        UNKNOWN_ERROR: {
            en: { title: 'Something Went Wrong', description: 'Please try again later.' },
            es: { title: 'Algo Salió Mal', description: 'Por favor intenta de nuevo más tarde.' },
        },
    };

    return messages[error][lang];
}

/**
 * Join group confirmation dialog.
 */
export const JoinGroupDialog: React.FC<JoinGroupDialogProps> = ({
    isOpen,
    state,
    groupPreview,
    error,
    onConfirm,
    onCancel,
    onDismissError,
    t,
    lang = 'es',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElement = useRef<Element | null>(null);

    const isJoining = state === 'joining';
    const isLoading = state === 'loading';
    const isError = state === 'error';

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
        if (isJoining) return; // Don't close while joining
        onCancel();
        setTimeout(() => {
            (previousActiveElement.current as HTMLElement)?.focus?.();
        }, 0);
    }, [onCancel, isJoining]);

    // Handle Escape key to close modal
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isJoining) {
                e.preventDefault();
                if (isError) {
                    onDismissError();
                } else {
                    handleClose();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose, isJoining, isError, onDismissError]);

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

    // Translations
    const texts = {
        title: t('joinGroupTitle') || (lang === 'es' ? '¿Unirte al grupo?' : 'Join group?'),
        loading: t('loading') || (lang === 'es' ? 'Cargando...' : 'Loading...'),
        members: t('members') || (lang === 'es' ? 'miembros' : 'members'),
        join: t('join') || (lang === 'es' ? 'Unirme' : 'Join'),
        joining: t('joining') || (lang === 'es' ? 'Uniéndose...' : 'Joining...'),
        cancel: t('cancel') || (lang === 'es' ? 'Cancelar' : 'Cancel'),
        close: t('close') || (lang === 'es' ? 'Cerrar' : 'Close'),
        ok: t('ok') || 'OK',
    };

    const errorMessage = error ? getErrorMessage(error, lang) : null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            role="presentation"
            data-testid="join-group-dialog-backdrop"
            onClick={isJoining ? undefined : handleClose}
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
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="join-group-dialog"
            >
                {/* Close button */}
                <button
                    ref={closeButtonRef}
                    onClick={isError ? onDismissError : handleClose}
                    disabled={isJoining}
                    className="absolute right-4 top-4 p-2 rounded-full transition-colors disabled:opacity-50"
                    style={{
                        color: 'var(--secondary)',
                        backgroundColor: 'var(--bg-tertiary)',
                    }}
                    aria-label={texts.close}
                    data-testid="join-group-close-btn"
                >
                    <X size={20} aria-hidden="true" />
                </button>

                {/* Content */}
                <div className="p-6 text-center">
                    {/* Loading State */}
                    {isLoading && (
                        <div data-testid="join-group-loading" className="py-8">
                            <Loader2 className="animate-spin mx-auto mb-4" size={48} style={{ color: 'var(--primary)' }} />
                            <p style={{ color: 'var(--secondary)' }}>{texts.loading}</p>
                        </div>
                    )}

                    {/* Error State */}
                    {isError && errorMessage && (
                        <>
                            <div
                                className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                aria-hidden="true"
                            >
                                {error === 'ALREADY_MEMBER' ? (
                                    <UserCheck className="text-amber-500" size={32} />
                                ) : (
                                    <AlertCircle className="text-red-500" size={32} />
                                )}
                            </div>

                            <h2
                                id="join-group-modal-title"
                                className="text-xl font-bold mb-2"
                                style={{ color: error === 'ALREADY_MEMBER' ? 'var(--primary)' : '#ef4444' }}
                            >
                                {errorMessage.title}
                            </h2>

                            <p
                                id="join-group-modal-description"
                                className="text-sm mb-6"
                                style={{ color: 'var(--secondary)' }}
                            >
                                {errorMessage.description}
                            </p>

                            <button
                                onClick={onDismissError}
                                className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                                style={{ backgroundColor: 'var(--primary)' }}
                                data-testid="join-group-dismiss-btn"
                            >
                                {texts.ok}
                            </button>
                        </>
                    )}

                    {/* Confirming State */}
                    {(state === 'confirming' || state === 'joining') && groupPreview && (
                        <>
                            {/* Group Icon */}
                            <div
                                className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                                style={{ backgroundColor: groupPreview.color }}
                                aria-hidden="true"
                            >
                                {groupPreview.icon || <Users className="text-white" size={28} />}
                            </div>

                            {/* Title */}
                            <h2
                                id="join-group-modal-title"
                                className="text-xl font-bold mb-1"
                                style={{ color: 'var(--primary)' }}
                            >
                                {texts.title}
                            </h2>

                            {/* Group name */}
                            <p
                                className="text-lg font-semibold mb-2"
                                style={{ color: groupPreview.color }}
                            >
                                {groupPreview.name}
                            </p>

                            {/* Member count */}
                            <p
                                id="join-group-modal-description"
                                className="text-sm mb-6 flex items-center justify-center gap-2"
                                style={{ color: 'var(--secondary)' }}
                            >
                                <Users size={16} />
                                {groupPreview.memberCount} {texts.members}
                            </p>

                            {/* Joining indicator */}
                            {isJoining && (
                                <div data-testid="join-group-joining" className="mb-4">
                                    <Loader2 className="animate-spin mx-auto" size={24} style={{ color: groupPreview.color }} />
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-col gap-3">
                                {/* Join button */}
                                <button
                                    onClick={onConfirm}
                                    disabled={isJoining}
                                    className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{ backgroundColor: groupPreview.color }}
                                    data-testid="join-group-confirm-btn"
                                >
                                    {isJoining ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            {texts.joining}
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            {texts.join}
                                        </>
                                    )}
                                </button>

                                {/* Cancel button */}
                                <button
                                    onClick={handleClose}
                                    disabled={isJoining}
                                    className="w-full py-3 px-4 rounded-xl border font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    style={{
                                        borderColor: 'var(--border-light)',
                                        color: 'var(--text-primary)',
                                        backgroundColor: 'var(--bg-secondary)',
                                    }}
                                    data-testid="join-group-cancel-btn"
                                >
                                    <X size={18} />
                                    {texts.cancel}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JoinGroupDialog;
