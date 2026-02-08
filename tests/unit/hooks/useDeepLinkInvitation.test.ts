/**
 * Unit tests for useDeepLinkInvitation hook
 *
 * Story 14d-v2-1-6a: Deep Link & Pending Invitations Service
 * Epic 14d-v2: Shared Groups v2
 *
 * Tests the deep link invitation handler hook:
 * - URL detection on mount (AC #2, #3)
 * - Authenticated user flow (AC #3)
 * - Unauthenticated user flow with localStorage (AC #1, #2)
 * - Resume flow after authentication (AC #1)
 * - Clear share code after processing (Task 1.6)
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
    useDeepLinkInvitation,
    getPendingInviteShareCode,
    setPendingInviteShareCode,
    clearPendingInviteShareCode,
    PENDING_INVITE_SHARE_CODE_KEY,
    type DeepLinkInvitationError,
} from '../../../src/hooks/useDeepLinkInvitation';
import type { PendingInvitation } from '../../../src/types/sharedGroup';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase Auth (TD-CONSOLIDATED-5: getAuth used for email in security rules)
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({
        currentUser: { email: 'friend@example.com' },
    })),
}));

// Mock the deep link handler utilities
vi.mock('../../../src/utils/deepLinkHandler', () => ({
    parseShareCodeFromUrl: vi.fn(),
    clearJoinUrlPath: vi.fn(),
}));

// Mock the invitation service
vi.mock('../../../src/services/invitationService', () => ({
    getInvitationByShareCode: vi.fn(),
}));

import { parseShareCodeFromUrl, clearJoinUrlPath } from '../../../src/utils/deepLinkHandler';
import { getInvitationByShareCode } from '../../../src/services/invitationService';

// Type the mocks
const mockParseShareCodeFromUrl = vi.mocked(parseShareCodeFromUrl);
const mockClearJoinUrlPath = vi.mocked(clearJoinUrlPath);
const mockGetInvitationByShareCode = vi.mocked(getInvitationByShareCode);

// Sample data
const VALID_SHARE_CODE = 'Ab3dEf7hIj9kLm0p';
const MOCK_DB = {} as any;

/**
 * Helper to create a mock Timestamp
 */
function createMockTimestamp(daysFromNow: number = 0): Timestamp {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return {
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
    } as unknown as Timestamp;
}

/**
 * Sample pending invitation for tests
 */
const MOCK_INVITATION: PendingInvitation = {
    id: 'invitation-123',
    groupId: 'group-abc',
    groupName: '🏠 Gastos del Hogar',
    groupColor: '#10b981',
    shareCode: VALID_SHARE_CODE,
    invitedEmail: 'friend@example.com',
    invitedByUserId: 'owner-xyz',
    invitedByName: 'Juan García',
    createdAt: createMockTimestamp(-1), // 1 day ago
    expiresAt: createMockTimestamp(6),  // Expires in 6 days
    status: 'pending',
};

/**
 * Expired invitation for tests
 */
const MOCK_EXPIRED_INVITATION: PendingInvitation = {
    ...MOCK_INVITATION,
    id: 'invitation-expired',
    expiresAt: createMockTimestamp(-1), // Expired 1 day ago
};

// =============================================================================
// localStorage Mock
// =============================================================================

let mockStorage: Record<string, string> = {};

const mockLocalStorage = {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
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
};

// =============================================================================
// Tests
// =============================================================================

