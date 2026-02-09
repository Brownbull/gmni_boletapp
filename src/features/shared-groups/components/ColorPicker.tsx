/**
 * ColorPicker Component
 *
 *
 * A full-screen centered modal picker for selecting colors for shared groups.
 * Shows a circular color button that opens a modal with color options.
 *
 * @example
 * ```tsx
 * <ColorPicker
 *   value="#10b981"
 *   onChange={(color) => setSelectedColor(color)}
 *   lang="es"
 * />
 * ```
 */

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { safeCSSColor } from '@/utils/validationUtils';

// =============================================================================
// Types
// =============================================================================

export interface ColorPickerProps {
    /** Currently selected color (hex) */
    value: string;
    /** Callback when color is selected */
    onChange: (color: string) => void;
    /** Whether the picker is disabled */
    disabled?: boolean;
    /** Language for labels (default: 'es') */
    lang?: 'en' | 'es';
    /** Size of the color button */
    size?: 'sm' | 'md' | 'lg';
}

// =============================================================================
// Color Options - Expanded palette
// =============================================================================

const COLOR_OPTIONS = [
    // Row 1: Greens
    { hex: '#10b981', name: 'Emerald' },
    { hex: '#22c55e', name: 'Green' },
    { hex: '#84cc16', name: 'Lime' },
    { hex: '#14b8a6', name: 'Teal' },
    // Row 2: Blues
    { hex: '#3b82f6', name: 'Blue' },
    { hex: '#0ea5e9', name: 'Sky' },
    { hex: '#06b6d4', name: 'Cyan' },
    { hex: '#6366f1', name: 'Indigo' },
    // Row 3: Purples & Pinks
    { hex: '#8b5cf6', name: 'Violet' },
    { hex: '#a855f7', name: 'Purple' },
    { hex: '#d946ef', name: 'Fuchsia' },
    { hex: '#ec4899', name: 'Pink' },
    // Row 4: Warm colors
    { hex: '#f43f5e', name: 'Rose' },
    { hex: '#ef4444', name: 'Red' },
    { hex: '#f97316', name: 'Orange' },
    { hex: '#f59e0b', name: 'Amber' },
    // Row 5: Yellows & Neutrals
    { hex: '#eab308', name: 'Yellow' },
    { hex: '#78716c', name: 'Stone' },
    { hex: '#64748b', name: 'Slate' },
    { hex: '#71717a', name: 'Zinc' },
];

// =============================================================================
// Component
// =============================================================================

export function ColorPicker({
    value,
    onChange,
    disabled = false,
    lang = 'es',
    size = 'md',
}: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Size classes - circular buttons
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    const handleToggle = useCallback(() => {
        if (!disabled) {
            setIsOpen(prev => !prev);
        }
    }, [disabled]);

    const handleSelect = useCallback((color: string) => {
        onChange(color);
        setIsOpen(false);
    }, [onChange]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Find color name for aria-label
    const selectedColorName = COLOR_OPTIONS.find(c => c.hex === value)?.name || 'Custom';

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
                className="relative z-10 w-full max-w-xs overflow-hidden rounded-2xl shadow-2xl"
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
                        {lang === 'es' ? 'Seleccionar Color' : 'Select Color'}
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

                {/* Color Grid */}
                <div className="p-4">
                    <div className="grid grid-cols-4 gap-3">
                        {COLOR_OPTIONS.map((color) => (
                            <button
                                key={color.hex}
                                type="button"
                                onClick={() => handleSelect(color.hex)}
                                className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                                style={{
                                    backgroundColor: color.hex,
                                    border: value === color.hex
                                        ? '3px solid var(--text-primary)'
                                        : '3px solid transparent',
                                    boxShadow: value === color.hex
                                        ? '0 0 0 2px var(--surface), 0 0 0 4px var(--text-primary)'
                                        : 'none',
                                }}
                                aria-label={color.name}
                                aria-pressed={value === color.hex}
                            >
                                {value === color.hex && (
                                    <Check className="w-6 h-6 text-white drop-shadow-md" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <>
            {/* Trigger Button - Circular, shows color directly */}
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                style={{
                    backgroundColor: safeCSSColor(value),
                    border: '2px solid var(--border-light)',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-label={lang === 'es' ? `Color: ${selectedColorName}` : `Color: ${selectedColorName}`}
            />

            {/* Portal for modal */}
            {modalContent && createPortal(modalContent, document.body)}
        </>
    );
}

export default ColorPicker;
