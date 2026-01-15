/**
 * MakeShareableDialog Component
 *
 * Story 14c.1: Create Shared Group
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Two-stage dialog for making a custom group shareable:
 * Stage 1: Confirmation - explain what happens when making shareable
 * Stage 2: Share Code - show the generated share code after creation
 *
 * Features:
 * - Group preview (icon, name, color)
 * - Explanation of what "shareable" means
 * - Share code display after creation
 * - Copy and share functionality
 * - Accessible modal with focus trap
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Share2, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import type { TransactionGroup } from '../../types/transactionGroup';
import type { SharedGroup } from '../../types/sharedGroup';
import { extractGroupEmoji, extractGroupLabel } from '../../types/transactionGroup';
import ShareCodeDisplay from './ShareCodeDisplay';
import { getShareLink, isShareCodeExpired } from '../../services/sharedGroupService';

// ============================================================================
// Types
// ============================================================================

export interface MakeShareableDialogProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** The custom group to make shareable */
    group: TransactionGroup | null;
    /** Callback when dialog is closed */
    onClose: () => void;
    /** Callback to create the shared group */
    onMakeShareable: (group: TransactionGroup) => Promise<SharedGroup>;
    /** Translation function */
    t: (key: string) => string;
    /** Language */
    lang?: 'en' | 'es';
}

type Stage = 'confirm' | 'share';

// ============================================================================
// Component
// ============================================================================

