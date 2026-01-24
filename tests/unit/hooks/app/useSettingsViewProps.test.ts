/**
 * Story 14c-refactor.34b: useSettingsViewProps Tests
 *
 * Tests for the SettingsView data props composition hook.
 * Verifies memoization stability and correct prop composition.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
    useSettingsViewProps,
    type UseSettingsViewPropsOptions,
} from '../../../../src/hooks/app/useSettingsViewProps';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockCategoryMapping(overrides: Partial<any> = {}) {
    return {
        id: 'cat-map-1',
        itemName: 'Test Item',
        targetCategory: 'Supermercado',
        usageCount: 1,
        ...overrides,
    };
}

function createMockMerchantMapping(overrides: Partial<any> = {}) {
    return {
        id: 'merch-map-1',
        originalMerchant: 'Old Store',
        targetMerchant: 'New Store',
        usageCount: 1,
        ...overrides,
    };
}

function createMockSubcategoryMapping(overrides: Partial<any> = {}) {
    return {
        id: 'subcat-map-1',
        itemName: 'Test Item',
        targetSubcategory: 'Produce',
        usageCount: 1,
        ...overrides,
    };
}

function createMockItemNameMapping(overrides: Partial<any> = {}) {
    return {
        id: 'item-map-1',
        originalName: 'Old Item',
        targetName: 'New Item',
        usageCount: 1,
        ...overrides,
    };
}

function createMockTrustedMerchant(overrides: Partial<any> = {}) {
    return {
        merchantName: 'Trusted Store',
        createdAt: { toDate: () => new Date() },
        ...overrides,
    };
}

function createDefaultOptions(): UseSettingsViewPropsOptions {
    return {
        // Core settings
        lang: 'es',
        currency: 'CLP',
        dateFormat: 'LatAm',
        theme: 'light',
        wiping: false,
        exporting: false,
        t: vi.fn((key: string) => key),
        onSetLang: vi.fn(),
        onSetCurrency: vi.fn(),
        onSetDateFormat: vi.fn(),
        onSetTheme: vi.fn(),
        onExportAll: vi.fn(),
        onWipeDB: vi.fn().mockResolvedValue(undefined),
        onSignOut: vi.fn(),

        // Category mappings
        mappings: [createMockCategoryMapping()],
        mappingsLoading: false,
        onDeleteMapping: vi.fn().mockResolvedValue(undefined),
        onEditMapping: vi.fn().mockResolvedValue(undefined),

        // Color theme
        colorTheme: 'normal',
        onSetColorTheme: vi.fn(),

        // Font color mode
        fontColorMode: 'colorful',
        onSetFontColorMode: vi.fn(),

        // Font family
        fontFamily: 'outfit',
        onSetFontFamily: vi.fn(),

        // Font size
        fontSize: 'medium',
        onSetFontSize: vi.fn(),

        // Default location
        defaultCountry: 'Chile',
        defaultCity: 'Santiago',
        onSetDefaultCountry: vi.fn(),
        onSetDefaultCity: vi.fn(),

        // Merchant mappings
        merchantMappings: [createMockMerchantMapping()],
        merchantMappingsLoading: false,
        onDeleteMerchantMapping: vi.fn().mockResolvedValue(undefined),
        onEditMerchantMapping: vi.fn().mockResolvedValue(undefined),

        // Default scan currency
        defaultScanCurrency: 'CLP',
        onSetDefaultScanCurrency: vi.fn(),

        // Foreign location format
        foreignLocationFormat: 'flag',
        onSetForeignLocationFormat: vi.fn(),

        // Subcategory mappings
        subcategoryMappings: [createMockSubcategoryMapping()],
        subcategoryMappingsLoading: false,
        onDeleteSubcategoryMapping: vi.fn().mockResolvedValue(undefined),
        onUpdateSubcategoryMapping: vi.fn().mockResolvedValue(undefined),

        // Firebase context
        db: null,
        userId: 'user-123',
        appId: 'boletapp',

        // Trusted merchants
        trustedMerchants: [createMockTrustedMerchant()],
        trustedMerchantsLoading: false,
        onRevokeTrust: vi.fn().mockResolvedValue(undefined),

        // Item name mappings
        itemNameMappings: [createMockItemNameMapping()],
        itemNameMappingsLoading: false,
        onDeleteItemNameMapping: vi.fn().mockResolvedValue(undefined),
        onUpdateItemNameMapping: vi.fn().mockResolvedValue(undefined),

        // Clear all learned data
        onClearAllLearnedData: vi.fn().mockResolvedValue(undefined),

        // Profile editing
        userEmail: 'test@example.com',
        displayName: 'Test User',
        phoneNumber: '+1234567890',
        birthDate: '1990-01-01',
        onSetDisplayName: vi.fn(),
        onSetPhoneNumber: vi.fn(),
        onSetBirthDate: vi.fn(),

        // Subscription info
        plan: 'freemium',
        creditsRemaining: 50,
        superCreditsRemaining: 5,

        // Controlled subview state
        currentSubview: 'main',
        onSubviewChange: vi.fn(),
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('useSettingsViewProps', () => {
    describe('Memoization Stability', () => {
        it('returns same reference when dependencies unchanged', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(() =>
                useSettingsViewProps(options)
            );

            const firstResult = result.current;
            rerender();

            expect(result.current).toBe(firstResult);
        });

        it('returns new reference when theme changes', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(
                (opts: UseSettingsViewPropsOptions) => useSettingsViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;
            rerender({ ...options, theme: 'dark' });

            expect(result.current).not.toBe(firstResult);
            expect(result.current.theme).toBe('dark');
        });

        it('returns new reference when lang changes', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(
                (opts: UseSettingsViewPropsOptions) => useSettingsViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;
            rerender({ ...options, lang: 'en' });

            expect(result.current).not.toBe(firstResult);
            expect(result.current.lang).toBe('en');
        });

        it('returns new reference when mappings change', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(
                (opts: UseSettingsViewPropsOptions) => useSettingsViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;
            const newMappings = [createMockCategoryMapping({ id: 'new-map' })];
            rerender({ ...options, mappings: newMappings });

            expect(result.current).not.toBe(firstResult);
            expect(result.current.mappings).toBe(newMappings);
        });
    });

    describe('Prop Composition - Core Settings', () => {
        it('passes through lang correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.lang).toBe('es');
        });

        it('passes through currency correctly', () => {
            const options = createDefaultOptions();
            options.currency = 'USD';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.currency).toBe('USD');
        });

        it('passes through dateFormat correctly', () => {
            const options = createDefaultOptions();
            options.dateFormat = 'US';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.dateFormat).toBe('US');
        });

        it('passes through theme correctly', () => {
            const options = createDefaultOptions();
            options.theme = 'dark';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.theme).toBe('dark');
        });

        it('passes through wiping flag correctly', () => {
            const options = createDefaultOptions();
            options.wiping = true;

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.wiping).toBe(true);
        });

        it('passes through exporting flag correctly', () => {
            const options = createDefaultOptions();
            options.exporting = true;

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.exporting).toBe(true);
        });

        it('passes through t translation function', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.t('testKey')).toBe('testKey');
        });
    });

    describe('Prop Composition - Core Callbacks', () => {
        it('passes through onSetLang callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onSetLang = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onSetLang('en');

            expect(mockFn).toHaveBeenCalledWith('en');
        });

        it('passes through onSetCurrency callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onSetCurrency = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onSetCurrency('USD');

            expect(mockFn).toHaveBeenCalledWith('USD');
        });

        it('passes through onSetTheme callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onSetTheme = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onSetTheme('dark');

            expect(mockFn).toHaveBeenCalledWith('dark');
        });

        it('passes through onExportAll callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onExportAll = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onExportAll();

            expect(mockFn).toHaveBeenCalled();
        });

        it('passes through onWipeDB callback', async () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn().mockResolvedValue(undefined);
            options.onWipeDB = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            await result.current.onWipeDB();

            expect(mockFn).toHaveBeenCalled();
        });

        it('passes through onSignOut callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onSignOut = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onSignOut();

            expect(mockFn).toHaveBeenCalled();
        });
    });

    describe('Prop Composition - Category Mappings', () => {
        it('passes through mappings array correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.mappings).toHaveLength(1);
            expect(result.current.mappings[0].id).toBe('cat-map-1');
        });

        it('passes through mappingsLoading correctly', () => {
            const options = createDefaultOptions();
            options.mappingsLoading = true;

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.mappingsLoading).toBe(true);
        });

        it('passes through onDeleteMapping callback', async () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn().mockResolvedValue(undefined);
            options.onDeleteMapping = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            await result.current.onDeleteMapping('cat-map-1');

            expect(mockFn).toHaveBeenCalledWith('cat-map-1');
        });

        it('passes through onEditMapping callback', async () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn().mockResolvedValue(undefined);
            options.onEditMapping = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            await result.current.onEditMapping('cat-map-1', 'Restaurant');

            expect(mockFn).toHaveBeenCalledWith('cat-map-1', 'Restaurant');
        });
    });

    describe('Prop Composition - Theme Settings', () => {
        it('passes through colorTheme correctly', () => {
            const options = createDefaultOptions();
            options.colorTheme = 'professional';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.colorTheme).toBe('professional');
        });

        it('passes through onSetColorTheme callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onSetColorTheme = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onSetColorTheme('mono');

            expect(mockFn).toHaveBeenCalledWith('mono');
        });

        it('passes through fontColorMode correctly', () => {
            const options = createDefaultOptions();
            options.fontColorMode = 'plain';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.fontColorMode).toBe('plain');
        });

        it('passes through fontFamily correctly', () => {
            const options = createDefaultOptions();
            options.fontFamily = 'space';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.fontFamily).toBe('space');
        });

        it('passes through fontSize correctly', () => {
            const options = createDefaultOptions();
            options.fontSize = 'large';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.fontSize).toBe('large');
        });
    });

    describe('Prop Composition - Location Settings', () => {
        it('passes through defaultCountry correctly', () => {
            const options = createDefaultOptions();
            options.defaultCountry = 'Argentina';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.defaultCountry).toBe('Argentina');
        });

        it('passes through defaultCity correctly', () => {
            const options = createDefaultOptions();
            options.defaultCity = 'Buenos Aires';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.defaultCity).toBe('Buenos Aires');
        });

        it('passes through foreignLocationFormat correctly', () => {
            const options = createDefaultOptions();
            options.foreignLocationFormat = 'code';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.foreignLocationFormat).toBe('code');
        });

        it('passes through onSetDefaultCountry callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onSetDefaultCountry = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onSetDefaultCountry('Peru');

            expect(mockFn).toHaveBeenCalledWith('Peru');
        });

        it('passes through onSetDefaultCity callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onSetDefaultCity = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onSetDefaultCity('Lima');

            expect(mockFn).toHaveBeenCalledWith('Lima');
        });
    });

    describe('Prop Composition - Merchant Mappings', () => {
        it('passes through merchantMappings array correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.merchantMappings).toHaveLength(1);
            expect(result.current.merchantMappings[0].id).toBe('merch-map-1');
        });

        it('passes through onDeleteMerchantMapping callback', async () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn().mockResolvedValue(undefined);
            options.onDeleteMerchantMapping = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            await result.current.onDeleteMerchantMapping('merch-map-1');

            expect(mockFn).toHaveBeenCalledWith('merch-map-1');
        });

        it('passes through onEditMerchantMapping callback', async () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn().mockResolvedValue(undefined);
            options.onEditMerchantMapping = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            await result.current.onEditMerchantMapping('merch-map-1', 'New Store Name');

            expect(mockFn).toHaveBeenCalledWith('merch-map-1', 'New Store Name');
        });
    });

    describe('Prop Composition - Scan Settings', () => {
        it('passes through defaultScanCurrency correctly', () => {
            const options = createDefaultOptions();
            options.defaultScanCurrency = 'USD';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.defaultScanCurrency).toBe('USD');
        });

        it('passes through onSetDefaultScanCurrency callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onSetDefaultScanCurrency = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onSetDefaultScanCurrency('EUR');

            expect(mockFn).toHaveBeenCalledWith('EUR');
        });
    });

    describe('Prop Composition - Firebase Context', () => {
        it('passes through db correctly', () => {
            const options = createDefaultOptions();
            const mockDb = {} as any;
            options.db = mockDb;

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.db).toBe(mockDb);
        });

        it('handles null db', () => {
            const options = createDefaultOptions();
            options.db = null;

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.db).toBeNull();
        });

        it('passes through userId correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.userId).toBe('user-123');
        });

        it('handles null userId', () => {
            const options = createDefaultOptions();
            options.userId = null;

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.userId).toBeNull();
        });

        it('passes through appId correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.appId).toBe('boletapp');
        });
    });

    describe('Prop Composition - Trusted Merchants', () => {
        it('passes through trustedMerchants array correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.trustedMerchants).toHaveLength(1);
            expect(result.current.trustedMerchants[0].merchantName).toBe('Trusted Store');
        });

        it('passes through onRevokeTrust callback', async () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn().mockResolvedValue(undefined);
            options.onRevokeTrust = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            await result.current.onRevokeTrust('Trusted Store');

            expect(mockFn).toHaveBeenCalledWith('Trusted Store');
        });
    });

    describe('Prop Composition - Item Name Mappings', () => {
        it('passes through itemNameMappings array correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.itemNameMappings).toHaveLength(1);
            expect(result.current.itemNameMappings[0].id).toBe('item-map-1');
        });

        it('passes through onDeleteItemNameMapping callback', async () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn().mockResolvedValue(undefined);
            options.onDeleteItemNameMapping = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            await result.current.onDeleteItemNameMapping('item-map-1');

            expect(mockFn).toHaveBeenCalledWith('item-map-1');
        });

        it('passes through onUpdateItemNameMapping callback', async () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn().mockResolvedValue(undefined);
            options.onUpdateItemNameMapping = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            await result.current.onUpdateItemNameMapping('item-map-1', 'New Item Name');

            expect(mockFn).toHaveBeenCalledWith('item-map-1', 'New Item Name');
        });
    });

    describe('Prop Composition - Clear Learned Data', () => {
        it('passes through onClearAllLearnedData callback', async () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn().mockResolvedValue(undefined);
            options.onClearAllLearnedData = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            await result.current.onClearAllLearnedData();

            expect(mockFn).toHaveBeenCalled();
        });
    });

    describe('Prop Composition - Profile Settings', () => {
        it('passes through userEmail correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.userEmail).toBe('test@example.com');
        });

        it('passes through displayName correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.displayName).toBe('Test User');
        });

        it('passes through phoneNumber correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.phoneNumber).toBe('+1234567890');
        });

        it('passes through birthDate correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.birthDate).toBe('1990-01-01');
        });

        it('passes through onSetDisplayName callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onSetDisplayName = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onSetDisplayName('New Name');

            expect(mockFn).toHaveBeenCalledWith('New Name');
        });

        it('passes through onSetPhoneNumber callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onSetPhoneNumber = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onSetPhoneNumber('+0987654321');

            expect(mockFn).toHaveBeenCalledWith('+0987654321');
        });

        it('passes through onSetBirthDate callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onSetBirthDate = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onSetBirthDate('1985-05-15');

            expect(mockFn).toHaveBeenCalledWith('1985-05-15');
        });
    });

    describe('Prop Composition - Subscription Info', () => {
        it('passes through plan correctly', () => {
            const options = createDefaultOptions();
            options.plan = 'pro';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.plan).toBe('pro');
        });

        it('passes through creditsRemaining correctly', () => {
            const options = createDefaultOptions();
            options.creditsRemaining = 100;

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.creditsRemaining).toBe(100);
        });

        it('passes through superCreditsRemaining correctly', () => {
            const options = createDefaultOptions();
            options.superCreditsRemaining = 10;

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.superCreditsRemaining).toBe(10);
        });
    });

    describe('Prop Composition - Subview State', () => {
        it('passes through currentSubview correctly', () => {
            const options = createDefaultOptions();
            options.currentSubview = 'preferencias';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.currentSubview).toBe('preferencias');
        });

        it('passes through onSubviewChange callback', () => {
            const options = createDefaultOptions();
            const mockFn = vi.fn();
            options.onSubviewChange = mockFn;

            const { result } = renderHook(() => useSettingsViewProps(options));
            result.current.onSubviewChange('perfil');

            expect(mockFn).toHaveBeenCalledWith('perfil');
        });
    });

    describe('Edge Cases', () => {
        it('handles empty mappings arrays', () => {
            const options = createDefaultOptions();
            options.mappings = [];
            options.merchantMappings = [];
            options.subcategoryMappings = [];
            options.itemNameMappings = [];
            options.trustedMerchants = [];

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.mappings).toHaveLength(0);
            expect(result.current.merchantMappings).toHaveLength(0);
            expect(result.current.subcategoryMappings).toHaveLength(0);
            expect(result.current.itemNameMappings).toHaveLength(0);
            expect(result.current.trustedMerchants).toHaveLength(0);
        });

        it('handles empty profile strings', () => {
            const options = createDefaultOptions();
            options.userEmail = '';
            options.displayName = '';
            options.phoneNumber = '';
            options.birthDate = '';

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.userEmail).toBe('');
            expect(result.current.displayName).toBe('');
            expect(result.current.phoneNumber).toBe('');
            expect(result.current.birthDate).toBe('');
        });

        it('handles zero credits', () => {
            const options = createDefaultOptions();
            options.creditsRemaining = 0;
            options.superCreditsRemaining = 0;

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.creditsRemaining).toBe(0);
            expect(result.current.superCreditsRemaining).toBe(0);
        });

        it('preserves array references', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.mappings).toBe(options.mappings);
            expect(result.current.merchantMappings).toBe(options.merchantMappings);
            expect(result.current.subcategoryMappings).toBe(options.subcategoryMappings);
            expect(result.current.itemNameMappings).toBe(options.itemNameMappings);
            expect(result.current.trustedMerchants).toBe(options.trustedMerchants);
        });

        it('handles all loading flags true simultaneously', () => {
            const options = createDefaultOptions();
            options.mappingsLoading = true;
            options.merchantMappingsLoading = true;
            options.subcategoryMappingsLoading = true;
            options.itemNameMappingsLoading = true;
            options.trustedMerchantsLoading = true;
            options.wiping = true;
            options.exporting = true;

            const { result } = renderHook(() => useSettingsViewProps(options));

            expect(result.current.mappingsLoading).toBe(true);
            expect(result.current.merchantMappingsLoading).toBe(true);
            expect(result.current.subcategoryMappingsLoading).toBe(true);
            expect(result.current.itemNameMappingsLoading).toBe(true);
            expect(result.current.trustedMerchantsLoading).toBe(true);
            expect(result.current.wiping).toBe(true);
            expect(result.current.exporting).toBe(true);
        });
    });

    describe('Callback Error Handling', () => {
        it('propagates errors from async callbacks', async () => {
            const options = createDefaultOptions();
            const error = new Error('Wipe failed');
            options.onWipeDB = vi.fn().mockRejectedValue(error);

            const { result } = renderHook(() => useSettingsViewProps(options));

            await expect(result.current.onWipeDB()).rejects.toThrow('Wipe failed');
        });

        it('propagates errors from onDeleteMapping', async () => {
            const options = createDefaultOptions();
            const error = new Error('Delete failed');
            options.onDeleteMapping = vi.fn().mockRejectedValue(error);

            const { result } = renderHook(() => useSettingsViewProps(options));

            await expect(result.current.onDeleteMapping('id')).rejects.toThrow('Delete failed');
        });

        it('propagates errors from onClearAllLearnedData', async () => {
            const options = createDefaultOptions();
            const error = new Error('Clear failed');
            options.onClearAllLearnedData = vi.fn().mockRejectedValue(error);

            const { result } = renderHook(() => useSettingsViewProps(options));

            await expect(result.current.onClearAllLearnedData()).rejects.toThrow('Clear failed');
        });
    });
});
