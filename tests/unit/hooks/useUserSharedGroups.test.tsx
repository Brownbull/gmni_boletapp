/**
 * Story 14c.4: View Mode Switcher - useUserSharedGroups Hook Tests
 *
 * Tests for the hook that fetches and subscribes to shared groups
 * that the current user is a member of.
 *
 * Test coverage:
 * - AC2: Fetch user's shared groups for display in selector
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { SharedGroup } from '../../../src/types/sharedGroup';
import { Timestamp } from 'firebase/firestore';

// =============================================================================
// Mocks
// =============================================================================

// Mock the sharedGroupService
const mockSubscribeToSharedGroups = vi.fn();
const mockGetSharedGroupsForUser = vi.fn();

vi.mock('../../../src/services/sharedGroupService', () => ({
  subscribeToSharedGroups: (...args: unknown[]) => mockSubscribeToSharedGroups(...args),
  getSharedGroupsForUser: (...args: unknown[]) => mockGetSharedGroupsForUser(...args),
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  Timestamp: {
    now: () => ({
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
    }),
    fromDate: (date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    }),
  },
}));

// Import after mocks are set up
import { useUserSharedGroups } from '../../../src/hooks/useUserSharedGroups';

// =============================================================================
// Test Utilities
// =============================================================================

function createMockSharedGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
  const now = Timestamp.now();
  return {
    id: 'group-123',
    ownerId: 'user-456',
    appId: 'boletapp',
    name: 'Familia Martinez',
    color: '#10b981',
    icon: '👨‍👩‍👧',
    shareCode: 'abc123def456',
    shareCodeExpiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    members: ['user-456', 'user-789'],
    memberUpdates: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// Mock db instance
const mockDb = {} as ReturnType<typeof import('firebase/firestore').getFirestore>;

describe('useUserSharedGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    mockSubscribeToSharedGroups.mockReturnValue(() => {}); // Return unsubscribe function
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Initial State Tests
  // ===========================================================================

  describe('Initial State', () => {
    it('should return loading state initially', () => {
      mockSubscribeToSharedGroups.mockImplementation((_db, _userId, onUpdate) => {
        // Don't call onUpdate yet - simulating loading
        return () => {};
      });

      const { result } = renderHook(
        () => useUserSharedGroups(mockDb, 'user-123'),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.groups).toEqual([]);
    });

    it('should not subscribe when userId is undefined', () => {
      const { result } = renderHook(
        () => useUserSharedGroups(mockDb, undefined),
        { wrapper: createWrapper() }
      );

      expect(mockSubscribeToSharedGroups).not.toHaveBeenCalled();
      expect(result.current.groups).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should not subscribe when userId is empty string', () => {
      const { result } = renderHook(
        () => useUserSharedGroups(mockDb, ''),
        { wrapper: createWrapper() }
      );

      expect(mockSubscribeToSharedGroups).not.toHaveBeenCalled();
      expect(result.current.groups).toEqual([]);
    });
  });

  // ===========================================================================
  // Subscription Tests
  // ===========================================================================

  describe('Subscription', () => {
    it('should subscribe to shared groups when userId is provided', () => {
      const unsubscribe = vi.fn();
      mockSubscribeToSharedGroups.mockReturnValue(unsubscribe);

      renderHook(
        () => useUserSharedGroups(mockDb, 'user-123'),
        { wrapper: createWrapper() }
      );

      expect(mockSubscribeToSharedGroups).toHaveBeenCalledWith(
        mockDb,
        'user-123',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should return groups when subscription receives data', async () => {
      const mockGroups = [
        createMockSharedGroup({ id: 'group-1', name: 'Group 1' }),
        createMockSharedGroup({ id: 'group-2', name: 'Group 2' }),
      ];

      mockSubscribeToSharedGroups.mockImplementation((_db, _userId, onUpdate) => {
        // Simulate async data arrival
        setTimeout(() => onUpdate(mockGroups), 0);
        return () => {};
      });

      const { result } = renderHook(
        () => useUserSharedGroups(mockDb, 'user-123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.groups).toHaveLength(2);
      });

      expect(result.current.groups[0].name).toBe('Group 1');
      expect(result.current.groups[1].name).toBe('Group 2');
      expect(result.current.isLoading).toBe(false);
    });

    it('should unsubscribe when component unmounts', () => {
      const unsubscribe = vi.fn();
      mockSubscribeToSharedGroups.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(
        () => useUserSharedGroups(mockDb, 'user-123'),
        { wrapper: createWrapper() }
      );

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should resubscribe when userId changes', () => {
      const unsubscribe1 = vi.fn();
      const unsubscribe2 = vi.fn();

      let callCount = 0;
      mockSubscribeToSharedGroups.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? unsubscribe1 : unsubscribe2;
      });

      const { rerender } = renderHook(
        ({ userId }: { userId: string }) => useUserSharedGroups(mockDb, userId),
        {
          wrapper: createWrapper(),
          initialProps: { userId: 'user-1' },
        }
      );

      expect(mockSubscribeToSharedGroups).toHaveBeenCalledTimes(1);

      // Change userId
      rerender({ userId: 'user-2' });

      expect(mockSubscribeToSharedGroups).toHaveBeenCalledTimes(2);
      expect(unsubscribe1).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('Error Handling', () => {
    it('should set error state when subscription fails', async () => {
      mockSubscribeToSharedGroups.mockImplementation((_db, _userId, _onUpdate, onError) => {
        setTimeout(() => onError(new Error('Subscription failed')), 0);
        return () => {};
      });

      const { result } = renderHook(
        () => useUserSharedGroups(mockDb, 'user-123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error?.message).toBe('Subscription failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('should return empty groups on error', async () => {
      mockSubscribeToSharedGroups.mockImplementation((_db, _userId, _onUpdate, onError) => {
        setTimeout(() => onError(new Error('Error')), 0);
        return () => {};
      });

      const { result } = renderHook(
        () => useUserSharedGroups(mockDb, 'user-123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.groups).toEqual([]);
    });
  });

  // ===========================================================================
  // Return Value Tests
  // ===========================================================================

  describe('Return Values', () => {
    it('should return groupCount as the number of groups', async () => {
      const mockGroups = [
        createMockSharedGroup({ id: 'group-1' }),
        createMockSharedGroup({ id: 'group-2' }),
        createMockSharedGroup({ id: 'group-3' }),
      ];

      mockSubscribeToSharedGroups.mockImplementation((_db, _userId, onUpdate) => {
        setTimeout(() => onUpdate(mockGroups), 0);
        return () => {};
      });

      const { result } = renderHook(
        () => useUserSharedGroups(mockDb, 'user-123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.groupCount).toBe(3);
      });
    });

    it('should return hasGroups = true when groups exist', async () => {
      mockSubscribeToSharedGroups.mockImplementation((_db, _userId, onUpdate) => {
        setTimeout(() => onUpdate([createMockSharedGroup()]), 0);
        return () => {};
      });

      const { result } = renderHook(
        () => useUserSharedGroups(mockDb, 'user-123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.hasGroups).toBe(true);
      });
    });

    it('should return hasGroups = false when no groups', async () => {
      mockSubscribeToSharedGroups.mockImplementation((_db, _userId, onUpdate) => {
        setTimeout(() => onUpdate([]), 0);
        return () => {};
      });

      const { result } = renderHook(
        () => useUserSharedGroups(mockDb, 'user-123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasGroups).toBe(false);
    });

    it('should provide getGroupById helper', async () => {
      const group1 = createMockSharedGroup({ id: 'group-1', name: 'Group 1' });
      const group2 = createMockSharedGroup({ id: 'group-2', name: 'Group 2' });

      mockSubscribeToSharedGroups.mockImplementation((_db, _userId, onUpdate) => {
        setTimeout(() => onUpdate([group1, group2]), 0);
        return () => {};
      });

      const { result } = renderHook(
        () => useUserSharedGroups(mockDb, 'user-123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.groups).toHaveLength(2);
      });

      expect(result.current.getGroupById('group-1')).toEqual(group1);
      expect(result.current.getGroupById('group-2')).toEqual(group2);
      expect(result.current.getGroupById('non-existent')).toBeUndefined();
    });
  });
});
