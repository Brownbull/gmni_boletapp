/**
 * LeaveGroupDialog Component
 *
 * Story 14d-v2-1-7d: Leave/Transfer UI + View Mode Auto-Switch
 * Epic 14d-v2: Shared Groups v2
 *
 * Dialog for leaving a shared group with soft/hard leave options.
 * - Soft leave: Keep transactions shared (others can still see)
 * - Hard leave: Remove transactions from group (become private)
 *
 * Features:
 * - WCAG 2.1 Level AA compliant (role="dialog", aria-modal, aria-labelledby)
 * - Focus trap within modal while open
 * - Escape key closes modal
 * - Clear explanation of consequences for each option
 * - Loading state during leave operation
 *
 * AC1: Leave Group button opens confirmation dialog
 * AC2: Soft leave option - removes from members, keeps transactions
 * AC3: Hard leave option - removes from members + untags transactions
 * AC7: Confirmation dialogs show consequences
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, LogOut, FileText, ShieldOff, Loader2 } from 'lucide-react';
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from '@/shared/hooks';
import { Z_INDEX } from '@/constants';
import type { LeaveMode } from '@/features/shared-groups';

// Re-export LeaveMode for backward compatibility with existing imports
export type { LeaveMode } from '@/features/shared-groups';

export interface LeaveGroupDialogProps {
    /** Whether the modal is currently open */
    isOpen: boolean;
    /** Name of the group being left */
    groupName: string;
    /** Color of the group (for visual consistency) */
    groupColor: string;
    /** Icon/emoji of the group */
    groupIcon?: string;
    /** Callback when user confirms leaving */
    onConfirm: (mode: LeaveMode) => Promise<void>;
    /** Callback when dialog is closed/canceled */
    onClose: () => void;
    /** Translation function */
    t: (key: string) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

/**
 * Leave group confirmation dialog with soft/hard leave options.
 */
