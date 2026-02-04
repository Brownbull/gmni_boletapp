/**
 * Hooks barrel export for shared-groups feature
 *
 * Story 14d-v2-1-4b: Service & Hook Layer
 * Story 14d-v2-1-7d: Leave/Transfer Flow Hook
 * TanStack Query hooks for shared group operations
 */

// Story 14d-v2-1-4b: Group hooks
// Story 14d-v2-1-7g: Edit Group Settings
export {
  useGroups,
  useGroupCount,
  useCreateGroup,
  useCanCreateGroup,
  useUpdateGroup,
} from './useGroups';

export type {
  CreateGroupInput,
  UseGroupsResult,
  UseGroupCountResult,
  UseCreateGroupResult,
  UpdateGroupInput,
  UseUpdateGroupResult,
} from './useGroups';

// Story 14d-v2-1-7d: Leave/Transfer Flow Hook
export { useLeaveTransferFlow } from './useLeaveTransferFlow';

export type {
  LeaveMode,
  UseLeaveTransferFlowOptions,
  UseLeaveTransferFlowReturn,
} from './useLeaveTransferFlow';

// Story TD-14d-1: Dialog State Management Hook (Zustand store)
export { useGroupDialogs } from './useGroupDialogs';
export type { UseGroupDialogsReturn } from './useGroupDialogs';

// Types now come from the store
export type { GroupDialogsState, GroupDialogsActions } from '../store/useGroupDialogsStore';

// Story 14d-v2-1-9: Offline Recovery Detection Hook
export {
    useOfflineRecoveryDetection,
    RECOVERY_THRESHOLD_MS,
    RECOVERY_THRESHOLD_DAYS,
} from './useOfflineRecoveryDetection';

export type {
    UseOfflineRecoveryDetectionOptions,
    UseOfflineRecoveryDetectionResult,
} from './useOfflineRecoveryDetection';

// Placeholder - additional hooks will be added in stories:
// - 14d-v2-1-5: useInviteMembers
// - 14d-v2-2-2: useGroupTransactions
