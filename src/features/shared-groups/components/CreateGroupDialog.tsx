/**
 * CreateGroupDialog Component
 *
 * Story 14d-v2-1-4c-1: Core Dialog & Entry Point
 * Story 14d-v2-1-4c-2: Enhanced Features & BC-1 Limits
 * Epic 14d-v2: Shared Groups v2
 *
 * Modal dialog for creating a new shared expense group.
 * Features:
 * - Group name input with validation (2-50 chars)
 * - Transaction sharing toggle with helper text
 * - Loading state during creation
 * - Discard confirmation when closing with unsaved changes
 * - BC-1 limit enforcement (max groups per user)
 * - Success/error feedback
 * - Accessible (keyboard navigation, ARIA)
 *
 * @example
 * ```tsx
 * <CreateGroupDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onCreate={(input) => createGroup(input)}
 *   isPending={isPending}
 *   canCreate={canCreate}
 *   groupCount={5}
 *   maxGroups={10}
 *   t={t}
 * />
 * ```
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Users, Loader2, Info, AlertTriangle, Plus, Edit3 } from 'lucide-react';
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from '@/shared/hooks';
import { Z_INDEX } from '@/constants';

// =============================================================================
// Types
// =============================================================================

export interface CreateGroupInput {
    /** Group name (trimmed) */
    name: string;
    /** Whether transaction sharing is enabled */
    transactionSharingEnabled: boolean;
}

export interface CreateGroupDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog should close */
    onClose: () => void;
    /** Callback when user submits the form */
    onCreate: (input: CreateGroupInput) => void;
    /** Whether creation is in progress */
    isPending: boolean;
    /** Translation function */
    t: (key: string) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
    /**
     * Whether user can create a new group (BC-1 limit check).
     * When false, create button is disabled with limit message.
     * Story 14d-v2-1-4c-2: BC-1 Limit Enforcement
     */
    canCreate?: boolean;
    /**
     * Current number of groups user belongs to.
     * Used to display limit message when canCreate is false.
     * Story 14d-v2-1-4c-2: BC-1 Limit Enforcement
     */
    groupCount?: number;
    /**
     * Maximum number of groups allowed per user.
     * Defaults to 10 (SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS).
     * Story 14d-v2-1-4c-2: BC-1 Limit Enforcement
     */
    maxGroups?: number;
    /**
     * Whether there was an error in the last creation attempt.
     * Used to show error state with retry option.
     * Story 14d-v2-1-4c-2: Error Handling
     */
    hasError?: boolean;
    /**
     * Error message from last creation attempt.
     * Story 14d-v2-1-4c-2: Error Handling
     */
    errorMessage?: string;
    /**
     * Callback to reset error state (for retry).
     * Story 14d-v2-1-4c-2: Error Handling
     */
    onResetError?: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 50;

// =============================================================================
// Component
// =============================================================================

