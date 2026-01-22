/**
 * Unit tests for useDeepLinking hook
 *
 * Story 14c-refactor.10: App Decomposition - Extract app-level hooks
 *
 * Tests the deep linking coordination hook:
 * - Wrapping useJoinLinkHandler
 * - State derivation (isJoining, isPendingAuth)
 * - Simplified interface for App.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDeepLinking } from '../../../../src/hooks/app/useDeepLinking';

// Mock useJoinLinkHandler
const mockJoinLinkHandler = {
    state: 'idle' as const,
    shareCode: null as string | null,
    groupPreview: null,
    error: null,
    joinedGroupId: null,
    confirmJoin: vi.fn(),
    cancelJoin: vi.fn(),
    dismissError: vi.fn(),
};

vi.mock('../../../../src/hooks/useJoinLinkHandler', () => ({
    useJoinLinkHandler: vi.fn(() => mockJoinLinkHandler),
}));

describe('useDeepLinking', () => {
    const defaultOptions = {
        db: {} as any,
        userId: 'user-123',
        isAuthenticated: true,
        userProfile: { displayName: 'Test User' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock state
        mockJoinLinkHandler.state = 'idle';
        mockJoinLinkHandler.shareCode = null;
        mockJoinLinkHandler.groupPreview = null;
        mockJoinLinkHandler.error = null;
        mockJoinLinkHandler.joinedGroupId = null;
    });

    describe('initial state', () => {
        it('should return idle state when no deep link', () => {
            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.hasActiveDeepLink).toBe(false);
            expect(result.current.hasActiveJoinLink).toBe(false);
            expect(result.current.joinLinkState).toBe('idle');
            expect(result.current.isJoining).toBe(false);
            expect(result.current.isPendingAuth).toBe(false);
        });

        it('should pass through shareCode from underlying hook', () => {
            mockJoinLinkHandler.shareCode = 'ABC123';
            mockJoinLinkHandler.state = 'loading';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.shareCode).toBe('ABC123');
        });
    });

    describe('hasActiveJoinLink derivation', () => {
        it('should be true when state is loading', () => {
            mockJoinLinkHandler.state = 'loading';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.hasActiveJoinLink).toBe(true);
            expect(result.current.hasActiveDeepLink).toBe(true);
        });

        it('should be true when state is confirming', () => {
            mockJoinLinkHandler.state = 'confirming';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.hasActiveJoinLink).toBe(true);
        });

        it('should be true when state is joining', () => {
            mockJoinLinkHandler.state = 'joining';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.hasActiveJoinLink).toBe(true);
        });

        it('should be true when state is pending_auth', () => {
            mockJoinLinkHandler.state = 'pending_auth';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.hasActiveJoinLink).toBe(true);
        });

        it('should be true when state is error', () => {
            mockJoinLinkHandler.state = 'error';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.hasActiveJoinLink).toBe(true);
        });

        it('should be false when state is idle', () => {
            mockJoinLinkHandler.state = 'idle';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.hasActiveJoinLink).toBe(false);
        });

        it('should be false when state is success', () => {
            mockJoinLinkHandler.state = 'success';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.hasActiveJoinLink).toBe(false);
        });
    });

    describe('isJoining derivation', () => {
        it('should be true when state is loading', () => {
            mockJoinLinkHandler.state = 'loading';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.isJoining).toBe(true);
        });

        it('should be true when state is joining', () => {
            mockJoinLinkHandler.state = 'joining';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.isJoining).toBe(true);
        });

        it('should be false for other states', () => {
            mockJoinLinkHandler.state = 'confirming';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.isJoining).toBe(false);
        });
    });

    describe('isPendingAuth derivation', () => {
        it('should be true when state is pending_auth', () => {
            mockJoinLinkHandler.state = 'pending_auth';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.isPendingAuth).toBe(true);
        });

        it('should be false for other states', () => {
            mockJoinLinkHandler.state = 'confirming';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.isPendingAuth).toBe(false);
        });
    });

    describe('pass-through values', () => {
        it('should pass through groupPreview', () => {
            const mockPreview = { groupId: 'g1', name: 'Test Group', memberCount: 2 };
            mockJoinLinkHandler.groupPreview = mockPreview as any;

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.groupPreview).toBe(mockPreview);
        });

        it('should pass through joinError', () => {
            mockJoinLinkHandler.error = 'CODE_NOT_FOUND';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.joinError).toBe('CODE_NOT_FOUND');
        });

        it('should pass through joinedGroupId', () => {
            mockJoinLinkHandler.joinedGroupId = 'joined-group-123';

            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.joinedGroupId).toBe('joined-group-123');
        });
    });

    describe('action handlers', () => {
        it('should pass through confirmJoin', () => {
            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.confirmJoin).toBe(mockJoinLinkHandler.confirmJoin);
        });

        it('should pass through cancelJoin', () => {
            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.cancelJoin).toBe(mockJoinLinkHandler.cancelJoin);
        });

        it('should pass through dismissJoinError', () => {
            const { result } = renderHook(() => useDeepLinking(defaultOptions));

            expect(result.current.dismissJoinError).toBe(mockJoinLinkHandler.dismissError);
        });
    });

    describe('null db handling', () => {
        it('should handle null db gracefully', () => {
            const optionsWithNullDb = {
                ...defaultOptions,
                db: null,
            };

            // Should not throw
            const { result } = renderHook(() => useDeepLinking(optionsWithNullDb));

            expect(result.current.joinLinkState).toBe('idle');
        });
    });

    describe('unauthenticated user', () => {
        it('should work with unauthenticated user', () => {
            const unauthOptions = {
                db: {} as any,
                userId: null,
                isAuthenticated: false,
                userProfile: null,
            };

            const { result } = renderHook(() => useDeepLinking(unauthOptions));

            expect(result.current.joinLinkState).toBe('idle');
        });
    });
});
