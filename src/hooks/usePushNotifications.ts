/**
 * Push Notifications Hook
 *
 * Story 9.18: Initial push notification setup
 * Story 14c.13: FCM Push Notifications for Shared Groups
 *
 * Hook for managing push notification state and functionality.
 * Handles permission requests, FCM token management, and foreground messages.
 *
 * Story 14c.13 enhancements:
 * - Uses saveFCMTokenWithTracking for localStorage sync
 * - Updates token lastUsedAt on app startup
 * - Supports deleteAllFCMTokensWithTracking for clean disable
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getFCMToken,
  onForegroundMessage,
  showInAppNotification
} from '../services/pushNotifications';
import {
  saveFCMTokenWithTracking,
  deleteAllFCMTokensWithTracking,
  updateTokenLastUsed,
  isNotificationsEnabledLocal,
  getStoredFCMToken,
} from '../services/fcmTokenService';
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

  // Story 14c.13: Track initialization to prevent duplicate token updates
  const initializedRef = useRef(false);

  // Check support and initial permission on mount
  useEffect(() => {
    let mounted = true;

    async function checkSupport() {
      const supported = await isPushSupported();
      console.log('[usePushNotifications] checkSupport:', { supported });

      if (mounted) {
        setIsSupported(supported);
        if (supported) {
          const currentPermission = getNotificationPermission();
          console.log('[usePushNotifications] currentPermission:', currentPermission);
          setPermission(currentPermission);

          // Story 14c.13: Only restore token if permission is actually granted
          // This prevents showing toggle as enabled when permission was revoked
          if (currentPermission === 'granted') {
            const wasEnabled = isNotificationsEnabledLocal();
            const storedToken = getStoredFCMToken();
            console.log('[usePushNotifications] localStorage state:', { wasEnabled, hasStoredToken: !!storedToken });
            if (wasEnabled && storedToken) {
              setToken(storedToken);
            }
          } else {
            // Permission not granted, clear any stale localStorage state
            // Token will be null, so toggles will show as disabled
            console.log('[usePushNotifications] Permission not granted, clearing token state');
            setToken(null);
          }
        }
      }
    }

    checkSupport();
    return () => { mounted = false; };
  }, []);

  // Story 14c.13 Task 1.6: Update token lastUsedAt on app startup
  useEffect(() => {
    if (!db || !userId || !appId || initializedRef.current) return;

    const storedToken = getStoredFCMToken();
    if (storedToken && isNotificationsEnabledLocal()) {
      initializedRef.current = true;

      // Update lastUsedAt in background (non-blocking)
      updateTokenLastUsed(db, userId, appId, storedToken).catch(err => {
        if (import.meta.env.DEV) {
          console.warn('[usePushNotifications] Failed to update token lastUsedAt:', err);
        }
      });
    }
  }, [db, userId, appId]);

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
  // Story 14c.13: This effect ensures token is saved to Firestore when db/userId/appId become available
  useEffect(() => {
    let mounted = true;

    console.log('[usePushNotifications] getExistingToken effect running:', {
      isSupported,
      permission,
      hasDb: !!db,
      hasUserId: !!userId,
      hasAppId: !!appId
    });

    async function getExistingToken() {
      if (!isSupported || permission !== 'granted') {
        console.log('[usePushNotifications] Skipping getExistingToken - not supported or not granted');
        return;
      }

      try {
        console.log('[usePushNotifications] Getting FCM token...');
        const fcmToken = await getFCMToken();
        console.log('[usePushNotifications] Got FCM token:', fcmToken ? 'yes (length: ' + fcmToken.length + ')' : 'no');

        if (mounted && fcmToken) {
          setToken(fcmToken);

          // Story 14c.13: Save to Firestore with localStorage tracking
          // This is critical - without saving to Firestore, notifications won't work
          if (db && userId && appId) {
            console.log('[usePushNotifications] Saving token to Firestore for user:', userId);
            await saveFCMTokenWithTracking(db, userId, appId, fcmToken);
            console.log('[usePushNotifications] Token saved successfully');
          } else {
            console.warn('[usePushNotifications] Cannot save token - missing db/userId/appId:', {
              hasDb: !!db,
              hasUserId: !!userId,
              hasAppId: !!appId
            });
          }
        }
      } catch (err) {
        console.error('[usePushNotifications] Failed to get existing FCM token:', err);
        // Story 14c.13: Clear token state on error so toggle reflects reality
        if (mounted) {
          setToken(null);
        }
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

      // Story 14c.13: Save to Firestore with localStorage tracking
      if (db && userId && appId) {
        await saveFCMTokenWithTracking(db, userId, appId, fcmToken);
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
   * Disable notifications by removing all FCM tokens
   *
   * Story 14c.13: Uses deleteAllFCMTokensWithTracking to clear
   * both Firestore tokens and localStorage flags
   */
  const disableNotifications = useCallback(async (): Promise<void> => {
    if (!db || !userId || !appId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Story 14c.13: Delete all tokens and clear localStorage
      await deleteAllFCMTokensWithTracking(db, userId, appId);
      setToken(null);
    } catch (err) {
      console.error('Failed to disable notifications:', err);
      setError('Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  }, [db, userId, appId]);

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
