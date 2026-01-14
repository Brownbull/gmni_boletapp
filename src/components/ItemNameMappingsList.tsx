/**
 * ItemNameMappingsList Component
 *
 * Displays user's learned item name mappings (per-store) with edit and delete functionality.
 * Groups mappings by merchant for better organization.
 *
 * @module ItemNameMappingsList
 * @see Phase 5: Item Name Mappings Settings UI
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Trash2, Edit2, Package, X, Check, Store } from 'lucide-react';
import { ItemNameMapping } from '../types/itemNameMapping';

/**
 * Props for the ItemNameMappingsList component
 */
export interface ItemNameMappingsListProps {
    /** List of item name mappings to display */
    mappings: ItemNameMapping[];
    /** Loading state */
    loading: boolean;
    /** Callback to delete a mapping */
    onDeleteMapping: (mappingId: string) => Promise<void>;
    /** Callback to edit a mapping's target item name */
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
    merchantName: string;
    onConfirm: () => void;
    onCancel: () => void;
    t: (key: string) => string;
    theme?: 'light' | 'dark';
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({
    isOpen,
    itemName,
    merchantName,
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
                aria-labelledby="delete-item-name-modal-title"
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
                    <h2 id="delete-item-name-modal-title" className="text-xl font-bold mb-2">
                        {t('deleteItemNameMappingConfirm')}
                    </h2>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
                        {merchantName}
                    </p>
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
 * Edit modal for changing the target item name
 */
interface EditModalProps {
    isOpen: boolean;
    mapping: ItemNameMapping | null;
    onSave: (newTarget: string) => void;
    onCancel: () => void;
    t: (key: string) => string;
    theme?: 'light' | 'dark';
}

const EditItemNameModal: React.FC<EditModalProps> = ({
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
            setEditValue(mapping.targetItemName);
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
        if (trimmed && trimmed !== mapping?.targetItemName) {
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

    // Format merchant name for display (capitalize first letter of each word)
    const formatMerchantName = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

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
                aria-labelledby="edit-item-name-modal-title"
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
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <Edit2 size={32} className="text-white" aria-hidden="true" />
                    </div>
                    <h2 id="edit-item-name-modal-title" className="text-xl font-bold mb-2 text-center">
                        {t('editItemNameTarget')}
                    </h2>
                    {/* Show merchant context */}
                    <p className="text-sm text-center mb-1" style={{ color: 'var(--text-tertiary)' }}>
                        {t('at') || 'At'} {formatMerchantName(mapping.normalizedMerchant)}:
                    </p>
                    <p className="text-sm text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
                        {mapping.originalItemName}
                    </p>
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full px-4 py-3 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                            color: 'var(--text-primary)',
                            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        }}
                        placeholder={t('itemName') || 'Item name'}
                        aria-label={t('editItemNameTarget')}
                    />
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleSave}
                            disabled={!editValue.trim()}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
 * Group mappings by normalized merchant name
 */
interface MerchantGroup {
    merchantName: string;
    mappings: ItemNameMapping[];
}

/**
 * ItemNameMappingsList displays all user's learned item name mappings
 * grouped by merchant, with the ability to edit and delete individual mappings.
 */
export const ItemNameMappingsList: React.FC<ItemNameMappingsListProps> = ({
    mappings,
    loading,
    onDeleteMapping,
    onEditMapping,
    t,
    theme = 'light',
}) => {
    const [deleteTarget, setDeleteTarget] = useState<ItemNameMapping | null>(null);
    const [editTarget, setEditTarget] = useState<ItemNameMapping | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState(false);
    const isDark = theme === 'dark';

    // Group mappings by merchant
    const groupedMappings = useMemo((): MerchantGroup[] => {
        const groups: Record<string, ItemNameMapping[]> = {};

        for (const mapping of mappings) {
            const key = mapping.normalizedMerchant;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(mapping);
        }

        // Sort groups by merchant name, and sort items within each group by usage count (descending)
        return Object.entries(groups)
            .map(([merchantName, items]) => ({
                merchantName,
                mappings: items.sort((a, b) => b.usageCount - a.usageCount),
            }))
            .sort((a, b) => a.merchantName.localeCompare(b.merchantName));
    }, [mappings]);

    const handleConfirmDelete = async () => {
        if (!deleteTarget?.id) return;
        setDeleting(true);
        try {
            await onDeleteMapping(deleteTarget.id);
        } catch (error) {
            console.error('Failed to delete item name mapping:', error);
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
            console.error('Failed to edit item name mapping:', error);
        } finally {
            setEditing(false);
            setEditTarget(null);
        }
    };

    // Format merchant name for display
    const formatMerchantName = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
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
                <Package size={24} className="mx-auto mb-2 opacity-50" aria-hidden="true" />
                <p className="text-sm">{t('learnedItemNamesEmpty')}</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {groupedMappings.map((group) => (
                    <div key={group.merchantName}>
                        {/* Merchant header */}
                        <div
                            className="flex items-center gap-2 mb-2 px-1"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            <Store size={14} aria-hidden="true" />
                            <span className="text-xs font-medium uppercase tracking-wider">
                                {formatMerchantName(group.merchantName)}
                            </span>
                            <span className="text-xs">
                                ({group.mappings.length})
                            </span>
                        </div>

                        {/* Items for this merchant */}
                        <div className="space-y-0">
                            {group.mappings.map((mapping, index) => (
                                <div
                                    key={mapping.id || index}
                                    className="flex items-center justify-between py-2.5"
                                    style={{
                                        borderBottom: index < group.mappings.length - 1 ? `1px solid ${isDark ? '#334155' : '#e2e8f0'}` : 'none',
                                    }}
                                >
                                    {/* Item info */}
                                    <div className="flex-1 min-w-0">
                                        {/* Target item name in quotes */}
                                        <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                            "{mapping.targetItemName}"
                                        </div>
                                        {/* Meta: original item tag + count */}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span
                                                className="text-xs font-medium px-2 py-0.5 rounded-full truncate max-w-[150px]"
                                                style={{
                                                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
                                                    color: '#3b82f6',
                                                }}
                                                title={mapping.originalItemName}
                                            >
                                                {mapping.originalItemName.length > 15
                                                    ? `${mapping.originalItemName.slice(0, 15)}...`
                                                    : mapping.originalItemName}
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
                                                color: '#3b82f6',
                                            }}
                                            aria-label={`${t('editItemNameMapping') || 'Edit'} "${mapping.targetItemName}"`}
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
                                            aria-label={`${t('deleteMapping')} "${mapping.targetItemName}"`}
                                            disabled={deleting}
                                        >
                                            <Trash2 size={16} aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                itemName={deleteTarget ? `${deleteTarget.originalItemName} -> ${deleteTarget.targetItemName}` : ''}
                merchantName={deleteTarget ? formatMerchantName(deleteTarget.normalizedMerchant) : ''}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
                t={t}
                theme={theme}
            />

            <EditItemNameModal
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
