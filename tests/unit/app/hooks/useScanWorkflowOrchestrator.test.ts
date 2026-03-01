/**
 * Unit tests for useScanWorkflowOrchestrator
 *
 * Story TD-15b-35: Orchestrator Cleanup
 *
 * Verifies return shape and setScanImages auto-transition logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScanWorkflowOrchestrator } from '../../../../src/app/hooks/useScanWorkflowOrchestrator';

// Mock scan store
const mockScanState = {
    phase: 'idle' as const,
    mode: null,
    images: [] as string[],
    results: [],
    activeDialog: null,
    creditStatus: 'none' as const,
    errorMessage: null,
    batchReceipts: [],
    savedInBatch: [],
    storeType: 'auto',
    currency: 'CLP',
};

const mockScanActions = {
    startSingle: vi.fn(),
    startBatch: vi.fn(),
    startStatement: vi.fn(),
    batchItemStart: vi.fn(),
    batchItemSuccess: vi.fn(),
    batchItemError: vi.fn(),
    batchComplete: vi.fn(),
    setBatchEditingIndex: vi.fn(),
    showDialog: vi.fn(),
    dismissDialog: vi.fn(),
    setImages: vi.fn(),
    processStart: vi.fn(),
    processSuccess: vi.fn(),
    processError: vi.fn(),
    reset: vi.fn(),
    restoreState: vi.fn(),
    setSkipScanCompleteModal: vi.fn(),
    setIsRescanning: vi.fn(),
};

vi.mock('../../../../src/features/scan/store', () => ({
    useScanStore: vi.fn(() => mockScanState),
    useScanActions: vi.fn(() => mockScanActions),
    useIsProcessing: vi.fn(() => false),
    useScanMode: vi.fn(() => null),
    useSkipScanCompleteModal: vi.fn(() => false),
    useIsRescanning: vi.fn(() => false),
}));

vi.mock('../../../../src/hooks/useScanOverlayState', () => ({
    useScanOverlayState: vi.fn(() => ({
        isVisible: false,
        show: vi.fn(),
        hide: vi.fn(),
    })),
}));

vi.mock('../../../../src/hooks/useBatchProcessing', () => ({
    useBatchProcessing: vi.fn(() => ({
        isProcessing: false,
        progress: 0,
    })),
}));

vi.mock('../../../../src/hooks/useBatchSession', () => ({
    useBatchSession: vi.fn(() => ({
        session: null,
        addToBatch: vi.fn(),
        clearBatch: vi.fn(),
    })),
}));

vi.mock('../../../../src/hooks/useTrustedMerchants', () => ({
    useTrustedMerchants: vi.fn(() => ({
        recordMerchantScan: vi.fn(),
        checkTrusted: vi.fn(),
        acceptTrust: vi.fn(),
        declinePrompt: vi.fn(),
    })),
}));

describe('useScanWorkflowOrchestrator', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // Re-apply mock defaults after reset
        mockScanState.phase = 'idle';
        mockScanState.images = [];
    });

    it('returns all expected keys', () => {
        const { result } = renderHook(() =>
            useScanWorkflowOrchestrator(null, null),
        );

        const expectedKeys = [
            'scanState', 'scanMode', 'isContextProcessing',
            'startScanContext', 'startBatchScanContext', 'startStatementScanContext',
            'dispatchBatchItemStart', 'dispatchBatchItemSuccess', 'dispatchBatchItemError',
            'dispatchBatchComplete', 'setBatchEditingIndexContext',
            'showScanDialog', 'dismissScanDialog', 'setScanContextImages',
            'dispatchProcessStart', 'dispatchProcessSuccess', 'dispatchProcessError',
            'resetScanContext', 'restoreScanState',
            'setSkipScanCompleteModal', 'setIsRescanning',
            'isBatchModeFromContext', 'hasBatchReceipts', 'isAnalyzing',
            'scanImages', 'setScanImages', 'setScanError',
            'scanStoreType', 'setScanStoreType', 'scanCurrency', 'setScanCurrency',
            'skipScanCompleteModal', 'isRescanning',
            'scanOverlay', 'batchProcessing', 'batchSession', 'addToBatch', 'clearBatch',
            'recordMerchantScan', 'checkTrusted', 'acceptTrust', 'declinePrompt',
        ];

        for (const key of expectedKeys) {
            expect(result.current).toHaveProperty(key);
        }
    });

    it('setScanImages triggers startScanContext when in idle phase with images', () => {
        const mockUser = { uid: 'test-uid' } as import('firebase/auth').User;
        const { result } = renderHook(() =>
            useScanWorkflowOrchestrator(mockUser, null),
        );

        act(() => {
            result.current.setScanImages(['image1.jpg']);
        });

        expect(mockScanActions.startSingle).toHaveBeenCalledWith('test-uid');
    });

    it('setScanImages resets context when clearing images', () => {
        const { result } = renderHook(() =>
            useScanWorkflowOrchestrator(null, null),
        );

        act(() => {
            result.current.setScanImages([]);
        });

        expect(mockScanActions.reset).toHaveBeenCalled();
    });

    it('hasBatchReceipts is false when no batch receipts exist', () => {
        const { result } = renderHook(() =>
            useScanWorkflowOrchestrator(null, null),
        );

        expect(result.current.hasBatchReceipts).toBe(false);
    });
});
