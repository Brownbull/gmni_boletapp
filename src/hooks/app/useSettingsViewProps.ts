/**
 * Story 14c-refactor.34b: useSettingsViewProps Hook
 *
 * Composes all data props needed for SettingsView from App.tsx state.
 * This hook receives ALL data as options and does NOT call other hooks internally.
 *
 * Architecture:
 * - Handlers come from ViewHandlersContext (story 14c-refactor.25)
 * - Data props are composed by this hook
 * - SettingsView receives both: spread props + useViewHandlers()
 *
 * SettingsView manages:
 * - User preferences (theme, language, currency, date format)
 * - Category mappings CRUD
 * - Merchant mappings CRUD
 * - Subcategory mappings CRUD
 * - Item name mappings CRUD
 * - Trusted merchants management
 * - Export functionality
 * - Profile settings
 * - Subscription info
 *
 * @example
 * ```tsx
 * function App() {
 *   const settingsProps = useSettingsViewProps({
 *     lang,
 *     currency,
 *     theme,
 *     // ... all other data
 *   });
 *
 *   return <SettingsView {...settingsProps} />;
 * }
 * ```
 */

import { useMemo } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { CategoryMapping } from '../../types/categoryMapping';
import type { MerchantMapping } from '../../types/merchantMapping';
import type { SubcategoryMapping } from '../../types/subcategoryMapping';
import type { ItemNameMapping } from '../../types/itemNameMapping';
import type { TrustedMerchant } from '../../types/trust';
import type { SettingsSubView } from '../../types/settings';
import type { SupportedCurrency, ForeignLocationDisplayFormat } from '../../services/userPreferencesService';

// =============================================================================
// Types
// =============================================================================

/**
 * Props passed to useSettingsViewProps hook.
 * All data comes from App.tsx state - no internal hook calls.
 */
export interface UseSettingsViewPropsOptions {
    // Core settings
    /** Current language */
    lang: string;
    /** Current currency */
    currency: string;
    /** Current date format */
    dateFormat: string;
    /** Current theme */
    theme: string;
    /** Whether data wipe is in progress */
    wiping: boolean;
    /** Whether export is in progress */
    exporting: boolean;
    /** Translation function */
    t: (key: string) => string;

    // Category mappings
    /** Category mappings list */
    mappings: CategoryMapping[];
    /** Whether mappings are loading */
    mappingsLoading: boolean;
    /** Delete category mapping callback */
    onDeleteMapping: (mappingId: string) => Promise<void>;
    /** Edit category mapping callback */
    onEditMapping: (mappingId: string, newCategory: string) => Promise<void>;

    // Color theme
    /** Current color theme */
    colorTheme: string;
    /** Set color theme callback */
    onSetColorTheme: (colorTheme: string) => void;

    // Font color mode
    /** Current font color mode */
    fontColorMode: string;
    /** Set font color mode callback */
    onSetFontColorMode: (mode: string) => void;

    // Font family
    /** Current font family */
    fontFamily: string;
    /** Set font family callback */
    onSetFontFamily: (family: string) => void;

    // Font size
    /** Current font size */
    fontSize: string;
    /** Set font size callback */
    onSetFontSize: (size: string) => void;

    // Default location
    /** Default country */
    defaultCountry: string;
    /** Default city */
    defaultCity: string;
    /** Set default country callback */
    onSetDefaultCountry: (country: string) => void;
    /** Set default city callback */
    onSetDefaultCity: (city: string) => void;

    // Merchant mappings
    /** Merchant mappings list */
    merchantMappings: MerchantMapping[];
    /** Whether merchant mappings are loading */
    merchantMappingsLoading: boolean;
    /** Delete merchant mapping callback */
    onDeleteMerchantMapping: (mappingId: string) => Promise<void>;
    /** Edit merchant mapping callback */
    onEditMerchantMapping: (mappingId: string, newTarget: string) => Promise<void>;

    // Default scan currency
    /** Default scan currency */
    defaultScanCurrency: SupportedCurrency;
    /** Set default scan currency callback */
    onSetDefaultScanCurrency: (currency: SupportedCurrency) => void;

