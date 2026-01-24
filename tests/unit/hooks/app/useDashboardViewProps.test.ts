/**
 * Story 14c-refactor.34a: useDashboardViewProps Tests
 *
 * Tests for the DashboardView data props composition hook.
 * Verifies memoization stability and correct prop composition.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
    useDashboardViewProps,
    type UseDashboardViewPropsOptions,
} from '../../../../src/hooks/app/useDashboardViewProps';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockTransaction(overrides: Partial<any> = {}) {
    return {
        id: 'tx-1',
        merchant: 'Test Store',
        date: '2025-01-15',
        total: 1000,
        category: 'Supermercado',
        currency: 'CLP',
        items: [{ name: 'Item 1', price: 500, category: 'Food' }],
        ...overrides,
    };
}

function createDefaultOptions(): UseDashboardViewPropsOptions {
    return {
        // Core data
        transactions: [createMockTransaction()],
        allTransactions: [
            createMockTransaction({ id: 'tx-1' }),
            createMockTransaction({ id: 'tx-2' }),
        ],
        recentScans: [createMockTransaction({ id: 'recent-1' })],

        // User info
        userId: 'user-123',
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
        getSafeDate: vi.fn((val: any) => (val instanceof Date ? val.toISOString() : String(val))),
        fontColorMode: 'colorful',

        // Location defaults
        defaultCountry: 'Chile',
        foreignLocationFormat: 'flag',

        // Group-related
        sharedGroups: undefined,

        // Callbacks
        onCreateNew: vi.fn(),
        onViewTrends: vi.fn(),
        onEditTransaction: vi.fn(),
        onTriggerScan: vi.fn(),
        onViewRecentScans: vi.fn(),
        onTransactionsDeleted: vi.fn(),
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('useDashboardViewProps', () => {
    describe('Memoization Stability', () => {
        it('returns same reference when dependencies unchanged', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(() =>
                useDashboardViewProps(options)
            );

            const firstResult = result.current;
            rerender();

            expect(result.current).toBe(firstResult);
        });

        it('returns new reference when dependency changes', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(
                (opts: UseDashboardViewPropsOptions) => useDashboardViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;
            rerender({ ...options, theme: 'dark' });

            expect(result.current).not.toBe(firstResult);
            expect(result.current.theme).toBe('dark');
        });

        it('returns new reference when currency changes', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(
                (opts: UseDashboardViewPropsOptions) => useDashboardViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;
            rerender({ ...options, currency: 'USD' });

            expect(result.current).not.toBe(firstResult);
            expect(result.current.currency).toBe('USD');
        });

        it('returns new reference when transactions change', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(
                (opts: UseDashboardViewPropsOptions) => useDashboardViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;
            const newTransactions = [createMockTransaction({ id: 'new-tx' })];
            rerender({ ...options, transactions: newTransactions });

            expect(result.current).not.toBe(firstResult);
            expect(result.current.transactions).toBe(newTransactions);
        });
    });

    describe('Prop Composition - Core Data', () => {
        it('passes through transactions correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.transactions).toHaveLength(1);
            expect(result.current.transactions[0].id).toBe('tx-1');
        });

        it('passes through allTransactions correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.allTransactions).toHaveLength(2);
            expect(result.current.allTransactions[0].id).toBe('tx-1');
            expect(result.current.allTransactions[1].id).toBe('tx-2');
        });

        it('passes through recentScans correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.recentScans).toHaveLength(1);
            expect(result.current.recentScans[0].id).toBe('recent-1');
        });
    });

    describe('Prop Composition - User Info', () => {
        it('passes through userId correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.userId).toBe('user-123');
        });

        it('handles null userId', () => {
            const options = createDefaultOptions();
            options.userId = null;

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.userId).toBeNull();
        });

        it('passes through appId correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.appId).toBe('app-id-123');
        });
    });

    describe('Prop Composition - UI Settings', () => {
        it('passes through theme correctly', () => {
            const options = createDefaultOptions();
            options.theme = 'dark';

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.theme).toBe('dark');
        });

        it('passes through colorTheme correctly', () => {
            const options = createDefaultOptions();
            options.colorTheme = 'professional';

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.colorTheme).toBe('professional');
        });

        it('passes through dateFormat correctly', () => {
            const options = createDefaultOptions();
            options.dateFormat = 'MM/DD/YYYY';

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.dateFormat).toBe('MM/DD/YYYY');
        });

        it('passes through lang correctly', () => {
            const options = createDefaultOptions();
            options.lang = 'en';

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.lang).toBe('en');
        });

        it('passes through formatCurrency function', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.formatCurrency(1000, 'USD')).toBe('USD 1000');
        });

        it('passes through formatDate function', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.formatDate('2025-01-15', 'DD/MM/YYYY')).toBe('2025-01-15 (DD/MM/YYYY)');
        });

        it('passes through getSafeDate function', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.getSafeDate('2025-01-15')).toBe('2025-01-15');
        });

        it('passes through fontColorMode correctly', () => {
            const options = createDefaultOptions();
            options.fontColorMode = 'plain';

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.fontColorMode).toBe('plain');
        });

        it('passes through t translation function', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.t('testKey')).toBe('testKey');
        });
    });

    describe('Prop Composition - Location Settings', () => {
        it('passes through defaultCountry correctly', () => {
            const options = createDefaultOptions();
            options.defaultCountry = 'Argentina';

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.defaultCountry).toBe('Argentina');
        });

        it('passes through foreignLocationFormat correctly', () => {
            const options = createDefaultOptions();
            options.foreignLocationFormat = 'code';

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.foreignLocationFormat).toBe('code');
        });
    });

    describe('Prop Composition - Group Props', () => {
        it('handles undefined sharedGroups', () => {
            const options = createDefaultOptions();
            options.sharedGroups = undefined;

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.sharedGroups).toBeUndefined();
        });

        it('passes through sharedGroups when provided', () => {
            const options = createDefaultOptions();
            options.sharedGroups = [
                { id: 'group-1', color: '#FF0000' },
                { id: 'group-2', color: '#00FF00' },
            ];

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.sharedGroups).toHaveLength(2);
            expect(result.current.sharedGroups![0].id).toBe('group-1');
            expect(result.current.sharedGroups![0].color).toBe('#FF0000');
        });
    });

    describe('Prop Composition - Callbacks', () => {
        it('passes through onCreateNew callback', () => {
            const options = createDefaultOptions();
            const mockOnCreateNew = vi.fn();
            options.onCreateNew = mockOnCreateNew;

            const { result } = renderHook(() => useDashboardViewProps(options));

            result.current.onCreateNew();

            expect(mockOnCreateNew).toHaveBeenCalled();
        });

        it('passes through onViewTrends callback', () => {
            const options = createDefaultOptions();
            const mockOnViewTrends = vi.fn();
            options.onViewTrends = mockOnViewTrends;

            const { result } = renderHook(() => useDashboardViewProps(options));

            result.current.onViewTrends('2025-01');

            expect(mockOnViewTrends).toHaveBeenCalledWith('2025-01');
        });

        it('passes through onViewTrends with null', () => {
            const options = createDefaultOptions();
            const mockOnViewTrends = vi.fn();
            options.onViewTrends = mockOnViewTrends;

            const { result } = renderHook(() => useDashboardViewProps(options));

            result.current.onViewTrends(null);

            expect(mockOnViewTrends).toHaveBeenCalledWith(null);
        });

        it('passes through onEditTransaction callback', () => {
            const options = createDefaultOptions();
            const mockOnEdit = vi.fn();
            options.onEditTransaction = mockOnEdit;

            const { result } = renderHook(() => useDashboardViewProps(options));

            const mockTx = createMockTransaction();
            result.current.onEditTransaction(mockTx);

            expect(mockOnEdit).toHaveBeenCalledWith(mockTx);
        });

        it('passes through onTriggerScan callback', () => {
            const options = createDefaultOptions();
            const mockOnTriggerScan = vi.fn();
            options.onTriggerScan = mockOnTriggerScan;

            const { result } = renderHook(() => useDashboardViewProps(options));

            result.current.onTriggerScan();

            expect(mockOnTriggerScan).toHaveBeenCalled();
        });

        it('passes through onViewRecentScans callback', () => {
            const options = createDefaultOptions();
            const mockOnViewRecentScans = vi.fn();
            options.onViewRecentScans = mockOnViewRecentScans;

            const { result } = renderHook(() => useDashboardViewProps(options));

            result.current.onViewRecentScans();

            expect(mockOnViewRecentScans).toHaveBeenCalled();
        });

        it('passes through onTransactionsDeleted callback', () => {
            const options = createDefaultOptions();
            const mockOnDeleted = vi.fn();
            options.onTransactionsDeleted = mockOnDeleted;

            const { result } = renderHook(() => useDashboardViewProps(options));

            result.current.onTransactionsDeleted?.(['tx-1', 'tx-2']);

            expect(mockOnDeleted).toHaveBeenCalledWith(['tx-1', 'tx-2']);
        });

        it('handles undefined onTransactionsDeleted', () => {
            const options = createDefaultOptions();
            options.onTransactionsDeleted = undefined;

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.onTransactionsDeleted).toBeUndefined();
        });
    });

    describe('Edge Cases', () => {
        it('handles empty transactions array', () => {
            const options = createDefaultOptions();
            options.transactions = [];
            options.allTransactions = [];
            options.recentScans = [];

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.transactions).toHaveLength(0);
            expect(result.current.allTransactions).toHaveLength(0);
            expect(result.current.recentScans).toHaveLength(0);
        });

        it('handles empty sharedGroups array', () => {
            const options = createDefaultOptions();
            options.sharedGroups = [];

            const { result } = renderHook(() => useDashboardViewProps(options));

            expect(result.current.sharedGroups).toHaveLength(0);
        });

        it('preserves transaction references', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useDashboardViewProps(options));

            // The arrays should be the same reference as inputs
            expect(result.current.transactions).toBe(options.transactions);
            expect(result.current.allTransactions).toBe(options.allTransactions);
            expect(result.current.recentScans).toBe(options.recentScans);
        });
    });
});
