/**
 * Unit tests for useJoinLinkHandler hook
 *
 * Story 14c.17: Share Link Deep Linking
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests the join link handler hook:
 * - URL parsing on mount
 * - Authenticated user flow
 * - Unauthenticated user flow with sessionStorage
 * - Resume join flow after authentication
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useJoinLinkHandler, type JoinLinkState, type JoinError } from '../../../src/hooks/useJoinLinkHandler';
import type { SharedGroupPreview } from '../../../src/types/sharedGroup';

// Mock the deep link handler utilities
vi.mock('../../../src/utils/deepLinkHandler', () => ({
    parseShareCodeFromUrl: vi.fn(),
    getPendingJoinCode: vi.fn(),
    setPendingJoinCode: vi.fn(),
    clearPendingJoinCode: vi.fn(),
    clearJoinUrlPath: vi.fn(),
    PENDING_JOIN_CODE_KEY: 'boletapp_pending_join_code',
}));

// Mock the shared group service
vi.mock('../../../src/services/sharedGroupService', () => ({
    getSharedGroupPreview: vi.fn(),
    joinByShareCode: vi.fn(),
}));

import {
    parseShareCodeFromUrl,
    getPendingJoinCode,
    setPendingJoinCode,
    clearPendingJoinCode,
    clearJoinUrlPath,
} from '../../../src/utils/deepLinkHandler';

import {
    getSharedGroupPreview,
    joinByShareCode,
} from '../../../src/services/sharedGroupService';

// Type the mocks
const mockParseShareCodeFromUrl = vi.mocked(parseShareCodeFromUrl);
const mockGetPendingJoinCode = vi.mocked(getPendingJoinCode);
const mockSetPendingJoinCode = vi.mocked(setPendingJoinCode);
const mockClearPendingJoinCode = vi.mocked(clearPendingJoinCode);
const mockClearJoinUrlPath = vi.mocked(clearJoinUrlPath);
const mockGetSharedGroupPreview = vi.mocked(getSharedGroupPreview);
const mockJoinByShareCode = vi.mocked(joinByShareCode);

// Mock window.location
const mockPathname = vi.fn(() => '/');
Object.defineProperty(window, 'location', {
    value: {
        get pathname() {
            return mockPathname();
        },
    },
    writable: true,
});

// Sample data
const VALID_SHARE_CODE = 'Ab3dEf7hIj9kLm0p';
const MOCK_GROUP_PREVIEW: SharedGroupPreview = {
    id: 'group-123',
    name: 'Test Family',
    color: '#10b981',
    icon: '🏠',
    memberCount: 3,
    isExpired: false,
};

describe('useJoinLinkHandler', () => {
    const mockDb = {} as any;
    const mockUserId = 'user-123';
    const mockUserProfile = { displayName: 'Test User', email: 'test@example.com' };

    beforeEach(() => {
        vi.clearAllMocks();
        mockPathname.mockReturnValue('/');
        mockParseShareCodeFromUrl.mockReturnValue(null);
        mockGetPendingJoinCode.mockReturnValue(null);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('initial state', () => {
        it('should return idle state when no join URL detected', () => {
            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: mockUserId,
                    isAuthenticated: true,
                    userProfile: mockUserProfile,
                })
            );

            expect(result.current.state).toBe('idle');
            expect(result.current.shareCode).toBeNull();
            expect(result.current.groupPreview).toBeNull();
            expect(result.current.error).toBeNull();
        });

        it('should detect join URL on mount', async () => {
            mockPathname.mockReturnValue('/join/Ab3dEf7hIj9kLm0p');
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetSharedGroupPreview.mockResolvedValue(MOCK_GROUP_PREVIEW);

            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: mockUserId,
                    isAuthenticated: true,
                    userProfile: mockUserProfile,
                })
            );

            await waitFor(() => {
                expect(result.current.state).toBe('confirming');
            });

            expect(result.current.shareCode).toBe(VALID_SHARE_CODE);
            expect(result.current.groupPreview).toEqual(MOCK_GROUP_PREVIEW);
        });
    });

    describe('authenticated user flow', () => {
        it('should show group preview when authenticated user opens join link', async () => {
            mockPathname.mockReturnValue('/join/Ab3dEf7hIj9kLm0p');
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetSharedGroupPreview.mockResolvedValue(MOCK_GROUP_PREVIEW);

            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: mockUserId,
                    isAuthenticated: true,
                    userProfile: mockUserProfile,
                })
            );

            await waitFor(() => {
                expect(result.current.state).toBe('confirming');
                expect(result.current.groupPreview).toEqual(MOCK_GROUP_PREVIEW);
            });
        });

        it('should join group when confirmJoin is called', async () => {
            mockPathname.mockReturnValue('/join/Ab3dEf7hIj9kLm0p');
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetSharedGroupPreview.mockResolvedValue(MOCK_GROUP_PREVIEW);
            mockJoinByShareCode.mockResolvedValue({ groupName: 'Test Family', groupId: 'group-123' });

            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: mockUserId,
                    isAuthenticated: true,
                    userProfile: mockUserProfile,
                })
            );

            await waitFor(() => {
                expect(result.current.state).toBe('confirming');
            });

            await act(async () => {
                await result.current.confirmJoin();
            });

            expect(result.current.state).toBe('success');
            expect(result.current.joinedGroupId).toBe('group-123');
            expect(mockClearPendingJoinCode).toHaveBeenCalled();
            expect(mockClearJoinUrlPath).toHaveBeenCalled();
        });

        it('should cancel join when cancelJoin is called', async () => {
            mockPathname.mockReturnValue('/join/Ab3dEf7hIj9kLm0p');
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetSharedGroupPreview.mockResolvedValue(MOCK_GROUP_PREVIEW);

            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: mockUserId,
                    isAuthenticated: true,
                    userProfile: mockUserProfile,
                })
            );

            await waitFor(() => {
                expect(result.current.state).toBe('confirming');
            });

            act(() => {
                result.current.cancelJoin();
            });

            expect(result.current.state).toBe('idle');
            expect(mockClearPendingJoinCode).toHaveBeenCalled();
            expect(mockClearJoinUrlPath).toHaveBeenCalled();
        });
    });

    describe('unauthenticated user flow', () => {
        it('should store share code in sessionStorage when unauthenticated', async () => {
            mockPathname.mockReturnValue('/join/Ab3dEf7hIj9kLm0p');
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);

            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: null,
                    isAuthenticated: false,
                    userProfile: null,
                })
            );

            await waitFor(() => {
                expect(result.current.state).toBe('pending_auth');
            });

            expect(mockSetPendingJoinCode).toHaveBeenCalledWith(VALID_SHARE_CODE);
            expect(mockClearJoinUrlPath).toHaveBeenCalled();
        });

        it('should resume join flow after authentication', async () => {
            mockGetPendingJoinCode.mockReturnValue(VALID_SHARE_CODE);
            mockGetSharedGroupPreview.mockResolvedValue(MOCK_GROUP_PREVIEW);

            const { result, rerender } = renderHook(
                ({ isAuthenticated, userId }) =>
                    useJoinLinkHandler({
                        db: mockDb,
                        userId,
                        isAuthenticated,
                        userProfile: isAuthenticated ? mockUserProfile : null,
                    }),
                {
                    initialProps: { isAuthenticated: false, userId: null as string | null },
                }
            );

            // Initial state - pending auth (no URL but pending code)
            await waitFor(() => {
                expect(mockGetPendingJoinCode).toHaveBeenCalled();
            });

            // Simulate authentication
            rerender({ isAuthenticated: true, userId: mockUserId });

            await waitFor(() => {
                expect(result.current.state).toBe('confirming');
                expect(result.current.groupPreview).toEqual(MOCK_GROUP_PREVIEW);
            });
        });
    });

    describe('error handling', () => {
        it('should show error for invalid share code', async () => {
            mockPathname.mockReturnValue('/join/Ab3dEf7hIj9kLm0p');
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetSharedGroupPreview.mockResolvedValue(null);

            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: mockUserId,
                    isAuthenticated: true,
                    userProfile: mockUserProfile,
                })
            );

            await waitFor(() => {
                expect(result.current.state).toBe('error');
                expect(result.current.error).toBe('CODE_NOT_FOUND');
            });
        });

        it('should show error for expired share code', async () => {
            mockPathname.mockReturnValue('/join/Ab3dEf7hIj9kLm0p');
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetSharedGroupPreview.mockResolvedValue({ ...MOCK_GROUP_PREVIEW, isExpired: true });

            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: mockUserId,
                    isAuthenticated: true,
                    userProfile: mockUserProfile,
                })
            );

            await waitFor(() => {
                expect(result.current.state).toBe('error');
                expect(result.current.error).toBe('CODE_EXPIRED');
            });
        });

        it('should handle join error - group full', async () => {
            mockPathname.mockReturnValue('/join/Ab3dEf7hIj9kLm0p');
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetSharedGroupPreview.mockResolvedValue(MOCK_GROUP_PREVIEW);
            mockJoinByShareCode.mockRejectedValue(new Error('GROUP_FULL'));

            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: mockUserId,
                    isAuthenticated: true,
                    userProfile: mockUserProfile,
                })
            );

            await waitFor(() => {
                expect(result.current.state).toBe('confirming');
            });

            await act(async () => {
                await result.current.confirmJoin();
            });

            expect(result.current.state).toBe('error');
            expect(result.current.error).toBe('GROUP_FULL');
        });

        it('should handle join error - already member', async () => {
            mockPathname.mockReturnValue('/join/Ab3dEf7hIj9kLm0p');
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetSharedGroupPreview.mockResolvedValue(MOCK_GROUP_PREVIEW);
            mockJoinByShareCode.mockRejectedValue(new Error('ALREADY_MEMBER'));

            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: mockUserId,
                    isAuthenticated: true,
                    userProfile: mockUserProfile,
                })
            );

            await waitFor(() => {
                expect(result.current.state).toBe('confirming');
            });

            await act(async () => {
                await result.current.confirmJoin();
            });

            expect(result.current.state).toBe('error');
            expect(result.current.error).toBe('ALREADY_MEMBER');
        });

        it('should allow dismissing error state', async () => {
            mockPathname.mockReturnValue('/join/Ab3dEf7hIj9kLm0p');
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetSharedGroupPreview.mockResolvedValue(null);

            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: mockUserId,
                    isAuthenticated: true,
                    userProfile: mockUserProfile,
                })
            );

            await waitFor(() => {
                expect(result.current.state).toBe('error');
            });

            act(() => {
                result.current.dismissError();
            });

            expect(result.current.state).toBe('idle');
            expect(result.current.error).toBeNull();
            expect(mockClearJoinUrlPath).toHaveBeenCalled();
        });
    });

    describe('loading state', () => {
        it('should show loading while fetching group preview', async () => {
            mockPathname.mockReturnValue('/join/Ab3dEf7hIj9kLm0p');
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);

            // Delay the preview response
            mockGetSharedGroupPreview.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve(MOCK_GROUP_PREVIEW), 100))
            );

            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: mockUserId,
                    isAuthenticated: true,
                    userProfile: mockUserProfile,
                })
            );

            expect(result.current.state).toBe('loading');

            await waitFor(() => {
                expect(result.current.state).toBe('confirming');
            });
        });

        it('should show joining state while joining group', async () => {
            mockPathname.mockReturnValue('/join/Ab3dEf7hIj9kLm0p');
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetSharedGroupPreview.mockResolvedValue(MOCK_GROUP_PREVIEW);

            // Delay the join response
            mockJoinByShareCode.mockImplementation(
                () =>
                    new Promise((resolve) =>
                        setTimeout(() => resolve({ groupName: 'Test Family', groupId: 'group-123' }), 100)
                    )
            );

            const { result } = renderHook(() =>
                useJoinLinkHandler({
                    db: mockDb,
                    userId: mockUserId,
                    isAuthenticated: true,
                    userProfile: mockUserProfile,
                })
            );

            await waitFor(() => {
                expect(result.current.state).toBe('confirming');
            });

            let joinPromise: Promise<void>;
            act(() => {
                joinPromise = result.current.confirmJoin();
            });

            expect(result.current.state).toBe('joining');

            await act(async () => {
                await joinPromise;
            });

            expect(result.current.state).toBe('success');
        });
    });
});