    // Foreign location format
    /** Foreign location display format */
    foreignLocationFormat: ForeignLocationDisplayFormat;
    /** Set foreign location format callback */
    onSetForeignLocationFormat: (format: ForeignLocationDisplayFormat) => void;

    // Subcategory mappings
    /** Subcategory mappings list */
    subcategoryMappings: SubcategoryMapping[];
    /** Whether subcategory mappings are loading */
    subcategoryMappingsLoading: boolean;
    /** Delete subcategory mapping callback */
    onDeleteSubcategoryMapping: (mappingId: string) => Promise<void>;
    /** Update subcategory mapping callback */
    onUpdateSubcategoryMapping: (mappingId: string, newSubcategory: string) => Promise<void>;

    // Firebase context (for push notifications)
    /** Firestore instance */
    db: Firestore | null;
    /** User ID */
    userId: string | null;
    /** App ID */
    appId: string | null;

    // Trusted merchants
    /** Trusted merchants list */
    trustedMerchants: TrustedMerchant[];
    /** Whether trusted merchants are loading */
    trustedMerchantsLoading: boolean;
    /** Revoke trust callback */
    onRevokeTrust: (merchantName: string) => Promise<void>;

    // Item name mappings
    /** Item name mappings list */
    itemNameMappings: ItemNameMapping[];
    /** Whether item name mappings are loading */
    itemNameMappingsLoading: boolean;
    /** Delete item name mapping callback */
    onDeleteItemNameMapping: (mappingId: string) => Promise<void>;
    /** Update item name mapping callback */
    onUpdateItemNameMapping: (mappingId: string, newTarget: string) => Promise<void>;

    // Clear all learned data
    /** Clear all learned data callback */
    onClearAllLearnedData: () => Promise<void>;

    // Profile editing
    /** User email */
    userEmail: string;
    /** Display name */
    displayName: string;
    /** Phone number */
    phoneNumber: string;
    /** Birth date */
    birthDate: string;
    /** Set display name callback */
    onSetDisplayName: (name: string) => void;
    /** Set phone number callback */
    onSetPhoneNumber: (phone: string) => void;
    /** Set birth date callback */
    onSetBirthDate: (date: string) => void;

    // Subscription info
    /** Current plan */
    plan: 'freemium' | 'pro' | 'business';
    /** Credits remaining */
    creditsRemaining: number;
    /** Super credits remaining */
    superCreditsRemaining: number;

    // Controlled subview state
    /** Current subview */
    currentSubview: SettingsSubView;
    /** Subview change callback */
    onSubviewChange: (subview: SettingsSubView) => void;

    // Preference callbacks
    /** Set language callback */
    onSetLang: (lang: string) => void;
    /** Set currency callback */
    onSetCurrency: (currency: string) => void;
    /** Set date format callback */
    onSetDateFormat: (format: string) => void;
    /** Set theme callback */
    onSetTheme: (theme: string) => void;
    /** Export all data callback */
    onExportAll: () => void;
    /** Wipe database callback */
    onWipeDB: () => Promise<void>;
    /** Sign out callback */
    onSignOut: () => void;
}

/**
 * Data props returned by useSettingsViewProps.
 * Matches SettingsViewProps interface from SettingsView.tsx
 */
export interface SettingsViewDataProps {
    // Core settings
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
    mappings: CategoryMapping[];
    mappingsLoading: boolean;
    onDeleteMapping: (mappingId: string) => Promise<void>;
    onEditMapping: (mappingId: string, newCategory: string) => Promise<void>;

    // Color theme
    colorTheme: string;
    onSetColorTheme: (colorTheme: string) => void;

    // Font color mode
    fontColorMode: string;
    onSetFontColorMode: (mode: string) => void;

    // Font family
    fontFamily: string;
    onSetFontFamily: (family: string) => void;

    // Font size
    fontSize: string;
    onSetFontSize: (size: string) => void;

