/**
 * Tests for useHistoryViewData Hook
 *
 * Story 14e-25a.2a: useHistoryViewData Hook Creation
 * Story 14e-25a.2b: Extended to include theme/settings/formatters
 *
 * Coverage:
 * - AC1: Hook composition (transactions merge, pagination, user data)
 * - AC2: Filter state integration from navigation store
 * - AC3: Recent scans merge behavior
 * - AC4: Theme/locale settings integration
 * - AC5: Formatters (t, formatCurrency, formatDate)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { HistoryFilterState } from '@/contexts/HistoryFiltersContext';

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
    hasMore: true,
    loadingMore: false,
    isAtListenerLimit: false,
    recentScans: [
        { id: 'tx-4', merchant: 'Recent Store', date: '2026-01-16', total: 100, category: 'Shopping' },
    ],
    pendingHistoryFilters: null as HistoryFilterState | null,
    // Story 14e-25a.2b: Theme/locale state
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
        foreignLocationFormat: 'code' as const,
    },
    // View mode
    viewMode: 'personal' as const,
    viewModeGroup: null as any,
    sharedGroups: [] as any[],
};

const mockLoadMore = vi.fn();
const mockClearPendingFilters = vi.fn();

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
        loadMore: mockLoadMore,
        loadingMore: mockState.loadingMore,
        isLoading: false,
        isAtListenerLimit: mockState.isAtListenerLimit,
        error: null,
        totalLoaded: mockState.paginatedTransactions.length,
        refetch: vi.fn(),
    })),
}));

// Mock useRecentScans
vi.mock('@/hooks/useRecentScans', () => ({
    useRecentScans: vi.fn(() => mockState.recentScans),
}));

// Mock navigation store
vi.mock('@/shared/stores/useNavigationStore', () => ({
    useNavigationStore: vi.fn((selector) => {
        const state = {
            pendingHistoryFilters: mockState.pendingHistoryFilters,
            clearPendingFilters: mockClearPendingFilters,
        };
        return selector(state);
    }),
    usePendingHistoryFilters: vi.fn(() => mockState.pendingHistoryFilters),
}));

// Story 14e-25a.2b: Mock ThemeContext
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
        setDateFormat: vi.fn(),
    })),
}));

// Mock useUserPreferences
vi.mock('@/hooks/useUserPreferences', () => ({
    useUserPreferences: vi.fn(() => ({
        preferences: mockState.preferences,
        isLoading: false,
        updatePreferences: vi.fn(),
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

// =============================================================================
// Test Setup
// =============================================================================

// Import after mocks are set up
import { useHistoryViewData } from '@/views/HistoryView/useHistoryViewData';

describe('useHistoryViewData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

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
        mockState.hasMore = true;
        mockState.loadingMore = false;
        mockState.isAtListenerLimit = false;
        mockState.recentScans = [
            { id: 'tx-4', merchant: 'Recent Store', date: '2026-01-16', total: 100, category: 'Shopping' },
        ];
        mockState.pendingHistoryFilters = null;

        // Story 14e-25a.2b: Reset theme/locale state
        mockState.theme = 'light';
        mockState.colorTheme = 'mono';
        mockState.fontColorMode = 'colorful';
        mockState.lang = 'en';
        mockState.currency = 'USD';
        mockState.dateFormat = 'US';
        mockState.preferences = {
            defaultCity: 'Los Angeles',
            defaultCountry: 'US',
            foreignLocationFormat: 'code',
        };
        mockState.viewMode = 'personal';
        mockState.viewModeGroup = null;
        mockState.sharedGroups = [];
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // =========================================================================
    // AC1: Hook Composition - Transaction Data
    // =========================================================================

    describe('transactions merge (AC1, AC3)', () => {
        it('returns paginated transactions when no recent scans', () => {
            // Override recent scans to empty
            mockState.recentScans = [];

            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.transactions).toHaveLength(3);
            expect(result.current.transactions.map((t) => t.id)).toEqual([
                'tx-1',
                'tx-2',
                'tx-3',
            ]);
        });

        it('merges recent scans at beginning of list', () => {
            const { result } = renderHook(() => useHistoryViewData());

            // Should have 4 transactions (1 recent + 3 paginated)
            expect(result.current.transactions).toHaveLength(4);

            // Recent scan should be FIRST (AC3: "Recent scans appear at top of list")
            const ids = result.current.transactions.map((t) => t.id);
            expect(ids[0]).toBe('tx-4'); // Recent scan at top
            expect(ids.slice(1)).toEqual(['tx-1', 'tx-2', 'tx-3']); // Paginated follow
        });

        it('deduplicates overlapping transactions by ID', () => {
            // Set up recent scans with a duplicate ID
            mockState.recentScans = [
                { id: 'tx-1', merchant: 'Updated Store A', date: '2026-01-15', total: 55, category: 'Groceries' },
                { id: 'tx-5', merchant: 'New Store', date: '2026-01-17', total: 75, category: 'Pharmacy' },
            ];

            const { result } = renderHook(() => useHistoryViewData());

            // Should have 4 transactions (2 recent + 2 paginated, tx-1 is duplicate removed from paginated)
            expect(result.current.transactions).toHaveLength(4);

            // Recent scan version takes precedence (AC3: recent scans at top)
            const tx1 = result.current.transactions.find((t) => t.id === 'tx-1');
            expect(tx1?.merchant).toBe('Updated Store A'); // Recent version wins
            expect(tx1?.total).toBe(55); // Recent version wins

            // New unique transaction should be included
            const ids = result.current.transactions.map((t) => t.id);
            expect(ids).toContain('tx-5');
        });
    });

    // =========================================================================
    // AC1: Pagination
    // =========================================================================

    describe('pagination (AC1)', () => {
        it('exposes hasMore from paginated hook', () => {
            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.hasMore).toBe(true);
        });

        it('exposes loadMore callback', () => {
            const { result } = renderHook(() => useHistoryViewData());

            expect(typeof result.current.loadMore).toBe('function');

            // Call loadMore
            act(() => {
                result.current.loadMore();
            });

            expect(mockLoadMore).toHaveBeenCalled();
        });

        it('exposes loading state', () => {
            mockState.loadingMore = true;

            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.isLoadingMore).toBe(true);
        });

        it('exposes isAtListenerLimit', () => {
            mockState.isAtListenerLimit = true;

            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.isAtListenerLimit).toBe(true);
        });
    });

    // =========================================================================
    // AC1: User Data
    // =========================================================================

    describe('user data (AC1)', () => {
        it('returns user info from auth context', () => {
            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.user).toEqual({
                uid: 'test-user-123',
                displayName: 'Test User',
                email: 'test@example.com',
            });
        });

        it('handles null user gracefully', () => {
            mockState.user = null;
            mockState.services = null;

            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.user).toEqual({
                uid: null,
                displayName: null,
                email: null,
            });
            expect(result.current.appId).toBe('');
        });

        it('returns appId from services', () => {
            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.appId).toBe('test-app-id');
        });
    });

    // =========================================================================
    // AC2: Filter State Integration
    // =========================================================================

    describe('filter consumption (AC2)', () => {
        it('consumes pendingHistoryFilters from navigation store', () => {
            mockState.pendingHistoryFilters = {
                temporal: { level: 'month', year: 2026, month: 1 },
            } as HistoryFilterState;

            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.pendingFilters).toEqual(mockState.pendingHistoryFilters);
        });

        it('exposes null pendingFilters when none set', () => {
            mockState.pendingHistoryFilters = null;

            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.pendingFilters).toBeNull();
        });

        it('calls clearPendingFilters after consumption', () => {
            mockState.pendingHistoryFilters = {
                temporal: { level: 'week', year: 2026, month: 1 },
            } as HistoryFilterState;

            renderHook(() => useHistoryViewData());

            // Advance timers to trigger the delayed clear
            act(() => {
                vi.runAllTimers();
            });

            expect(mockClearPendingFilters).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // AC3: Recent Scans Merge Behavior
    // =========================================================================

    describe('recent scans merge (AC3)', () => {
        it('places recent scans that are unique in merged list', () => {
            mockState.recentScans = [
                { id: 'recent-1', merchant: 'Fresh Store', date: '2026-01-18', total: 200, category: 'Groceries' },
            ];

            const { result } = renderHook(() => useHistoryViewData());

            const ids = result.current.transactions.map((t) => t.id);
            expect(ids).toContain('recent-1');
            expect(result.current.transactions).toHaveLength(4);
        });

        it('deduplicates by transaction ID (recent scan takes precedence)', () => {
            mockState.recentScans = [
                // Duplicate of tx-2 with different data
                { id: 'tx-2', merchant: 'Modified Store B', date: '2026-01-14', total: 999, category: 'Restaurant' },
            ];

            const { result } = renderHook(() => useHistoryViewData());

            // Should still be 3 transactions (1 recent + 2 paginated, tx-2 duplicate removed from paginated)
            expect(result.current.transactions).toHaveLength(3);

            // Recent scan data takes precedence (AC3: recent scans at top)
            const tx2 = result.current.transactions.find((t) => t.id === 'tx-2');
            expect(tx2?.merchant).toBe('Modified Store B');
            expect(tx2?.total).toBe(999);
        });

        it('preserves all unique transactions from both sources', () => {
            mockState.recentScans = [
                { id: 'recent-a', merchant: 'Store R1', date: '2026-01-19', total: 10, category: 'A' },
                { id: 'recent-b', merchant: 'Store R2', date: '2026-01-20', total: 20, category: 'B' },
            ];

            const { result } = renderHook(() => useHistoryViewData());

            // 3 paginated + 2 recent = 5 total
            expect(result.current.transactions).toHaveLength(5);

            const ids = result.current.transactions.map((t) => t.id);
            expect(ids).toContain('tx-1');
            expect(ids).toContain('tx-2');
            expect(ids).toContain('tx-3');
            expect(ids).toContain('recent-a');
            expect(ids).toContain('recent-b');
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('edge cases', () => {
        it('handles empty transactions gracefully', () => {
            mockState.paginatedTransactions = [];
            mockState.recentScans = [];
            mockState.hasMore = false;

            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.transactions).toEqual([]);
            expect(result.current.allTransactions).toEqual([]);
        });

        it('handles transactions with missing IDs', () => {
            mockState.paginatedTransactions = [
                { id: 'valid-1', merchant: 'Store', date: '2026-01-15', total: 50, category: 'A' },
                { id: '', merchant: 'No ID Store', date: '2026-01-14', total: 30, category: 'B' },
                { id: undefined, merchant: 'Also No ID', date: '2026-01-13', total: 20, category: 'C' } as any,
            ];
            mockState.recentScans = [];

            const { result } = renderHook(() => useHistoryViewData());

            // All paginated are included (no recentScans means return paginatedTransactions directly)
            // Invalid IDs only cause issues when deduplicating against recentScans
            expect(result.current.transactions).toHaveLength(3);
        });

        it('allTransactions equals transactions', () => {
            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.allTransactions).toBe(result.current.transactions);
        });
    });

    // =========================================================================
    // Story 14e-25a.2b: Theme/Locale Settings
    // =========================================================================

    describe('theme and locale settings (Story 14e-25a.2b)', () => {
        it('returns theme from ThemeContext', () => {
            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.theme).toBe('light');
            expect(result.current.colorTheme).toBe('mono');
            expect(result.current.fontColorMode).toBe('colorful');
        });

        it('returns locale settings from ThemeContext', () => {
            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.lang).toBe('en');
            expect(result.current.currency).toBe('USD');
            expect(result.current.dateFormat).toBe('US');
        });

        it('returns user preferences', () => {
            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.defaultCity).toBe('Los Angeles');
            expect(result.current.defaultCountry).toBe('US');
            expect(result.current.foreignLocationFormat).toBe('code');
        });
    });

    // =========================================================================
    // Story 14e-25a.2b: Formatters
    // =========================================================================

    describe('formatters (Story 14e-25a.2b)', () => {
        it('provides translation function', () => {
            const { result } = renderHook(() => useHistoryViewData());

            expect(typeof result.current.t).toBe('function');
            // Test a known translation key
            expect(result.current.t('history')).toBe('History');
        });

        it('provides currency formatter', () => {
            const { result } = renderHook(() => useHistoryViewData());

            expect(typeof result.current.formatCurrency).toBe('function');
            // Function should return a string
            const formatted = result.current.formatCurrency(100, 'USD');
            expect(typeof formatted).toBe('string');
        });

        it('provides date formatter', () => {
            const { result } = renderHook(() => useHistoryViewData());

            expect(typeof result.current.formatDate).toBe('function');
            // Function should return a string
            const formatted = result.current.formatDate('2026-01-15', 'US');
            expect(typeof formatted).toBe('string');
        });
    });

    // =========================================================================
    // Story 14e-25a.2b: Group Mode
    // =========================================================================

    describe('group mode (Story 14e-25a.2b)', () => {
        it('returns isGroupMode as false in personal mode', () => {
            mockState.viewMode = 'personal';
            mockState.viewModeGroup = null;

            const { result } = renderHook(() => useHistoryViewData());

            expect(result.current.isGroupMode).toBe(false);
            expect(result.current.activeGroup).toBeNull();
        });

        it('provides onEditTransaction callback', () => {
            const { result } = renderHook(() => useHistoryViewData());

            expect(typeof result.current.onEditTransaction).toBe('function');
        });
    });
});
