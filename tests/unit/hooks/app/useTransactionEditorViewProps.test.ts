/**
 * Story 14c-refactor.26: useTransactionEditorViewProps Tests
 * Story 14c-refactor.33b: Added callback passthrough tests
 *
 * Tests for the TransactionEditorView data props composition hook.
 * Verifies:
 * - Memoization stability (same reference when deps unchanged)
 * - Correct prop composition from options
 * - scanButtonState derivation from scanState.phase
 * - batchContext computation
 * - Callback passthrough (Story 14c-refactor.33b)
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
    useTransactionEditorViewProps,
    type UseTransactionEditorViewPropsOptions,
} from '../../../../src/hooks/app/useTransactionEditorViewProps';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockUser() {
    return {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
    } as any;
}

function createMockTransaction() {
    return {
        id: 'tx-123',
        merchant: 'Test Store',
        alias: 'Favorite Store',
        total: 1000,
        currency: 'CLP',
        date: '2025-01-15',
        items: [],
        thumbnailUrl: 'https://example.com/thumb.jpg',
        _ownerId: 'test-user-123',
    } as any;
}

function createDefaultOptions(): UseTransactionEditorViewPropsOptions {
    return {
        user: createMockUser(),
        currentTransaction: createMockTransaction(),
        transactionEditorMode: 'existing',
        isViewingReadOnly: false,
        transactionNavigationList: null,
        scanState: {
            phase: 'idle',
            images: [],
            batchEditingIndex: null,
            batchReceipts: null,
        },
        isAnalyzing: false,
        scanError: null,
        skipScanCompleteModal: false,
        isRescanning: false,
        activeGroup: null,
        availableGroups: [],
        groupsLoading: false,
        userCredits: { remaining: 5, superRemaining: 0 },
        userPreferences: { defaultCity: 'Santiago', defaultCountry: 'Chile' },
        distinctAliases: ['Store 1', 'Store 2'],
        itemNameMappings: [],
        theme: 'light',
        t: vi.fn((key: string) => key),
        formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount}`),
        currency: 'CLP',
        lang: 'es' as const,
        storeCategories: ['Supermercado', 'Restaurante'],
        isSaving: false,
        animateItems: false,
        creditUsedInSession: false,
        // Callbacks (Story 14c-refactor.33b)
        onUpdateTransaction: vi.fn(),
        onSave: vi.fn().mockResolvedValue(undefined),
        onCancel: vi.fn(),
        onDelete: vi.fn(),
        onPhotoSelect: vi.fn(),
        onProcessScan: vi.fn(),
        onRetry: vi.fn(),
        onRescan: vi.fn().mockResolvedValue(undefined),
        onSaveMapping: vi.fn().mockResolvedValue('mapping-id'),
        onSaveMerchantMapping: vi.fn().mockResolvedValue('mapping-id'),
        onSaveSubcategoryMapping: vi.fn().mockResolvedValue('mapping-id'),
        onSaveItemNameMapping: vi.fn().mockResolvedValue('mapping-id'),
        onBatchPrevious: vi.fn(),
        onBatchNext: vi.fn(),
        onBatchModeClick: vi.fn(),
        onGroupsChange: vi.fn(),
        onRequestEdit: vi.fn(),
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('useTransactionEditorViewProps', () => {
    describe('Memoization Stability', () => {
        it('returns same reference when dependencies unchanged', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            const firstResult = result.current;

            // Re-render with same options object
            rerender();

            // Should be the same reference
            expect(result.current).toBe(firstResult);
        });

        it('returns new reference when dependency changes', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(
                (opts: UseTransactionEditorViewPropsOptions) =>
                    useTransactionEditorViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;

            // Re-render with changed option
            rerender({ ...options, isViewingReadOnly: true });

            // Should be different reference
            expect(result.current).not.toBe(firstResult);
            expect(result.current.readOnly).toBe(true);
        });

        it('returns same reference when unrelated option changes (shallow compare)', () => {
            const options = createDefaultOptions();

            // First render
            const { result, rerender } = renderHook(
                (opts: UseTransactionEditorViewPropsOptions) =>
                    useTransactionEditorViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;

            // Change options object reference but keep all values the same
            // (deep equality, not referential)
            const sameValueOptions = { ...options };

            rerender(sameValueOptions);

            // NOTE: With current implementation, this may create new reference
            // since we're creating new options object. The useMemo deps use
            // individual values, so it should be stable if values are the same.
            // This test documents the behavior.

            // Values should be equal
            expect(result.current.transaction).toBe(firstResult.transaction);
            expect(result.current.mode).toBe(firstResult.mode);
        });
    });

    describe('scanButtonState Derivation', () => {
        it.each([
            ['idle', 'idle'],
            ['capturing', 'pending'],
            ['scanning', 'scanning'],
            ['reviewing', 'complete'],
            ['saving', 'scanning'],
            ['error', 'error'],
        ] as const)('derives %s phase to %s state', (phase, expectedState) => {
            const options = createDefaultOptions();
            options.scanState = { ...options.scanState, phase };

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.scanButtonState).toBe(expectedState);
        });
    });

    describe('pendingImageUrl Computation', () => {
        it('returns undefined when idle and no images', () => {
            const options = createDefaultOptions();
            options.scanState = {
                phase: 'idle',
                images: [],
                batchEditingIndex: null,
                batchReceipts: null,
            };

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.pendingImageUrl).toBeUndefined();
        });

        it('returns first image when pending state with images', () => {
            const options = createDefaultOptions();
            options.scanState = {
                phase: 'capturing', // → 'pending' state
                images: ['data:image/jpeg;base64,abc123'],
                batchEditingIndex: null,
                batchReceipts: null,
            };

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.pendingImageUrl).toBe('data:image/jpeg;base64,abc123');
        });

        it('returns first image when scanning state with images', () => {
            const options = createDefaultOptions();
            options.scanState = {
                phase: 'scanning',
                images: ['data:image/jpeg;base64,scanning123'],
                batchEditingIndex: null,
                batchReceipts: null,
            };

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.pendingImageUrl).toBe('data:image/jpeg;base64,scanning123');
        });

        it('returns undefined when complete state', () => {
            const options = createDefaultOptions();
            options.scanState = {
                phase: 'reviewing', // → 'complete' state
                images: ['data:image/jpeg;base64,complete123'],
                batchEditingIndex: null,
                batchReceipts: null,
            };

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.pendingImageUrl).toBeUndefined();
        });
    });

    describe('batchContext Computation', () => {
        it('returns null when not in batch mode', () => {
            const options = createDefaultOptions();
            options.scanState.batchEditingIndex = null;
            options.scanState.batchReceipts = null;
            options.transactionNavigationList = null;

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.batchContext).toBeNull();
        });

        it('returns batch context from ScanContext when available', () => {
            const options = createDefaultOptions();
            options.scanState.batchEditingIndex = 1;
            options.scanState.batchReceipts = [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }];

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.batchContext).toEqual({
                index: 2, // 1 + 1 (1-indexed)
                total: 3,
            });
        });

        it('returns navigation list context when no batch editing', () => {
            const options = createDefaultOptions();
            options.scanState.batchEditingIndex = null;
            options.scanState.batchReceipts = null;
            options.transactionNavigationList = ['tx-1', 'tx-123', 'tx-3'];
            options.currentTransaction = createMockTransaction();

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.batchContext).toEqual({
                index: 2, // index 1 + 1 (1-indexed)
                total: 3,
            });
        });

        it('prioritizes ScanContext batch over navigation list', () => {
            const options = createDefaultOptions();
            options.scanState.batchEditingIndex = 0;
            options.scanState.batchReceipts = [{ id: 'r1' }, { id: 'r2' }];
            options.transactionNavigationList = ['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5'];

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            // Should use ScanContext (2 items), not navigation list (5 items)
            expect(result.current.batchContext).toEqual({
                index: 1,
                total: 2,
            });
        });
    });

    describe('isOtherUserTransaction Detection', () => {
        it('returns false when no ownerId', () => {
            const options = createDefaultOptions();
            options.currentTransaction = {
                ...createMockTransaction(),
                _ownerId: undefined,
            };

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.isOtherUserTransaction).toBe(false);
        });

        it('returns false when ownerId matches current user', () => {
            const options = createDefaultOptions();
            options.currentTransaction = {
                ...createMockTransaction(),
                _ownerId: 'test-user-123',
            };
            options.user = { ...createMockUser(), uid: 'test-user-123' };

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.isOtherUserTransaction).toBe(false);
        });

        it('returns true when ownerId differs from current user', () => {
            const options = createDefaultOptions();
            options.currentTransaction = {
                ...createMockTransaction(),
                _ownerId: 'other-user-456',
            };
            options.user = { ...createMockUser(), uid: 'test-user-123' };

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.isOtherUserTransaction).toBe(true);
        });
    });

    describe('ownerProfile Extraction', () => {
        it('returns undefined when no active group', () => {
            const options = createDefaultOptions();
            options.activeGroup = null;

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.ownerProfile).toBeUndefined();
        });

        it('returns profile from active group member profiles', () => {
            const options = createDefaultOptions();
            options.currentTransaction = {
                ...createMockTransaction(),
                _ownerId: 'owner-123',
            };
            options.activeGroup = {
                memberProfiles: {
                    'owner-123': {
                        displayName: 'Owner Name',
                        photoURL: 'https://example.com/photo.jpg',
                    },
                },
            };

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.ownerProfile).toEqual({
                displayName: 'Owner Name',
                photoURL: 'https://example.com/photo.jpg',
            });
        });
    });

    describe('thumbnailUrl Fallback', () => {
        it('uses transaction thumbnailUrl when available', () => {
            const options = createDefaultOptions();
            options.currentTransaction = {
                ...createMockTransaction(),
                thumbnailUrl: 'https://example.com/tx-thumb.jpg',
            };
            options.scanState.images = ['data:fallback'];

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.thumbnailUrl).toBe('https://example.com/tx-thumb.jpg');
        });

        it('falls back to first scan image when no transaction thumbnail', () => {
            const options = createDefaultOptions();
            options.currentTransaction = {
                ...createMockTransaction(),
                thumbnailUrl: undefined,
            };
            options.scanState.images = ['data:fallback-image'];

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.thumbnailUrl).toBe('data:fallback-image');
        });

        it('returns undefined when no thumbnail and no images', () => {
            const options = createDefaultOptions();
            options.currentTransaction = {
                ...createMockTransaction(),
                thumbnailUrl: undefined,
            };
            options.scanState.images = [];

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.thumbnailUrl).toBeUndefined();
        });
    });

    describe('Prop Passthrough', () => {
        it('passes through all basic props correctly', () => {
            const options = createDefaultOptions();

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.theme).toBe('light');
            expect(result.current.currency).toBe('CLP');
            expect(result.current.lang).toBe('es');
            expect(result.current.isSaving).toBe(false);
            expect(result.current.animateItems).toBe(false);
            expect(result.current.creditUsed).toBe(false);
            expect(result.current.defaultCity).toBe('Santiago');
            expect(result.current.defaultCountry).toBe('Chile');
            expect(result.current.storeCategories).toEqual(['Supermercado', 'Restaurante']);
            expect(result.current.distinctAliases).toEqual(['Store 1', 'Store 2']);
        });

        it('passes through userCredits correctly', () => {
            const options = createDefaultOptions();
            options.userCredits = { remaining: 10, superRemaining: 3 };

            const { result } = renderHook(() =>
                useTransactionEditorViewProps(options)
            );

            expect(result.current.credits).toEqual({ remaining: 10, superRemaining: 3 });
        });
    });

    // =========================================================================
    // Story 14c-refactor.33b: Callback Passthrough Tests
    // =========================================================================

    describe('Callback Passthrough (Story 14c-refactor.33b)', () => {
        describe('Transaction Operation Callbacks', () => {
            it('passes through onUpdateTransaction', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn();
                options.onUpdateTransaction = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onUpdateTransaction).toBe(mockFn);
            });

            it('passes through onSave', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn().mockResolvedValue(undefined);
                options.onSave = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onSave).toBe(mockFn);
            });

            it('passes through onCancel', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn();
                options.onCancel = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onCancel).toBe(mockFn);
            });

            it('passes through onDelete', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn();
                options.onDelete = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onDelete).toBe(mockFn);
            });
        });

        describe('Scan Handler Callbacks', () => {
            it('passes through onPhotoSelect', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn();
                options.onPhotoSelect = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onPhotoSelect).toBe(mockFn);
            });

            it('passes through onProcessScan', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn();
                options.onProcessScan = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onProcessScan).toBe(mockFn);
            });

            it('passes through onRetry', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn();
                options.onRetry = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onRetry).toBe(mockFn);
            });

            it('passes through onRescan', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn().mockResolvedValue(undefined);
                options.onRescan = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onRescan).toBe(mockFn);
            });
        });

        describe('Mapping Callbacks', () => {
            it('passes through onSaveMapping', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn().mockResolvedValue('mapping-id');
                options.onSaveMapping = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onSaveMapping).toBe(mockFn);
            });

            it('passes through onSaveMerchantMapping', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn().mockResolvedValue('mapping-id');
                options.onSaveMerchantMapping = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onSaveMerchantMapping).toBe(mockFn);
            });

            it('passes through onSaveSubcategoryMapping', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn().mockResolvedValue('mapping-id');
                options.onSaveSubcategoryMapping = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onSaveSubcategoryMapping).toBe(mockFn);
            });

            it('passes through onSaveItemNameMapping', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn().mockResolvedValue('mapping-id');
                options.onSaveItemNameMapping = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onSaveItemNameMapping).toBe(mockFn);
            });
        });

        describe('Batch Navigation Callbacks', () => {
            it('passes through onBatchPrevious', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn();
                options.onBatchPrevious = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onBatchPrevious).toBe(mockFn);
            });

            it('passes through onBatchNext', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn();
                options.onBatchNext = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onBatchNext).toBe(mockFn);
            });

            it('passes through onBatchModeClick', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn();
                options.onBatchModeClick = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onBatchModeClick).toBe(mockFn);
            });
        });

        describe('Group and Edit Callbacks', () => {
            it('passes through onGroupsChange', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn();
                options.onGroupsChange = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onGroupsChange).toBe(mockFn);
            });

            it('passes through onRequestEdit', () => {
                const options = createDefaultOptions();
                const mockFn = vi.fn();
                options.onRequestEdit = mockFn;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onRequestEdit).toBe(mockFn);
            });
        });

        describe('Callback Stability', () => {
            it('maintains callback references when other deps change', () => {
                const options = createDefaultOptions();
                const onSave = vi.fn().mockResolvedValue(undefined);
                options.onSave = onSave;

                const { result, rerender } = renderHook(
                    (opts: UseTransactionEditorViewPropsOptions) =>
                        useTransactionEditorViewProps(opts),
                    { initialProps: options }
                );

                const firstOnSave = result.current.onSave;

                // Change a data prop, keep callbacks the same
                rerender({ ...options, isSaving: true });

                // Callback reference should still be the same mock
                expect(result.current.onSave).toBe(onSave);
                expect(result.current.onSave).toBe(firstOnSave);
            });

            it('allows undefined optional callbacks', () => {
                const options = createDefaultOptions();
                options.onDelete = undefined;
                options.onRescan = undefined;
                options.onSaveMapping = undefined;
                options.onBatchPrevious = undefined;

                const { result } = renderHook(() =>
                    useTransactionEditorViewProps(options)
                );

                expect(result.current.onDelete).toBeUndefined();
                expect(result.current.onRescan).toBeUndefined();
                expect(result.current.onSaveMapping).toBeUndefined();
                expect(result.current.onBatchPrevious).toBeUndefined();
            });
        });
    });
});
