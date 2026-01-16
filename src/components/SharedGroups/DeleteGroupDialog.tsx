/**
 * DeleteGroupDialog Component
 *
 * Story 14c.3: Leave/Manage Group
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Confirmation dialog for deleting a shared group entirely.
 * Only the owner can delete a group. Offers option to keep or remove
 * all members' transactions from the group.
 *
 * AC4: Owner can delete group (soft/hard delete options)
 * AC7: Confirmation dialogs show consequences
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, Trash2, Loader2, AlertTriangle, FileText, ShieldOff } from 'lucide-react';

export interface DeleteGroupDialogProps {
    /** Whether the modal is currently open */
    isOpen: boolean;
    /** Name of the group being deleted */
    groupName: string;
    /** Color of the group */
    groupColor: string;
    /** Icon/emoji of the group */
    groupIcon?: string;
    /** Number of members in the group */
    memberCount: number;
    /** Callback when user confirms deletion */
    onConfirm: (removeTransactionTags: boolean) => Promise<void>;
    /** Callback when dialog is closed/canceled */
    onClose: () => void;
    /** Translation function */
    t: (key: string) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

/**
 * Delete group confirmation dialog.
 */
export const DeleteGroupDialog: React.FC<DeleteGroupDialogProps> = ({
    isOpen,
    groupName,
    groupColor,
    groupIcon,
    memberCount,
    onConfirm,
    onClose,
    t,
    lang = 'es',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const [removeTransactionTags, setRemoveTransactionTags] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setRemoveTransactionTags(false);
            setIsDeleting(false);
            setTimeout(() => closeButtonRef.current?.focus(), 0);
        }
    }, [isOpen]);

    // Handle close
    const handleClose = useCallback(() => {
        if (isDeleting) return;
        onClose();
    }, [onClose, isDeleting]);

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isDeleting) {
                e.preventDefault();
                handleClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose, isDeleting]);

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
        setIsDeleting(true);
        try {
            await onConfirm(removeTransactionTags);
        } finally {
            setIsDeleting(false);
        }
    }, [onConfirm, removeTransactionTags]);

    if (!isOpen) return null;

    // Translations
    const texts = {
        title: t('deleteGroupTitle') || (lang === 'es' ? '¿Eliminar grupo?' : 'Delete group?'),
        warning: t('deleteGroupWarning') || (lang === 'es'
            ? 'Esta acción es permanente y no se puede deshacer.'
            : 'This action is permanent and cannot be undone.'),
        membersAffected: t('deleteGroupMembersAffected') || (lang === 'es'
            ? `${memberCount} miembros perderán acceso`
            : `${memberCount} members will lose access`),
        keepTransactions: t('deleteGroupKeepTx') || (lang === 'es'
            ? 'Mantener transacciones visibles'
            : 'Keep transactions visible'),
        keepTransactionsDesc: t('deleteGroupKeepTxDesc') || (lang === 'es'
            ? 'Las transacciones permanecen en el grupo eliminado'
            : 'Transactions remain tagged with deleted group'),
        removeTransactions: t('deleteGroupRemoveTx') || (lang === 'es'
            ? 'Remover transacciones del grupo'
            : 'Remove transactions from group'),
        removeTransactionsDesc: t('deleteGroupRemoveTxDesc') || (lang === 'es'
            ? 'Todas las transacciones se vuelven privadas'
            : 'All transactions become private again'),
        cancel: t('cancel') || (lang === 'es' ? 'Cancelar' : 'Cancel'),
        confirm: t('deleteGroup') || (lang === 'es' ? 'Eliminar grupo' : 'Delete Group'),
        deleting: t('deleting') || (lang === 'es' ? 'Eliminando...' : 'Deleting...'),
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            role="presentation"
            data-testid="delete-group-dialog-backdrop"
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
                aria-labelledby="delete-group-title"
                className="relative z-10 w-full max-w-sm mx-4 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="delete-group-dialog"
            >
                <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    disabled={isDeleting}
                    className="absolute right-4 top-4 p-2 rounded-full transition-colors disabled:opacity-50"
                    style={{ color: 'var(--secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                    aria-label={t('close') || 'Close'}
                >
                    <X size={20} />
                </button>

                <div className="p-6 text-center">
                    {/* Warning Icon with Group */}
                    <div className="relative mx-auto mb-4 w-16 h-16">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                            style={{ backgroundColor: groupColor }}
                        >
                            {groupIcon || <Trash2 className="text-white" size={28} />}
                        </div>
                        <div
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2"
                            style={{
                                backgroundColor: '#ef4444',
                                borderColor: 'var(--surface)',
                            }}
                        >
                            <AlertTriangle size={14} className="text-white" />
                        </div>
                    </div>

                    <h2
                        id="delete-group-title"
                        className="text-xl font-bold mb-1"
                        style={{ color: 'var(--primary)' }}
                    >
                        {texts.title}
                    </h2>

                    <p
                        className="text-sm font-medium mb-3"
                        style={{ color: groupColor }}
                    >
                        {groupName}
                    </p>

                    {/* Warning */}
                    <div
                        className="rounded-lg p-3 mb-4"
                        style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                        }}
                    >
                        <div className="flex items-center gap-2 justify-center">
                            <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                            <span
                                className="text-sm font-medium"
                                style={{ color: '#ef4444' }}
                            >
                                {texts.warning}
                            </span>
                        </div>
                        {memberCount > 1 && (
                            <p
                                className="text-xs mt-1"
                                style={{ color: '#ef4444' }}
                            >
                                {texts.membersAffected}
                            </p>
                        )}
                    </div>

                    {/* Transaction handling options */}
                    <div className="space-y-3 mb-6">
                        {/* Keep transactions */}
                        <button
                            onClick={() => setRemoveTransactionTags(false)}
                            disabled={isDeleting}
                            className={`w-full p-4 rounded-xl text-left transition-all ${
                                !removeTransactionTags ? 'ring-2 ring-offset-2' : ''
                            }`}
                            style={{
                                backgroundColor: !removeTransactionTags
                                    ? 'rgba(16, 185, 129, 0.1)'
                                    : 'var(--bg-tertiary)',
                                // ringColor handled by Tailwind ring-* classes
                            }}
                            data-testid="delete-keep-tx-option"
                        >
                            <div className="flex items-start gap-3">
                                <FileText
                                    size={24}
                                    style={{ color: !removeTransactionTags ? '#10b981' : 'var(--secondary)' }}
                                />
                                <div>
                                    <div
                                        className="font-medium"
                                        style={{ color: 'var(--primary)' }}
                                    >
                                        {texts.keepTransactions}
                                    </div>
                                    <div
                                        className="text-sm mt-0.5"
                                        style={{ color: 'var(--secondary)' }}
                                    >
                                        {texts.keepTransactionsDesc}
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Remove transactions */}
                        <button
                            onClick={() => setRemoveTransactionTags(true)}
                            disabled={isDeleting}
                            className={`w-full p-4 rounded-xl text-left transition-all ${
                                removeTransactionTags ? 'ring-2 ring-offset-2' : ''
                            }`}
                            style={{
                                backgroundColor: removeTransactionTags
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : 'var(--bg-tertiary)',
                                // ringColor handled by Tailwind ring-* classes
                            }}
                            data-testid="delete-remove-tx-option"
                        >
                            <div className="flex items-start gap-3">
                                <ShieldOff
                                    size={24}
                                    style={{ color: removeTransactionTags ? '#ef4444' : 'var(--secondary)' }}
                                />
                                <div>
                                    <div
                                        className="font-medium"
                                        style={{ color: 'var(--primary)' }}
                                    >
                                        {texts.removeTransactions}
                                    </div>
                                    <div
                                        className="text-sm mt-0.5"
                                        style={{ color: 'var(--secondary)' }}
                                    >
                                        {texts.removeTransactionsDesc}
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleConfirm}
                            disabled={isDeleting}
                            className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#ef4444' }}
                            data-testid="delete-confirm-btn"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    {texts.deleting}
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    {texts.confirm}
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleClose}
                            disabled={isDeleting}
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

export default DeleteGroupDialog;