export const LeaveGroupDialog: React.FC<LeaveGroupDialogProps> = ({
    isOpen,
    groupName,
    groupColor,
    groupIcon,
    onConfirm,
    onClose,
    t,
    lang = 'es',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElement = useRef<Element | null>(null);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [selectedMode, setSelectedMode] = useState<LeaveMode>('soft');
    const [isLeaving, setIsLeaving] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setSelectedMode('soft');
            setIsLeaving(false);
        }
    }, [isOpen]);

    // Store the previously focused element when modal opens
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement;
            focusTimeoutRef.current = setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 0);
        }
        return () => {
            if (focusTimeoutRef.current) {
                clearTimeout(focusTimeoutRef.current);
                focusTimeoutRef.current = null;
            }
        };
    }, [isOpen]);

    // Restore focus when modal closes
    const handleClose = useCallback(() => {
        if (isLeaving) return; // Don't close while leaving
        onClose();
        setTimeout(() => {
            (previousActiveElement.current as HTMLElement)?.focus?.();
        }, 0);
    }, [onClose, isLeaving]);

    // TD-7d-2: Shared dialog hooks for accessibility
    useEscapeKey(handleClose, isOpen, isLeaving);
    useFocusTrap(modalRef, isOpen);
    useBodyScrollLock(isOpen);

    // Handle confirm
    const handleConfirm = useCallback(async () => {
        setIsLeaving(true);
        try {
            await onConfirm(selectedMode);
        } finally {
            setIsLeaving(false);
        }
    }, [onConfirm, selectedMode]);

    if (!isOpen) return null;

    // Translations
    const texts = {
        title: t('leaveGroupTitle') || (lang === 'es' ? '¿Dejar el grupo?' : 'Leave group?'),
        subtitle: t('leaveGroupSubtitle') || (lang === 'es'
            ? 'Elige qué hacer con tus transacciones'
            : 'Choose what happens to your transactions'),
        softTitle: t('leaveGroupSoftTitle') || (lang === 'es' ? 'Mantener compartidas' : 'Keep transactions shared'),
        softDesc: t('leaveGroupSoftDesc') || (lang === 'es'
            ? 'Otros aún pueden ver tus transacciones pasadas'
            : 'Others can still see your past transactions'),
        hardTitle: t('leaveGroupHardTitle') || (lang === 'es' ? 'Remover mis transacciones' : 'Remove my transactions'),
        hardDesc: t('leaveGroupHardDesc') || (lang === 'es'
            ? 'Tus transacciones se vuelven privadas'
            : 'Your transactions become private again'),
        cancel: t('cancel') || (lang === 'es' ? 'Cancelar' : 'Cancel'),
        confirm: t('leaveGroupConfirm') || (lang === 'es' ? 'Dejar grupo' : 'Leave Group'),
        leaving: t('leaving') || (lang === 'es' ? 'Saliendo...' : 'Leaving...'),
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: Z_INDEX.MODAL }}
            role="presentation"
            data-testid="leave-group-dialog-backdrop"
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
                aria-labelledby="leave-group-modal-title"
                aria-describedby="leave-group-modal-description"
                className="relative z-10 w-full max-w-sm mx-4 rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="leave-group-dialog"
            >
                {/* Close button */}
                <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    disabled={isLeaving}
                    className="absolute right-4 top-4 p-2 rounded-full transition-colors disabled:opacity-50"
                    style={{
                        color: 'var(--secondary)',
                        backgroundColor: 'var(--bg-tertiary)',
                    }}
                    aria-label={t('close') || 'Close'}
                    data-testid="leave-group-close-btn"
                >
                    <X size={20} aria-hidden="true" />
                </button>

                {/* Content */}
                <div className="p-6 text-center">
                    {/* Group Icon */}
                    <div
                        className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: groupColor }}
                        aria-hidden="true"
                    >
                        {groupIcon || <LogOut className="text-white" size={28} />}
                    </div>

                    {/* Title */}
                    <h2
                        id="leave-group-modal-title"
                        className="text-xl font-bold mb-1"
                        style={{ color: 'var(--primary)' }}
                    >
                        {texts.title}
                    </h2>

                    {/* Group name */}
                    <p
                        className="text-sm mb-2 font-medium"
                        style={{ color: groupColor }}
                    >
                        {groupName}
                    </p>

                    {/* Description */}
                    <p
                        id="leave-group-modal-description"
                        className="text-sm mb-6"
                        style={{ color: 'var(--secondary)' }}
                    >
                        {texts.subtitle}
                    </p>

                    {/* Options */}
                    <div className="space-y-3 mb-6">
                        {/* Soft leave option */}
                        <button
                            onClick={() => setSelectedMode('soft')}
                            disabled={isLeaving}
                            className={`w-full p-4 rounded-xl text-left transition-all ${
                                selectedMode === 'soft' ? 'ring-2 ring-offset-2' : ''
                            }`}
                            style={{
                                backgroundColor: selectedMode === 'soft'
                                    ? 'var(--success-bg, rgba(16, 185, 129, 0.1))'
                                    : 'var(--bg-tertiary)',
                                borderColor: selectedMode === 'soft' ? 'var(--success, #10b981)' : 'transparent',
                                // ringColor handled by Tailwind ring-* classes
                            }}
                            data-testid="leave-group-soft-option"
                        >
                            <div className="flex items-start gap-3">
                                <FileText
                                    size={24}
                                    aria-hidden="true"
                                    style={{ color: selectedMode === 'soft' ? 'var(--success, #10b981)' : 'var(--secondary)' }}
                                />
                                <div>
                                    <div
                                        className="font-medium"
                                        style={{ color: 'var(--primary)' }}
                                    >
                                        {texts.softTitle}
                                    </div>
                                    <div
                                        className="text-sm mt-0.5"
                                        style={{ color: 'var(--secondary)' }}
                                    >
                                        {texts.softDesc}
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Hard leave option */}
                        <button
                            onClick={() => setSelectedMode('hard')}
                            disabled={isLeaving}
                            className={`w-full p-4 rounded-xl text-left transition-all ${
                                selectedMode === 'hard' ? 'ring-2 ring-offset-2' : ''
                            }`}
                            style={{
                                backgroundColor: selectedMode === 'hard'
                                    ? 'var(--error-bg, rgba(239, 68, 68, 0.1))'
                                    : 'var(--bg-tertiary)',
                                borderColor: selectedMode === 'hard' ? 'var(--error, #ef4444)' : 'transparent',
                                // ringColor handled by Tailwind ring-* classes
                            }}
                            data-testid="leave-group-hard-option"
                        >
                            <div className="flex items-start gap-3">
                                <ShieldOff
                                    size={24}
                                    aria-hidden="true"
                                    style={{ color: selectedMode === 'hard' ? 'var(--error, #ef4444)' : 'var(--secondary)' }}
                                />
                                <div>
                                    <div
                                        className="font-medium"
                                        style={{ color: 'var(--primary)' }}
                                    >
                                        {texts.hardTitle}
                                    </div>
                                    <div
                                        className="text-sm mt-0.5"
                                        style={{ color: 'var(--secondary)' }}
                                    >
                                        {texts.hardDesc}
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                        {/* Leave button */}
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isLeaving}
                            className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: selectedMode === 'hard' ? 'var(--error, #ef4444)' : 'var(--warning, #f59e0b)',
                            }}
                            data-testid="leave-group-confirm-btn"
                        >
                            {isLeaving ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    {texts.leaving}
                                </>
                            ) : (
                                <>
                                    <LogOut size={18} />
                                    {texts.confirm}
                                </>
                            )}
                        </button>

                        {/* Cancel button */}
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLeaving}
                            className="w-full py-3 px-4 rounded-xl border font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{
                                borderColor: 'var(--border-light)',
                                color: 'var(--text-primary)',
                                backgroundColor: 'var(--bg-secondary)',
                            }}
                            data-testid="leave-group-cancel-btn"
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

export default LeaveGroupDialog;
