/**
 * Story 14c-refactor.26: useTrendsViewProps Tests
 * Story 14c-refactor.31b: Expanded to test callback handlers
 *
 * Tests for the TrendsView props composition hook.
 * Verifies memoization stability, correct prop composition, and callback pass-through.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
    useTrendsViewProps,
    type UseTrendsViewPropsOptions,
} from '../../../../src/hooks/app/useTrendsViewProps';
import type { Transaction } from '../../../../src/types/transaction';

// =============================================================================
// Test Fixtures
// =============================================================================

function createDefaultOptions(): UseTrendsViewPropsOptions {
    return {
        transactions: [
            { id: 'tx-1', merchant: 'Store 1', total: 1000, date: '2025-01-15' } as Transaction,
        ],
        user: {
            displayName: 'Test User',
            email: 'test@example.com',
            uid: 'user-123',
        },
        appId: 'app-id-123',
        theme: 'light',
        colorTheme: 'normal',  // Story 14c-refactor.31b: Fixed to valid ColorTheme
        currency: 'CLP',
        locale: 'es' as const,
        t: vi.fn((key: string) => key),
        fontColorMode: 'colorful',  // Story 14c-refactor.31b: Fixed to valid FontColorMode
        exporting: false,
        initialDistributionView: undefined,
        isGroupMode: false,
        groupName: undefined,
        groupMembers: [],
        spendingByMember: {},
        // Story 14c-refactor.31b: Callback handlers
        onEditTransaction: vi.fn(),
        onExporting: vi.fn(),
        onUpgradeRequired: vi.fn(),
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('useTrendsViewProps', () => {
    describe('Memoization Stability', () => {
        it('returns same reference when dependencies unchanged', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(() =>
                useTrendsViewProps(options)
            );

            const firstResult = result.current;
            rerender();

            expect(result.current).toBe(firstResult);
        });

        it('returns new reference when dependency changes', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(
                (opts: UseTrendsViewPropsOptions) => useTrendsViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;
            rerender({ ...options, isGroupMode: true });

            expect(result.current).not.toBe(firstResult);
            expect(result.current.isGroupMode).toBe(true);
        });
    });

    describe('Prop Composition', () => {
        it('composes user info correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useTrendsViewProps(options));

            expect(result.current.userName).toBe('Test User');
            expect(result.current.userEmail).toBe('test@example.com');
            expect(result.current.userId).toBe('user-123');
        });

        it('handles null user values', () => {
            const options = createDefaultOptions();
            options.user = { displayName: null, email: null, uid: null };

            const { result } = renderHook(() => useTrendsViewProps(options));

            expect(result.current.userName).toBe('');
            expect(result.current.userEmail).toBe('');
            expect(result.current.userId).toBe('');
        });

        it('passes through group props correctly', () => {
            const options = createDefaultOptions();
            options.isGroupMode = true;
            options.groupName = 'Family';
            options.groupMembers = [
                { uid: 'u1', displayName: 'User 1' },
                { uid: 'u2', displayName: 'User 2' },
            ];
            options.spendingByMember = { u1: 5000, u2: 3000 };

            const { result } = renderHook(() => useTrendsViewProps(options));

            expect(result.current.isGroupMode).toBe(true);
            expect(result.current.groupName).toBe('Family');
            expect(result.current.groupMembers).toHaveLength(2);
            expect(result.current.spendingByMember).toEqual({ u1: 5000, u2: 3000 });
        });

        it('passes through UI settings correctly', () => {
            const options = createDefaultOptions();
            options.theme = 'dark';
            options.colorTheme = 'professional';  // Story 14c-refactor.31b: Fixed to valid ColorTheme
            options.fontColorMode = 'colorful';
            options.exporting = true;
            options.initialDistributionView = 'donut';

            const { result } = renderHook(() => useTrendsViewProps(options));

            expect(result.current.theme).toBe('dark');
            expect(result.current.colorTheme).toBe('professional');
            expect(result.current.fontColorMode).toBe('colorful');
            expect(result.current.exporting).toBe(true);
            expect(result.current.initialDistributionView).toBe('donut');
        });
    });

    // Story 14c-refactor.31b: Callback handler tests
    describe('Callback Handlers', () => {
        it('passes through onEditTransaction callback', () => {
            const options = createDefaultOptions();
            const mockCallback = vi.fn();
            options.onEditTransaction = mockCallback;

            const { result } = renderHook(() => useTrendsViewProps(options));

            expect(result.current.onEditTransaction).toBe(mockCallback);
        });

        it('passes through onExporting callback', () => {
            const options = createDefaultOptions();
            const mockCallback = vi.fn();
            options.onExporting = mockCallback;

            const { result } = renderHook(() => useTrendsViewProps(options));

            expect(result.current.onExporting).toBe(mockCallback);
        });

        it('passes through onUpgradeRequired callback', () => {
            const options = createDefaultOptions();
            const mockCallback = vi.fn();
            options.onUpgradeRequired = mockCallback;

            const { result } = renderHook(() => useTrendsViewProps(options));

            expect(result.current.onUpgradeRequired).toBe(mockCallback);
        });

        it('handles undefined optional callbacks', () => {
            const options = createDefaultOptions();
            options.onExporting = undefined;
            options.onUpgradeRequired = undefined;

            const { result } = renderHook(() => useTrendsViewProps(options));

            expect(result.current.onExporting).toBeUndefined();
            expect(result.current.onUpgradeRequired).toBeUndefined();
        });

        it('updates reference when callback changes', () => {
            const options = createDefaultOptions();
            const initialCallback = vi.fn();
            const newCallback = vi.fn();
            options.onEditTransaction = initialCallback;

            const { result, rerender } = renderHook(
                (opts: UseTrendsViewPropsOptions) => useTrendsViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;
            rerender({ ...options, onEditTransaction: newCallback });

            expect(result.current).not.toBe(firstResult);
            expect(result.current.onEditTransaction).toBe(newCallback);
        });
    });
});
