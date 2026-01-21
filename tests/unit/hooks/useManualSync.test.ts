/**
 * useManualSync Hook Unit Tests
 *
 * Story 14c.20: Shared Group Cache Optimization
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for manual sync functionality with cooldown:
 * - Triggering sync invalidates React Query cache
 * - 60-second cooldown between syncs
 * - Last sync time tracking in localStorage
 * - Cooldown countdown
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock localStorage
let mockStorage: Record<string, string>;
let mockLocalStorage: Storage;

beforeEach(() => {
    mockStorage = {};
    mockLocalStorage = {
        getItem: vi.fn((key) => mockStorage[key] || null),
        setItem: vi.fn((key, value) => {
            mockStorage[key] = value;
        }),
        removeItem: vi.fn((key) => {
            delete mockStorage[key];
        }),
        clear: vi.fn(() => {
            mockStorage = {};
        }),
        length: 0,
        key: vi.fn(() => null),
    };
    vi.stubGlobal('localStorage', mockLocalStorage);
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

// Import hook after mocks are set up
import { useManualSync, SYNC_COOLDOWN_MS, SYNC_COOLDOWN_KEY_PREFIX } from '../../../src/hooks/useManualSync';

// ============================================================================
// Test Setup
// ============================================================================

function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
        },
    });
}

function createWrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

// ============================================================================
// Tests: useManualSync
// ============================================================================

describe('useManualSync', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = createTestQueryClient();
        vi.clearAllMocks();
    });

    afterEach(() => {
        queryClient.clear();
    });

    describe('Initialization', () => {
        it('should return initial state with canSync true when no previous sync', () => {
            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
                { wrapper: createWrapper(queryClient) }
            );

            expect(result.current.isSyncing).toBe(false);
            expect(result.current.canSync).toBe(true);
            expect(result.current.cooldownRemaining).toBe(0);
            expect(result.current.lastSyncTime).toBeNull();
        });

        it('should load lastSyncTime from localStorage', () => {
            const pastSync = Date.now() - 120000; // 2 minutes ago
            mockStorage[`${SYNC_COOLDOWN_KEY_PREFIX}group-123`] = pastSync.toString();

            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
                { wrapper: createWrapper(queryClient) }
            );

            expect(result.current.lastSyncTime).toBeInstanceOf(Date);
            expect(result.current.canSync).toBe(true); // Cooldown expired
        });

        it('should return canSync false when within cooldown period', () => {
            const recentSync = Date.now() - 30000; // 30 seconds ago
            mockStorage[`${SYNC_COOLDOWN_KEY_PREFIX}group-123`] = recentSync.toString();

            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
                { wrapper: createWrapper(queryClient) }
            );

            expect(result.current.canSync).toBe(false);
            expect(result.current.cooldownRemaining).toBeGreaterThan(0);
            expect(result.current.cooldownRemaining).toBeLessThanOrEqual(30);
        });
    });

    describe('Trigger Sync', () => {
        it('should set isSyncing true while syncing', async () => {
            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
                { wrapper: createWrapper(queryClient) }
            );

            // Start sync
            let syncPromise: Promise<void>;
            act(() => {
                syncPromise = result.current.triggerSync();
            });

            // Should be syncing
            expect(result.current.isSyncing).toBe(true);

            // Wait for sync to complete
            await act(async () => {
                await syncPromise;
            });

            expect(result.current.isSyncing).toBe(false);
        });

        it('should update lastSyncTime after successful sync', async () => {
            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
                { wrapper: createWrapper(queryClient) }
            );

            expect(result.current.lastSyncTime).toBeNull();

            await act(async () => {
                await result.current.triggerSync();
            });

            expect(result.current.lastSyncTime).toBeInstanceOf(Date);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        it('should prevent sync when canSync is false', async () => {
            // Set recent sync to trigger cooldown
            const recentSync = Date.now() - 10000; // 10 seconds ago
            mockStorage[`${SYNC_COOLDOWN_KEY_PREFIX}group-123`] = recentSync.toString();

            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
                { wrapper: createWrapper(queryClient) }
            );

            expect(result.current.canSync).toBe(false);

            // Try to sync anyway
            await act(async () => {
                await result.current.triggerSync();
            });

            // Should not have updated lastSyncTime (sync was blocked)
            expect(result.current.lastSyncTime?.getTime()).toBe(recentSync);
        });

        it('should invalidate React Query cache on sync', async () => {
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
                { wrapper: createWrapper(queryClient) }
            );

            await act(async () => {
                await result.current.triggerSync();
            });

            // Story 14c.20: Now includes refetchType: 'all' to force refetch inactive queries
            expect(invalidateSpy).toHaveBeenCalledWith({
                queryKey: ['sharedGroupTransactions', 'group-123'],
                refetchType: 'all',
            });
        });
    });

    describe('Cooldown Timer', () => {
        it('should countdown cooldownRemaining over time', async () => {
            vi.useFakeTimers();

            // Set sync that just happened (within cooldown)
            const justNow = Date.now();
            mockStorage[`${SYNC_COOLDOWN_KEY_PREFIX}group-123`] = justNow.toString();

            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
                { wrapper: createWrapper(queryClient) }
            );

            // Should be in cooldown
            expect(result.current.canSync).toBe(false);
            expect(result.current.cooldownRemaining).toBe(60);

            // Advance time by 30 seconds
            await act(async () => {
                vi.advanceTimersByTime(30000);
            });

            expect(result.current.cooldownRemaining).toBe(30);

            // Advance remaining 30 seconds
            await act(async () => {
                vi.advanceTimersByTime(30000);
            });

            expect(result.current.cooldownRemaining).toBe(0);
            expect(result.current.canSync).toBe(true);

            vi.useRealTimers();
        });
    });

    describe('Per-Group Cooldown', () => {
        it('should track cooldown separately for different groups', () => {
            const recentSync = Date.now() - 30000; // 30 seconds ago
            mockStorage[`${SYNC_COOLDOWN_KEY_PREFIX}group-A`] = recentSync.toString();
            // group-B has no recent sync

            const { result: resultA } = renderHook(
                () => useManualSync({ groupId: 'group-A' }),
                { wrapper: createWrapper(queryClient) }
            );

            const { result: resultB } = renderHook(
                () => useManualSync({ groupId: 'group-B' }),
                { wrapper: createWrapper(queryClient) }
            );

            // Group A is in cooldown
            expect(resultA.current.canSync).toBe(false);

            // Group B is not in cooldown
            expect(resultB.current.canSync).toBe(true);
        });
    });

    describe('Sync Callback', () => {
        it('should call onSyncComplete callback when sync succeeds', async () => {
            const onSyncComplete = vi.fn();

            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123', onSyncComplete }),
                { wrapper: createWrapper(queryClient) }
            );

            await act(async () => {
                await result.current.triggerSync();
            });

            expect(onSyncComplete).toHaveBeenCalledTimes(1);
        });

        it('should call onSyncError callback when sync fails', async () => {
            const onSyncError = vi.fn();

            // Make invalidateQueries throw an error
            vi.spyOn(queryClient, 'invalidateQueries').mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123', onSyncError }),
                { wrapper: createWrapper(queryClient) }
            );

            await act(async () => {
                await result.current.triggerSync();
            });

            expect(onSyncError).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('Constants', () => {
        it('should have 60 second cooldown', () => {
            expect(SYNC_COOLDOWN_MS).toBe(60000);
        });
    });
});
