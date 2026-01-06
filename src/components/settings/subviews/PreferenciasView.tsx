/**
 * PreferenciasView Sub-View
 * Story 14.22 AC #5: Language, currency, date format, theme settings
 *
 * Migrates existing settings from flat SettingsView into dedicated sub-view
 */

import React from 'react';
import { Globe, DollarSign, Calendar, Moon, Palette } from 'lucide-react';

interface PreferenciasViewProps {
    t: (key: string) => string;
    theme: string;
    lang: string;
    currency: string;
    dateFormat: string;
    colorTheme?: string;
    fontColorMode?: string;
    onSetLang: (lang: string) => void;
    onSetCurrency: (currency: string) => void;
    onSetDateFormat: (format: string) => void;
    onSetTheme: (theme: string) => void;
    onSetColorTheme?: (colorTheme: string) => void;
    onSetFontColorMode?: (mode: string) => void;
}

export const PreferenciasView: React.FC<PreferenciasViewProps> = ({
    t,
    theme,
    lang,
    currency,
    dateFormat,
    colorTheme = 'normal',
    fontColorMode = 'colorful',
    onSetLang,
    onSetCurrency,
    onSetDateFormat,
    onSetTheme,
    onSetColorTheme,
    onSetFontColorMode,
}) => {
    const isDark = theme === 'dark';

    const cardStyle: React.CSSProperties = {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: isDark ? '#334155' : '#e2e8f0',
    };

    const toggleContainerStyle: React.CSSProperties = {
        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
        borderColor: isDark ? '#475569' : '#cbd5e1',
    };

    const getToggleButtonStyle = (isActive: boolean): React.CSSProperties => ({
        backgroundColor: isActive ? 'var(--accent)' : 'transparent',
        color: isActive ? '#ffffff' : 'var(--text-secondary)',
        transition: 'all 0.2s ease',
    });

    const selectStyle: React.CSSProperties = {
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        borderColor: isDark ? '#475569' : '#e2e8f0',
        color: 'var(--text-primary)',
    };

    return (
        <div className="space-y-4">
            {/* Language */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--text-primary)' }}>
                    <Globe size={24} strokeWidth={2} /> {t('language')}
                </div>
                <div className="flex rounded-lg p-1 border" style={toggleContainerStyle}>
                    <button
                        onClick={() => onSetLang('en')}
                        className="min-h-11 px-4 rounded-md flex items-center justify-center font-medium text-sm"
                        style={getToggleButtonStyle(lang === 'en')}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => onSetLang('es')}
                        className="min-h-11 px-4 rounded-md flex items-center justify-center font-medium text-sm"
                        style={getToggleButtonStyle(lang === 'es')}
                    >
                        ES
                    </button>
                </div>
            </div>

            {/* Currency */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--text-primary)' }}>
                    <DollarSign size={24} strokeWidth={2} /> {t('currency')}
                </div>
                <div className="flex rounded-lg p-1 border" style={toggleContainerStyle}>
                    <button
                        onClick={() => onSetCurrency('CLP')}
                        className="min-h-11 px-4 rounded-md flex items-center justify-center font-medium text-sm"
                        style={getToggleButtonStyle(currency === 'CLP')}
                    >
                        CLP
                    </button>
                    <button
                        onClick={() => onSetCurrency('USD')}
                        className="min-h-11 px-4 rounded-md flex items-center justify-center font-medium text-sm"
                        style={getToggleButtonStyle(currency === 'USD')}
                    >
                        USD
                    </button>
                </div>
            </div>

            {/* Date Format */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--text-primary)' }}>
                    <Calendar size={24} strokeWidth={2} /> {t('dateFormat')}
                </div>
                <div className="flex rounded-lg p-1 border" style={toggleContainerStyle}>
                    <button
                        onClick={() => onSetDateFormat('LatAm')}
                        className="min-h-11 px-4 rounded-md flex items-center justify-center font-medium text-sm"
                        style={getToggleButtonStyle(dateFormat === 'LatAm')}
                    >
                        31/12
                    </button>
                    <button
                        onClick={() => onSetDateFormat('US')}
                        className="min-h-11 px-4 rounded-md flex items-center justify-center font-medium text-sm"
                        style={getToggleButtonStyle(dateFormat === 'US')}
                    >
                        12/31
                    </button>
                </div>
            </div>

            {/* Theme (Light/Dark) */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--text-primary)' }}>
                    <Moon size={24} strokeWidth={2} /> {t('theme')}
                </div>
                <div className="flex rounded-lg p-1 border" style={toggleContainerStyle}>
                    <button
                        onClick={() => onSetTheme('light')}
                        className="min-h-11 px-4 rounded-md flex items-center justify-center font-medium text-sm"
                        style={getToggleButtonStyle(theme === 'light')}
                    >
                        Light
                    </button>
                    <button
                        onClick={() => onSetTheme('dark')}
                        className="min-h-11 px-4 rounded-md flex items-center justify-center font-medium text-sm"
                        style={getToggleButtonStyle(theme === 'dark')}
                    >
                        Dark
                    </button>
                </div>
            </div>

            {/* Color Theme */}
            {onSetColorTheme && (
                <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                    <div className="flex gap-2 items-center" style={{ color: 'var(--text-primary)' }}>
                        <Palette size={24} strokeWidth={2} /> {t('colorTheme')}
                    </div>
                    <select
                        value={colorTheme}
                        onChange={(e) => onSetColorTheme(e.target.value)}
                        className="min-h-11 px-3 rounded-lg font-medium text-sm border"
                        style={selectStyle}
                        aria-label={t('colorTheme')}
                    >
                        <option value="mono">{t('colorThemeMono')}</option>
                        <option value="normal">{t('colorThemeNormal')}</option>
                        <option value="professional">{t('colorThemeProfessional')}</option>
                    </select>
                </div>
            )}

            {/* Font Color Mode */}
            {onSetFontColorMode && (
                <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                    <div className="flex gap-2 items-center" style={{ color: 'var(--text-primary)' }}>
                        <Palette size={24} strokeWidth={2} /> {t('fontColorMode')}
                    </div>
                    <select
                        value={fontColorMode}
                        onChange={(e) => onSetFontColorMode(e.target.value)}
                        className="min-h-11 px-3 rounded-lg font-medium text-sm border"
                        style={selectStyle}
                        aria-label={t('fontColorMode')}
                    >
                        <option value="colorful">{t('fontColorModeColorful')}</option>
                        <option value="plain">{t('fontColorModePlain')}</option>
                    </select>
                </div>
            )}
        </div>
    );
};
