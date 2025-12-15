/**
 * PWA Settings Section Component - Story 9.14
 *
 * Displays PWA-related settings including Install and Update buttons.
 */

import { Smartphone, RefreshCw, Check, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { usePWAUpdate } from '../hooks/usePWAUpdate';

interface PWASettingsSectionProps {
  t: (key: string) => string;
  theme: 'light' | 'dark';
}

/**
 * PWA Settings Section - Install and Update buttons for Settings view
 */
export function PWASettingsSection({ t, theme }: PWASettingsSectionProps) {
  const { canInstall, isInstalled, isInstalling, install } = usePWAInstall();
  const { needRefresh, offlineReady, update } = usePWAUpdate();

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

  return (
    <div className="p-4 rounded-xl border" style={cardStyle}>
      <div className="flex gap-2 items-center mb-4">
        <Smartphone size={24} strokeWidth={2} style={{ color: 'var(--accent)' }} />
        <span className="font-medium" style={{ color: 'var(--primary)' }}>
          {t('pwaSettings')}
        </span>
      </div>

      <div className="space-y-3">
        {/* Install App Button */}
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
                  : t('installNotAvailable')}
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

        {/* Update App Button */}
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
              {t('updateApp')}
            </p>
            <p className="text-xs" style={{ color: 'var(--secondary)' }}>
              {needRefresh
                ? t('updateAvailable')
                : offlineReady
                  ? t('appUpToDate')
                  : t('checkingForUpdates')}
            </p>
          </div>
          <button
            onClick={update}
            disabled={!needRefresh}
            className="min-h-11 px-4 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
            style={needRefresh ? getButtonStyle('primary') : getButtonStyle('secondary')}
            aria-label={t('updateApp')}
          >
            {needRefresh ? (
              <>
                <RefreshCw size={18} />
                {t('pwaUpdate')}
              </>
            ) : (
              <>
                <Check size={18} />
                {t('upToDate')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PWASettingsSection;
