/**
 * CreateGroupModal Component
 *
 * Story 14.15: Transaction Selection Mode & Groups
 * Story 14.15b: Enhanced with icon and color selectors
 * Epic 14: Core Implementation
 *
 * Modal for creating a new transaction group.
 * Features:
 * - Input field for group name
 * - Icon selector with expandable picker
 * - Color selector with expandable palette
 * - Create button to confirm creation
 * - Back button to return to group selection
 * - Centered positioning without blocking header/nav
 *
 * @see docs/uxui/mockups/01_views/transaction-list.html - State 6
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, ArrowLeft, Check } from 'lucide-react';

// ============================================================================
// Icon and Color Constants
// ============================================================================

/** Extended icon list for the expanded picker (7x7 grid = 49 icons) */
const ALL_ICONS = [
    // Row 1: Home & Living
    '🏠', '🏡', '🪴', '🔧', '🧹', '🛋️', '🪑',
    // Row 2: Shopping
    '🛒', '🛍️', '💳', '🏪', '🏬', '🧾', '📦',
    // Row 3: Events & Celebrations
    '🎁', '🎉', '🎂', '🎃', '🎄', '🏢', '🏛️',
    // Row 4: Work & Business
    '💼', '✈️', '🚗', '🌍', '🗺️', '🏖️', '🏕️',
    // Row 5: Health & Wellness
    '🏥', '💊', '🏃', '🧘', '🥗', '💪', '🍔',
    // Row 6: Food & Entertainment
    '🍕', '☕', '🎬', '🎮', '🎵', '📚', '⚽',
    // Row 7: Education & Pets
    '📖', '🎓', '✏️', '🔬', '🐕', '🐈', '🌸',
];

/** Default colors for quick picker */
const DEFAULT_COLORS = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
];

/** Extended color palette */
const ALL_COLORS = [
    // Greens
    '#10b981', '#059669', '#22c55e', '#84cc16',
    // Blues
    '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6',
    // Purples
    '#8b5cf6', '#a855f7', '#d946ef', '#6366f1',
    // Warm colors
    '#f59e0b', '#f97316', '#ef4444', '#dc2626',
    // Pinks
    '#ec4899', '#f472b6', '#fb7185', '#e11d48',
    // Neutrals
    '#6b7280', '#78716c', '#64748b', '#71717a',
];

// ============================================================================
// Types
// ============================================================================

export interface CreateGroupModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Number of selected transactions */
    selectedCount: number;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Callback when group is created - receives group name and color */
    onCreate: (name: string, color: string) => Promise<void>;
    /** Callback when "Back" is clicked to return to group selection */
    onBack: () => void;
    /** Translation function */
    t: (key: string) => string;
    /** Language for pluralization */
    lang?: 'en' | 'es';
}

