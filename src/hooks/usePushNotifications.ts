/**
 * Push Notifications Hook - Story 9.18
 *
 * Hook for managing push notification state and functionality.
 * Handles permission requests, FCM token management, and foreground messages.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getFCMToken,
  onForegroundMessage,
  showInAppNotification
} from '../services/pushNotifications';
import { saveFCMToken, deleteFCMToken } from '../services/fcmTokenService';
import { Firestore } from 'firebase/firestore';

export interface PushNotificationState {
  /** Whether push notifications are supported in this browser */
  isSupported: boolean;
  /** Current notification permission status */
  permission: NotificationPermission;
  /** The FCM token for this device (null if not available) */
  token: string | null;
  /** Whether we're currently requesting permission or token */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Request notification permission and get FCM token */
  enableNotifications: () => Promise<boolean>;
  /** Remove FCM token (disable notifications) */
  disableNotifications: () => Promise<void>;
}

interface UsePushNotificationsOptions {
  /** Firestore instance */
  db: Firestore | null;
  /** User ID */
  userId: string | null;
  /** App ID */
  appId: string | null;
  /** Callback when a foreground notification is received */
  onNotificationReceived?: (title: string, body: string) => void;
}

/**
 * Hook for managing push notifications.
 *
 * @param options Configuration options
 * @returns PushNotificationState
 *
 * @example
 * ```tsx
 * function NotificationSettings() {
 *   const { permission, enableNotifications, disableNotifications } = usePushNotifications({
 *     db: services?.db,
 *     userId: user?.uid,
 *     appId: services?.appId
 *   });
 *
 *   if (permission === 'granted') {
 *     return <button onClick={disableNotifications}>Disable</button>;
 *   }
 *
 *   return <button onClick={enableNotifications}>Enable</button>;
 * }
 * ```
 */
export function usePushNotifications({
  db,
  userId,
  appId,
  onNotificationReceived
}: UsePushNotificationsOptions): PushNotificationState {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check support and initial permission on mount
  useEffect(() => {
    let mounted = true;

    async function checkSupport() {
      const supported = await isPushSupported();
      if (mounted) {
        setIsSupported(supported);
        if (supported) {
          setPermission(getNotificationPermission());
        }
      }
    }

    checkSupport();
    return () => { mounted = false; };
  }, []);

  // Subscribe to foreground messages
  useEffect(() => {
    if (!isSupported || permission !== 'granted') {
      return;
    }

    const unsubscribe = onForegroundMessage((payload) => {
      const title = payload.notification?.title || 'Gastify';
      const body = payload.notification?.body || '';

      // Call the callback if provided
      if (onNotificationReceived) {
        onNotificationReceived(title, body);
      } else {
        // Default behavior: show in-app notification
        showInAppNotification(title, body);
      }
    });

    return unsubscribe;
  }, [isSupported, permission, onNotificationReceived]);

  // Try to get token if permission is already granted
  useEffect(() => {
    let mounted = true;

    async function getExistingToken() {
      if (!isSupported || permission !== 'granted') {
        return;
      }

      try {
        const fcmToken = await getFCMToken();
        if (mounted && fcmToken) {
          setToken(fcmToken);

          // Save to Firestore if we have the required services
          if (db && userId && appId) {
            await saveFCMToken(db, userId, appId, fcmToken);
          }
        }
      } catch (err) {
        console.error('Failed to get existing FCM token:', err);
      }
    }

    getExistingToken();
    return () => { mounted = false; };
  }, [isSupported, permission, db, userId, appId]);

  /**
   * Request permission and enable notifications
   */
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);

      if (newPermission !== 'granted') {
        setError('Notification permission was denied');
        return false;
      }

      // Get FCM token
      const fcmToken = await getFCMToken();
      if (!fcmToken) {
        setError('Failed to get notification token');
        return false;
      }

      setToken(fcmToken);

      // Save to Firestore
      if (db && userId && appId) {
        await saveFCMToken(db, userId, appId, fcmToken);
      }

      return true;
    } catch (err) {
      console.error('Failed to enable notifications:', err);
      setError('Failed to enable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, db, userId, appId]);

  /**
   * Disable notifications by removing the FCM token
   */
  const disableNotifications = useCallback(async (): Promise<void> => {
    if (!token || !db || !userId || !appId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await deleteFCMToken(db, userId, appId, token);
      setToken(null);
    } catch (err) {
      console.error('Failed to disable notifications:', err);
      setError('Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  }, [token, db, userId, appId]);

  return {
    isSupported,
    permission,
    token,
    isLoading,
    error,
    enableNotifications,
    disableNotifications
  };
}

export default usePushNotifications;
