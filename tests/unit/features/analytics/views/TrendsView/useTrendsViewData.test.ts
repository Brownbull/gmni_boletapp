/**
 * Tests for useTrendsViewData Hook
 *
 * Story 14e-25b.1: useTrendsViewData Hook Creation
 *
 * Coverage:
 * - AC1: Hook composition (transactions, user data)
 * - AC2: Theme/locale settings integration
 * - AC2: useShallow usage for multiple Zustand selectors (performance)
 * - AC2: analyticsInitialState from navigation store
 * - AC4: Return type and memoization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    transactions: [
        { id: 'tx-1', merchant: 'Store A', date: '2026-01-15', total: 50, category: 'Groceries' },
        { id: 'tx-2', merchant: 'Store B', date: '2026-01-14', total: 30, category: 'Restaurant' },
        { id: 'tx-3', merchant: 'Store C', date: '2026-01-13', total: 20, category: 'Gas' },
    ],
    // Theme/locale state
    theme: 'light' as const,
    colorTheme: 'mono' as const,
    fontColorMode: 'colorful' as const,
    lang: 'en' as const,
    currency: 'USD',
    // User preferences
    preferences: {
        defaultCity: 'Los Angeles',
        defaultCountry: 'US',
        defaultCurrency: 'USD',
    },
    // Navigation store
    analyticsInitialState: null as any,
    pendingDistributionView: null as 'treemap' | 'donut' | null,
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

// Mock useTransactions
vi.mock('@/hooks/useTransactions', () => ({
    useTransactions: vi.fn(() => mockState.transactions),
}));

// Mock useUserPreferences
vi.mock('@/hooks/useUserPreferences', () => ({
    useUserPreferences: vi.fn(() => ({
        preferences: mockState.preferences,
        isLoading: false,
        updatePreferences: vi.fn(),
    })),
}));

// Story 15-7c: Mock useThemeSettings (ThemeContext removed)
vi.mock('@/shared/stores', () => ({
    useThemeSettings: vi.fn(() => ({
        theme: mockState.theme,
        colorTheme: mockState.colorTheme,
        fontColorMode: mockState.fontColorMode,
        fontSize: 'small',
        fontFamily: 'outfit',
        lang: mockState.lang,
        currency: mockState.currency,
        dateFormat: 'US',
    })),
}));

// Mock navigation store
vi.mock('@/shared/stores/useNavigationStore', () => ({
    useNavigationStore: vi.fn((selector) => {
        const state = {
            pendingDistributionView: mockState.pendingDistributionView,
        };
        return selector(state);
    }),
    useAnalyticsInitialState: vi.fn(() => mockState.analyticsInitialState),
}));

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
}));

// =============================================================================
// Test Setup
// =============================================================================

// Import after mocks are set up
import { useTrendsViewData } from '@features/analytics/views/TrendsView/useTrendsViewData';

describe('useTrendsViewData', () => {
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
        mockState.transactions = [
            { id: 'tx-1', merchant: 'Store A', date: '2026-01-15', total: 50, category: 'Groceries' },
            { id: 'tx-2', merchant: 'Store B', date: '2026-01-14', total: 30, category: 'Restaurant' },
            { id: 'tx-3', merchant: 'Store C', date: '2026-01-13', total: 20, category: 'Gas' },
        ];
        mockState.theme = 'light';
        mockState.colorTheme = 'mono';
        mockState.fontColorMode = 'colorful';
        mockState.lang = 'en';
        mockState.currency = 'USD';
        mockState.preferences = {
            defaultCity: 'Los Angeles',
            defaultCountry: 'US',
            defaultCurrency: 'USD',
        };
        mockState.analyticsInitialState = null;
        mockState.pendingDistributionView = null;
    });

    // =========================================================================
    // AC1: Transaction Data
    // =========================================================================

    describe('transactions data (AC1)', () => {
        it('returns transactions from useTransactions', () => {
            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.transactions).toHaveLength(3);
            expect(result.current.transactions.map((t) => t.id)).toEqual([
                'tx-1',
                'tx-2',
                'tx-3',
            ]);
        });

        it('handles empty transactions array', () => {
            mockState.transactions = [];

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.transactions).toEqual([]);
        });
    });

    // =========================================================================
    // AC1: User Data
    // =========================================================================

    describe('user data (AC1)', () => {
        it('returns user info from auth context', () => {
            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.user).toEqual({
                uid: 'test-user-123',
                displayName: 'Test User',
                email: 'test@example.com',
            });
            expect(result.current.userName).toBe('Test User');
            expect(result.current.userEmail).toBe('test@example.com');
            expect(result.current.userId).toBe('test-user-123');
        });

        it('handles null user gracefully', () => {
            mockState.user = null;
            mockState.services = null;

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.user).toEqual({
                uid: null,
                displayName: null,
                email: null,
            });
            expect(result.current.userName).toBe('');
            expect(result.current.userEmail).toBe('');
            expect(result.current.userId).toBe('');
            expect(result.current.appId).toBe('');
        });

        it('returns appId from services', () => {
            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.appId).toBe('test-app-id');
        });
    });

    // =========================================================================
    // AC2: Theme/Locale Settings
    // =========================================================================

    describe('theme and locale settings (AC2)', () => {
        it('returns theme from useThemeSettings', () => {
            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.theme).toBe('light');
            expect(result.current.colorTheme).toBe('mono');
            expect(result.current.fontColorMode).toBe('colorful');
        });

        it('returns locale settings from useThemeSettings', () => {
            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.lang).toBe('en');
            expect(result.current.locale).toBe('en'); // Alias
        });

        it('returns currency from user preferences', () => {
            mockState.preferences.defaultCurrency = 'CLP';

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.currency).toBe('CLP');
        });

        it('falls back to theme currency when no preference', () => {
            mockState.preferences.defaultCurrency = undefined;
            mockState.currency = 'EUR';

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.currency).toBe('EUR');
        });
    });

    // =========================================================================
    // AC2: Translation Function
    // =========================================================================

    describe('translation function (AC2)', () => {
        it('provides translation function', () => {
            const { result } = renderHook(() => useTrendsViewData());

            expect(typeof result.current.t).toBe('function');
        });

        it('returns translation for known keys', () => {
            const { result } = renderHook(() => useTrendsViewData());

            // Test a known translation key
            const translated = result.current.t('history');
            expect(typeof translated).toBe('string');
            expect(translated).toBe('History');
        });

        it('returns key for unknown translations', () => {
            const { result } = renderHook(() => useTrendsViewData());

            const unknownKey = 'some_unknown_key_xyz';
            expect(result.current.t(unknownKey)).toBe(unknownKey);
        });
    });

    // =========================================================================
    // AC2: Navigation Store - analyticsInitialState
    // =========================================================================

    describe('analytics initial state (AC2)', () => {
        it('returns null analyticsInitialState by default', () => {
            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.analyticsInitialState).toBeNull();
        });

        it('returns analyticsInitialState from navigation store', () => {
            mockState.analyticsInitialState = {
                temporal: { level: 'month', year: 2026, month: 1 },
                distribution: 'treemap',
            };

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.analyticsInitialState).toEqual({
                temporal: { level: 'month', year: 2026, month: 1 },
                distribution: 'treemap',
            });
        });

        it('returns initialDistributionView from navigation store', () => {
            mockState.pendingDistributionView = 'donut';

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.initialDistributionView).toBe('donut');
        });

        it('returns undefined initialDistributionView when not set', () => {
            mockState.pendingDistributionView = null;

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.initialDistributionView).toBeUndefined();
        });
    });

    // =========================================================================
    // AC2: Group Mode
    // =========================================================================

    describe('group mode (AC2)', () => {
        it('returns isGroupMode as false (feature removed)', () => {
            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.isGroupMode).toBe(false);
            expect(result.current.groupName).toBeUndefined();
            expect(result.current.groupMembers).toEqual([]);
        });

        it('returns empty spendingByMember map', () => {
            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.spendingByMember).toBeInstanceOf(Map);
            expect(result.current.spendingByMember.size).toBe(0);
        });
    });

    // =========================================================================
    // AC4: Return Type Completeness
    // =========================================================================

    describe('return type completeness (AC4)', () => {
        it('returns all required fields', () => {
            const { result } = renderHook(() => useTrendsViewData());

            // Transaction data
            expect(result.current).toHaveProperty('transactions');

            // User info
            expect(result.current).toHaveProperty('user');
            expect(result.current).toHaveProperty('userName');
            expect(result.current).toHaveProperty('userEmail');
            expect(result.current).toHaveProperty('userId');
            expect(result.current).toHaveProperty('appId');

            // Theme/locale
            expect(result.current).toHaveProperty('theme');
            expect(result.current).toHaveProperty('colorTheme');
            expect(result.current).toHaveProperty('fontColorMode');
            expect(result.current).toHaveProperty('lang');
            expect(result.current).toHaveProperty('locale');
            expect(result.current).toHaveProperty('currency');

            // Translation
            expect(result.current).toHaveProperty('t');

            // Export state
            expect(result.current).toHaveProperty('exporting');

            // Navigation
            expect(result.current).toHaveProperty('initialDistributionView');
            expect(result.current).toHaveProperty('analyticsInitialState');

            // Group mode
            expect(result.current).toHaveProperty('isGroupMode');
            expect(result.current).toHaveProperty('groupName');
            expect(result.current).toHaveProperty('groupMembers');
            expect(result.current).toHaveProperty('spendingByMember');

            // Callbacks
            expect(result.current).toHaveProperty('onEditTransaction');
        });

        it('provides default exporting as false', () => {
            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.exporting).toBe(false);
        });

        it('provides onEditTransaction callback', () => {
            const { result } = renderHook(() => useTrendsViewData());

            expect(typeof result.current.onEditTransaction).toBe('function');
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('edge cases', () => {
        it('handles undefined preferences gracefully', () => {
            mockState.preferences = undefined as any;

            const { result } = renderHook(() => useTrendsViewData());

            // Should fall back to theme currency
            expect(result.current.currency).toBe('USD');
        });
    });
});
