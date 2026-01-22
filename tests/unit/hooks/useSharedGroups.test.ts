/**
 * useSharedGroups Hook Tests - STUB
 *
 * Story 14c-refactor.17: Test Suite Cleanup
 * Epic 14c-refactor: Codebase cleanup before Shared Groups v2
 *
 * Tests for the stubbed useSharedGroups hook that returns empty state.
 * This hook is used by useAllUserGroups to get shared group data.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSharedGroups } from '../../../src/hooks/useSharedGroups';

describe('useSharedGroups (STUB)', () => {
    describe('stubbed behavior', () => {
        it('should return empty sharedGroups array', () => {
            const { result } = renderHook(() => useSharedGroups('user-123'));

            expect(result.current.sharedGroups).toEqual([]);
        });

        it('should return loading = false', () => {
            const { result } = renderHook(() => useSharedGroups('user-123'));

            expect(result.current.loading).toBe(false);
        });

        it('should return error = null', () => {
            const { result } = renderHook(() => useSharedGroups('user-123'));

            expect(result.current.error).toBeNull();
        });

        it('should handle null userId', () => {
            const { result } = renderHook(() => useSharedGroups(null));

            expect(result.current.sharedGroups).toEqual([]);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should return stable reference across rerenders', () => {
            const { result, rerender } = renderHook(() => useSharedGroups('user-123'));

            const firstResult = result.current;
            rerender();
            const secondResult = result.current;

            // useMemo should return same reference
            expect(firstResult).toBe(secondResult);
        });

        it('should return stable empty array reference', () => {
            const { result, rerender } = renderHook(() => useSharedGroups('user-123'));

            const firstGroups = result.current.sharedGroups;
            rerender();
            const secondGroups = result.current.sharedGroups;

            // Module-level constant ensures stable reference
            expect(firstGroups).toBe(secondGroups);
        });
    });
});
