/**
 * Story 14e-40: hasActiveTransactionConflict Utility Tests
 *
 * Tests for the conflict detection utility that determines if navigating
 * to a transaction would conflict with an active scan state.
 *
 * @module conflictDetection.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    hasActiveTransactionConflict,
    type ConflictResult,
} from '@features/scan/utils/conflictDetection';
import type { ScanState } from '@/types/scanStateMachine';
import type { View } from '@app/types';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Creates a minimal idle scan state for testing.
 */
const createIdleScanState = (): ScanState => ({
    phase: 'idle',
    mode: 'single',
    requestId: null,
    userId: null,
    startedAt: null,
    images: [],
    results: [],
    activeResultIndex: 0,
    creditStatus: 'none',
    creditType: null,
    creditsCount: 0,
    activeDialog: null,
    error: null,
    batchProgress: null,
    batchReceipts: null,
    batchEditingIndex: null,
    storeType: null,
    currency: null,
});

/**
 * Creates a scanning state for testing.
 */
const createScanningScanState = (
    overrides: Partial<ScanState> = {}
): ScanState => ({
    ...createIdleScanState(),
    phase: 'scanning',
    requestId: 'test-request-123',
    userId: 'test-user',
    startedAt: Date.now(),
    images: ['base64-image'],
    creditStatus: 'reserved',
    creditType: 'normal',
    creditsCount: 1,
    ...overrides,
});

/**
 * Creates a reviewing state for testing.
 */
