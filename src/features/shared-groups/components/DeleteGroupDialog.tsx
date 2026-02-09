/**
 * DeleteGroupDialog Component
 *
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Confirmation dialog for deleting a shared group entirely.
 * Only the owner can delete a group.
 *
 * Features:
 * - Type-to-confirm: User must type the exact group name to enable delete
 * - Strong warning message about permanent deletion
 * - Accessible: aria-labelledby, aria-describedby (warning), focus on input when dialog opens
 *
 * When deleting a group:
 * - The group label is removed from all transactions
 * - Other members can no longer see shared transactions
 * - Each user keeps their own transactions (they just become private)
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useFocusTrap } from '@/shared/hooks';
import { safeCSSColor } from '@/utils/validationUtils';

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
    onConfirm: () => Promise<void>;
    /** Callback when dialog is closed/canceled */
    onClose: () => void;
    /** Translation function */
    t: (key: string) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

/**
 * Delete group confirmation dialog with type-to-confirm pattern.
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
    const inputRef = useRef<HTMLInputElement>(null);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Improvement #1: Add focus trap for accessibility
    useFocusTrap(modalRef, isOpen);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Validate confirm text matches group name (trimmed, case-sensitive)
    // Improvement #2: Also check groupName is not empty
    const isConfirmValid = confirmText.trim() === groupName.trim() && groupName.trim().length > 0;

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setIsDeleting(false);
            setConfirmText('');
            setError(null);
            // Defer focus to next tick to ensure DOM is ready after render
            focusTimeoutRef.current = setTimeout(() => inputRef.current?.focus(), 0);
        }
        return () => {
            if (focusTimeoutRef.current) {
                clearTimeout(focusTimeoutRef.current);
            }
        };
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
    // Improvement #6: Simplified signature - no parameters
    const handleConfirm = useCallback(async () => {
        if (!isConfirmValid || isDeleting) return;
        setIsDeleting(true);
        setError(null);
        try {
            await onConfirm();
        } catch (err) {
            // Improvement #3: Log detailed error for debugging, show generic message to users
            if (import.meta.env.DEV) {
                console.error('[DeleteGroupDialog] Delete failed:', err);
            }
            setError(t('deleteGroupError') || (lang === 'es'
                ? 'Error al eliminar el grupo. Por favor, intenta de nuevo.'
                : 'Failed to delete group. Please try again.'));
        } finally {
            setIsDeleting(false);
        }
    }, [onConfirm, isConfirmValid, isDeleting, t, lang]);

    // Handle input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmText(e.target.value);
    }, []);

    if (!isOpen) return null;

    // Translations with type-to-confirm keys
    const texts = {
        title: t('deleteGroupTitle') || (lang === 'es' ? '¿Eliminar grupo?' : 'Delete group?'),
        warning: t('deleteGroupWarning') || (lang === 'es'
            ? 'Esto eliminará permanentemente el grupo y todos los datos compartidos'
            : 'This will permanently delete the group and all shared data'),
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
        typeToConfirm: (t('typeGroupNameToConfirm') || (lang === 'es'
            ? 'Escribe "{name}" para confirmar'
            : 'Type "{name}" to confirm')).replace('{name}', groupName.trim()),
        placeholder: t('confirmDeletePlaceholder') || (lang === 'es'
            ? 'Escribe el nombre del grupo aquí'
            : 'Type group name here'),
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
                aria-describedby="delete-group-warning"
                className="relative z-10 w-full max-w-sm mx-4 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="delete-group-dialog"
            >
                <button
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
                                backgroundColor: safeCSSColor(groupColor),
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
                                backgroundColor: 'var(--error)',
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
                        style={{ color: safeCSSColor(groupColor) }}
                    >
                        {groupName}
                    </p>

                    {/* Warning */}
                    <div
                        id="delete-group-warning"
                        className="rounded-lg p-3 mb-4"
                        style={{
                            backgroundColor: 'var(--error-bg, rgba(239, 68, 68, 0.1))',
                            border: '1px solid var(--error-border, rgba(239, 68, 68, 0.2))',
                        }}
                    >
                        <div className="flex items-center gap-2 justify-center">
                            <AlertTriangle size={16} style={{ color: 'var(--error)' }} />
                            <span
                                className="text-sm font-medium"
                                style={{ color: 'var(--error)' }}
                            >
                                {texts.warning}
                            </span>
                        </div>
                        {memberCount > 1 && (
                            <p
                                className="text-xs mt-1"
                                style={{ color: 'var(--error)' }}
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

                    {/* Type-to-confirm input */}
                    <div className="mb-4">
                        <label
                            htmlFor="confirm-name-input"
                            className="block text-sm font-medium mb-2 text-left"
                            style={{ color: 'var(--text-secondary)' }}
                            id="confirm-name-label"
                        >
                            {texts.typeToConfirm}
                        </label>
                        <input
                            ref={inputRef}
                            id="confirm-name-input"
                            type="text"
                            value={confirmText}
                            onChange={handleInputChange}
                            disabled={isDeleting}
                            placeholder={texts.placeholder}
                            className="w-full px-3 py-2 rounded-lg border text-sm transition-colors disabled:opacity-50"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: confirmText.length > 0 && !isConfirmValid
                                    ? 'var(--error)'
                                    : 'var(--border-light)',
                                color: 'var(--text-primary)',
                            }}
                            aria-labelledby="confirm-name-label"
                            aria-invalid={confirmText.length > 0 && !isConfirmValid}
                            data-testid="confirm-name-input"
                            autoComplete="off"
                        />
                    </div>

                    {/* Error message */}
                    {error && (
                        <div
                            className="rounded-lg p-3 mb-4"
                            style={{
                                backgroundColor: 'var(--error-bg, rgba(239, 68, 68, 0.1))',
                                border: '1px solid var(--error-border, rgba(239, 68, 68, 0.3))',
                            }}
                            role="alert"
                            data-testid="delete-error-message"
                        >
                            <p
                                className="text-sm"
                                style={{ color: 'var(--error)' }}
                            >
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleConfirm}
                            disabled={isDeleting || !isConfirmValid}
                            className="w-full py-2.5 px-4 rounded-xl text-white text-sm font-medium shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ backgroundColor: 'var(--error)' }}
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
