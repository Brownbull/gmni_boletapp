/**
 * Story 14c-refactor.10: App-level hooks barrel exports
 *
 * Central export point for app-level initialization, lifecycle,
 * and coordination hooks.
 *
 * These hooks extract non-scan related App.tsx logic into
 * reusable, testable modules.
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
