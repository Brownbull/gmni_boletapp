/**
 * Firebase Messaging Service Worker - Story 9.18
 *
 * Handles background push notifications when the app is not in focus.
 * This service worker runs independently of the main app.
 *
 * Note: Firebase config values here are public (not secrets).
 * They identify the project but don't grant any special permissions.
 */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Firebase configuration (public values - safe to include)
firebase.initializeApp({
  apiKey: 'AIzaSyDoIgjggfVampyZysdeWTucVFurxnbCL1M',
  authDomain: 'boletapp-d609f.firebaseapp.com',
  projectId: 'boletapp-d609f',
  storageBucket: 'boletapp-d609f.firebasestorage.app',
  messagingSenderId: '171460588224',
  appId: '1:171460588224:web:69e7552f8fa95297603325'
});

const messaging = firebase.messaging();

/**
 * Handle background messages
 * This is called when a message is received while the app is not in focus
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  // Extract notification data
  const notificationTitle = payload.notification?.title || 'Gastify';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'gastify-notification',
    // Add any custom data to pass to the app when notification is clicked
    data: payload.data || {}
  };

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification click
 * Opens the app when user clicks on a notification
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
