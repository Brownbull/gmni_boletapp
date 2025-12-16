# Story 9.18: PWA Push Notifications - Context

Status: drafted

## Story

As a **user**,
I want **to receive push notifications from the Gastify PWA**,
So that **I can stay informed about spending alerts, budgets, or reminders even when the app is not open**.

## Acceptance Criteria

1. **AC #1:** Service worker is properly registered in main.tsx with update handling
2. **AC #2:** vite-plugin-pwa installed and configured for PWA build
3. **AC #3:** Firebase Cloud Messaging (FCM) initialized in the app
4. **AC #4:** Push notification permission request shown to users (non-intrusive)
5. **AC #5:** Users can enable/disable notifications in Settings
6. **AC #6:** firebase-messaging-sw.js service worker handles background messages
7. **AC #7:** In-app notification toast when push received while app is open
8. **AC #8:** FCM token stored in Firestore for each user
9. **AC #9:** Translations added for notification-related UI (EN + ES)
10. **AC #10:** Existing tests pass

## Tasks / Subtasks

- [ ] Task 1: Install and configure vite-plugin-pwa (AC: #1, #2)
  - [ ] Install `vite-plugin-pwa` as dev dependency
  - [ ] Update `vite.config.ts` with VitePWA plugin
  - [ ] Configure manifest settings (name, icons, theme colors)
  - [ ] Configure workbox for caching strategies
  - [ ] Test build generates proper SW and manifest

- [ ] Task 2: Create push notifications service (AC: #3, #7)
  - [ ] Create `src/services/pushNotifications.ts`
  - [ ] Initialize Firebase Messaging from firebase/messaging
  - [ ] Create `requestNotificationPermission()` function
  - [ ] Create `getFCMToken()` function with VAPID key
  - [ ] Create `onForegroundMessage()` handler for in-app notifications
  - [ ] Handle errors gracefully (unsupported browsers, etc.)

- [ ] Task 3: Create background message handler (AC: #6)
  - [ ] Create `public/firebase-messaging-sw.js`
  - [ ] Import Firebase compat scripts
  - [ ] Initialize Firebase app in SW
  - [ ] Handle `onBackgroundMessage` to show system notification
  - [ ] Configure notification icon and default options

- [ ] Task 4: Create notification settings UI (AC: #4, #5)
  - [ ] Create `src/components/NotificationSettings.tsx`
  - [ ] Show current permission status (granted/denied/default)
  - [ ] Add enable/disable toggle
  - [ ] Add "Test Notification" button (dev mode only)
  - [ ] Style using existing card/toggle patterns

- [ ] Task 5: Integrate settings into SettingsView (AC: #5)
  - [ ] Add NotificationSettings section to SettingsView
  - [ ] Pass required props (t, theme, permission handlers)
  - [ ] Position after other settings sections

- [ ] Task 6: FCM token storage (AC: #8)
  - [ ] Create `fcmTokens` collection schema in Firestore
  - [ ] Store token with: userId, token, timestamp, userAgent
  - [ ] Update token on app initialization if changed
  - [ ] Delete token on sign-out
  - [ ] Add Firestore security rules for fcmTokens collection

- [ ] Task 7: Service worker registration (AC: #1)
  - [ ] Update `src/main.tsx` to register service worker
  - [ ] Handle SW update prompts (optional: prompt user to reload)
  - [ ] Log registration success/failure for debugging

- [ ] Task 8: Add translations (AC: #9)
  - [ ] Add EN translations: notifications, enableNotifications, notificationPermission, etc.
  - [ ] Add ES translations for same keys

- [ ] Task 9: Verify all tests pass (AC: #10)
  - [ ] Run `npm run test:unit`
  - [ ] Run `npm run build`
  - [ ] Verify SW generated correctly
  - [ ] Test in browser (permission flow, FCM registration)

## Dev Notes

### Current PWA State

The app already has basic PWA files in `dist/`:
- `manifest.webmanifest` - Basic PWA manifest
- `sw.js` - Workbox service worker with precaching
- `pwa-192x192.png`, `pwa-512x512.png` - App icons

However:
- **No service worker registration** in `src/main.tsx`
- **No Firebase Messaging** integration
- **No push notification handling**
- PWA files are in `dist/` but unclear how they're generated (not via vite-plugin-pwa based on vite.config.ts)

### Firebase Configuration

**Location:** `src/config/firebase.ts`

The app already has:
- `VITE_FIREBASE_MESSAGING_SENDER_ID` env var configured
- Firebase app initialization
- Storage configured with emulator support

Need to add:
- Firebase Messaging import and initialization
- VAPID key for web push (stored in env var)

### Service Structure

```typescript
// src/services/pushNotifications.ts
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from '../config/firebase';

let messaging: ReturnType<typeof getMessaging> | null = null;

// Lazy initialization - messaging not supported in all contexts
async function getMessagingInstance() {
  if (messaging) return messaging;

  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging not supported in this browser');
    return null;
  }

  messaging = getMessaging(app);
  return messaging;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.requestPermission();
}

export async function getFCMToken(): Promise<string | null> {
  const msg = await getMessagingInstance();
  if (!msg) return null;

  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VITE_FIREBASE_VAPID_KEY not configured');
      return null;
    }

    const token = await getToken(msg, { vapidKey });
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void): () => void {
  getMessagingInstance().then(msg => {
    if (msg) {
      onMessage(msg, callback);
    }
  });
  return () => {}; // Return cleanup function
}
```

### Background Service Worker

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Firebase config needs to be hardcoded in SW (can't access env vars)
// These are public keys, safe to include
firebase.initializeApp({
  apiKey: "...",
  authDomain: "...",
  projectId: "boletapp-d609f",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || 'Gastify', {
    body: body || '',
    icon: icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'gastify-notification',
  });
});
```

### Vite PWA Configuration

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Gastify',
        short_name: 'Gastify',
        description: 'Smart expense tracking with AI receipt scanning',
        theme_color: '#2d3a4a',
        background_color: '#f5f0e8',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Don't precache firebase-messaging-sw.js - it's a separate SW
        navigateFallback: 'index.html',
      },
    }),
  ],
  // ... rest of config
});
```

### Token Storage Schema

```typescript
// Firestore: /users/{userId}/fcmTokens/{tokenId}
interface FCMToken {
  token: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userAgent: string;
  platform: 'web' | 'ios' | 'android';
}
```

### Security Rules Addition

```
// Add to firestore.rules
match /users/{userId}/fcmTokens/{tokenId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Environment Variables Needed

```env
# Add to .env
VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
```

### Project Structure Notes

**Files to create:**
- `src/services/pushNotifications.ts` - FCM service
- `src/components/NotificationSettings.tsx` - Settings UI
- `public/firebase-messaging-sw.js` - Background message handler

**Files to modify:**
- `vite.config.ts` - Add VitePWA plugin
- `src/main.tsx` - Register service worker
- `src/views/SettingsView.tsx` - Add notification settings section
- `src/utils/translations.ts` - Add translations
- `firestore.rules` - Add fcmTokens rules
- `.env.example` - Add VITE_FIREBASE_VAPID_KEY
- `package.json` - Add vite-plugin-pwa dependency

### References

- [Story 9.18 Definition](./story-9.18-pwa-push-notifications.md)
- [Firebase Config](../../src/config/firebase.ts)
- [SettingsView.tsx](../../src/views/SettingsView.tsx)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Firebase Cloud Messaging Web](https://firebase.google.com/docs/cloud-messaging/js/client)

### Learnings from Previous Stories

**From Story 9.14 (PWA Installation Support):**
- PWA infrastructure exists but service worker isn't registered in app code
- Manifest and SW files are in dist/ but generation process unclear

**From Firebase integration patterns:**
- Use emulator detection for development
- Lazy initialization for optional features (messaging may not be supported)
- Store sensitive keys in environment variables

## Future Use Cases (Out of Scope)

Once infrastructure is in place, notifications can be sent for:
- Budget alerts ("You've spent 80% of your Food budget")
- Weekly spending summaries
- Scan reminders
- Category insights

**Note:** Trigger logic for these notifications is outside this story's scope. This story only creates the infrastructure.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-16 | Context file created | Claude Opus 4.5 |
