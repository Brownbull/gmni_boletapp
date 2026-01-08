/**
 * SettingsView
 * Story 14.22: Hierarchical settings with sub-views
 *
 * Main menu shows 8 navigation items, each opening a dedicated sub-view.
 * Maintains all existing functionality while reorganizing into a cleaner hierarchy.
 */

import React, { useState } from 'react';
import { CategoryMapping } from '../types/categoryMapping';
import { MerchantMapping } from '../types/merchantMapping';
import { SubcategoryMapping } from '../types/subcategoryMapping';
import { TrustedMerchant } from '../types/trust';
import { SupportedCurrency } from '../services/userPreferencesService';
import { Firestore } from 'firebase/firestore';
import { SettingsSubView } from '../types/settings';
import {
    SettingsMenuItem,
    LimitesView,
    PerfilView,
    PreferenciasView,
    EscaneoView,
    SuscripcionView,
    DatosAprendidosView,
    AppView,
    CuentaView,
} from '../components/settings';

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
    // Category mappings
    mappings?: CategoryMapping[];
    mappingsLoading?: boolean;
    onDeleteMapping?: (mappingId: string) => Promise<void>;
    onEditMapping?: (mappingId: string, newCategory: string) => Promise<void>;
    // Color theme
    colorTheme?: string;
    onSetColorTheme?: (colorTheme: string) => void;
    // Font color mode
    fontColorMode?: string;
    onSetFontColorMode?: (mode: string) => void;
    // Font family
    fontFamily?: string;
    onSetFontFamily?: (family: string) => void;
    // Default location
    defaultCountry?: string;
    defaultCity?: string;
    onSetDefaultCountry?: (country: string) => void;
    onSetDefaultCity?: (city: string) => void;
    // Merchant mappings
    merchantMappings?: MerchantMapping[];
    merchantMappingsLoading?: boolean;
    onDeleteMerchantMapping?: (mappingId: string) => Promise<void>;
    onEditMerchantMapping?: (mappingId: string, newTarget: string) => Promise<void>;
    // Default scan currency
    defaultScanCurrency?: SupportedCurrency;
    onSetDefaultScanCurrency?: (currency: SupportedCurrency) => void;
    // Subcategory mappings
    subcategoryMappings?: SubcategoryMapping[];
    subcategoryMappingsLoading?: boolean;
    onDeleteSubcategoryMapping?: (mappingId: string) => Promise<void>;
    onUpdateSubcategoryMapping?: (mappingId: string, newSubcategory: string) => Promise<void>;
    // Push notifications
    db?: Firestore | null;
    userId?: string | null;
    appId?: string | null;
    onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
    // Trusted merchants
    trustedMerchants?: TrustedMerchant[];
    trustedMerchantsLoading?: boolean;
    onRevokeTrust?: (merchantName: string) => Promise<void>;
    // Clear all learned data
    onClearAllLearnedData?: () => Promise<void>;
    // Story 14.22: Profile editing
    userEmail?: string;
    displayName?: string;
    phoneNumber?: string;
    birthDate?: string;
    onSetDisplayName?: (name: string) => void;
    onSetPhoneNumber?: (phone: string) => void;
    onSetBirthDate?: (date: string) => void;
    // Story 14.22: Subscription info
    plan?: 'freemium' | 'pro' | 'business';
    creditsRemaining?: number;
    superCreditsRemaining?: number;
    daysUntilReset?: number;
    // Story 14.22: Controlled navigation state for breadcrumb in TopHeader
    currentSubview?: SettingsSubView;
    onSubviewChange?: (subview: SettingsSubView) => void;
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
    mappings = [],
    mappingsLoading = false,
    onDeleteMapping,
    onEditMapping,
    colorTheme = 'normal',
    onSetColorTheme,
    fontColorMode = 'colorful',
    onSetFontColorMode,
    fontFamily = 'outfit',
    onSetFontFamily,
    defaultCountry = '',
    defaultCity = '',
    onSetDefaultCountry,
    onSetDefaultCity,
    merchantMappings = [],
    merchantMappingsLoading = false,
    onDeleteMerchantMapping,
    onEditMerchantMapping,
    defaultScanCurrency = 'CLP',
    onSetDefaultScanCurrency,
    subcategoryMappings = [],
    subcategoryMappingsLoading = false,
    onDeleteSubcategoryMapping,
    onUpdateSubcategoryMapping,
    db = null,
    userId = null,
    appId = null,
    onShowToast,
    trustedMerchants = [],
    trustedMerchantsLoading = false,
    onRevokeTrust,
    onClearAllLearnedData,
    userEmail = '',
    displayName = '',
    phoneNumber = '',
    birthDate = '',
    onSetDisplayName,
    onSetPhoneNumber,
    onSetBirthDate,
    plan = 'freemium',
    creditsRemaining = 0,
    superCreditsRemaining = 0,
    daysUntilReset = 15,
    currentSubview,
    onSubviewChange,
}) => {
    // Story 14.22 AC #1: Navigation state for hierarchical menu
    // Use controlled state if provided, otherwise use internal state
    const [internalView, setInternalView] = useState<SettingsSubView>('main');
    const currentView = currentSubview ?? internalView;
    const setCurrentView = (view: SettingsSubView) => {
        if (onSubviewChange) {
            onSubviewChange(view);
        } else {
            setInternalView(view);
        }
    };

    // Render the appropriate sub-view based on current navigation state
    const renderSubView = () => {
        switch (currentView) {
            case 'limites':
                return <LimitesView t={t} lang={lang} theme={theme} />;

            case 'perfil':
                return (
                    <PerfilView
                        t={t}
                        theme={theme}
                        displayName={displayName}
                        email={userEmail}
                        phoneNumber={phoneNumber}
                        birthDate={birthDate}
                        onSetDisplayName={onSetDisplayName}
                        onSetPhoneNumber={onSetPhoneNumber}
                        onSetBirthDate={onSetBirthDate}
                        onShowToast={onShowToast}
                    />
                );

            case 'preferencias':
                return (
                    <PreferenciasView
                        t={t}
                        theme={theme}
                        lang={lang}
                        currency={currency}
                        dateFormat={dateFormat}
                        colorTheme={colorTheme}
                        fontColorMode={fontColorMode}
                        fontFamily={fontFamily}
                        onSetLang={onSetLang}
                        onSetCurrency={onSetCurrency}
                        onSetDateFormat={onSetDateFormat}
                        onSetTheme={onSetTheme}
                        onSetColorTheme={onSetColorTheme}
                        onSetFontColorMode={onSetFontColorMode}
                        onSetFontFamily={onSetFontFamily}
                    />
                );

            case 'escaneo':
                return (
                    <EscaneoView
                        t={t}
                        theme={theme}
                        defaultScanCurrency={defaultScanCurrency}
                        defaultCountry={defaultCountry}
                        defaultCity={defaultCity}
                        onSetDefaultScanCurrency={onSetDefaultScanCurrency}
                        onSetDefaultCountry={onSetDefaultCountry}
                        onSetDefaultCity={onSetDefaultCity}
                    />
                );

            case 'suscripcion':
                return (
                    <SuscripcionView
                        t={t}
                        lang={lang}
                        theme={theme}
                        plan={plan}
                        creditsRemaining={creditsRemaining}
                        superCreditsRemaining={superCreditsRemaining}
                        daysUntilReset={daysUntilReset}
                    />
                );

            case 'datos':
                return (
                    <DatosAprendidosView
                        t={t}
                        theme={theme}
                        mappings={mappings}
                        mappingsLoading={mappingsLoading}
                        onDeleteMapping={onDeleteMapping}
                        onEditMapping={onEditMapping}
                        merchantMappings={merchantMappings}
                        merchantMappingsLoading={merchantMappingsLoading}
                        onDeleteMerchantMapping={onDeleteMerchantMapping}
                        onEditMerchantMapping={onEditMerchantMapping}
                        subcategoryMappings={subcategoryMappings}
                        subcategoryMappingsLoading={subcategoryMappingsLoading}
                        onDeleteSubcategoryMapping={onDeleteSubcategoryMapping}
                        onUpdateSubcategoryMapping={onUpdateSubcategoryMapping}
                        trustedMerchants={trustedMerchants}
                        trustedMerchantsLoading={trustedMerchantsLoading}
                        onRevokeTrust={onRevokeTrust}
                        onClearAllLearnedData={onClearAllLearnedData}
                    />
                );

            case 'app':
                return (
                    <AppView
                        t={t}
                        theme={theme}
                        db={db}
                        userId={userId}
                        appId={appId}
                        onShowToast={onShowToast}
                    />
                );

            case 'cuenta':
                return (
                    <CuentaView
                        t={t}
                        theme={theme}
                        wiping={wiping}
                        exporting={exporting}
                        onExportAll={onExportAll}
                        onWipeDB={onWipeDB}
                        onSignOut={onSignOut}
                    />
                );

            default:
                return null;
        }
    };

    // Main menu view
    if (currentView === 'main') {
        return (
            <div className="pb-4 space-y-3">
                {/* Story 14.22: Header removed - TopHeader handles title with profile avatar */}

                {/* Menu Items - Story 14.22 AC #2 - colors from mockup settings.html */}
                <SettingsMenuItem
                    title={t('settingsLimites')}
                    subtitle={t('settingsLimitesDesc')}
                    icon="circle-alert"
                    iconBgColor="#fef2f2"
                    iconColor="#ef4444"
                    onClick={() => setCurrentView('limites')}
                    testId="settings-menu-limites"
                />

                <SettingsMenuItem
                    title={t('settingsPerfil')}
                    subtitle={t('settingsPerfilDesc')}
                    icon="user"
                    iconBgColor="var(--primary-light)"
                    iconColor="var(--primary)"
                    onClick={() => setCurrentView('perfil')}
                    testId="settings-menu-perfil"
                />

                <SettingsMenuItem
                    title={t('settingsPreferencias')}
                    subtitle={t('settingsPreferenciasDesc')}
                    icon="settings"
                    iconBgColor="#e0e7ff"
                    iconColor="#6366f1"
                    onClick={() => setCurrentView('preferencias')}
                    testId="settings-menu-preferencias"
                />

                <SettingsMenuItem
                    title={t('settingsEscaneo')}
                    subtitle={t('settingsEscaneoDesc')}
                    icon="camera"
                    iconBgColor="#dbeafe"
                    iconColor="#3b82f6"
                    onClick={() => setCurrentView('escaneo')}
                    testId="settings-menu-escaneo"
                />

                <SettingsMenuItem
                    title={t('settingsSuscripcion')}
                    subtitle={t('settingsSuscripcionDesc')}
                    icon="credit-card"
                    iconBgColor="#dcfce7"
                    iconColor="#22c55e"
                    onClick={() => setCurrentView('suscripcion')}
                    testId="settings-menu-suscripcion"
                />

                <SettingsMenuItem
                    title={t('settingsDatos')}
                    subtitle={t('settingsDatosDesc')}
                    icon="book-open"
                    iconBgColor="#fef3c7"
                    iconColor="#f59e0b"
                    onClick={() => setCurrentView('datos')}
                    testId="settings-menu-datos"
                />

                <SettingsMenuItem
                    title={t('settingsApp')}
                    subtitle={t('settingsAppDesc')}
                    icon="smartphone"
                    iconBgColor="#f3e8ff"
                    iconColor="#a855f7"
                    onClick={() => setCurrentView('app')}
                    testId="settings-menu-app"
                />

                <SettingsMenuItem
                    title={t('settingsCuenta')}
                    subtitle={t('settingsCuentaDesc')}
                    icon="database"
                    iconBgColor="#fce7f3"
                    iconColor="#ec4899"
                    onClick={() => setCurrentView('cuenta')}
                    testId="settings-menu-cuenta"
                />
            </div>
        );
    }

    // Render the active sub-view
    return <div className="pb-4">{renderSubView()}</div>;
};