    // Default location
    defaultCountry: string;
    defaultCity: string;
    onSetDefaultCountry: (country: string) => void;
    onSetDefaultCity: (city: string) => void;

    // Merchant mappings
    merchantMappings: MerchantMapping[];
    merchantMappingsLoading: boolean;
    onDeleteMerchantMapping: (mappingId: string) => Promise<void>;
    onEditMerchantMapping: (mappingId: string, newTarget: string) => Promise<void>;

    // Default scan currency
    defaultScanCurrency: SupportedCurrency;
    onSetDefaultScanCurrency: (currency: SupportedCurrency) => void;

    // Foreign location format
    foreignLocationFormat: ForeignLocationDisplayFormat;
    onSetForeignLocationFormat: (format: ForeignLocationDisplayFormat) => void;

    // Subcategory mappings
    subcategoryMappings: SubcategoryMapping[];
    subcategoryMappingsLoading: boolean;
    onDeleteSubcategoryMapping: (mappingId: string) => Promise<void>;
    onUpdateSubcategoryMapping: (mappingId: string, newSubcategory: string) => Promise<void>;

    // Firebase context
    db: Firestore | null;
    userId: string | null;
    appId: string | null;

    // Trusted merchants
    trustedMerchants: TrustedMerchant[];
    trustedMerchantsLoading: boolean;
    onRevokeTrust: (merchantName: string) => Promise<void>;

    // Item name mappings
    itemNameMappings: ItemNameMapping[];
    itemNameMappingsLoading: boolean;
    onDeleteItemNameMapping: (mappingId: string) => Promise<void>;
    onUpdateItemNameMapping: (mappingId: string, newTarget: string) => Promise<void>;

    // Clear all learned data
    onClearAllLearnedData: () => Promise<void>;

    // Profile editing
    userEmail: string;
    displayName: string;
    phoneNumber: string;
    birthDate: string;
    onSetDisplayName: (name: string) => void;
    onSetPhoneNumber: (phone: string) => void;
    onSetBirthDate: (date: string) => void;

    // Subscription info
    plan: 'freemium' | 'pro' | 'business';
    creditsRemaining: number;
    superCreditsRemaining: number;

