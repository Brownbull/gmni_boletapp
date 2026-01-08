/**
 * MerchantMappingsList Component
 *
 * Displays user's learned merchant mappings with edit and delete functionality.
 * Updated to match mockup design with simple list items showing name, category tag, count.
 *
 * @module MerchantMappingsList
 * @see Story 9.7: Merchant Mappings Management UI
 * @see Story 14.22: Settings View Redesign - Updated styling
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Edit2, Store, X, Check } from 'lucide-react';
import { MerchantMapping } from '../types/merchantMapping';

/**
 * Props for the MerchantMappingsList component
 */
export interface MerchantMappingsListProps {
    /** List of merchant mappings to display */
    mappings: MerchantMapping[];
    /** Loading state */
    loading: boolean;
    /** Callback to delete a mapping */
    onDeleteMapping: (mappingId: string) => Promise<void>;
    /** Callback to edit a mapping's target merchant */
    onEditMapping: (mappingId: string, newTarget: string) => Promise<void>;
    /** Translation function */
    t: (key: string) => string;
    /** Current theme for styling */
    theme?: 'light' | 'dark';
}

/**
 * Delete confirmation modal component
 */
interface DeleteModalProps {
    isOpen: boolean;
    itemName: string;
    onConfirm: () => void;
    onCancel: () => void;
    t: (key: string) => string;
    theme?: 'light' | 'dark';
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({
    isOpen,
    itemName,
    onConfirm,
    onCancel,
    t,
    theme = 'light',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElement = useRef<Element | null>(null);
    const isDark = theme === 'dark';

    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement;
            setTimeout(() => {
                confirmButtonRef.current?.focus();
            }, 0);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        onCancel();
        setTimeout(() => {
            (previousActiveElement.current as HTMLElement)?.focus?.();
        }, 0);
    }, [onCancel]);

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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
            role="presentation"
        >
            <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
            <div
                ref={modalRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-merchant-modal-title"
                className="relative w-full max-w-sm rounded-2xl shadow-xl"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 p-1 rounded-full transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label={t('close') || 'Close'}
                >
                    <X size={20} aria-hidden="true" />
                </button>

                <div className="p-6 text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                        <Trash2 size={32} className="text-white" aria-hidden="true" />
                    </div>
                    <h2 id="delete-merchant-modal-title" className="text-xl font-bold mb-2">
                        {t('deleteMerchantMappingConfirm')}
                    </h2>
                    <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                        "{itemName}"
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            ref={confirmButtonRef}
                            onClick={onConfirm}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-md"
                        >
                            {t('confirm')}
                        </button>
                        <button
                            onClick={handleClose}
                            className="w-full py-3 px-4 rounded-xl font-medium transition-colors"
                            style={{
                                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                color: 'var(--text-primary)',
                            }}
                        >
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Edit modal for changing the target merchant name
 */
interface EditModalProps {
    isOpen: boolean;
    mapping: MerchantMapping | null;
    onSave: (newTarget: string) => void;
    onCancel: () => void;
    t: (key: string) => string;
    theme?: 'light' | 'dark';
}

const EditMerchantModal: React.FC<EditModalProps> = ({
    isOpen,
    mapping,
    onSave,
    onCancel,
    t,
    theme = 'light',
}) => {
    const [editValue, setEditValue] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const previousActiveElement = useRef<Element | null>(null);
    const isDark = theme === 'dark';

    useEffect(() => {
        if (isOpen && mapping) {
            setEditValue(mapping.targetMerchant);
            previousActiveElement.current = document.activeElement;
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 0);
        }
    }, [isOpen, mapping]);

    const handleClose = useCallback(() => {
        onCancel();
        setTimeout(() => {
            (previousActiveElement.current as HTMLElement)?.focus?.();
        }, 0);
    }, [onCancel]);

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

    const handleSave = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== mapping?.targetMerchant) {
            onSave(trimmed);
        } else {
            handleClose();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
    };

    if (!isOpen || !mapping) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
            role="presentation"
        >
            <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-merchant-modal-title"
                className="relative w-full max-w-sm rounded-2xl shadow-xl"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 p-1 rounded-full transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label={t('close') || 'Close'}
                >
                    <X size={20} aria-hidden="true" />
                </button>

