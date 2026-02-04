/**
 * EditGroupDialog Component
 *
 * Story 14d-v2-1-7g: Edit Group Settings
 * Epic 14d-v2: Shared Groups v2
 *
 * Modal dialog for editing a shared group's settings (name, icon, color).
 * Features:
 * - Pre-filled with current group values
 * - Name validation (2-50 chars) with sanitization
 * - Icon picker (EmojiPicker component)
 * - Color picker (ColorPicker component)
 * - Loading state during update
 * - Discard confirmation when closing with unsaved changes
 * - Accessible (keyboard navigation, ARIA)
 *
 * @example
 * ```tsx
 * <EditGroupDialog
 *   open={isOpen}
 *   group={selectedGroup}
 *   onClose={() => setIsOpen(false)}
 *   onSave={(updates) => updateGroup(updates)}
 *   isPending={isPending}
 *   t={t}
 * />
 * ```
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Loader2, Edit3, Save } from 'lucide-react';
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from '@/shared/hooks';
import { Z_INDEX } from '@/constants';
import { EmojiPicker } from './EmojiPicker';
import { ColorPicker } from './ColorPicker';
import type { SharedGroup } from '@/types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

export interface EditGroupDialogInput {
    /** Updated group name */
    name: string;
    /** Updated group icon */
    icon: string;
    /** Updated group color */
    color: string;
}

export interface EditGroupDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** The group being edited */
    group: SharedGroup | null;
    /** Callback when dialog should close */
    onClose: () => void;
    /** Callback when user saves changes */
    onSave: (input: EditGroupDialogInput) => void;
    /** Whether update is in progress */
    isPending: boolean;
    /** Translation function */
    t: (key: string) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

// =============================================================================
// Constants
// =============================================================================

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 50;
const DEFAULT_ICON = '👥';
const DEFAULT_COLOR = '#10b981';

// =============================================================================
// Component
// =============================================================================

