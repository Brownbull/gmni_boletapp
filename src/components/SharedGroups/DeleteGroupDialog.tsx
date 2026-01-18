/**
 * DeleteGroupDialog Component
 *
 * Story 14c.3: Leave/Manage Group
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Confirmation dialog for deleting a shared group entirely.
 * Only the owner can delete a group.
 *
 * When deleting a group:
 * - The group label is removed from all transactions
 * - Other members can no longer see shared transactions
 * - Each user keeps their own transactions (they just become private)
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';

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
    /** Callback when user confirms deletion (always removes transaction tags) */
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
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
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

    // Handle confirm - always removes transaction tags
    const handleConfirm = useCallback(async () => {
        setIsDeleting(true);
        try {
            await onConfirm(true); // Always remove transaction tags
        } finally {
            setIsDeleting(false);
        }
    }, [onConfirm]);

    if (!isOpen) return null;

    // Translations
    const texts = {
        title: t('deleteGroupTitle') || (lang === 'es' ? '¿Eliminar grupo?' : 'Delete group?'),
        warning: t('deleteGroupWarning') || (lang === 'es'
            ? 'Esta acción es permanente y no se puede deshacer.'
            : 'This action is permanent and cannot be undone.'),
        membersAffected: (t('deleteGroupMembersAffected') || (lang === 'es'
            ? '{count} miembros perderán acceso'
            : '{count} members will lose access')).replace('{count}', String(memberCount)),
        whatHappens: lang === 'es' ? '¿Qué sucederá?' : 'What will happen?',
        consequence1: lang === 'es'
            ? 'Se eliminará la etiqueta del grupo de todas las transacciones'
            : 'The group label will be removed from all transactions',
        consequence2: lang === 'es'
            ? 'Los otros miembros ya no podrán ver las transacciones compartidas'
            : 'Other members will no longer see shared transactions',
        consequence3: lang === 'es'
            ? 'Cada usuario conserva sus propias transacciones (se vuelven privadas)'
            : 'Each user keeps their own transactions (they become private)',
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
            {/* Full-screen backdrop */}
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
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{
                                backgroundColor: groupColor,
                                fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif',
                                fontSize: '2rem',
                                lineHeight: 1,
                            }}
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
                        style={{ color: 'var(--text-primary)' }}
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

                    {/* What happens explanation */}
                    <div
                        className="rounded-lg p-3 mb-4 text-left"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-light)',
                        }}
                    >
                        <p
                            className="text-xs font-semibold uppercase tracking-wide mb-2"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {texts.whatHappens}
                        </p>
                        <ul className="space-y-2">
                            {[texts.consequence1, texts.consequence2, texts.consequence3].map((text, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-2 text-xs"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                        style={{ backgroundColor: 'var(--text-tertiary)' }}
                                    />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleConfirm}
                            disabled={isDeleting}
                            className="w-full py-2.5 px-4 rounded-xl text-white text-sm font-medium shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#ef4444' }}
                            data-testid="delete-confirm-btn"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    {texts.deleting}
                                </>
                            ) : (
                                <>
                                    <Trash2 size={16} />
                                    {texts.confirm}
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleClose}
                            disabled={isDeleting}
                            className="w-full py-2.5 px-4 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50"
                            style={{
                                borderColor: 'var(--border-light)',
                                color: 'var(--text-primary)',
                                backgroundColor: 'var(--bg-secondary)',
                            }}
                        >
                            {texts.cancel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteGroupDialog;