    // Controlled subview state
    currentSubview: SettingsSubView;
    onSubviewChange: (subview: SettingsSubView) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useSettingsViewProps - Composes data props for SettingsView.
 *
 * CRITICAL: This hook does NOT call other hooks internally.
 * All data comes from the options parameter.
 *
 * @param options - All data needed to compose props
 * @returns SettingsViewDataProps - Data props for the view
 */
export function useSettingsViewProps(
    options: UseSettingsViewPropsOptions
): SettingsViewDataProps {
    const {
        // Core settings
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

        // Category mappings
        mappings,
        mappingsLoading,
        onDeleteMapping,
        onEditMapping,

        // Color theme
        colorTheme,
        onSetColorTheme,

        // Font color mode
        fontColorMode,
        onSetFontColorMode,

        // Font family
        fontFamily,
        onSetFontFamily,

        // Font size
        fontSize,
        onSetFontSize,

        // Default location
        defaultCountry,
        defaultCity,
        onSetDefaultCountry,
        onSetDefaultCity,

        // Merchant mappings
        merchantMappings,
        merchantMappingsLoading,
        onDeleteMerchantMapping,
        onEditMerchantMapping,

        // Default scan currency
        defaultScanCurrency,
        onSetDefaultScanCurrency,

        // Foreign location format
        foreignLocationFormat,
        onSetForeignLocationFormat,

        // Subcategory mappings
        subcategoryMappings,
        subcategoryMappingsLoading,
        onDeleteSubcategoryMapping,
        onUpdateSubcategoryMapping,

        // Firebase context
        db,
        userId,
        appId,

        // Trusted merchants
        trustedMerchants,
        trustedMerchantsLoading,
        onRevokeTrust,

        // Item name mappings
        itemNameMappings,
        itemNameMappingsLoading,
        onDeleteItemNameMapping,
        onUpdateItemNameMapping,

        // Clear all learned data
        onClearAllLearnedData,

        // Profile editing
        userEmail,
        displayName,
        phoneNumber,
        birthDate,
        onSetDisplayName,
        onSetPhoneNumber,
        onSetBirthDate,

        // Subscription info
        plan,
        creditsRemaining,
        superCreditsRemaining,

        // Controlled subview state
        currentSubview,
        onSubviewChange,
    } = options;

    return useMemo<SettingsViewDataProps>(
        () => ({
            // Core settings
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

            // Category mappings
            mappings,
            mappingsLoading,
            onDeleteMapping,
            onEditMapping,

            // Color theme
            colorTheme,
            onSetColorTheme,

            // Font color mode
            fontColorMode,
            onSetFontColorMode,

            // Font family
            fontFamily,
            onSetFontFamily,

            // Font size
            fontSize,
            onSetFontSize,

            // Default location
            defaultCountry,
            defaultCity,
            onSetDefaultCountry,
            onSetDefaultCity,

            // Merchant mappings
            merchantMappings,
            merchantMappingsLoading,
            onDeleteMerchantMapping,
            onEditMerchantMapping,

            // Default scan currency
            defaultScanCurrency,
            onSetDefaultScanCurrency,

            // Foreign location format
            foreignLocationFormat,
            onSetForeignLocationFormat,

            // Subcategory mappings
            subcategoryMappings,
            subcategoryMappingsLoading,
            onDeleteSubcategoryMapping,
            onUpdateSubcategoryMapping,

            // Firebase context
            db,
            userId,
            appId,

            // Trusted merchants
            trustedMerchants,
            trustedMerchantsLoading,
            onRevokeTrust,

            // Item name mappings
            itemNameMappings,
            itemNameMappingsLoading,
            onDeleteItemNameMapping,
            onUpdateItemNameMapping,

            // Clear all learned data
            onClearAllLearnedData,

            // Profile editing
            userEmail,
            displayName,
            phoneNumber,
            birthDate,
            onSetDisplayName,
            onSetPhoneNumber,
            onSetBirthDate,

            // Subscription info
            plan,
            creditsRemaining,
            superCreditsRemaining,

            // Controlled subview state
            currentSubview,
            onSubviewChange,
        }),
        [
            // Core settings
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

            // Category mappings
            mappings,
            mappingsLoading,
            onDeleteMapping,
            onEditMapping,

            // Color theme
            colorTheme,
            onSetColorTheme,

            // Font color mode
            fontColorMode,
            onSetFontColorMode,

            // Font family
            fontFamily,
            onSetFontFamily,

            // Font size
            fontSize,
            onSetFontSize,

            // Default location
            defaultCountry,
            defaultCity,
            onSetDefaultCountry,
            onSetDefaultCity,

            // Merchant mappings
            merchantMappings,
            merchantMappingsLoading,
            onDeleteMerchantMapping,
            onEditMerchantMapping,

            // Default scan currency
            defaultScanCurrency,
            onSetDefaultScanCurrency,

            // Foreign location format
            foreignLocationFormat,
            onSetForeignLocationFormat,

            // Subcategory mappings
            subcategoryMappings,
            subcategoryMappingsLoading,
            onDeleteSubcategoryMapping,
            onUpdateSubcategoryMapping,

            // Firebase context
            db,
            userId,
            appId,

            // Trusted merchants
            trustedMerchants,
            trustedMerchantsLoading,
            onRevokeTrust,

            // Item name mappings
            itemNameMappings,
            itemNameMappingsLoading,
            onDeleteItemNameMapping,
            onUpdateItemNameMapping,

            // Clear all learned data
            onClearAllLearnedData,

            // Profile editing
            userEmail,
            displayName,
            phoneNumber,
            birthDate,
            onSetDisplayName,
            onSetPhoneNumber,
            onSetBirthDate,

            // Subscription info
            plan,
            creditsRemaining,
            superCreditsRemaining,

            // Controlled subview state
            currentSubview,
            onSubviewChange,
        ]
    );
}
