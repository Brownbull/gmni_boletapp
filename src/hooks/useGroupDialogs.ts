/**
 * useGroupDialogs Hook - Re-export for backward compatibility
 *
 * The canonical location is now @/features/shared-groups/hooks/useGroupDialogs
 * This file re-exports for existing imports.
 *
 * @deprecated Import from '@/features/shared-groups' instead
 */

export {
  useGroupDialogs,
  type GroupDialogsState,
  type GroupDialogsActions,
  type UseGroupDialogsReturn,
} from '@/features/shared-groups';
