/**
 * Story 14e-31: useItemsViewData Hook Tests
 *
 * Tests the composition hook that provides data for ItemsView.
 * Following the pattern established by useHistoryViewData.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useItemsViewData } from '@/views/ItemsView/useItemsViewData';

// =============================================================================
// Mocks
// =============================================================================

// Mock useAuth
const mockUser = {
    uid: 'test-user-123',
    displayName: 'Test User',
    email: 'test@example.com',
};
const mockServices = { appId: 'test-app-id' };

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(() => ({
        user: mockUser,
        services: mockServices,
    })),
}));

// Mock usePaginatedTransactions
const mockTransactions = [
    { id: 'tx-1', merchant: 'Store A', total: 100, date: '2026-01-15' },
    { id: 'tx-2', merchant: 'Store B', total: 200, date: '2026-01-14' },
];

vi.mock('@/hooks/usePaginatedTransactions', () => ({
    usePaginatedTransactions: vi.fn(() => ({
        transactions: mockTransactions,
        hasMore: false,
        loadMore: vi.fn(),
        loadingMore: false,
        isAtListenerLimit: false,
    })),
}));

// Mock useRecentScans
vi.mock('@/hooks/useRecentScans', () => ({
    useRecentScans: vi.fn(() => []),
}));

// Mock useTheme
vi.mock('@/contexts/ThemeContext', () => ({
    useTheme: vi.fn(() => ({
        theme: 'light',
        colorTheme: 'Normal',
        fontColorMode: 'colorful',
        lang: 'es',
        currency: 'CLP',
        dateFormat: 'LatAm',
    })),
}));

// Mock translations
vi.mock('@/utils/translations', () => ({
    TRANSLATIONS: {
        en: { test: 'Test' },
        es: { test: 'Prueba' },
    },
}));

// Mock formatters
vi.mock('@/utils/currency', () => ({
    formatCurrency: vi.fn((amount: number, currency: string) => `${currency}$${amount}`),
}));

vi.mock('@/utils/date', () => ({
    formatDate: vi.fn((date: string) => date),
}));

// =============================================================================
// Tests
// =============================================================================

describe('useItemsViewData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Transaction Data', () => {
        it('should return transactions from paginated transactions hook', () => {
            const { result } = renderHook(() => useItemsViewData());

            expect(result.current.transactions).toEqual(mockTransactions);
        });

        it('should merge recent scans with paginated transactions', async () => {
            const recentScans = [
                { id: 'recent-1', merchant: 'Recent Store', total: 50, date: '2026-01-16' },
            ];

            // Update mock to return recent scans
            const { useRecentScans } = await import('@/hooks/useRecentScans');
            vi.mocked(useRecentScans).mockReturnValue(recentScans as any);

            const { result } = renderHook(() => useItemsViewData());

            // Recent scans should be at the beginning
            expect(result.current.transactions[0].id).toBe('recent-1');
            expect(result.current.transactions.length).toBe(3);
        });

        it('should deduplicate when recent scan overlaps with paginated', async () => {
            const recentScans = [
                { id: 'tx-1', merchant: 'Store A Updated', total: 150, date: '2026-01-15' },
            ];

            const { useRecentScans } = await import('@/hooks/useRecentScans');
            vi.mocked(useRecentScans).mockReturnValue(recentScans as any);

            const { result } = renderHook(() => useItemsViewData());

            // Should have only 2 transactions (deduplicated)
            expect(result.current.transactions.length).toBe(2);
            // The recent version should be used (at the beginning)
            expect(result.current.transactions[0].merchant).toBe('Store A Updated');
        });
    });

    describe('User Info', () => {
        it('should return user info from auth hook', () => {
            const { result } = renderHook(() => useItemsViewData());

            expect(result.current.user).toEqual({
                uid: mockUser.uid,
                displayName: mockUser.displayName,
                email: mockUser.email,
            });
            expect(result.current.userName).toBe(mockUser.displayName);
            expect(result.current.userEmail).toBe(mockUser.email);
            expect(result.current.userId).toBe(mockUser.uid);
        });

        it('should return appId from services', () => {
            const { result } = renderHook(() => useItemsViewData());

            expect(result.current.appId).toBe(mockServices.appId);
        });

        it('should handle null user gracefully', async () => {
            const { useAuth } = await import('@/hooks/useAuth');
            vi.mocked(useAuth).mockReturnValue({
                user: null,
                services: null,
            } as any);

            const { result } = renderHook(() => useItemsViewData());

            expect(result.current.user).toEqual({
                uid: null,
                displayName: null,
                email: null,
            });
            expect(result.current.userName).toBe('');
            expect(result.current.userEmail).toBe('');
            expect(result.current.userId).toBe(null);
            expect(result.current.appId).toBe('');
        });
    });

    describe('Theme/Locale Settings', () => {
        it('should return theme settings from theme context', () => {
            const { result } = renderHook(() => useItemsViewData());

            expect(result.current.theme).toBe('light');
            expect(result.current.colorTheme).toBe('Normal');
            expect(result.current.fontColorMode).toBe('colorful');
            expect(result.current.lang).toBe('es');
            expect(result.current.currency).toBe('CLP');
            expect(result.current.dateFormat).toBe('LatAm');
        });

        it('should return default country', () => {
            const { result } = renderHook(() => useItemsViewData());

            expect(result.current.defaultCountry).toBe('CL');
        });
    });

    describe('Formatters', () => {
        it('should provide translation function', () => {
            const { result } = renderHook(() => useItemsViewData());

            expect(typeof result.current.t).toBe('function');
            expect(result.current.t('test')).toBe('Prueba'); // Spanish
        });

        it('should provide currency formatter', () => {
            const { result } = renderHook(() => useItemsViewData());

            expect(typeof result.current.formatCurrency).toBe('function');
            const formatted = result.current.formatCurrency(1000, 'CLP');
            expect(formatted).toContain('CLP');
        });

        it('should provide date formatter', () => {
            const { result } = renderHook(() => useItemsViewData());

            expect(typeof result.current.formatDate).toBe('function');
            const formatted = result.current.formatDate('2026-01-15', 'LatAm');
            expect(formatted).toBe('2026-01-15');
        });
    });

    describe('onEditTransaction Handler', () => {
        it('should provide onEditTransaction callback', () => {
            const { result } = renderHook(() => useItemsViewData());

            expect(typeof result.current.onEditTransaction).toBe('function');
        });

        it('should be a no-op stub that logs warning in DEV', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const { result } = renderHook(() => useItemsViewData());

            // Call the stub
            result.current.onEditTransaction('tx-1');

            // In test environment (DEV), should log warning
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[useItemsViewData] onEditTransaction called without _testOverrides')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Return Value Stability', () => {
        it('should return stable formatter references across renders', () => {
            const { result, rerender } = renderHook(() => useItemsViewData());

            const firstT = result.current.t;
            const firstFormatCurrency = result.current.formatCurrency;
            const firstFormatDate = result.current.formatDate;

            rerender();

            expect(result.current.t).toBe(firstT);
            expect(result.current.formatCurrency).toBe(firstFormatCurrency);
            expect(result.current.formatDate).toBe(firstFormatDate);
        });
    });
});
