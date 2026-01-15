/**
 * usePendingInvitations Hook Tests
 *
 * Story 14c.2: Accept/Decline Invitation
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the pending invitations subscription hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePendingInvitations, subscribeToPendingInvitations } from '../../../src/hooks/usePendingInvitations';
import type { PendingInvitation } from '../../../src/types/sharedGroup';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn(),
}));

// Mock the useFirestoreSubscription hook
vi.mock('../../../src/hooks/useFirestoreSubscription', () => ({
    useFirestoreSubscription: vi.fn(),
}));

import { useFirestoreSubscription } from '../../../src/hooks/useFirestoreSubscription';

const mockUseFirestoreSubscription = vi.mocked(useFirestoreSubscription);

// Mock invitation data
const mockInvitation: PendingInvitation = {
    id: 'invite-123',
    groupId: 'group-456',
    groupName: '🏠 Gastos del Hogar',
    groupColor: '#10b981',
    groupIcon: '🏠',
    invitedEmail: 'test@example.com',
    invitedByUserId: 'user-1',
    invitedByName: 'John Doe',
    createdAt: { toDate: () => new Date() } as any,
    expiresAt: { toDate: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } as any, // 7 days from now
    status: 'pending',
};

const expiredInvitation: PendingInvitation = {
    ...mockInvitation,
    id: 'invite-expired',
    expiresAt: { toDate: () => new Date(Date.now() - 1000) } as any, // Already expired
};

describe('usePendingInvitations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when user email is not provided', () => {
        it('should return empty array when userEmail is null', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            } as any);

            const { result } = renderHook(() => usePendingInvitations(null));

            expect(result.current.pendingInvitations).toEqual([]);
            expect(result.current.pendingCount).toBe(0);
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should not enable subscription when userEmail is null', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            } as any);

            renderHook(() => usePendingInvitations(null));

            expect(mockUseFirestoreSubscription).toHaveBeenCalledWith(
                expect.arrayContaining(['pendingInvitations', '']),
                expect.any(Function),
                { enabled: false }
            );
        });
    });

    describe('when user email is provided', () => {
        it('should return pending invitations from subscription', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: [mockInvitation],
                isLoading: false,
                error: null,
            } as any);

            const { result } = renderHook(() => usePendingInvitations('test@example.com'));

            expect(result.current.pendingInvitations).toHaveLength(1);
            expect(result.current.pendingInvitations[0].groupName).toBe('🏠 Gastos del Hogar');
            expect(result.current.loading).toBe(false);
        });

        it('should enable subscription when userEmail is provided', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            } as any);

            renderHook(() => usePendingInvitations('test@example.com'));

            expect(mockUseFirestoreSubscription).toHaveBeenCalledWith(
                expect.arrayContaining(['pendingInvitations', 'test@example.com']),
                expect.any(Function),
                { enabled: true }
            );
        });

        it('should lowercase email in query key', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
            } as any);

            renderHook(() => usePendingInvitations('Test@Example.COM'));

            expect(mockUseFirestoreSubscription).toHaveBeenCalledWith(
                ['pendingInvitations', 'test@example.com'],
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

            const { result } = renderHook(() => usePendingInvitations('test@example.com'));

            expect(result.current.loading).toBe(true);
            expect(result.current.pendingInvitations).toEqual([]);
        });
    });

    describe('pendingCount calculation', () => {
        it('should count non-expired pending invitations', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: [mockInvitation],
                isLoading: false,
                error: null,
            } as any);

            const { result } = renderHook(() => usePendingInvitations('test@example.com'));

            expect(result.current.pendingCount).toBe(1);
        });

        it('should not count expired invitations in pendingCount', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: [expiredInvitation],
                isLoading: false,
                error: null,
            } as any);

            const { result } = renderHook(() => usePendingInvitations('test@example.com'));

            expect(result.current.pendingCount).toBe(0);
        });

        it('should count only non-expired invitations when mixed', () => {
            mockUseFirestoreSubscription.mockReturnValue({
                data: [mockInvitation, expiredInvitation],
                isLoading: false,
                error: null,
            } as any);

            const { result } = renderHook(() => usePendingInvitations('test@example.com'));

            expect(result.current.pendingCount).toBe(1);
            expect(result.current.pendingInvitations).toHaveLength(2);
        });
    });

    describe('query key generation', () => {
        it('should generate unique query keys for different emails', () => {
            const calls: any[] = [];
            mockUseFirestoreSubscription.mockImplementation((queryKey) => {
                calls.push(queryKey);
                return { data: [], isLoading: false, error: null } as any;
            });

            const { rerender } = renderHook(
                ({ email }) => usePendingInvitations(email),
                { initialProps: { email: 'user1@example.com' } }
            );

            rerender({ email: 'user2@example.com' });

            expect(calls[0]).toEqual(['pendingInvitations', 'user1@example.com']);
            expect(calls[1]).toEqual(['pendingInvitations', 'user2@example.com']);
        });
    });
});

describe('subscribeToPendingInvitations', () => {
    // Note: This tests the function signature and basic behavior
    // Full Firestore integration is tested in integration tests

    it('should be a function', () => {
        expect(typeof subscribeToPendingInvitations).toBe('function');
    });
});
