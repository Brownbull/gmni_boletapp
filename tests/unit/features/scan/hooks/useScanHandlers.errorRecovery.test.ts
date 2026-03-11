/**
 * Scan error recovery UX tests
 *
 * Story 15b-5a: Tests that handleScanOverlayRetry properly resets BOTH the
 * scan overlay AND the Zustand scan store.
 *
 * Story 18-0: Tests that handleScanOverlayCancel has identical reset logic
 * (cancel was missing useScanStore.getState().reset() — the only user-accessible
 * button on the error overlay besides Retry).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { UserPreferences } from '@/services/userPreferencesService';
import type { UseScanHandlersProps } from '@features/scan/hooks/useScanHandlers';

// Mock firestore service
vi.mock('@/services/firestore', () => ({
    addTransaction: vi.fn(() => Promise.resolve('new-tx-id')),
}));

// Mock insight engine service
vi.mock('@features/insights/services/insightEngineService', () => ({
    generateInsightForTransaction: vi.fn(() => Promise.resolve(null)),
    isInsightsSilenced: vi.fn(() => false),
    getDefaultCache: vi.fn(() => ({ silencedUntil: null, recentInsightIds: [] })),
}));

// Mock confidence check
vi.mock('@/utils/confidenceCheck', () => ({
    shouldShowQuickSave: vi.fn(() => false),
    calculateConfidence: vi.fn(() => 0.9),
}));

// Mock entity reconcileItemsTotal
vi.mock('@entities/transaction', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        reconcileItemsTotal: vi.fn((items) => ({
            items,
            hasDiscrepancy: false,
            discrepancyAmount: 0,
        })),
    };
});

// Story 15b-5a: Mock useScanStore — tracks reset() calls via getState()
const mockStoreReset = vi.fn();
vi.mock('@features/scan/store/useScanStore', () => ({
    useScanStore: Object.assign(vi.fn(), {
        getState: () => ({ reset: mockStoreReset }),
    }),
}));

// Import after mocking
import { useScanHandlers } from '@features/scan/hooks/useScanHandlers';

describe('handleScanOverlayRetry — error recovery (Story 15b-5a)', () => {
    const mockUser = { uid: 'test-user-123' } as User;
    const mockDb = {} as Firestore;
    const mockServices = { db: mockDb, appId: 'test-app-id' };

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

    const mockScanOverlay = {
        reset: vi.fn(),
        retry: vi.fn(),
    };

    const createProps = (overrides: Partial<UseScanHandlersProps> = {}): UseScanHandlersProps => ({
        user: mockUser,
        services: mockServices,
        userPreferences: mockUserPreferences,
        transactions: [],
        currency: 'CLP',
        lang: 'es',
        currentTransaction: null,
        insightProfile: {
            schemaVersion: 1 as const,
            firstTransactionDate: new Date().toISOString(),
            totalTransactions: 10,
            recentInsights: [],
        },
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

    it('should call scanOverlay.retry()', () => {
        const props = createProps();
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => {
            result.current.handleScanOverlayRetry();
        });

        expect(mockScanOverlay.retry).toHaveBeenCalledOnce();
    });

    it('should reset scan store to idle via useScanStore.getState().reset()', () => {
        const props = createProps();
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => {
            result.current.handleScanOverlayRetry();
        });

        expect(mockStoreReset).toHaveBeenCalledOnce();
    });

    it('should clear scan images', () => {
        const setScanImages = vi.fn();
        const props = createProps({ setScanImages });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => {
            result.current.handleScanOverlayRetry();
        });

        expect(setScanImages).toHaveBeenCalledWith([]);
    });

    it('should clear current transaction', () => {
        const setCurrentTransaction = vi.fn();
        const props = createProps({ setCurrentTransaction });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => {
            result.current.handleScanOverlayRetry();
        });

        expect(setCurrentTransaction).toHaveBeenCalledWith(null);
    });

    it('should navigate to dashboard so user can choose camera or gallery', () => {
        const setView = vi.fn();
        const props = createProps({ setView });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => {
            result.current.handleScanOverlayRetry();
        });

        expect(setView).toHaveBeenCalledWith('dashboard');
    });

    it('should perform full reset sequence: overlay + store + images + tx + nav', () => {
        const setScanImages = vi.fn();
        const setCurrentTransaction = vi.fn();
        const setView = vi.fn();
        const props = createProps({ setScanImages, setCurrentTransaction, setView });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => {
            result.current.handleScanOverlayRetry();
        });

        // All 5 reset actions should fire
        expect(mockScanOverlay.retry).toHaveBeenCalledOnce();
        expect(mockStoreReset).toHaveBeenCalledOnce();
        expect(setScanImages).toHaveBeenCalledWith([]);
        expect(setCurrentTransaction).toHaveBeenCalledWith(null);
        expect(setView).toHaveBeenCalledWith('dashboard');
    });
});

describe('handleScanOverlayCancel — error recovery (Story 18-0)', () => {
    const mockUser = { uid: 'test-user-123' } as User;
    const mockDb = {} as Firestore;
    const mockServices = { db: mockDb, appId: 'test-app-id' };

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

    const mockScanOverlay = {
        reset: vi.fn(),
        retry: vi.fn(),
    };

    const createProps = (overrides: Partial<UseScanHandlersProps> = {}): UseScanHandlersProps => ({
        user: mockUser,
        services: mockServices,
        userPreferences: mockUserPreferences,
        transactions: [],
        currency: 'CLP',
        lang: 'es',
        currentTransaction: null,
        insightProfile: {
            schemaVersion: 1 as const,
            firstTransactionDate: new Date().toISOString(),
            totalTransactions: 10,
            recentInsights: [],
        },
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

    it('should call scanOverlay.reset() (not retry)', () => {
        const props = createProps();
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => {
            result.current.handleScanOverlayCancel();
        });

        expect(mockScanOverlay.reset).toHaveBeenCalledOnce();
        expect(mockScanOverlay.retry).not.toHaveBeenCalled();
    });

    it('should reset scan store to idle via useScanStore.getState().reset()', () => {
        const props = createProps();
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => {
            result.current.handleScanOverlayCancel();
        });

        expect(mockStoreReset).toHaveBeenCalledOnce();
    });

    it('should clear scan images so gallery select works after cancel', () => {
        const setScanImages = vi.fn();
        const props = createProps({ setScanImages });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => {
            result.current.handleScanOverlayCancel();
        });

        expect(setScanImages).toHaveBeenCalledWith([]);
    });

    it('should clear current transaction', () => {
        const setCurrentTransaction = vi.fn();
        const props = createProps({ setCurrentTransaction });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => {
            result.current.handleScanOverlayCancel();
        });

        expect(setCurrentTransaction).toHaveBeenCalledWith(null);
    });

    it('should perform full reset sequence matching retry parity', () => {
        const setScanImages = vi.fn();
        const setCurrentTransaction = vi.fn();
        const setView = vi.fn();
        const props = createProps({ setScanImages, setCurrentTransaction, setView });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => {
            result.current.handleScanOverlayCancel();
        });

        // All 5 reset actions should fire (matching retry handler)
        expect(mockScanOverlay.reset).toHaveBeenCalledOnce();
        expect(mockStoreReset).toHaveBeenCalledOnce();
        expect(setScanImages).toHaveBeenCalledWith([]);
        expect(setCurrentTransaction).toHaveBeenCalledWith(null);
        expect(setView).toHaveBeenCalledWith('dashboard');
    });
});
