/**
 * PWA Settings Section Component - Story 9.14
 *
 * Displays PWA-related settings including Install and Update buttons.
 * Shows manual install instructions when automatic install isn't available.
 */

import { Smartphone, RefreshCw, Check, Download, MoreVertical, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { usePWAUpdate } from '../hooks/usePWAUpdate';

interface PWASettingsSectionProps {
  t: (key: string) => string;
  theme: 'light' | 'dark';
}

// Detect browser and platform for install instructions
function getInstallInstructions(t: (key: string) => string): { steps: string[]; icon: 'menu' | 'share' } {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isSamsung = /samsungbrowser/.test(ua);

  if (isIOS) {
    // iOS Safari: Share button -> Add to Home Screen
    return {
      steps: [
        t('installStepIOSTapShare'),
        t('installStepIOSAddHome'),
      ],
      icon: 'share',
    };
  } else if (isSamsung) {
    // Samsung Internet: Menu -> Add page to -> Home screen
    return {
      steps: [
        t('installStepMenuTap'),
        t('installStepSamsungAdd'),
      ],
      icon: 'menu',
    };
  } else if (isAndroid) {
    // Chrome Android: Menu -> Install app / Add to Home screen
    return {
      steps: [
        t('installStepMenuTap'),
        t('installStepChromeInstall'),
      ],
      icon: 'menu',
    };
  } else {
    // Desktop Chrome/Edge: Menu -> Install app
    return {
      steps: [
        t('installStepMenuTap'),
        t('installStepDesktopInstall'),
      ],
      icon: 'menu',
    };
  }
}

/**
 * PWA Settings Section - Install and Update buttons for Settings view
 */
export function PWASettingsSection({ t, theme }: PWASettingsSectionProps) {
  const { canInstall, isInstalled, isInstalling, install } = usePWAInstall();
  const { needRefresh, offlineReady, checking, update, checkForUpdates } = usePWAUpdate();

  const isDark = theme === 'dark';

  // Card styling using CSS variables (matches SettingsView pattern)
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface)',
    borderColor: isDark ? '#334155' : '#e2e8f0',
  };

  // Button styling
  const getButtonStyle = (variant: 'primary' | 'secondary' | 'success'): React.CSSProperties => {
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
    };
    return styles[variant];
  };

  // Get platform-specific install instructions
  const installInstructions = getInstallInstructions(t);
  const showManualInstructions = !canInstall && !isInstalled;

  return (
    <div className="p-4 rounded-xl border" style={cardStyle}>
      <div className="flex gap-2 items-center mb-4">
        <Smartphone size={24} strokeWidth={2} style={{ color: 'var(--accent)' }} />
        <span className="font-medium" style={{ color: 'var(--primary)' }}>
          {t('pwaSettings')}
        </span>
      </div>

      <div className="space-y-3">
        {/* Install App Section */}
        <div>
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                {t('installApp')}
              </p>
              <p className="text-xs" style={{ color: 'var(--secondary)' }}>
                {isInstalled
                  ? t('appAlreadyInstalled')
                  : canInstall
                    ? t('installAppHint')
                    : t('installManualHint')}
              </p>
            </div>
            <button
              onClick={install}
              disabled={!canInstall || isInstalling || isInstalled}
              className="min-h-11 px-4 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
              style={
                isInstalled
                  ? getButtonStyle('success')
                  : canInstall
                    ? getButtonStyle('primary')
                    : getButtonStyle('secondary')
              }
              aria-label={t('installApp')}
            >
              {isInstalled ? (
                <>
                  <Check size={18} />
                  {t('installed')}
                </>
              ) : isInstalling ? (
                <>
                  <Download size={18} className="animate-bounce" />
                  {t('installing')}
                </>
              ) : (
                <>
                  <Download size={18} />
                  {t('install')}
                </>
              )}
            </button>
          </div>

          {/* Manual Install Instructions */}
          {showManualInstructions && (
            <div
              className="mt-3 p-3 rounded-lg text-xs"
              style={{
                backgroundColor: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`,
              }}
            >
              <p className="font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                {installInstructions.icon === 'share' ? (
                  <Share size={14} />
                ) : (
                  <MoreVertical size={14} />
                )}
                {t('installManualTitle')}
              </p>
              <ol className="list-decimal list-inside space-y-1" style={{ color: 'var(--secondary)' }}>
                {installInstructions.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Update App Section */}
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
              {t('updateApp')}
            </p>
            <p className="text-xs" style={{ color: 'var(--secondary)' }}>
              {checking
                ? t('checkingForUpdates')
                : needRefresh
                  ? t('updateAvailable')
                  : offlineReady
                    ? t('appUpToDate')
                    : t('tapToCheckUpdates')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Check for Updates button - always visible when not checking and no update ready */}
            {!needRefresh && (
              <button
                onClick={checkForUpdates}
                disabled={checking}
                className="min-h-11 px-4 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                style={getButtonStyle('primary')}
                aria-label={t('checkUpdates')}
              >
                <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
                {checking ? t('checking') : t('checkUpdates')}
              </button>
            )}
            {/* Update Now button - only visible when update is ready */}
            {needRefresh && (
              <button
                onClick={update}
                className="min-h-11 px-4 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                style={getButtonStyle('success')}
                aria-label={t('pwaUpdate')}
              >
                <Download size={18} />
                {t('pwaUpdate')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWASettingsSection;
