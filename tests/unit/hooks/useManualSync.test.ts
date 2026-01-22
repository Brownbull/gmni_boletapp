/**
 * useManualSync Hook Unit Tests - STUB
 *
 * Story 14c-refactor.12: Transaction Service Simplification
 *
 * Tests for the stubbed useManualSync hook.
 * The shared groups feature is stubbed pending Epic 14d redesign.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useManualSync, SYNC_COOLDOWN_MS, SYNC_COOLDOWN_KEY_PREFIX } from '../../../src/hooks/useManualSync';

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: vi.fn(() => ({
        invalidateQueries: vi.fn(),
    })),
}));

describe('useManualSync (STUB)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('constants', () => {
        it('exports SYNC_COOLDOWN_MS for backwards compatibility', () => {
            expect(SYNC_COOLDOWN_MS).toBe(60 * 1000);
        });

        it('exports SYNC_COOLDOWN_KEY_PREFIX for backwards compatibility', () => {
            expect(SYNC_COOLDOWN_KEY_PREFIX).toBe('boletapp_group_sync_');
        });
    });

    describe('stub behavior', () => {
        it('returns canSync as false (feature unavailable)', () => {
            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
            );

            expect(result.current.canSync).toBe(false);
        });

        it('returns isSyncing as false', () => {
            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
            );

            expect(result.current.isSyncing).toBe(false);
        });

        it('returns cooldownRemaining as 0', () => {
            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
            );

            expect(result.current.cooldownRemaining).toBe(0);
        });

        it('returns lastSyncTime as null', () => {
            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
            );

            expect(result.current.lastSyncTime).toBeNull();
        });

        it('triggerSync is a no-op function', async () => {
            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
            );

            // Should not throw
            await expect(result.current.triggerSync()).resolves.toBeUndefined();
        });

        it('does not call callbacks since feature is stubbed', async () => {
            const onSyncComplete = vi.fn();
            const onSyncError = vi.fn();

            const { result } = renderHook(
                () => useManualSync({
                    groupId: 'group-123',
                    onSyncComplete,
                    onSyncError,
                }),
            );

            await result.current.triggerSync();

            // Callbacks not called since feature is stubbed
            expect(onSyncComplete).not.toHaveBeenCalled();
            expect(onSyncError).not.toHaveBeenCalled();
        });
    });

    describe('type safety', () => {
        it('accepts all expected options', () => {
            const { result } = renderHook(
                () => useManualSync({
                    groupId: 'group-123',
                    cooldownMs: 30000,
                    onSyncComplete: () => {},
                    onSyncError: () => {},
                }),
            );

            // Should compile and return stub result
            expect(result.current).toBeDefined();
            expect(result.current.canSync).toBe(false);
        });

        it('returns all expected properties', () => {
            const { result } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
            );

            expect(result.current).toHaveProperty('triggerSync');
            expect(result.current).toHaveProperty('isSyncing');
            expect(result.current).toHaveProperty('canSync');
            expect(result.current).toHaveProperty('cooldownRemaining');
            expect(result.current).toHaveProperty('lastSyncTime');
        });
    });

    describe('stable references', () => {
        it('returns stable reference for triggerSync', () => {
            const { result, rerender } = renderHook(
                () => useManualSync({ groupId: 'group-123' }),
            );

            const firstTriggerSync = result.current.triggerSync;
            rerender();
            const secondTriggerSync = result.current.triggerSync;

            expect(firstTriggerSync).toBe(secondTriggerSync);
        });
    });
});
