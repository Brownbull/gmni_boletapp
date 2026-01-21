/**
 * Story 14c-refactor.9: NotificationContext - App-wide in-app notification context
 *
 * Provides in-app notification state and methods to the entire app via React Context.
 * Wraps useInAppNotifications hook to enable context-based access.
 *
 * Features:
 * - Real-time notification subscription (Firestore)
 * - Unread count tracking
 * - Mark as read (single/all)
 * - Delete notifications (single/all)
 *
 * Note: This context handles IN-APP notifications only.
 * Push notifications are handled separately via usePushNotifications hook.
 *
 * Architecture Reference: Epic 14c-refactor - App Decomposition
 *
 * @example
 * ```tsx
 * // In any component
 * const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
 *
 * // Mark notification as read
 * markAsRead(notificationId);
 *
 * // Display unread badge
 * {unreadCount > 0 && <Badge count={unreadCount} />}
 * ```
 */

import {
    createContext,
    useContext,
    useMemo,
    type ReactNode,
} from 'react';
import { useInAppNotifications, type UseInAppNotificationsResult } from '../hooks/useInAppNotifications';
import type { Firestore } from 'firebase/firestore';

// =============================================================================
// Types
// =============================================================================

/**
 * Context value provided to consumers
 */
export interface NotificationContextValue extends UseInAppNotificationsResult {}

// =============================================================================
// Context Creation
// =============================================================================

/**
 * Notification Context - provides in-app notification state and actions.
 *
 * IMPORTANT: Do not use useContext(NotificationContext) directly.
 * Use the useNotifications() hook instead for proper error handling.
 */
const NotificationContext = createContext<NotificationContextValue | null>(null);

// =============================================================================
// Provider Props
// =============================================================================

interface NotificationProviderProps {
    children: ReactNode;
    /** Firestore instance */
    db: Firestore | null;
    /** Current user's ID */
    userId: string | null;
    /** Application ID */
    appId: string | null;
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * Notification Context Provider.
 *
 * Wrap your app with this provider to enable in-app notification management.
 * Requires AuthContext to be available for userId and appId.
 *
 * @example
 * ```tsx
 * <NotificationProvider db={services?.db} userId={user?.uid} appId={services?.appId}>
 *   <App />
 * </NotificationProvider>
 * ```
 */
export function NotificationProvider({
    children,
    db,
    userId,
    appId,
}: NotificationProviderProps) {
    // Use the existing hook for notification state management
    const notificationState = useInAppNotifications(db, userId, appId);

    // ===========================================================================
    // Memoized Context Value
    // ===========================================================================

    const value = useMemo<NotificationContextValue>(
        () => notificationState,
        [notificationState]
    );

    return (
        <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
    );
}

// =============================================================================
// Consumer Hooks
// =============================================================================

/**
 * Access notification context - throws if outside provider.
 *
 * Use this hook in components that REQUIRE notification functionality.
 *
 * @throws Error if used outside NotificationProvider
 *
 * @example
 * ```tsx
 * function NotificationBell() {
 *   const { unreadCount, markAllAsRead } = useNotifications();
 *
 *   return (
 *     <button onClick={markAllAsRead}>
 *       <BellIcon />
 *       {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
 *     </button>
 *   );
 * }
 * ```
 */
export function useNotifications(): NotificationContextValue {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

/**
 * Access notification context - returns null if outside provider.
 *
 * Use this hook in components that OPTIONALLY use notifications,
 * such as layout components rendered before full app initialization.
 *
 * @example
 * ```tsx
 * function Header() {
 *   const notifications = useNotificationsOptional();
 *
 *   // Only show badge if context is available
 *   if (notifications?.unreadCount) {
 *     return <Badge count={notifications.unreadCount} />;
 *   }
 *
 *   return null;
 * }
 * ```
 */
export function useNotificationsOptional(): NotificationContextValue | null {
    return useContext(NotificationContext);
}

// =============================================================================
// Re-exports
// =============================================================================

export type { InAppNotificationClient } from '../types/notification';
export type { UseInAppNotificationsResult } from '../hooks/useInAppNotifications';
