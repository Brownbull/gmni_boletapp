/**
 * TransferOwnershipDialog Component
 *
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Confirmation dialog for transferring group ownership to another member.
 *
 * AC5: Transfer ownership to another member
 * AC7: Confirmation dialogs show consequences
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, ArrowRightLeft, Loader2 } from 'lucide-react';

export interface TransferOwnershipDialogProps {
    /** Whether the modal is currently open */
    isOpen: boolean;
    /** Name of the group */
    groupName: string;
    /** Name of the member receiving ownership */
    memberName: string;
    /** Callback when user confirms transfer */
    onConfirm: () => Promise<void>;
    /** Callback when dialog is closed/canceled */
    onClose: () => void;
    /** Translation function */
    t: (key: string) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

/**
 * Transfer ownership confirmation dialog.
 */
export const TransferOwnershipDialog: React.FC<TransferOwnershipDialogProps> = ({
    isOpen,
    groupName,
    memberName,
    onConfirm,
    onClose,
    t,
    lang = 'es',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const [isTransferring, setIsTransferring] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setIsTransferring(false);
            setTimeout(() => closeButtonRef.current?.focus(), 0);
        }
    }, [isOpen]);

    // Handle close
    const handleClose = useCallback(() => {
        if (isTransferring) return;
        onClose();
    }, [onClose, isTransferring]);

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isTransferring) {
                e.preventDefault();
                handleClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose, isTransferring]);

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
        setIsTransferring(true);
        try {
            await onConfirm();
        } finally {
            setIsTransferring(false);
        }
    }, [onConfirm]);

    if (!isOpen) return null;

    // Translations
    const texts = {
        title: t('transferOwnershipTitle') || (lang === 'es' ? '¿Transferir propiedad?' : 'Transfer ownership?'),
        description: t('transferOwnershipDesc') || (lang === 'es'
            ? `${memberName} se convertirá en el dueño del grupo "${groupName}". Tú seguirás siendo miembro.`
            : `${memberName} will become the owner of "${groupName}". You will remain a member.`),
        cancel: t('cancel') || (lang === 'es' ? 'Cancelar' : 'Cancel'),
        confirm: t('transfer') || (lang === 'es' ? 'Transferir' : 'Transfer'),
        transferring: t('transferring') || (lang === 'es' ? 'Transfiriendo...' : 'Transferring...'),
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            role="presentation"
            data-testid="transfer-ownership-dialog-backdrop"
        >
            {/* Full-screen backdrop - covers entire viewport including nav */}
            <div
                className="fixed inset-0 bg-black/50"
                aria-hidden="true"
                onClick={handleClose}
            />

            {/* Dialog container */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="transfer-ownership-title"
                className="relative z-10 w-full max-w-sm mx-4 rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="transfer-ownership-dialog"
            >
                    <button
                        ref={closeButtonRef}
                        onClick={handleClose}
                        disabled={isTransferring}
                        className="absolute right-4 top-4 p-2 rounded-full transition-colors disabled:opacity-50"
                        style={{ color: 'var(--secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                        aria-label={t('close') || 'Close'}
                    >
                        <X size={20} />
                    </button>

                    <div className="p-6 text-center">
                        <div
                            className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'var(--primary-light)' }}
                        >
                            <ArrowRightLeft size={28} style={{ color: 'var(--primary)' }} />
                        </div>

                        <h2
                            id="transfer-ownership-title"
                            className="text-xl font-bold mb-4"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {texts.title}
                        </h2>

                        <p
                            className="text-sm mb-6"
                            style={{ color: 'var(--secondary)' }}
                        >
                            {texts.description}
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleConfirm}
                                disabled={isTransferring}
                                className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--primary)' }}
                                data-testid="transfer-confirm-btn"
                            >
                                {isTransferring ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        {texts.transferring}
                                    </>
                                ) : (
                                    <>
                                        <ArrowRightLeft size={18} />
                                        {texts.confirm}
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleClose}
                                disabled={isTransferring}
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

export default TransferOwnershipDialog;
