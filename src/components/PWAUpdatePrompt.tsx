/**
 * PWA Update Prompt Component - Story 9.14
 *
 * Displays a notification when a new version of the app is available,
 * allowing users to update or dismiss.
 */

import { RefreshCw, X, Check } from 'lucide-react';
import { usePWAUpdate } from '../hooks/usePWAUpdate';

/**
 * PWA Update Prompt - Shows when a new version is available
 *
 * Features:
 * - Slide-in notification from bottom
 * - Update and dismiss buttons
 * - Auto-dismisses when update is triggered
 * - Uses app theme colors
 */
export function PWAUpdatePrompt() {
  const { needRefresh, offlineReady, update, close } = usePWAUpdate();

  // Show nothing if no update available and not newly offline-ready
  if (!needRefresh && !offlineReady) {
    return null;
  }

  // Message based on state (hardcoded English - this is a system notification)
  const message = needRefresh
    ? 'New version available!'
    : 'App ready for offline use';

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      role="alert"
      aria-live="polite"
    >
      <div className="bg-[var(--surface)] border border-[var(--secondary)] rounded-lg shadow-lg p-4 flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {needRefresh ? (
            <RefreshCw className="w-6 h-6 text-[var(--accent)]" />
          ) : (
            <Check className="w-6 h-6 text-[var(--success)]" />
          )}
        </div>

        {/* Message */}
        <p className="flex-1 text-sm text-[var(--primary)]">{message}</p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {needRefresh && (
            <button
              onClick={update}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
              aria-label="Update now"
            >
              Update
            </button>
          )}
          <button
            onClick={close}
            className="p-1.5 rounded-md text-[var(--secondary)] hover:bg-[var(--bg)] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PWAUpdatePrompt;
