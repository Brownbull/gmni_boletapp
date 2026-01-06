/**
 * DeleteGroupModal Component
 *
 * Story 14.15b: Transaction Selection Mode & Groups
 * Epic 14: Core Implementation
 *
 * Modal for confirming group deletion.
 * Only deletes the group label, not the associated transactions.
 *
 * @see docs/uxui/mockups/01_views/transaction-list.html
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import type { TransactionGroup } from '../../types/transactionGroup';
import { extractGroupEmoji, extractGroupLabel } from '../../types/transactionGroup';

// ============================================================================
// Types
// ============================================================================

export interface DeleteGroupModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** The group being deleted */
    group: TransactionGroup | null;
    /** Whether deletion is in progress */
    isDeleting?: boolean;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Callback when deletion is confirmed */
    onConfirm: () => void;
    /** Translation function */
    t: (key: string) => string;
    /** Language for text */
    lang?: 'en' | 'es';
}

// ============================================================================
// Component
// ============================================================================

export const DeleteGroupModal: React.FC<DeleteGroupModalProps> = ({
    isOpen,
    group,
    isDeleting = false,
    onClose,
    onConfirm,
    t,
    lang = 'es',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElement = useRef<Element | null>(null);

    // Focus management when modal opens
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement;
            setTimeout(() => {
                cancelButtonRef.current?.focus();
            }, 0);
        }
    }, [isOpen]);

    // Restore focus when modal closes
    const handleClose = useCallback(() => {
        if (isDeleting) return;
        onClose();
        setTimeout(() => {
            (previousActiveElement.current as HTMLElement)?.focus?.();
        }, 0);
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

    // Focus trap
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const modalElement = modalRef.current;
        const focusableElements = modalElement.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

    // Prevent body scroll
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

    if (!isOpen || !group) return null;

    const emoji = extractGroupEmoji(group.name);
    const label = extractGroupLabel(group.name);

    // Use portal to render at document body level, bypassing parent overflow constraints
    return createPortal(
        <div
            className="fixed inset-0 z-[250]"
            onClick={handleClose}
            role="presentation"
            data-testid="delete-group-modal-overlay"
        >
            {/* Backdrop - covers full screen */}
            <div
                className="fixed inset-0 bg-black/40"
                aria-hidden="true"
            />

            {/* Centering container - uses fixed positioning for true center */}
            <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                {/* Modal Card */}
                <div
                    ref={modalRef}
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="delete-group-title"
                    aria-describedby="delete-group-description"
                    className="relative w-full max-w-[343px] rounded-xl shadow-xl pointer-events-auto"
                    style={{ backgroundColor: 'var(--bg)' }}
                    onClick={(e) => e.stopPropagation()}
                    data-testid="delete-group-modal"
                >
                {/* Header */}
                <div className="flex justify-between items-center p-3 pb-0">
                    <div className="flex items-center gap-2">
                        {/* Warning icon */}
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        >
                            <AlertTriangle size={20} strokeWidth={2} style={{ color: '#ef4444' }} />
                        </div>
                        {/* Title */}
                        <div
                            id="delete-group-title"
                            className="text-sm font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {lang === 'es' ? 'Eliminar Grupo' : 'Delete Group'}
                        </div>
                    </div>
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="p-1 rounded-full hover:bg-opacity-10 transition-colors disabled:opacity-40"
                        aria-label={t('close') || 'Close'}
                        data-testid="delete-group-close"
                    >
                        <X size={18} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-3 pt-4">
                    {/* Group preview */}
                    <div
                        className="flex items-center gap-3 p-3 rounded-lg mb-3"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-light)',
                        }}
                    >
                        {/* Group icon with color */}
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: group.color || '#10b981' }}
                        >
                            {emoji || '📁'}
                        </div>
                        {/* Group info */}
                        <div className="flex-1 min-w-0">
                            <div
                                className="text-sm font-medium truncate"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {label || group.name}
                            </div>
                            <div
                                className="text-[11px]"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {group.transactionCount} {lang === 'es' ? 'transacciones' : 'transactions'}
                            </div>
                        </div>
                    </div>

                    {/* Warning message */}
                    <p
                        id="delete-group-description"
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {lang === 'es'
                            ? 'Las transacciones asociadas no serán eliminadas, solo se quitará la etiqueta del grupo.'
                            : 'Associated transactions will not be deleted, only the group label will be removed.'
                        }
                    </p>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-3 pt-2">
                    {/* Cancel button */}
                    <button
                        ref={cancelButtonRef}
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-40"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-light)',
                            color: 'var(--text-primary)',
                        }}
                        data-testid="delete-group-cancel"
                    >
                        <X size={14} strokeWidth={2} />
                        <span>{lang === 'es' ? 'Cancelar' : 'Cancel'}</span>
                    </button>

                    {/* Delete button */}
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-40"
                        style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                        }}
                        data-testid="delete-group-confirm"
                    >
                        <Trash2 size={14} strokeWidth={2} />
                        <span>
                            {isDeleting
                                ? (lang === 'es' ? 'Eliminando...' : 'Deleting...')
                                : (lang === 'es' ? 'Eliminar' : 'Delete')
                            }
                        </span>
                    </button>
                </div>
            </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteGroupModal;
