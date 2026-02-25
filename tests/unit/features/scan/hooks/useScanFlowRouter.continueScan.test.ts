/**
 * Unit tests for useScanFlowRouter — continueScanWithTransaction
 *
 * Story TD-15b-19: Split from useScanFlowRouter.test.ts (391 lines).
 * Tests mapping application, currency mismatch, trusted auto-save, quick save, edit view.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DIALOG_TYPES } from '@/types/scanStateMachine';
import {
    mockDb,
    createDefaultFlowRouterProps,
    createMockTransaction,
} from './useScanFlowRouter.testHelper';

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

describe('useScanFlowRouter — continueScanWithTransaction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should apply category mappings to transaction', async () => {
        const applyCategoryMappings = vi.fn((tx) => ({
            transaction: { ...tx, category: 'Groceries' },
            appliedMappingIds: ['mapping-1'],
        }));
        const props = createDefaultFlowRouterProps({ applyCategoryMappings });
        const { result } = renderHook(() => useScanFlowRouter(props));

        const tx = createMockTransaction();
        await act(async () => {
            await result.current.continueScanWithTransaction(tx);
        });

        expect(applyCategoryMappings).toHaveBeenCalledWith(tx, []);
    });

    it('should increment category mapping usage for applied mappings', async () => {
        const incrementMappingUsage = vi.fn(() => Promise.resolve());
        const applyCategoryMappings = vi.fn((tx) => ({
            transaction: tx,
            appliedMappingIds: ['mapping-1', 'mapping-2'],
        }));
        const props = createDefaultFlowRouterProps({ applyCategoryMappings, incrementMappingUsage });
        const { result } = renderHook(() => useScanFlowRouter(props));

        await act(async () => {
            await result.current.continueScanWithTransaction(createMockTransaction());
        });

        expect(incrementMappingUsage).toHaveBeenCalledTimes(2);
        expect(incrementMappingUsage).toHaveBeenCalledWith(mockDb, 'test-user-123', 'test-app-id', 'mapping-1');
        expect(incrementMappingUsage).toHaveBeenCalledWith(mockDb, 'test-user-123', 'test-app-id', 'mapping-2');
    });

    it('should apply merchant mapping when confidence > 0.7', async () => {
        const findMerchantMatch = vi.fn(() => ({
            confidence: 0.9,
            mapping: {
                id: 'merchant-1',
                targetMerchant: 'Known Store',
                normalizedMerchant: 'known_store',
                storeCategory: 'Groceries',
            },
        }));
        const setCurrentTransaction = vi.fn();
        const props = createDefaultFlowRouterProps({ findMerchantMatch, setCurrentTransaction });
        const { result } = renderHook(() => useScanFlowRouter(props));

        const tx = createMockTransaction();
        await act(async () => {
            await result.current.continueScanWithTransaction(tx);
        });

        // Verify the transaction passed to setCurrentTransaction has the alias applied
        expect(setCurrentTransaction).toHaveBeenCalled();
        const finalTx = setCurrentTransaction.mock.calls[0][0];
        expect(finalTx.alias).toBe('Known Store');
        expect(finalTx.merchantSource).toBe('learned');
    });

    it('should apply item name mappings when merchant is matched', async () => {
        const applyItemNameMappings = vi.fn((tx) => ({
            transaction: { ...tx, items: [{ name: 'Renamed Item', price: 5000, qty: 1 }] },
            appliedIds: ['item-mapping-1'],
        }));
        const findMerchantMatch = vi.fn(() => ({
            confidence: 0.9,
            mapping: {
                id: 'merchant-1',
                targetMerchant: 'Known Store',
                normalizedMerchant: 'known_store',
            },
        }));
        const props = createDefaultFlowRouterProps({ applyItemNameMappings, findMerchantMatch });
        const { result } = renderHook(() => useScanFlowRouter(props));

        await act(async () => {
            await result.current.continueScanWithTransaction(createMockTransaction());
        });

        expect(applyItemNameMappings).toHaveBeenCalledWith(
            expect.objectContaining({ alias: 'Known Store' }),
            'known_store'
        );
    });

    it('should show currency mismatch dialog when currencies differ', async () => {
        const showScanDialog = vi.fn();
        const props = createDefaultFlowRouterProps({
            showScanDialog,
            userPreferences: { defaultCurrency: 'CLP' },
        });
        const { result } = renderHook(() => useScanFlowRouter(props));

        const tx = createMockTransaction({ currency: 'USD' });
        await act(async () => {
            await result.current.continueScanWithTransaction(tx);
        });

        expect(showScanDialog).toHaveBeenCalledWith(
            DIALOG_TYPES.CURRENCY_MISMATCH,
            expect.objectContaining({
                detectedCurrency: 'USD',
                hasDiscrepancy: false,
            })
        );
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
            await result.current.continueScanWithTransaction(createMockTransaction());
        });

        expect(firestoreService.addTransaction).toHaveBeenCalled();
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
            await result.current.continueScanWithTransaction(createMockTransaction());
        });

        expect(showScanDialog).toHaveBeenCalledWith(
            DIALOG_TYPES.QUICKSAVE,
            expect.objectContaining({
                confidence: 0.9,
            })
        );
    });

    it('should fall through to edit view for low confidence', async () => {
        const setAnimateEditViewItems = vi.fn();
        vi.mocked(confidenceCheck.shouldShowQuickSave).mockReturnValue(false);
        const props = createDefaultFlowRouterProps({ setAnimateEditViewItems });
        const { result } = renderHook(() => useScanFlowRouter(props));

        await act(async () => {
            await result.current.continueScanWithTransaction(createMockTransaction());
        });

        expect(setAnimateEditViewItems).toHaveBeenCalledWith(true);
    });

    it('should fall back to quick save when auto-save fails', async () => {
        const checkTrusted = vi.fn(() => Promise.resolve(true));
        const showScanDialog = vi.fn();
        vi.mocked(firestoreService.addTransaction).mockRejectedValueOnce(new Error('Save failed'));
        vi.mocked(confidenceCheck.shouldShowQuickSave).mockReturnValue(true);
        const props = createDefaultFlowRouterProps({ checkTrusted, showScanDialog });
        const { result } = renderHook(() => useScanFlowRouter(props));

        await act(async () => {
            await result.current.continueScanWithTransaction(createMockTransaction());
        });

        expect(showScanDialog).toHaveBeenCalledWith(
            DIALOG_TYPES.QUICKSAVE,
            expect.objectContaining({ confidence: 0.9 })
        );
    });

    it('should use default currency when transaction has none', async () => {
        const setCurrentTransaction = vi.fn();
        const props = createDefaultFlowRouterProps({
            setCurrentTransaction,
            userPreferences: { defaultCurrency: 'CLP' },
        });
        const { result } = renderHook(() => useScanFlowRouter(props));

        const tx = createMockTransaction({ currency: undefined as unknown as string });
        await act(async () => {
            await result.current.continueScanWithTransaction(tx);
        });

        // Should set currency to default (CLP) and not show mismatch dialog
        const finalTx = setCurrentTransaction.mock.calls[0][0];
        expect(finalTx.currency).toBe('CLP');
    });
});
