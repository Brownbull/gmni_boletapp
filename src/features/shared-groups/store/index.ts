/**
 * Store barrel export for shared-groups feature
 *
 * Re-exports stores for feature encapsulation.
 * Created in Story 14d-v2-0: Architecture Alignment
 * Extended in Story TD-14d-1: Zustand Migration for useGroupDialogs
 */

// Re-export ViewModeStore from shared stores
export {
  useViewModeStore,
  useViewMode,
  selectIsGroupMode,
  selectCurrentGroupId,
  selectCurrentGroup,
} from '@/shared/stores/useViewModeStore';

export type {
  ViewMode,
  ViewModeState,
  ViewModeActions,
  ViewModeStore,
} from '@/shared/stores/useViewModeStore';

// Re-export GroupDialogsStore
export {
  useGroupDialogsStore,
  initialGroupDialogsState,
  getGroupDialogsState,
  groupDialogsActions,
} from './useGroupDialogsStore';

export type {
  GroupDialogsState,
  GroupDialogsActions,
  GroupDialogsStore,
} from './useGroupDialogsStore';