export const MakeShareableDialog: React.FC<MakeShareableDialogProps> = ({
    isOpen,
    group,
    onClose,
    onMakeShareable,
    t,
    lang = 'es',
}) => {
    const [stage, setStage] = useState<Stage>('confirm');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdSharedGroup, setCreatedSharedGroup] = useState<SharedGroup | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<Element | null>(null);

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            setStage('confirm');
            setIsCreating(false);
            setError(null);
            setCreatedSharedGroup(null);
            previousActiveElement.current = document.activeElement;
        }
    }, [isOpen]);

    // Handle close with focus restoration
    const handleClose = useCallback(() => {
        onClose();
        setTimeout(() => {
            (previousActiveElement.current as HTMLElement)?.focus?.();
        }, 0);
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
    }, [isOpen, stage]);

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

    // Handle make shareable
    const handleMakeShareable = async () => {
        if (!group) return;

        setIsCreating(true);
        setError(null);

        try {
            const sharedGroup = await onMakeShareable(group);
            setCreatedSharedGroup(sharedGroup);
            setStage('share');
        } catch (err) {
            console.error('[MakeShareableDialog] Error:', err);
            setError(
                lang === 'es'
                    ? 'Error al crear el grupo compartido'
                    : 'Failed to create shared group'
            );
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen || !group) return null;

    const emoji = extractGroupEmoji(group.name);
    const label = extractGroupLabel(group.name);

    return createPortal(
        <div
            className="fixed inset-0 z-[200]"
            onClick={handleClose}
            role="presentation"
            data-testid="make-shareable-dialog-overlay"
        >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

            {/* Centering container */}
            <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                {/* Modal Card */}
                <div
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="make-shareable-title"
                    className="relative w-full max-w-[380px] rounded-xl shadow-xl pointer-events-auto"
                    style={{ backgroundColor: 'var(--bg)' }}
                    onClick={(e) => e.stopPropagation()}
                    data-testid="make-shareable-dialog"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 pb-0">
                        <div className="flex items-center gap-3">
                            {/* Group icon preview */}
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                                style={{
                                    backgroundColor: group.color || '#10b981',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                }}
                            >
                                {emoji || ''}
                            </div>
                            <div>
                                <div
                                    id="make-shareable-title"
                                    className="font-semibold"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {stage === 'confirm'
                                        ? (lang === 'es' ? 'Compartir Grupo' : 'Share Group')
                                        : (lang === 'es' ? 'Grupo Compartido!' : 'Group Shared!')
                                    }
                                </div>
                                <div
                                    className="text-sm"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {label}
                                </div>
                            </div>
                        </div>
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-full hover:bg-opacity-10 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            aria-label={t('close') || 'Close'}
                            data-testid="make-shareable-close"
                        >
                            <X size={20} strokeWidth={2} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                        {stage === 'confirm' ? (
                            <>
                                {/* Explanation */}
                                <div
                                    className="rounded-lg p-3 mb-4"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-light)',
                                    }}
                                >
                                    <div className="flex gap-3">
                                        <Share2
                                            size={20}
                                            className="flex-shrink-0 mt-0.5"
                                            style={{ color: 'var(--primary)' }}
                                        />
                                        <div>
                                            <p
                                                className="text-sm mb-2"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {lang === 'es'
                                                    ? 'Al compartir este grupo:'
                                                    : 'When you share this group:'
                                                }
                                            </p>
                                            <ul className="space-y-1.5">
                                                {[
                                                    lang === 'es'
                                                        ? 'Otras personas podrán ver tus transacciones del grupo'
                                                        : 'Others can see your group transactions',
                                                    lang === 'es'
                                                        ? 'Podrán agregar sus propias transacciones'
                                                        : 'They can add their own transactions',
                                                    lang === 'es'
                                                        ? 'Máximo 10 miembros por grupo'
                                                        : 'Maximum 10 members per group',
                                                ].map((text, i) => (
                                                    <li
                                                        key={i}
                                                        className="flex items-start gap-2 text-sm"
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    >
                                                        <Check
                                                            size={14}
                                                            className="flex-shrink-0 mt-0.5"
                                                            style={{ color: '#10b981' }}
                                                        />
                                                        {text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Privacy note */}
                                <div
                                    className="rounded-lg p-3 mb-4"
                                    style={{
                                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                        border: '1px solid rgba(245, 158, 11, 0.2)',
                                    }}
                                >
                                    <div className="flex gap-3">
                                        <AlertTriangle
                                            size={18}
                                            className="flex-shrink-0 mt-0.5"
                                            style={{ color: '#f59e0b' }}
                                        />
                                        <p
                                            className="text-sm"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            {lang === 'es'
                                                ? 'Solo comparte con personas de confianza. Las transacciones que agregues al grupo serán visibles para todos los miembros.'
                                                : 'Only share with trusted people. Transactions you add to the group will be visible to all members.'
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Error message */}
                                {error && (
                                    <div
                                        className="rounded-lg p-3 mb-4"
                                        style={{
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                        }}
                                    >
                                        <p
                                            className="text-sm"
                                            style={{ color: 'var(--error)' }}
                                        >
                                            {error}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Share Code Stage */
                            createdSharedGroup && (
                                <ShareCodeDisplay
                                    shareCode={createdSharedGroup.shareCode}
                                    shareLink={getShareLink(createdSharedGroup.shareCode)}
                                    expiresAt={createdSharedGroup.shareCodeExpiresAt?.toDate() || null}
                                    groupName={createdSharedGroup.name}
                                    isExpired={isShareCodeExpired(createdSharedGroup.shareCodeExpiresAt)}
                                    t={t}
                                    lang={lang}
                                />
                            )
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex gap-2 p-4 pt-0">
                        {stage === 'confirm' ? (
                            <>
                                {/* Cancel button */}
                                <button
                                    onClick={handleClose}
                                    disabled={isCreating}
                                    className="flex-1 py-2.5 px-3 text-sm font-medium rounded-lg transition-colors"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-light)',
                                        color: 'var(--text-primary)',
                                    }}
                                    data-testid="make-shareable-cancel"
                                >
                                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                                </button>

                                {/* Confirm button */}
                                <button
                                    onClick={handleMakeShareable}
                                    disabled={isCreating}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold rounded-lg transition-colors"
                                    style={{
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                        opacity: isCreating ? 0.6 : 1,
                                    }}
                                    data-testid="make-shareable-confirm"
                                >
                                    <Users size={16} />
                                    <span>
                                        {isCreating
                                            ? (lang === 'es' ? 'Creando...' : 'Creating...')
                                            : (lang === 'es' ? 'Compartir' : 'Share')
                                        }
                                    </span>
                                    {!isCreating && <ArrowRight size={14} />}
                                </button>
                            </>
                        ) : (
                            /* Done button */
                            <button
                                onClick={handleClose}
                                className="w-full py-2.5 px-3 text-sm font-semibold rounded-lg transition-colors"
                                style={{
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                }}
                                data-testid="make-shareable-done"
                            >
                                {lang === 'es' ? 'Listo' : 'Done'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MakeShareableDialog;
