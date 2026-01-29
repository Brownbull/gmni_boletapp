/**
 * Story 14c-refactor.9: Context barrel exports
 *
 * Central export point for all React contexts.
 * Import from here for cleaner imports.
 *
 * @example
 * ```tsx
 * import { useAuthContext, useNavigation, useTheme } from './contexts';
 * ```
 */

// =============================================================================
// Story 14c-refactor.9: New Contexts
// =============================================================================

// AuthContext - Firebase authentication state
export {
    AuthProvider,
    useAuthContext,
    useAuthContextOptional,
    type AuthContextValue,
    type Services,
} from './AuthContext';

// NavigationContext - View navigation state
export {
    NavigationProvider,
    useNavigation,
    useNavigationOptional,
    type NavigationContextValue,
    type View,
    type SettingsSubview,
} from './NavigationContext';

// ThemeContext - Theme and locale preferences
export {
    ThemeProvider,
    useTheme,
    useThemeOptional,
    type ThemeContextValue,
} from './ThemeContext';

// NotificationContext - In-app notifications
export {
    NotificationProvider,
    useNotifications,
    useNotificationsOptional,
    type NotificationContextValue,
} from './NotificationContext';

// AppStateContext - Global UI state (toasts, operation status)
export {
    AppStateProvider,
    useAppState,
    useAppStateOptional,
    type AppStateContextValue,
    type ToastMessage,
} from './AppStateContext';

// =============================================================================
// Existing Contexts (pre-14c-refactor.9)
// =============================================================================

// ViewModeContext - Personal vs shared group mode
// Story 14c-refactor.13: VIEW_MODE_STORAGE_KEY removed (no localStorage persistence)
export {
    ViewModeProvider,
    useViewMode,
    useViewModeOptional,
    type ViewModeContextValue,
    type ViewMode,
} from './ViewModeContext';

// Story 14e-11: ScanContext removed - scan state now managed by Zustand store
// Use @features/scan/store for scan state and actions

// AnalyticsContext - Analytics state
export { AnalyticsProvider, AnalyticsContext } from './AnalyticsContext';

// HistoryFiltersContext - History view filters
export {
    HistoryFiltersProvider,
    HistoryFiltersContext,
    getDefaultFilterState,
    type HistoryFilterState,
    type TemporalFilterState,
} from './HistoryFiltersContext';

// =============================================================================
// Story 14e-25d: ViewHandlersContext DELETED
// =============================================================================
//
// ViewHandlersContext was removed in Story 14e-25d. Views now use direct hooks:
// - Navigation: useNavigationActions() from @/shared/stores
// - Toast: useToast() from @/shared/hooks
// - Modals: useModalActions() from @/managers/ModalManager
// - History navigation: useHistoryNavigation() from @/shared/hooks
