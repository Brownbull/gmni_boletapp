/**
 * Unit tests for useDialogHandlers hook
 *
 * Story 14c-refactor.21: Unit tests for extracted dialog handlers
 * Story 14e-4: Credit info modal removed - now uses Modal Manager
 *
 * Tests dialog handlers:
 * - Toast notification management (showToast, auto-dismiss)
 * - Conflict dialog state and handlers (open, close, viewCurrent, discard)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Transaction } from '../../../../src/types/transaction';
import type { ScanState } from '../../../../src/types/scanStateMachine';
import type { UseDialogHandlersProps } from '../../../../src/hooks/app/useDialogHandlers';
import { useDialogHandlers } from '../../../../src/hooks/app/useDialogHandlers';

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
        setScanImages: vi.fn(),
        createDefaultTransaction: vi.fn(() => createMockTransaction()),
        setTransactionEditorMode: vi.fn(),
        navigateToView: vi.fn(),
        toastAutoHideMs: 3000,
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
    // Story 14e-4: Credit info modal tests removed - now uses Modal Manager
    // =========================================================================

    describe('conflict dialog', () => {
        it('should initialize with dialog closed', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useDialogHandlers(props));

            expect(result.current.showConflictDialog).toBe(false);
            expect(result.current.conflictDialogData).toBeNull();
        });

        it('should open conflict dialog via openConflictDialog', () => {
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

            expect(result.current.showConflictDialog).toBe(true);
            expect(result.current.conflictDialogData).toEqual({
                conflictingTransaction,
                conflictReason: 'scan_in_progress',
                pendingAction: { mode: 'new' },
            });
        });

        it('should close conflict dialog via handleConflictClose', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useDialogHandlers(props));

            // Open dialog first
            act(() => {
                result.current.openConflictDialog(
                    {
                        creditUsed: false,
                        hasChanges: true,
                        isScanning: false,
                        source: 'manual_entry',
                    },
                    'has_unsaved_changes',
                    { mode: 'existing' }
                );
            });

            expect(result.current.showConflictDialog).toBe(true);

            act(() => {
                result.current.handleConflictClose();
            });

            expect(result.current.showConflictDialog).toBe(false);
            expect(result.current.conflictDialogData).toBeNull();
        });

        it('should navigate to conflicting transaction via handleConflictViewCurrent', () => {
            const setCurrentTransaction = vi.fn();
            const setTransactionEditorMode = vi.fn();
            const navigateToView = vi.fn();
            const mockTransaction = createMockTransaction({ id: 'existing-tx' });

            const props = createDefaultProps({
                scanState: createMockScanState({ results: [mockTransaction] }),
                setCurrentTransaction,
                setTransactionEditorMode,
                navigateToView,
            });
            const { result } = renderHook(() => useDialogHandlers(props));

            // Open dialog first
            act(() => {
                result.current.openConflictDialog(
                    { creditUsed: true, hasChanges: false, isScanning: true, source: 'new_scan' },
                    'scan_in_progress',
                    { mode: 'new' }
                );
            });

            act(() => {
                result.current.handleConflictViewCurrent();
            });

            expect(result.current.showConflictDialog).toBe(false);
            expect(result.current.conflictDialogData).toBeNull();
            expect(setCurrentTransaction).toHaveBeenCalledWith(mockTransaction);
            expect(setTransactionEditorMode).toHaveBeenCalledWith('new');
            expect(navigateToView).toHaveBeenCalledWith('transaction-editor');
        });

        it('should NOT set transaction when no results in scanState', () => {
            const setCurrentTransaction = vi.fn();
            const setTransactionEditorMode = vi.fn();
            const navigateToView = vi.fn();

            const props = createDefaultProps({
                scanState: createMockScanState({ results: [] }),
                setCurrentTransaction,
                setTransactionEditorMode,
                navigateToView,
            });
            const { result } = renderHook(() => useDialogHandlers(props));

            // Open dialog first
            act(() => {
                result.current.openConflictDialog(
                    { creditUsed: false, hasChanges: false, isScanning: false, source: 'new_scan' },
                    'scan_in_progress',
                    { mode: 'new' }
                );
            });

            act(() => {
                result.current.handleConflictViewCurrent();
            });

            expect(setCurrentTransaction).not.toHaveBeenCalled();
            expect(setTransactionEditorMode).toHaveBeenCalledWith('new');
            expect(navigateToView).toHaveBeenCalledWith('transaction-editor');
        });

        it('should discard conflicting and proceed with pending action via handleConflictDiscard', () => {
            const setCurrentTransaction = vi.fn();
            const setScanImages = vi.fn();
            const setTransactionEditorMode = vi.fn();
            const navigateToView = vi.fn();
            const pendingTransaction = createMockTransaction({ id: 'pending-tx' });

            const props = createDefaultProps({
                setCurrentTransaction,
                setScanImages,
                setTransactionEditorMode,
                navigateToView,
            });
            const { result } = renderHook(() => useDialogHandlers(props));

            // Open dialog with pending action
            act(() => {
                result.current.openConflictDialog(
                    { creditUsed: true, hasChanges: false, isScanning: true, source: 'new_scan' },
                    'scan_in_progress',
                    { mode: 'existing', transaction: pendingTransaction }
                );
            });

            act(() => {
                result.current.handleConflictDiscard();
            });

            expect(result.current.showConflictDialog).toBe(false);
            // Clear conflicting state
            expect(setCurrentTransaction).toHaveBeenCalledWith(null);
            expect(setScanImages).toHaveBeenCalledWith([]);
            // Execute pending action
            expect(setTransactionEditorMode).toHaveBeenCalledWith('existing');
            expect(setCurrentTransaction).toHaveBeenCalledWith(pendingTransaction);
            expect(navigateToView).toHaveBeenCalledWith('transaction-editor');
        });

        it('should create default transaction when discarding with mode=new and no transaction', () => {
            const setCurrentTransaction = vi.fn();
            const setScanImages = vi.fn();
            const setTransactionEditorMode = vi.fn();
            const navigateToView = vi.fn();
            const defaultTransaction = createMockTransaction();
            const createDefaultTransaction = vi.fn(() => defaultTransaction);

            const props = createDefaultProps({
                setCurrentTransaction,
                setScanImages,
                setTransactionEditorMode,
                navigateToView,
                createDefaultTransaction,
            });
            const { result } = renderHook(() => useDialogHandlers(props));

            // Open dialog with mode=new but no transaction
            act(() => {
                result.current.openConflictDialog(
                    { creditUsed: false, hasChanges: true, isScanning: false, source: 'manual_entry' },
                    'has_unsaved_changes',
                    { mode: 'new' }
                );
            });

            act(() => {
                result.current.handleConflictDiscard();
            });

            expect(createDefaultTransaction).toHaveBeenCalled();
            expect(setCurrentTransaction).toHaveBeenCalledWith(defaultTransaction);
            expect(setTransactionEditorMode).toHaveBeenCalledWith('new');
        });

        it('should handle discard when no pendingAction data', () => {
            const setCurrentTransaction = vi.fn();
            const setScanImages = vi.fn();
            const setTransactionEditorMode = vi.fn();
            const navigateToView = vi.fn();

            const props = createDefaultProps({
                setCurrentTransaction,
                setScanImages,
                setTransactionEditorMode,
                navigateToView,
            });
            const { result } = renderHook(() => useDialogHandlers(props));

            // Manually set dialog data to null to simulate edge case
            act(() => {
                result.current.setShowConflictDialog(true);
                result.current.setConflictDialogData(null);
            });

            act(() => {
                result.current.handleConflictDiscard();
            });

            expect(result.current.showConflictDialog).toBe(false);
            // Should still clear conflicting state
            expect(setCurrentTransaction).toHaveBeenCalledWith(null);
            expect(setScanImages).toHaveBeenCalledWith([]);
            // But NOT execute pending action
            expect(setTransactionEditorMode).not.toHaveBeenCalled();
            expect(navigateToView).not.toHaveBeenCalled();
        });

        it('should allow direct state control via setShowConflictDialog', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useDialogHandlers(props));

            act(() => {
                result.current.setShowConflictDialog(true);
            });

            expect(result.current.showConflictDialog).toBe(true);
        });

        it('should allow direct state control via setConflictDialogData', () => {
            const props = createDefaultProps();
            const { result } = renderHook(() => useDialogHandlers(props));

            const data = {
                conflictingTransaction: {
                    creditUsed: false,
                    hasChanges: false,
                    isScanning: false,
                    source: 'new_scan' as const,
                },
                conflictReason: 'credit_used' as const,
                pendingAction: { mode: 'new' as const },
            };

            act(() => {
                result.current.setConflictDialogData(data);
            });

            expect(result.current.conflictDialogData).toEqual(data);
        });
    });

    // =========================================================================
    // Hook Stability Tests
    // =========================================================================

    describe('hook stability', () => {
        it('should return stable handler references with same props', () => {
            const props = createDefaultProps();
            const { result, rerender } = renderHook(() => useDialogHandlers(props));

            // Story 14e-4: Credit info modal handlers removed - now uses Modal Manager
            const firstRender = {
                showToast: result.current.showToast,
                handleConflictClose: result.current.handleConflictClose,
                handleConflictViewCurrent: result.current.handleConflictViewCurrent,
                handleConflictDiscard: result.current.handleConflictDiscard,
                openConflictDialog: result.current.openConflictDialog,
            };

            rerender();

            expect(result.current.showToast).toBe(firstRender.showToast);
            expect(result.current.handleConflictClose).toBe(firstRender.handleConflictClose);
            expect(result.current.openConflictDialog).toBe(firstRender.openConflictDialog);
        });

        it('should update conflict handlers when scanState changes', () => {
            const props = createDefaultProps();
            const { result, rerender } = renderHook(
                (currentProps) => useDialogHandlers(currentProps),
                { initialProps: props }
            );

            const firstViewCurrent = result.current.handleConflictViewCurrent;

            // Change scanState with new results
            const newScanState = createMockScanState({
                results: [createMockTransaction()],
            });
            rerender({ ...props, scanState: newScanState });

            expect(result.current.handleConflictViewCurrent).not.toBe(firstViewCurrent);
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

        it('should handle opening conflict dialog multiple times', () => {
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

            expect(result.current.conflictDialogData?.conflictReason).toBe('has_unsaved_changes');

            // Second open (should replace first)
            act(() => {
                result.current.openConflictDialog(
                    { creditUsed: true, hasChanges: false, isScanning: true, source: 'new_scan' },
                    'credit_used',
                    { mode: 'existing' }
                );
            });

            expect(result.current.conflictDialogData?.conflictReason).toBe('credit_used');
        });
    });
});