// ============================================================================
// Component
// ============================================================================

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
    isOpen,
    selectedCount,
    onClose,
    onCreate,
    onBack,
    t,
    lang = 'es',
}) => {
    const [groupName, setGroupName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedIcon, setSelectedIcon] = useState<string>('🏠');
    const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLORS[0]);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const previousActiveElement = useRef<Element | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setGroupName('');
            setError(null);
            setIsCreating(false);
            setSelectedIcon('🏠');
            setSelectedColor(DEFAULT_COLORS[0]);
            setShowIconPicker(false);
            setShowColorPicker(false);
            previousActiveElement.current = document.activeElement;
            // Focus input after render
            setTimeout(() => {
                inputRef.current?.focus();
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

    // Handle create - prepends icon to name
    const handleCreate = async () => {
        const trimmedName = groupName.trim();
        if (!trimmedName) {
            setError(lang === 'es' ? 'El nombre es requerido' : 'Name is required');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            // Prepend selected icon to group name
            const fullName = `${selectedIcon} ${trimmedName}`;
            await onCreate(fullName, selectedColor);
            // Success - modal will be closed by parent, but reset state just in case
            setIsCreating(false);
        } catch (err) {
            console.error('[CreateGroupModal] Create error:', err);
            setError(
                lang === 'es'
                    ? 'Error al crear el grupo'
                    : 'Failed to create group'
            );
            setIsCreating(false);
        }
    };

    // Handle Enter key in input
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isCreating) {
            e.preventDefault();
            handleCreate();
        }
    };

    // Use portal to render at document body level, bypassing parent overflow constraints
    // Full-screen modal with fixed header/footer and scrollable content
    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex flex-col"
            role="presentation"
            data-testid="create-group-modal-overlay"
        >
            {/* Backdrop - covers full screen */}
            <div
                className="fixed inset-0 bg-black/50"
                aria-hidden="true"
                onClick={handleClose}
            />

            {/* Full-screen Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-group-title"
                className="relative z-10 flex flex-col h-full"
                style={{ backgroundColor: 'var(--bg)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="create-group-modal"
            >
                {/* Fixed Header */}
                <div
                    className="flex-shrink-0 flex justify-between items-center p-4 border-b"
                    style={{ borderColor: 'var(--border-light)' }}
                >
                    <div className="flex items-center gap-3">
                        {/* Icon preview - shows selected icon and color */}
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all"
                            style={{
                                backgroundColor: selectedColor,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                            data-testid="header-icon-preview"
                        >
                            {selectedIcon}
                        </div>
                        {/* Title + Subtitle */}
                        <div>
                            <div
                                id="create-group-title"
                                className="text-base font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {lang === 'es' ? 'Nuevo Grupo' : 'New Group'}
                            </div>
                            <div
                                className="text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {getCountText()}
                            </div>
                        </div>
                    </div>
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full transition-colors"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        aria-label={t('close') || 'Close'}
                        data-testid="create-group-close"
                    >
                        <X size={20} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Input with floating label */}
                    <div className="relative">
                        <label
                            className="absolute -top-2 left-[10px] px-1 text-xs font-medium z-10"
                            style={{
                                backgroundColor: 'var(--bg)',
                                color: 'var(--primary)',
                            }}
                        >
                            {lang === 'es' ? 'Nombre del grupo' : 'Group name'}
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={groupName}
                            onChange={(e) => {
                                setGroupName(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={lang === 'es' ? 'Ej: Regalos Navidad' : 'e.g. Holiday Gifts'}
                            className="w-full h-12 px-3 text-sm rounded-lg border outline-none transition-colors"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: error ? 'var(--error)' : 'var(--border-medium)',
                                color: 'var(--text-primary)',
                            }}
                            data-testid="group-name-input"
                        />
                    </div>

                    {/* Story 14.15b: Icon Selector */}
                    <div className="mt-5">
                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            {lang === 'es' ? 'Icono' : 'Icon'}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Quick pick icons - first 5 from list */}
                            {['🏠', '🛒', '🎄', '💼', '🏖️'].map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setSelectedIcon(icon)}
                                    className="w-11 h-11 rounded-lg flex items-center justify-center text-xl transition-all"
                                    style={{
                                        backgroundColor: selectedIcon === icon ? selectedColor : 'var(--bg-tertiary)',
                                        border: selectedIcon === icon ? 'none' : '1px solid var(--border-light)',
                                    }}
                                    data-testid={`icon-quick-${icon}`}
                                >
                                    {icon}
                                </button>
                            ))}
                            {/* Expand button - highlighted when picker is open */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowIconPicker(!showIconPicker);
                                    setShowColorPicker(false);
                                }}
                                className="w-11 h-11 rounded-lg flex items-center justify-center transition-all"
                                style={{
                                    backgroundColor: showIconPicker ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                                    border: showIconPicker ? '2px solid var(--primary)' : '1px dashed var(--border-medium)',
                                }}
                                aria-label={lang === 'es' ? 'Más iconos' : 'More icons'}
                                aria-expanded={showIconPicker}
                                data-testid="icon-expand"
                            >
                                <Plus size={18} strokeWidth={2} style={{ color: showIconPicker ? 'var(--primary)' : 'var(--text-tertiary)' }} />
                            </button>
                        </div>
                        {/* Expanded Icon Picker - scrollable container with 7 columns */}
                        {showIconPicker && (
                            <div
                                className="mt-3 p-3 rounded-xl border overflow-y-auto"
                                style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderColor: 'var(--border-light)',
                                    maxHeight: '200px',
                                }}
                            >
                                <div className="grid grid-cols-7 gap-2">
                                    {ALL_ICONS.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => {
                                                setSelectedIcon(icon);
                                                setShowIconPicker(false);
                                            }}
                                            className="w-full aspect-square rounded-lg flex items-center justify-center text-xl transition-all"
                                            style={{
                                                backgroundColor: selectedIcon === icon ? 'var(--primary-light)' : 'transparent',
                                                outline: selectedIcon === icon ? '2px solid var(--primary)' : 'none',
                                                outlineOffset: '1px',
                                            }}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Story 14.15b: Color Selector */}
                    <div className="mt-5">
                        <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            {lang === 'es' ? 'Color' : 'Color'}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Quick pick colors - first 5 from DEFAULT_COLORS */}
                            {DEFAULT_COLORS.slice(0, 5).map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                                    style={{
                                        backgroundColor: color,
                                        outline: selectedColor === color ? `2px solid ${color}` : 'none',
                                        outlineOffset: '2px',
                                    }}
                                    data-testid={`color-quick-${color}`}
                                >
                                    {selectedColor === color && (
                                        <Check size={18} strokeWidth={3} style={{ color: 'white' }} />
                                    )}
                                </button>
                            ))}
                            {/* Expand button - highlighted when picker is open */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowColorPicker(!showColorPicker);
                                    setShowIconPicker(false);
                                }}
                                className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                                style={{
                                    backgroundColor: showColorPicker ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                                    border: showColorPicker ? '2px solid var(--primary)' : '1px dashed var(--border-medium)',
                                }}
                                aria-label={lang === 'es' ? 'Más colores' : 'More colors'}
                                aria-expanded={showColorPicker}
                                data-testid="color-expand"
                            >
                                <Plus size={18} strokeWidth={2} style={{ color: showColorPicker ? 'var(--primary)' : 'var(--text-tertiary)' }} />
                            </button>
                        </div>
                        {/* Expanded Color Picker - scrollable container */}
                        {showColorPicker && (
                            <div
                                className="mt-3 p-3 rounded-xl border overflow-y-auto"
                                style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderColor: 'var(--border-light)',
                                    maxHeight: '150px',
                                }}
                            >
                                <div className="grid grid-cols-8 gap-2">
                                    {ALL_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => {
                                                setSelectedColor(color);
                                                setShowColorPicker(false);
                                            }}
                                            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                                            style={{
                                                backgroundColor: color,
                                                outline: selectedColor === color ? `2px solid ${color}` : 'none',
                                                outlineOffset: '2px',
                                            }}
                                        >
                                            {selectedColor === color && (
                                                <Check size={14} strokeWidth={3} style={{ color: 'white' }} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div
                            className="mt-4 text-sm"
                            style={{ color: 'var(--error)' }}
                            role="alert"
                        >
                            {error}
                        </div>
                    )}
                </div>

                {/* Fixed Footer */}
                <div
                    className="flex-shrink-0 flex gap-3 p-4 border-t"
                    style={{ borderColor: 'var(--border-light)' }}
                >
                    {/* Back button */}
                    <button
                        onClick={onBack}
                        disabled={isCreating}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-light)',
                            color: 'var(--text-primary)',
                        }}
                        data-testid="create-group-back"
                    >
                        <ArrowLeft size={16} strokeWidth={2} />
                        <span>{lang === 'es' ? 'Volver' : 'Back'}</span>
                    </button>

                    {/* Create button */}
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !groupName.trim()}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
                        style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                        }}
                        data-testid="create-group-confirm"
                    >
                        <Check size={16} strokeWidth={2} />
                        <span>
                            {isCreating
                                ? (lang === 'es' ? 'Creando...' : 'Creating...')
                                : (lang === 'es' ? 'Crear' : 'Create')
                            }
                        </span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateGroupModal;