export const EditGroupDialog: React.FC<EditGroupDialogProps> = ({
    open,
    group,
    onClose,
    onSave,
    isPending,
    t,
    lang = 'es',
}) => {
    // State
    const [name, setName] = useState('');
    const [icon, setIcon] = useState(DEFAULT_ICON);
    const [color, setColor] = useState(DEFAULT_COLOR);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    // Refs
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Initialize state when dialog opens or group changes
    useEffect(() => {
        if (open && group) {
            setName(group.name || '');
            setIcon(group.icon || DEFAULT_ICON);
            setColor(group.color || DEFAULT_COLOR);
            setShowDiscardConfirm(false);
            // Focus close button after render
            setTimeout(() => closeButtonRef.current?.focus(), 0);
        }
    }, [open, group?.id, group?.name, group?.icon, group?.color]);

    // Track if user has made changes
    const hasChanges = useMemo(() => {
        if (!group) return false;
        return (
            name.trim() !== (group.name || '') ||
            icon !== (group.icon || DEFAULT_ICON) ||
            color !== (group.color || DEFAULT_COLOR)
        );
    }, [name, icon, color, group]);

    // Name validation
    const nameError = useMemo(() => {
        const trimmed = name.trim();
        if (name.length > 0 && trimmed.length < MIN_NAME_LENGTH) {
            return t('nameMinLength') || (lang === 'es'
                ? 'El nombre debe tener al menos 2 caracteres'
                : 'Name must be at least 2 characters');
        }
        if (trimmed.length > MAX_NAME_LENGTH) {
            return t('nameMaxLength') || (lang === 'es'
                ? 'El nombre debe tener 50 caracteres o menos'
                : 'Name must be 50 characters or less');
        }
        return null;
    }, [name, t, lang]);

    const isValid = useMemo(() => {
        const trimmed = name.trim();
        return trimmed.length >= MIN_NAME_LENGTH && trimmed.length <= MAX_NAME_LENGTH;
    }, [name]);

    // Combined validation: valid name AND has changes
    const canSave = isValid && hasChanges;

    // Handle close (blocked during loading, shows discard confirm if changes)
    const handleClose = useCallback(() => {
        if (isPending) return;
        if (hasChanges) {
            setShowDiscardConfirm(true);
            return;
        }
        onClose();
    }, [onClose, isPending, hasChanges]);

    // Handle discard confirmation
    const handleConfirmDiscard = useCallback(() => {
        setShowDiscardConfirm(false);
        onClose();
    }, [onClose]);

    // Handle keep editing (cancel discard)
    const handleKeepEditing = useCallback(() => {
        setShowDiscardConfirm(false);
    }, []);

    // TD-7d-2: Shared dialog hooks for accessibility
    useEscapeKey(handleClose, open, isPending);
    useFocusTrap(modalRef, open);
    useBodyScrollLock(open);

    // Handle save
    const handleSave = useCallback(() => {
        if (!canSave || isPending) return;
        onSave({
            name: name.trim(),
            icon,
            color,
        });
    }, [name, icon, color, canSave, isPending, onSave]);

    // Don't render if closed or no group
    if (!open || !group) return null;

    // Translations
    const texts = {
        title: t('editGroupTitle') || (lang === 'es' ? 'Editar Grupo' : 'Edit Group'),
        groupName: t('groupName') || (lang === 'es' ? 'Nombre del Grupo' : 'Group Name'),
        placeholder: t('groupNamePlaceholder') || (lang === 'es'
            ? 'ej., Gastos del Hogar'
            : 'e.g., Home Expenses'),
        cancel: t('cancel') || (lang === 'es' ? 'Cancelar' : 'Cancel'),
        save: t('updateGroup') || (lang === 'es' ? 'Actualizar' : 'Update'),
        saving: t('updating') || (lang === 'es' ? 'Actualizando...' : 'Updating...'),
        close: t('close') || (lang === 'es' ? 'Cerrar' : 'Close'),
        discardTitle: t('discardGroupEdit') || (lang === 'es'
            ? 'Descartar cambios?'
            : 'Discard changes?'),
        discardBody: t('discardGroupEditBody') || (lang === 'es'
            ? 'Tienes cambios sin guardar. Estas seguro de que quieres descartar?'
            : 'You have unsaved changes. Are you sure you want to discard?'),
        keepEditing: t('keepEditing') || (lang === 'es' ? 'Seguir Editando' : 'Keep Editing'),
        discard: t('discard') || (lang === 'es' ? 'Descartar' : 'Discard'),
        iconLabel: t('iconLabel') || (lang === 'es' ? 'Icono' : 'Icon'),
        colorLabel: t('colorLabel') || (lang === 'es' ? 'Color' : 'Color'),
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: Z_INDEX.MODAL }}
            role="presentation"
            data-testid="edit-group-dialog-backdrop"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50"
                aria-hidden="true"
                onClick={handleClose}
                data-testid="backdrop-overlay"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-group-title"
                className="relative z-10 w-full max-w-sm mx-4 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="edit-group-dialog"
            >
                {/* Close button */}
                <button
                    ref={closeButtonRef}
                    onClick={handleClose}
                    disabled={isPending}
                    className="absolute right-4 top-4 p-2 rounded-full transition-colors disabled:opacity-50"
                    style={{ color: 'var(--secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                    aria-label={texts.close}
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div
                            className="w-12 h-12 shrink-0 aspect-square rounded-full flex items-center justify-center text-xl"
                            style={{
                                backgroundColor: color,
                                fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                                lineHeight: 1,
                            }}
                        >
                            {icon}
                        </div>
                        <h2
                            id="edit-group-title"
                            className="text-xl font-bold"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {texts.title}
                        </h2>
                    </div>

                    {/* Icon and Color Pickers */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1">
                            <label
                                className="block text-xs font-medium mb-2"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {texts.iconLabel}
                            </label>
                            <div data-testid="icon-picker">
                                <EmojiPicker
                                    value={icon}
                                    onChange={setIcon}
                                    disabled={isPending}
                                    lang={lang}
                                    size="lg"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label
                                className="block text-xs font-medium mb-2"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {texts.colorLabel}
                            </label>
                            <div data-testid="color-picker">
                                <ColorPicker
                                    value={color}
                                    onChange={setColor}
                                    disabled={isPending}
                                    lang={lang}
                                    size="lg"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Group Name Input */}
                    <div className="mb-6">
                        <label
                            htmlFor="group-name"
                            className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {texts.groupName}
                        </label>
                        <input
                            id="group-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isPending}
                            placeholder={texts.placeholder}
                            maxLength={MAX_NAME_LENGTH + 1}
                            className="w-full px-4 py-3 rounded-xl border text-sm transition-colors disabled:opacity-50"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: nameError ? '#ef4444' : 'var(--border-light)',
                                color: 'var(--text-primary)',
                            }}
                            data-testid="group-name-input"
                        />
                        <div className="flex justify-between items-center mt-1 min-h-[20px]">
                            {nameError ? (
                                <span className="text-xs text-red-500">{nameError}</span>
                            ) : (
                                <span />
                            )}
                            <span
                                className="text-xs"
                                style={{ color: 'var(--text-tertiary)' }}
                                data-testid="char-counter"
                            >
                                {name.trim().length}/{MAX_NAME_LENGTH}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleSave}
                            disabled={!canSave || isPending}
                            className="w-full py-3 px-4 rounded-xl text-white text-sm font-medium shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ backgroundColor: 'var(--primary)' }}
                            data-testid="save-btn"
                        >
                            {isPending ? (
                                <>
                                    <Loader2
                                        className="animate-spin"
                                        size={16}
                                        data-testid="loading-spinner"
                                    />
                                    {texts.saving}
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    {texts.save}
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleClose}
                            disabled={isPending}
                            className="w-full py-3 px-4 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50"
                            style={{
                                borderColor: 'var(--border-light)',
                                color: 'var(--text-primary)',
                                backgroundColor: 'var(--bg-secondary)',
                            }}
                            data-testid="cancel-btn"
                        >
                            {texts.cancel}
                        </button>
                    </div>
                </div>
            </div>

            {/* Discard Confirmation Dialog */}
            {showDiscardConfirm && (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center"
                    role="presentation"
                    data-testid="discard-confirm-backdrop"
                >
                    <div
                        className="fixed inset-0 bg-black/60"
                        aria-hidden="true"
                        onClick={handleKeepEditing}
                    />
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="discard-title"
                        aria-describedby="discard-body"
                        className="relative z-10 w-full max-w-xs mx-4 p-5 rounded-2xl shadow-xl"
                        style={{ backgroundColor: 'var(--surface)' }}
                        onClick={(e) => e.stopPropagation()}
                        data-testid="discard-confirm-dialog"
                    >
                        <h3
                            id="discard-title"
                            className="text-lg font-bold mb-2"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {texts.discardTitle}
                        </h3>
                        <p
                            id="discard-body"
                            className="text-sm mb-5"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {texts.discardBody}
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleKeepEditing}
                                className="w-full py-2.5 px-4 rounded-xl text-white text-sm font-medium shadow-md transition-all hover:opacity-90 flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--primary)' }}
                                data-testid="keep-editing-btn"
                            >
                                <Edit3 size={16} />
                                {texts.keepEditing}
                            </button>
                            <button
                                onClick={handleConfirmDiscard}
                                className="w-full py-2.5 px-4 rounded-xl border text-sm font-medium transition-colors"
                                style={{
                                    borderColor: 'var(--border-light)',
                                    color: '#ef4444',
                                    backgroundColor: 'var(--bg-secondary)',
                                }}
                                data-testid="discard-btn"
                            >
                                {texts.discard}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditGroupDialog;
