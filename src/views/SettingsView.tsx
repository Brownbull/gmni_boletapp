import React from 'react';
import { Globe, DollarSign, Calendar, Moon, Palette, Download, Trash2, ArrowRightLeft, Loader2, BookMarked } from 'lucide-react';
import { CategoryMappingsList } from '../components/CategoryMappingsList';
import { CategoryMapping } from '../types/categoryMapping';

interface SettingsViewProps {
    lang: string;
    currency: string;
    dateFormat: string;
    theme: string;
    wiping: boolean;
    exporting: boolean;
    t: (key: string) => string;
    onSetLang: (lang: string) => void;
    onSetCurrency: (currency: string) => void;
    onSetDateFormat: (format: string) => void;
    onSetTheme: (theme: string) => void;
    onExportAll: () => void;
    onWipeDB: () => Promise<void>;
    onSignOut: () => void;
    // Story 6.5: Category mappings management
    mappings?: CategoryMapping[];
    mappingsLoading?: boolean;
    onDeleteMapping?: (mappingId: string) => Promise<void>;
    // Story 7.12 AC#11: Color theme selector
    colorTheme?: string;
    onSetColorTheme?: (colorTheme: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
    lang,
    currency,
    dateFormat,
    theme,
    wiping,
    exporting,
    t,
    onSetLang,
    onSetCurrency,
    onSetDateFormat,
    onSetTheme,
    onExportAll,
    onWipeDB,
    onSignOut,
    // Story 6.5: Category mappings management
    mappings = [],
    mappingsLoading = false,
    onDeleteMapping,
    // Story 7.12 AC#11: Color theme selector (Story 7.17: 'normal' is default)
    colorTheme = 'normal',
    onSetColorTheme,
}) => {
    // Story 7.12: Theme-aware styling using CSS variables (AC #4, #8)
    const isDark = theme === 'dark';

    // Card styling using CSS variables
    const cardStyle: React.CSSProperties = {
        backgroundColor: 'var(--surface)',
        borderColor: isDark ? '#334155' : '#e2e8f0',
    };

    // Toggle container styling (matches ChartModeToggle pattern - AC #4)
    const toggleContainerStyle: React.CSSProperties = {
        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
        borderColor: isDark ? '#475569' : '#cbd5e1',
    };

    // Toggle button styling (matches ChartModeToggle - AC #4)
    const getToggleButtonStyle = (isActive: boolean): React.CSSProperties => ({
        backgroundColor: isActive ? 'var(--accent)' : 'transparent',
        color: isActive ? '#ffffff' : 'var(--secondary)',
        transition: 'all 0.2s ease',
    });

    return (
        <div className="pb-24 space-y-4">
            {/* Header with consistent typography (AC #8) */}
            <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--primary)' }}>{t('settings')}</h1>

            {/* Language setting with toggle matching ChartModeToggle (AC #4) */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--primary)' }}>
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

            {/* Currency setting */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--primary)' }}>
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

            {/* Date format setting */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--primary)' }}>
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

            {/* Theme setting */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--primary)' }}>
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

            {/* Story 7.12 AC#11: Color theme selector (Story 7.17: renamed themes) */}
            {onSetColorTheme && (
                <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                    <div className="flex gap-2 items-center" style={{ color: 'var(--primary)' }}>
                        <Palette size={24} strokeWidth={2} /> {t('colorTheme')}
                    </div>
                    <div className="flex rounded-lg p-1 border" style={toggleContainerStyle}>
                        <button
                            onClick={() => onSetColorTheme('normal')}
                            className="min-h-11 px-3 rounded-md flex items-center justify-center font-medium text-sm"
                            style={getToggleButtonStyle(colorTheme === 'normal')}
                        >
                            {t('colorThemeNormal')}
                        </button>
                        <button
                            onClick={() => onSetColorTheme('professional')}
                            className="min-h-11 px-3 rounded-md flex items-center justify-center font-medium text-sm"
                            style={getToggleButtonStyle(colorTheme === 'professional')}
                        >
                            {t('colorThemeProfessional')}
                        </button>
                    </div>
                </div>
            )}

            {/* Story 6.5: Learned Categories Section */}
            <div className="p-4 rounded-xl border" style={cardStyle}>
                <div className="flex gap-2 items-center mb-4">
                    <BookMarked size={24} strokeWidth={2} style={{ color: 'var(--accent)' }} />
                    <span className="font-medium" style={{ color: 'var(--primary)' }}>{t('learnedCategories')}</span>
                </div>
                {onDeleteMapping && (
                    <CategoryMappingsList
                        mappings={mappings}
                        loading={mappingsLoading}
                        onDeleteMapping={onDeleteMapping}
                        t={t}
                        theme={theme as 'light' | 'dark'}
                    />
                )}
            </div>

            {/* Download data action button */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--primary)' }}>
                    <Download size={24} strokeWidth={2} /> {t('downloadAllData')}
                </div>
                <button
                    onClick={onExportAll}
                    disabled={exporting}
                    aria-label={t('downloadAllData') + ' as CSV'}
                    aria-busy={exporting}
                    className="min-h-11 flex items-center justify-center gap-2 px-4 rounded-lg font-bold text-sm transition-colors"
                    style={{
                        backgroundColor: exporting
                            ? (isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)')
                            : (isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.2)'),
                        color: exporting ? 'var(--secondary)' : 'var(--accent)',
                        cursor: exporting ? 'not-allowed' : 'pointer',
                    }}
                >
                    {exporting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('exportingData')}
                        </>
                    ) : (
                        'CSV'
                    )}
                </button>
            </div>

            {/* Wipe data action button */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--error)' }}>
                    <Trash2 size={24} strokeWidth={2} /> {t('wipe')}
                </div>
                <button
                    onClick={onWipeDB}
                    className="min-h-11 px-4 rounded-lg font-bold text-sm flex items-center justify-center transition-colors"
                    style={{
                        backgroundColor: isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                        color: 'var(--error)',
                    }}
                >
                    {wiping ? '...' : t('wipe')}
                </button>
            </div>

            {/* Sign out action button */}
            <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                <div className="flex gap-2 items-center" style={{ color: 'var(--secondary)' }}>
                    <ArrowRightLeft size={24} strokeWidth={2} /> {t('signout')}
                </div>
                <button
                    onClick={onSignOut}
                    className="min-h-11 px-4 rounded-lg font-bold text-sm flex items-center justify-center transition-colors"
                    style={{
                        backgroundColor: isDark ? '#334155' : '#e2e8f0',
                        color: 'var(--primary)',
                    }}
                >
                    {t('signout')}
                </button>
            </div>
        </div>
    );
};
