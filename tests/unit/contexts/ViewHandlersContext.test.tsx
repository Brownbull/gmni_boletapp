/**
 * Story 14c-refactor.25: ViewHandlersContext Tests
 *
 * Tests for the ViewHandlersContext that provides handler bundles to views.
 *
 * Features tested:
 * - Provider renders children
 * - useViewHandlers hook returns all handler bundles
 * - useViewHandlers throws when used outside provider
 * - useViewHandlersOptional returns null when used outside provider
 * - Handler types match expected interfaces
 *
 * Architecture Reference: Epic 14c-refactor - App Decomposition
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import React from 'react';
import {
    ViewHandlersProvider,
    useViewHandlers,
    useViewHandlersOptional,
    type ViewHandlersContextValue,
    type TransactionHandlers,
    type ScanHandlers,
    type NavigationHandlers,
    type DialogHandlers,
} from '../../../src/contexts/ViewHandlersContext';

// =============================================================================
// Mock Handler Bundles
// =============================================================================

/**
 * Creates mock transaction handlers for testing
 */
function createMockTransactionHandlers(): TransactionHandlers {
    return {
        saveTransaction: vi.fn().mockResolvedValue(undefined),
        deleteTransaction: vi.fn().mockResolvedValue(undefined),
        wipeDB: vi.fn().mockResolvedValue(undefined),
        handleExportData: vi.fn().mockResolvedValue(undefined),
        createDefaultTransaction: vi.fn().mockReturnValue({
            merchant: '',
            date: new Date().toISOString(),
            total: 0,
            category: 'Supermarket',
            items: [],
        }),
    };
}

/**
 * Creates mock scan handlers for testing
 */
function createMockScanHandlers(): ScanHandlers {
    return {
        handleScanOverlayCancel: vi.fn(),
        handleScanOverlayRetry: vi.fn(),
        handleScanOverlayDismiss: vi.fn(),
        handleQuickSaveComplete: vi.fn().mockResolvedValue(undefined),
        handleQuickSave: vi.fn().mockResolvedValue(undefined),
        handleQuickSaveEdit: vi.fn(),
        handleQuickSaveCancel: vi.fn(),
        handleCurrencyUseDetected: vi.fn(),
        handleCurrencyUseDefault: vi.fn(),
        handleCurrencyMismatchCancel: vi.fn(),
        handleTotalUseItemsSum: vi.fn(),
        handleTotalKeepOriginal: vi.fn(),
        handleTotalMismatchCancel: vi.fn(),
        applyItemNameMappings: vi.fn().mockReturnValue({ transaction: {}, appliedIds: [] }),
        reconcileItemsTotal: vi.fn().mockReturnValue({ items: [], hasDiscrepancy: false, discrepancyAmount: 0 }),
        continueScanWithTransaction: vi.fn().mockResolvedValue(undefined),
    };
}

/**
 * Creates mock navigation handlers for testing
 */
function createMockNavigationHandlers(): NavigationHandlers {
    return {
        navigateToView: vi.fn(),
        navigateBack: vi.fn(),
        handleNavigateToHistory: vi.fn(),
    };
}

/**
 * Creates mock dialog handlers for testing
 */
function createMockDialogHandlers(): DialogHandlers {
    return {
        // Toast
        toastMessage: null,
        setToastMessage: vi.fn(),
        showToast: vi.fn(),
        // Credit Info Modal
        showCreditInfoModal: false,
        setShowCreditInfoModal: vi.fn(),
        openCreditInfoModal: vi.fn(),
        closeCreditInfoModal: vi.fn(),
        // Conflict Dialog
        showConflictDialog: false,
        setShowConflictDialog: vi.fn(),
        conflictDialogData: null,
        setConflictDialogData: vi.fn(),
        handleConflictClose: vi.fn(),
        handleConflictViewCurrent: vi.fn(),
        handleConflictDiscard: vi.fn(),
        openConflictDialog: vi.fn(),
    };
}

/**
 * Creates a wrapper component with ViewHandlersProvider and mock handlers
 */