describe('useDeepLinkInvitation', () => {
    const mockUserId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
        mockStorage = {};
        vi.stubGlobal('localStorage', mockLocalStorage);

        // Default mock implementations
        mockParseShareCodeFromUrl.mockReturnValue(null);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetAllMocks();
    });

    // =========================================================================
    // Initial State Tests
    // =========================================================================
    describe('initial state', () => {
        it('should return idle state when no join URL detected', () => {
            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            expect(result.current.invitation).toBeNull();
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.shareCode).toBeNull();
            expect(result.current.pendingAuth).toBe(false);
        });

        it('should return clearPendingInvitation function', () => {
            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            expect(typeof result.current.clearPendingInvitation).toBe('function');
        });
    });

    // =========================================================================
    // URL Detection Tests (Task 1.2)
    // =========================================================================
    describe('URL detection on mount (Task 1.2)', () => {
        it('should detect /join/{shareCode} URL pattern', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_INVITATION);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.shareCode).toBe(VALID_SHARE_CODE);
            });
        });

        it('should call parseShareCodeFromUrl with window.location.pathname', () => {
            renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            expect(mockParseShareCodeFromUrl).toHaveBeenCalledWith(window.location.pathname);
        });

        it('should not process URL more than once', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_INVITATION);

            const { result, rerender } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.invitation).not.toBeNull();
            });

            // Rerender should not call fetch again
            rerender();

            expect(mockGetInvitationByShareCode).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // Authenticated Flow Tests (AC #3, Task 1.3)
    // =========================================================================
    describe('authenticated user flow (AC #3, Task 1.3)', () => {
        it('should fetch invitation immediately when authenticated', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_INVITATION);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.invitation).toEqual(MOCK_INVITATION);
            });

            expect(mockGetInvitationByShareCode).toHaveBeenCalledWith(MOCK_DB, VALID_SHARE_CODE, 'friend@example.com');
        });

        it('should set loading state during fetch', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);

            // Create a deferred promise to control resolution timing
            let resolvePromise: (value: PendingInvitation | null) => void;
            const deferredPromise = new Promise<PendingInvitation | null>(resolve => {
                resolvePromise = resolve;
            });
            mockGetInvitationByShareCode.mockReturnValue(deferredPromise);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            // Should be loading
            await waitFor(() => {
                expect(result.current.loading).toBe(true);
            });

            // Resolve the promise
            await act(async () => {
                resolvePromise!(MOCK_INVITATION);
            });

            // Should no longer be loading
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });
        });

        it('should include group name, inviter, and invitation date (AC #4)', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_INVITATION);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.invitation).not.toBeNull();
            });

            // Verify invitation includes required fields
            expect(result.current.invitation?.groupName).toBe('🏠 Gastos del Hogar');
            expect(result.current.invitation?.invitedByName).toBe('Juan García');
            expect(result.current.invitation?.createdAt).toBeDefined();
        });
    });

    // =========================================================================
    // Unauthenticated Flow Tests (AC #1, #2, Task 1.4)
    // =========================================================================
    describe('unauthenticated user flow (AC #1, #2, Task 1.4)', () => {
        it('should store share code in localStorage when not authenticated', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: null,
                    isAuthenticated: false,
                })
            );

            await waitFor(() => {
                expect(result.current.pendingAuth).toBe(true);
            });

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                PENDING_INVITE_SHARE_CODE_KEY,
                VALID_SHARE_CODE
            );
        });

        it('should not fetch invitation when not authenticated', () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);

            renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: null,
                    isAuthenticated: false,
                })
            );

            expect(mockGetInvitationByShareCode).not.toHaveBeenCalled();
        });

        it('should set pendingAuth to true when waiting for authentication', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: null,
                    isAuthenticated: false,
                })
            );

            await waitFor(() => {
                expect(result.current.pendingAuth).toBe(true);
            });

            expect(result.current.shareCode).toBe(VALID_SHARE_CODE);
        });

        it('should clear URL path after storing share code', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);

            renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: null,
                    isAuthenticated: false,
                })
            );

            await waitFor(() => {
                expect(mockClearJoinUrlPath).toHaveBeenCalled();
            });
        });
    });

    // =========================================================================
    // Resume After Auth Tests (AC #1, Task 1.5)
    // =========================================================================
    describe('resume after authentication (AC #1, Task 1.5)', () => {
        it('should check localStorage for pending share code after auth', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);

            // Start unauthenticated
            const { result, rerender } = renderHook(
                ({ isAuth, userId }) =>
                    useDeepLinkInvitation({
                        db: MOCK_DB,
                        userId,
                        isAuthenticated: isAuth,
                    }),
                {
                    initialProps: { isAuth: false, userId: null as string | null },
                }
            );

            await waitFor(() => {
                expect(result.current.pendingAuth).toBe(true);
            });

            // Store code in mock storage (simulating localStorage persistence)
            mockStorage[PENDING_INVITE_SHARE_CODE_KEY] = VALID_SHARE_CODE;
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_INVITATION);

            // Simulate user authenticating
            rerender({ isAuth: true, userId: mockUserId });

            await waitFor(() => {
                expect(result.current.invitation).toEqual(MOCK_INVITATION);
            });

            expect(result.current.pendingAuth).toBe(false);
        });

        it('should use shareCode from state when localStorage is empty', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);

            // Start unauthenticated
            const { result, rerender } = renderHook(
                ({ isAuth, userId }) =>
                    useDeepLinkInvitation({
                        db: MOCK_DB,
                        userId,
                        isAuthenticated: isAuth,
                    }),
                {
                    initialProps: { isAuth: false, userId: null as string | null },
                }
            );

            await waitFor(() => {
                expect(result.current.pendingAuth).toBe(true);
            });

            // Don't set localStorage - let hook use state shareCode
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_INVITATION);

            // Simulate user authenticating
            rerender({ isAuth: true, userId: mockUserId });

            await waitFor(() => {
                expect(mockGetInvitationByShareCode).toHaveBeenCalledWith(MOCK_DB, VALID_SHARE_CODE, 'friend@example.com');
            });
        });

        it('should prompt to accept/decline after login (AC #1)', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);

            // Start unauthenticated
            const { result, rerender } = renderHook(
                ({ isAuth, userId }) =>
                    useDeepLinkInvitation({
                        db: MOCK_DB,
                        userId,
                        isAuthenticated: isAuth,
                    }),
                {
                    initialProps: { isAuth: false, userId: null as string | null },
                }
            );

            await waitFor(() => {
                expect(result.current.pendingAuth).toBe(true);
            });

            // Store code and mock invitation
            mockStorage[PENDING_INVITE_SHARE_CODE_KEY] = VALID_SHARE_CODE;
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_INVITATION);

            // Simulate login
            rerender({ isAuth: true, userId: mockUserId });

            // Should show invitation (for accept/decline prompt)
            await waitFor(() => {
                expect(result.current.invitation).not.toBeNull();
                expect(result.current.invitation?.groupName).toBe('🏠 Gastos del Hogar');
            });
        });
    });

    // =========================================================================
    // Clear Share Code Tests (Task 1.6)
    // =========================================================================
    describe('clear share code after processing (Task 1.6)', () => {
        it('should clear localStorage after successful fetch', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockStorage[PENDING_INVITE_SHARE_CODE_KEY] = VALID_SHARE_CODE;
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_INVITATION);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.invitation).not.toBeNull();
            });

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(PENDING_INVITE_SHARE_CODE_KEY);
        });

        it('should clear localStorage after fetch error', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockStorage[PENDING_INVITE_SHARE_CODE_KEY] = VALID_SHARE_CODE;
            mockGetInvitationByShareCode.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.error).not.toBeNull();
            });

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(PENDING_INVITE_SHARE_CODE_KEY);
        });

        it('should clear URL path after processing', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_INVITATION);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.invitation).not.toBeNull();
            });

            expect(mockClearJoinUrlPath).toHaveBeenCalled();
        });

        it('clearPendingInvitation should clear all state and localStorage', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockStorage[PENDING_INVITE_SHARE_CODE_KEY] = VALID_SHARE_CODE;
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_INVITATION);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.invitation).not.toBeNull();
            });

            // Clear all state
            act(() => {
                result.current.clearPendingInvitation();
            });

            expect(result.current.invitation).toBeNull();
            expect(result.current.shareCode).toBeNull();
            expect(result.current.error).toBeNull();
            expect(result.current.pendingAuth).toBe(false);
        });
    });

    // =========================================================================
    // Error Handling Tests
    // =========================================================================
    describe('error handling', () => {
        it('should set NOT_FOUND error when invitation not found', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetInvitationByShareCode.mockResolvedValue(null);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.error).toBe('NOT_FOUND');
            });

            expect(result.current.invitation).toBeNull();
        });

        it('should set EXPIRED error when invitation is expired', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_EXPIRED_INVITATION);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.error).toBe('EXPIRED');
            });

            // Should still set invitation for UI to show expired message
            expect(result.current.invitation).not.toBeNull();
        });

        it('should set NETWORK_ERROR on network failure', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetInvitationByShareCode.mockRejectedValue(new Error('network error'));

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.error).toBe('NETWORK_ERROR');
            });
        });

        it('should set UNKNOWN_ERROR on unexpected failure', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetInvitationByShareCode.mockRejectedValue(new Error('Something went wrong'));

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.error).toBe('UNKNOWN_ERROR');
            });
        });

        it('should handle non-Error thrown values', async () => {
            mockParseShareCodeFromUrl.mockReturnValue(VALID_SHARE_CODE);
            mockGetInvitationByShareCode.mockRejectedValue('string error');

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.error).toBe('UNKNOWN_ERROR');
            });
        });
    });

    // =========================================================================
    // localStorage Stored Code Tests
    // =========================================================================
    describe('localStorage stored code handling', () => {
        it('should check localStorage on mount', async () => {
            mockStorage[PENDING_INVITE_SHARE_CODE_KEY] = VALID_SHARE_CODE;
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_INVITATION);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.invitation).toEqual(MOCK_INVITATION);
            });
        });

        it('should prioritize URL code over localStorage code', async () => {
            const urlCode = 'UrlShareCode12345';
            const storedCode = 'StoredCode1234567';

            mockParseShareCodeFromUrl.mockReturnValue(urlCode);
            mockStorage[PENDING_INVITE_SHARE_CODE_KEY] = storedCode;
            mockGetInvitationByShareCode.mockResolvedValue(MOCK_INVITATION);

            const { result } = renderHook(() =>
                useDeepLinkInvitation({
                    db: MOCK_DB,
                    userId: mockUserId,
                    isAuthenticated: true,
                })
            );

            await waitFor(() => {
                expect(result.current.shareCode).toBe(urlCode);
            });

            expect(mockGetInvitationByShareCode).toHaveBeenCalledWith(MOCK_DB, urlCode, 'friend@example.com');
        });
    });
});

