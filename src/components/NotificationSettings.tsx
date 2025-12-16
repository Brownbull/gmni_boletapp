/**
 * Notification Settings Component - Story 9.18
 *
 * Settings UI for push notifications.
 * Shows permission status and enable/disable toggle.
 */

import { useState } from 'react';
import { Bell, BellOff, Check, AlertCircle, Loader2, Send } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Firestore } from 'firebase/firestore';

interface NotificationSettingsProps {
  t: (key: string) => string;
  theme: 'light' | 'dark';
  db: Firestore | null;
  userId: string | null;
  appId: string | null;
  /** Optional callback to show toast messages */
  onShowToast?: (message: string) => void;
}

/**
 * Notification Settings - Enable/disable push notifications
 */
export function NotificationSettings({
  t,
  theme,
  db,
  userId,
  appId,
  onShowToast
}: NotificationSettingsProps) {
  const {
    isSupported,
    permission,
    token,
    isLoading,
    error,
    enableNotifications,
    disableNotifications
  } = usePushNotifications({
    db,
    userId,
    appId,
    onNotificationReceived: (title, body) => {
      // Show toast when foreground notification is received
      if (onShowToast) {
        onShowToast(`${title}: ${body}`);
      }
    }
  });

  const isDark = theme === 'dark';

  // Card styling using CSS variables (matches PWASettingsSection pattern)
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface)',
    borderColor: isDark ? '#334155' : '#e2e8f0',
  };

  // Button styling
  const getButtonStyle = (variant: 'primary' | 'secondary' | 'success' | 'warning'): React.CSSProperties => {
    const styles = {
      primary: {
        backgroundColor: isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.2)',
        color: 'var(--accent)',
      },
      secondary: {
        backgroundColor: isDark ? '#334155' : '#e2e8f0',
        color: 'var(--secondary)',
      },
      success: {
        backgroundColor: isDark ? 'rgba(74, 222, 128, 0.2)' : 'rgba(34, 197, 94, 0.15)',
        color: 'var(--success)',
      },
      warning: {
        backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.15)',
        color: isDark ? '#fbbf24' : '#d97706',
      },
    };
    return styles[variant];
  };

  // Don't render if notifications aren't supported
  if (!isSupported) {
    return null;
  }

  const [isSendingTest, setIsSendingTest] = useState(false);

  const isEnabled = permission === 'granted' && token;
  const isDenied = permission === 'denied';

  const handleTestNotification = async () => {
    setIsSendingTest(true);
    try {
      // Show a local notification directly (doesn't require server)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(t('testNotificationTitle'), {
          body: t('testNotificationBody'),
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'gastify-test-notification'
        });
        if (onShowToast) {
          onShowToast(t('testNotificationSent'));
        }
      }
    } catch (err) {
      console.error('Failed to send test notification:', err);
      if (onShowToast) {
        onShowToast(t('testNotificationFailed'));
      }
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleToggle = async () => {
    if (isEnabled) {
      await disableNotifications();
      if (onShowToast) {
        onShowToast(t('notificationsDisabled'));
      }
    } else {
      const success = await enableNotifications();
      if (success && onShowToast) {
        onShowToast(t('notificationsEnabled'));
      }
    }
  };

  return (
    <div className="p-4 rounded-xl border" style={cardStyle}>
      <div className="flex gap-2 items-center mb-4">
        <Bell size={24} strokeWidth={2} style={{ color: 'var(--accent)' }} />
        <span className="font-medium" style={{ color: 'var(--primary)' }}>
          {t('notifications')}
        </span>
      </div>

      <div className="space-y-3">
        {/* Permission Status and Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
              {t('pushNotifications')}
            </p>
            <p className="text-xs" style={{ color: 'var(--secondary)' }}>
              {isDenied
                ? t('notificationsDeniedHint')
                : isEnabled
                  ? t('notificationsEnabledHint')
                  : t('notificationsHint')}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={isLoading || isDenied}
            className="min-h-11 px-4 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
            style={
              isDenied
                ? getButtonStyle('warning')
                : isEnabled
                  ? getButtonStyle('success')
                  : getButtonStyle('primary')
            }
            aria-label={isEnabled ? t('disableNotifications') : t('enableNotifications')}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('loading')}
              </>
            ) : isDenied ? (
              <>
                <BellOff size={18} />
                {t('notificationsDenied')}
              </>
            ) : isEnabled ? (
              <>
                <Check size={18} />
                {t('enabled')}
              </>
            ) : (
              <>
                <Bell size={18} />
                {t('enable')}
              </>
            )}
          </button>
        </div>

        {/* Test Notification Button - only shown when enabled */}
        {isEnabled && (
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                {t('testNotification')}
              </p>
              <p className="text-xs" style={{ color: 'var(--secondary)' }}>
                {t('testNotificationHint')}
              </p>
            </div>
            <button
              onClick={handleTestNotification}
              disabled={isSendingTest}
              className="min-h-11 px-4 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
              style={getButtonStyle('primary')}
              aria-label={t('testNotification')}
            >
              {isSendingTest ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Send size={18} />
                  {t('test')}
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg text-xs"
            style={{
              backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.08)',
              color: 'var(--error)',
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Denied State Instructions */}
        {isDenied && (
          <div
            className="p-3 rounded-lg text-xs"
            style={{
              backgroundColor: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.15)'}`,
            }}
          >
            <p className="font-medium mb-2" style={{ color: isDark ? '#fbbf24' : '#d97706' }}>
              {t('notificationsDeniedTitle')}
            </p>
            <p style={{ color: 'var(--secondary)' }}>
              {t('notificationsDeniedInstructions')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationSettings;
