/**
 * useOfflineRecoveryDetection Hook Tests
 *
 * Story 14d-v2-1-9: Firestore TTL & Offline Persistence
 * Epic 14d-v2: Shared Groups v2
 *
 * Tests for the hook that detects when a user has been offline
 * longer than the changelog TTL (30 days) and needs a full sync.
 *
 * Test Cases:
 * 1. Constants: RECOVERY_THRESHOLD_DAYS = 30, RECOVERY_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000
 * 2. AC11: Returns needsRecovery: false when lastSyncTime is null (fresh group)
 * 3. AC10: Returns needsRecovery: false when exactly 30 days ago (boundary)
 * 4. Returns needsRecovery: true when 31 days ago (> 30)
 * 5. Returns needsRecovery: true when 1ms over 30 days
 * 6. Returns needsRecovery: false when 29 days ago
 * 7. Returns needsRecovery: false when 1 day ago
 * 8. Returns needsRecovery: false when just now
 * 9. Days calculation rounds down (10 days 23 hours = 10 days)
 * 10. Memoization works
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import {
    useOfflineRecoveryDetection,
    RECOVERY_THRESHOLD_MS,
    RECOVERY_THRESHOLD_DAYS,
} from '@/features/shared-groups/hooks/useOfflineRecoveryDetection';
import { CHANGELOG_TTL_MS, CHANGELOG_TTL_DAYS } from '@/types/changelog';

// =============================================================================
// Constants Tests
// =============================================================================

describe('useOfflineRecoveryDetection', () => {
    describe('constants', () => {
        it('RECOVERY_THRESHOLD_DAYS equals 30', () => {
            expect(RECOVERY_THRESHOLD_DAYS).toBe(30);
        });

        it('RECOVERY_THRESHOLD_MS equals 30 days in milliseconds', () => {
            const expected = 30 * 24 * 60 * 60 * 1000;
            expect(RECOVERY_THRESHOLD_MS).toBe(expected);
        });

        it('RECOVERY_THRESHOLD_MS equals CHANGELOG_TTL_MS', () => {
            expect(RECOVERY_THRESHOLD_MS).toBe(CHANGELOG_TTL_MS);
        });

        it('RECOVERY_THRESHOLD_DAYS equals CHANGELOG_TTL_DAYS', () => {
            expect(RECOVERY_THRESHOLD_DAYS).toBe(CHANGELOG_TTL_DAYS);
        });
    });

    // =========================================================================
    // AC11: Fresh group (null lastSyncTime)
    // =========================================================================
    describe('AC11: fresh group (null lastSyncTime)', () => {
        it('returns needsRecovery: false when lastSyncTime is null', () => {
            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({ lastSyncTime: null })
            );

            expect(result.current.needsRecovery).toBe(false);
        });

        it('returns daysSinceLastSync: null when lastSyncTime is null', () => {
            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({ lastSyncTime: null })
            );

            expect(result.current.daysSinceLastSync).toBeNull();
        });
    });

    // =========================================================================
    // AC10: Boundary conditions (exactly 30 days)
    // =========================================================================
    describe('AC10: boundary conditions', () => {
        it('returns needsRecovery: false when exactly 30 days ago (boundary)', () => {
            const now = new Date('2024-02-01T12:00:00Z');
            // Exactly 30 days = 30 * 24 * 60 * 60 * 1000 ms before
            const lastSync = new Date(now.getTime() - RECOVERY_THRESHOLD_MS);

            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({
                    lastSyncTime: lastSync,
                    currentTime: now,
                })
            );

            // Exactly 30 days should NOT trigger recovery (<=30 is OK)
            expect(result.current.needsRecovery).toBe(false);
            expect(result.current.daysSinceLastSync).toBe(30);
        });

        it('returns needsRecovery: true when 31 days ago (exceeds threshold)', () => {
            const now = new Date('2024-02-01T12:00:00Z');
            // 31 days in ms
            const thirtyOneDaysMs = 31 * 24 * 60 * 60 * 1000;
            const lastSync = new Date(now.getTime() - thirtyOneDaysMs);

            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({
                    lastSyncTime: lastSync,
                    currentTime: now,
                })
            );

            expect(result.current.needsRecovery).toBe(true);
            expect(result.current.daysSinceLastSync).toBe(31);
        });

        it('returns needsRecovery: true when 1ms over 30 days', () => {
            const now = new Date('2024-02-01T12:00:00Z');
            // 30 days + 1ms
            const lastSync = new Date(now.getTime() - RECOVERY_THRESHOLD_MS - 1);

            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({
                    lastSyncTime: lastSync,
                    currentTime: now,
                })
            );

            // 1ms over should trigger recovery
            expect(result.current.needsRecovery).toBe(true);
        });
    });

    // =========================================================================
    // Within threshold (should NOT trigger recovery)
    // =========================================================================
    describe('within threshold', () => {
        it('returns needsRecovery: false when 29 days ago', () => {
            const now = new Date('2024-02-01T12:00:00Z');
            const twentyNineDaysMs = 29 * 24 * 60 * 60 * 1000;
            const lastSync = new Date(now.getTime() - twentyNineDaysMs);

            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({
                    lastSyncTime: lastSync,
                    currentTime: now,
                })
            );

            expect(result.current.needsRecovery).toBe(false);
            expect(result.current.daysSinceLastSync).toBe(29);
        });

        it('returns needsRecovery: false when 1 day ago', () => {
            const now = new Date('2024-02-01T12:00:00Z');
            const oneDayMs = 1 * 24 * 60 * 60 * 1000;
            const lastSync = new Date(now.getTime() - oneDayMs);

            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({
                    lastSyncTime: lastSync,
                    currentTime: now,
                })
            );

            expect(result.current.needsRecovery).toBe(false);
            expect(result.current.daysSinceLastSync).toBe(1);
        });

        it('returns needsRecovery: false when just now (0 days)', () => {
            const now = new Date('2024-02-01T12:00:00Z');
            const lastSync = new Date(now.getTime() - 1000); // 1 second ago

            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({
                    lastSyncTime: lastSync,
                    currentTime: now,
                })
            );

            expect(result.current.needsRecovery).toBe(false);
            expect(result.current.daysSinceLastSync).toBe(0);
        });
    });

    // =========================================================================
    // Days calculation
    // =========================================================================
    describe('days calculation', () => {
        it('rounds down fractional days (10 days 23 hours = 10 days)', () => {
            const now = new Date('2024-02-01T12:00:00Z');
            // 10 days + 23 hours
            const tenDays23HoursMs = (10 * 24 + 23) * 60 * 60 * 1000;
            const lastSync = new Date(now.getTime() - tenDays23HoursMs);

            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({
                    lastSyncTime: lastSync,
                    currentTime: now,
                })
            );

            expect(result.current.daysSinceLastSync).toBe(10);
        });

        it('handles very long periods (100 days)', () => {
            const now = new Date('2024-02-01T12:00:00Z');
            const hundredDaysMs = 100 * 24 * 60 * 60 * 1000;
            const lastSync = new Date(now.getTime() - hundredDaysMs);

            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({
                    lastSyncTime: lastSync,
                    currentTime: now,
                })
            );

            expect(result.current.needsRecovery).toBe(true);
            expect(result.current.daysSinceLastSync).toBe(100);
        });
    });

    // =========================================================================
    // Memoization
    // =========================================================================
    describe('memoization', () => {
        it('returns same reference when inputs unchanged', () => {
            const now = new Date('2024-02-01T12:00:00Z');
            const lastSync = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

            const { result, rerender } = renderHook(() =>
                useOfflineRecoveryDetection({
                    lastSyncTime: lastSync,
                    currentTime: now,
                })
            );

            const firstResult = result.current;

            // Rerender with same props
            rerender();

            const secondResult = result.current;

            // Should be the exact same object reference (memoized)
            expect(firstResult).toBe(secondResult);
        });

        it('returns new reference when lastSyncTime changes', () => {
            const now = new Date('2024-02-01T12:00:00Z');
            const lastSync1 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
            const lastSync2 = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

            let lastSyncTime = lastSync1;

            const { result, rerender } = renderHook(() =>
                useOfflineRecoveryDetection({
                    lastSyncTime,
                    currentTime: now,
                })
            );

            const firstResult = result.current;
            expect(firstResult.daysSinceLastSync).toBe(5);

            // Change lastSyncTime
            lastSyncTime = lastSync2;
            rerender();

            const secondResult = result.current;
            expect(secondResult.daysSinceLastSync).toBe(10);

            // Should be different objects
            expect(firstResult).not.toBe(secondResult);
        });
    });

    // =========================================================================
    // Default currentTime (uses Date.now())
    // =========================================================================
    describe('default currentTime', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('uses current time when currentTime not provided', () => {
            const fakeNow = new Date('2024-02-01T12:00:00Z');
            vi.setSystemTime(fakeNow);

            // 5 days before fakeNow
            const lastSync = new Date(fakeNow.getTime() - 5 * 24 * 60 * 60 * 1000);

            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({ lastSyncTime: lastSync })
            );

            expect(result.current.daysSinceLastSync).toBe(5);
            expect(result.current.needsRecovery).toBe(false);
        });
    });

    // =========================================================================
    // Type safety
    // =========================================================================
    describe('type safety', () => {
        it('accepts Date object for lastSyncTime', () => {
            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({
                    lastSyncTime: new Date(),
                })
            );

            expect(result.current.needsRecovery).toBe(false);
        });

        it('returns correct types', () => {
            const { result } = renderHook(() =>
                useOfflineRecoveryDetection({
                    lastSyncTime: new Date(),
                })
            );

            // Type assertions
            expect(typeof result.current.needsRecovery).toBe('boolean');
            expect(
                result.current.daysSinceLastSync === null ||
                typeof result.current.daysSinceLastSync === 'number'
            ).toBe(true);
        });
    });
});