// =============================================================================
// localStorage Utility Function Tests
// =============================================================================

describe('localStorage utility functions', () => {
    let mockStorage: Record<string, string> = {};

    const mockLocalStorage = {
        getItem: vi.fn((key: string) => mockStorage[key] ?? null),
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
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockStorage = {};
        vi.stubGlobal('localStorage', mockLocalStorage);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('getPendingInviteShareCode', () => {
        it('should return stored code', () => {
            mockStorage[PENDING_INVITE_SHARE_CODE_KEY] = 'TestShareCode123';

            const result = getPendingInviteShareCode();

            expect(result).toBe('TestShareCode123');
        });

        it('should return null when no code stored', () => {
            const result = getPendingInviteShareCode();

            expect(result).toBeNull();
        });

        it('should return null when localStorage throws', () => {
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error('localStorage not available');
            });

            const result = getPendingInviteShareCode();

            expect(result).toBeNull();
        });
    });

    describe('setPendingInviteShareCode', () => {
        it('should store code in localStorage', () => {
            setPendingInviteShareCode('TestCode1234567');

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                PENDING_INVITE_SHARE_CODE_KEY,
                'TestCode1234567'
            );
        });

        it('should not store empty code', () => {
            setPendingInviteShareCode('');

            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        });

        it('should handle localStorage errors gracefully', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });

            // Should not throw
            expect(() => setPendingInviteShareCode('TestCode')).not.toThrow();
        });
    });

    describe('clearPendingInviteShareCode', () => {
        it('should remove code from localStorage', () => {
            mockStorage[PENDING_INVITE_SHARE_CODE_KEY] = 'TestCode';

            clearPendingInviteShareCode();

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(PENDING_INVITE_SHARE_CODE_KEY);
        });

        it('should handle localStorage errors gracefully', () => {
            mockLocalStorage.removeItem.mockImplementation(() => {
                throw new Error('SecurityError');
            });

            // Should not throw
            expect(() => clearPendingInviteShareCode()).not.toThrow();
        });
    });
});
