/**
 * TD-18-22: Image copy wiring tests for useTransactionHandlers.saveTransaction
 *
 * Verifies that copyPendingToReceipts is called after edit-save
 * when the transaction has imageUrls (pending scan images).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Transaction } from '@/types/transaction';
import type { UseTransactionHandlersProps } from '@/hooks/app/useTransactionHandlers';

// Mock at repository level (matches existing pattern from useTransactionHandlers.test.ts)
const { mockRepo } = vi.hoisted(() => ({
    mockRepo: {
        add: vi.fn(() => Promise.resolve('new-tx-id')),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
        wipeAll: vi.fn(() => Promise.resolve()),
        subscribe: vi.fn(),
        subscribeRecentScans: vi.fn(),
        getPage: vi.fn(),
        deleteBatch: vi.fn(),
        updateBatch: vi.fn(),
    },
}));
vi.mock('@/repositories/transactionRepository', () => ({
    createTransactionRepository: vi.fn(() => mockRepo),
}));

vi.mock('@features/insights/services/insightEngineService', () => ({
    generateInsightForTransaction: vi.fn(() =>
        Promise.resolve({ id: 'test-insight', title: 'Test', message: 'msg', icon: '💡', category: 'transaction' })
    ),
    isInsightsSilenced: vi.fn(() => false),
    getDefaultCache: vi.fn(() => ({ silencedUntil: null, recentInsightIds: [] })),
}));

vi.mock('@/utils/csvExport', () => ({ downloadBasicData: vi.fn() }));

const { mockAtomicActions, mockBatchReviewActions } = vi.hoisted(() => ({
    mockAtomicActions: { discardReceiptAtomic: vi.fn(), updateReceiptAtomic: vi.fn() },
    mockBatchReviewActions: { finishEditing: vi.fn(), reset: vi.fn(), discardItem: vi.fn() },
}));
vi.mock('@features/batch-review', () => ({
    atomicBatchActions: mockAtomicActions,
    batchReviewActions: mockBatchReviewActions,
}));

// TD-18-22: Mock copyPendingToReceipts to verify wiring
const mockCopyPendingToReceipts = vi.fn(() => Promise.resolve([
    'https://firebasestorage.googleapis.com/v0/b/bucket/o/receipts%2Fimage_0.jpg',
]));

vi.mock('@features/scan', () => ({
    copyPendingToReceipts: (...args: unknown[]) => mockCopyPendingToReceipts(...args),
}));

import { useTransactionHandlers } from '@/hooks/app/useTransactionHandlers';

describe('useTransactionHandlers — TD-18-22 image copy wiring', () => {
    const mockUser = { uid: 'test-user-123' } as User;
    const mockDb = {} as Firestore;
    const mockServices = { db: mockDb, appId: 'test-app-id' };

    const createDefaultProps = (overrides: Partial<UseTransactionHandlersProps> = {}): UseTransactionHandlersProps => ({
        user: mockUser,
        services: mockServices,
        userPreferences: {
            defaultCountry: 'Chile', defaultCity: 'Santiago', defaultCurrency: 'CLP',
            language: 'es', theme: 'normal', fontSize: 'medium',
            notificationSettings: { transactionReminders: true, weeklyReports: true, insightNotifications: true },
        },
        transactions: [],
        currency: 'CLP',
        insightProfile: { schemaVersion: 1 as const, firstTransactionDate: new Date().toISOString(), totalTransactions: 10, recentInsights: [] },
        insightCache: { silencedUntil: null, recentInsightIds: [] },
        recordInsightShown: vi.fn(() => Promise.resolve()),
        trackTransactionForInsight: vi.fn(() => Promise.resolve()),
        incrementInsightCounter: vi.fn(),
        batchSession: { receipts: [] },
        addToBatch: vi.fn(),
        setToastMessage: vi.fn(),
        setCurrentTransaction: vi.fn(),
        setView: vi.fn(),
        setCurrentInsight: vi.fn(),
        setShowInsightCard: vi.fn(),
        setShowBatchSummary: vi.fn(),
        setSessionContext: vi.fn(),
        setScanImages: vi.fn(),
        batchEditingIndex: null,
        clearBatchEditingIndex: vi.fn(),
        batchReceipts: null,
        t: vi.fn((key) => key),
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('calls copyPendingToReceipts when new transaction has imageUrls (edit-save path)', async () => {
        const txWithImages: Transaction = {
            merchant: 'Test Store',
            date: '2026-04-06',
            total: 2500,
            category: 'Supermarket',
            items: [{ name: 'Item 1', totalPrice: 2500 }],
            country: 'Chile',
            city: 'Santiago',
            currency: 'CLP',
            imageUrls: ['https://firebasestorage.googleapis.com/v0/b/bucket/o/pending/img.jpg'],
        };
        const props = createDefaultProps();
        const { result } = renderHook(() => useTransactionHandlers(props));

        await act(async () => {
            await result.current.saveTransaction(txWithImages);
        });

        await vi.waitFor(() => {
            expect(mockCopyPendingToReceipts).toHaveBeenCalledWith(
                txWithImages.imageUrls,
                'test-user-123',
                'new-tx-id',
            );
        });

        await vi.waitFor(() => {
            expect(mockRepo.update).toHaveBeenCalledWith(
                'new-tx-id',
                { imageUrls: ['https://firebasestorage.googleapis.com/v0/b/bucket/o/receipts%2Fimage_0.jpg'] },
            );
        });
    });

    it('does NOT call copyPendingToReceipts when transaction has no imageUrls', async () => {
        const txWithoutImages: Transaction = {
            merchant: 'Test Store',
            date: '2026-04-06',
            total: 2500,
            category: 'Supermarket',
            items: [{ name: 'Item 1', totalPrice: 2500 }],
            country: 'Chile',
            city: 'Santiago',
            currency: 'CLP',
        };
        const props = createDefaultProps();
        const { result } = renderHook(() => useTransactionHandlers(props));

        await act(async () => {
            await result.current.saveTransaction(txWithoutImages);
        });

        // Allow fire-and-forget chain to settle
        await vi.waitFor(() => {
            expect(mockRepo.add).toHaveBeenCalled();
        });

        expect(mockCopyPendingToReceipts).not.toHaveBeenCalled();
    });

    it('handles copyPendingToReceipts failure gracefully (fire-and-forget)', async () => {
        mockCopyPendingToReceipts.mockRejectedValueOnce(new Error('Copy failed'));
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const txWithImages: Transaction = {
            merchant: 'Test Store',
            date: '2026-04-06',
            total: 2500,
            category: 'Supermarket',
            items: [{ name: 'Item 1', totalPrice: 2500 }],
            country: 'Chile',
            city: 'Santiago',
            currency: 'CLP',
            imageUrls: ['https://firebasestorage.googleapis.com/v0/b/bucket/o/pending/img.jpg'],
        };
        const props = createDefaultProps();
        const { result } = renderHook(() => useTransactionHandlers(props));

        await act(async () => {
            await result.current.saveTransaction(txWithImages);
        });

        await vi.waitFor(() => {
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Failed to copy scan images to receipts:',
                expect.any(Error),
            );
        });

        // Transaction save should still have succeeded
        expect(mockRepo.add).toHaveBeenCalledWith(
            expect.objectContaining({ merchant: 'Test Store', total: 2500 }),
        );

        consoleWarnSpy.mockRestore();
    });
});