export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({
    open,
    onClose,
    onCreate,
    isPending,
    t,
    lang = 'es',
    canCreate = true,
    groupCount: _groupCount, // Available for future use (current count display)
    maxGroups = 10,
    hasError = false,
    errorMessage,
    onResetError,
}) => {
    // State
    const [name, setName] = useState('');
    const [transactionSharingEnabled, setTransactionSharingEnabled] = useState(true);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    // Refs
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Track if user has made changes (for discard confirmation)
    const hasChanges = useMemo(() => {
        return name.trim().length > 0;
    }, [name]);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setName('');
            setTransactionSharingEnabled(true);
            setShowDiscardConfirm(false);
            // Focus close button after render
            setTimeout(() => closeButtonRef.current?.focus(), 0);
        }
    }, [open]);

    // Name validation - show error when user has typed something (name.length > 0)
    // but trimmed result is too short
    const nameError = useMemo(() => {
        const trimmed = name.trim();
        // Show error if user has typed but trimmed is too short (includes whitespace-only)
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

    // Combined validation: valid name AND can create (BC-1 limit)
    const canSubmit = isValid && canCreate;

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
        setName('');
        setTransactionSharingEnabled(true);
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

    // Handle submit
    const handleSubmit = useCallback(() => {
        if (!canSubmit || isPending) return;
        // Reset error state before attempting
        onResetError?.();
        onCreate({
            name: name.trim(),
            transactionSharingEnabled,
        });
    }, [name, transactionSharingEnabled, canSubmit, isPending, onCreate, onResetError]);

    // Don't render if closed
    if (!open) return null;

    // Translations
    const texts = {
        title: t('createGroup') || (lang === 'es' ? 'Crear Grupo' : 'Create Group'),
        groupName: t('groupName') || (lang === 'es' ? 'Nombre del Grupo' : 'Group Name'),
        placeholder: t('groupNamePlaceholder') || (lang === 'es'
            ? 'ej., \ud83c\udfe0 Gastos del Hogar'
            : 'e.g., \ud83c\udfe0 Home Expenses'),
        transactionSharing: t('transactionSharing') || (lang === 'es'
            ? 'Compartir Transacciones'
            : 'Transaction Sharing'),
        sharingDescription: t('transactionSharingDescription') || (lang === 'es'
            ? 'Cuando est\u00e1 habilitado, los miembros pueden elegir compartir sus detalles de transacciones individuales con el grupo. Las estad\u00edsticas (totales, desgloses por categor\u00eda y miembro) siempre se comparten independientemente de esta configuraci\u00f3n.'
            : 'When enabled, members can choose to share their individual transaction details with the group. Statistics (totals, breakdowns by category and member) are always shared regardless of this setting.'),
        cancel: t('cancel') || (lang === 'es' ? 'Cancelar' : 'Cancel'),
        create: t('create') || (lang === 'es' ? 'Crear' : 'Create'),
        creating: t('creating') || (lang === 'es' ? 'Creando...' : 'Creating...'),
        close: t('close') || (lang === 'es' ? 'Cerrar' : 'Close'),
        // Story 14d-v2-1-4c-2: Discard confirmation
        discardTitle: t('discardGroupCreation') || (lang === 'es'
            ? '¿Descartar creación del grupo?'
            : 'Discard group creation?'),
        discardBody: t('discardGroupBody') || (lang === 'es'
            ? 'Tienes cambios sin guardar. ¿Estás seguro de que quieres descartar?'
            : 'You have unsaved changes. Are you sure you want to discard?'),
        keepEditing: t('keepEditing') || (lang === 'es' ? 'Seguir Editando' : 'Keep Editing'),
        discard: t('discard') || (lang === 'es' ? 'Descartar' : 'Discard'),
        // Story 14d-v2-1-4c-2: BC-1 limit enforcement
        limitReached: t('groupLimitReached') || (lang === 'es'
            ? `Has alcanzado el máximo de ${maxGroups} grupos`
            : `You've reached the maximum of ${maxGroups} groups`),
        limitTooltip: t('groupLimitTooltip') || (lang === 'es'
            ? `Límite de ${maxGroups} grupos alcanzado. Sal de un grupo para crear uno nuevo.`
            : `Limit of ${maxGroups} groups reached. Leave a group to create a new one.`),
        // Story 14d-v2-1-4c-2: Error handling
        errorTitle: t('createGroupError') || (lang === 'es'
            ? 'Error al crear el grupo'
            : 'Error creating group'),
        retry: t('retry') || (lang === 'es' ? 'Reintentar' : 'Retry'),
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: Z_INDEX.MODAL }}
            role="presentation"
            data-testid="create-group-dialog-backdrop"
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
                aria-labelledby="create-group-title"
                className="relative z-10 w-full max-w-sm mx-4 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="create-group-dialog"
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
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                            <Users className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                        </div>
                        <h2
                            id="create-group-title"
                            className="text-xl font-bold"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {texts.title}
                        </h2>
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
                            maxLength={MAX_NAME_LENGTH + 1} // Allow typing one extra char to show error
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

                    {/* Transaction Sharing Toggle */}
                    <div
                        className="mb-6 p-4 rounded-xl"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-light)',
                        }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <label
                                htmlFor="transaction-sharing"
                                className="text-sm font-medium"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {texts.transactionSharing}
                            </label>
                            <button
                                id="transaction-sharing"
                                role="switch"
                                type="button"
                                aria-checked={transactionSharingEnabled}
                                onClick={() => setTransactionSharingEnabled(!transactionSharingEnabled)}
                                disabled={isPending}
                                className="relative w-12 h-7 rounded-full transition-colors disabled:opacity-50"
                                style={{
                                    backgroundColor: transactionSharingEnabled
                                        ? 'var(--primary)'
                                        : 'var(--border-light)',
                                }}
                                data-testid="transaction-sharing-toggle"
                            >
                                <span
                                    className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
                                    style={{
                                        left: transactionSharingEnabled ? '26px' : '4px',
                                    }}
                                />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <Info
                                size={14}
                                className="flex-shrink-0 mt-0.5"
                                style={{ color: 'var(--text-tertiary)' }}
                            />
                            <p
                                className="text-xs leading-relaxed"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {texts.sharingDescription}
                            </p>
                        </div>
                    </div>

                    {/* BC-1 Limit Warning - Story 14d-v2-1-4c-2 */}
                    {!canCreate && (
                        <div
                            className="mb-4 p-3 rounded-xl flex items-start gap-3"
                            style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                            data-testid="limit-warning"
                        >
                            <AlertTriangle
                                size={18}
                                className="flex-shrink-0 mt-0.5"
                                style={{ color: '#ef4444' }}
                            />
                            <div>
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: '#ef4444' }}
                                >
                                    {texts.limitReached}
                                </p>
                                <p
                                    className="text-xs mt-1"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {texts.limitTooltip}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Display - Story 14d-v2-1-4c-2 */}
                    {hasError && (
                        <div
                            className="mb-4 p-3 rounded-xl flex items-start gap-3"
                            style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                            data-testid="error-display"
                        >
                            <AlertTriangle
                                size={18}
                                className="flex-shrink-0 mt-0.5"
                                style={{ color: '#ef4444' }}
                            />
                            <div className="flex-1">
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: '#ef4444' }}
                                >
                                    {texts.errorTitle}
                                </p>
                                {errorMessage && (
                                    <p
                                        className="text-xs mt-1"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        {errorMessage}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        <div className="relative group">
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit || isPending}
                                className="w-full py-3 px-4 rounded-xl text-white text-sm font-medium shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--primary)' }}
                                data-testid="create-btn"
                                title={!canCreate ? texts.limitTooltip : undefined}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2
                                            className="animate-spin"
                                            size={16}
                                            data-testid="loading-spinner"
                                        />
                                        {texts.creating}
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} />
                                        {texts.create}
                                    </>
                                )}
                            </button>
                        </div>

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

            {/* Discard Confirmation Dialog - Story 14d-v2-1-4c-2 */}
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

export default CreateGroupDialog;
