/**
 * Story 14d-v2-1-10a: ViewMode Store Integration
 *
 * Zustand store for view mode state management, replacing ViewModeContext.
 * Follows the pattern established in Epic 14e (ADR-018: Zustand-only state management).
 *
 * State includes:
 * - Current view mode ('personal' or 'group')
 * - Selected group ID
 * - Cached group data
 *
 * Story 14d-v2-1-10a: setGroupMode and updateGroupData fully enabled.
 *
 * Architecture Reference:
 * - Atlas 04-architecture.md: Zustand Store Pattern (Epic 14e)
 * - Story 14c-refactor.13: View mode state unification
 * - ViewModeContext.tsx (replaced by this store)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { SharedGroup } from '@/types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

/**
 * View mode type - either personal or group
 */
export type ViewMode = 'personal' | 'group';

/**
 * View mode store state.
 */
export interface ViewModeState {
  /** Current view mode */
  mode: ViewMode;
  /** Selected group ID when in group mode */
  groupId: string | null;
  /** Cached group data for display */
  group: SharedGroup | null;
}

/**
 * View mode store actions.
 */
export interface ViewModeActions {
  /**
   * Switch to personal mode.
   * Clears any group selection.
   */
  setPersonalMode: () => void;

  /**
   * Switch to group mode.
   *
   * Story 14d-v2-1-10a: Fully functional.
   *
   * @param groupId - The shared group ID
   * @param group - Optional group data for display
   */
  setGroupMode: (groupId: string, group?: SharedGroup) => void;

  /**
   * Update cached group data without changing mode.
   *
   * Story 14d-v2-1-10a: Fully functional.
   *
   * @param group - Updated group data
   */
  updateGroupData: (group: SharedGroup) => void;
}

/**
 * Combined view mode store type.
 */
export type ViewModeStore = ViewModeState & ViewModeActions;

// =============================================================================
// Initial State
// =============================================================================

/**
 * Initial view mode state - always personal mode.
 */
export const initialViewModeState: ViewModeState = {
  mode: 'personal',
  groupId: null,
  group: null,
};

// =============================================================================
// Store Definition
// =============================================================================

export const useViewModeStore = create<ViewModeStore>()(
  devtools(
    (set) => ({
      // Initial state
      ...initialViewModeState,

      // Actions
      setPersonalMode: () =>
        set(
          { mode: 'personal', groupId: null, group: null },
          false,
          'viewMode/setPersonalMode'
        ),

      // Story 14d-v2-1-10a: setGroupMode fully enabled
      setGroupMode: (groupId, group) => {
        // Validate groupId to prevent invalid state (ECC Code Review fix)
        if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
          if (import.meta.env.DEV) {
            console.warn('[ViewModeStore] setGroupMode called with invalid groupId');
          }
          return;
        }
        // Validate group.id matches groupId if group is provided
        if (group && group.id && group.id !== groupId) {
          if (import.meta.env.DEV) {
            console.warn('[ViewModeStore] setGroupMode: group.id does not match groupId');
          }
          return;
        }
        set(
          { mode: 'group', groupId, group: group ?? null },
          false,
          'viewMode/setGroupMode'
        );
      },

      // Story 14d-v2-1-10a: updateGroupData fully enabled
      updateGroupData: (group) =>
        set({ group }, false, 'viewMode/updateGroupData'),
    }),
    { name: 'view-mode-store', enabled: import.meta.env.DEV }
  )
);

// =============================================================================
// Selectors (prevent unnecessary re-renders)
// =============================================================================

/**
 * Selector: Check if currently in group mode.
 */
export const selectIsGroupMode = (state: ViewModeStore) => state.mode === 'group';

/**
 * Selector: Get current group ID (null if personal mode).
 */
export const selectCurrentGroupId = (state: ViewModeStore) => state.groupId;

/**
 * Selector: Get current group data (null if personal mode).
 */
export const selectCurrentGroup = (state: ViewModeStore) => state.group;

// =============================================================================
// Typed Selector Hooks
// =============================================================================

/** Get current view mode */
export const useViewModeMode = () => useViewModeStore((s) => s.mode);

/** Check if in group mode */
export const useIsGroupMode = () => useViewModeStore(selectIsGroupMode);

/** Get current group ID */
export const useCurrentGroupId = () => useViewModeStore(selectCurrentGroupId);

/** Get current group data */
export const useCurrentGroup = () => useViewModeStore(selectCurrentGroup);

/** Get view mode actions (stable reference via useShallow) */
export const useViewModeActions = () =>
  useViewModeStore(
    useShallow((s) => ({
      setPersonalMode: s.setPersonalMode,
      setGroupMode: s.setGroupMode,
      updateGroupData: s.updateGroupData,
    }))
  );

// =============================================================================
// Convenience Hook (API compatible with ViewModeContext)
// =============================================================================

/**
 * Convenience hook combining view mode state and actions.
 *
 * API compatible with the old useViewMode() from ViewModeContext.
 * Provides the same interface for easy migration.
 *
 * @example
 * ```tsx
 * const { mode, isGroupMode, setPersonalMode, setGroupMode } = useViewMode();
 *
 * // Switch between personal and group modes
 * setGroupMode('group-123', groupData);
 * console.log(mode); // 'group'
 * console.log(isGroupMode); // true
 * ```
 */
export function useViewMode() {
  return useViewModeStore(
    useShallow((s) => ({
      // State
      mode: s.mode,
      groupId: s.groupId,
      group: s.group,

      // Computed
      isGroupMode: s.mode === 'group',

      // Actions
      setPersonalMode: s.setPersonalMode,
      setGroupMode: s.setGroupMode,
      updateGroupData: s.updateGroupData,
    }))
  );
}

// =============================================================================
// Direct Access (for non-React code)
// =============================================================================

/**
 * Get current view mode state directly (non-reactive).
 * Use only in services or other non-React contexts.
 */
export const getViewModeState = () => useViewModeStore.getState();

/**
 * View mode actions for non-React code.
 */
export const viewModeActions = {
  setPersonalMode: () => useViewModeStore.getState().setPersonalMode(),
  setGroupMode: (groupId: string, group?: SharedGroup) =>
    useViewModeStore.getState().setGroupMode(groupId, group),
  updateGroupData: (group: SharedGroup) =>
    useViewModeStore.getState().updateGroupData(group),
};
