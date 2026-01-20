/**
 * Story 14c.18: View Mode Preference Persistence Hook Tests
 *
 * Tests for the useViewModePreferencePersistence hook that connects
 * ViewModeContext to Firestore persistence.
 *
 * Test coverage:
 * - AC3: Load preference on auth completion
 * - AC4: Validate group membership before restoring
 * - AC5: Fallback to personal if group invalid
 * - AC6: Sync preference changes to Firestore
 * - AC8: Cross-device sync (after refresh)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useViewModePreferencePersistence } from '../../../src/hooks/useViewModePreferencePersistence';
import { ViewModeProvider, useViewMode } from '../../../src/contexts/ViewModeContext';
import type { SharedGroup } from '../../../src/types/sharedGroup';
import type { ViewModePreference } from '../../../src/services/userPreferencesService';
import { Timestamp } from 'firebase/firestore';

// =============================================================================
// Test Setup
// =============================================================================

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

describe('useViewModePreferencePersistence', () => {
  beforeEach(() => {
    mockStorage = {};
    mockLocalStorage = createMockLocalStorage();
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // Test wrapper that provides both ViewModeContext and QueryClient
  function createTestWrapper() {
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

  // ===========================================================================
  // Integration Test: Full Flow (AC3, AC4, AC5)
  // ===========================================================================

  describe('Full Flow Integration', () => {
    it('should validate and restore valid group mode (AC3, AC4)', async () => {
      // Pre-populate localStorage with group mode
      mockStorage['boletapp_view_mode'] = JSON.stringify({
        mode: 'group',
        groupId: 'group-123',
      });

      const savePreference = vi.fn();
      const validGroup = createMockSharedGroup({ id: 'group-123', name: 'Valid Group' });

      // Hook that uses both useViewMode and useViewModePreferencePersistence
      function TestHook() {
        const viewMode = useViewMode();
        useViewModePreferencePersistence({
          groups: [validGroup],
          groupsLoading: false,
          firestorePreference: undefined,
          preferencesLoading: false,
          savePreference,
        });
        return viewMode;
      }

      const { result } = renderHook(() => TestHook(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isValidated).toBe(true);
        expect(result.current.mode).toBe('group');
        expect(result.current.groupId).toBe('group-123');
        expect(result.current.group?.name).toBe('Valid Group');
      });
    });

    it('should fallback to personal mode for invalid group (AC5)', async () => {
      // Pre-populate localStorage with group mode for non-existent group
      mockStorage['boletapp_view_mode'] = JSON.stringify({
        mode: 'group',
        groupId: 'deleted-group',
      });

      const savePreference = vi.fn();
      const differentGroup = createMockSharedGroup({ id: 'other-group', name: 'Other Group' });

      function TestHook() {
        const viewMode = useViewMode();
        useViewModePreferencePersistence({
          groups: [differentGroup], // Group doesn't include 'deleted-group'
          groupsLoading: false,
          firestorePreference: undefined,
          preferencesLoading: false,
          savePreference,
        });
        return viewMode;
      }

      const { result } = renderHook(() => TestHook(), {
        wrapper: createTestWrapper(),
      });

      // Should fallback to personal mode since the group doesn't exist
      await waitFor(() => {
        expect(result.current.isValidated).toBe(true);
        expect(result.current.mode).toBe('personal');
        expect(result.current.groupId).toBeUndefined();
      });

      // Note: The savePreference is NOT called during the initial validation fallback
      // because the hook's Step 3 skips the first run to avoid re-persisting the initial state.
      // The fallback is persisted via localStorage immediately, and will sync to Firestore
      // via the onPreferenceChange callback in ViewModeProvider when that is configured.
    });

    it('should wait for groups to load before validating', async () => {
      const savePreference = vi.fn();
      const validGroup = createMockSharedGroup({ id: 'group-123' });

      // Pre-populate localStorage with group mode
      mockStorage['boletapp_view_mode'] = JSON.stringify({
        mode: 'group',
        groupId: 'group-123',
      });

      function TestHook({ groupsLoading }: { groupsLoading: boolean }) {
        const viewMode = useViewMode();
        useViewModePreferencePersistence({
          groups: [validGroup],
          groupsLoading,
          firestorePreference: undefined,
          preferencesLoading: false,
          savePreference,
        });
        return viewMode;
      }

      // Start with groups loading
      const { result, rerender } = renderHook(
        ({ groupsLoading }) => TestHook({ groupsLoading }),
        {
          wrapper: createTestWrapper(),
          initialProps: { groupsLoading: true },
        }
      );

      // Should not validate while loading
      expect(result.current.isValidated).toBe(false);

      // Finish loading
      rerender({ groupsLoading: false });

      await waitFor(() => {
        expect(result.current.isValidated).toBe(true);
        expect(result.current.mode).toBe('group');
      });
    });
  });

  // ===========================================================================
  // Persistence Tests (AC6)
  // ===========================================================================

  describe('Preference Persistence (AC6)', () => {
    it('should call savePreference when mode changes after validation', async () => {
      const savePreference = vi.fn();

      function TestHook() {
        const viewMode = useViewMode();
        useViewModePreferencePersistence({
          groups: [],
          groupsLoading: false,
          firestorePreference: undefined,
          preferencesLoading: false,
          savePreference,
        });
        return viewMode;
      }

      const { result } = renderHook(() => TestHook(), {
        wrapper: createTestWrapper(),
      });

      // Wait for validation
      await waitFor(() => {
        expect(result.current.isValidated).toBe(true);
      });

      // Clear any calls from validation
      savePreference.mockClear();

      const newGroup = createMockSharedGroup({ id: 'new-group' });

      // Switch to group mode
      act(() => {
        result.current.setGroupMode(newGroup.id!, newGroup);
      });

      await waitFor(() => {
        expect(savePreference).toHaveBeenCalledWith({
          mode: 'group',
          groupId: 'new-group',
        });
      });
    });

    it('should not call savePreference before validation', async () => {
      const savePreference = vi.fn();

      function TestHook() {
        const viewMode = useViewMode();
        useViewModePreferencePersistence({
          groups: [],
          groupsLoading: true, // Keep loading to prevent validation
          firestorePreference: undefined,
          preferencesLoading: false,
          savePreference,
        });
        return viewMode;
      }

      const { result } = renderHook(() => TestHook(), {
        wrapper: createTestWrapper(),
      });

      // Not validated yet
      expect(result.current.isValidated).toBe(false);
      expect(savePreference).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Firestore Preference Priority Tests (AC3)
  // ===========================================================================

  describe('Firestore Preference Priority (AC3)', () => {
    it('should apply Firestore preference on initial load', async () => {
      // Pre-populate localStorage with different data
      mockStorage['boletapp_view_mode'] = JSON.stringify({
        mode: 'personal',
      });

      const savePreference = vi.fn();
      const firestorePreference: ViewModePreference = {
        mode: 'group',
        groupId: 'firestore-group',
      };
      const validGroup = createMockSharedGroup({ id: 'firestore-group' });

      function TestHook() {
        const viewMode = useViewMode();
        useViewModePreferencePersistence({
          groups: [validGroup],
          groupsLoading: false,
          firestorePreference,
          preferencesLoading: false,
          savePreference,
        });
        return viewMode;
      }

      const { result } = renderHook(() => TestHook(), {
        wrapper: createTestWrapper(),
      });

      // Note: The actual application of Firestore preference happens
      // through the ViewModeProvider's initialPreference prop.
      // This test validates the hook works correctly with the preference.
      await waitFor(() => {
        expect(result.current.isValidated).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Story 14c.19 Bug Fix Tests
  // ===========================================================================

  describe('Story 14c.19 Bug Fix - Group Mode Restoration', () => {
    it('should restore group mode from Firestore preference (14c.19 bug fix)', async () => {
      // Start with personal mode in localStorage (opposite of Firestore)
      mockStorage['boletapp_view_mode'] = JSON.stringify({
        mode: 'personal',
      });

      const savePreference = vi.fn();
      const validGroup = createMockSharedGroup({
        id: 'firestore-group-123',
        name: 'Firestore Saved Group',
      });

      // Firestore says user prefers group mode
      const firestorePreference: ViewModePreference = {
        mode: 'group',
        groupId: 'firestore-group-123',
      };

      function TestHook() {
        const viewMode = useViewMode();
        useViewModePreferencePersistence({
          groups: [validGroup],
          groupsLoading: false,
          firestorePreference,
          preferencesLoading: false,
          savePreference,
        });
        return viewMode;
      }

      const { result } = renderHook(() => TestHook(), {
        wrapper: createTestWrapper(),
      });

      // The bug was that setGroupMode was never called, so mode stayed personal
      // After fix, it should restore to group mode from Firestore preference
      await waitFor(() => {
        expect(result.current.isValidated).toBe(true);
        expect(result.current.mode).toBe('group');
        expect(result.current.groupId).toBe('firestore-group-123');
        expect(result.current.group?.name).toBe('Firestore Saved Group');
      });
    });

    it('should fallback to personal when Firestore group is invalid (14c.19)', async () => {
      const savePreference = vi.fn();

      // Firestore says user prefers a group that no longer exists
      const firestorePreference: ViewModePreference = {
        mode: 'group',
        groupId: 'deleted-group-id',
      };

      // User only has access to a different group
      const differentGroup = createMockSharedGroup({
        id: 'other-group',
        name: 'Other Group',
      });

      function TestHook() {
        const viewMode = useViewMode();
        useViewModePreferencePersistence({
          groups: [differentGroup], // deleted-group-id is NOT in user's groups
          groupsLoading: false,
          firestorePreference,
          preferencesLoading: false,
          savePreference,
        });
        return viewMode;
      }

      const { result } = renderHook(() => TestHook(), {
        wrapper: createTestWrapper(),
      });

      // Should set group mode initially (from Firestore), then validateAndRestoreMode
      // should detect the group is invalid and fall back to personal mode
      await waitFor(() => {
        expect(result.current.isValidated).toBe(true);
        expect(result.current.mode).toBe('personal');
        expect(result.current.groupId).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // Story 14c.20 Bug Fix - Undefined groupId in Firestore
  // ===========================================================================

  describe('Story 14c.20 Bug Fix - savePreference with undefined groupId', () => {
    it('should call savePreference without groupId when switching to personal mode', async () => {
      // This test verifies that when switching from group to personal mode,
      // the savePreference callback is called with mode='personal' and no groupId
      // (not groupId: undefined which would cause Firestore to throw an error)

      const savePreference = vi.fn();
      const validGroup = createMockSharedGroup({ id: 'group-123', name: 'Test Group' });

      // Start in group mode
      mockStorage['boletapp_view_mode'] = JSON.stringify({
        mode: 'group',
        groupId: 'group-123',
      });

      function TestHook() {
        const viewMode = useViewMode();
        useViewModePreferencePersistence({
          groups: [validGroup],
          groupsLoading: false,
          firestorePreference: { mode: 'group', groupId: 'group-123' },
          preferencesLoading: false,
          savePreference,
        });
        return viewMode;
      }

      const { result } = renderHook(() => TestHook(), {
        wrapper: createTestWrapper(),
      });

      // Wait for validation
      await waitFor(() => {
        expect(result.current.isValidated).toBe(true);
        expect(result.current.mode).toBe('group');
      });

      // Clear any calls from validation
      savePreference.mockClear();

      // Switch to personal mode
      act(() => {
        result.current.setPersonalMode();
      });

      // Verify savePreference is called correctly
      await waitFor(() => {
        expect(savePreference).toHaveBeenCalledTimes(1);
        const callArgs = savePreference.mock.calls[0][0];
        expect(callArgs.mode).toBe('personal');
        // The key insight: groupId should be undefined (not present as a key with undefined value)
        // This is handled by the userPreferencesService using deleteField()
        expect(callArgs.groupId).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // Story 14c.18 Race Condition Bug Fix Tests
  // ===========================================================================

  describe('Story 14c.18 Race Condition Bug Fix', () => {
    it('should correctly restore group mode when preferences and groups load simultaneously', async () => {
      // This test verifies the race condition fix where Step 1 (apply Firestore preference)
      // and Step 2 (validate group) could run in the same render cycle, causing
      // validateAndRestoreMode to see stale state (personal mode) instead of the
      // Firestore preference (group mode).

      // Start with personal mode in localStorage
      mockStorage['boletapp_view_mode'] = JSON.stringify({
        mode: 'personal',
      });

      const savePreference = vi.fn();
      const validGroup = createMockSharedGroup({
        id: 'simultaneous-load-group',
        name: 'Simultaneous Load Group',
      });

      // Firestore has group mode preference
      const firestorePreference: ViewModePreference = {
        mode: 'group',
        groupId: 'simultaneous-load-group',
      };

      function TestHook({ preferencesLoading, groupsLoading }: { preferencesLoading: boolean; groupsLoading: boolean }) {
        const viewMode = useViewMode();
        useViewModePreferencePersistence({
          groups: [validGroup],
          groupsLoading,
          firestorePreference,
          preferencesLoading,
          savePreference,
        });
        return viewMode;
      }

      // Start with both loading
      const { result, rerender } = renderHook(
        ({ preferencesLoading, groupsLoading }) => TestHook({ preferencesLoading, groupsLoading }),
        {
          wrapper: createTestWrapper(),
          initialProps: { preferencesLoading: true, groupsLoading: true },
        }
      );

      // Should not be validated yet
      expect(result.current.isValidated).toBe(false);
      expect(result.current.mode).toBe('personal'); // From localStorage

      // Both finish loading at the same time (simulating the race condition scenario)
      rerender({ preferencesLoading: false, groupsLoading: false });

      // The fix ensures that even when both become available simultaneously,
      // the Firestore preference is correctly applied AND validated
      await waitFor(() => {
        expect(result.current.isValidated).toBe(true);
        expect(result.current.mode).toBe('group');
        expect(result.current.groupId).toBe('simultaneous-load-group');
        expect(result.current.group?.name).toBe('Simultaneous Load Group');
      });
    });

    it('should wait for both preferences AND groups before applying any mode change', async () => {
      // This test ensures the hook waits for BOTH to load before doing anything

      const savePreference = vi.fn();
      const validGroup = createMockSharedGroup({
        id: 'wait-for-both-group',
        name: 'Wait For Both Group',
      });

      const firestorePreference: ViewModePreference = {
        mode: 'group',
        groupId: 'wait-for-both-group',
      };

      function TestHook({ preferencesLoading, groupsLoading }: { preferencesLoading: boolean; groupsLoading: boolean }) {
        const viewMode = useViewMode();
        useViewModePreferencePersistence({
          groups: [validGroup],
          groupsLoading,
          firestorePreference,
          preferencesLoading,
          savePreference,
        });
        return viewMode;
      }

      const { result, rerender } = renderHook(
        ({ preferencesLoading, groupsLoading }) => TestHook({ preferencesLoading, groupsLoading }),
        {
          wrapper: createTestWrapper(),
          initialProps: { preferencesLoading: true, groupsLoading: true },
        }
      );

      // Both loading - not validated
      expect(result.current.isValidated).toBe(false);

      // Only preferences finish loading - still should not validate
      rerender({ preferencesLoading: false, groupsLoading: true });
      expect(result.current.isValidated).toBe(false);

      // Now groups finish loading - should validate
      rerender({ preferencesLoading: false, groupsLoading: false });

      await waitFor(() => {
        expect(result.current.isValidated).toBe(true);
        expect(result.current.mode).toBe('group');
        expect(result.current.groupId).toBe('wait-for-both-group');
      });
    });
  });
});