function createWrapper(overrides: Partial<{
    transaction: TransactionHandlers;
    scan: ScanHandlers;
    navigation: NavigationHandlers;
    dialog: DialogHandlers;
}> = {}) {
    const transaction = overrides.transaction ?? createMockTransactionHandlers();
    const scan = overrides.scan ?? createMockScanHandlers();
    const navigation = overrides.navigation ?? createMockNavigationHandlers();
    const dialog = overrides.dialog ?? createMockDialogHandlers();

    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <ViewHandlersProvider
                transaction={transaction}
                scan={scan}
                navigation={navigation}
                dialog={dialog}
            >
                {children}
            </ViewHandlersProvider>
        );
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('ViewHandlersContext (Story 14c-refactor.25)', () => {
    // ===========================================================================
    // Provider Tests
    // ===========================================================================

    describe('ViewHandlersProvider', () => {
        it('should render children', () => {
            render(
                <ViewHandlersProvider
                    transaction={createMockTransactionHandlers()}
                    scan={createMockScanHandlers()}
                    navigation={createMockNavigationHandlers()}
                    dialog={createMockDialogHandlers()}
                >
                    <div data-testid="child">Child content</div>
                </ViewHandlersProvider>
            );

            expect(screen.getByTestId('child')).toHaveTextContent('Child content');
        });

        it('should provide all handler bundles to children', () => {
            function TestChild() {
                const handlers = useViewHandlers();
                return (
                    <div>
                        <div data-testid="has-transaction">{typeof handlers.transaction === 'object' ? 'yes' : 'no'}</div>
                        <div data-testid="has-scan">{typeof handlers.scan === 'object' ? 'yes' : 'no'}</div>
                        <div data-testid="has-navigation">{typeof handlers.navigation === 'object' ? 'yes' : 'no'}</div>
                        <div data-testid="has-dialog">{typeof handlers.dialog === 'object' ? 'yes' : 'no'}</div>
                    </div>
                );
            }

            render(
                <ViewHandlersProvider
                    transaction={createMockTransactionHandlers()}
                    scan={createMockScanHandlers()}
                    navigation={createMockNavigationHandlers()}
                    dialog={createMockDialogHandlers()}
                >
                    <TestChild />
                </ViewHandlersProvider>
            );

            expect(screen.getByTestId('has-transaction')).toHaveTextContent('yes');
            expect(screen.getByTestId('has-scan')).toHaveTextContent('yes');
            expect(screen.getByTestId('has-navigation')).toHaveTextContent('yes');
            expect(screen.getByTestId('has-dialog')).toHaveTextContent('yes');
        });
    });

    // ===========================================================================
    // useViewHandlers Hook Tests
    // ===========================================================================

    describe('useViewHandlers', () => {
        it('should return transaction handlers bundle', () => {
            const mockTransaction = createMockTransactionHandlers();
            const { result } = renderHook(() => useViewHandlers(), {
                wrapper: createWrapper({ transaction: mockTransaction }),
            });

            expect(result.current.transaction).toBe(mockTransaction);
            expect(typeof result.current.transaction.saveTransaction).toBe('function');
            expect(typeof result.current.transaction.deleteTransaction).toBe('function');
            expect(typeof result.current.transaction.wipeDB).toBe('function');
            expect(typeof result.current.transaction.handleExportData).toBe('function');
            expect(typeof result.current.transaction.createDefaultTransaction).toBe('function');
        });

        it('should return scan handlers bundle', () => {
            const mockScan = createMockScanHandlers();
            const { result } = renderHook(() => useViewHandlers(), {
                wrapper: createWrapper({ scan: mockScan }),
            });

            expect(result.current.scan).toBe(mockScan);
            expect(typeof result.current.scan.handleScanOverlayCancel).toBe('function');
            expect(typeof result.current.scan.handleQuickSave).toBe('function');
            expect(typeof result.current.scan.handleCurrencyUseDetected).toBe('function');
            expect(typeof result.current.scan.handleTotalUseItemsSum).toBe('function');
        });

        it('should return navigation handlers bundle', () => {
            const mockNavigation = createMockNavigationHandlers();
            const { result } = renderHook(() => useViewHandlers(), {
                wrapper: createWrapper({ navigation: mockNavigation }),
            });

            expect(result.current.navigation).toBe(mockNavigation);
            expect(typeof result.current.navigation.navigateToView).toBe('function');
            expect(typeof result.current.navigation.navigateBack).toBe('function');
            expect(typeof result.current.navigation.handleNavigateToHistory).toBe('function');
        });

        it('should return dialog handlers bundle', () => {
            const mockDialog = createMockDialogHandlers();
            const { result } = renderHook(() => useViewHandlers(), {
                wrapper: createWrapper({ dialog: mockDialog }),
            });

            expect(result.current.dialog).toBe(mockDialog);
            expect(typeof result.current.dialog.setToastMessage).toBe('function');
            expect(typeof result.current.dialog.openCreditInfoModal).toBe('function');
            expect(typeof result.current.dialog.handleConflictClose).toBe('function');
        });

        it('should throw error when used outside provider', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                renderHook(() => useViewHandlers());
            }).toThrow('useViewHandlers must be used within a ViewHandlersProvider');

            consoleSpy.mockRestore();
        });
    });

    // ===========================================================================
    // useViewHandlersOptional Hook Tests
    // ===========================================================================

    describe('useViewHandlersOptional', () => {
        it('should return null when used outside provider', () => {
            const { result } = renderHook(() => useViewHandlersOptional());

            expect(result.current).toBeNull();
        });

        it('should return context value when used inside provider', () => {
            const { result } = renderHook(() => useViewHandlersOptional(), {
                wrapper: createWrapper(),
            });

            expect(result.current).not.toBeNull();
            expect(result.current?.transaction).toBeDefined();
            expect(result.current?.scan).toBeDefined();
            expect(result.current?.navigation).toBeDefined();
            expect(result.current?.dialog).toBeDefined();
        });
    });

    // ===========================================================================
    // Handler Invocation Tests
    // ===========================================================================

    describe('Handler Invocation', () => {
        it('should allow calling transaction handlers', async () => {
            const mockTransaction = createMockTransactionHandlers();
            const { result } = renderHook(() => useViewHandlers(), {
                wrapper: createWrapper({ transaction: mockTransaction }),
            });

            await result.current.transaction.saveTransaction({ id: '1' } as any);
            expect(mockTransaction.saveTransaction).toHaveBeenCalledWith({ id: '1' });
        });

        it('should allow calling navigation handlers', () => {
            const mockNavigation = createMockNavigationHandlers();
            const { result } = renderHook(() => useViewHandlers(), {
                wrapper: createWrapper({ navigation: mockNavigation }),
            });

            result.current.navigation.navigateToView('dashboard');
            expect(mockNavigation.navigateToView).toHaveBeenCalledWith('dashboard');

            result.current.navigation.navigateBack();
            expect(mockNavigation.navigateBack).toHaveBeenCalled();
        });

        it('should allow calling dialog handlers', () => {
            const mockDialog = createMockDialogHandlers();
            const { result } = renderHook(() => useViewHandlers(), {
                wrapper: createWrapper({ dialog: mockDialog }),
            });

            result.current.dialog.openCreditInfoModal();
            expect(mockDialog.openCreditInfoModal).toHaveBeenCalled();

            result.current.dialog.showToast('Test message', 'success');
            expect(mockDialog.showToast).toHaveBeenCalledWith('Test message', 'success');
        });

        it('should allow calling scan handlers', () => {
            const mockScan = createMockScanHandlers();
            const { result } = renderHook(() => useViewHandlers(), {
                wrapper: createWrapper({ scan: mockScan }),
            });

            result.current.scan.handleScanOverlayCancel();
            expect(mockScan.handleScanOverlayCancel).toHaveBeenCalled();

            result.current.scan.handleQuickSaveCancel();
            expect(mockScan.handleQuickSaveCancel).toHaveBeenCalled();
        });
    });

    // ===========================================================================
    // Component Integration Tests
    // ===========================================================================

    describe('Component Integration', () => {
        it('should allow view components to access handlers', async () => {
            function MockView() {
                const { transaction, navigation, dialog } = useViewHandlers();

                const handleSave = async () => {
                    await transaction.saveTransaction({ id: '1' } as any);
                    dialog.showToast('Saved!', 'success');
                    navigation.navigateToView('dashboard');
                };

                return (
                    <button data-testid="save-btn" onClick={handleSave}>
                        Save
                    </button>
                );
            }

            const mockTransaction = createMockTransactionHandlers();
            const mockNavigation = createMockNavigationHandlers();
            const mockDialog = createMockDialogHandlers();

            render(
                <ViewHandlersProvider
                    transaction={mockTransaction}
                    scan={createMockScanHandlers()}
                    navigation={mockNavigation}
                    dialog={mockDialog}
                >
                    <MockView />
                </ViewHandlersProvider>
            );

            // Click and wait for async operations to complete
            screen.getByTestId('save-btn').click();

            // Wait for the async handler to complete
            await vi.waitFor(() => {
                expect(mockTransaction.saveTransaction).toHaveBeenCalled();
            });

            expect(mockDialog.showToast).toHaveBeenCalledWith('Saved!', 'success');
            expect(mockNavigation.navigateToView).toHaveBeenCalledWith('dashboard');
        });

        it('should provide handlers to deeply nested components', () => {
            function DeepChild() {
                const { navigation } = useViewHandlers();
                return (
                    <button data-testid="deep-btn" onClick={() => navigation.navigateBack()}>
                        Back
                    </button>
                );
            }

            function Intermediate({ children }: { children: React.ReactNode }) {
                return <div>{children}</div>;
            }

            const mockNavigation = createMockNavigationHandlers();

            render(
                <ViewHandlersProvider
                    transaction={createMockTransactionHandlers()}
                    scan={createMockScanHandlers()}
                    navigation={mockNavigation}
                    dialog={createMockDialogHandlers()}
                >
                    <Intermediate>
                        <Intermediate>
                            <DeepChild />
                        </Intermediate>
                    </Intermediate>
                </ViewHandlersProvider>
            );

            screen.getByTestId('deep-btn').click();
            expect(mockNavigation.navigateBack).toHaveBeenCalled();
        });
    });
});
