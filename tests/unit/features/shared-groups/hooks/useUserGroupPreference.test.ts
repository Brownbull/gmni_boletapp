/**
 * Story 14d-v2-1-12c: useUserGroupPreference Hook Tests
 *
 * Tests the custom hook for accessing and updating user group preferences.
 * TDD: Tests written FIRST (RED phase)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUserGroupPreference } from '@/features/shared-groups/hooks/useUserGroupPreference';
import type { User } from 'firebase/auth';
import type { UserGroupPreference } from '@/types/sharedGroup';
import { createMockTimestamp } from '../../../../helpers';

// Mock services
const mockSubscribe = vi.fn();
const mockUpdateShareMyTransactions = vi.fn();

vi.mock('@/services/userPreferencesService', () => ({
  subscribeToUserGroupPreference: (...args: unknown[]) => mockSubscribe(...args),
  updateShareMyTransactions: (...args: unknown[]) => mockUpdateShareMyTransactions(...args),
}));

// Mock cooldown utility
const mockCanToggle = vi.fn();

vi.mock('@/utils/userSharingCooldown', () => ({
  canToggleUserSharingPreference: (pref: UserGroupPreference) => mockCanToggle(pref),
}));

const createMockUser = (uid = 'test-user-id'): User => ({
  uid,
  email: 'test@example.com',
  displayName: 'Test User',
} as User);

const createMockServices = () => ({
  db: {} as any,
  appId: 'boletapp',
});

const createMockPreference = (overrides: Partial<UserGroupPreference> = {}): UserGroupPreference => ({
  shareMyTransactions: true,
  lastToggleAt: null,
  toggleCountToday: 0,
  toggleCountResetAt: null,
  ...overrides,
});

describe('useUserGroupPreference (Story 14d-v2-1-12c)', () => {
  let unsubscribeMock: vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    unsubscribeMock = vi.fn();
    mockSubscribe.mockReturnValue(unsubscribeMock);
    mockCanToggle.mockReturnValue({ allowed: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('returns loading state initially', () => {
      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.preference).toBeNull();
    });

    it('returns null preference when groupId is null', () => {
      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), null)
      );

      expect(result.current.preference).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('returns null preference when user is null', () => {
      const { result } = renderHook(() =>
        useUserGroupPreference(null, createMockServices(), 'group-123')
      );

      expect(result.current.preference).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('transitions isLoading from true to false when parameters become invalid', () => {
      // Start with valid params
      const { result, rerender } = renderHook(
        ({ groupId }) => useUserGroupPreference(createMockUser(), createMockServices(), groupId),
        { initialProps: { groupId: 'group-123' } }
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Rerender with null groupId - should set isLoading to false
      rerender({ groupId: null as unknown as string });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.preference).toBeNull();
    });
  });

  describe('Subscription behavior', () => {
    it('subscribes to preference updates', async () => {
      const user = createMockUser();
      const services = createMockServices();
      const groupId = 'group-123';

      renderHook(() => useUserGroupPreference(user, services, groupId));

      expect(mockSubscribe).toHaveBeenCalledWith(
        services.db,
        user.uid,
        services.appId,
        groupId,
        expect.any(Function),
        expect.any(Function) // onError callback (Story 14d-v2-1-12c)
      );
    });

    it('returns preference after successful load', async () => {
      const mockPref = createMockPreference({ shareMyTransactions: true });
      let subscriptionCallback: ((pref: UserGroupPreference | null) => void) | null = null;

      mockSubscribe.mockImplementation((db, userId, appId, groupId, callback) => {
        subscriptionCallback = callback;
        return unsubscribeMock;
      });

      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Simulate subscription callback (synchronous act)
      act(() => {
        subscriptionCallback?.(mockPref);
      });

      // Now should have preference (isLoading tested separately)
      expect(result.current.preference).toEqual(mockPref);
    });

    // =========================================================================
    // Story 14d-v2-1-12c ECC Review #2: Explicit isLoading=false test (MEDIUM)
    // =========================================================================

    it('sets isLoading to false after successful preference load', async () => {
      const mockPref = createMockPreference({ shareMyTransactions: true });
      let subscriptionCallback: ((pref: UserGroupPreference | null) => void) | null = null;

      mockSubscribe.mockImplementation((db, userId, appId, groupId, callback) => {
        subscriptionCallback = callback;
        return unsubscribeMock;
      });

      // Use stable references to prevent effect re-running on each render
      const user = createMockUser();
      const services = createMockServices();

      const { result } = renderHook(() =>
        useUserGroupPreference(user, services, 'group-123')
      );

      // Initially loading should be true
      expect(result.current.isLoading).toBe(true);

      // Simulate subscription callback with valid preference (async act to flush all updates)
      await act(async () => {
        subscriptionCallback?.(mockPref);
      });

      // After callback, isLoading should be false
      expect(result.current.isLoading).toBe(false);
      // And preference should be set
      expect(result.current.preference).toEqual(mockPref);
    });

    it('sets isLoading to false when subscription returns null preference', async () => {
      let subscriptionCallback: ((pref: UserGroupPreference | null) => void) | null = null;

      mockSubscribe.mockImplementation((db, userId, appId, groupId, callback) => {
        subscriptionCallback = callback;
        return unsubscribeMock;
      });

      // Use stable references to prevent effect re-running on each render
      const user = createMockUser();
      const services = createMockServices();

      const { result } = renderHook(() =>
        useUserGroupPreference(user, services, 'group-123')
      );

      // Initially loading should be true
      expect(result.current.isLoading).toBe(true);

      // Simulate subscription callback with null (async act to flush all updates)
      await act(async () => {
        subscriptionCallback?.(null);
      });

      // After callback, isLoading should be false even for null preference
      expect(result.current.isLoading).toBe(false);
      // And preference should be null
      expect(result.current.preference).toBeNull();
    });

    it('unsubscribes on unmount', () => {
      const { unmount } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('resubscribes when groupId changes', async () => {
      const user = createMockUser();
      const services = createMockServices();

      const { rerender } = renderHook(
        ({ groupId }) => useUserGroupPreference(user, services, groupId),
        { initialProps: { groupId: 'group-123' } }
      );

      expect(mockSubscribe).toHaveBeenCalledTimes(1);

      rerender({ groupId: 'group-456' });

      expect(unsubscribeMock).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('canToggle integration', () => {
    it('recalculates canToggle when preference updates', async () => {
      const mockPref = createMockPreference();

      mockSubscribe.mockImplementation((db, userId, appId, groupId, callback) => {
        Promise.resolve().then(() => callback(mockPref));
        return unsubscribeMock;
      });

      mockCanToggle.mockReturnValue({ allowed: true });

      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      await waitFor(() => {
        expect(result.current.canToggle).toEqual({ allowed: true });
      });
    });

    it('returns default canToggle when preference is null', () => {
      mockSubscribe.mockImplementation((db, userId, appId, groupId, callback) => {
        Promise.resolve().then(() => callback(null));
        return unsubscribeMock;
      });

      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      // Default when null: allowed
      expect(result.current.canToggle).toEqual({ allowed: true });
    });

    it('returns cooldown result from utility when preference exists', async () => {
      const mockPref = createMockPreference({
        lastToggleAt: createMockTimestamp(new Date()),
        toggleCountToday: 2,
      });

      mockSubscribe.mockImplementation((db, userId, appId, groupId, callback) => {
        Promise.resolve().then(() => callback(mockPref));
        return unsubscribeMock;
      });

      mockCanToggle.mockReturnValue({
        allowed: false,
        waitMinutes: 3,
        reason: 'cooldown',
      });

      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      await waitFor(() => {
        expect(result.current.canToggle).toEqual({
          allowed: false,
          waitMinutes: 3,
          reason: 'cooldown',
        });
      });
    });
  });

  describe('updatePreference', () => {
    it('calls updateShareMyTransactions service', async () => {
      const user = createMockUser();
      const services = createMockServices();
      const groupId = 'group-123';

      mockUpdateShareMyTransactions.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useUserGroupPreference(user, services, groupId)
      );

      await act(async () => {
        await result.current.updatePreference(true);
      });

      expect(mockUpdateShareMyTransactions).toHaveBeenCalledWith(
        services.db,
        user.uid,
        services.appId,
        groupId,
        true
      );
    });

    it('calls with false value correctly', async () => {
      const user = createMockUser();
      const services = createMockServices();
      const groupId = 'group-123';

      mockUpdateShareMyTransactions.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useUserGroupPreference(user, services, groupId)
      );

      await act(async () => {
        await result.current.updatePreference(false);
      });

      expect(mockUpdateShareMyTransactions).toHaveBeenCalledWith(
        services.db,
        user.uid,
        services.appId,
        groupId,
        false
      );
    });

    it('propagates errors from service', async () => {
      const error = new Error('Network error');
      mockUpdateShareMyTransactions.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      await expect(
        act(async () => {
          await result.current.updatePreference(false);
        })
      ).rejects.toThrow('Network error');
    });

    // =========================================================================
    // Story 14d-v2-1-12c Action Items: Specific error messages (LOW priority)
    // =========================================================================

    it('throws specific error when user is null', async () => {
      const { result } = renderHook(() =>
        useUserGroupPreference(null, createMockServices(), 'group-123')
      );

      await expect(
        act(async () => {
          await result.current.updatePreference(true);
        })
      ).rejects.toThrow('user is not authenticated');
    });

    it('throws specific error when services is null', async () => {
      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), null, 'group-123')
      );

      await expect(
        act(async () => {
          await result.current.updatePreference(true);
        })
      ).rejects.toThrow('services not available');
    });

    it('throws specific error when groupId is null', async () => {
      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), null)
      );

      await expect(
        act(async () => {
          await result.current.updatePreference(true);
        })
      ).rejects.toThrow('no group selected');
    });
  });

  describe('Error handling', () => {
    it('handles subscription error gracefully', () => {
      let subscriptionCallback: ((pref: UserGroupPreference | null) => void) | null = null;

      mockSubscribe.mockImplementation((db, userId, appId, groupId, callback) => {
        subscriptionCallback = callback;
        return unsubscribeMock;
      });

      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Simulate subscription callback with null (error case - synchronous act)
      act(() => {
        subscriptionCallback?.(null);
      });

      // Now should have null preference (isLoading tested separately)
      expect(result.current.preference).toBeNull();
    });

    // =========================================================================
    // Story 14d-v2-1-12c Action Items: Hook error state (HIGH priority)
    // =========================================================================

    it('sets error state when subscription fails', async () => {
      const testError = new Error('Network error');
      let onErrorCallback: ((error: Error) => void) | null = null;

      mockSubscribe.mockImplementation((db, userId, appId, groupId, callback, onError) => {
        // Capture the onError callback
        onErrorCallback = onError;
        // Immediately trigger error
        Promise.resolve().then(() => {
          onError?.(testError);
          callback(null);
        });
        return unsubscribeMock;
      });

      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.message).toBe('Network error');
      });
    });

    it('clears error state on successful subscription update', async () => {
      const testError = new Error('Network error');
      const mockPref = createMockPreference();
      let subscriptionCallback: ((pref: UserGroupPreference | null) => void) | null = null;
      let onErrorCallback: ((error: Error) => void) | null = null;

      mockSubscribe.mockImplementation((db, userId, appId, groupId, callback, onError) => {
        subscriptionCallback = callback;
        onErrorCallback = onError;
        return unsubscribeMock;
      });

      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      // First, trigger an error
      act(() => {
        onErrorCallback?.(testError);
        subscriptionCallback?.(null);
      });

      // Verify error is set
      expect(result.current.error?.message).toBe('Network error');

      // Then, trigger a successful update
      act(() => {
        subscriptionCallback?.(mockPref);
      });

      // Error should be cleared
      expect(result.current.error).toBeNull();
    });

    it('returns error in result interface', () => {
      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      // error should be part of the result interface
      expect(result.current).toHaveProperty('error');
      // Initially null
      expect(result.current.error).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('does not subscribe when services is null', () => {
      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), null, 'group-123')
      );

      expect(mockSubscribe).not.toHaveBeenCalled();
      expect(result.current.preference).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('handles preference with all null fields', async () => {
      const mockPref = createMockPreference({
        shareMyTransactions: false,
        lastToggleAt: null,
        toggleCountToday: 0,
        toggleCountResetAt: null,
      });

      mockSubscribe.mockImplementation((db, userId, appId, groupId, callback) => {
        Promise.resolve().then(() => callback(mockPref));
        return unsubscribeMock;
      });

      const { result } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      await waitFor(() => {
        expect(result.current.preference).toEqual(mockPref);
      });
    });
  });

  // ===========================================================================
  // Story 14d-v2-1-12c ECC Review #2: Race condition protection (MEDIUM)
  // ===========================================================================

  describe('Race condition protection (isMounted guard)', () => {
    it('does not update state after unmount when subscription callback fires', async () => {
      const mockPref = createMockPreference({ shareMyTransactions: true });
      let subscriptionCallback: ((pref: UserGroupPreference | null) => void) | null = null;

      mockSubscribe.mockImplementation((db, userId, appId, groupId, callback) => {
        subscriptionCallback = callback;
        return unsubscribeMock;
      });

      const { result, unmount } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Unmount the component before callback fires
      unmount();

      // Simulate subscription callback firing after unmount
      // This should NOT cause state updates (React warning: "Can't perform a React state update on an unmounted component")
      // With isMounted guard, this should be a no-op
      act(() => {
        subscriptionCallback?.(mockPref);
      });

      // Unsubscribe should have been called on unmount
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('does not update error state after unmount when error callback fires', async () => {
      const testError = new Error('Network error');
      let onErrorCallback: ((error: Error) => void) | null = null;

      mockSubscribe.mockImplementation((db, userId, appId, groupId, callback, onError) => {
        onErrorCallback = onError;
        return unsubscribeMock;
      });

      const { unmount } = renderHook(() =>
        useUserGroupPreference(createMockUser(), createMockServices(), 'group-123')
      );

      // Unmount the component before error fires
      unmount();

      // Simulate error callback firing after unmount
      // With isMounted guard, this should be a no-op
      act(() => {
        onErrorCallback?.(testError);
      });

      // Unsubscribe should have been called on unmount
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });
});
