/**
 * Unit tests for useScanHandlers hook
 *
 * Story 14c-refactor.20b: Unit tests for extracted App handler hooks
 * Story 14e-41: reconcileItemsTotal now imported from @entities/transaction (mocked)
 *
 * Tests scan flow handlers:
 * - Scan overlay handlers (cancel, retry, dismiss)
 * - Quick save handlers (save, edit, cancel, complete)
 * - Currency mismatch handlers
 * - Total mismatch handlers
 * - Utility functions (applyItemNameMappings, reconcileItemsTotal wrapper)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Transaction } from '../../../../src/types/transaction';
import type { UserPreferences } from '../../../../src/services/userPreferencesService';
import type { UseScanHandlersProps } from '../../../../src/hooks/app/useScanHandlers';
import type {
    QuickSaveDialogData,
    CurrencyMismatchDialogData,
    TotalMismatchDialogData,
} from '../../../../src/types/scanStateMachine';

// Mock the firestore service module
vi.mock('../../../../src/services/firestore', () => ({
    addTransaction: vi.fn(() => Promise.resolve('new-tx-id')),
}));

// Mock the insight engine service
vi.mock('@features/insights/services/insightEngineService', () => ({
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

// Mock confidence check utility
vi.mock('../../../../src/utils/confidenceCheck', () => ({
    shouldShowQuickSave: vi.fn(() => true),
    calculateConfidence: vi.fn(() => 0.9),
}));

// Story 14e-41: Mock entity reconcileItemsTotal (used by hook wrapper)
vi.mock('@entities/transaction', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        reconcileItemsTotal: vi.fn((items, receiptTotal, lang) => {
            // Actual implementation for integration tests
            const itemsSum = items.reduce((sum: number, item: { price: number }) => sum + item.price, 0);
            const roundedItemsSum = Math.round(itemsSum * 100) / 100;
            const roundedReceiptTotal = Math.round(receiptTotal * 100) / 100;
            const difference = Math.round((roundedReceiptTotal - roundedItemsSum) * 100) / 100;

            if (Math.abs(difference) < 1) {
                return { items, hasDiscrepancy: false, discrepancyAmount: 0 };
            }

            const adjustmentName = difference > 0
                ? (lang === 'es' ? 'Cargo sin detallar' : 'Unitemized charge')
                : (lang === 'es' ? 'Descuento/Ajuste' : 'Discount/Adjustment');

            return {
                items: [...items, { name: adjustmentName, price: difference, qty: 1, category: 'Other' }],
                hasDiscrepancy: true,
                discrepancyAmount: difference,
            };
        }),
    };
});

// Import after mocking
import { useScanHandlers } from '../../../../src/hooks/app/useScanHandlers';
import * as firestoreService from '../../../../src/services/firestore';
import * as insightService from '@features/insights/services/insightEngineService';
import * as confidenceCheck from '../../../../src/utils/confidenceCheck';

describe('useScanHandlers', () => {
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

    // Mock scan overlay state
    const mockScanOverlay = {
        reset: vi.fn(),
        retry: vi.fn(),
    };

    // Default props factory
    const createDefaultProps = (overrides: Partial<UseScanHandlersProps> = {}): UseScanHandlersProps => ({
        user: mockUser,
        services: mockServices,
        userPreferences: mockUserPreferences,
        transactions: [],
        currency: 'CLP',
        lang: 'es',
        currentTransaction: null,
        insightProfile: mockInsightProfile,
        insightCache: mockInsightCache,
        recordInsightShown: vi.fn(() => Promise.resolve()),
        trackTransactionForInsight: vi.fn(() => Promise.resolve()),
        incrementInsightCounter: vi.fn(),
        batchSession: mockBatchSession,
        addToBatch: vi.fn(),
        checkTrusted: vi.fn(() => Promise.resolve(false)),
        recordMerchantScan: vi.fn(() => Promise.resolve({ shouldShowPrompt: false, reason: 'insufficient_scans' })),
        findItemNameMatch: vi.fn(() => null),
        // Mapping props (Story 14c-refactor.22a)
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
        scanOverlay: mockScanOverlay,
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

    // =========================================================================
    // Scan Overlay Handlers Tests
    // =========================================================================

    describe('handleScanOverlayCancel', () => {
        it('should reset scan overlay state', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleScanOverlayCancel();
            });

            expect(mockScanOverlay.reset).toHaveBeenCalled();
        });

        it('should clear scan images', () => {
            const setScanImages = vi.fn();
            const props = createDefaultProps({ setScanImages });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleScanOverlayCancel();
            });

            expect(setScanImages).toHaveBeenCalledWith([]);
        });

        it('should clear current transaction', () => {
            const setCurrentTransaction = vi.fn();
            const props = createDefaultProps({ setCurrentTransaction });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleScanOverlayCancel();
            });

            expect(setCurrentTransaction).toHaveBeenCalledWith(null);
        });

        it('should navigate to dashboard', () => {
            const setView = vi.fn();
            const props = createDefaultProps({ setView });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleScanOverlayCancel();
            });

            expect(setView).toHaveBeenCalledWith('dashboard');
        });
    });

    describe('handleScanOverlayRetry', () => {
        it('should call retry on scan overlay', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleScanOverlayRetry();
            });

            expect(mockScanOverlay.retry).toHaveBeenCalled();
        });
    });

    describe('handleScanOverlayDismiss', () => {
        it('should call reset on scan overlay', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleScanOverlayDismiss();
            });

            expect(mockScanOverlay.reset).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Quick Save Handlers Tests
    // =========================================================================

    describe('handleQuickSaveComplete', () => {
        it('should clear scan images', () => {
            const setScanImages = vi.fn();
            const props = createDefaultProps({ setScanImages });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleQuickSaveComplete();
            });

            expect(setScanImages).toHaveBeenCalledWith([]);
        });

        it('should navigate to dashboard', () => {
            const setView = vi.fn();
            const props = createDefaultProps({ setView });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleQuickSaveComplete();
            });

            expect(setView).toHaveBeenCalledWith('dashboard');
        });
    });

    describe('handleQuickSave', () => {
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

        const mockDialogData: QuickSaveDialogData = {
            transaction: mockTransaction,
            confidence: 0.9,
        };

        it('should return early when user is null', async () => {
            const props = createDefaultProps({ user: null });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(mockDialogData);
            });

            expect(firestoreService.addTransaction).not.toHaveBeenCalled();
        });

        it('should return early when services is null', async () => {
            const props = createDefaultProps({ services: null });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(mockDialogData);
            });

            expect(firestoreService.addTransaction).not.toHaveBeenCalled();
        });

        it('should return early when no dialog data', async () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(undefined);
            });

            expect(firestoreService.addTransaction).not.toHaveBeenCalled();
        });

        it('should return early when already quick saving', async () => {
            const props = createDefaultProps({ isQuickSaving: true });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(mockDialogData);
            });

            expect(firestoreService.addTransaction).not.toHaveBeenCalled();
        });

        it('should validate transaction has at least one item', async () => {
            const setToastMessage = vi.fn();
            const navigateToView = vi.fn();
            const invalidTransaction = { ...mockTransaction, items: [] };
            const dialogData = { ...mockDialogData, transaction: invalidTransaction };
            const props = createDefaultProps({ setToastMessage, navigateToView });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(dialogData);
            });

            expect(setToastMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }));
            expect(navigateToView).toHaveBeenCalledWith('transaction-editor');
            expect(firestoreService.addTransaction).not.toHaveBeenCalled();
        });

        it('should validate items have name and price', async () => {
            const setToastMessage = vi.fn();
            const navigateToView = vi.fn();
            const invalidTransaction = { ...mockTransaction, items: [{ name: '', price: 0 }] };
            const dialogData = { ...mockDialogData, transaction: invalidTransaction };
            const props = createDefaultProps({ setToastMessage, navigateToView });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(dialogData);
            });

            expect(setToastMessage).toHaveBeenCalled();
            expect(navigateToView).toHaveBeenCalledWith('transaction-editor');
        });

        it('should set isQuickSaving to true during save', async () => {
            const setIsQuickSaving = vi.fn();
            const props = createDefaultProps({ setIsQuickSaving });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(mockDialogData);
            });

            expect(setIsQuickSaving).toHaveBeenCalledWith(true);
        });

        it('should call firestoreAddTransaction with transaction', async () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(mockDialogData);
            });

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

        it('should increment insight counter', async () => {
            const incrementInsightCounter = vi.fn();
            const props = createDefaultProps({ incrementInsightCounter });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(mockDialogData);
            });

            expect(incrementInsightCounter).toHaveBeenCalled();
        });

        it('should generate insight for transaction', async () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(mockDialogData);
            });

            expect(insightService.generateInsightForTransaction).toHaveBeenCalled();
        });

        it('should add transaction to batch session', async () => {
            const addToBatch = vi.fn();
            const props = createDefaultProps({ addToBatch });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(mockDialogData);
            });

            expect(addToBatch).toHaveBeenCalled();
        });

        it('should show insight card when not silenced', async () => {
            const setShowInsightCard = vi.fn();
            const setCurrentInsight = vi.fn();
            const props = createDefaultProps({ setShowInsightCard, setCurrentInsight });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(mockDialogData);
            });

            expect(setShowInsightCard).toHaveBeenCalledWith(true);
            expect(setCurrentInsight).toHaveBeenCalled();
        });

        it('should record merchant scan', async () => {
            const recordMerchantScan = vi.fn(() => Promise.resolve({}));
            const props = createDefaultProps({ recordMerchantScan });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(mockDialogData);
            });

            expect(recordMerchantScan).toHaveBeenCalledWith('Test Store', false);
        });

        it('should set isQuickSaving to false after completion', async () => {
            const setIsQuickSaving = vi.fn();
            const props = createDefaultProps({ setIsQuickSaving });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(mockDialogData);
            });

            expect(setIsQuickSaving).toHaveBeenLastCalledWith(false);
        });

        it('should handle error gracefully', async () => {
            vi.mocked(firestoreService.addTransaction).mockRejectedValue(new Error('Save failed'));
            const setToastMessage = vi.fn();
            const dismissScanDialog = vi.fn();
            const setIsQuickSaving = vi.fn();
            const props = createDefaultProps({ setToastMessage, dismissScanDialog, setIsQuickSaving });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleQuickSave(mockDialogData);
            });

            // errorHandler classifies "Save failed" as UNKNOWN_ERROR → toastType 'error'
            expect(setToastMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
            expect(dismissScanDialog).toHaveBeenCalled();
            expect(setIsQuickSaving).toHaveBeenLastCalledWith(false);
        });
    });

    describe('handleQuickSaveEdit', () => {
        const mockTransaction: Transaction = {
            merchant: 'Test Store',
            date: '2026-01-22',
            total: 1500,
            category: 'Supermarket',
            items: [],
            country: 'Chile',
            city: 'Santiago',
            currency: 'CLP',
        };

        const mockDialogData: QuickSaveDialogData = {
            transaction: mockTransaction,
            confidence: 0.9,
        };

        it('should set current transaction from dialog data', () => {
            const setCurrentTransaction = vi.fn();
            const props = createDefaultProps({ setCurrentTransaction });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleQuickSaveEdit(mockDialogData);
            });

            expect(setCurrentTransaction).toHaveBeenCalledWith(mockTransaction);
        });

        it('should set transaction editor mode to new', () => {
            const setTransactionEditorMode = vi.fn();
            const props = createDefaultProps({ setTransactionEditorMode });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleQuickSaveEdit(mockDialogData);
            });

            expect(setTransactionEditorMode).toHaveBeenCalledWith('new');
        });

        it('should skip scan complete modal', () => {
            const setSkipScanCompleteModal = vi.fn();
            const props = createDefaultProps({ setSkipScanCompleteModal });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleQuickSaveEdit(mockDialogData);
            });

            expect(setSkipScanCompleteModal).toHaveBeenCalledWith(true);
        });

        it('should navigate to transaction editor', () => {
            const setView = vi.fn();
            const props = createDefaultProps({ setView });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleQuickSaveEdit(mockDialogData);
            });

            expect(setView).toHaveBeenCalledWith('transaction-editor');
        });
    });

    describe('handleQuickSaveCancel', () => {
        it('should clear current transaction', () => {
            const setCurrentTransaction = vi.fn();
            const props = createDefaultProps({ setCurrentTransaction });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleQuickSaveCancel();
            });

            expect(setCurrentTransaction).toHaveBeenCalledWith(null);
        });

        it('should clear scan images', () => {
            const setScanImages = vi.fn();
            const props = createDefaultProps({ setScanImages });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleQuickSaveCancel();
            });

            expect(setScanImages).toHaveBeenCalledWith([]);
        });

        it('should navigate to dashboard', () => {
            const setView = vi.fn();
            const props = createDefaultProps({ setView });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleQuickSaveCancel();
            });

            expect(setView).toHaveBeenCalledWith('dashboard');
        });
    });

    // =========================================================================
    // Currency Mismatch Handlers Tests
    // =========================================================================

    describe('handleCurrencyUseDetected', () => {
        const mockTransaction: Transaction = {
            merchant: 'Test Store',
            date: '2026-01-22',
            total: 100,
            category: 'Supermarket',
            items: [],
            country: 'Chile',
            city: 'Santiago',
            currency: 'USD',
        };

        const mockDialogData: CurrencyMismatchDialogData = {
            detectedCurrency: 'USD',
            defaultCurrency: 'CLP',
            pendingTransaction: mockTransaction,
            hasDiscrepancy: false,
        };

        it('should return early when no dialog data', async () => {
            const dismissScanDialog = vi.fn();
            const props = createDefaultProps({ dismissScanDialog });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleCurrencyUseDetected(undefined);
            });

            expect(dismissScanDialog).not.toHaveBeenCalled();
        });

        it('should dismiss scan dialog', async () => {
            const dismissScanDialog = vi.fn();
            const props = createDefaultProps({ dismissScanDialog });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleCurrencyUseDetected(mockDialogData);
            });

            expect(dismissScanDialog).toHaveBeenCalled();
        });

        it('should show toast when there is discrepancy', async () => {
            const setToastMessage = vi.fn();
            const dialogData = { ...mockDialogData, hasDiscrepancy: true };
            const props = createDefaultProps({ setToastMessage });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleCurrencyUseDetected(dialogData);
            });

            expect(setToastMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }));
        });

        it('should continue scan with transaction', async () => {
            const dispatchProcessSuccess = vi.fn();
            const setCurrentTransaction = vi.fn();
            const props = createDefaultProps({ dispatchProcessSuccess, setCurrentTransaction });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleCurrencyUseDetected(mockDialogData);
            });

            expect(dispatchProcessSuccess).toHaveBeenCalled();
            expect(setCurrentTransaction).toHaveBeenCalledWith(mockTransaction);
        });
    });

    describe('handleCurrencyUseDefault', () => {
        const mockTransaction: Transaction = {
            merchant: 'Test Store',
            date: '2026-01-22',
            total: 100,
            category: 'Supermarket',
            items: [],
            country: 'Chile',
            city: 'Santiago',
            currency: 'USD',
        };

        const mockDialogData: CurrencyMismatchDialogData = {
            detectedCurrency: 'USD',
            defaultCurrency: 'CLP',
            pendingTransaction: mockTransaction,
            hasDiscrepancy: false,
        };

        it('should return early when no dialog data', async () => {
            const dismissScanDialog = vi.fn();
            const props = createDefaultProps({ dismissScanDialog });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleCurrencyUseDefault(undefined);
            });

            expect(dismissScanDialog).not.toHaveBeenCalled();
        });

        it('should dismiss scan dialog', async () => {
            const dismissScanDialog = vi.fn();
            const props = createDefaultProps({ dismissScanDialog });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleCurrencyUseDefault(mockDialogData);
            });

            expect(dismissScanDialog).toHaveBeenCalled();
        });

        it('should apply default currency to transaction', async () => {
            const setCurrentTransaction = vi.fn();
            const props = createDefaultProps({ setCurrentTransaction });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.handleCurrencyUseDefault(mockDialogData);
            });

            expect(setCurrentTransaction).toHaveBeenCalledWith(
                expect.objectContaining({ currency: 'CLP' })
            );
        });
    });

    describe('handleCurrencyMismatchCancel', () => {
        it('should dismiss scan dialog', () => {
            const dismissScanDialog = vi.fn();
            const props = createDefaultProps({ dismissScanDialog });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleCurrencyMismatchCancel();
            });

            expect(dismissScanDialog).toHaveBeenCalled();
        });

        it('should clear current transaction', () => {
            const setCurrentTransaction = vi.fn();
            const props = createDefaultProps({ setCurrentTransaction });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleCurrencyMismatchCancel();
            });

            expect(setCurrentTransaction).toHaveBeenCalledWith(null);
        });

        it('should clear scan images', () => {
            const setScanImages = vi.fn();
            const props = createDefaultProps({ setScanImages });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleCurrencyMismatchCancel();
            });

            expect(setScanImages).toHaveBeenCalledWith([]);
        });

        it('should navigate to dashboard', () => {
            const setView = vi.fn();
            const props = createDefaultProps({ setView });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleCurrencyMismatchCancel();
            });

            expect(setView).toHaveBeenCalledWith('dashboard');
        });
    });

    // =========================================================================
    // Total Mismatch Handlers Tests
    // =========================================================================

    describe('handleTotalUseItemsSum', () => {
        const mockTransaction: Transaction = {
            merchant: 'Test Store',
            date: '2026-01-22',
            total: 100,
            category: 'Supermarket',
            items: [{ name: 'Item', price: 90 }],
            country: 'Chile',
            city: 'Santiago',
            currency: 'CLP',
        };

        const mockDialogData: TotalMismatchDialogData = {
            validationResult: {
                isValid: false,
                itemsSum: 90,
                receiptTotal: 100,
                discrepancy: 10,
            },
            pendingTransaction: mockTransaction,
            parsedItems: [{ name: 'Item', price: 90 }],
        };

        it('should return early when no dialog data', () => {
            const dismissScanDialog = vi.fn();
            const props = createDefaultProps({ dismissScanDialog });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleTotalUseItemsSum(undefined);
            });

            expect(dismissScanDialog).not.toHaveBeenCalled();
        });

        it('should dismiss scan dialog', () => {
            const dismissScanDialog = vi.fn();
            const props = createDefaultProps({ dismissScanDialog });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleTotalUseItemsSum(mockDialogData);
            });

            expect(dismissScanDialog).toHaveBeenCalled();
        });

        it('should update total to items sum', async () => {
            // continueScanWithTransaction is async, so we need to await
            const dispatchProcessSuccess = vi.fn();
            const props = createDefaultProps({ dispatchProcessSuccess });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                result.current.handleTotalUseItemsSum(mockDialogData);
            });

            // continueScanWithTransaction dispatches process success with corrected transaction
            expect(dispatchProcessSuccess).toHaveBeenCalled();
            // The corrected transaction should have itemsSum as total
            const calledWith = dispatchProcessSuccess.mock.calls[0][0];
            expect(calledWith[0].total).toBe(90); // validationResult.itemsSum
        });

        it('should show success toast', () => {
            const setToastMessage = vi.fn();
            const props = createDefaultProps({ setToastMessage });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleTotalUseItemsSum(mockDialogData);
            });

            expect(setToastMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
        });
    });

    describe('handleTotalKeepOriginal', () => {
        const mockTransaction: Transaction = {
            merchant: 'Test Store',
            date: '2026-01-22',
            total: 100,
            category: 'Supermarket',
            items: [{ name: 'Item', price: 90 }],
            country: 'Chile',
            city: 'Santiago',
            currency: 'CLP',
        };

        const mockDialogData: TotalMismatchDialogData = {
            validationResult: {
                isValid: false,
                itemsSum: 90,
                receiptTotal: 100,
                discrepancy: 10,
            },
            pendingTransaction: mockTransaction,
            parsedItems: [{ name: 'Item', price: 90 }],
        };

        it('should return early when no dialog data', () => {
            const dismissScanDialog = vi.fn();
            const props = createDefaultProps({ dismissScanDialog });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleTotalKeepOriginal(undefined);
            });

            expect(dismissScanDialog).not.toHaveBeenCalled();
        });

        it('should dismiss scan dialog', () => {
            const dismissScanDialog = vi.fn();
            const props = createDefaultProps({ dismissScanDialog });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleTotalKeepOriginal(mockDialogData);
            });

            expect(dismissScanDialog).toHaveBeenCalled();
        });

        it('should continue scan with reconciled items', async () => {
            // continueScanWithTransaction is async
            const dispatchProcessSuccess = vi.fn();
            const props = createDefaultProps({ dispatchProcessSuccess });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                result.current.handleTotalKeepOriginal(mockDialogData);
            });

            // continueScanWithTransaction dispatches process success
            expect(dispatchProcessSuccess).toHaveBeenCalled();
            // The transaction should have a reconciliation item added (100 - 90 = 10 surplus)
            const calledWith = dispatchProcessSuccess.mock.calls[0][0];
            expect(calledWith[0].items.length).toBe(2); // Original + surplus item
        });
    });

    describe('handleTotalMismatchCancel', () => {
        it('should dismiss scan dialog', () => {
            const dismissScanDialog = vi.fn();
            const props = createDefaultProps({ dismissScanDialog });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleTotalMismatchCancel();
            });

            expect(dismissScanDialog).toHaveBeenCalled();
        });

        it('should clear current transaction', () => {
            const setCurrentTransaction = vi.fn();
            const props = createDefaultProps({ setCurrentTransaction });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleTotalMismatchCancel();
            });

            expect(setCurrentTransaction).toHaveBeenCalledWith(null);
        });

        it('should navigate to dashboard', () => {
            const setView = vi.fn();
            const props = createDefaultProps({ setView });
            const { result } = renderHook(() => useScanHandlers(props));

            act(() => {
                result.current.handleTotalMismatchCancel();
            });

            expect(setView).toHaveBeenCalledWith('dashboard');
        });
    });

    // =========================================================================
    // Utility Functions Tests
    // =========================================================================

    describe('applyItemNameMappings', () => {
        it('should return unchanged transaction when no mappings match', () => {
            const props = createDefaultProps({
                findItemNameMatch: vi.fn(() => null),
            });
            const { result } = renderHook(() => useScanHandlers(props));

            const transaction: Transaction = {
                merchant: 'Test Store',
                date: '2026-01-22',
                total: 100,
                category: 'Supermarket',
                items: [{ name: 'Original Item', price: 100 }],
                country: 'Chile',
                city: 'Santiago',
                currency: 'CLP',
            };

            const { transaction: updated, appliedIds } = result.current.applyItemNameMappings(
                transaction,
                'test-store'
            );

            expect(updated.items[0].name).toBe('Original Item');
            expect(appliedIds).toEqual([]);
        });

        it('should apply mapping when match confidence > 0.7', () => {
            const props = createDefaultProps({
                findItemNameMatch: vi.fn(() => ({
                    mapping: {
                        id: 'mapping-1',
                        sourceItemName: 'original',
                        targetItemName: 'Renamed Item',
                        targetCategory: 'Food',
                        normalizedMerchant: 'test-store',
                    },
                    confidence: 0.9,
                })),
            });
            const { result } = renderHook(() => useScanHandlers(props));

            const transaction: Transaction = {
                merchant: 'Test Store',
                date: '2026-01-22',
                total: 100,
                category: 'Supermarket',
                items: [{ name: 'Original Item', price: 100 }],
                country: 'Chile',
                city: 'Santiago',
                currency: 'CLP',
            };

            const { transaction: updated, appliedIds } = result.current.applyItemNameMappings(
                transaction,
                'test-store'
            );

            expect(updated.items[0].name).toBe('Renamed Item');
            expect(updated.items[0].category).toBe('Food');
            expect(updated.items[0].categorySource).toBe('learned');
            expect(appliedIds).toContain('mapping-1');
        });

        it('should not apply mapping when confidence <= 0.7', () => {
            const props = createDefaultProps({
                findItemNameMatch: vi.fn(() => ({
                    mapping: {
                        id: 'mapping-1',
                        sourceItemName: 'original',
                        targetItemName: 'Renamed Item',
                        normalizedMerchant: 'test-store',
                    },
                    confidence: 0.5,
                })),
            });
            const { result } = renderHook(() => useScanHandlers(props));

            const transaction: Transaction = {
                merchant: 'Test Store',
                date: '2026-01-22',
                total: 100,
                category: 'Supermarket',
                items: [{ name: 'Original Item', price: 100 }],
                country: 'Chile',
                city: 'Santiago',
                currency: 'CLP',
            };

            const { transaction: updated, appliedIds } = result.current.applyItemNameMappings(
                transaction,
                'test-store'
            );

            expect(updated.items[0].name).toBe('Original Item');
            expect(appliedIds).toEqual([]);
        });
    });

    describe('reconcileItemsTotal', () => {
        it('should return unchanged items when no discrepancy', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useScanHandlers(props));

            const items = [{ name: 'Item 1', price: 50 }, { name: 'Item 2', price: 50 }];

            const { items: reconciled, hasDiscrepancy, discrepancyAmount } =
                result.current.reconcileItemsTotal(items, 100);

            expect(reconciled).toEqual(items);
            expect(hasDiscrepancy).toBe(false);
            expect(discrepancyAmount).toBe(0);
        });

        it('should not add adjustment for small discrepancy (< 1)', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useScanHandlers(props));

            const items = [{ name: 'Item 1', price: 99.5 }];

            const { items: reconciled, hasDiscrepancy } =
                result.current.reconcileItemsTotal(items, 100);

            expect(reconciled.length).toBe(1);
            expect(hasDiscrepancy).toBe(false);
        });

        it('should add surplus item for positive discrepancy', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useScanHandlers(props));

            const items = [{ name: 'Item 1', price: 80 }];

            const { items: reconciled, hasDiscrepancy, discrepancyAmount } =
                result.current.reconcileItemsTotal(items, 100);

            expect(reconciled.length).toBe(2);
            expect(hasDiscrepancy).toBe(true);
            expect(discrepancyAmount).toBe(20);
            // Last item should be surplus
            expect(reconciled[1].price).toBe(20);
        });

        it('should add discount item for negative discrepancy', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useScanHandlers(props));

            const items = [{ name: 'Item 1', price: 120 }];

            const { items: reconciled, hasDiscrepancy, discrepancyAmount } =
                result.current.reconcileItemsTotal(items, 100);

            expect(reconciled.length).toBe(2);
            expect(hasDiscrepancy).toBe(true);
            expect(discrepancyAmount).toBe(-20);
            // Last item should be discount (negative)
            expect(reconciled[1].price).toBe(-20);
        });
    });

    describe('continueScanWithTransaction', () => {
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

        it('should set skip scan complete modal', async () => {
            const setSkipScanCompleteModal = vi.fn();
            const props = createDefaultProps({ setSkipScanCompleteModal });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.continueScanWithTransaction(mockTransaction);
            });

            expect(setSkipScanCompleteModal).toHaveBeenCalledWith(true);
        });

        it('should dispatch process success', async () => {
            const dispatchProcessSuccess = vi.fn();
            const props = createDefaultProps({ dispatchProcessSuccess });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.continueScanWithTransaction(mockTransaction);
            });

            expect(dispatchProcessSuccess).toHaveBeenCalledWith([mockTransaction]);
        });

        it('should set current transaction', async () => {
            const setCurrentTransaction = vi.fn();
            const props = createDefaultProps({ setCurrentTransaction });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.continueScanWithTransaction(mockTransaction);
            });

            expect(setCurrentTransaction).toHaveBeenCalledWith(mockTransaction);
        });

        it('should auto-save for trusted merchants', async () => {
            // Reset the mock to ensure it resolves (might be rejected from previous test)
            vi.mocked(firestoreService.addTransaction).mockResolvedValue('new-tx-id');
            const checkTrusted = vi.fn(() => Promise.resolve(true));
            const setToastMessage = vi.fn();
            const setView = vi.fn();
            const setCurrentTransaction = vi.fn();
            const props = createDefaultProps({ checkTrusted, setToastMessage, setView, setCurrentTransaction });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.continueScanWithTransaction(mockTransaction);
            });

            expect(firestoreService.addTransaction).toHaveBeenCalled();
            expect(setToastMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
            expect(setView).toHaveBeenCalledWith('dashboard');
        });

        it('should show quick save dialog for untrusted merchants when eligible', async () => {
            const checkTrusted = vi.fn(() => Promise.resolve(false));
            vi.mocked(confidenceCheck.shouldShowQuickSave).mockReturnValue(true);
            const showScanDialog = vi.fn();
            const props = createDefaultProps({ checkTrusted, showScanDialog });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.continueScanWithTransaction(mockTransaction);
            });

            expect(showScanDialog).toHaveBeenCalled();
        });

        it('should animate edit view items when not showing quick save', async () => {
            const checkTrusted = vi.fn(() => Promise.resolve(false));
            vi.mocked(confidenceCheck.shouldShowQuickSave).mockReturnValue(false);
            const setAnimateEditViewItems = vi.fn();
            const props = createDefaultProps({ checkTrusted, setAnimateEditViewItems });
            const { result } = renderHook(() => useScanHandlers(props));

            await act(async () => {
                await result.current.continueScanWithTransaction(mockTransaction);
            });

            expect(setAnimateEditViewItems).toHaveBeenCalledWith(true);
        });
    });

    // =========================================================================
    // Hook Stability Tests
    // =========================================================================

    describe('hook stability', () => {
        it('should return stable handler references with same props', () => {
            const props = createDefaultProps();
            const { result, rerender } = renderHook(() => useScanHandlers(props));

            const firstRender = {
                handleScanOverlayCancel: result.current.handleScanOverlayCancel,
                handleQuickSave: result.current.handleQuickSave,
                applyItemNameMappings: result.current.applyItemNameMappings,
                reconcileItemsTotal: result.current.reconcileItemsTotal,
            };

            rerender();

            expect(result.current.handleScanOverlayCancel).toBe(firstRender.handleScanOverlayCancel);
            expect(result.current.handleQuickSave).toBe(firstRender.handleQuickSave);
            expect(result.current.applyItemNameMappings).toBe(firstRender.applyItemNameMappings);
            expect(result.current.reconcileItemsTotal).toBe(firstRender.reconcileItemsTotal);
        });
    });
});
