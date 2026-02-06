/**
 * Story 14d-v2-1-10d: useViewModeFilterSync Hook Tests
 *
 * Tests for the hook that syncs filter actions when view mode changes.
 * This hook is used to auto-clear filters when switching between personal/group modes.
 *
 * Test Cases:
 * - Does NOT call onModeChange on initial mount
 * - Calls onModeChange when mode changes from personal to group
 * - Calls onModeChange when mode changes from group to personal
 * - Does NOT call onModeChange when mode stays the same
 * - Handles multiple mode changes correctly
 * - Uses stable callback reference (no infinite loops)
 *
 * Architecture Reference:
 * - Story 14d-v2-1-10d: History Filters and View Mode Integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewModeFilterSync } from '@/hooks/useViewModeFilterSync';
import {
  useViewModeStore,
  initialViewModeState,
} from '@shared/stores/useViewModeStore';

// =============================================================================
// Test Setup
// =============================================================================

/**
 * Reset store to initial state before each test.
 */
function resetStore() {
  useViewModeStore.setState(initialViewModeState);
}

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
});

// =============================================================================
// Tests
// =============================================================================

describe('useViewModeFilterSync', () => {
  describe('initial mount behavior', () => {
    it('does NOT call onModeChange on initial mount', () => {
      const onModeChange = vi.fn();

      renderHook(() => useViewModeFilterSync(onModeChange));

      // Callback should NOT be called on initial mount
      expect(onModeChange).not.toHaveBeenCalled();
    });

    it('does NOT call onModeChange on initial mount even in group mode', () => {
      // Set up group mode BEFORE mounting the hook
      useViewModeStore.setState({ mode: 'group', groupId: 'test-group' });

      const onModeChange = vi.fn();

      renderHook(() => useViewModeFilterSync(onModeChange));

      // Callback should NOT be called on initial mount regardless of current mode
      expect(onModeChange).not.toHaveBeenCalled();
    });
  });

  describe('mode change detection', () => {
    it('calls onModeChange when mode changes from personal to group', () => {
      const onModeChange = vi.fn();

      renderHook(() => useViewModeFilterSync(onModeChange));

      // Initial mount - should not call
      expect(onModeChange).not.toHaveBeenCalled();

      // Change from personal to group
      act(() => {
        useViewModeStore.getState().setGroupMode('group-123');
      });

      // Now it should be called
      expect(onModeChange).toHaveBeenCalledTimes(1);
    });

    it('calls onModeChange when mode changes from group to personal', () => {
      // Start in group mode
      useViewModeStore.setState({ mode: 'group', groupId: 'test-group' });

      const onModeChange = vi.fn();

      renderHook(() => useViewModeFilterSync(onModeChange));

      // Initial mount - should not call
      expect(onModeChange).not.toHaveBeenCalled();

      // Change from group to personal
      act(() => {
        useViewModeStore.getState().setPersonalMode();
      });

      // Now it should be called
      expect(onModeChange).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onModeChange when mode stays the same (personal to personal)', () => {
      const onModeChange = vi.fn();

      renderHook(() => useViewModeFilterSync(onModeChange));

      // Call setPersonalMode when already in personal mode
      act(() => {
        useViewModeStore.getState().setPersonalMode();
      });

      // Should NOT be called - mode didn't change
      expect(onModeChange).not.toHaveBeenCalled();
    });

    it('does NOT call onModeChange when switching between groups (group to group)', () => {
      // Start in group mode with group-1
      useViewModeStore.setState({ mode: 'group', groupId: 'group-1' });

      const onModeChange = vi.fn();

      renderHook(() => useViewModeFilterSync(onModeChange));

      // Switch to another group (still in group mode)
      act(() => {
        useViewModeStore.getState().setGroupMode('group-2');
      });

      // Should NOT be called - mode is still 'group'
      expect(onModeChange).not.toHaveBeenCalled();
    });
  });

  describe('multiple mode changes', () => {
    it('handles multiple mode changes correctly', () => {
      const onModeChange = vi.fn();

      renderHook(() => useViewModeFilterSync(onModeChange));

      // Initial - no call
      expect(onModeChange).toHaveBeenCalledTimes(0);

      // Change 1: personal -> group
      act(() => {
        useViewModeStore.getState().setGroupMode('group-1');
      });
      expect(onModeChange).toHaveBeenCalledTimes(1);

      // Change 2: group -> personal
      act(() => {
        useViewModeStore.getState().setPersonalMode();
      });
      expect(onModeChange).toHaveBeenCalledTimes(2);

      // Change 3: personal -> group
      act(() => {
        useViewModeStore.getState().setGroupMode('group-2');
      });
      expect(onModeChange).toHaveBeenCalledTimes(3);

      // Change 4: group -> personal
      act(() => {
        useViewModeStore.getState().setPersonalMode();
      });
      expect(onModeChange).toHaveBeenCalledTimes(4);
    });

    it('does not call for non-mode-changing operations between changes', () => {
      const onModeChange = vi.fn();

      renderHook(() => useViewModeFilterSync(onModeChange));

      // Change to group mode
      act(() => {
        useViewModeStore.getState().setGroupMode('group-1');
      });
      expect(onModeChange).toHaveBeenCalledTimes(1);

      // Update group data (not a mode change)
      act(() => {
        useViewModeStore.setState({ group: { id: 'group-1', name: 'Test' } as any });
      });
      expect(onModeChange).toHaveBeenCalledTimes(1); // Still 1

      // Switch to another group (still group mode)
      act(() => {
        useViewModeStore.getState().setGroupMode('group-2');
      });
      expect(onModeChange).toHaveBeenCalledTimes(1); // Still 1

      // Now change to personal
      act(() => {
        useViewModeStore.getState().setPersonalMode();
      });
      expect(onModeChange).toHaveBeenCalledTimes(2); // Now 2
    });
  });

  describe('callback stability', () => {
    it('uses stable callback reference (no infinite loops)', () => {
      let renderCount = 0;
      const onModeChange = vi.fn();

      const { rerender } = renderHook(() => {
        renderCount++;
        useViewModeFilterSync(onModeChange);
      });

      // Initial render
      expect(renderCount).toBeGreaterThanOrEqual(1);
      const initialRenderCount = renderCount;

      // Rerender without mode change
      rerender();

      // Should not cause excessive re-renders
      // Allow for up to 2 renders per rerender call (strict mode)
      expect(renderCount).toBeLessThanOrEqual(initialRenderCount + 2);

      // Change mode
      act(() => {
        useViewModeStore.getState().setGroupMode('group-1');
      });

      // Callback should be called exactly once
      expect(onModeChange).toHaveBeenCalledTimes(1);

      // Should not cause infinite loop
      expect(renderCount).toBeLessThan(20); // Sanity check
    });

    it('handles callback prop changes correctly', () => {
      const onModeChange1 = vi.fn();
      const onModeChange2 = vi.fn();

      const { rerender } = renderHook(
        ({ callback }) => useViewModeFilterSync(callback),
        { initialProps: { callback: onModeChange1 } }
      );

      // Change callback
      rerender({ callback: onModeChange2 });

      // Change mode - should call the new callback
      act(() => {
        useViewModeStore.getState().setGroupMode('group-1');
      });

      // New callback should be called
      expect(onModeChange2).toHaveBeenCalledTimes(1);
      // Old callback should not be called for this change
      expect(onModeChange1).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('works correctly when unmounted and remounted', () => {
      const onModeChange = vi.fn();

      const { unmount } = renderHook(() => useViewModeFilterSync(onModeChange));

      // Change mode
      act(() => {
        useViewModeStore.getState().setGroupMode('group-1');
      });
      expect(onModeChange).toHaveBeenCalledTimes(1);

      // Unmount
      unmount();

      // Change mode after unmount (should not call)
      act(() => {
        useViewModeStore.getState().setPersonalMode();
      });

      // Callback should still be at 1 (not called after unmount)
      expect(onModeChange).toHaveBeenCalledTimes(1);

      // Remount
      const onModeChange2 = vi.fn();
      renderHook(() => useViewModeFilterSync(onModeChange2));

      // Should not call on mount
      expect(onModeChange2).not.toHaveBeenCalled();

      // Change mode again
      act(() => {
        useViewModeStore.getState().setGroupMode('group-2');
      });

      // New hook should detect the change
      expect(onModeChange2).toHaveBeenCalledTimes(1);
    });
  });
});
