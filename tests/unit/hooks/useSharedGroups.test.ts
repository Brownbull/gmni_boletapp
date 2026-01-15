/**
 * useSharedGroups Hook Tests
 *
 * Story 14c.1: Create Shared Group
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the shared groups subscription hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSharedGroups } from '../../../src/hooks/useSharedGroups';
import type { SharedGroup } from '../../../src/types/sharedGroup';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
}));

// Mock the service
vi.mock('../../../src/services/sharedGroupService', () => ({
    subscribeToSharedGroups: vi.fn(),
}));

// Mock the useFirestoreSubscription hook
vi.mock('../../../src/hooks/useFirestoreSubscription', () => ({
    useFirestoreSubscription: vi.fn(),
}));

import { useFirestoreSubscription } from '../../../src/hooks/useFirestoreSubscription';
import { subscribeToSharedGroups } from '../../../src/services/sharedGroupService';

const mockUseFirestoreSubscription = vi.mocked(useFirestoreSubscription);
const mockSubscribeToSharedGroups = vi.mocked(subscribeToSharedGroups);

// Mock shared group data
const mockSharedGroup: SharedGroup = {
    id: 'group-123',
    ownerId: 'user-1',
    appId: 'boletapp',
    name: '🏠 Gastos del Hogar',
    color: '#10b981',
    icon: '🏠',
    shareCode: 'Ab3dEf7hIj9kLm0p',
    shareCodeExpiresAt: { toDate: () => new Date('2026-01-22') } as any,
    members: ['user-1'],
    memberUpdates: {},
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
};

describe('useSharedGroups', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when user is not authenticated', () => {
        it('should return empty array when userId is null', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            } as any);

            const { result } = renderHook(() => useSharedGroups(null));

            expect(result.current.sharedGroups).toEqual([]);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should not enable subscription when userId is null', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            } as any);

            renderHook(() => useSharedGroups(null));

            expect(mockUseFirestoreSubscription).toHaveBeenCalledWith(
                expect.arrayContaining(['sharedGroups', '']),
                expect.any(Function),
                { enabled: false }
            );
        });
    });

    describe('when user is authenticated', () => {
        it('should return shared groups from subscription', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: [mockSharedGroup],
                isLoading: false,
                error: null,
            } as any);

            const { result } = renderHook(() => useSharedGroups('user-1'));

            expect(result.current.sharedGroups).toHaveLength(1);
            expect(result.current.sharedGroups[0].name).toBe('🏠 Gastos del Hogar');
            expect(result.current.loading).toBe(false);
        });

        it('should enable subscription when userId is provided', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            } as any);

            renderHook(() => useSharedGroups('user-1'));

            expect(mockUseFirestoreSubscription).toHaveBeenCalledWith(
                expect.arrayContaining(['sharedGroups', 'user-1']),
                expect.any(Function),
                { enabled: true }
            );
        });

        it('should return loading state from subscription', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
            } as any);

            const { result } = renderHook(() => useSharedGroups('user-1'));

            expect(result.current.loading).toBe(true);
            expect(result.current.sharedGroups).toEqual([]);
        });

        it('should return multiple shared groups', () => {
            const secondGroup: SharedGroup = {
                ...mockSharedGroup,
                id: 'group-456',
                name: '💼 Work Expenses',
            };

            mockUseFirestoreSubscription.mockReturnValue({
                data: [mockSharedGroup, secondGroup],
                isLoading: false,
                error: null,
            } as any);

            const { result } = renderHook(() => useSharedGroups('user-1'));

            expect(result.current.sharedGroups).toHaveLength(2);
        });
    });

    describe('query key generation', () => {
        it('should generate unique query keys for different users', () => {
            const calls: any[] = [];
            mockUseFirestoreSubscription.mockImplementation((queryKey) => {
                calls.push(queryKey);
                return { data: [], isLoading: false, error: null } as any;
            });

            const { rerender } = renderHook(
                ({ userId }) => useSharedGroups(userId),
                { initialProps: { userId: 'user-1' } }
            );

            rerender({ userId: 'user-2' });

            expect(calls[0]).toEqual(['sharedGroups', 'user-1']);
            expect(calls[1]).toEqual(['sharedGroups', 'user-2']);
        });
    });

    describe('subscription callback', () => {
        it('should pass subscribe function that calls sharedGroupService', () => {
            let capturedSubscribeFn: any;
            mockUseFirestoreSubscription.mockImplementation((_, subscribeFn) => {
                capturedSubscribeFn = subscribeFn;
                return { data: [], isLoading: false, error: null } as any;
            });

            renderHook(() => useSharedGroups('user-1'));

            // Call the captured subscribe function
            const mockCallback = vi.fn();
            const unsubscribe = vi.fn();
            mockSubscribeToSharedGroups.mockReturnValue(unsubscribe);

            capturedSubscribeFn(mockCallback);

            expect(mockSubscribeToSharedGroups).toHaveBeenCalledWith(
                expect.anything(), // db
                'user-1',
                mockCallback,
                expect.any(Function) // error handler
            );
        });
    });
});
