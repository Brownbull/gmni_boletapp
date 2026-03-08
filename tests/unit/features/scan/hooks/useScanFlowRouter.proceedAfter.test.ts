/**
 * Unit tests for useScanFlowRouter — proceedAfterCurrencyResolved
 *
 * Story TD-15b-19: Split from useScanFlowRouter.test.ts (391 lines).
 * Tests trusted auto-save, quick save, edit view (skips mappings).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DIALOG_TYPES } from '@/features/scan/types/scanStateMachine';
import { mockDb, createDefaultFlowRouterProps, createMockTransaction } from './useScanFlowRouter.testHelper';

// Mock firestore service
vi.mock('@/services/firestore', () => ({
    addTransaction: vi.fn(() => Promise.resolve('new-tx-id')),
}));

// Mock confidence check utility
vi.mock('@/utils/confidenceCheck', () => ({
    shouldShowQuickSave: vi.fn(() => true),
    calculateConfidence: vi.fn(() => 0.9),
}));

// Import after mocking
import { useScanFlowRouter } from '@features/scan/hooks/useScanFlowRouter';
import * as firestoreService from '@/services/firestore';
import * as confidenceCheck from '@/utils/confidenceCheck';

describe('useScanFlowRouter — proceedAfterCurrencyResolved', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should auto-save for trusted merchants', async () => {
        const checkTrusted = vi.fn(() => Promise.resolve(true));
        const setView = vi.fn();
        const setToastMessage = vi.fn();
        const setCurrentTransaction = vi.fn();
        const props = createDefaultFlowRouterProps({
            checkTrusted,
            setView,
            setToastMessage,
            setCurrentTransaction,
        });
        const { result } = renderHook(() => useScanFlowRouter(props));

        await act(async () => {
            await result.current.proceedAfterCurrencyResolved(createMockTransaction());
        });

        expect(firestoreService.addTransaction).toHaveBeenCalledWith(mockDb, 'test-user-123', 'test-app-id', expect.objectContaining({ merchant: 'Test Store' }));
        expect(setCurrentTransaction).toHaveBeenCalledWith(null);
        expect(setToastMessage).toHaveBeenCalledWith({ text: 'autoSaved', type: 'success' });
        expect(setView).toHaveBeenCalledWith('dashboard');
    });

    it('should show quick save dialog for untrusted high-confidence transactions', async () => {
        const showScanDialog = vi.fn();
        vi.mocked(confidenceCheck.shouldShowQuickSave).mockReturnValue(true);
        const props = createDefaultFlowRouterProps({ showScanDialog });
        const { result } = renderHook(() => useScanFlowRouter(props));

        await act(async () => {
            await result.current.proceedAfterCurrencyResolved(createMockTransaction());
        });

        expect(showScanDialog).toHaveBeenCalledWith(
            DIALOG_TYPES.QUICKSAVE,
            expect.objectContaining({ confidence: 0.9 })
        );
    });

    it('should fall through to edit view for low confidence', async () => {
        const setAnimateEditViewItems = vi.fn();
        const showScanDialog = vi.fn();
        vi.mocked(confidenceCheck.shouldShowQuickSave).mockReturnValue(false);
        const props = createDefaultFlowRouterProps({ setAnimateEditViewItems, showScanDialog });
        const { result } = renderHook(() => useScanFlowRouter(props));

        await act(async () => {
            await result.current.proceedAfterCurrencyResolved(createMockTransaction());
        });

        expect(setAnimateEditViewItems).toHaveBeenCalledWith(true);
        expect(firestoreService.addTransaction).not.toHaveBeenCalled();
        expect(showScanDialog).not.toHaveBeenCalled();
    });

    it('should fall back to quick save when auto-save fails', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const checkTrusted = vi.fn(() => Promise.resolve(true));
        const showScanDialog = vi.fn();
        vi.mocked(firestoreService.addTransaction).mockRejectedValueOnce(new Error('Save failed'));
        vi.mocked(confidenceCheck.shouldShowQuickSave).mockReturnValue(true);
        const props = createDefaultFlowRouterProps({ checkTrusted, showScanDialog });
        const { result } = renderHook(() => useScanFlowRouter(props));

        await act(async () => {
            await result.current.proceedAfterCurrencyResolved(createMockTransaction());
        });

        expect(showScanDialog).toHaveBeenCalledWith(
            DIALOG_TYPES.QUICKSAVE,
            expect.objectContaining({ confidence: 0.9 })
        );
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('should dispatch process success and set current transaction', async () => {
        const dispatchProcessSuccess = vi.fn();
        const setCurrentTransaction = vi.fn();
        const setSkipScanCompleteModal = vi.fn();
        vi.mocked(confidenceCheck.shouldShowQuickSave).mockReturnValue(false);
        const props = createDefaultFlowRouterProps({
            dispatchProcessSuccess,
            setCurrentTransaction,
            setSkipScanCompleteModal,
        });
        const { result } = renderHook(() => useScanFlowRouter(props));

        const tx = createMockTransaction();
        await act(async () => {
            await result.current.proceedAfterCurrencyResolved(tx);
        });

        expect(setSkipScanCompleteModal).toHaveBeenCalledWith(true);
        expect(dispatchProcessSuccess).toHaveBeenCalledWith([tx]);
        expect(setCurrentTransaction).toHaveBeenCalledWith(tx);
    });

    it('should check trusted using merchant alias when available', async () => {
        const checkTrusted = vi.fn(() => Promise.resolve(false));
        vi.mocked(confidenceCheck.shouldShowQuickSave).mockReturnValue(false);
        const props = createDefaultFlowRouterProps({ checkTrusted });
        const { result } = renderHook(() => useScanFlowRouter(props));

        const tx = createMockTransaction({ alias: 'Alias Store', merchant: 'Original Store' });
        await act(async () => {
            await result.current.proceedAfterCurrencyResolved(tx);
        });

        expect(checkTrusted).toHaveBeenCalledWith('Alias Store');
    });

    it('should not auto-save when user is null', async () => {
        const checkTrusted = vi.fn(() => Promise.resolve(true));
        const props = createDefaultFlowRouterProps({ user: null, checkTrusted });
        const { result } = renderHook(() => useScanFlowRouter(props));

        await act(async () => {
            await result.current.proceedAfterCurrencyResolved(createMockTransaction());
        });

        expect(firestoreService.addTransaction).not.toHaveBeenCalled();
    });

    it('should not auto-save when services is null', async () => {
        const checkTrusted = vi.fn(() => Promise.resolve(true));
        const props = createDefaultFlowRouterProps({ services: null, checkTrusted });
        const { result } = renderHook(() => useScanFlowRouter(props));

        await act(async () => {
            await result.current.proceedAfterCurrencyResolved(createMockTransaction());
        });

        expect(firestoreService.addTransaction).not.toHaveBeenCalled();
    });
});
