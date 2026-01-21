/**
 * OwnerLeaveWarningDialog Component
 *
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Warning dialog shown when the owner tries to leave a group.
 * Owner must either transfer ownership or delete the group entirely.
 *
 * AC4: Owner cannot leave without transfer or delete
 * AC7: Confirmation dialogs show consequences
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X, Crown, Users, Trash2 } from 'lucide-react';

export interface OwnerLeaveWarningDialogProps {
    /** Whether the modal is currently open */
    isOpen: boolean;
    /** Name of the group */
    groupName: string;
    /** Color of the group */
    groupColor: string;
    /** Icon/emoji of the group */
    groupIcon?: string;
    /** Callback when user chooses to manage members (transfer ownership) */
    onManageMembers: () => void;
    /** Callback when user chooses to delete the group */
    onDeleteGroup: () => void;
    /** Callback when dialog is closed/canceled */
    onClose: () => void;
    /** Translation function */
    t: (key: string) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

/**
 * Warning dialog for owners trying to leave their group.
 */
export const OwnerLeaveWarningDialog: React.FC<OwnerLeaveWarningDialogProps> = ({
    isOpen,
    groupName,
    groupColor,
    groupIcon,
    onManageMembers,
    onDeleteGroup,
    onClose,
    t,
    lang = 'es',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Focus management
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => closeButtonRef.current?.focus(), 0);
        }
    }, [isOpen]);

    // Handle close
    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    // Handle Escape key
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

    // Prevent body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    // Translations
    const texts = {
        title: t('ownerLeaveWarningTitle') || (lang === 'es' ? 'Eres el dueño de este grupo' : "You're the owner of this group"),
        description: t('ownerLeaveWarningDesc') || (lang === 'es'
            ? 'Como dueño, debes:'
            : 'As owner, you must:'),
        option1: t('ownerLeaveWarningOption1') || (lang === 'es'
            ? 'Transferir propiedad a otro miembro'
            : 'Transfer ownership to another member'),
        option2: t('ownerLeaveWarningOption2') || (lang === 'es'
            ? 'Eliminar el grupo completamente'
            : 'Delete the group entirely'),
        manageMembers: t('manageMembers') || (lang === 'es' ? 'Administrar miembros' : 'Manage Members'),
        deleteGroup: t('deleteGroup') || (lang === 'es' ? 'Eliminar grupo' : 'Delete Group'),
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            role="presentation"
            data-testid="owner-leave-warning-backdrop"
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
                aria-labelledby="owner-warning-title"
                className="relative z-10 w-full max-w-sm mx-4 rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="owner-leave-warning-dialog"
            >
                <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    className="absolute right-4 top-4 p-2 rounded-full transition-colors"
                    style={{ color: 'var(--secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                    aria-label={t('close') || 'Close'}
                >
                    <X size={20} />
                </button>

                <div className="p-6 text-center">
                    {/* Group Icon with Crown */}
                    <div className="relative mx-auto mb-4 w-16 h-16">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                            style={{ backgroundColor: groupColor }}
                        >
                            {groupIcon || <Crown className="text-white" size={28} />}
                        </div>
                        <div
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2"
                            style={{
                                backgroundColor: '#f59e0b',
                                borderColor: 'var(--surface)',
                            }}
                        >
                            <Crown size={14} className="text-white" />
                        </div>
                    </div>

                    <h2
                        id="owner-warning-title"
                        className="text-xl font-bold mb-1"
                        style={{ color: 'var(--primary)' }}
                    >
                        {texts.title}
                    </h2>

                    <p
                        className="text-sm font-medium mb-4"
                        style={{ color: groupColor }}
                    >
                        {groupName}
                    </p>

                    <p
                        className="text-sm mb-4"
                        style={{ color: 'var(--secondary)' }}
                    >
                        {texts.description}
                    </p>

                    {/* Options list */}
                    <div
                        className="rounded-xl p-4 mb-6 text-left space-y-2"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                        <div className="flex items-start gap-2">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span
                                className="text-sm"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {texts.option1}
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span
                                className="text-sm"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {texts.option2}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onManageMembers}
                            className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                            style={{ backgroundColor: 'var(--primary)' }}
                            data-testid="manage-members-btn"
                        >
                            <Users size={18} />
                            {texts.manageMembers}
                        </button>

                        <button
                            onClick={onDeleteGroup}
                            className="w-full py-3 px-4 rounded-xl font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--error)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                            }}
                            data-testid="delete-group-btn"
                        >
                            <Trash2 size={18} />
                            {texts.deleteGroup}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerLeaveWarningDialog;
