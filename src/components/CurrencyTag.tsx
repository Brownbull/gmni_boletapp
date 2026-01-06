import React, { useState, useRef, useEffect } from 'react';

// Currency options with symbols
const CURRENCIES = [
    { code: 'CLP', symbol: '$', name: 'Peso Chileno' },
    { code: 'USD', symbol: 'US$', name: 'US Dollar' },
    { code: 'EUR', symbol: '\u20ac', name: 'Euro' },
    { code: 'ARS', symbol: 'AR$', name: 'Peso Argentino' },
    { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' },
    { code: 'COP', symbol: 'COL$', name: 'Peso Colombiano' },
    { code: 'MXN', symbol: 'MX$', name: 'Peso Mexicano' },
    { code: 'GBP', symbol: '\u00a3', name: 'British Pound' },
];

interface CurrencyTagProps {
    currency: string;
    onCurrencyChange: (currency: string) => void;
    theme?: 'light' | 'dark';
    t?: (key: string) => string;
}

/**
 * Currency selection component with dropdown panel
 * Story 14.14b Session 4: Updated to match scan-overlay mockup with floating labels
 *
 * - Shows clickable tag with currency symbol
 * - Opens dropdown panel with floating label select
 */
export const CurrencyTag: React.FC<CurrencyTagProps> = ({
    currency,
    onCurrencyChange,
    theme = 'light',
    t,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isDark = theme === 'dark';

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Get symbol for current currency
    const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    const displaySymbol = currentCurrency.symbol;

    const inputStyle: React.CSSProperties = {
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        borderColor: isDark ? '#475569' : '#e2e8f0',
        color: 'var(--primary)',
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Clickable tag */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={{
                    backgroundColor: isOpen ? 'var(--primary-light)' : (isDark ? '#1e293b' : '#f1f5f9'),
                    border: `1px solid ${isOpen ? 'var(--primary)' : (isDark ? '#475569' : '#cbd5e1')}`,
                    color: isOpen ? 'var(--primary)' : (isDark ? '#94a3b8' : '#64748b'),
                    minWidth: '40px',
                }}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {displaySymbol}
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div
                    className="absolute top-full right-0 mt-2 min-w-[200px] rounded-xl overflow-hidden z-50"
                    style={{
                        backgroundColor: 'var(--bg-secondary, #ffffff)',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                        border: '1px solid var(--border-light, #e2e8f0)',
                    }}
                >
                    <div className="p-3 space-y-3">
                        <div className="relative">
                            <label
                                className="absolute -top-2 left-2.5 px-1 text-[10px] font-medium z-10"
                                style={{
                                    backgroundColor: 'var(--bg-secondary, #ffffff)',
                                    color: 'var(--primary, #2563eb)',
                                }}
                            >
                                {t ? t('currency') : 'Moneda'}
                            </label>
                            <select
                                className="w-full h-10 px-3 border rounded-lg text-sm cursor-pointer"
                                style={inputStyle}
                                value={currency}
                                onChange={e => onCurrencyChange(e.target.value)}
                            >
                                {CURRENCIES.map(c => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} - {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                                backgroundColor: 'var(--primary-light, #dbeafe)',
                                color: 'var(--primary, #2563eb)',
                            }}
                        >
                            {t ? t('confirm') : 'Confirmar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
