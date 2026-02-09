/**
 * Tests for usePendingInvitationsCount Hook
 *
 * Story 14d-v2-1-6c-1: Pending Invitations Badge & List UI
 * Task 6.4: Add unit tests for badge logic
 *
 * Tests the hook that provides pending invitation count for badge display.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';

// Mock the invitationService
vi.mock('@/services/invitationService', () => ({
    getPendingInvitationsForUser: vi.fn(),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
}));

// Import after mocks
import { usePendingInvitationsCount } from '@/hooks/usePendingInvitationsCount';
import { getPendingInvitationsForUser } from '@/services/invitationService';
import { createMockInvitation } from '@helpers/sharedGroupFactory';

// =============================================================================
// Test Helpers
// =============================================================================

function createQueryClient(): QueryClient {
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
    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
}

function createMockUser(overrides: Partial<User> = {}): User {
    return {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {} as User['metadata'],
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: vi.fn(),
        getIdToken: vi.fn(),
        getIdTokenResult: vi.fn(),
        reload: vi.fn(),
        toJSON: vi.fn(),
        phoneNumber: null,
        providerId: 'firebase',
        ...overrides,
    } as User;
}

// =============================================================================
// Tests
// =============================================================================

describe('usePendingInvitationsCount', () => {
    let queryClient: QueryClient;
    const mockGetPendingInvitations = vi.mocked(getPendingInvitationsForUser);

    beforeEach(() => {
        queryClient = createQueryClient();
        vi.clearAllMocks();
    });

    afterEach(() => {
        queryClient.clear();
    });

    // =========================================================================
    // Null User Tests
    // =========================================================================

    describe('when user is null', () => {
        it('should return zero count when user is null', () => {
            const { result } = renderHook(
                () => usePendingInvitationsCount(null),
                { wrapper: createWrapper(queryClient) }
            );

            expect(result.current.count).toBe(0);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should not call service when user is null', () => {
            renderHook(
                () => usePendingInvitationsCount(null),
                { wrapper: createWrapper(queryClient) }
            );

            expect(mockGetPendingInvitations).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // User Without Email Tests
    // =========================================================================

    describe('when user has no email', () => {
        it('should return zero count when user email is null', () => {
            const userWithoutEmail = createMockUser({ email: null });

            const { result } = renderHook(
                () => usePendingInvitationsCount(userWithoutEmail),
                { wrapper: createWrapper(queryClient) }
            );

            expect(result.current.count).toBe(0);
            expect(result.current.isLoading).toBe(false);
        });

        it('should not call service when user email is null', () => {
            const userWithoutEmail = createMockUser({ email: null });

            renderHook(
                () => usePendingInvitationsCount(userWithoutEmail),
                { wrapper: createWrapper(queryClient) }
            );

            expect(mockGetPendingInvitations).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Success Cases
    // =========================================================================

    describe('when fetching invitations successfully', () => {
        it('should return correct count for pending invitations', async () => {
            const mockInvitations = [
                createMockInvitation({ id: 'inv-1' }),
                createMockInvitation({ id: 'inv-2' }),
                createMockInvitation({ id: 'inv-3' }),
            ];
            mockGetPendingInvitations.mockResolvedValue(mockInvitations);

            const user = createMockUser();
            const { result } = renderHook(
                () => usePendingInvitationsCount(user),
                { wrapper: createWrapper(queryClient) }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.count).toBe(3);
            expect(result.current.invitations).toHaveLength(3);
            expect(result.current.error).toBeNull();
        });

        it('should return zero count when no invitations', async () => {
            mockGetPendingInvitations.mockResolvedValue([]);

            const user = createMockUser();
            const { result } = renderHook(
                () => usePendingInvitationsCount(user),
                { wrapper: createWrapper(queryClient) }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.count).toBe(0);
            expect(result.current.invitations).toHaveLength(0);
        });

        it('should call service with user email', async () => {
            mockGetPendingInvitations.mockResolvedValue([]);

            const user = createMockUser({ email: 'specific@example.com' });
            const { result } = renderHook(
                () => usePendingInvitationsCount(user),
                { wrapper: createWrapper(queryClient) }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(mockGetPendingInvitations).toHaveBeenCalledWith(
                expect.anything(), // db instance
                'specific@example.com'
            );
        });
    });

    // =========================================================================
    // Loading State Tests
    // =========================================================================

    describe('loading state', () => {
        it('should show loading state initially', () => {
            // Delay the mock response
            mockGetPendingInvitations.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
            );

            const user = createMockUser();
            const { result } = renderHook(
                () => usePendingInvitationsCount(user),
                { wrapper: createWrapper(queryClient) }
            );

            expect(result.current.isLoading).toBe(true);
            expect(result.current.count).toBe(0);
        });
    });

    // =========================================================================
    // Error Handling Tests
    // =========================================================================

    describe('error handling', () => {
        it('should return error when service fails', async () => {
            const testError = new Error('Network error');
            mockGetPendingInvitations.mockRejectedValue(testError);

            const user = createMockUser();
            const { result } = renderHook(
                () => usePendingInvitationsCount(user),
                { wrapper: createWrapper(queryClient) }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBeTruthy();
            expect(result.current.count).toBe(0);
        });

        it('should return zero count on error', async () => {
            mockGetPendingInvitations.mockRejectedValue(new Error('Failed'));

            const user = createMockUser();
            const { result } = renderHook(
                () => usePendingInvitationsCount(user),
                { wrapper: createWrapper(queryClient) }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.count).toBe(0);
        });
    });

    // =========================================================================
    // Filtering Tests (AC #2: sorted by date, newest first)
    // =========================================================================

    describe('invitation filtering and sorting', () => {
        it('should return invitations in order (service handles sorting)', async () => {
            // Service returns already sorted (newest first)
            const mockInvitations = [
                createMockInvitation({ id: 'newest', groupName: 'Newest Group' }),
                createMockInvitation({ id: 'middle', groupName: 'Middle Group' }),
                createMockInvitation({ id: 'oldest', groupName: 'Oldest Group' }),
            ];
            mockGetPendingInvitations.mockResolvedValue(mockInvitations);

            const user = createMockUser();
            const { result } = renderHook(
                () => usePendingInvitationsCount(user),
                { wrapper: createWrapper(queryClient) }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.invitations[0].id).toBe('newest');
            expect(result.current.invitations[2].id).toBe('oldest');
        });
    });

    // =========================================================================
    // hasInvitations Helper
    // =========================================================================

    describe('hasInvitations helper', () => {
        it('should return true when count > 0', async () => {
            mockGetPendingInvitations.mockResolvedValue([
                createMockInvitation(),
            ]);

            const user = createMockUser();
            const { result } = renderHook(
                () => usePendingInvitationsCount(user),
                { wrapper: createWrapper(queryClient) }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.hasInvitations).toBe(true);
        });

        it('should return false when count is 0', async () => {
            mockGetPendingInvitations.mockResolvedValue([]);

            const user = createMockUser();
            const { result } = renderHook(
                () => usePendingInvitationsCount(user),
                { wrapper: createWrapper(queryClient) }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.hasInvitations).toBe(false);
        });
    });
});
