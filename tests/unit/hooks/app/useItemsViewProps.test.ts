/**
 * Story 14c-refactor.34c: useItemsViewProps Tests
 *
 * Tests for the ItemsView data props composition hook.
 * Verifies memoization stability and correct prop composition.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
    useItemsViewProps,
    type UseItemsViewPropsOptions,
} from '../../../../src/hooks/app/useItemsViewProps';

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
        items: [
            { name: 'Apple', price: 500, category: 'Produce' },
            { name: 'Bread', price: 300, category: 'Bakery' },
        ],
        city: 'Santiago',
        country: 'Chile',
        ...overrides,
    };
}

function createDefaultOptions(): UseItemsViewPropsOptions {
    return {
        // Core data
        transactions: [createMockTransaction()],

        // User info
        userId: 'user-123',
        appId: 'app-id-123',
        userName: 'Test User',
        userEmail: 'test@example.com',

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

        // Location defaults
        defaultCountry: 'Chile',

        // Callbacks
        onEditTransaction: vi.fn(),
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('useItemsViewProps', () => {
    describe('Memoization Stability', () => {
        it('returns same reference when dependencies unchanged', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(() =>
                useItemsViewProps(options)
            );

            const firstResult = result.current;
            rerender();

            expect(result.current).toBe(firstResult);
        });

        it('returns new reference when theme changes', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(
                (opts: UseItemsViewPropsOptions) => useItemsViewProps(opts),
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
                (opts: UseItemsViewPropsOptions) => useItemsViewProps(opts),
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
                (opts: UseItemsViewPropsOptions) => useItemsViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;
            const newTransactions = [createMockTransaction({ id: 'new-tx' })];
            rerender({ ...options, transactions: newTransactions });

            expect(result.current).not.toBe(firstResult);
            expect(result.current.transactions).toBe(newTransactions);
        });

        it('returns new reference when lang changes', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(
                (opts: UseItemsViewPropsOptions) => useItemsViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;
            rerender({ ...options, lang: 'en' as const });

            expect(result.current).not.toBe(firstResult);
            expect(result.current.lang).toBe('en');
        });
    });

    describe('Prop Composition - Core Data', () => {
        it('passes through transactions correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.transactions).toHaveLength(1);
            expect(result.current.transactions[0].id).toBe('tx-1');
        });

        it('preserves transaction items', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.transactions[0].items).toHaveLength(2);
            expect(result.current.transactions[0].items![0].name).toBe('Apple');
            expect(result.current.transactions[0].items![1].name).toBe('Bread');
        });

        it('handles transactions without items', () => {
            const options = createDefaultOptions();
            options.transactions = [createMockTransaction({ items: undefined })];

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.transactions[0].items).toBeUndefined();
        });

        it('handles empty transactions array', () => {
            const options = createDefaultOptions();
            options.transactions = [];

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.transactions).toHaveLength(0);
        });
    });

    describe('Prop Composition - User Info', () => {
        it('passes through userId correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.userId).toBe('user-123');
        });

        it('handles null userId', () => {
            const options = createDefaultOptions();
            options.userId = null;

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.userId).toBeNull();
        });

        it('passes through appId correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.appId).toBe('app-id-123');
        });

        it('passes through userName correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.userName).toBe('Test User');
        });

        it('handles empty userName', () => {
            const options = createDefaultOptions();
            options.userName = '';

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.userName).toBe('');
        });

        it('passes through userEmail correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.userEmail).toBe('test@example.com');
        });

        it('handles empty userEmail', () => {
            const options = createDefaultOptions();
            options.userEmail = '';

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.userEmail).toBe('');
        });
    });

    describe('Prop Composition - UI Settings', () => {
        it('passes through theme correctly', () => {
            const options = createDefaultOptions();
            options.theme = 'dark';

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.theme).toBe('dark');
        });

        it('passes through colorTheme correctly', () => {
            const options = createDefaultOptions();
            options.colorTheme = 'professional';

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.colorTheme).toBe('professional');
        });

        it('passes through mono colorTheme', () => {
            const options = createDefaultOptions();
            options.colorTheme = 'mono';

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.colorTheme).toBe('mono');
        });

        it('passes through currency correctly', () => {
            const options = createDefaultOptions();
            options.currency = 'USD';

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.currency).toBe('USD');
        });

        it('passes through dateFormat correctly', () => {
            const options = createDefaultOptions();
            options.dateFormat = 'MM/DD/YYYY';

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.dateFormat).toBe('MM/DD/YYYY');
        });

        it('passes through lang correctly', () => {
            const options = createDefaultOptions();
            options.lang = 'en';

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.lang).toBe('en');
        });

        it('passes through formatCurrency function', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.formatCurrency(1000, 'USD')).toBe('USD 1000');
        });

        it('passes through formatDate function', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.formatDate('2025-01-15', 'DD/MM/YYYY')).toBe('2025-01-15 (DD/MM/YYYY)');
        });

        it('passes through fontColorMode correctly', () => {
            const options = createDefaultOptions();
            options.fontColorMode = 'plain';

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.fontColorMode).toBe('plain');
        });

        it('passes through t translation function', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.t('testKey')).toBe('testKey');
        });
    });

    describe('Prop Composition - Location Settings', () => {
        it('passes through defaultCountry correctly', () => {
            const options = createDefaultOptions();
            options.defaultCountry = 'Argentina';

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.defaultCountry).toBe('Argentina');
        });

        it('handles empty defaultCountry', () => {
            const options = createDefaultOptions();
            options.defaultCountry = '';

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.defaultCountry).toBe('');
        });
    });

    describe('Prop Composition - Callbacks', () => {
        it('passes through onEditTransaction callback with single ID', () => {
            const options = createDefaultOptions();
            const mockOnEdit = vi.fn();
            options.onEditTransaction = mockOnEdit;

            const { result } = renderHook(() => useItemsViewProps(options));

            result.current.onEditTransaction('tx-1');

            expect(mockOnEdit).toHaveBeenCalledWith('tx-1');
        });

        it('passes through onEditTransaction callback with all transaction IDs', () => {
            const options = createDefaultOptions();
            const mockOnEdit = vi.fn();
            options.onEditTransaction = mockOnEdit;

            const { result } = renderHook(() => useItemsViewProps(options));

            result.current.onEditTransaction('tx-1', ['tx-1', 'tx-2', 'tx-3']);

            expect(mockOnEdit).toHaveBeenCalledWith('tx-1', ['tx-1', 'tx-2', 'tx-3']);
        });

        it('passes through onEditTransaction callback with undefined allTransactionIds', () => {
            const options = createDefaultOptions();
            const mockOnEdit = vi.fn();
            options.onEditTransaction = mockOnEdit;

            const { result } = renderHook(() => useItemsViewProps(options));

            result.current.onEditTransaction('tx-1', undefined);

            expect(mockOnEdit).toHaveBeenCalledWith('tx-1', undefined);
        });
    });

    describe('Prop Composition - Deprecated Handlers', () => {
        it('provides empty onBack function (deprecated)', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useItemsViewProps(options));

            // onBack should be a function that does nothing (deprecated)
            expect(typeof result.current.onBack).toBe('function');

            // Should not throw when called
            expect(() => result.current.onBack()).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('handles transactions with various item categories', () => {
            const options = createDefaultOptions();
            options.transactions = [
                createMockTransaction({
                    items: [
                        { name: 'Item1', price: 100, category: 'Produce', subcategory: 'Fruits' },
                        { name: 'Item2', price: 200, category: 'Bakery' },
                        { name: 'Item3', price: 300 }, // No category
                    ],
                }),
            ];

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.transactions[0].items).toHaveLength(3);
            expect(result.current.transactions[0].items![0].subcategory).toBe('Fruits');
            expect(result.current.transactions[0].items![2].category).toBeUndefined();
        });

        it('handles transactions with location data', () => {
            const options = createDefaultOptions();
            options.transactions = [
                createMockTransaction({
                    city: 'New York',
                    country: 'USA',
                }),
            ];

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.transactions[0].city).toBe('New York');
            expect(result.current.transactions[0].country).toBe('USA');
        });

        it('handles transactions without location data', () => {
            const options = createDefaultOptions();
            options.transactions = [
                createMockTransaction({
                    city: undefined,
                    country: undefined,
                }),
            ];

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.transactions[0].city).toBeUndefined();
            expect(result.current.transactions[0].country).toBeUndefined();
        });

        it('preserves transaction references', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useItemsViewProps(options));

            // The transactions array should be the same reference as input
            expect(result.current.transactions).toBe(options.transactions);
        });

        it('handles multiple transactions', () => {
            const options = createDefaultOptions();
            options.transactions = [
                createMockTransaction({ id: 'tx-1', merchant: 'Store A' }),
                createMockTransaction({ id: 'tx-2', merchant: 'Store B' }),
                createMockTransaction({ id: 'tx-3', merchant: 'Store C' }),
            ];

            const { result } = renderHook(() => useItemsViewProps(options));

            expect(result.current.transactions).toHaveLength(3);
            expect(result.current.transactions[0].merchant).toBe('Store A');
            expect(result.current.transactions[1].merchant).toBe('Store B');
            expect(result.current.transactions[2].merchant).toBe('Store C');
        });
    });
});
