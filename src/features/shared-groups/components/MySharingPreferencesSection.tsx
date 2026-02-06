/**
 * MySharingPreferencesSection - User's personal transaction sharing preferences
 *
 * Story 14d-v2-1-12d: Integration into Group Settings
 * - AC1: Show UserTransactionSharingToggle in Group Settings under "My Sharing Preferences"
 * - AC3: Show eventual consistency explanation text
 * - AC4: Info tooltip explaining double-gate model
 *
 * This component provides a dedicated section in the EditGroupDialog for users
 * to manage their personal transaction sharing preferences for a specific group.
 *
 * Architecture:
 * - Self-contained component that uses useAuth and useUserGroupPreference hooks
 * - Wires together the UserTransactionSharingToggle with proper data
 * - Handles loading and error states gracefully
 *
 * @example
 * ```tsx
 * <MySharingPreferencesSection
 *   groupId={group.id}
 *   groupSharingEnabled={group.transactionSharingEnabled}
 *   t={t}
 *   lang="es"
 *   theme="light"
 * />
 * ```
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { UserTransactionSharingToggle } from './UserTransactionSharingToggle';
import { InfoTooltip } from './InfoTooltip';
import { useUserGroupPreference } from '../hooks/useUserGroupPreference';
import { useAuth } from '@/hooks/useAuth';

// =============================================================================
// Types
// =============================================================================

/**
 * Props for MySharingPreferencesSection component.
 */
export interface MySharingPreferencesSectionProps {
  /** ID of the group this section belongs to */
  groupId: string;
  /** Whether the group owner has enabled transaction sharing at group level */
  groupSharingEnabled?: boolean;
  /** Translation function */
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Language for fallback text */
  lang?: 'en' | 'es';
  /** Theme for styling */
  theme?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * MySharingPreferencesSection displays user's personal transaction sharing
 * preferences within the Group Settings dialog.
 *
 * Features:
 * - Section header with info tooltip (AC4: double-gate explanation)
 * - UserTransactionSharingToggle component (AC1)
 * - Eventual consistency notice (AC3)
 * - Warning when group-level sharing is disabled
 */
export const MySharingPreferencesSection: React.FC<MySharingPreferencesSectionProps> = ({
  groupId,
  groupSharingEnabled = true,
  t,
  lang = 'es',
  theme = 'light',
}) => {
  const [isPending, setIsPending] = useState(false);
  const isMountedRef = useRef(true);
  const isDark = theme === 'dark';

  // Cleanup ref on unmount to prevent setState after unmount
  useEffect(() => () => { isMountedRef.current = false; }, []);

  // Get auth context
  const { user, services } = useAuth();

  // Memoize services object to prevent re-creating on every render
  // This is critical - creating a new object inline causes useEffect to re-run
  // on every render, which unsubscribes/resubscribes the Firestore listener
  // before it can fire its callback
  const memoizedServices = useMemo(
    () => (services ? { db: services.db, appId: services.appId } : null),
    [services]
  );

  // Get user's group preference with hook
  const { preference, isLoading, updatePreference, canToggle, error } = useUserGroupPreference(
    user,
    memoizedServices,
    groupId
  );

  // Handle toggle with success/error feedback
  const handleToggle = useCallback(
    async (enabled: boolean): Promise<void> => {
      setIsPending(true);
      try {
        await updatePreference(enabled);
        // Success - preference updated (toast shown by parent or via context)
      } finally {
        if (isMountedRef.current) setIsPending(false);
      }
    },
    [updatePreference]
  );

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={`rounded-lg border p-4 ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}
        data-testid="my-sharing-preferences-section"
      >
        <div className="flex items-center gap-2 mb-3">
          <h4
            className={`font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-800'
            }`}
          >
            {t('mySharingPreferences')}
          </h4>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2
            size={20}
            className={`animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      }`}
      data-testid="my-sharing-preferences-section"
    >
      {/* Section Header with Info Tooltip (AC4) */}
      <div className="flex items-center gap-2 mb-3">
        <h4
          className={`font-medium ${
            isDark ? 'text-gray-200' : 'text-gray-800'
          }`}
        >
          {t('mySharingPreferences')}
        </h4>
        <InfoTooltip
          content={t('doubleGateTooltip')}
          iconSize={16}
          testId="double-gate-tooltip"
          autoDismissMs={5000}
        />
      </div>

      {/* Description */}
      <p
        className={`text-sm mb-4 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        {t('mySharingPreferencesDesc')}
      </p>

      {/* Toggle Component (AC1) */}
      <div className="mb-3" data-testid="user-transaction-sharing-toggle">
        <UserTransactionSharingToggle
          preference={preference}
          groupSharingEnabled={groupSharingEnabled}
          canToggle={canToggle}
          onToggle={handleToggle}
          isPending={isPending}
          t={t}
        />
      </div>

      {/* Eventual Consistency Notice (AC3) */}
      <p className="text-xs text-gray-500">
        {t('eventualConsistencyNotice')}
      </p>

      {/* Group-level sharing disabled warning */}
      {!groupSharingEnabled && (
        <div
          className={`mt-3 p-2 rounded text-xs ${
            isDark
              ? 'bg-yellow-900/20 text-yellow-400'
              : 'bg-yellow-50 text-yellow-700'
          }`}
        >
          {t('groupSharingDisabledWarning') ||
            (lang === 'es'
              ? 'El dueno del grupo ha desactivado compartir transacciones. Tu preferencia se guardara pero no tendra efecto hasta que se reactive.'
              : "The group owner has disabled transaction sharing. Your preference will be saved but won't take effect until sharing is re-enabled.")}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className={`mt-3 p-2 rounded text-xs ${
            isDark
              ? 'bg-red-900/20 text-red-400'
              : 'bg-red-50 text-red-700'
          }`}
          data-testid="preference-error"
        >
          {t('failedToUpdatePreference') || 'Failed to load preference. Please try again.'}
        </div>
      )}
    </div>
  );
};

export default MySharingPreferencesSection;
