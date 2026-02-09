/**
 * useInAppNotifications Hook
 *
 *
 * Real-time subscription to user's in-app notifications.
 * Provides read/unread state management and notification count.
 *
 * @example
 * ```tsx
 * const {
 *   notifications,
 *   unreadCount,
 *   isLoading,
 *   markAsRead,
 *   markAllAsRead,
 * } = useInAppNotifications(db, userId, appId);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    writeBatch,
    type Firestore,
} from 'firebase/firestore';
import type { InAppNotification, InAppNotificationClient } from '../types/notification';
import { toDateSafe } from '@/utils/timestamp';

// ============================================================================
// Types
// ============================================================================

export interface UseInAppNotificationsResult {
    /** List of notifications (newest first) */
    notifications: InAppNotificationClient[];
    /** Number of unread notifications */
    unreadCount: number;
    /** Whether initial load is in progress */
    isLoading: boolean;
    /** Error if subscription failed */
    error: Error | null;
    /** Mark a specific notification as read */
    markAsRead: (notificationId: string) => Promise<void>;
    /** Mark all notifications as read */
    markAllAsRead: () => Promise<void>;
    /** Delete a specific notification */
    deleteNotification: (notificationId: string) => Promise<void>;
    /** Delete all notifications */
    deleteAllNotifications: () => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of notifications to fetch */
const MAX_NOTIFICATIONS = 50;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Subscribe to user's in-app notifications.
 *
 * @param db - Firestore instance
 * @param userId - Current user's ID
 * @param appId - Application ID
 * @returns Notifications state and management functions
 */
export function useInAppNotifications(
    db: Firestore | null,
    userId: string | null,
    appId: string | null
): UseInAppNotificationsResult {
    const [notifications, setNotifications] = useState<InAppNotificationClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Subscribe to notifications collection
    useEffect(() => {
        if (!db || !userId || !appId) {
            setNotifications([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const notificationsRef = collection(
            db,
            `artifacts/${appId}/users/${userId}/notifications`
        );

        const q = query(
            notificationsRef,
            orderBy('createdAt', 'desc'),
            limit(MAX_NOTIFICATIONS)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const notifs: InAppNotificationClient[] = snapshot.docs.map((doc) => {
                    const data = doc.data() as InAppNotification;
                    return {
                        ...data,
                        id: doc.id,
                        createdAt: toDateSafe(data.createdAt) || new Date(),
                    };
                });
                setNotifications(notifs);
                setIsLoading(false);
            },
            (err) => {
                console.error('[useInAppNotifications] Subscription error:', err);
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [db, userId, appId]);

    // Calculate unread count
    const unreadCount = notifications.filter((n) => !n.read).length;

    // Mark a single notification as read
    const markAsRead = useCallback(
        async (notificationId: string) => {
            if (!db || !userId || !appId) return;

            try {
                const notifRef = doc(
                    db,
                    `artifacts/${appId}/users/${userId}/notifications/${notificationId}`
                );
                await updateDoc(notifRef, { read: true });
            } catch (err) {
                console.error('[useInAppNotifications] Failed to mark as read:', err);
            }
        },
        [db, userId, appId]
    );

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        if (!db || !userId || !appId) return;

        const unreadNotifs = notifications.filter((n) => !n.read);
        if (unreadNotifs.length === 0) return;

        try {
            const batch = writeBatch(db);
            for (const notif of unreadNotifs) {
                const notifRef = doc(
                    db,
                    `artifacts/${appId}/users/${userId}/notifications/${notif.id}`
                );
                batch.update(notifRef, { read: true });
            }
            await batch.commit();
        } catch (err) {
            console.error('[useInAppNotifications] Failed to mark all as read:', err);
        }
    }, [db, userId, appId, notifications]);

    // Delete a single notification
    const deleteNotification = useCallback(
        async (notificationId: string) => {
            if (!db || !userId || !appId) return;

            try {
                const notifRef = doc(
                    db,
                    `artifacts/${appId}/users/${userId}/notifications/${notificationId}`
                );
                await deleteDoc(notifRef);
            } catch (err) {
                console.error('[useInAppNotifications] Failed to delete notification:', err);
            }
        },
        [db, userId, appId]
    );

    // Delete all notifications
    const deleteAllNotifications = useCallback(async () => {
        if (!db || !userId || !appId) return;
        if (notifications.length === 0) return;

        try {
            const batch = writeBatch(db);
            for (const notif of notifications) {
                const notifRef = doc(
                    db,
                    `artifacts/${appId}/users/${userId}/notifications/${notif.id}`
                );
                batch.delete(notifRef);
            }
            await batch.commit();
        } catch (err) {
            console.error('[useInAppNotifications] Failed to delete all notifications:', err);
        }
    }, [db, userId, appId, notifications]);

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
    };
}

export default useInAppNotifications;
