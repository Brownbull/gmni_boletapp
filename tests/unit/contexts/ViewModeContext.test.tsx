/**
 * Story 14c.4: View Mode Switcher - ViewModeContext Tests
 *
 * Tests for the ViewModeContext that manages switching between
 * personal and shared group view modes throughout the app.
 *
 * Test coverage:
 * - AC5: Context state for filtering views
 * - AC6: localStorage persistence of view mode
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  ViewModeProvider,
  useViewMode,
  useViewModeOptional,
  VIEW_MODE_STORAGE_KEY,
} from '../../../src/contexts/ViewModeContext';
import type { SharedGroup } from '../../../src/types/sharedGroup';
import { Timestamp } from 'firebase/firestore';

// =============================================================================
// Test Setup
// =============================================================================

// Mock localStorage
let mockStorage: Record<string, string>;
let mockLocalStorage: Storage;

function createMockLocalStorage(): Storage {
  return {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
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
}

// Create a mock SharedGroup
function createMockSharedGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
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
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

// Test wrapper with QueryClient
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
    return (
      <QueryClientProvider client={queryClient}>
        <ViewModeProvider>{children}</ViewModeProvider>
      </QueryClientProvider>
    );
  };
}

describe('ViewModeContext', () => {
  beforeEach(() => {
    mockStorage = {};
    mockLocalStorage = createMockLocalStorage();
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Initial State Tests
  // ===========================================================================

  describe('Initial State', () => {
    it('should start in personal mode by default', () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mode).toBe('personal');
      expect(result.current.groupId).toBeUndefined();
      expect(result.current.group).toBeUndefined();
      expect(result.current.isGroupMode).toBe(false);
    });

    it('should provide setPersonalMode function', () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.setPersonalMode).toBe('function');
    });

    it('should provide setGroupMode function', () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.setGroupMode).toBe('function');
    });
  });

  // ===========================================================================
  // Mode Switching Tests
  // ===========================================================================

  describe('Mode Switching', () => {
    it('should switch to group mode when setGroupMode is called', async () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      const mockGroup = createMockSharedGroup();

      act(() => {
        result.current.setGroupMode(mockGroup.id!, mockGroup);
      });

      await waitFor(() => {
        expect(result.current.mode).toBe('group');
        expect(result.current.groupId).toBe('group-123');
        expect(result.current.group).toEqual(mockGroup);
        expect(result.current.isGroupMode).toBe(true);
      });
    });

    it('should switch back to personal mode when setPersonalMode is called', async () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      const mockGroup = createMockSharedGroup();

      // First switch to group mode
      act(() => {
        result.current.setGroupMode(mockGroup.id!, mockGroup);
      });

      await waitFor(() => {
        expect(result.current.mode).toBe('group');
      });

      // Then switch back to personal
      act(() => {
        result.current.setPersonalMode();
      });

      await waitFor(() => {
        expect(result.current.mode).toBe('personal');
        expect(result.current.groupId).toBeUndefined();
        expect(result.current.group).toBeUndefined();
        expect(result.current.isGroupMode).toBe(false);
      });
    });

    it('should switch between different groups', async () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      const group1 = createMockSharedGroup({ id: 'group-1', name: 'Group 1' });
      const group2 = createMockSharedGroup({ id: 'group-2', name: 'Group 2' });

      act(() => {
        result.current.setGroupMode(group1.id!, group1);
      });

      await waitFor(() => {
        expect(result.current.groupId).toBe('group-1');
      });

      act(() => {
        result.current.setGroupMode(group2.id!, group2);
      });

      await waitFor(() => {
        expect(result.current.groupId).toBe('group-2');
        expect(result.current.group?.name).toBe('Group 2');
      });
    });
  });

  // ===========================================================================
  // localStorage Persistence Tests (AC6)
  // ===========================================================================

  describe('localStorage Persistence (AC6)', () => {
    it('should persist mode to localStorage when switching to group mode', async () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      const mockGroup = createMockSharedGroup();

      act(() => {
        result.current.setGroupMode(mockGroup.id!, mockGroup);
      });

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
        const storedValue = mockStorage[VIEW_MODE_STORAGE_KEY];
        expect(storedValue).toBeDefined();
        const parsed = JSON.parse(storedValue);
        expect(parsed.mode).toBe('group');
        expect(parsed.groupId).toBe('group-123');
      });
    });

    it('should persist mode to localStorage when switching to personal mode', async () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      const mockGroup = createMockSharedGroup();

      // Switch to group first
      act(() => {
        result.current.setGroupMode(mockGroup.id!, mockGroup);
      });

      await waitFor(() => {
        expect(result.current.mode).toBe('group');
      });

      // Switch back to personal
      act(() => {
        result.current.setPersonalMode();
      });

      await waitFor(() => {
        const storedValue = mockStorage[VIEW_MODE_STORAGE_KEY];
        const parsed = JSON.parse(storedValue);
        expect(parsed.mode).toBe('personal');
      });
    });

    it('should restore mode from localStorage on initialization', () => {
      // Pre-populate localStorage with group mode
      mockStorage[VIEW_MODE_STORAGE_KEY] = JSON.stringify({
        mode: 'group',
        groupId: 'persisted-group-id',
      });

      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mode).toBe('group');
      expect(result.current.groupId).toBe('persisted-group-id');
    });

    it('should fall back to personal mode if localStorage has invalid data', () => {
      // Pre-populate with invalid JSON
      mockStorage[VIEW_MODE_STORAGE_KEY] = 'invalid json {{{';

      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mode).toBe('personal');
    });

    it('should fall back to personal mode if localStorage is empty', () => {
      // localStorage is empty by default in tests

      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mode).toBe('personal');
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('Error Handling', () => {
    it('should throw error when useViewMode is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useViewMode());
      }).toThrow('useViewMode must be used within a ViewModeProvider');

      consoleSpy.mockRestore();
    });

    it('should return null when useViewModeOptional is used outside provider', () => {
      const { result } = renderHook(() => useViewModeOptional());

      expect(result.current).toBeNull();
    });
  });

  // ===========================================================================
  // updateGroupData Tests
  // ===========================================================================

  describe('updateGroupData', () => {
    it('should update cached group data when in group mode for that group', async () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      const mockGroup = createMockSharedGroup({ id: 'group-123', name: 'Original Name' });
      const updatedGroup = createMockSharedGroup({ id: 'group-123', name: 'Updated Name' });

      // First switch to group mode
      act(() => {
        result.current.setGroupMode(mockGroup.id!, mockGroup);
      });

      await waitFor(() => {
        expect(result.current.group?.name).toBe('Original Name');
      });

      // Update the group data
      act(() => {
        result.current.updateGroupData(updatedGroup);
      });

      await waitFor(() => {
        expect(result.current.group?.name).toBe('Updated Name');
      });
    });

    it('should NOT update cached group data when in personal mode', async () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      const mockGroup = createMockSharedGroup({ id: 'group-123', name: 'Some Group' });

      // Stay in personal mode
      expect(result.current.mode).toBe('personal');

      // Try to update group data
      act(() => {
        result.current.updateGroupData(mockGroup);
      });

      // Group should remain undefined in personal mode
      expect(result.current.group).toBeUndefined();
    });

    it('should NOT update cached group data when in different group mode', async () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      const group1 = createMockSharedGroup({ id: 'group-1', name: 'Group 1' });
      const group2Update = createMockSharedGroup({ id: 'group-2', name: 'Group 2 Updated' });

      // Switch to group 1
      act(() => {
        result.current.setGroupMode(group1.id!, group1);
      });

      await waitFor(() => {
        expect(result.current.groupId).toBe('group-1');
      });

      // Try to update with group 2 data
      act(() => {
        result.current.updateGroupData(group2Update);
      });

      // Should still show group 1 data
      expect(result.current.group?.name).toBe('Group 1');
    });
  });

  // ===========================================================================
  // Computed Values Tests
  // ===========================================================================

  describe('Computed Values', () => {
    it('should have isGroupMode = false in personal mode', () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isGroupMode).toBe(false);
    });

    it('should have isGroupMode = true in group mode', async () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      const mockGroup = createMockSharedGroup();

      act(() => {
        result.current.setGroupMode(mockGroup.id!, mockGroup);
      });

      await waitFor(() => {
        expect(result.current.isGroupMode).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Component Integration Tests
  // ===========================================================================

  describe('Component Integration', () => {
    it('should provide context to child components', () => {
      function TestChild() {
        const { mode } = useViewMode();
        return <div data-testid="mode">{mode}</div>;
      }

      const queryClient = new QueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <ViewModeProvider>
            <TestChild />
          </ViewModeProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('personal');
    });

    it('should update child components when mode changes', async () => {
      function TestChild() {
        const { mode, setGroupMode } = useViewMode();
        const mockGroup = createMockSharedGroup();
        return (
          <div>
            <div data-testid="mode">{mode}</div>
            <button onClick={() => setGroupMode(mockGroup.id!, mockGroup)}>Switch</button>
          </div>
        );
      }

      const queryClient = new QueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <ViewModeProvider>
            <TestChild />
          </ViewModeProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('personal');

      act(() => {
        screen.getByText('Switch').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('mode')).toHaveTextContent('group');
      });
    });
  });
});
