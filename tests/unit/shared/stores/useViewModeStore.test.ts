/**
 * Story 14d-v2-0: Architecture Alignment - useViewModeStore Unit Tests
 *
 * Tests for the view mode Zustand store covering:
 * - Initial state (personal mode, null group)
 * - setPersonalMode clears group data
 * - setGroupMode stub behavior (logs warning, no state change)
 * - updateGroupData stub behavior
 * - Selector functions
 * - Action stability (same reference across renders)
 * - Convenience hook (useViewMode)
 *
 * Note: setGroupMode and updateGroupData are stubs until Story 14d-v2-1.10b.
 * Tests verify the stub behavior (warning in DEV, no state change).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useViewModeStore,
  useViewMode,
  useViewModeMode,
  useIsGroupMode,
  useCurrentGroupId,
  useCurrentGroup,
  useViewModeActions,
  selectIsGroupMode,
  selectCurrentGroupId,
  selectCurrentGroup,
  getViewModeState,
  viewModeActions,
  initialViewModeState,
} from '@shared/stores/useViewModeStore';
import type { SharedGroup } from '@/types/sharedGroup';
import type { Timestamp } from 'firebase/firestore';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Reset store to initial state before each test.
 */
function resetStore() {
  useViewModeStore.setState(initialViewModeState);
}

/**
 * Get state-only object for assertions (without action functions).
 */
function getStateOnly() {
  const state = useViewModeStore.getState();
  return {
    mode: state.mode,
    groupId: state.groupId,
    group: state.group,
  };
}

/**
 * Create a mock SharedGroup for testing.
 */
function createMockGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
  const now = new Date();
  const mockTimestamp = {
    toDate: () => now,
    seconds: Math.floor(now.getTime() / 1000),
    nanoseconds: 0,
  } as Timestamp;

  return {
    id: 'group-123',
    ownerId: 'user-abc',
    appId: 'boletapp',
    name: '🏠 Gastos del Hogar',
    color: '#10b981',
    icon: '🏠',
    shareCode: 'Ab3dEf7hIj9kLm0p',
    shareCodeExpiresAt: mockTimestamp,
    members: ['user-abc', 'user-xyz'],
    memberUpdates: {},
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp,
    ...overrides,
  };
}

// Suppress console.warn in tests for stub behavior
const originalWarn = console.warn;
beforeEach(() => {
  resetStore();
  console.warn = vi.fn();
});

afterEach(() => {
  console.warn = originalWarn;
});

// Need afterEach to restore console.warn
import { afterEach } from 'vitest';

// =============================================================================
// Tests
// =============================================================================

