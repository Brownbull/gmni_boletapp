import React from 'react';
import { Globe, DollarSign, Calendar, Moon, Palette, Download, Trash2, ArrowRightLeft, Loader2, BookMarked, MapPin, Store, Receipt, Tag, Handshake } from 'lucide-react';
import { CategoryMappingsList } from '../components/CategoryMappingsList';
import { MerchantMappingsList } from '../components/MerchantMappingsList';
import { SubcategoryMappingsList } from '../components/SubcategoryMappingsList';
// Story 11.4: Trusted Merchants list component
import { TrustedMerchantsList } from '../components/TrustedMerchantsList';
import { PWASettingsSection } from '../components/PWASettingsSection';
import { NotificationSettings } from '../components/NotificationSettings';
import { CategoryMapping } from '../types/categoryMapping';
import { MerchantMapping } from '../types/merchantMapping';
import { SubcategoryMapping } from '../types/subcategoryMapping';
// Story 11.4: Trusted merchant type
import { TrustedMerchant } from '../types/trust';
import { LocationSelect } from '../components/LocationSelect';
import { SupportedCurrency, SUPPORTED_CURRENCIES } from '../services/userPreferencesService';
import { Firestore } from 'firebase/firestore';

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
    // Story 9.7 enhancement: Edit functionality added
    mappings?: CategoryMapping[];
    mappingsLoading?: boolean;
    onDeleteMapping?: (mappingId: string) => Promise<void>;
    onEditMapping?: (mappingId: string, newCategory: string) => Promise<void>;
    // Story 7.12 AC#11: Color theme selector
    colorTheme?: string;
    onSetColorTheme?: (colorTheme: string) => void;
    // Story 9.3: Default location settings
    defaultCountry?: string;
    defaultCity?: string;
    onSetDefaultCountry?: (country: string) => void;
    onSetDefaultCity?: (city: string) => void;
    // Story 9.7: Merchant mappings management
    merchantMappings?: MerchantMapping[];
    merchantMappingsLoading?: boolean;
    onDeleteMerchantMapping?: (mappingId: string) => Promise<void>;
    onEditMerchantMapping?: (mappingId: string, newTarget: string) => Promise<void>;
    // Story 9.8: Default scan currency setting
    defaultScanCurrency?: SupportedCurrency;
    onSetDefaultScanCurrency?: (currency: SupportedCurrency) => void;
    // Story 9.15: Subcategory mappings management
    subcategoryMappings?: SubcategoryMapping[];
    subcategoryMappingsLoading?: boolean;
    onDeleteSubcategoryMapping?: (mappingId: string) => Promise<void>;
    onUpdateSubcategoryMapping?: (mappingId: string, newSubcategory: string) => Promise<void>;
    // Story 9.18: Push notifications settings
    db?: Firestore | null;
    userId?: string | null;
    appId?: string | null;
    onShowToast?: (message: string) => void;
    // Story 11.4: Trusted merchants management (AC #6, #7)
    trustedMerchants?: TrustedMerchant[];
    trustedMerchantsLoading?: boolean;
    onRevokeTrust?: (merchantName: string) => Promise<void>;
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
    // Story 9.7 enhancement: Edit functionality added
    mappings = [],
    mappingsLoading = false,
    onDeleteMapping,
    onEditMapping,
    // Story 7.12 AC#11: Color theme selector (Story 7.17: 'normal' is default)
    colorTheme = 'normal',
    onSetColorTheme,
    // Story 9.3: Default location settings
    defaultCountry = '',
    defaultCity = '',
    onSetDefaultCountry,
    onSetDefaultCity,
    // Story 9.7: Merchant mappings management
    merchantMappings = [],
    merchantMappingsLoading = false,
    onDeleteMerchantMapping,
    onEditMerchantMapping,
    // Story 9.8: Default scan currency setting
    defaultScanCurrency = 'CLP',
    onSetDefaultScanCurrency,
    // Story 9.15: Subcategory mappings management
    subcategoryMappings = [],
    subcategoryMappingsLoading = false,
    onDeleteSubcategoryMapping,
    onUpdateSubcategoryMapping,
    // Story 9.18: Push notifications settings
    db = null,
    userId = null,
    appId = null,
    onShowToast,
    // Story 11.4: Trusted merchants management (AC #6, #7)
    trustedMerchants = [],
    trustedMerchantsLoading = false,
    onRevokeTrust,
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

            {/* Story 7.12 AC#11: Color theme selector
                Story 14.12: Added 'mono' option as default, changed to dropdown */}
            {onSetColorTheme && (
                <div className="p-4 rounded-xl border flex justify-between items-center" style={cardStyle}>
                    <div className="flex gap-2 items-center" style={{ color: 'var(--primary)' }}>
                        <Palette size={24} strokeWidth={2} /> {t('colorTheme')}
                    </div>
                    <select
                        value={colorTheme}
                        onChange={(e) => onSetColorTheme(e.target.value)}
                        className="min-h-11 px-3 rounded-lg font-medium text-sm border"
                        style={{
                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                            borderColor: isDark ? '#475569' : '#e2e8f0',
                            color: 'var(--primary)',
                        }}
                        aria-label={t('colorTheme')}
                    >
                        <option value="mono">{t('colorThemeMono')}</option>
                        <option value="normal">{t('colorThemeNormal')}</option>
                        <option value="professional">{t('colorThemeProfessional')}</option>
                    </select>
                </div>
            )}

            {/* Story 9.8 AC#3: Default Scan Currency Setting */}
            {onSetDefaultScanCurrency && (
                <div className="p-4 rounded-xl border" style={cardStyle}>
                    <div className="flex gap-2 items-center mb-2" style={{ color: 'var(--primary)' }}>
                        <Receipt size={24} strokeWidth={2} /> {t('defaultScanCurrency')}
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--secondary)' }}>
                        {t('defaultScanCurrencyHint')}
                    </p>
                    <select
                        value={defaultScanCurrency}
                        onChange={(e) => onSetDefaultScanCurrency(e.target.value as SupportedCurrency)}
                        className="w-full p-3 border rounded-lg text-sm"
                        style={{
                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                            borderColor: isDark ? '#475569' : '#e2e8f0',
                            color: 'var(--primary)',
                        }}
                        aria-label={t('defaultScanCurrency')}
                    >
                        {SUPPORTED_CURRENCIES.map((curr) => (
                            <option key={curr} value={curr}>
                                {t(`currency${curr.charAt(0) + curr.slice(1).toLowerCase()}`)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Story 9.3: Default Location Settings */}
            {onSetDefaultCountry && onSetDefaultCity && (
                <div className="p-4 rounded-xl border" style={cardStyle}>
                    <div className="flex gap-2 items-center mb-2" style={{ color: 'var(--primary)' }}>
                        <MapPin size={24} strokeWidth={2} /> {t('defaultLocation')}
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--secondary)' }}>
                        {t('defaultLocationHint')}
                    </p>
                    <LocationSelect
                        country={defaultCountry}
                        city={defaultCity}
                        onCountryChange={onSetDefaultCountry}
                        onCityChange={onSetDefaultCity}
                        inputStyle={{
                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                            borderColor: isDark ? '#475569' : '#e2e8f0',
                            color: 'var(--primary)',
                        }}
                    />
                </div>
            )}

            {/* Story 6.5: Learned Categories Section (Story 9.7 enhancement: edit added) */}
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
                        onEditMapping={onEditMapping}
                        t={t}
                        theme={theme as 'light' | 'dark'}
                    />
                )}
            </div>

            {/* Story 9.7: Learned Merchants Section */}
            <div className="p-4 rounded-xl border" style={cardStyle}>
                <div className="flex gap-2 items-center mb-4">
                    <Store size={24} strokeWidth={2} style={{ color: 'var(--accent)' }} />
                    <span className="font-medium" style={{ color: 'var(--primary)' }}>{t('learnedMerchants')}</span>
                </div>
                {onDeleteMerchantMapping && onEditMerchantMapping && (
                    <MerchantMappingsList
                        mappings={merchantMappings}
                        loading={merchantMappingsLoading}
                        onDeleteMapping={onDeleteMerchantMapping}
                        onEditMapping={onEditMerchantMapping}
                        t={t}
                        theme={theme as 'light' | 'dark'}
                    />
                )}
            </div>

            {/* Story 9.15: Learned Subcategories Section */}
            <div className="p-4 rounded-xl border" style={cardStyle}>
                <div className="flex gap-2 items-center mb-4">
                    <Tag size={24} strokeWidth={2} style={{ color: '#10b981' }} />
                    <span className="font-medium" style={{ color: 'var(--primary)' }}>{t('learnedSubcategories')}</span>
                </div>
                {onDeleteSubcategoryMapping && onUpdateSubcategoryMapping && (
                    <SubcategoryMappingsList
                        mappings={subcategoryMappings}
                        loading={subcategoryMappingsLoading}
                        onDeleteMapping={onDeleteSubcategoryMapping}
                        onUpdateMapping={onUpdateSubcategoryMapping}
                        t={t}
                        theme={theme as 'light' | 'dark'}
                    />
                )}
            </div>

            {/* Story 11.4: Trusted Merchants Section (AC #6, #7) */}
            <div className="p-4 rounded-xl border" style={cardStyle}>
                <div className="flex gap-2 items-center mb-4">
                    <Handshake size={24} strokeWidth={2} style={{ color: 'var(--accent)' }} />
                    <span className="font-medium" style={{ color: 'var(--primary)' }}>{t('trustedMerchants')}</span>
                </div>
                {onRevokeTrust && (
                    <TrustedMerchantsList
                        merchants={trustedMerchants}
                        loading={trustedMerchantsLoading}
                        onRevokeTrust={onRevokeTrust}
                        t={t}
                        theme={theme as 'light' | 'dark'}
                    />
                )}
            </div>

            {/* Story 9.14: PWA Installation Section */}
            <PWASettingsSection t={t} theme={theme as 'light' | 'dark'} />

            {/* Story 9.18: Push Notifications Settings */}
            <NotificationSettings
                t={t}
                theme={theme as 'light' | 'dark'}
                db={db}
                userId={userId}
                appId={appId}
                onShowToast={onShowToast}
            />

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
