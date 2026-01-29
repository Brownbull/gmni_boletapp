/**
 * Tests for useDashboardViewData Hook
 *
 * Story 14e-25b.2: DashboardView Data Migration
 *
 * Coverage:
 * - AC1: DashboardView calls useDashboardViewData() internally
 * - AC2: useDashboardViewData() composition hook
 * - AC3: Return type and data structure
 * - AC5: DEV warning when callbacks not overridden
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

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
    paginatedTransactions: [
        { id: 'tx-1', merchant: 'Store A', date: '2026-01-15', total: 50, category: 'Groceries' },
        { id: 'tx-2', merchant: 'Store B', date: '2026-01-14', total: 30, category: 'Restaurant' },
        { id: 'tx-3', merchant: 'Store C', date: '2026-01-13', total: 20, category: 'Gas' },
    ],
    recentScans: [
        { id: 'scan-1', merchant: 'New Store', date: '2026-01-20', total: 100, category: 'Shopping' },
    ],
    // Theme/locale state
    theme: 'light' as const,
    colorTheme: 'mono' as const,
    fontColorMode: 'colorful' as const,
    lang: 'en' as const,
    currency: 'USD',
    dateFormat: 'US' as const,
    // User preferences
    preferences: {
        defaultCity: 'Los Angeles',
        defaultCountry: 'US',
        defaultCurrency: 'USD',
        foreignLocationFormat: 'code' as const,
    },
    // View mode
    viewMode: 'personal' as const,
    viewModeGroup: null as any,
    sharedGroups: [] as any[],
    // Pagination
    hasMore: true,
    loadMore: vi.fn(),
    isLoadingMore: false,
    isAtListenerLimit: false,
};

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(() => ({
        user: mockState.user,
        services: mockState.services,
        signIn: vi.fn(),
        signOut: vi.fn(),
        initError: null,
        signInWithTestCredentials: vi.fn(),
    })),
}));

// Mock usePaginatedTransactions
vi.mock('@/hooks/usePaginatedTransactions', () => ({
    usePaginatedTransactions: vi.fn(() => ({
        transactions: mockState.paginatedTransactions,
        hasMore: mockState.hasMore,
        loadMore: mockState.loadMore,
        loadingMore: mockState.isLoadingMore,
        isAtListenerLimit: mockState.isAtListenerLimit,
    })),
}));

// Mock useRecentScans
vi.mock('@/hooks/useRecentScans', () => ({
    useRecentScans: vi.fn(() => mockState.recentScans),
}));

// Mock useUserPreferences
vi.mock('@/hooks/useUserPreferences', () => ({
    useUserPreferences: vi.fn(() => ({
        preferences: mockState.preferences,
        isLoading: false,
        updatePreferences: vi.fn(),
    })),
}));

// Mock ThemeContext
vi.mock('@/contexts/ThemeContext', () => ({
    useTheme: vi.fn(() => ({
        theme: mockState.theme,
        colorTheme: mockState.colorTheme,
        fontColorMode: mockState.fontColorMode,
        lang: mockState.lang,
        currency: mockState.currency,
        dateFormat: mockState.dateFormat,
        setTheme: vi.fn(),
        setColorTheme: vi.fn(),
        setFontColorMode: vi.fn(),
        setLang: vi.fn(),
        setCurrency: vi.fn(),
    })),
}));

// Mock ViewModeContext
vi.mock('@/contexts/ViewModeContext', () => ({
    useViewMode: vi.fn(() => ({
        mode: mockState.viewMode,
        group: mockState.viewModeGroup,
        isGroupMode: mockState.viewMode === 'group',
        setPersonalMode: vi.fn(),
        setGroupMode: vi.fn(),
        updateGroupData: vi.fn(),
    })),
}));

// Mock useUserSharedGroups
vi.mock('@/hooks/useUserSharedGroups', () => ({
    useUserSharedGroups: vi.fn(() => ({
        groups: mockState.sharedGroups,
        isLoading: false,
        getGroupById: vi.fn(),
    })),
}));

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
}));

// Story 14e-25d: Mock useNavigationActions
const mockSetView = vi.fn();
vi.mock('@/shared/stores', () => ({
    useNavigationActions: vi.fn(() => ({
        setView: mockSetView,
        navigateBack: vi.fn(),
        setHistoryFilters: vi.fn(),
    })),
}));

// Mock utilities
vi.mock('@/utils/currency', () => ({
    formatCurrency: vi.fn((amount: number, currency: string) => `${currency}${amount.toFixed(2)}`),
}));

vi.mock('@/utils/date', () => ({
    formatDate: vi.fn((date: string, format: string) => `${date} (${format})`),
}));

// =============================================================================
// Test Setup
// =============================================================================

// Import after mocks are set up
import { useDashboardViewData } from '@/views/DashboardView/useDashboardViewData';

describe('useDashboardViewData', () => {
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
        mockState.paginatedTransactions = [
            { id: 'tx-1', merchant: 'Store A', date: '2026-01-15', total: 50, category: 'Groceries' },
            { id: 'tx-2', merchant: 'Store B', date: '2026-01-14', total: 30, category: 'Restaurant' },
            { id: 'tx-3', merchant: 'Store C', date: '2026-01-13', total: 20, category: 'Gas' },
        ];
        mockState.recentScans = [
            { id: 'scan-1', merchant: 'New Store', date: '2026-01-20', total: 100, category: 'Shopping' },
        ];
        mockState.theme = 'light';
        mockState.colorTheme = 'mono';
        mockState.fontColorMode = 'colorful';
        mockState.lang = 'en';
        mockState.currency = 'USD';
        mockState.dateFormat = 'US';
        mockState.preferences = {
            defaultCity: 'Los Angeles',
            defaultCountry: 'US',
            defaultCurrency: 'USD',
            foreignLocationFormat: 'code',
        };
        mockState.viewMode = 'personal';
        mockState.viewModeGroup = null;
        mockState.sharedGroups = [];
        mockState.hasMore = true;
        mockState.loadMore = vi.fn();
        mockState.isLoadingMore = false;
        mockState.isAtListenerLimit = false;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // AC2: Transaction Data (recentScans + paginated merge)
    // =========================================================================

    describe('transactions data (AC2)', () => {
        it('returns merged transactions with recentScans at top', () => {
            const { result } = renderHook(() => useDashboardViewData());

            // Recent scans should appear first
            expect(result.current.transactions[0].id).toBe('scan-1');
            expect(result.current.transactions).toHaveLength(4);
        });

        it('deduplicates transactions when recentScans overlap with paginated', () => {
            // Add a transaction that exists in both
            mockState.recentScans = [
                { id: 'tx-1', merchant: 'Store A Updated', date: '2026-01-15', total: 50, category: 'Groceries' },
            ];

            const { result } = renderHook(() => useDashboardViewData());

            // Should deduplicate: tx-1 appears only once (from recentScans)
            const tx1Occurrences = result.current.transactions.filter(t => t.id === 'tx-1');
            expect(tx1Occurrences).toHaveLength(1);
            expect(tx1Occurrences[0].merchant).toBe('Store A Updated');
        });

        it('handles empty recentScans', () => {
            mockState.recentScans = [];

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.transactions).toHaveLength(3);
        });

        it('handles empty paginated transactions', () => {
            mockState.paginatedTransactions = [];

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.transactions).toHaveLength(1);
            expect(result.current.transactions[0].id).toBe('scan-1');
        });

        it('handles null recentScans', () => {
            mockState.recentScans = null as any;

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.transactions).toHaveLength(3);
        });

        it('returns recentScans as separate property', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.recentScans).toHaveLength(1);
            expect(result.current.recentScans[0].id).toBe('scan-1');
        });
    });

    // =========================================================================
    // AC2: User Data
    // =========================================================================

    describe('user data (AC2)', () => {
        it('returns userId from auth context', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.userId).toBe('test-user-123');
        });

        it('returns appId from services', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.appId).toBe('test-app-id');
        });

        it('handles null user gracefully', () => {
            mockState.user = null;
            mockState.services = null;

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.userId).toBeNull();
            expect(result.current.appId).toBe('');
        });
    });

    // =========================================================================
    // AC2: Theme/Locale Settings
    // =========================================================================

    describe('theme and locale settings (AC2)', () => {
        it('returns theme from ThemeContext', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.theme).toBe('light');
            expect(result.current.colorTheme).toBe('mono');
            expect(result.current.fontColorMode).toBe('colorful');
        });

        it('returns locale settings from ThemeContext', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.lang).toBe('en');
            expect(result.current.dateFormat).toBe('US');
        });

        it('returns currency from user preferences', () => {
            mockState.preferences.defaultCurrency = 'CLP';

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.currency).toBe('CLP');
        });

        it('falls back to theme currency when no preference', () => {
            mockState.preferences.defaultCurrency = undefined;
            mockState.currency = 'EUR';

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.currency).toBe('EUR');
        });
    });

    // =========================================================================
    // AC2: User Preferences
    // =========================================================================

    describe('user preferences (AC2)', () => {
        it('returns defaultCountry from preferences', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.defaultCountry).toBe('US');
        });

        it('returns foreignLocationFormat from preferences', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.foreignLocationFormat).toBe('code');
        });

        it('handles flag format preference', () => {
            mockState.preferences.foreignLocationFormat = 'flag';

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.foreignLocationFormat).toBe('flag');
        });

        it('defaults to empty string for missing defaultCountry', () => {
            mockState.preferences.defaultCountry = undefined;

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.defaultCountry).toBe('');
        });

        it('defaults to code for missing foreignLocationFormat', () => {
            mockState.preferences.foreignLocationFormat = undefined;

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.foreignLocationFormat).toBe('code');
        });
    });

    // =========================================================================
    // AC2: Formatters
    // =========================================================================

    describe('formatters (AC2)', () => {
        it('provides translation function', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(typeof result.current.t).toBe('function');
        });

        it('returns translation for known keys', () => {
            const { result } = renderHook(() => useDashboardViewData());

            const translated = result.current.t('history');
            expect(typeof translated).toBe('string');
            expect(translated).toBe('History');
        });

        it('returns key for unknown translations', () => {
            const { result } = renderHook(() => useDashboardViewData());

            const unknownKey = 'some_unknown_key_xyz';
            expect(result.current.t(unknownKey)).toBe(unknownKey);
        });

        it('provides formatCurrency function', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(typeof result.current.formatCurrency).toBe('function');
            expect(result.current.formatCurrency(100, 'USD')).toBe('USD100.00');
        });

        it('provides formatDate function', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(typeof result.current.formatDate).toBe('function');
            expect(result.current.formatDate('2026-01-15', 'US')).toBe('2026-01-15 (US)');
        });

        it('provides getSafeDate function', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(typeof result.current.getSafeDate).toBe('function');
        });

        it('getSafeDate handles string input', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.getSafeDate('2026-01-15')).toBe('2026-01-15');
        });

        it('getSafeDate handles Firestore Timestamp', () => {
            const { result } = renderHook(() => useDashboardViewData());

            const mockTimestamp = {
                toDate: () => new Date('2026-01-15T12:00:00Z'),
            };
            const safeDate = result.current.getSafeDate(mockTimestamp);
            expect(safeDate).toBe('2026-01-15');
        });
    });

    // =========================================================================
    // AC2: Shared Groups
    // =========================================================================

    describe('shared groups (AC2)', () => {
        it('returns empty sharedGroups array by default', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.sharedGroups).toEqual([]);
        });

        it('returns sharedGroups with id and color', () => {
            mockState.sharedGroups = [
                { id: 'group-1', name: 'Family', color: '#FF0000' },
                { id: 'group-2', name: 'Work', color: '#00FF00' },
            ];

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.sharedGroups).toHaveLength(2);
            expect(result.current.sharedGroups).toEqual([
                { id: 'group-1', color: '#FF0000' },
                { id: 'group-2', color: '#00FF00' },
            ]);
        });

        it('handles groups with missing color', () => {
            mockState.sharedGroups = [
                { id: 'group-1', name: 'Family' },
            ];

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.sharedGroups[0].color).toBe('');
        });
    });

    // =========================================================================
    // AC5: Callbacks with DEV Warning
    // =========================================================================

    describe('callbacks (AC5)', () => {
        let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            // Simulate DEV environment
            vi.stubGlobal('import.meta', { env: { DEV: true } });
        });

        afterEach(() => {
            consoleWarnSpy.mockRestore();
            vi.unstubAllGlobals();
        });

        it('provides onEditTransaction callback', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(typeof result.current.onEditTransaction).toBe('function');
        });

        it('provides onViewTrends callback', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(typeof result.current.onViewTrends).toBe('function');
        });

        it('provides onTriggerScan callback', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(typeof result.current.onTriggerScan).toBe('function');
        });

        it('provides onCreateNew callback', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(typeof result.current.onCreateNew).toBe('function');
        });

        it('provides onViewRecentScans callback', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(typeof result.current.onViewRecentScans).toBe('function');
        });

        it('onEditTransaction logs DEV warning when called', () => {
            const { result } = renderHook(() => useDashboardViewData());

            result.current.onEditTransaction({ id: 'tx-1' } as any);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('[useDashboardViewData] onEditTransaction called without _testOverrides')
            );
        });

        it('onViewTrends navigates to trends view', () => {
            mockSetView.mockClear();
            const { result } = renderHook(() => useDashboardViewData());

            result.current.onViewTrends('2026-01');

            expect(mockSetView).toHaveBeenCalledWith('trends');
        });

        it('onViewRecentScans navigates to recent-scans view', () => {
            mockSetView.mockClear();
            const { result } = renderHook(() => useDashboardViewData());

            result.current.onViewRecentScans();

            expect(mockSetView).toHaveBeenCalledWith('recent-scans');
        });

        it('onTriggerScan logs DEV warning when called', () => {
            const { result } = renderHook(() => useDashboardViewData());

            result.current.onTriggerScan();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('[useDashboardViewData] onTriggerScan called without _testOverrides')
            );
        });
    });

    // =========================================================================
    // AC2: Return Type Completeness
    // =========================================================================

    describe('return type completeness (AC2)', () => {
        it('returns all required fields', () => {
            const { result } = renderHook(() => useDashboardViewData());

            // Transaction data
            expect(result.current).toHaveProperty('transactions');
            expect(result.current).toHaveProperty('allTransactions');
            expect(result.current).toHaveProperty('recentScans');

            // User info
            expect(result.current).toHaveProperty('userId');
            expect(result.current).toHaveProperty('appId');

            // Theme/locale
            expect(result.current).toHaveProperty('theme');
            expect(result.current).toHaveProperty('colorTheme');
            expect(result.current).toHaveProperty('fontColorMode');
            expect(result.current).toHaveProperty('lang');
            expect(result.current).toHaveProperty('currency');
            expect(result.current).toHaveProperty('dateFormat');

            // User preferences
            expect(result.current).toHaveProperty('defaultCountry');
            expect(result.current).toHaveProperty('foreignLocationFormat');

            // Formatters
            expect(result.current).toHaveProperty('t');
            expect(result.current).toHaveProperty('formatCurrency');
            expect(result.current).toHaveProperty('formatDate');
            expect(result.current).toHaveProperty('getSafeDate');

            // Shared groups
            expect(result.current).toHaveProperty('sharedGroups');

            // Callbacks
            expect(result.current).toHaveProperty('onCreateNew');
            expect(result.current).toHaveProperty('onViewTrends');
            expect(result.current).toHaveProperty('onEditTransaction');
            expect(result.current).toHaveProperty('onTriggerScan');
            expect(result.current).toHaveProperty('onViewRecentScans');
        });

        it('allTransactions equals transactions (alias)', () => {
            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.allTransactions).toEqual(result.current.transactions);
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('edge cases', () => {
        it('handles undefined preferences gracefully', () => {
            mockState.preferences = undefined as any;

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.defaultCountry).toBe('');
            expect(result.current.foreignLocationFormat).toBe('code');
            expect(result.current.currency).toBe('USD'); // Falls back to theme currency
        });

        it('handles all null/undefined states', () => {
            mockState.user = null;
            mockState.services = null;
            mockState.paginatedTransactions = [];
            mockState.recentScans = [];
            mockState.sharedGroups = [];
            mockState.preferences = undefined as any;

            const { result } = renderHook(() => useDashboardViewData());

            expect(result.current.userId).toBeNull();
            expect(result.current.appId).toBe('');
            expect(result.current.transactions).toEqual([]);
            expect(result.current.recentScans).toEqual([]);
            expect(result.current.sharedGroups).toEqual([]);
        });
    });
});
