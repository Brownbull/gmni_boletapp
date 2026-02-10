/**
 * Tests for useSettingsViewData Hook
 *
 * Story 14e-25c.1: useSettingsViewData Hook Creation
 *
 * Coverage:
 * - AC1: Returns organized data object (profile, preferences, theme, etc.)
 * - AC2: Profile data integration (displayName, email, phone, birthDate)
 * - AC3: Theme data integration (theme, colorTheme, fontFamily, fontSize)
 * - AC4: Subscription data integration (plan, credits)
 * - AC5: Mappings data integration (categories, merchants, trusted, itemNames)
 * - AC6: Navigation data integration (subview state)
 * - AC7: Account actions integration (signOut, wipeDB, exportAll)
 * - AC8: Translation function
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// =============================================================================
// Mock Module Setup
// =============================================================================

// Store mock implementations for dynamic modification
const mockState = {
    user: {
        uid: 'test-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
    } as any,
    services: {
        auth: {},
        db: {},
        appId: 'test-app-id',
    } as any,
    // Theme/locale state
    theme: 'light' as const,
    colorTheme: 'mono' as const,
    fontColorMode: 'colorful' as const,
    fontSize: 'small' as const,
    fontFamily: 'outfit' as const,
    lang: 'en' as const,
    currency: 'USD',
    dateFormat: 'US' as const,
    // User preferences
    preferences: {
        displayName: 'Test Display Name',
        phoneNumber: '555-1234',
        birthDate: '1990-01-15',
        defaultCity: 'Los Angeles',
        defaultCountry: 'US',
        defaultCurrency: 'USD' as const,
        foreignLocationFormat: 'code' as const,
        fontFamily: 'outfit' as const,
    },
    // Credits
    credits: {
        remaining: 100,
        superRemaining: 10,
        used: 50,
        superUsed: 5,
    },
    // Mappings
    merchantMappings: [{ id: 'mm-1', source: 'Old Name', target: 'New Name' }],
    merchantMappingsLoading: false,
    trustedMerchants: [{ merchantName: 'Trusted Store', addedAt: '2026-01-01' }],
    trustedMerchantsLoading: false,
    itemNameMappings: [{ id: 'inm-1', source: 'Old Item', target: 'New Item' }],
    itemNameMappingsLoading: false,
    // Categories context
    categoriesContext: {
        categoryMappings: [{ id: 'cm-1', pattern: 'Test', category: 'Groceries' }],
        categoryLoading: false,
        subcategoryMappings: [{ id: 'scm-1', pattern: 'Sub Test', subcategory: 'Produce' }],
        subcategoryLoading: false,
        deleteCategoryMapping: vi.fn(),
        updateCategoryMapping: vi.fn(),
        deleteSubcategoryMapping: vi.fn(),
        updateSubcategoryMapping: vi.fn(),
    },
    // Navigation store
    settingsSubview: 'main' as const,
};

// Mock setters
const mockSetters = {
    setTheme: vi.fn(),
    setColorTheme: vi.fn(),
    setFontColorMode: vi.fn(),
    setFontSize: vi.fn(),
    setLang: vi.fn(),
    setCurrency: vi.fn(),
    setDateFormat: vi.fn(),
    setDefaultCountry: vi.fn(),
    setDefaultCity: vi.fn(),
    setDisplayName: vi.fn(),
    setPhoneNumber: vi.fn(),
    setBirthDate: vi.fn(),
    setFontFamily: vi.fn(),
    setForeignLocationFormat: vi.fn(),
    setDefaultCurrency: vi.fn(),
    deleteMerchantMapping: vi.fn(),
    updateMerchantMapping: vi.fn(),
    removeTrust: vi.fn(),
    deleteItemNameMapping: vi.fn(),
    updateItemNameMapping: vi.fn(),
    setSettingsSubview: vi.fn(),
};

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(() => ({
        user: mockState.user,
        services: mockState.services,
        signIn: vi.fn(),
        signOut: vi.fn(),
        initError: null,
    })),
}));

// Story 15-7c: Mock useThemeSettings (ThemeContext removed)
vi.mock('@/shared/stores', () => ({
    useThemeSettings: vi.fn(() => ({
        theme: mockState.theme,
        colorTheme: mockState.colorTheme,
        fontColorMode: mockState.fontColorMode,
        fontSize: mockState.fontSize,
        fontFamily: mockState.fontFamily,
        lang: mockState.lang,
        currency: mockState.currency,
        dateFormat: mockState.dateFormat,
    })),
}));

// Story 15-7c: Mock useSettingsStore for individual selectors + setters
vi.mock('@/shared/stores/useSettingsStore', () => ({
    useSettingsStore: vi.fn((selector) => {
        const state = {
            theme: mockState.theme,
            colorTheme: mockState.colorTheme,
            fontColorMode: mockState.fontColorMode,
            fontSize: mockState.fontSize,
            setTheme: mockSetters.setTheme,
            setColorTheme: mockSetters.setColorTheme,
            setFontColorMode: mockSetters.setFontColorMode,
            setFontSize: mockSetters.setFontSize,
            setLang: mockSetters.setLang,
            setCurrency: mockSetters.setCurrency,
            setDateFormat: mockSetters.setDateFormat,
        };
        return selector(state);
    }),
}));

// Mock useUserPreferences
vi.mock('@/hooks/useUserPreferences', () => ({
    useUserPreferences: vi.fn(() => ({
        preferences: mockState.preferences,
        loading: false,
        setDefaultCountry: mockSetters.setDefaultCountry,
        setDefaultCity: mockSetters.setDefaultCity,
        setDisplayName: mockSetters.setDisplayName,
        setPhoneNumber: mockSetters.setPhoneNumber,
        setBirthDate: mockSetters.setBirthDate,
        setFontFamily: mockSetters.setFontFamily,
        setForeignLocationFormat: mockSetters.setForeignLocationFormat,
        setDefaultCurrency: mockSetters.setDefaultCurrency,
    })),
}));

// Mock useUserCredits
vi.mock('@/hooks/useUserCredits', () => ({
    useUserCredits: vi.fn(() => ({
        credits: mockState.credits,
        loading: false,
    })),
}));

// Mock useMerchantMappings
vi.mock('@/hooks/useMerchantMappings', () => ({
    useMerchantMappings: vi.fn(() => ({
        mappings: mockState.merchantMappings,
        loading: mockState.merchantMappingsLoading,
        deleteMapping: mockSetters.deleteMerchantMapping,
        updateMapping: mockSetters.updateMerchantMapping,
    })),
}));

// Mock useTrustedMerchants
vi.mock('@/hooks/useTrustedMerchants', () => ({
    useTrustedMerchants: vi.fn(() => ({
        trustedMerchants: mockState.trustedMerchants,
        loading: mockState.trustedMerchantsLoading,
        removeTrust: mockSetters.removeTrust,
    })),
}));

// Mock useItemNameMappings
vi.mock('@/hooks/useItemNameMappings', () => ({
    useItemNameMappings: vi.fn(() => ({
        mappings: mockState.itemNameMappings,
        loading: mockState.itemNameMappingsLoading,
        deleteMapping: mockSetters.deleteItemNameMapping,
        updateMapping: mockSetters.updateItemNameMapping,
    })),
}));

// Mock categories feature
vi.mock('@features/categories', () => ({
    useCategoriesContextOptional: vi.fn(() => mockState.categoriesContext),
}));

// Mock navigation store
vi.mock('@/shared/stores/useNavigationStore', () => ({
    useNavigationStore: vi.fn((selector) => {
        const state = {
            setSettingsSubview: mockSetters.setSettingsSubview,
        };
        return selector(state);
    }),
    useSettingsSubview: vi.fn(() => mockState.settingsSubview),
}));

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    signOut: vi.fn(),
}));

// =============================================================================
// Test Setup
// =============================================================================

// Import after mocks are set up
import { useSettingsViewData } from '@/views/SettingsView/useSettingsViewData';

describe('useSettingsViewData', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset mock state to defaults
        mockState.user = {
            uid: 'test-user-123',
            displayName: 'Test User',
            email: 'test@example.com',
        };
        mockState.services = {
            auth: {},
            db: {},
            appId: 'test-app-id',
        };
        mockState.theme = 'light';
        mockState.colorTheme = 'mono';
        mockState.fontColorMode = 'colorful';
        mockState.fontSize = 'small';
        mockState.fontFamily = 'outfit';
        mockState.lang = 'en';
        mockState.currency = 'USD';
        mockState.dateFormat = 'US';
        mockState.preferences = {
            displayName: 'Test Display Name',
            phoneNumber: '555-1234',
            birthDate: '1990-01-15',
            defaultCity: 'Los Angeles',
            defaultCountry: 'US',
            defaultCurrency: 'USD',
            foreignLocationFormat: 'code',
            fontFamily: 'outfit',
        };
        mockState.credits = {
            remaining: 100,
            superRemaining: 10,
            used: 50,
            superUsed: 5,
        };
        mockState.settingsSubview = 'main';
    });

    // =========================================================================
    // AC1: Organized Data Object
    // =========================================================================

    describe('organized data structure (AC1)', () => {
        it('returns organized data object with all required sections', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current).toHaveProperty('profile');
            expect(result.current).toHaveProperty('preferences');
            expect(result.current).toHaveProperty('theme');
            expect(result.current).toHaveProperty('subscription');
            expect(result.current).toHaveProperty('mappings');
            expect(result.current).toHaveProperty('navigation');
            expect(result.current).toHaveProperty('account');
            expect(result.current).toHaveProperty('t');
            expect(result.current).toHaveProperty('db');
            expect(result.current).toHaveProperty('userId');
            expect(result.current).toHaveProperty('appId');
        });
    });

    // =========================================================================
    // AC2: Profile Data
    // =========================================================================

    describe('profile data (AC2)', () => {
        it('returns profile data from user and preferences', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.profile.displayName).toBe('Test Display Name');
            expect(result.current.profile.email).toBe('test@example.com');
            expect(result.current.profile.phoneNumber).toBe('555-1234');
            expect(result.current.profile.birthDate).toBe('1990-01-15');
        });

        it('falls back to user displayName when preference is empty', () => {
            mockState.preferences.displayName = '';

            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.profile.displayName).toBe('Test User');
        });

        it('provides setters for profile fields', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(typeof result.current.profile.setDisplayName).toBe('function');
            expect(typeof result.current.profile.setPhoneNumber).toBe('function');
            expect(typeof result.current.profile.setBirthDate).toBe('function');
        });

        it('calls setDisplayName when setter is invoked', () => {
            const { result } = renderHook(() => useSettingsViewData());

            act(() => {
                result.current.profile.setDisplayName('New Name');
            });

            expect(mockSetters.setDisplayName).toHaveBeenCalledWith('New Name');
        });
    });

    // =========================================================================
    // AC3: Theme Data
    // =========================================================================

    describe('theme data (AC3)', () => {
        it('returns theme settings from ThemeContext', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.theme.theme).toBe('light');
            expect(result.current.theme.colorTheme).toBe('mono');
            expect(result.current.theme.fontColorMode).toBe('colorful');
            expect(result.current.theme.fontSize).toBe('small');
            expect(result.current.theme.fontFamily).toBe('outfit');
        });

        it('provides setters for theme fields', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(typeof result.current.theme.setTheme).toBe('function');
            expect(typeof result.current.theme.setColorTheme).toBe('function');
            expect(typeof result.current.theme.setFontColorMode).toBe('function');
            expect(typeof result.current.theme.setFontSize).toBe('function');
            expect(typeof result.current.theme.setFontFamily).toBe('function');
        });
    });

    // =========================================================================
    // AC4: Subscription Data
    // =========================================================================

    describe('subscription data (AC4)', () => {
        it('returns credits from useUserCredits', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.subscription.creditsRemaining).toBe(100);
            expect(result.current.subscription.superCreditsRemaining).toBe(10);
        });

        it('returns default plan as freemium', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.subscription.plan).toBe('freemium');
        });

        it('returns daysUntilReset', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.subscription.daysUntilReset).toBeDefined();
            expect(typeof result.current.subscription.daysUntilReset).toBe('number');
        });
    });

    // =========================================================================
    // AC5: Mappings Data
    // =========================================================================

    describe('mappings data (AC5)', () => {
        it('returns category mappings from context', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.mappings.categories.data).toHaveLength(1);
            expect(result.current.mappings.categories.data[0].pattern).toBe('Test');
        });

        it('returns subcategory mappings from context', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.mappings.subcategories.data).toHaveLength(1);
            expect(result.current.mappings.subcategories.data[0].pattern).toBe('Sub Test');
        });

        it('returns merchant mappings', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.mappings.merchants.data).toHaveLength(1);
            expect(result.current.mappings.merchants.data[0].source).toBe('Old Name');
        });

        it('returns trusted merchants', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.mappings.trusted.data).toHaveLength(1);
            expect(result.current.mappings.trusted.data[0].merchantName).toBe('Trusted Store');
        });

        it('returns item name mappings', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.mappings.itemNames.data).toHaveLength(1);
            expect(result.current.mappings.itemNames.data[0].source).toBe('Old Item');
        });

        it('provides clearAll function', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(typeof result.current.mappings.clearAll).toBe('function');
        });
    });

    // =========================================================================
    // AC6: Navigation Data
    // =========================================================================

    describe('navigation data (AC6)', () => {
        it('returns current subview from navigation store', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.navigation.subview).toBe('main');
        });

        it('provides setSubview function', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(typeof result.current.navigation.setSubview).toBe('function');
        });
    });

    // =========================================================================
    // AC7: Account Actions
    // =========================================================================

    describe('account actions (AC7)', () => {
        it('provides signOut function', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(typeof result.current.account.signOut).toBe('function');
        });

        it('provides wipeDB function that throws without _testOverrides', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(typeof result.current.account.wipeDB).toBe('function');
            // Story 14e-25c.1: wipeDB requires App-level coordination via _testOverrides
            expect(() => result.current.account.wipeDB()).rejects.toThrow(
                /wipeDB not provided/
            );
        });

        it('provides exportAll function that throws without _testOverrides', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(typeof result.current.account.exportAll).toBe('function');
            // Story 14e-25c.1: exportAll requires App-level services via _testOverrides
            expect(() => result.current.account.exportAll()).toThrow(
                /exportAll not provided/
            );
        });

        it('returns wiping and exporting state as false by default', () => {
            const { result } = renderHook(() => useSettingsViewData());

            // Default false since actual states come from _testOverrides
            expect(result.current.account.wiping).toBe(false);
            expect(result.current.account.exporting).toBe(false);
        });
    });

    // =========================================================================
    // AC8: Translation Function
    // =========================================================================

    describe('translation function (AC8)', () => {
        it('provides translation function', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(typeof result.current.t).toBe('function');
        });

        it('returns translation for known keys', () => {
            const { result } = renderHook(() => useSettingsViewData());

            const translated = result.current.t('settings');
            expect(typeof translated).toBe('string');
        });

        it('returns key for unknown translations', () => {
            const { result } = renderHook(() => useSettingsViewData());

            const unknownKey = 'some_unknown_key_xyz';
            expect(result.current.t(unknownKey)).toBe(unknownKey);
        });
    });

    // =========================================================================
    // Preferences Data
    // =========================================================================

    describe('preferences data', () => {
        it('returns locale preferences', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.preferences.lang).toBe('en');
            expect(result.current.preferences.currency).toBe('USD');
            expect(result.current.preferences.dateFormat).toBe('US');
        });

        it('returns location preferences', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.preferences.defaultCountry).toBe('US');
            expect(result.current.preferences.defaultCity).toBe('Los Angeles');
        });

        it('returns scan preferences', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.preferences.defaultScanCurrency).toBe('USD');
            expect(result.current.preferences.foreignLocationFormat).toBe('code');
        });
    });

    // =========================================================================
    // Firebase Context
    // =========================================================================

    describe('firebase context', () => {
        it('returns userId from auth', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.userId).toBe('test-user-123');
        });

        it('returns appId from services', () => {
            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.appId).toBe('test-app-id');
        });

        it('handles null user gracefully', () => {
            mockState.user = null;
            mockState.services = null;

            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.userId).toBeNull();
            expect(result.current.appId).toBeNull();
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('edge cases', () => {
        it('handles empty preferences gracefully', () => {
            mockState.preferences = {} as any;

            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.profile.displayName).toBe('Test User');
            expect(result.current.profile.phoneNumber).toBe('');
            expect(result.current.profile.birthDate).toBe('');
        });

        it('handles null categories context', () => {
            mockState.categoriesContext = null as any;

            const { result } = renderHook(() => useSettingsViewData());

            expect(result.current.mappings.categories.data).toEqual([]);
            expect(result.current.mappings.subcategories.data).toEqual([]);
        });
    });
});
