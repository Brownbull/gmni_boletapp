/**
 * Push Notifications Service - Story 9.18
 *
 * Provides Firebase Cloud Messaging (FCM) integration for push notifications.
 * Handles permission requests, token management, and foreground message handling.
 */

import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { app } from '../config/firebase';

let messaging: Messaging | null = null;

/**
 * Lazy initialization of Firebase Messaging
 * Messaging is not supported in all contexts (e.g., incognito mode, some browsers)
 */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (messaging) return messaging;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Messaging not supported in this browser');
      return null;
    }

    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('Failed to initialize Firebase Messaging:', error);
    return null;
  }
}

/**
 * Check if push notifications are supported in this browser
 */
export async function isPushSupported(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;

  try {
    return await isSupported();
  } catch {
    return false;
  }
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Request permission to show notifications
 * Returns the resulting permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
}

/**
 * Get the FCM registration token for this device
 * Requires notification permission to be granted
 *
 * @returns The FCM token or null if unable to get token
 */
export async function getFCMToken(): Promise<string | null> {
  const msg = await getMessagingInstance();
  if (!msg) return null;

  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VITE_FIREBASE_VAPID_KEY not configured');
      return null;
    }

    // Register the Firebase messaging service worker explicitly
    // This is required because vite-plugin-pwa creates its own sw.js
    // and navigator.serviceWorker.ready returns the PWA service worker, not the FCM one
    let registration: ServiceWorkerRegistration;

    try {
      // Try to get existing FCM service worker registration
      const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');

      if (existingRegistration) {
        registration = existingRegistration;
      } else {
        // Register the FCM service worker if not already registered
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log('[FCM] Service worker registered:', registration.scope);
      }

      // Wait for the service worker to be active
      if (registration.installing) {
        await new Promise<void>((resolve) => {
          registration.installing!.addEventListener('statechange', (e) => {
            if ((e.target as ServiceWorker).state === 'activated') {
              resolve();
            }
          });
        });
      } else if (registration.waiting) {
        await new Promise<void>((resolve) => {
          registration.waiting!.addEventListener('statechange', (e) => {
            if ((e.target as ServiceWorker).state === 'activated') {
              resolve();
            }
          });
        });
      }
    } catch (swError) {
      console.error('Failed to register FCM service worker:', swError);
      return null;
    }

    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

/**
 * Subscribe to foreground message events
 * Only fires when the app is in the foreground
 *
 * @param callback Function to call when a message is received
 * @returns Unsubscribe function
 */
export function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string; icon?: string }; data?: Record<string, string> }) => void
): () => void {
  let unsubscribe: (() => void) | null = null;

  getMessagingInstance().then(msg => {
    if (msg) {
      unsubscribe = onMessage(msg, callback);
    }
  });

  // Return cleanup function
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

/**
 * Show a toast notification in the app (for foreground messages)
 * This is a simple implementation - can be enhanced with a proper toast library
 */
export function showInAppNotification(title: string, body: string): void {
  // Create and dispatch a custom event that App.tsx can listen to
  const event = new CustomEvent('push-notification', {
    detail: { title, body }
  });
  window.dispatchEvent(event);
}
