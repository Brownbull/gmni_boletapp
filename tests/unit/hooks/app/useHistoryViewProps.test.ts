/**
 * Story 14c-refactor.26: useHistoryViewProps Tests
 * Story 14c-refactor.30b: Expanded tests for all props and isGroupMode logic
 *
 * Tests for the HistoryView data props composition hook.
 * Verifies memoization stability, correct prop composition, and conditional isGroupMode logic.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
    useHistoryViewProps,
    type UseHistoryViewPropsOptions,
} from '../../../../src/hooks/app/useHistoryViewProps';

// =============================================================================
// Test Fixtures
// =============================================================================

function createDefaultOptions(): UseHistoryViewPropsOptions {
    return {
        // Core data
        transactions: [
            { id: 'tx-1', merchant: 'Store 1', total: 1000, date: '2025-01-15' },
        ] as any[],
        transactionsWithRecentScans: [
            { id: 'tx-2', merchant: 'Store 2', total: 500, date: '2025-01-14' },
        ] as any[],

        // User info
        user: {
            displayName: 'Test User',
            email: 'test@example.com',
            uid: 'user-123',
        },
        appId: 'app-id-123',

        // UI settings
        theme: 'light',
        colorTheme: 'normal',
        currency: 'CLP',
        dateFormat: 'DD/MM/YYYY',
        lang: 'es' as const,
        t: vi.fn((key: string) => key),
        formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount}`),
        formatDate: vi.fn((date: string, format: string) => `${date} (${format})`),
        fontColorMode: 'colorful',
        foreignLocationFormat: 'flag',

        // Location defaults
        defaultCity: 'Santiago',
        defaultCountry: 'Chile',

        // Group-related
        activeGroup: undefined,
        isGroupMode: false,
        isAtListenerLimit: false,

        // Filter state
        pendingFilters: null,

        // Pagination
        pagination: { hasMore: false, isLoading: false },
        loadMoreTransactions: vi.fn(),

        // Callbacks
        onEditTransaction: vi.fn(),
        onTransactionsDeleted: vi.fn(),
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('useHistoryViewProps', () => {
    describe('Memoization Stability', () => {
        it('returns same reference when dependencies unchanged', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(() =>
                useHistoryViewProps(options)
            );

            const firstResult = result.current;
            rerender();

            expect(result.current).toBe(firstResult);
        });

        it('returns new reference when dependency changes', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(
                (opts: UseHistoryViewPropsOptions) => useHistoryViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;
            rerender({ ...options, theme: 'dark' });

            expect(result.current).not.toBe(firstResult);
            expect(result.current.theme).toBe('dark');
        });
    });

    describe('Prop Composition - User Info', () => {
        it('composes user info correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.userName).toBe('Test User');
            expect(result.current.userEmail).toBe('test@example.com');
            expect(result.current.userId).toBe('user-123');
        });

        it('handles null user values', () => {
            const options = createDefaultOptions();
            options.user = { displayName: null, email: null, uid: null };

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.userName).toBe('');
            expect(result.current.userEmail).toBe('');
            expect(result.current.userId).toBe('');
        });
    });

    describe('Prop Composition - UI Settings', () => {
        it('passes through colorTheme correctly', () => {
            const options = createDefaultOptions();
            options.colorTheme = 'professional';

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.colorTheme).toBe('professional');
        });

        it('passes through dateFormat correctly', () => {
            const options = createDefaultOptions();
            options.dateFormat = 'MM/DD/YYYY';

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.dateFormat).toBe('MM/DD/YYYY');
        });

        it('passes through formatCurrency function', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.formatCurrency(1000, 'USD')).toBe('USD 1000');
        });

        it('passes through formatDate function', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.formatDate('2025-01-15', 'DD/MM/YYYY')).toBe('2025-01-15 (DD/MM/YYYY)');
        });

        it('passes through fontColorMode correctly', () => {
            const options = createDefaultOptions();
            options.fontColorMode = 'plain';

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.fontColorMode).toBe('plain');
        });

        it('passes through foreignLocationFormat correctly', () => {
            const options = createDefaultOptions();
            options.foreignLocationFormat = 'code';

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.foreignLocationFormat).toBe('code');
        });
    });

    describe('Prop Composition - Location Defaults', () => {
        it('passes through defaultCity correctly', () => {
            const options = createDefaultOptions();
            options.defaultCity = 'Buenos Aires';

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.defaultCity).toBe('Buenos Aires');
        });

        it('passes through defaultCountry correctly', () => {
            const options = createDefaultOptions();
            options.defaultCountry = 'Argentina';

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.defaultCountry).toBe('Argentina');
        });
    });

    describe('Prop Composition - Group Props', () => {
        it('passes through activeGroup when provided', () => {
            const options = createDefaultOptions();
            options.activeGroup = {
                id: 'group-123',
                memberProfiles: {
                    'user-1': { displayName: 'User One', photoURL: 'http://example.com/photo1.jpg' },
                },
            };

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.activeGroup).toEqual({
                id: 'group-123',
                memberProfiles: {
                    'user-1': { displayName: 'User One', photoURL: 'http://example.com/photo1.jpg' },
                },
            });
        });

        it('handles undefined activeGroup', () => {
            const options = createDefaultOptions();
            options.activeGroup = undefined;

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.activeGroup).toBeUndefined();
        });
    });

    describe('Prop Composition - Pagination', () => {
        it('passes through pagination state correctly', () => {
            const options = createDefaultOptions();
            options.pagination = { hasMore: true, isLoading: true };

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.hasMore).toBe(true);
            expect(result.current.isLoadingMore).toBe(true);
        });

        it('provides legacy pagination values', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useHistoryViewProps(options));

            // Legacy values (view handles internally now)
            expect(result.current.historyPage).toBe(1);
            expect(result.current.totalHistoryPages).toBe(1);
        });
    });

    describe('Prop Composition - Core Data', () => {
        it('passes through transactions correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.transactions).toHaveLength(1);
            expect(result.current.transactions[0].id).toBe('tx-1');
        });

        it('maps transactionsWithRecentScans to allTransactions', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.allTransactions).toHaveLength(1);
            expect(result.current.allTransactions[0].id).toBe('tx-2');
        });
    });

    describe('Prop Composition - Callbacks', () => {
        it('passes through onEditTransaction callback', () => {
            const options = createDefaultOptions();
            const mockEditTransaction = vi.fn();
            options.onEditTransaction = mockEditTransaction;

            const { result } = renderHook(() => useHistoryViewProps(options));

            const mockTx = { id: 'tx-1' } as any;
            result.current.onEditTransaction(mockTx);

            expect(mockEditTransaction).toHaveBeenCalledWith(mockTx);
        });

        it('passes through onTransactionsDeleted callback', () => {
            const options = createDefaultOptions();
            const mockOnDeleted = vi.fn();
            options.onTransactionsDeleted = mockOnDeleted;

            const { result } = renderHook(() => useHistoryViewProps(options));

            result.current.onTransactionsDeleted?.(['tx-1', 'tx-2']);

            expect(mockOnDeleted).toHaveBeenCalledWith(['tx-1', 'tx-2']);
        });

        it('handles undefined onTransactionsDeleted', () => {
            const options = createDefaultOptions();
            options.onTransactionsDeleted = undefined;

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.onTransactionsDeleted).toBeUndefined();
        });
    });

    describe('Conditional isGroupMode Logic', () => {
        it('returns actual isAtListenerLimit when NOT in group mode', () => {
            const options = createDefaultOptions();
            options.isGroupMode = false;
            options.isAtListenerLimit = true;

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.isAtListenerLimit).toBe(true);
        });

        it('returns false for isAtListenerLimit when IN group mode', () => {
            const options = createDefaultOptions();
            options.isGroupMode = true;
            options.isAtListenerLimit = true; // Should be overridden to false

            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.isAtListenerLimit).toBe(false);
        });

        it('returns actual loadMoreTransactions when NOT in group mode', () => {
            const options = createDefaultOptions();
            const mockLoadMore = vi.fn();
            options.isGroupMode = false;
            options.loadMoreTransactions = mockLoadMore;

            const { result } = renderHook(() => useHistoryViewProps(options));

            result.current.onLoadMoreTransactions();

            expect(mockLoadMore).toHaveBeenCalled();
        });

        it('returns no-op loadMoreTransactions when IN group mode', () => {
            const options = createDefaultOptions();
            const mockLoadMore = vi.fn();
            options.isGroupMode = true;
            options.loadMoreTransactions = mockLoadMore;

            const { result } = renderHook(() => useHistoryViewProps(options));

            result.current.onLoadMoreTransactions();

            expect(mockLoadMore).not.toHaveBeenCalled();
        });

        it('handles group mode transition correctly', () => {
            const options = createDefaultOptions();
            const mockLoadMore = vi.fn();
            options.isGroupMode = false;
            options.isAtListenerLimit = true;
            options.loadMoreTransactions = mockLoadMore;

            const { result, rerender } = renderHook(
                (opts: UseHistoryViewPropsOptions) => useHistoryViewProps(opts),
                { initialProps: options }
            );

            // Initially NOT in group mode
            expect(result.current.isAtListenerLimit).toBe(true);
            result.current.onLoadMoreTransactions();
            expect(mockLoadMore).toHaveBeenCalledTimes(1);

            // Switch to group mode
            rerender({ ...options, isGroupMode: true });

            expect(result.current.isAtListenerLimit).toBe(false);
            result.current.onLoadMoreTransactions();
            expect(mockLoadMore).toHaveBeenCalledTimes(1); // Still 1, not called again
        });
    });

    // Story 14c-refactor.30c: Tests for deprecated handlers
    describe('Deprecated Handlers (Story 14c-refactor.30c)', () => {
        it('provides onBack as a no-op function', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.onBack).toBeDefined();
            expect(typeof result.current.onBack).toBe('function');

            // Should not throw when called
            expect(() => result.current.onBack()).not.toThrow();
        });

        it('provides onSetHistoryPage as a no-op function', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useHistoryViewProps(options));

            expect(result.current.onSetHistoryPage).toBeDefined();
            expect(typeof result.current.onSetHistoryPage).toBe('function');

            // Should not throw when called with number
            expect(() => result.current.onSetHistoryPage(5)).not.toThrow();

            // Should not throw when called with function
            expect(() => result.current.onSetHistoryPage((prev) => prev + 1)).not.toThrow();
        });

        it('onBack returns undefined (no-op)', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useHistoryViewProps(options));

            const returnValue = result.current.onBack();

            expect(returnValue).toBeUndefined();
        });

        it('onSetHistoryPage returns undefined (no-op)', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useHistoryViewProps(options));

            const returnValue = result.current.onSetHistoryPage(10);

            expect(returnValue).toBeUndefined();
        });
    });
});
