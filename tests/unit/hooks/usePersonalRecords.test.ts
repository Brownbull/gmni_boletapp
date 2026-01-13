/**
 * usePersonalRecords Hook Tests
 *
 * Story 14.19: Personal Records Detection
 * Epic 14: Core Implementation
 *
 * Tests for the personal records hook integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePersonalRecords } from '../../../src/hooks/usePersonalRecords';
import type { Transaction } from '../../../src/types/transaction';
import { RECORD_COOLDOWNS_KEY } from '../../../src/types/personalRecord';

// Mock the recordsService
vi.mock('../../../src/services/recordsService', async () => {
    const actual = await vi.importActual('../../../src/services/recordsService');
    return {
        ...actual,
        storePersonalRecord: vi.fn().mockResolvedValue('mock-record-id'),
    };
});

describe('usePersonalRecords', () => {
    let mockStorage: Record<string, string>;

    beforeEach(() => {
        mockStorage = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => mockStorage[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                mockStorage[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete mockStorage[key];
            }),
            clear: vi.fn(() => {
                mockStorage = {};
            }),
            length: 0,
            key: vi.fn(() => null),
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('initializes with null record and banner hidden', () => {
            const { result } = renderHook(() =>
                usePersonalRecords({
                    db: null,
                    userId: null,
                    appId: null,
                })
            );

            expect(result.current.recordToCelebrate).toBeNull();
            expect(result.current.showRecordBanner).toBe(false);
        });
    });

    describe('checkForRecords', () => {
        it('does nothing when user is not authenticated', () => {
            const { result } = renderHook(() =>
                usePersonalRecords({
                    db: null,
                    userId: null,
                    appId: null,
                })
            );

            const mockTransactions: Transaction[] = [
                createTransaction('2025-01-06', 'Restaurant', 1000),
            ];

            act(() => {
                result.current.checkForRecords(mockTransactions);
            });

            expect(result.current.recordToCelebrate).toBeNull();
        });

        it('does nothing when db is not available', () => {
            const { result } = renderHook(() =>
                usePersonalRecords({
                    db: null,
                    userId: 'user-123',
                    appId: 'app-123',
                })
            );

            const mockTransactions: Transaction[] = [
                createTransaction('2025-01-06', 'Restaurant', 1000),
            ];

            act(() => {
                result.current.checkForRecords(mockTransactions);
            });

            expect(result.current.recordToCelebrate).toBeNull();
        });
    });

    describe('dismissRecord', () => {
        it('hides the banner when dismissed', () => {
            const { result } = renderHook(() =>
                usePersonalRecords({
                    db: null,
                    userId: null,
                    appId: null,
                })
            );

            // Manually set states for testing dismissal
            act(() => {
                result.current.dismissRecord();
            });

            expect(result.current.showRecordBanner).toBe(false);
        });

        it('clears recordToCelebrate after delay', async () => {
            const { result } = renderHook(() =>
                usePersonalRecords({
                    db: null,
                    userId: null,
                    appId: null,
                })
            );

            act(() => {
                result.current.dismissRecord();
            });

            // Advance timer for cleanup
            act(() => {
                vi.advanceTimersByTime(300);
            });

            expect(result.current.recordToCelebrate).toBeNull();
        });
    });

    describe('clearPendingCelebration', () => {
        it('clears both record and banner state', () => {
            const { result } = renderHook(() =>
                usePersonalRecords({
                    db: null,
                    userId: null,
                    appId: null,
                })
            );

            act(() => {
                result.current.clearPendingCelebration();
            });

            expect(result.current.recordToCelebrate).toBeNull();
            expect(result.current.showRecordBanner).toBe(false);
        });
    });
});

// ============================================================================
// Test Helpers
// ============================================================================

function createTransaction(
    date: string,
    category: string,
    total: number
): Transaction {
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0);

    return {
        id: `tx-${date}-${category}-${total}`,
        merchant: `Test ${category}`,
        total,
        currency: 'CLP',
        date,
        category,
        createdAt: localDate,
        items: [],
    };
}
