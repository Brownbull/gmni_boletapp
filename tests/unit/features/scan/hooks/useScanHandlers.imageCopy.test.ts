/**
 * TD-18-22: Image copy wiring tests for useScanHandlers.handleQuickSave
 *
 * Verifies that copyPendingToReceipts is called after quick-save
 * when the transaction has imageUrls (pending scan images).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Transaction } from '@/types/transaction';
import type { UseScanHandlersProps } from '@features/scan/hooks/useScanHandlers';
import type { QuickSaveDialogData } from '@/features/scan/types/scanStateMachine';

// Mock firestore service (used internally by createTransactionRepository)
vi.mock('@/services/firestore', () => ({
    addTransaction: vi.fn(() => Promise.resolve('new-tx-id')),
    updateTransaction: vi.fn(() => Promise.resolve()),
}));

// Mock insight engine
vi.mock('@features/insights/services/insightEngineService', () => ({
    generateInsightForTransaction: vi.fn(() =>
        Promise.resolve({ id: 'test-insight', title: 'Test', message: 'msg', icon: '💡', category: 'transaction' })
    ),
    isInsightsSilenced: vi.fn(() => false),
    getDefaultCache: vi.fn(() => ({ silencedUntil: null, recentInsightIds: [] })),
}));

vi.mock('@/utils/confidenceCheck', () => ({
    shouldShowQuickSave: vi.fn(() => true),
    calculateConfidence: vi.fn(() => 0.9),
}));

vi.mock('@entities/transaction', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        reconcileItemsTotal: vi.fn((items) => ({ items, hasDiscrepancy: false, discrepancyAmount: 0 })),
    };
});

// TD-18-22: Mock copyPendingToReceipts to verify wiring
const mockCopyPendingToReceipts = vi.fn(() => Promise.resolve([
    'https://firebasestorage.googleapis.com/v0/b/bucket/o/receipts/image_0.jpg',
]));

vi.mock('@features/scan/services/pendingScanUpload', () => ({
    copyPendingToReceipts: (...args: unknown[]) => mockCopyPendingToReceipts(...args),
    uploadScanImages: vi.fn(),
}));

import { useScanHandlers } from '@features/scan/hooks/useScanHandlers';
import * as firestoreService from '@/services/firestore';

describe('useScanHandlers — TD-18-22 image copy wiring', () => {
    const mockUser = { uid: 'test-user-123' } as User;
    const mockDb = {} as Firestore;
    const mockServices = { db: mockDb, appId: 'test-app-id' };

    const createDefaultProps = (overrides: Partial<UseScanHandlersProps> = {}): UseScanHandlersProps => ({
        user: mockUser,
        services: mockServices,
        userPreferences: {
            defaultCountry: 'Chile', defaultCity: 'Santiago', defaultCurrency: 'CLP',
            language: 'es', theme: 'normal', fontSize: 'medium',
            notificationSettings: { transactionReminders: true, weeklyReports: true, insightNotifications: true },
        },
        transactions: [],
        currency: 'CLP',
        lang: 'es',
        currentTransaction: null,
        insightProfile: { schemaVersion: 1, firstTransactionDate: new Date().toISOString(), totalTransactions: 10, recentInsights: [] },
        insightCache: { silencedUntil: null, recentInsightIds: [] },
        recordInsightShown: vi.fn(() => Promise.resolve()),
        trackTransactionForInsight: vi.fn(() => Promise.resolve()),
        incrementInsightCounter: vi.fn(),
        batchSession: { receipts: [] },
        addToBatch: vi.fn(),
        checkTrusted: vi.fn(() => Promise.resolve(false)),
        recordMerchantScan: vi.fn(() => Promise.resolve({ shouldShowPrompt: false, reason: 'insufficient_scans' })),
        findItemNameMatch: vi.fn(() => null),
        categoryMappings: [],
        findMerchantMatch: vi.fn(() => null),
        applyCategoryMappings: vi.fn((tx) => ({ transaction: tx, appliedMappingIds: [] })),
        incrementMappingUsage: vi.fn(() => Promise.resolve()),
        incrementMerchantMappingUsage: vi.fn(() => Promise.resolve()),
        incrementItemNameMappingUsage: vi.fn(() => Promise.resolve()),
        showScanDialog: vi.fn(),
        dismissScanDialog: vi.fn(),
        dispatchProcessSuccess: vi.fn(),
        resetScanContext: vi.fn(),
        setScanImages: vi.fn(),
        scanOverlay: { reset: vi.fn(), retry: vi.fn() },
        setToastMessage: vi.fn(),
        setCurrentTransaction: vi.fn(),
        setView: vi.fn(),
        navigateToView: vi.fn(),
        setCurrentInsight: vi.fn(),
        setShowInsightCard: vi.fn(),
        setShowBatchSummary: vi.fn(),
        setSessionContext: vi.fn(),
        setAnimateEditViewItems: vi.fn(),
        setSkipScanCompleteModal: vi.fn(),
        setTransactionEditorMode: vi.fn(),
        setIsQuickSaving: vi.fn(),
        isQuickSaving: false,
        setTrustPromptData: vi.fn(),
        setShowTrustPrompt: vi.fn(),
        t: vi.fn((key) => key),
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('calls copyPendingToReceipts when transaction has imageUrls', async () => {
        const txWithImages: Transaction = {
            merchant: 'Test Store',
            date: '2026-04-06',
            total: 1500,
            category: 'Supermarket',
            items: [{ name: 'Item 1', totalPrice: 1500 }],
            country: 'Chile',
            city: 'Santiago',
            currency: 'CLP',
            imageUrls: ['https://firebasestorage.googleapis.com/v0/b/bucket/o/pending/img.jpg'],
        };
        const dialogData: QuickSaveDialogData = { transaction: txWithImages, confidence: 0.9 };
        const props = createDefaultProps();
        const { result } = renderHook(() => useScanHandlers(props));

        await act(async () => {
            await result.current.handleQuickSave(dialogData);
        });

        // Wait for fire-and-forget to resolve
        await vi.waitFor(() => {
            expect(mockCopyPendingToReceipts).toHaveBeenCalledWith(
                txWithImages.imageUrls,
                'test-user-123',
                'new-tx-id',
            );
        });

        // Verify Firestore update was called with new permanent URLs
        await vi.waitFor(() => {
            expect(firestoreService.updateTransaction).toHaveBeenCalledWith(
                mockDb,
                'test-user-123',
                'test-app-id',
                'new-tx-id',
                { imageUrls: ['https://firebasestorage.googleapis.com/v0/b/bucket/o/receipts/image_0.jpg'] },
            );
        });
    });

    it('does NOT call copyPendingToReceipts when transaction has no imageUrls', async () => {
        const txWithoutImages: Transaction = {
            merchant: 'Test Store',
            date: '2026-04-06',
            total: 1500,
            category: 'Supermarket',
            items: [{ name: 'Item 1', totalPrice: 1500 }],
            country: 'Chile',
            city: 'Santiago',
            currency: 'CLP',
        };
        const dialogData: QuickSaveDialogData = { transaction: txWithoutImages, confidence: 0.9 };
        const props = createDefaultProps();
        const { result } = renderHook(() => useScanHandlers(props));

        await act(async () => {
            await result.current.handleQuickSave(dialogData);
        });

        expect(mockCopyPendingToReceipts).not.toHaveBeenCalled();
    });

    it('does NOT call copyPendingToReceipts when imageUrls is empty array', async () => {
        const txEmptyImages: Transaction = {
            merchant: 'Test Store',
            date: '2026-04-06',
            total: 1500,
            category: 'Supermarket',
            items: [{ name: 'Item 1', totalPrice: 1500 }],
            country: 'Chile',
            city: 'Santiago',
            currency: 'CLP',
            imageUrls: [],
        };
        const dialogData: QuickSaveDialogData = { transaction: txEmptyImages, confidence: 0.9 };
        const props = createDefaultProps();
        const { result } = renderHook(() => useScanHandlers(props));

        await act(async () => {
            await result.current.handleQuickSave(dialogData);
        });

        expect(mockCopyPendingToReceipts).not.toHaveBeenCalled();
    });

    it('handles copyPendingToReceipts failure gracefully (fire-and-forget)', async () => {
        mockCopyPendingToReceipts.mockRejectedValueOnce(new Error('Copy failed'));
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const txWithImages: Transaction = {
            merchant: 'Test Store',
            date: '2026-04-06',
            total: 1500,
            category: 'Supermarket',
            items: [{ name: 'Item 1', totalPrice: 1500 }],
            country: 'Chile',
            city: 'Santiago',
            currency: 'CLP',
            imageUrls: ['https://firebasestorage.googleapis.com/v0/b/bucket/o/pending/img.jpg'],
        };
        const dialogData: QuickSaveDialogData = { transaction: txWithImages, confidence: 0.9 };
        const props = createDefaultProps();
        const { result } = renderHook(() => useScanHandlers(props));

        await act(async () => {
            await result.current.handleQuickSave(dialogData);
        });

        // Wait for fire-and-forget to reject
        await vi.waitFor(() => {
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Failed to copy scan images to receipts:',
                expect.any(Error),
            );
        });

        // Transaction save should still have succeeded (not blocked by image copy failure)
        expect(firestoreService.addTransaction).toHaveBeenCalledWith(
            mockDb,
            'test-user-123',
            'test-app-id',
            expect.objectContaining({ merchant: 'Test Store', total: 1500 }),
        );

        consoleWarnSpy.mockRestore();
    });
});
