/**
 * Tests for useTrendsViewData View Mode Filtering
 *
 * Story 14d-v2-1-10d Phase 2: View Mode Filtering in View Data Hooks
 *
 * TDD Phase 1: RED - Tests for view mode transaction filtering
 *
 * Coverage:
 * - Personal mode: Returns only personal transactions (no sharedGroupId)
 * - Group mode: Returns only transactions matching active group
 * - Filtering applies to transactions array
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Transaction } from '@/types/transaction';

// =============================================================================
// Test Data Factory
// =============================================================================

/**
 * Factory function to create test transactions with minimal required fields.
 * Only includes fields relevant to view mode filtering.
 */
function createTestTransaction(
    id: string,
    sharedGroupId?: string | null
): Transaction {
    return {
        id,
        date: '2026-01-22',
        merchant: `Test Merchant ${id}`,
        category: 'Supermercado' as any,
        total: 100.0,
        items: [],
        sharedGroupId,
    };
}

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
    transactions: [] as Transaction[],
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
    // View mode - key for these tests
    viewMode: 'personal' as 'personal' | 'group',
    viewModeGroup: null as { id: string; name: string } | null,
    sharedGroups: [] as any[],
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

// Mock ThemeContext
vi.mock('@/contexts/ThemeContext', () => ({
    useTheme: vi.fn(() => ({
        theme: mockState.theme,
        colorTheme: mockState.colorTheme,
        fontColorMode: mockState.fontColorMode,
        lang: mockState.lang,
        currency: mockState.currency,
        setTheme: vi.fn(),
        setColorTheme: vi.fn(),
        setFontColorMode: vi.fn(),
        setLang: vi.fn(),
        setCurrency: vi.fn(),
    })),
}));

// Mock ViewModeStore - key for these tests
vi.mock('@/shared/stores/useViewModeStore', () => ({
    useViewMode: vi.fn(() => ({
        mode: mockState.viewMode,
        group: mockState.viewModeGroup,
        groupId: mockState.viewModeGroup?.id ?? null,
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
import { useTrendsViewData } from '@/views/TrendsView/useTrendsViewData';

describe('useTrendsViewData view mode filtering', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset to defaults
        mockState.viewMode = 'personal';
        mockState.viewModeGroup = null;
        mockState.transactions = [];
        mockState.sharedGroups = [];
    });

    // =========================================================================
    // Personal Mode Tests
    // =========================================================================

    describe('Personal mode', () => {
        beforeEach(() => {
            mockState.viewMode = 'personal';
            mockState.viewModeGroup = null;
        });

        it('returns only personal transactions (no sharedGroupId)', () => {
            mockState.transactions = [
                createTestTransaction('tx-1'), // personal (undefined)
                createTestTransaction('tx-2', null), // personal (null)
                createTestTransaction('tx-3', ''), // personal (empty string)
            ];

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.transactions).toHaveLength(3);
            expect(result.current.transactions.map((tx) => tx.id)).toEqual([
                'tx-1',
                'tx-2',
                'tx-3',
            ]);
        });

        it('excludes group-tagged transactions', () => {
            mockState.transactions = [
                createTestTransaction('tx-1'), // personal
                createTestTransaction('tx-2', 'group-abc'), // group
                createTestTransaction('tx-3'), // personal
                createTestTransaction('tx-4', 'group-xyz'), // different group
            ];

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.transactions).toHaveLength(2);
            expect(result.current.transactions.map((tx) => tx.id)).toEqual([
                'tx-1',
                'tx-3',
            ]);
        });

        it('returns empty array when all transactions are group-tagged', () => {
            mockState.transactions = [
                createTestTransaction('tx-1', 'group-abc'),
                createTestTransaction('tx-2', 'group-xyz'),
            ];

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.transactions).toHaveLength(0);
            expect(result.current.transactions).toEqual([]);
        });
    });

    // =========================================================================
    // Group Mode Tests
    // =========================================================================

    describe('Group mode', () => {
        const activeGroupId = 'group-abc';

        beforeEach(() => {
            mockState.viewMode = 'group';
            mockState.viewModeGroup = { id: activeGroupId, name: 'Test Group' };
            mockState.sharedGroups = [
                { id: activeGroupId, name: 'Test Group', color: '#FF0000' },
            ];
        });

        it('returns only transactions matching active group', () => {
            mockState.transactions = [
                createTestTransaction('tx-1', 'group-abc'),
                createTestTransaction('tx-2', 'group-abc'),
            ];

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.transactions).toHaveLength(2);
            expect(result.current.transactions.map((tx) => tx.id)).toEqual([
                'tx-1',
                'tx-2',
            ]);
        });

        it('excludes personal transactions', () => {
            mockState.transactions = [
                createTestTransaction('tx-1', 'group-abc'), // matches
                createTestTransaction('tx-2'), // personal - undefined
                createTestTransaction('tx-3', null), // personal - null
                createTestTransaction('tx-4', ''), // personal - empty
            ];

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.transactions).toHaveLength(1);
            expect(result.current.transactions[0].id).toBe('tx-1');
        });

        it('excludes transactions from other groups', () => {
            mockState.transactions = [
                createTestTransaction('tx-1', 'group-abc'), // matches
                createTestTransaction('tx-2', 'group-xyz'), // different group
                createTestTransaction('tx-3', 'group-def'), // another group
            ];

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.transactions).toHaveLength(1);
            expect(result.current.transactions[0].id).toBe('tx-1');
        });

        it('returns empty array when no transactions match active group', () => {
            mockState.transactions = [
                createTestTransaction('tx-1', 'group-xyz'),
                createTestTransaction('tx-2'),
            ];

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.transactions).toHaveLength(0);
            expect(result.current.transactions).toEqual([]);
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('Edge cases', () => {
        it('handles empty transactions in personal mode', () => {
            mockState.viewMode = 'personal';
            mockState.transactions = [];

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.transactions).toEqual([]);
        });

        it('handles empty transactions in group mode', () => {
            mockState.viewMode = 'group';
            mockState.viewModeGroup = { id: 'group-abc', name: 'Test' };
            mockState.transactions = [];

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.transactions).toEqual([]);
        });

        it('preserves transaction order after filtering', () => {
            mockState.viewMode = 'personal';
            mockState.transactions = [
                createTestTransaction('tx-1'),
                createTestTransaction('tx-2', 'group-abc'),
                createTestTransaction('tx-3'),
                createTestTransaction('tx-4', 'group-xyz'),
                createTestTransaction('tx-5'),
            ];

            const { result } = renderHook(() => useTrendsViewData());

            expect(result.current.transactions.map((tx) => tx.id)).toEqual([
                'tx-1',
                'tx-3',
                'tx-5',
            ]);
        });
    });
});
