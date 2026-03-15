/**
 * Scan error recovery UX tests
 *
 * Story 15b-5a: Tests that handleScanOverlayRetry properly resets BOTH the
 * scan overlay AND the Zustand scan store.
 *
 * Story 18-0: Tests that handleScanOverlayCancel has identical reset logic
 * (cancel was missing useScanStore.getState().reset() — the only user-accessible
 * button on the error overlay besides Retry).
 *
 * Story TD-18-1: Extracted shared createProps factory, added dismiss coverage,
 * trimmed to omnibus-only per block.
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

// TD-18-4: Mock useScanWorkflowStore — images live here, not useScanStore
let mockStoreImages: string[] = [];
vi.mock('@shared/stores/useScanWorkflowStore', () => ({
    useScanWorkflowStore: Object.assign(vi.fn(), {
        getState: () => ({ images: mockStoreImages }),
    }),
}));

// Import after mocking
import { useScanHandlers } from '@features/scan/hooks/useScanHandlers';

// =========================================================================
// Shared test fixtures (TD-18-1: extracted to module scope)
// =========================================================================

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

const createMockScanOverlay = () => ({
    reset: vi.fn(),
    retry: vi.fn(),
});

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
        firstTransactionDate: '2024-01-01T00:00:00.000Z',
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
    scanOverlay: createMockScanOverlay(),
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
    // TD-18-4: Retry support
    processScan: vi.fn(() => Promise.resolve()),
    userCreditsRemaining: 5,
    ...overrides,
});

// =========================================================================
// Retry handler tests
// =========================================================================

describe('handleScanOverlayRetry — error recovery (Story 15b-5a, TD-18-4)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStoreImages = ['base64-image-data-1'];
    });

    it('should call scanOverlay.retry() (not reset) when images available', () => {
        const scanOverlay = createMockScanOverlay();
        const props = createProps({ scanOverlay });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => { result.current.handleScanOverlayRetry(); });

        expect(scanOverlay.retry).toHaveBeenCalledOnce();
        expect(scanOverlay.reset).not.toHaveBeenCalled();
    });

    it('should reset scan store before re-triggering processScan', () => {
        const scanOverlay = createMockScanOverlay();
        const props = createProps({ scanOverlay });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => { result.current.handleScanOverlayRetry(); });

        expect(mockStoreReset).toHaveBeenCalledOnce();
    });

    it('should stash images and call processScan with them (TD-18-4 AC-6, AC-7)', () => {
        const processScan = vi.fn(() => Promise.resolve());
        const setScanImages = vi.fn();
        const props = createProps({ processScan, setScanImages });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => { result.current.handleScanOverlayRetry(); });

        expect(processScan).toHaveBeenCalledWith(['base64-image-data-1']);
        expect(setScanImages).toHaveBeenCalledWith(['base64-image-data-1']);
    });

    it('should show toast and navigate to dashboard when 0 credits (TD-18-4 AC-8)', () => {
        const setToastMessage = vi.fn();
        const setView = vi.fn();
        const setScanImages = vi.fn();
        const setCurrentTransaction = vi.fn();
        const processScan = vi.fn(() => Promise.resolve());
        const scanOverlay = createMockScanOverlay();
        const props = createProps({
            userCreditsRemaining: 0,
            processScan,
            setToastMessage,
            setView,
            setScanImages,
            setCurrentTransaction,
            scanOverlay,
        });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => { result.current.handleScanOverlayRetry(); });

        expect(setToastMessage).toHaveBeenCalledWith({ text: 'noCreditsMessage', type: 'info' });
        expect(processScan).not.toHaveBeenCalled();
        expect(setView).toHaveBeenCalledWith('dashboard');
        expect(scanOverlay.reset).toHaveBeenCalled();
    });

    it('should fall back to dashboard when no images available', () => {
        mockStoreImages = []; // No images
        const setView = vi.fn();
        const setScanImages = vi.fn();
        const setCurrentTransaction = vi.fn();
        const processScan = vi.fn(() => Promise.resolve());
        const props = createProps({ processScan, setView, setScanImages, setCurrentTransaction });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => { result.current.handleScanOverlayRetry(); });

        expect(processScan).not.toHaveBeenCalled();
        expect(setView).toHaveBeenCalledWith('dashboard');
        expect(setScanImages).toHaveBeenCalledWith([]);
        expect(setCurrentTransaction).toHaveBeenCalledWith(null);
    });
});

// =========================================================================
// Cancel handler tests
// =========================================================================

describe('handleScanOverlayCancel — error recovery (Story 18-0)', () => {
    beforeEach(() => { vi.clearAllMocks(); });


    it('should call scanOverlay.reset() (not retry)', () => {
        const scanOverlay = createMockScanOverlay();
        const props = createProps({ scanOverlay });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => { result.current.handleScanOverlayCancel(); });

        expect(scanOverlay.reset).toHaveBeenCalledOnce();
        expect(scanOverlay.retry).not.toHaveBeenCalled();
    });

    it('should perform full reset sequence matching retry parity', () => {
        const scanOverlay = createMockScanOverlay();
        const setScanImages = vi.fn();
        const setCurrentTransaction = vi.fn();
        const setView = vi.fn();
        const props = createProps({ scanOverlay, setScanImages, setCurrentTransaction, setView });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => { result.current.handleScanOverlayCancel(); });

        expect(scanOverlay.reset).toHaveBeenCalledOnce();
        expect(mockStoreReset).toHaveBeenCalledOnce();
        expect(setScanImages).toHaveBeenCalledWith([]);
        expect(setCurrentTransaction).toHaveBeenCalledWith(null);
        expect(setView).toHaveBeenCalledWith('dashboard');
    });
});

// =========================================================================
// Dismiss handler tests (TD-18-1: parity with cancel/retry)
// =========================================================================

describe('handleScanOverlayDismiss — error recovery (TD-18-1)', () => {
    beforeEach(() => { vi.clearAllMocks(); });


    it('should call scanOverlay.reset() (not retry)', () => {
        const scanOverlay = createMockScanOverlay();
        const props = createProps({ scanOverlay });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => { result.current.handleScanOverlayDismiss(); });

        expect(scanOverlay.reset).toHaveBeenCalledOnce();
        expect(scanOverlay.retry).not.toHaveBeenCalled();
    });

    it('should perform full reset sequence: overlay + store + images + tx + nav', () => {
        const scanOverlay = createMockScanOverlay();
        const setScanImages = vi.fn();
        const setCurrentTransaction = vi.fn();
        const setView = vi.fn();
        const props = createProps({ scanOverlay, setScanImages, setCurrentTransaction, setView });
        const { result } = renderHook(() => useScanHandlers(props));

        act(() => { result.current.handleScanOverlayDismiss(); });

        expect(scanOverlay.reset).toHaveBeenCalledOnce();
        expect(mockStoreReset).toHaveBeenCalledOnce();
        expect(setScanImages).toHaveBeenCalledWith([]);
        expect(setCurrentTransaction).toHaveBeenCalledWith(null);
        expect(setView).toHaveBeenCalledWith('dashboard');
    });
});