const createReviewingScanState = (
    overrides: Partial<ScanState> = {}
): ScanState => ({
    ...createScanningScanState(),
    phase: 'reviewing',
    creditStatus: 'confirmed',
    results: [
        {
            id: 'temp-tx-1',
            date: new Date().toISOString(),
            merchant: 'Test Store',
            total: 1500,
            currency: 'CLP',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ],
    ...overrides,
});

/**
 * Creates a capturing state with images but no analysis.
 */
const createCapturingScanState = (
    overrides: Partial<ScanState> = {}
): ScanState => ({
    ...createIdleScanState(),
    phase: 'capturing',
    requestId: 'test-request-456',
    userId: 'test-user',
    startedAt: Date.now(),
    images: ['base64-image-1', 'base64-image-2'],
    ...overrides,
});

// =============================================================================
// Test Suite
// =============================================================================

describe('hasActiveTransactionConflict', () => {
    // Suppress console.warn for error tests
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    // =========================================================================
    // AC1: Pure utility function tests
    // =========================================================================

    describe('AC1: Pure utility function', () => {
        it('should be a pure function with no side effects', () => {
            const scanState = createIdleScanState();
            const view: View = 'dashboard';

            // Call multiple times with same input
            const result1 = hasActiveTransactionConflict(scanState, view);
            const result2 = hasActiveTransactionConflict(scanState, view);

            // Should return identical results (pure function)
            expect(result1).toEqual(result2);

            // Original state should not be modified
            expect(scanState.phase).toBe('idle');
        });

        it('should return ConflictResult type with hasConflict boolean', () => {
            const scanState = createIdleScanState();
            const view: View = 'dashboard';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result).toHaveProperty('hasConflict');
            expect(typeof result.hasConflict).toBe('boolean');
        });
    });

    // =========================================================================
    // Task 2.1: No conflict when scan idle
    // =========================================================================

    describe('Task 2.1: No conflict when scan idle', () => {
        it('should return no conflict when scan phase is idle', () => {
            const scanState = createIdleScanState();
            const view: View = 'dashboard';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result.hasConflict).toBe(false);
            expect(result.conflictInfo).toBeUndefined();
        });

        it('should return no conflict when idle regardless of view', () => {
            const scanState = createIdleScanState();
            const views: View[] = ['dashboard', 'history', 'trends', 'settings'];

            views.forEach((view) => {
                const result = hasActiveTransactionConflict(scanState, view);
                expect(result.hasConflict).toBe(false);
            });
        });
    });

    // =========================================================================
    // Task 2.2: Conflict during active single scan
    // =========================================================================

    describe('Task 2.2: Conflict during active single scan', () => {
        it('should return conflict when scanning in progress', () => {
            const scanState = createScanningScanState();
            const view: View = 'dashboard';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result.hasConflict).toBe(true);
            expect(result.conflictInfo?.reason).toBe('scan_in_progress');
        });

        it('should return conflict with isScanning=true during scan', () => {
            const scanState = createScanningScanState();
            const view: View = 'history';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result.conflictInfo?.transaction.isScanning).toBe(true);
            expect(result.conflictInfo?.transaction.source).toBe('new_scan');
        });

        it('should return conflict when reviewing after credit used', () => {
            const scanState = createReviewingScanState();
            const view: View = 'dashboard';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result.hasConflict).toBe(true);
            expect(result.conflictInfo?.reason).toBe('credit_used');
            expect(result.conflictInfo?.transaction.creditUsed).toBe(true);
        });
    });

    // =========================================================================
    // Task 2.3: Conflict during batch scan
    // =========================================================================

    describe('Task 2.3: Conflict during batch scan', () => {
        it('should return conflict during batch scanning phase', () => {
            const scanState = createScanningScanState({
                mode: 'batch',
                batchProgress: {
                    current: 1,
                    total: 3,
                    completed: [],
                    failed: [],
                },
            });
            const view: View = 'dashboard';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result.hasConflict).toBe(true);
            expect(result.conflictInfo?.reason).toBe('scan_in_progress');
        });

        it('should return conflict during batch reviewing phase', () => {
            const scanState = createReviewingScanState({
                mode: 'batch',
                batchReceipts: [
                    {
                        id: 'receipt-1',
                        imageIndex: 0,
                        status: 'ready',
                        transaction: {
                            id: 'tx-1',
                            date: new Date().toISOString(),
                            merchant: 'Store 1',
                            total: 1000,
                            currency: 'CLP',
                            items: [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                    },
                ],
            });
            const view: View = 'history';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result.hasConflict).toBe(true);
            expect(result.conflictInfo?.reason).toBe('credit_used');
        });
    });

    // =========================================================================
    // Task 2.4: No conflict when editing same transaction
    // =========================================================================

    describe('Task 2.4: No conflict when editing same transaction (transaction-editor view)', () => {
        it('should return no conflict when already on transaction-editor view', () => {
            const scanState = createReviewingScanState();
            const view: View = 'transaction-editor';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result.hasConflict).toBe(false);
        });

        it('should return no conflict from transaction-editor even during scanning', () => {
            const scanState = createScanningScanState();
            const view: View = 'transaction-editor';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result.hasConflict).toBe(false);
        });
    });

    // =========================================================================
    // Task 2.5: Conflict info contains correct reason
    // =========================================================================

    describe('Task 2.5: Conflict info contains correct reason', () => {
        it('should return scan_in_progress reason during scanning phase', () => {
            const scanState = createScanningScanState();
            const view: View = 'dashboard';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result.conflictInfo?.reason).toBe('scan_in_progress');
        });

        it('should return credit_used reason during reviewing phase', () => {
            const scanState = createReviewingScanState();
            const view: View = 'dashboard';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result.conflictInfo?.reason).toBe('credit_used');
        });

        it('should return has_unsaved_changes reason when images but no analysis', () => {
            const scanState = createCapturingScanState();
            const view: View = 'dashboard';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result.hasConflict).toBe(true);
            expect(result.conflictInfo?.reason).toBe('has_unsaved_changes');
            expect(result.conflictInfo?.transaction.creditUsed).toBe(false);
            expect(result.conflictInfo?.transaction.hasChanges).toBe(true);
        });

        it('should include merchant and total in conflict info when available', () => {
            const scanState = createReviewingScanState({
                results: [
                    {
                        id: 'tx-1',
                        date: new Date().toISOString(),
                        merchant: 'SuperMart',
                        total: 25000,
                        currency: 'CLP',
                        items: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                ],
            });
            const view: View = 'history';

            const result = hasActiveTransactionConflict(scanState, view);

            expect(result.conflictInfo?.transaction.merchant).toBe('SuperMart');
            expect(result.conflictInfo?.transaction.total).toBe(25000);
            expect(result.conflictInfo?.transaction.currency).toBe('CLP');
        });
    });

    // =========================================================================
    // Task 2.6 / AC6: Error boundary protection
    // =========================================================================

    describe('Task 2.6 / AC6: Error boundary protection', () => {
        it('should return safe default on null scanState', () => {
            // @ts-expect-error - Testing malformed input
            const result = hasActiveTransactionConflict(null, 'dashboard');

            expect(result.hasConflict).toBe(false);
            expect(console.warn).toHaveBeenCalled();
        });

        it('should return safe default on undefined scanState', () => {
            // @ts-expect-error - Testing malformed input
            const result = hasActiveTransactionConflict(undefined, 'dashboard');

            expect(result.hasConflict).toBe(false);
            expect(console.warn).toHaveBeenCalled();
        });

        it('should return safe default on malformed scanState', () => {
            // @ts-expect-error - Testing malformed input
            const result = hasActiveTransactionConflict({}, 'dashboard');

            expect(result.hasConflict).toBe(false);
        });

        it('should handle missing results array gracefully', () => {
            const scanState = createScanningScanState();
            // @ts-expect-error - Testing malformed input
            delete scanState.results;

            const result = hasActiveTransactionConflict(scanState, 'dashboard');

            // Should still detect conflict (scan in progress)
            expect(result.hasConflict).toBe(true);
        });

        it('should handle missing images array gracefully', () => {
            const scanState = createCapturingScanState();
            // @ts-expect-error - Testing malformed input
            delete scanState.images;

            const result = hasActiveTransactionConflict(scanState, 'dashboard');

            // Should return no conflict since no images
            expect(result.hasConflict).toBe(false);
        });
    });

    // =========================================================================
    // Edge cases
    // =========================================================================

    describe('Edge cases', () => {
        it('should handle error phase with images', () => {
            const scanState: ScanState = {
                ...createScanningScanState(),
                phase: 'error',
                creditStatus: 'refunded',
                error: 'Network error',
            };
            const view: View = 'dashboard';

            const result = hasActiveTransactionConflict(scanState, view);

            // Error state with images should indicate unsaved content
            expect(result.hasConflict).toBe(true);
        });

        it('should handle saving phase', () => {
            const scanState: ScanState = {
                ...createReviewingScanState(),
                phase: 'saving',
            };
            const view: View = 'dashboard';

            const result = hasActiveTransactionConflict(scanState, view);

            // Saving phase indicates active transaction
            expect(result.hasConflict).toBe(true);
        });

        it('should handle empty results array during reviewing', () => {
            const scanState = createReviewingScanState({
                results: [],
            });
            const view: View = 'dashboard';

            const result = hasActiveTransactionConflict(scanState, view);

            // No results but images exist = unsaved changes
            expect(result.hasConflict).toBe(true);
        });
    });
});
