/**
 * RemoveMemberDialog Component
 *
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Confirmation dialog for removing a member from a shared group.
 * The removed member loses access but their transactions stay shared (soft remove).
 *
 * AC6: Owner can remove members
 * AC7: Confirmation dialogs show consequences
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, UserMinus, Loader2 } from 'lucide-react';

export interface RemoveMemberDialogProps {
    /** Whether the modal is currently open */
    isOpen: boolean;
    /** Name of the group */
    groupName: string;
    /** Name of the member being removed */
    memberName: string;
    /** Callback when user confirms removal */
    onConfirm: () => Promise<void>;
    /** Callback when dialog is closed/canceled */
    onClose: () => void;
    /** Translation function */
    t: (key: string) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

/**
 * Remove member confirmation dialog.
 */
export const RemoveMemberDialog: React.FC<RemoveMemberDialogProps> = ({
    isOpen,
    groupName: _groupName, // Reserved for future use in translations
    memberName,
    onConfirm,
    onClose,
    t,
    lang = 'es',
}) => {
    void _groupName; // Silence unused warning - can be used in translations
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setIsRemoving(false);
            setTimeout(() => closeButtonRef.current?.focus(), 0);
        }
    }, [isOpen]);

    // Handle close
    const handleClose = useCallback(() => {
        if (isRemoving) return;
        onClose();
    }, [onClose, isRemoving]);

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isRemoving) {
                e.preventDefault();
                handleClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose, isRemoving]);

    // Prevent body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Handle confirm
    const handleConfirm = useCallback(async () => {
        setIsRemoving(true);
        try {
            await onConfirm();
        } finally {
            setIsRemoving(false);
        }
    }, [onConfirm]);

    if (!isOpen) return null;

    // Translations
    const texts = {
        title: t('removeMemberTitle') || (lang === 'es' ? '¿Remover miembro?' : 'Remove member?'),
        description: t('removeMemberDesc') || (lang === 'es'
            ? `${memberName} perderá acceso al grupo. Sus transacciones compartidas permanecerán visibles para otros miembros.`
            : `${memberName} will lose access to the group. Their shared transactions will remain visible to other members.`),
        cancel: t('cancel') || (lang === 'es' ? 'Cancelar' : 'Cancel'),
        confirm: t('remove') || (lang === 'es' ? 'Remover' : 'Remove'),
        removing: t('removing') || (lang === 'es' ? 'Removiendo...' : 'Removing...'),
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            role="presentation"
            data-testid="remove-member-dialog-backdrop"
        >
            {/* Full-screen backdrop - covers entire viewport including nav */}
            <div
                className="fixed inset-0 bg-black/50"
                aria-hidden="true"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="remove-member-title"
                className="relative z-10 w-full max-w-sm mx-4 rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="remove-member-dialog"
            >
                <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    disabled={isRemoving}
                    className="absolute right-4 top-4 p-2 rounded-full transition-colors disabled:opacity-50"
                    style={{ color: 'var(--secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                    aria-label={t('close') || 'Close'}
                >
                    <X size={20} />
                </button>

                <div className="p-6 text-center">
                    <div
                        className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    >
                        <UserMinus size={28} style={{ color: '#ef4444' }} />
                    </div>

                    <h2
                        id="remove-member-title"
                        className="text-xl font-bold mb-2"
                        style={{ color: 'var(--primary)' }}
                    >
                        {texts.title}
                    </h2>

                    <p
                        className="text-sm font-medium mb-4"
                        style={{ color: 'var(--accent)' }}
                    >
                        {memberName}
                    </p>

                    <p
                        className="text-sm mb-6"
                        style={{ color: 'var(--secondary)' }}
                    >
                        {texts.description}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleConfirm}
                            disabled={isRemoving}
                            className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#ef4444' }}
                            data-testid="remove-confirm-btn"
                        >
                            {isRemoving ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    {texts.removing}
                                </>
                            ) : (
                                <>
                                    <UserMinus size={18} />
                                    {texts.confirm}
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleClose}
                            disabled={isRemoving}
                            className="w-full py-3 px-4 rounded-xl border font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{
                                borderColor: 'var(--border-light)',
                                color: 'var(--text-primary)',
                                backgroundColor: 'var(--bg-secondary)',
                            }}
                        >
                            <X size={18} />
                            {texts.cancel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RemoveMemberDialog;
