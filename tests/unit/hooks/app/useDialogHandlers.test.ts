/**
 * Unit tests for useDialogHandlers hook
 *
 * Story 14c-refactor.21: Unit tests for extracted dialog handlers
 * Story 14e-4: Credit info modal removed - now uses Modal Manager
 * Story 14e-5: Conflict dialog moved to Modal Manager - uses openModalDirect/closeModalDirect
 *
 * Tests dialog handlers:
 * - Toast notification management (showToast, auto-dismiss)
 * - Conflict dialog opening (openConflictDialog - triggers Modal Manager)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Transaction } from '../../../../src/types/transaction';
import type { ScanState } from '../../../../src/types/scanStateMachine';
import type { UseDialogHandlersProps } from '../../../../src/hooks/app/useDialogHandlers';
import { useDialogHandlers } from '../../../../src/hooks/app/useDialogHandlers';

// Story 14e-5: Mock Modal Manager's openModalDirect and closeModalDirect
vi.mock('../../../../src/managers/ModalManager', () => ({
    openModalDirect: vi.fn(),
    closeModalDirect: vi.fn(),
}));

describe('useDialogHandlers', () => {
    // Mock scan state
    const createMockScanState = (overrides: Partial<ScanState> = {}): ScanState => ({
        phase: 'idle',
        mode: null,
        images: [],
        results: [],
        activeDialog: null,
        creditStatus: 'none',
        errorMessage: null,
        batchReceipts: [],
        savedInBatch: [],
        ...overrides,
    });

    // Mock transaction
    const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
        merchant: 'Test Store',
        date: '2026-01-22',
        total: 1500,
        category: 'Supermarket',
        items: [{ name: 'Item 1', price: 1500 }],
        country: 'Chile',
        city: 'Santiago',
        currency: 'CLP',
        ...overrides,
    });

    // Default props factory
    const createDefaultProps = (overrides: Partial<UseDialogHandlersProps> = {}): UseDialogHandlersProps => ({
        scanState: createMockScanState(),
        setCurrentTransaction: vi.fn(),
        resetScanState: vi.fn(),
        clearBatchImages: vi.fn(),
        createDefaultTransaction: vi.fn(() => createMockTransaction()),
        setTransactionEditorMode: vi.fn(),
        navigateToView: vi.fn(),
        toastAutoHideMs: 3000,
        t: vi.fn((key: string) => key),
        lang: 'es',
        formatCurrency: vi.fn((amount: number) => `$${amount}`),
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // =========================================================================
    // Toast Tests
    // =========================================================================

    describe('toast management', () => {
        it('should initialize with null toastMessage', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useDialogHandlers(props));

            expect(result.current.toastMessage).toBeNull();
        });

        it('should set toast message via showToast', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useDialogHandlers(props));

            act(() => {
                result.current.showToast('Test message', 'success');
            });

            expect(result.current.toastMessage).toEqual({
                text: 'Test message',
                type: 'success',
            });
        });

        it('should set info toast type', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useDialogHandlers(props));

            act(() => {
                result.current.showToast('Info message', 'info');
            });

            expect(result.current.toastMessage).toEqual({
                text: 'Info message',
                type: 'info',
            });
        });

        it('should auto-dismiss toast after timeout', () => {
            const props = createDefaultProps({ toastAutoHideMs: 3000 });
            const { result } = renderHook(() => useDialogHandlers(props));

            act(() => {
                result.current.showToast('Auto dismiss', 'success');
            });

            expect(result.current.toastMessage).not.toBeNull();

            // Advance time past the auto-dismiss timeout
            act(() => {
                vi.advanceTimersByTime(3000);
            });

            expect(result.current.toastMessage).toBeNull();
        });

        it('should clear toast immediately via setToastMessage', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useDialogHandlers(props));

            act(() => {
                result.current.showToast('Test', 'success');
            });

            expect(result.current.toastMessage).not.toBeNull();

            act(() => {
                result.current.setToastMessage(null);
            });

            expect(result.current.toastMessage).toBeNull();
        });

        it('should use custom auto-dismiss timeout', () => {
            const props = createDefaultProps({ toastAutoHideMs: 1000 });
            const { result } = renderHook(() => useDialogHandlers(props));

            act(() => {
                result.current.showToast('Quick dismiss', 'success');
            });

            // Should still be visible at 999ms
            act(() => {
                vi.advanceTimersByTime(999);
            });
            expect(result.current.toastMessage).not.toBeNull();

            // Should be dismissed at 1000ms
            act(() => {
                vi.advanceTimersByTime(1);
            });
            expect(result.current.toastMessage).toBeNull();
        });

        it('should clear previous timer when new toast shown', () => {
            const props = createDefaultProps({ toastAutoHideMs: 3000 });
            const { result } = renderHook(() => useDialogHandlers(props));

            act(() => {
                result.current.showToast('First toast', 'success');
            });

            // Advance halfway
            act(() => {
                vi.advanceTimersByTime(1500);
            });

            // Show new toast (should reset timer)
            act(() => {
                result.current.showToast('Second toast', 'info');
            });

            expect(result.current.toastMessage?.text).toBe('Second toast');

            // Advance another 1500ms (3000ms total from first toast)
            act(() => {
                vi.advanceTimersByTime(1500);
            });

            // Should still be visible (timer reset)
            expect(result.current.toastMessage?.text).toBe('Second toast');

            // Advance to complete 3000ms from second toast
            act(() => {
                vi.advanceTimersByTime(1500);
            });

            expect(result.current.toastMessage).toBeNull();
        });
    });

    // =========================================================================
    // Conflict Dialog Tests
    // Story 14e-5: Conflict dialog now uses Modal Manager
    // Tests verify openConflictDialog calls openModalDirect with correct props
    // =========================================================================

    describe('conflict dialog (Modal Manager integration)', () => {
        it('should expose openConflictDialog function', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useDialogHandlers(props));

            expect(typeof result.current.openConflictDialog).toBe('function');
        });

        it('should call openModalDirect when openConflictDialog is called', async () => {
            const { openModalDirect } = await import('../../../../src/managers/ModalManager');

            const props = createDefaultProps();
            const { result } = renderHook(() => useDialogHandlers(props));

            const conflictingTransaction = {
                merchant: 'Test Store',
                total: 1000,
                currency: 'CLP',
                creditUsed: true,
                hasChanges: false,
                isScanning: false,
                source: 'new_scan' as const,
            };

            act(() => {
                result.current.openConflictDialog(
                    conflictingTransaction,
                    'scan_in_progress',
                    { mode: 'new' }
                );
            });

            expect(openModalDirect).toHaveBeenCalledTimes(1);
            expect(openModalDirect).toHaveBeenCalledWith(
                'transactionConflict',
                expect.objectContaining({
                    conflictingTransaction,
                    conflictReason: 'scan_in_progress',
                })
            );
        });

        it('should pass all required props to openModalDirect', async () => {
            const { openModalDirect } = await import('../../../../src/managers/ModalManager');
            const mockT = vi.fn((key: string) => key);
            const mockFormatCurrency = vi.fn((amount: number) => `$${amount}`);

            const props = createDefaultProps({
                t: mockT,
                lang: 'en',
                formatCurrency: mockFormatCurrency,
            });
            const { result } = renderHook(() => useDialogHandlers(props));

            act(() => {
                result.current.openConflictDialog(
                    { creditUsed: false, hasChanges: true, isScanning: false, source: 'manual_entry' },
                    'has_unsaved_changes',
                    { mode: 'existing' }
                );
            });

            expect(openModalDirect).toHaveBeenCalledWith(
                'transactionConflict',
                expect.objectContaining({
                    t: mockT,
                    lang: 'en',
                    formatCurrency: mockFormatCurrency,
                    // Handler functions
                    onContinueCurrent: expect.any(Function),
                    onViewConflicting: expect.any(Function),
                    onDiscardConflicting: expect.any(Function),
                    onClose: expect.any(Function),
                })
            );
        });
    });

    // =========================================================================
    // Hook Stability Tests
    // =========================================================================

    describe('hook stability', () => {
        it('should return stable handler references with same props', () => {
            const props = createDefaultProps();
            const { result, rerender } = renderHook(() => useDialogHandlers(props));

            // Story 14e-5: Only openConflictDialog and toast handlers exposed now
            const firstRender = {
                showToast: result.current.showToast,
                openConflictDialog: result.current.openConflictDialog,
            };

            rerender();

            expect(result.current.showToast).toBe(firstRender.showToast);
            expect(result.current.openConflictDialog).toBe(firstRender.openConflictDialog);
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('edge cases', () => {
        it('should handle empty string toast message', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useDialogHandlers(props));

            act(() => {
                result.current.showToast('', 'info');
            });

            expect(result.current.toastMessage).toEqual({
                text: '',
                type: 'info',
            });
        });

        it('should handle rapid toast changes', () => {
            const props = createDefaultProps({ toastAutoHideMs: 1000 });
            const { result } = renderHook(() => useDialogHandlers(props));

            act(() => {
                result.current.showToast('First', 'success');
                result.current.showToast('Second', 'info');
                result.current.showToast('Third', 'success');
            });

            expect(result.current.toastMessage?.text).toBe('Third');
        });

        it('should handle opening conflict dialog multiple times', async () => {
            const { openModalDirect } = await import('../../../../src/managers/ModalManager');

            const props = createDefaultProps();
            const { result } = renderHook(() => useDialogHandlers(props));

            // First open
            act(() => {
                result.current.openConflictDialog(
                    { creditUsed: false, hasChanges: false, isScanning: false, source: 'new_scan' },
                    'has_unsaved_changes',
                    { mode: 'new' }
                );
            });

            expect(openModalDirect).toHaveBeenCalledTimes(1);

            // Second open (should replace first via Modal Manager)
            act(() => {
                result.current.openConflictDialog(
                    { creditUsed: true, hasChanges: false, isScanning: true, source: 'new_scan' },
                    'credit_used',
                    { mode: 'existing' }
                );
            });

            // Modal Manager is called twice total
            expect(openModalDirect).toHaveBeenCalledTimes(2);
            // Second call should have the new conflict reason
            expect(openModalDirect).toHaveBeenLastCalledWith(
                'transactionConflict',
                expect.objectContaining({
                    conflictReason: 'credit_used',
                })
            );
        });
    });
});
