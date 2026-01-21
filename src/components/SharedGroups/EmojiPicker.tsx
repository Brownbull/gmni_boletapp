/**
 * EmojiPicker Component
 *
 *
 * A full-screen centered modal picker for selecting emojis/icons for shared groups.
 * Displays a grid of common expense-related emojis organized by category.
 *
 * @example
 * ```tsx
 * <EmojiPicker
 *   value="🏠"
 *   onChange={(emoji) => setSelectedEmoji(emoji)}
 *   lang="es"
 * />
 * ```
 */

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface EmojiPickerProps {
    /** Currently selected emoji */
    value: string;
    /** Callback when emoji is selected */
    onChange: (emoji: string) => void;
    /** Whether the picker is disabled */
    disabled?: boolean;
    /** Language for labels (default: 'es') */
    lang?: 'en' | 'es';
    /** Size of the emoji button */
    size?: 'sm' | 'md' | 'lg';
}

// =============================================================================
// Emoji Categories - Using simple, widely-supported emojis
// =============================================================================

const EMOJI_CATEGORIES = {
    home: {
        labelEn: 'Home & Family',
        labelEs: 'Hogar y Familia',
        emojis: ['🏠', '🏡', '🏢', '👨‍👩‍👧‍👦', '👨‍👩‍👧', '👪', '🏘', '🛋', '🛏', '🚿', '🧹', '🪴'],
    },
    travel: {
        labelEn: 'Travel',
        labelEs: 'Viajes',
        emojis: ['✈', '🚗', '🚌', '🚃', '⛽', '🏖', '🗺', '🧳', '🚀', '🚲', '🛵', '⛵'],
    },
    food: {
        labelEn: 'Food & Drinks',
        labelEs: 'Comida y Bebidas',
        emojis: ['🍽', '🍔', '🍕', '☕', '🍺', '🛒', '🧑‍🍳', '🥗', '🍰', '🍜', '🥤', '🍷'],
    },
    entertainment: {
        labelEn: 'Entertainment',
        labelEs: 'Entretenimiento',
        emojis: ['🎬', '🎮', '🎵', '🎭', '🎪', '📺', '🎤', '🎸', '🎨', '📷', '🎲', '🎯'],
    },
    work: {
        labelEn: 'Work & Office',
        labelEs: 'Trabajo y Oficina',
        emojis: ['💼', '💻', '📊', '📈', '🏛', '📋', '✏', '📁', '🖨', '📞', '🗂', '📝'],
    },
    health: {
        labelEn: 'Health & Sports',
        labelEs: 'Salud y Deportes',
        emojis: ['🏥', '💊', '🏃', '⚽', '🏋', '🧘', '🚴', '🏊', '🎾', '⛳', '🥊', '🏀'],
    },
    shopping: {
        labelEn: 'Shopping',
        labelEs: 'Compras',
        emojis: ['🛍', '👗', '👟', '💄', '🎁', '💎', '🛒', '🏬', '👜', '⌚', '👔', '🧥'],
    },
    special: {
        labelEn: 'Special Events',
        labelEs: 'Eventos Especiales',
        emojis: ['🎄', '🎂', '🎉', '💒', '🎓', '🏆', '🎊', '✨', '🎁', '🎈', '🎇', '🎆'],
    },
    nature: {
        labelEn: 'Nature & Pets',
        labelEs: 'Naturaleza y Mascotas',
        emojis: ['🐕', '🐈', '🌳', '🌸', '🌊', '⛰', '🌺', '🦋', '🐠', '🦜', '🌻', '🍀'],
    },
    symbols: {
        labelEn: 'Symbols',
        labelEs: 'Símbolos',
        emojis: ['⭐', '❤', '💰', '🔑', '🏷', '📌', '🔔', '💡', '🎯', '💳', '📍', '🔒'],
    },
};

// =============================================================================
// Component
// =============================================================================

export function EmojiPicker({
    value,
    onChange,
    disabled = false,
    lang = 'es',
    size = 'md',
}: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Size classes - circular buttons
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    const fontSizeClasses = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl',
    };

    const handleToggle = useCallback(() => {
        if (!disabled) {
            setIsOpen(prev => !prev);
        }
    }, [disabled]);

    const handleSelect = useCallback((emoji: string) => {
        onChange(emoji);
        setIsOpen(false);
    }, [onChange]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Modal content - centered on screen with theme colors
    const modalContent = isOpen ? (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={handleClose}
        >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

            {/* Modal Panel - Centered */}
            <div
                className="relative z-10 w-full max-w-sm max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 border-b"
                    style={{ borderColor: 'var(--border-light)' }}
                >
                    <h3
                        className="text-lg font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {lang === 'es' ? 'Seleccionar Icono' : 'Select Icon'}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full transition-colors"
                        style={{ color: 'var(--secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                        aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Emoji Grid */}
                <div
                    className="overflow-y-auto p-4"
                    style={{ maxHeight: 'calc(80vh - 60px)' }}
                >
                    {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                        <div key={key} className="mb-4 last:mb-0">
                            <div
                                className="text-xs font-semibold uppercase tracking-wide px-1 mb-2"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {lang === 'es' ? category.labelEs : category.labelEn}
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                                {category.emojis.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleSelect(emoji)}
                                        className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                                        style={{
                                            backgroundColor: value === emoji
                                                ? 'var(--primary-light)'
                                                : 'var(--bg-tertiary)',
                                            border: value === emoji
                                                ? '2px solid var(--primary)'
                                                : '2px solid transparent',
                                            fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif',
                                            fontSize: '1.5rem',
                                            lineHeight: 1,
                                        }}
                                        aria-label={emoji}
                                        aria-pressed={value === emoji}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    ) : null;

    return (
        <>
            {/* Trigger Button - Circular */}
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`${sizeClasses[size]} ${fontSizeClasses[size]} rounded-full flex items-center justify-center transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '2px solid var(--border-light)',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif',
                    lineHeight: 1,
                }}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-label={lang === 'es' ? 'Seleccionar icono' : 'Select icon'}
            >
                {value || '😀'}
            </button>

            {/* Portal for modal */}
            {modalContent && createPortal(modalContent, document.body)}
        </>
    );
}

export default EmojiPicker;
