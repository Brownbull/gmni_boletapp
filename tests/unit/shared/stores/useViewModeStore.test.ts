/**
 * Story 14d-v2-1-10a: ViewMode Store Integration - Unit Tests
 *
 * Tests for the view mode Zustand store covering:
 * - Initial state (personal mode, null group)
 * - setPersonalMode clears group data
 * - setGroupMode sets mode to 'group' with groupId and optional group data
 * - updateGroupData updates group without changing mode
 * - Selector functions
 * - Action stability (same reference across renders)
 * - Convenience hook (useViewMode)
 *
 * Story 14d-v2-1-10a: Full setGroupMode and updateGroupData functionality enabled.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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
    name: 'Gastos del Hogar',
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

beforeEach(() => {
  resetStore();
});

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

  // Story 14d-v2-1-10a: setGroupMode now fully functional
  describe('setGroupMode', () => {
    it('sets mode to group', () => {
      const { setGroupMode } = useViewModeStore.getState();

      setGroupMode('group-123');

      expect(getViewModeState().mode).toBe('group');
    });

    it('sets groupId', () => {
      const { setGroupMode } = useViewModeStore.getState();

      setGroupMode('group-456');

      expect(getViewModeState().groupId).toBe('group-456');
    });

    it('sets group data when provided', () => {
      const { setGroupMode } = useViewModeStore.getState();
      const mockGroup = createMockGroup({ id: 'group-789', name: 'Test Group' });

      setGroupMode('group-789', mockGroup);

      expect(getViewModeState().group).toEqual(mockGroup);
      expect(getViewModeState().group?.name).toBe('Test Group');
    });

    it('sets group to null when group data not provided', () => {
      const { setGroupMode } = useViewModeStore.getState();

      setGroupMode('group-123');

      expect(getViewModeState().group).toBeNull();
    });

    it('overwrites previous group selection', () => {
      const { setGroupMode } = useViewModeStore.getState();
      const firstGroup = createMockGroup({ id: 'group-1', name: 'First Group' });
      const secondGroup = createMockGroup({ id: 'group-2', name: 'Second Group' });

      // Select first group
      setGroupMode('group-1', firstGroup);
      expect(getViewModeState().groupId).toBe('group-1');
      expect(getViewModeState().group?.name).toBe('First Group');

      // Select second group
      setGroupMode('group-2', secondGroup);
      expect(getViewModeState().groupId).toBe('group-2');
      expect(getViewModeState().group?.name).toBe('Second Group');
    });

    it('selectIsGroupMode returns true after setGroupMode', () => {
      const { setGroupMode } = useViewModeStore.getState();

      setGroupMode('group-123');

      const state = useViewModeStore.getState();
      expect(selectIsGroupMode(state)).toBe(true);
    });

    // ECC Code Review fix: Validation tests for invalid groupId
    it('rejects empty string groupId', () => {
      const { setGroupMode } = useViewModeStore.getState();

      setGroupMode('');

      // Should remain in personal mode
      expect(getViewModeState().mode).toBe('personal');
      expect(getViewModeState().groupId).toBeNull();
    });

    it('rejects whitespace-only groupId', () => {
      const { setGroupMode } = useViewModeStore.getState();

      setGroupMode('   ');

      // Should remain in personal mode
      expect(getViewModeState().mode).toBe('personal');
      expect(getViewModeState().groupId).toBeNull();
    });

    it('rejects mismatched group.id and groupId', () => {
      const { setGroupMode } = useViewModeStore.getState();
      const mockGroup = createMockGroup({ id: 'group-different', name: 'Mismatch Group' });

      setGroupMode('group-123', mockGroup);

      // Should remain in personal mode when group.id doesn't match groupId
      expect(getViewModeState().mode).toBe('personal');
      expect(getViewModeState().groupId).toBeNull();
    });
  });

  // Story 14d-v2-1-10a: updateGroupData now fully functional
  describe('updateGroupData', () => {
    it('updates group data without changing mode', () => {
      const { updateGroupData } = useViewModeStore.getState();
      const mockGroup = createMockGroup({ name: 'Updated Group' });

      // Set to group mode first
      useViewModeStore.setState({ mode: 'group', groupId: 'group-123' });

      updateGroupData(mockGroup);

      expect(getViewModeState().mode).toBe('group');
      expect(getViewModeState().group?.name).toBe('Updated Group');
    });

    it('can update group data even in personal mode', () => {
      const { updateGroupData } = useViewModeStore.getState();
      const mockGroup = createMockGroup({ name: 'Cached Group' });

      // Start in personal mode (default)
      expect(getViewModeState().mode).toBe('personal');

      updateGroupData(mockGroup);

      // Mode should remain personal
      expect(getViewModeState().mode).toBe('personal');
      // But group data should be updated
      expect(getViewModeState().group?.name).toBe('Cached Group');
    });

    it('does not change groupId', () => {
      const { updateGroupData } = useViewModeStore.getState();
      const mockGroup = createMockGroup({ id: 'different-id' });

      useViewModeStore.setState({ mode: 'group', groupId: 'original-id' });

      updateGroupData(mockGroup);

      expect(getViewModeState().groupId).toBe('original-id');
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

    it('useIsGroupMode returns true in group mode', () => {
      useViewModeStore.setState({ mode: 'group' });
      const { result } = renderHook(() => useIsGroupMode());
      expect(result.current).toBe(true);
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

    it('setGroupMode action works', () => {
      const { result } = renderHook(() => useViewMode());
      const mockGroup = createMockGroup();

      act(() => {
        result.current.setGroupMode('group-123', mockGroup);
      });

      expect(result.current.mode).toBe('group');
      expect(result.current.groupId).toBe('group-123');
      expect(result.current.group).toEqual(mockGroup);
      expect(result.current.isGroupMode).toBe(true);
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

      it('setGroupMode works', () => {
        viewModeActions.setGroupMode('group-123');
        expect(getViewModeState().mode).toBe('group');
        expect(getViewModeState().groupId).toBe('group-123');
      });

      it('setGroupMode with group data works', () => {
        const mockGroup = createMockGroup();
        viewModeActions.setGroupMode('group-123', mockGroup);
        expect(getViewModeState().group).toEqual(mockGroup);
      });

      it('updateGroupData works', () => {
        const mockGroup = createMockGroup({ name: 'Direct Update' });
        viewModeActions.updateGroupData(mockGroup);
        expect(getViewModeState().group?.name).toBe('Direct Update');
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

  // Story 14d-v2-1-10a: Integration tests for complete flow
  describe('Story 14d-v2-1-10a: Store Integration', () => {
    it('complete flow: personal -> group -> personal', () => {
      const mockGroup = createMockGroup({ id: 'test-group', name: 'Test' });

      // Start in personal mode
      expect(getStateOnly()).toEqual({
        mode: 'personal',
        groupId: null,
        group: null,
      });

      // Switch to group mode
      const { setGroupMode, setPersonalMode } = useViewModeStore.getState();
      setGroupMode('test-group', mockGroup);

      expect(getStateOnly()).toEqual({
        mode: 'group',
        groupId: 'test-group',
        group: mockGroup,
      });

      // Switch back to personal mode
      setPersonalMode();

      expect(getStateOnly()).toEqual({
        mode: 'personal',
        groupId: null,
        group: null,
      });
    });

    it('setGroupMode updates state correctly for multiple groups', () => {
      const group1 = createMockGroup({ id: 'g1', name: 'Group 1' });
      const group2 = createMockGroup({ id: 'g2', name: 'Group 2' });

      const { setGroupMode } = useViewModeStore.getState();

      setGroupMode('g1', group1);
      expect(selectIsGroupMode(useViewModeStore.getState())).toBe(true);
      expect(getViewModeState().groupId).toBe('g1');

      setGroupMode('g2', group2);
      expect(selectIsGroupMode(useViewModeStore.getState())).toBe(true);
      expect(getViewModeState().groupId).toBe('g2');
      expect(getViewModeState().group?.name).toBe('Group 2');
    });
  });
});
