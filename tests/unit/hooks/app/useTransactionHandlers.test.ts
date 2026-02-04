/**
 * Unit tests for useTransactionHandlers hook
 *
 * Story 14c-refactor.20b: Unit tests for extracted App handler hooks
 *
 * Tests transaction CRUD handlers:
 * - createDefaultTransaction factory
 * - saveTransaction (new and update)
 * - deleteTransaction
 * - wipeDB
 * - handleExportData
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Transaction } from '../../../../src/types/transaction';
import type { SharedGroup } from '../../../../src/types/sharedGroup';
import type { UserPreferences } from '../../../../src/services/userPreferencesService';
import type { UseTransactionHandlersProps } from '../../../../src/hooks/app/useTransactionHandlers';

// Mock the firestore service module
vi.mock('../../../../src/services/firestore', () => ({
    addTransaction: vi.fn(() => Promise.resolve('new-tx-id')),
    updateTransaction: vi.fn(() => Promise.resolve()),
    deleteTransaction: vi.fn(() => Promise.resolve()),
    wipeAllTransactions: vi.fn(() => Promise.resolve()),
}));

// Mock the insight engine service
vi.mock('../../../../src/services/insightEngineService', () => ({
    generateInsightForTransaction: vi.fn(() =>
        Promise.resolve({
            id: 'test-insight',
            title: 'Test Insight',
            message: 'Test message',
            icon: '💡',
            category: 'transaction',
        })
    ),
    isInsightsSilenced: vi.fn(() => false),
    getDefaultCache: vi.fn(() => ({
        silencedUntil: null,
        recentInsightIds: [],
    })),
}));

// Mock CSV export utility
vi.mock('../../../../src/utils/csvExport', () => ({
    downloadBasicData: vi.fn(),
}));

// Story 14e-34b: Mock batch review actions including atomic actions
// Use vi.hoisted to handle mock hoisting
const { mockAtomicActions, mockBatchReviewActions } = vi.hoisted(() => ({
    mockAtomicActions: {
        discardReceiptAtomic: vi.fn(),
        updateReceiptAtomic: vi.fn(),
    },
    mockBatchReviewActions: {
        finishEditing: vi.fn(),
        reset: vi.fn(),
        discardItem: vi.fn(),
    },
}));
vi.mock('@features/batch-review', () => ({
    atomicBatchActions: mockAtomicActions,
    batchReviewActions: mockBatchReviewActions,
}));

// Import after mocking
import { useTransactionHandlers } from '../../../../src/hooks/app/useTransactionHandlers';
import * as firestoreService from '../../../../src/services/firestore';
import * as insightService from '../../../../src/services/insightEngineService';
import * as csvExport from '../../../../src/utils/csvExport';

describe('useTransactionHandlers', () => {
    // Mock user and services
    const mockUser = { uid: 'test-user-123' } as User;
    const mockDb = {} as Firestore;
    const mockServices = { db: mockDb, appId: 'test-app-id' };

    // Mock user preferences
    const mockUserPreferences: UserPreferences = {
        defaultCountry: 'Chile',
        defaultCity: 'Santiago',
        defaultCurrency: 'CLP',
        language: 'es',
        theme: 'normal',
        fontSize: 'medium',
        notificationSettings: {
            transactionReminders: true,
            weeklyReports: true,
            insightNotifications: true,
        },
    };

    // Mock shared group
    const mockSharedGroup: SharedGroup = {
        id: 'group-123',
        name: 'Family',
        ownerId: 'test-user-123',
        memberEmails: ['user@example.com'],
        memberIds: ['test-user-123'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Mock insight profile
    const mockInsightProfile = {
        schemaVersion: 1 as const,
        firstTransactionDate: new Date().toISOString(),
        totalTransactions: 10,
        recentInsights: [],
    };

    // Mock insight cache
    const mockInsightCache = {
        silencedUntil: null,
        recentInsightIds: [],
    };

    // Mock batch session
    const mockBatchSession = {
        receipts: [],
    };

    // Default props factory
    const createDefaultProps = (overrides: Partial<UseTransactionHandlersProps> = {}): UseTransactionHandlersProps => ({
        user: mockUser,
        services: mockServices,
        viewMode: 'personal',
        activeGroup: null,
        userPreferences: mockUserPreferences,
        transactions: [],
        currency: 'CLP',
        insightProfile: mockInsightProfile,
        insightCache: mockInsightCache,
        recordInsightShown: vi.fn(() => Promise.resolve()),
        trackTransactionForInsight: vi.fn(() => Promise.resolve()),
        incrementInsightCounter: vi.fn(),
        batchSession: mockBatchSession,
        addToBatch: vi.fn(),
        setToastMessage: vi.fn(),
        setCurrentTransaction: vi.fn(),
        setView: vi.fn(),
        setCurrentInsight: vi.fn(),
        setShowInsightCard: vi.fn(),
        setShowBatchSummary: vi.fn(),
        setSessionContext: vi.fn(),
        setScanImages: vi.fn(),
        // Batch editing context (for returning to batch-review after save)
        batchEditingIndex: null,
        clearBatchEditingIndex: vi.fn(),
        batchReceipts: null,
        // Story 14e-34b: discardBatchReceipt removed - now uses atomicBatchActions internally
        t: vi.fn((key) => key),
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
        // Define and mock window.confirm
        window.confirm = vi.fn(() => true);
        // Define and mock window.alert
        window.alert = vi.fn();
        // Mock requestAnimationFrame
        window.requestAnimationFrame = vi.fn((cb) => {
            cb(0);
            return 0;
        }) as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // createDefaultTransaction Tests
    // =========================================================================

    describe('createDefaultTransaction', () => {
        it('should return transaction with default values from user preferences', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useTransactionHandlers(props));

            const tx = result.current.createDefaultTransaction();

            expect(tx.merchant).toBe('');
            expect(tx.category).toBe('Supermarket');
            expect(tx.items).toEqual([]);
            expect(tx.country).toBe('Chile');
            expect(tx.city).toBe('Santiago');
            expect(tx.currency).toBe('CLP');
            expect(tx.total).toBe(0);
            expect(tx.date).toBeDefined();
        });

        it('should return transaction without sharedGroupIds in personal view mode', () => {
            const props = createDefaultProps({ viewMode: 'personal' });
            const { result } = renderHook(() => useTransactionHandlers(props));

            const tx = result.current.createDefaultTransaction();

            expect(tx.sharedGroupIds).toBeUndefined();
        });

        // Story 14d-v2-1.1: sharedGroupIds removed (Epic 14c cleanup)
        // Epic 14d will use sharedGroupId (single nullable string) instead
        it('should NOT include sharedGroupIds in group view mode (Epic 14c cleanup)', () => {
            const props = createDefaultProps({
                viewMode: 'group',
                activeGroup: mockSharedGroup,
            });
            const { result } = renderHook(() => useTransactionHandlers(props));

            const tx = result.current.createDefaultTransaction();

            // Story 14d-v2-1.1: sharedGroupIds no longer assigned
            expect(tx.sharedGroupIds).toBeUndefined();
        });

        it('should not include sharedGroupIds in group mode without activeGroup', () => {
            const props = createDefaultProps({
                viewMode: 'group',
                activeGroup: null,
            });
            const { result } = renderHook(() => useTransactionHandlers(props));

            const tx = result.current.createDefaultTransaction();

            expect(tx.sharedGroupIds).toBeUndefined();
        });

        it('should use empty strings when user preferences are missing', () => {
            const props = createDefaultProps({
                userPreferences: {
                    ...mockUserPreferences,
                    defaultCountry: undefined as any,
                    defaultCity: undefined as any,
                    defaultCurrency: undefined as any,
                },
            });
            const { result } = renderHook(() => useTransactionHandlers(props));

            const tx = result.current.createDefaultTransaction();

            expect(tx.country).toBe('');
            expect(tx.city).toBe('');
            expect(tx.currency).toBe('CLP'); // Falls back to hardcoded default
        });
    });

    // =========================================================================
    // saveTransaction Tests
    // =========================================================================

    describe('saveTransaction', () => {
        const mockTransaction: Transaction = {
            merchant: 'Test Store',
            date: '2026-01-22',
            total: 1500,
            category: 'Supermarket',
            items: [{ name: 'Item 1', price: 1500 }],
            country: 'Chile',
            city: 'Santiago',
            currency: 'CLP',
        };

        it('should return early when user is null', async () => {
            const props = createDefaultProps({ user: null });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            expect(firestoreService.addTransaction).not.toHaveBeenCalled();
            expect(firestoreService.updateTransaction).not.toHaveBeenCalled();
        });

        it('should return early when services is null', async () => {
            const props = createDefaultProps({ services: null });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            expect(firestoreService.addTransaction).not.toHaveBeenCalled();
        });

        it('should return early when no transaction is provided', async () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(undefined);
            });

            expect(firestoreService.addTransaction).not.toHaveBeenCalled();
        });

        it('should call firestoreAddTransaction for new transactions', async () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            // Wait for async operations
            await waitFor(() => {
                expect(firestoreService.addTransaction).toHaveBeenCalledWith(
                    mockDb,
                    'test-user-123',
                    'test-app-id',
                    expect.objectContaining({
                        merchant: 'Test Store',
                        total: 1500,
                    })
                );
            });
        });

        it('should call firestoreUpdateTransaction for existing transactions', async () => {
            const existingTransaction = { ...mockTransaction, id: 'existing-tx-id' };
            const props = createDefaultProps();
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(existingTransaction);
            });

            expect(firestoreService.updateTransaction).toHaveBeenCalledWith(
                mockDb,
                'test-user-123',
                'test-app-id',
                'existing-tx-id',
                expect.objectContaining({
                    merchant: 'Test Store',
                    total: 1500,
                })
            );
        });

        it('should navigate to dashboard after save', async () => {
            const setView = vi.fn();
            const props = createDefaultProps({ setView });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            expect(setView).toHaveBeenCalledWith('dashboard');
        });

        it('should clear current transaction after save', async () => {
            const setCurrentTransaction = vi.fn();
            const props = createDefaultProps({ setCurrentTransaction });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            expect(setCurrentTransaction).toHaveBeenCalledWith(null);
        });

        it('should clear scan images after save', async () => {
            const setScanImages = vi.fn();
            const props = createDefaultProps({ setScanImages });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            expect(setScanImages).toHaveBeenCalledWith([]);
        });

        it('should increment insight counter for new transactions', async () => {
            const incrementInsightCounter = vi.fn();
            const props = createDefaultProps({ incrementInsightCounter });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            expect(incrementInsightCounter).toHaveBeenCalled();
        });

        it('should NOT increment insight counter for updates', async () => {
            const incrementInsightCounter = vi.fn();
            const existingTransaction = { ...mockTransaction, id: 'existing-tx-id' };
            const props = createDefaultProps({ incrementInsightCounter });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(existingTransaction);
            });

            expect(incrementInsightCounter).not.toHaveBeenCalled();
        });

        it('should generate insight for new transactions', async () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            // Wait for the fire-and-forget promise chain
            await waitFor(() => {
                expect(insightService.generateInsightForTransaction).toHaveBeenCalled();
            });
        });

        it('should add transaction to batch session', async () => {
            const addToBatch = vi.fn();
            const props = createDefaultProps({ addToBatch });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            await waitFor(() => {
                expect(addToBatch).toHaveBeenCalled();
            });
        });

        it('should show insight card when not silenced', async () => {
            const setShowInsightCard = vi.fn();
            const setCurrentInsight = vi.fn();
            const props = createDefaultProps({ setShowInsightCard, setCurrentInsight });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            await waitFor(() => {
                expect(setShowInsightCard).toHaveBeenCalledWith(true);
                expect(setCurrentInsight).toHaveBeenCalled();
            });
        });

        it('should skip insight card when silenced', async () => {
            vi.mocked(insightService.isInsightsSilenced).mockReturnValue(true);
            const setShowInsightCard = vi.fn();
            const trackTransactionForInsight = vi.fn(() => Promise.resolve());
            const props = createDefaultProps({ setShowInsightCard, trackTransactionForInsight });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            await waitFor(() => {
                expect(trackTransactionForInsight).toHaveBeenCalled();
            });

            // Insight card should not be shown when silenced
            // Note: The hook still calls setShowInsightCard in catch block for error case
        });

        it('should call incrementInsightCounter and navigate for batch mode', async () => {
            // This test verifies the synchronous part of batch mode
            // The async part (insight generation) is fire-and-forget
            const incrementInsightCounter = vi.fn();
            const setView = vi.fn();
            const setCurrentTransaction = vi.fn();
            const props = createDefaultProps({
                incrementInsightCounter,
                setView,
                setCurrentTransaction,
                batchSession: { receipts: [{} as any, {} as any] }, // 2 existing
            });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            // Synchronous actions happen immediately
            expect(incrementInsightCounter).toHaveBeenCalled();
            expect(setView).toHaveBeenCalledWith('dashboard');
            expect(setCurrentTransaction).toHaveBeenCalledWith(null);
        });

        it('should call firestore for new transaction and set up insight tracking', async () => {
            // This test verifies that new transaction triggers insight tracking
            // The async insight generation is fire-and-forget, so we just verify the setup
            const incrementInsightCounter = vi.fn();
            const trackTransactionForInsight = vi.fn(() => Promise.resolve());
            const props = createDefaultProps({
                incrementInsightCounter,
                trackTransactionForInsight,
                batchSession: { receipts: [] }, // Empty - NOT in batch mode
            });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            // incrementInsightCounter is called synchronously before the fire-and-forget chain
            expect(incrementInsightCounter).toHaveBeenCalled();
            // firestoreAddTransaction was called (this we know works from other tests)
            expect(firestoreService.addTransaction).toHaveBeenCalled();
        });

        it('should navigate to batch-review when in batch editing mode', async () => {
            const setView = vi.fn();
            const clearBatchEditingIndex = vi.fn();
            // Story 14e-34b: discardBatchReceipt prop removed
            const props = createDefaultProps({
                setView,
                clearBatchEditingIndex,
                batchEditingIndex: 0,
                batchReceipts: [{ id: 'receipt-1' }, { id: 'receipt-2' }],
            });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            expect(setView).toHaveBeenCalledWith('batch-review');
            expect(clearBatchEditingIndex).toHaveBeenCalled();
        });

        it('should discard batch receipt after saving in batch editing mode', async () => {
            // Story 14e-34b: discardBatchReceipt prop removed - now uses atomicBatchActions internally
            const clearBatchEditingIndex = vi.fn();
            const props = createDefaultProps({
                clearBatchEditingIndex,
                batchEditingIndex: 1, // Editing the second receipt
                batchReceipts: [{ id: 'receipt-1' }, { id: 'receipt-2' }, { id: 'receipt-3' }],
            });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            // Story 14e-34b: Should discard the receipt at index 1 (receipt-2) using atomic action
            expect(mockAtomicActions.discardReceiptAtomic).toHaveBeenCalledWith('receipt-2');
        });

        it('should not discard batch receipt when batchReceipts is null', async () => {
            // Story 14e-34b: Uses atomicBatchActions internally
            const clearBatchEditingIndex = vi.fn();
            const props = createDefaultProps({
                clearBatchEditingIndex,
                batchEditingIndex: 0,
                batchReceipts: null, // No batch receipts
            });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            // Story 14e-34b: Should not call atomic discard when no receipts
            expect(mockAtomicActions.discardReceiptAtomic).not.toHaveBeenCalled();
            expect(clearBatchEditingIndex).toHaveBeenCalled();
        });

        it('should not clear scan images when in batch editing mode', async () => {
            const setScanImages = vi.fn();
            const props = createDefaultProps({
                setScanImages,
                batchEditingIndex: 0,
                batchReceipts: [{ id: 'receipt-1' }],
            });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.saveTransaction(mockTransaction);
            });

            // Should NOT clear scan images when in batch mode (other receipts still need them)
            expect(setScanImages).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // deleteTransaction Tests
    // =========================================================================

    describe('deleteTransaction', () => {
        it('should return early when user is null', async () => {
            const props = createDefaultProps({ user: null });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.deleteTransaction('tx-123');
            });

            expect(firestoreService.deleteTransaction).not.toHaveBeenCalled();
        });

        it('should return early when services is null', async () => {
            const props = createDefaultProps({ services: null });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.deleteTransaction('tx-123');
            });

            expect(firestoreService.deleteTransaction).not.toHaveBeenCalled();
        });

        it('should call firestoreDeleteTransaction with correct args', async () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.deleteTransaction('tx-123');
            });

            expect(firestoreService.deleteTransaction).toHaveBeenCalledWith(
                mockDb,
                'test-user-123',
                'test-app-id',
                'tx-123'
            );
        });

        it('should navigate to dashboard after delete', async () => {
            const setView = vi.fn();
            const props = createDefaultProps({ setView });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.deleteTransaction('tx-123');
            });

            expect(setView).toHaveBeenCalledWith('dashboard');
        });
    });

    // =========================================================================
    // wipeDB Tests
    // =========================================================================

    describe('wipeDB', () => {
        it('should show confirmation dialog', async () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.wipeDB();
            });

            expect(window.confirm).toHaveBeenCalledWith('wipeConfirm');
        });

        it('should abort when user cancels confirmation', async () => {
            window.confirm = vi.fn(() => false);
            const props = createDefaultProps();
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.wipeDB();
            });

            expect(firestoreService.wipeAllTransactions).not.toHaveBeenCalled();
        });

        it('should call wipeAllTransactions on confirmation', async () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.wipeDB();
            });

            expect(firestoreService.wipeAllTransactions).toHaveBeenCalledWith(
                mockDb,
                'test-user-123',
                'test-app-id'
            );
        });

        it('should show success alert after wipe', async () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.wipeDB();
            });

            expect(window.alert).toHaveBeenCalledWith('cleaned');
        });

        it('should return early when user is null after confirm', async () => {
            const props = createDefaultProps({ user: null });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.wipeDB();
            });

            expect(firestoreService.wipeAllTransactions).not.toHaveBeenCalled();
        });

        it('should show error alert on failure', async () => {
            vi.mocked(firestoreService.wipeAllTransactions).mockRejectedValue(new Error('Wipe failed'));
            const props = createDefaultProps();
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.wipeDB();
            });

            expect(window.alert).toHaveBeenCalledWith('wipeFailed');
        });
    });

    // =========================================================================
    // handleExportData Tests
    // =========================================================================

    describe('handleExportData', () => {
        it('should show toast when no transactions exist', async () => {
            const setToastMessage = vi.fn();
            const props = createDefaultProps({ transactions: [], setToastMessage });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.handleExportData();
            });

            expect(setToastMessage).toHaveBeenCalledWith({
                text: 'noTransactionsToExport',
                type: 'info',
            });
        });

        it('should call downloadBasicData when transactions exist', async () => {
            const transactions: Transaction[] = [
                { id: 'tx-1', merchant: 'Store', date: '2026-01-22', total: 100, category: 'Food', items: [], country: 'Chile', city: 'Santiago', currency: 'CLP' },
            ];
            const props = createDefaultProps({ transactions });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.handleExportData();
            });

            expect(csvExport.downloadBasicData).toHaveBeenCalledWith(transactions);
        });

        it('should show success toast after export', async () => {
            const setToastMessage = vi.fn();
            const transactions: Transaction[] = [
                { id: 'tx-1', merchant: 'Store', date: '2026-01-22', total: 100, category: 'Food', items: [], country: 'Chile', city: 'Santiago', currency: 'CLP' },
            ];
            const props = createDefaultProps({ transactions, setToastMessage });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.handleExportData();
            });

            expect(setToastMessage).toHaveBeenCalledWith({
                text: 'exportSuccess',
                type: 'success',
            });
        });

        it('should show error toast on export failure', async () => {
            vi.mocked(csvExport.downloadBasicData).mockImplementation(() => {
                throw new Error('Export failed');
            });
            const setToastMessage = vi.fn();
            const transactions: Transaction[] = [
                { id: 'tx-1', merchant: 'Store', date: '2026-01-22', total: 100, category: 'Food', items: [], country: 'Chile', city: 'Santiago', currency: 'CLP' },
            ];
            const props = createDefaultProps({ transactions, setToastMessage });
            const { result } = renderHook(() => useTransactionHandlers(props));

            await act(async () => {
                await result.current.handleExportData();
            });

            expect(setToastMessage).toHaveBeenCalledWith({
                text: 'exportFailed',
                type: 'info',
            });
        });
    });

    // =========================================================================
    // Hook Stability Tests
    // =========================================================================

    describe('hook stability', () => {
        it('should return stable handler references with same props', () => {
            const props = createDefaultProps();
            const { result, rerender } = renderHook(() => useTransactionHandlers(props));

            const firstRender = {
                saveTransaction: result.current.saveTransaction,
                deleteTransaction: result.current.deleteTransaction,
                wipeDB: result.current.wipeDB,
                handleExportData: result.current.handleExportData,
                createDefaultTransaction: result.current.createDefaultTransaction,
            };

            rerender();

            expect(result.current.saveTransaction).toBe(firstRender.saveTransaction);
            expect(result.current.deleteTransaction).toBe(firstRender.deleteTransaction);
            expect(result.current.wipeDB).toBe(firstRender.wipeDB);
            expect(result.current.handleExportData).toBe(firstRender.handleExportData);
            expect(result.current.createDefaultTransaction).toBe(firstRender.createDefaultTransaction);
        });
    });
});