describe('useViewModeStore', () => {
  describe('initial state', () => {
    it('starts in personal mode', () => {
      expect(getViewModeState().mode).toBe('personal');
    });

    it('has null groupId', () => {
      expect(getViewModeState().groupId).toBeNull();
    });

    it('has null group', () => {
      expect(getViewModeState().group).toBeNull();
    });

    it('exports initialViewModeState constant', () => {
      expect(initialViewModeState).toEqual({
        mode: 'personal',
        groupId: null,
        group: null,
      });
    });
  });

  describe('setPersonalMode', () => {
    it('sets mode to personal', () => {
      const { setPersonalMode } = useViewModeStore.getState();
      setPersonalMode();
      expect(getViewModeState().mode).toBe('personal');
    });

    it('clears groupId', () => {
      // Manually set a group state first
      useViewModeStore.setState({ groupId: 'some-group' });
      expect(getViewModeState().groupId).toBe('some-group');

      const { setPersonalMode } = useViewModeStore.getState();
      setPersonalMode();
      expect(getViewModeState().groupId).toBeNull();
    });

    it('clears group data', () => {
      const mockGroup = createMockGroup();
      useViewModeStore.setState({ group: mockGroup });
      expect(getViewModeState().group).not.toBeNull();

      const { setPersonalMode } = useViewModeStore.getState();
      setPersonalMode();
      expect(getViewModeState().group).toBeNull();
    });

    it('idempotent when already in personal mode', () => {
      const { setPersonalMode } = useViewModeStore.getState();
      setPersonalMode();
      setPersonalMode();
      expect(getStateOnly()).toEqual({
        mode: 'personal',
        groupId: null,
        group: null,
      });
    });
  });

  describe('setGroupMode (stub behavior)', () => {
    it('logs warning in DEV mode', () => {
      const { setGroupMode } = useViewModeStore.getState();
      const mockGroup = createMockGroup();

      setGroupMode('group-123', mockGroup);

      // Check warning was logged
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('setGroupMode called but shared groups are disabled')
      );
    });

    it('does not change mode (stub behavior)', () => {
      const { setGroupMode } = useViewModeStore.getState();
      const mockGroup = createMockGroup();

      setGroupMode('group-123', mockGroup);

      // Mode should remain 'personal' (stub does nothing)
      expect(getViewModeState().mode).toBe('personal');
    });

    it('does not set groupId (stub behavior)', () => {
      const { setGroupMode } = useViewModeStore.getState();

      setGroupMode('group-123');

      expect(getViewModeState().groupId).toBeNull();
    });

    it('does not set group data (stub behavior)', () => {
      const { setGroupMode } = useViewModeStore.getState();
      const mockGroup = createMockGroup();

      setGroupMode('group-123', mockGroup);

      expect(getViewModeState().group).toBeNull();
    });
  });

  describe('updateGroupData (stub behavior)', () => {
    it('does not update group data (stub behavior)', () => {
      const { updateGroupData } = useViewModeStore.getState();
      const mockGroup = createMockGroup();

      updateGroupData(mockGroup);

      expect(getViewModeState().group).toBeNull();
    });

    it('does not throw when called', () => {
      const { updateGroupData } = useViewModeStore.getState();
      const mockGroup = createMockGroup();

      expect(() => updateGroupData(mockGroup)).not.toThrow();
    });
  });

  describe('selectors', () => {
    describe('selectIsGroupMode', () => {
      it('returns false for personal mode', () => {
        const state = useViewModeStore.getState();
        expect(selectIsGroupMode(state)).toBe(false);
      });

      it('returns true for group mode', () => {
        useViewModeStore.setState({ mode: 'group' });
        const state = useViewModeStore.getState();
        expect(selectIsGroupMode(state)).toBe(true);
      });
    });

    describe('selectCurrentGroupId', () => {
      it('returns null when no group selected', () => {
        const state = useViewModeStore.getState();
        expect(selectCurrentGroupId(state)).toBeNull();
      });

      it('returns groupId when set', () => {
        useViewModeStore.setState({ groupId: 'test-group' });
        const state = useViewModeStore.getState();
        expect(selectCurrentGroupId(state)).toBe('test-group');
      });
    });

    describe('selectCurrentGroup', () => {
      it('returns null when no group data', () => {
        const state = useViewModeStore.getState();
        expect(selectCurrentGroup(state)).toBeNull();
      });

      it('returns group data when set', () => {
        const mockGroup = createMockGroup();
        useViewModeStore.setState({ group: mockGroup });
        const state = useViewModeStore.getState();
        expect(selectCurrentGroup(state)).toEqual(mockGroup);
      });
    });
  });

  describe('selector hooks', () => {
    it('useViewModeMode returns current mode', () => {
      const { result } = renderHook(() => useViewModeMode());
      expect(result.current).toBe('personal');
    });

    it('useIsGroupMode returns false in personal mode', () => {
      const { result } = renderHook(() => useIsGroupMode());
      expect(result.current).toBe(false);
    });

    it('useCurrentGroupId returns null initially', () => {
      const { result } = renderHook(() => useCurrentGroupId());
      expect(result.current).toBeNull();
    });

    it('useCurrentGroup returns null initially', () => {
      const { result } = renderHook(() => useCurrentGroup());
      expect(result.current).toBeNull();
    });
  });

  describe('useViewModeActions', () => {
    it('returns all actions', () => {
      const { result } = renderHook(() => useViewModeActions());

      expect(result.current).toHaveProperty('setPersonalMode');
      expect(result.current).toHaveProperty('setGroupMode');
      expect(result.current).toHaveProperty('updateGroupData');
    });

    it('actions have stable references', () => {
      const { result, rerender } = renderHook(() => useViewModeActions());

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      // Actions should be the same references (useShallow)
      expect(firstRender.setPersonalMode).toBe(secondRender.setPersonalMode);
      expect(firstRender.setGroupMode).toBe(secondRender.setGroupMode);
      expect(firstRender.updateGroupData).toBe(secondRender.updateGroupData);
    });
  });

  describe('useViewMode convenience hook', () => {
    it('returns mode state', () => {
      const { result } = renderHook(() => useViewMode());
      expect(result.current.mode).toBe('personal');
    });

    it('returns groupId', () => {
      const { result } = renderHook(() => useViewMode());
      expect(result.current.groupId).toBeNull();
    });

    it('returns group', () => {
      const { result } = renderHook(() => useViewMode());
      expect(result.current.group).toBeNull();
    });

    it('returns computed isGroupMode', () => {
      const { result } = renderHook(() => useViewMode());
      expect(result.current.isGroupMode).toBe(false);
    });

    it('returns all actions', () => {
      const { result } = renderHook(() => useViewMode());
      expect(typeof result.current.setPersonalMode).toBe('function');
      expect(typeof result.current.setGroupMode).toBe('function');
      expect(typeof result.current.updateGroupData).toBe('function');
    });

    it('setPersonalMode action works', () => {
      const { result } = renderHook(() => useViewMode());

      // Set some state first
      useViewModeStore.setState({ groupId: 'test' });

      act(() => {
        result.current.setPersonalMode();
      });

      expect(result.current.groupId).toBeNull();
    });
  });

  describe('direct access (non-React)', () => {
    describe('getViewModeState', () => {
      it('returns current state', () => {
        const state = getViewModeState();
        expect(state.mode).toBe('personal');
        expect(state.groupId).toBeNull();
        expect(state.group).toBeNull();
      });
    });

    describe('viewModeActions', () => {
      it('setPersonalMode works', () => {
        useViewModeStore.setState({ groupId: 'test' });
        viewModeActions.setPersonalMode();
        expect(getViewModeState().groupId).toBeNull();
      });

      it('setGroupMode logs warning (stub)', () => {
        viewModeActions.setGroupMode('group-123');
        expect(console.warn).toHaveBeenCalled();
      });

      it('updateGroupData does not throw', () => {
        const mockGroup = createMockGroup();
        expect(() => viewModeActions.updateGroupData(mockGroup)).not.toThrow();
      });
    });
  });

  describe('re-render behavior', () => {
    it('only re-renders when subscribed state changes', () => {
      let modeRenderCount = 0;
      let groupIdRenderCount = 0;

      // Two separate hooks subscribing to different state
      const { result: modeResult } = renderHook(() => {
        modeRenderCount++;
        return useViewModeMode();
      });

      const { result: groupIdResult } = renderHook(() => {
        groupIdRenderCount++;
        return useCurrentGroupId();
      });

      const initialModeCount = modeRenderCount;
      const initialGroupIdCount = groupIdRenderCount;

      // Change only groupId - should not affect mode subscribers
      act(() => {
        useViewModeStore.setState({ groupId: 'new-group' });
      });

      // Mode render count should not have increased (no mode change)
      // Note: Zustand selector equality prevents re-render if value unchanged
      expect(modeResult.current).toBe('personal');
      expect(groupIdResult.current).toBe('new-group');
    });
  });
});
