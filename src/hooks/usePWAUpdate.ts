/**
 * PWA Update Hook - Story 9.14
 *
 * Hook for detecting and handling PWA service worker updates.
 * Uses vite-plugin-pwa's useRegisterSW hook under the hood.
 */

import { useRegisterSW } from 'virtual:pwa-register/react';

export interface PWAUpdateState {
  /** True when a new version is available */
  needRefresh: boolean;
  /** True when app can work offline (service worker registered) */
  offlineReady: boolean;
  /** Dismiss the update notification */
  close: () => void;
  /** Update to the new version */
  update: () => void;
}

/**
 * Hook for managing PWA updates.
 *
 * @returns PWAUpdateState - Current update state and handlers
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { needRefresh, offlineReady, update, close } = usePWAUpdate();
 *
 *   if (needRefresh) {
 *     return (
 *       <div>
 *         <p>New version available!</p>
 *         <button onClick={update}>Update</button>
 *         <button onClick={close}>Later</button>
 *       </div>
 *     );
 *   }
 *
 *   return null;
 * }
 * ```
 */
export function usePWAUpdate(): PWAUpdateState {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      // Log successful registration in development
      if (import.meta.env.DEV) {
        console.log('[PWA] Service worker registered:', registration);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service worker registration failed:', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  const update = () => {
    updateServiceWorker(true);
  };

  return {
    needRefresh,
    offlineReady,
    close,
    update,
  };
}

export default usePWAUpdate;
