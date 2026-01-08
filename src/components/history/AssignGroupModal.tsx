/**
 * AssignGroupModal Component
 *
 * Story 14.15: Transaction Selection Mode & Groups
 * Epic 14: Core Implementation
 *
 * Modal for assigning selected transactions to a group.
 * Features:
 * - Dropdown to select existing group
 * - Button to create new group (opens CreateGroupModal)
 * - Assign button to confirm assignment
 * - Cancel button to close
 *
 * @see docs/uxui/mockups/01_views/transaction-list.html - State 4
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag, Plus, Check, Trash2, Package } from 'lucide-react';
import type { TransactionGroup } from '../../types/transactionGroup';
import { extractGroupEmoji, extractGroupLabel } from '../../types/transactionGroup';

// ============================================================================
// Types
// ============================================================================

export interface AssignGroupModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Number of selected transactions */
    selectedCount: number;
    /** Available groups to assign to */
    groups: TransactionGroup[];
    /** Whether groups are loading */
    groupsLoading?: boolean;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Callback when group is assigned */
    onAssign: (groupId: string, groupName: string) => void;
    /** Callback when "Create new group" is clicked */
    onCreateNew: () => void;
    /** Callback when "Edit group" is clicked */
    onEditGroup?: (group: TransactionGroup) => void;
    /** Callback when "Delete group" is clicked */
    onDeleteGroup?: (group: TransactionGroup) => void;
    /** Translation function */
    t: (key: string) => string;
    /** Language for pluralization */
    lang?: 'en' | 'es';
}

// ============================================================================
// Component
// ============================================================================