                <div className="p-6">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                        <Edit2 size={32} className="text-white" aria-hidden="true" />
                    </div>
                    <h2 id="edit-merchant-modal-title" className="text-xl font-bold mb-2 text-center">
                        {t('editMerchantTarget')}
                    </h2>
                    <p className="text-sm text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
                        {mapping.originalMerchant}
                    </p>
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full px-4 py-3 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-green-500"
                        style={{
                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                            color: 'var(--text-primary)',
                            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        }}
                        placeholder={t('displayName') || 'Display name'}
                        aria-label={t('editMerchantTarget')}
                    />
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleSave}
                            disabled={!editValue.trim()}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Check size={20} aria-hidden="true" />
                            {t('save')}
                        </button>
                        <button
                            onClick={handleClose}
                            className="w-full py-3 px-4 rounded-xl font-medium transition-colors"
                            style={{
                                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                color: 'var(--text-primary)',
                            }}
                        >
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * MerchantMappingsList displays all user's learned merchant mappings
 * with the ability to edit and delete individual mappings.
 * Updated to match mockup styling with simple item layout.
 */
export const MerchantMappingsList: React.FC<MerchantMappingsListProps> = ({
    mappings,
    loading,
    onDeleteMapping,
    onEditMapping,
    t,
    theme = 'light',
}) => {
    const [deleteTarget, setDeleteTarget] = useState<MerchantMapping | null>(null);
    const [editTarget, setEditTarget] = useState<MerchantMapping | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState(false);
    const isDark = theme === 'dark';

    const handleConfirmDelete = async () => {
        if (!deleteTarget?.id) return;
        setDeleting(true);
        try {
            await onDeleteMapping(deleteTarget.id);
        } catch (error) {
            console.error('Failed to delete merchant mapping:', error);
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const handleSaveEdit = async (newTarget: string) => {
        if (!editTarget?.id) return;
        setEditing(true);
        try {
            await onEditMapping(editTarget.id, newTarget);
        } catch (error) {
            console.error('Failed to edit merchant mapping:', error);
        } finally {
            setEditing(false);
            setEditTarget(null);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="animate-pulse space-y-2">
                <div className="h-12 rounded" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }}></div>
                <div className="h-12 rounded" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }}></div>
            </div>
        );
    }

    // Empty state
    if (mappings.length === 0) {
        return (
            <div className="py-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                <Store size={24} className="mx-auto mb-2 opacity-50" aria-hidden="true" />
                <p className="text-sm">{t('learnedMerchantsEmpty')}</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-0">
                {mappings.map((mapping, index) => (
                    <div
                        key={mapping.id || index}
                        className="flex items-center justify-between py-2.5"
                        style={{
                            borderBottom: index < mappings.length - 1 ? `1px solid ${isDark ? '#334155' : '#e2e8f0'}` : 'none',
                        }}
                    >
                        {/* Item info */}
                        <div className="flex-1 min-w-0">
                            {/* Target merchant name in quotes */}
                            <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                "{mapping.targetMerchant}"
                            </div>
                            {/* Meta: category tag + count */}
                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(254, 243, 199, 0.2)' : '#fef3c7',
                                        color: '#d97706',
                                    }}
                                >
                                    {mapping.originalMerchant.slice(0, 12)}...
                                </span>
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    {mapping.usageCount}x
                                </span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 ml-2">
                            <button
                                onClick={() => setEditTarget(mapping)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                style={{
                                    color: '#22c55e',
                                }}
                                aria-label={`${t('editMerchantMapping')} "${mapping.targetMerchant}"`}
                                disabled={editing}
                            >
                                <Edit2 size={16} aria-hidden="true" />
                            </button>
                            <button
                                onClick={() => setDeleteTarget(mapping)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                style={{
                                    color: '#ef4444',
                                }}
                                aria-label={`${t('deleteMapping')} "${mapping.targetMerchant}"`}
                                disabled={deleting}
                            >
                                <Trash2 size={16} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                itemName={deleteTarget ? `${deleteTarget.originalMerchant} → ${deleteTarget.targetMerchant}` : ''}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
                t={t}
                theme={theme}
            />

            <EditMerchantModal
                isOpen={!!editTarget}
                mapping={editTarget}
                onSave={handleSaveEdit}
                onCancel={() => setEditTarget(null)}
                t={t}
                theme={theme}
            />
        </>
    );
};
