/**
 * Story 14c-refactor.10: useAppPushNotifications Hook
 *
 * Coordinates push notification handling at the app level by wrapping
 * usePushNotifications and integrating with app state (toasts).
 * This hook extracts notification coordination from App.tsx.
 *
 * Features:
 * - Wraps usePushNotifications for web push management
 * - Integrates with AppState for toast notifications
 * - Handles foreground notification display
 * - Provides notification click handling for deep linking
 *
 * Architecture Reference: Epic 14c-refactor - App Decomposition
 * Dependency: Requires AuthContext services and user
 *
 * @example
 * ```tsx
 * function App() {
 *   const { services, user } = useAuthContext();
 *   const { setToastMessage } = useAppState();
 *
 *   const {
 *     pushNotifications,
 *     lastNotificationClick,
 *   } = useAppPushNotifications({
 *     db: services?.db ?? null,
 *     userId: user?.uid ?? null,
 *     appId: services?.appId ?? null,
 *     setToastMessage,
 *   });
 *
 *   // Handle notification click for navigation
 *   useEffect(() => {
 *     if (lastNotificationClick?.groupId) {
 *       navigateToGroup(lastNotificationClick.groupId);
 *     }
 *   }, [lastNotificationClick]);
 *
 *   return <MainApp />;
 * }
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import type { Firestore } from 'firebase/firestore';
import {
    usePushNotifications,
    type PushNotificationState,
    type NotificationClickData,
} from '../usePushNotifications';
import type { ToastMessage } from '../../contexts/AppStateContext';

// Re-export types for consumers
export type { PushNotificationState, NotificationClickData } from '../usePushNotifications';

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration options for useAppPushNotifications
 */
export interface UseAppPushNotificationsOptions {
    /** Firestore instance (null during initialization) */
    db: Firestore | null;
    /** Current user ID (null if not authenticated) */
    userId: string | null;
    /** App ID (null during initialization) */
    appId: string | null;
    /** Toast message setter from AppState context */
    setToastMessage?: (message: ToastMessage | null) => void;
    /** Custom handler for notification clicks */
    onNotificationClick?: (data: NotificationClickData) => void;
}

/**
 * Result returned by useAppPushNotifications hook
 */
export interface UseAppPushNotificationsResult {
    /** Push notification state from underlying hook */
    pushNotifications: PushNotificationState;
    /** Last notification click data (for navigation) */
    lastNotificationClick: NotificationClickData | null;
    /** Clear the last notification click */
    clearLastNotificationClick: () => void;
    /** Whether push notifications are available and enabled */
    isPushEnabled: boolean;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook to coordinate push notifications at the app level.
 *
 * Wraps usePushNotifications and integrates with app state for
 * toast display and notification click handling.
 *
 * @param options - Push notification configuration
 * @returns Push notification state and handlers
 */
export function useAppPushNotifications({
    db,
    userId,
    appId,
    setToastMessage,
    onNotificationClick,
}: UseAppPushNotificationsOptions): UseAppPushNotificationsResult {
    // Track last notification click for navigation
    const [lastNotificationClick, setLastNotificationClick] = useState<NotificationClickData | null>(null);

    // Handle foreground notification received
    const handleNotificationReceived = useCallback(
        (title: string, body: string) => {
            // Show toast for foreground notifications
            if (setToastMessage) {
                setToastMessage({
                    text: `${title}: ${body}`,
                    type: 'info',
                });
            }
        },
        [setToastMessage]
    );

    // Handle notification click
    const handleNotificationClick = useCallback(
        (data: NotificationClickData) => {
            // Store for navigation
            setLastNotificationClick(data);

            // Call custom handler if provided
            onNotificationClick?.(data);
        },
        [onNotificationClick]
    );

    // Wrap usePushNotifications
    const pushNotifications = usePushNotifications({
        db,
        userId,
        appId,
        onNotificationReceived: handleNotificationReceived,
        onNotificationClick: handleNotificationClick,
    });

    // Clear last notification click
    const clearLastNotificationClick = useCallback(() => {
        setLastNotificationClick(null);
    }, []);

    // Derive enabled state
    const isPushEnabled = useMemo(() => {
        return (
            pushNotifications.isSupported &&
            pushNotifications.permission === 'granted' &&
            pushNotifications.token !== null
        );
    }, [
        pushNotifications.isSupported,
        pushNotifications.permission,
        pushNotifications.token,
    ]);

    // Return combined result
    return useMemo<UseAppPushNotificationsResult>(
        () => ({
            pushNotifications,
            lastNotificationClick,
            clearLastNotificationClick,
            isPushEnabled,
        }),
        [pushNotifications, lastNotificationClick, clearLastNotificationClick, isPushEnabled]
    );
}

export default useAppPushNotifications;
