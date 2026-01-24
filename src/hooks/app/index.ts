/**
 * Story 14c-refactor.10: App-level hooks barrel exports
 *
 * Central export point for app-level initialization, lifecycle,
 * and coordination hooks.
 *
 * These hooks extract non-scan related App.tsx logic into
 * reusable, testable modules.
 *
 * ## ViewHandlersContext (Story 14c-refactor.25)
 *
 * Handler hook results are bundled in ViewHandlersContext for views to consume
 * without prop drilling. Views can call `useViewHandlers()` from contexts/ to access:
 * - transaction: UseTransactionHandlersResult
 * - scan: UseScanHandlersResult
 * - navigation: UseNavigationHandlersResult
 * - dialog: UseDialogHandlersResult
 *
 * @see contexts/ViewHandlersContext.tsx for context implementation
 *
 * @example
 * ```tsx
 * import {
 *   useOnlineStatus,
 *   useAppLifecycle,
 *   useAppInitialization,
 *   useDeepLinking,
 *   useAppPushNotifications,
 * } from './hooks/app';
 * ```
 */

// =============================================================================
// App Lifecycle Hooks
// =============================================================================

// Online/Offline status monitoring
export {
    useOnlineStatus,
    type UseOnlineStatusResult,
} from './useOnlineStatus';

// App lifecycle events (foreground/background, beforeunload)
export {
    useAppLifecycle,
    type UseAppLifecycleResult,
} from './useAppLifecycle';

// =============================================================================
// App Initialization Hooks
// =============================================================================

// App initialization coordination
export {
    useAppInitialization,
    type UseAppInitializationResult,
} from './useAppInitialization';

// Deep link URL handling
export {
    useDeepLinking,
    type UseDeepLinkingResult,
} from './useDeepLinking';

// Push notifications coordination
export {
    useAppPushNotifications,
    type UseAppPushNotificationsResult,
} from './useAppPushNotifications';

// =============================================================================
// Transaction & Scan Handler Hooks
// =============================================================================

// Story 14c-refactor.20: Transaction CRUD handlers
export {
    useTransactionHandlers,
    type UseTransactionHandlersProps,
    type UseTransactionHandlersResult,
} from './useTransactionHandlers';

// Story 14c-refactor.20: Scan flow handlers
export {
    useScanHandlers,
    type UseScanHandlersProps,
    type UseScanHandlersResult,
} from './useScanHandlers';

// =============================================================================
// Navigation & Dialog Handler Hooks
// =============================================================================

// Story 14c-refactor.21: Navigation handlers
export {
    useNavigationHandlers,
    type UseNavigationHandlersProps,
    type UseNavigationHandlersResult,
} from './useNavigationHandlers';

// Story 14c-refactor.21: Dialog handlers
export {
    useDialogHandlers,
    type UseDialogHandlersProps,
    type UseDialogHandlersResult,
    type ToastMessage,
    type ConflictDialogData,
} from './useDialogHandlers';

// =============================================================================
// View Props Composition Hooks (Story 14c-refactor.26)
// =============================================================================

// TransactionEditorView data props composition
export {
    useTransactionEditorViewProps,
    type UseTransactionEditorViewPropsOptions,
    type TransactionEditorDataProps,
    type ScanStateForProps,
    type ActiveGroupInfo,
    type UserPreferencesForProps,
} from './useTransactionEditorViewProps';

// TrendsView data props composition
export {
    useTrendsViewProps,
    type UseTrendsViewPropsOptions,
    type TrendsViewDataProps,
    type GroupMemberInfo,
    type SpendingByMember,
    type UserInfoForProps as TrendsUserInfo,
} from './useTrendsViewProps';

// HistoryView data props composition
export {
    useHistoryViewProps,
    type UseHistoryViewPropsOptions,
    type HistoryViewDataProps,
    type UserInfoForHistoryProps,
    type PaginationState,
} from './useHistoryViewProps';

// BatchReviewView data props composition
export {
    useBatchReviewViewProps,
    type UseBatchReviewViewPropsOptions,
    type BatchReviewViewDataProps,
    type ProcessingStateForProps,
    type BatchCreditsForProps,
} from './useBatchReviewViewProps';

// DashboardView data props composition (Story 14c-refactor.34a)
export {
    useDashboardViewProps,
    type UseDashboardViewPropsOptions,
    type DashboardViewDataProps,
    type DashboardTransaction,
    type SharedGroupForDashboard,
} from './useDashboardViewProps';

// SettingsView data props composition (Story 14c-refactor.34b)
export {
    useSettingsViewProps,
    type UseSettingsViewPropsOptions,
    type SettingsViewDataProps,
} from './useSettingsViewProps';

// ItemsView data props composition (Story 14c-refactor.34c)
export {
    useItemsViewProps,
    type UseItemsViewPropsOptions,
    type ItemsViewDataProps,
    type ItemsTransaction,
} from './useItemsViewProps';