export const AssignGroupModal: React.FC<AssignGroupModalProps> = ({
    isOpen,
    selectedCount,
    groups,
    groupsLoading = false,
    onClose,
    onAssign,
    onCreateNew,
    onEditGroup: _onEditGroup,
    onDeleteGroup,
    t,
    lang = 'es',
}) => {
    // Suppress unused variable warning - reserved for future edit functionality
    void _onEditGroup;
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElement = useRef<Element | null>(null);

    // Reset selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedGroupId('');
            previousActiveElement.current = document.activeElement;
            // Focus close button after render
            setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 0);
        }
    }, [isOpen]);

    // Restore focus when modal closes
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

    if (!isOpen) return null;

    // Get transaction count text
    const getCountText = () => {
        if (lang === 'es') {
            return selectedCount === 1
                ? '1 transaccion'
                : `${selectedCount} transacciones`;
        }
        return selectedCount === 1
            ? '1 transaction'
            : `${selectedCount} transactions`;
    };

    // Handle assign
    const handleAssign = () => {
        if (!selectedGroupId) return;
        const group = groups.find((g) => g.id === selectedGroupId);
        if (group && group.id) {
            onAssign(group.id, group.name);
        }
    };

    // Use portal to render at document body level, bypassing parent overflow constraints
    return createPortal(
        <div
            className="fixed inset-0 z-[200]"
            onClick={handleClose}
            role="presentation"
            data-testid="assign-group-modal-overlay"
        >
            {/* Backdrop - full screen overlay */}
            <div
                className="fixed inset-0 bg-black/40"
                aria-hidden="true"
            />

            {/* Centering container - uses fixed positioning for true center */}
            <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                {/* Modal Card */}
                <div
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="assign-group-title"
                    className="relative w-full max-w-[343px] rounded-xl shadow-xl pointer-events-auto"
                    style={{ backgroundColor: 'var(--bg)' }}
                    onClick={(e) => e.stopPropagation()}
                    data-testid="assign-group-modal"
                >
                {/* Header */}
                <div className="flex justify-between items-center p-3 pb-0">
                    <div className="flex items-center gap-2">
                        {/* Icon */}
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                            <Tag size={16} strokeWidth={2} style={{ color: 'var(--primary)' }} />
                        </div>
                        {/* Title + Subtitle */}
                        <div>
                            <div
                                id="assign-group-title"
                                className="text-sm font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {lang === 'es' ? 'Asignar Grupo' : 'Assign Group'}
                            </div>
                            <div
                                className="text-[11px]"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {getCountText()}
                            </div>
                        </div>
                    </div>
                    {/* Close button */}
                    <button
                        ref={closeButtonRef}
                        onClick={handleClose}
                        className="p-1 rounded-full hover:bg-opacity-10 transition-colors"
                        aria-label={t('close') || 'Close'}
                        data-testid="assign-group-close"
                    >
                        <X size={18} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-3 pt-4">
                    {/* Group list */}
                    <div
                        className="max-h-[240px] overflow-y-auto rounded-lg border"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-light)',
                        }}
                    >
                        {groupsLoading ? (
                            <div
                                className="p-4 text-center text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {lang === 'es' ? 'Cargando...' : 'Loading...'}
                            </div>
                        ) : groups.length === 0 ? (
                            <div
                                className="p-4 text-center text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {lang === 'es' ? 'No hay grupos' : 'No groups'}
                            </div>
                        ) : (
                            groups.map((group) => {
                                const emoji = extractGroupEmoji(group.name);
                                const label = extractGroupLabel(group.name);
                                const isSelected = selectedGroupId === group.id;

                                return (
                                    <div
                                        key={group.id}
                                        className={`flex items-center gap-2 p-2 cursor-pointer transition-colors ${
                                            isSelected ? '' : 'hover:bg-opacity-50'
                                        }`}
                                        style={{
                                            backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                                            borderBottom: '1px solid var(--border-light)',
                                        }}
                                        onClick={() => setSelectedGroupId(group.id || '')}
                                        data-testid={`group-item-${group.id}`}
                                    >
                                        {/* Group icon with color */}
                                        <div
                                            className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                                            style={{ backgroundColor: group.color || '#10b981' }}
                                        >
                                            {emoji || '📁'}
                                        </div>

                                        {/* Group name */}
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className="text-sm font-medium truncate"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {label || group.name}
                                            </div>
                                        </div>

                                        {/* Transaction count pill OR delete button for empty groups */}
                                        {group.transactionCount > 0 ? (
                                            <div
                                                className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
                                                style={{
                                                    backgroundColor: 'var(--bg-tertiary)',
                                                    border: '1px solid var(--border-light)',
                                                }}
                                            >
                                                <Package size={12} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
                                                <span
                                                    className="text-xs font-medium"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    {group.transactionCount}
                                                </span>
                                            </div>
                                        ) : onDeleteGroup ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteGroup(group);
                                                }}
                                                className="w-8 h-8 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    color: 'var(--error, #ef4444)',
                                                }}
                                                aria-label={lang === 'es' ? 'Eliminar grupo' : 'Delete group'}
                                                data-testid={`delete-group-${group.id}`}
                                            >
                                                <Trash2 size={16} strokeWidth={2} />
                                            </button>
                                        ) : null}

                                        {/* Selection indicator */}
                                        {isSelected && (
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: 'var(--primary)' }}
                                            >
                                                <Check size={14} strokeWidth={3} style={{ color: 'white' }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Add new group button */}
                    <button
                        onClick={onCreateNew}
                        className="w-full mt-3 h-11 flex items-center justify-center gap-2 rounded-lg transition-colors"
                        style={{
                            border: '1px dashed var(--border-medium)',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--primary)',
                        }}
                        aria-label={lang === 'es' ? 'Crear nuevo grupo' : 'Create new group'}
                        data-testid="create-group-button"
                    >
                        <Plus size={18} strokeWidth={2} />
                        <span className="text-sm font-medium">
                            {lang === 'es' ? 'Nuevo grupo' : 'New group'}
                        </span>
                    </button>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-3 pt-2">
                    {/* Cancel button */}
                    <button
                        onClick={handleClose}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-[13px] font-medium rounded-lg transition-colors"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-light)',
                            color: 'var(--text-primary)',
                        }}
                        data-testid="assign-group-cancel"
                    >
                        <X size={14} strokeWidth={2} />
                        <span>{lang === 'es' ? 'Cancelar' : 'Cancel'}</span>
                    </button>

                    {/* Assign button */}
                    <button
                        onClick={handleAssign}
                        disabled={!selectedGroupId}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-40"
                        style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                        }}
                        data-testid="assign-group-confirm"
                    >
                        <Check size={14} strokeWidth={2} />
                        <span>{lang === 'es' ? 'Asignar' : 'Assign'}</span>
                    </button>
                </div>
            </div>
            </div>
        </div>,
        document.body
    );
};

export default AssignGroupModal;
