/**
 * UserTransactionSharingToggle Component
 *
 * Story 14d-v2-1-12c: User Transaction Sharing Preference - UI Layer
 *
 * Provides a toggle UI for user-level transaction sharing preferences.
 * Features:
 * - Toggle with helper text and current state display (AC #1, AC #2)
 * - Cooldown UI: disabled toggle + "Please wait X minutes" (AC #3)
 * - Daily limit UI: disabled toggle + "Daily limit reached" (AC #4)
 * - Disabled when group-level sharing is off (AC #5)
 * - Optimistic updates with rollback on error (AC #7, AC #8)
 *
 * Key differences from TransactionSharingToggle (group-level):
 * - Uses UserGroupPreference instead of SharedGroup
 * - Uses different translation keys (shareMyTransactions*, userSharing*)
 * - Shows "disabled by owner" message when group sharing is off
 *
 * @example
 * ```tsx
 * <UserTransactionSharingToggle
 *     preference={userPreference}
 *     groupSharingEnabled={group.transactionSharingEnabled}
 *     canToggle={canToggleUserSharingPreference(userPreference)}
 *     onToggle={async (enabled) => {
 *         await updateShareMyTransactions(db, userId, appId, groupId, enabled);
 *         showToast('Sharing preference updated');
 *     }}
 *     isPending={false}
 *     t={t}
 * />
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import type { UserGroupPreference } from '@/types/sharedGroup';
import type { UserToggleCooldownResult } from '@/utils/userSharingCooldown';
import { InfoTooltip } from './InfoTooltip';

// =============================================================================
// Types
// =============================================================================

/**
 * Props for UserTransactionSharingToggle component.
 */
export interface UserTransactionSharingToggleProps {
  /** User's preference for this group (null if not set) */
  preference: UserGroupPreference | null;
  /** Whether group-level transaction sharing is enabled */
  groupSharingEnabled: boolean;
  /** Result of cooldown check - whether toggling is allowed */
  canToggle: UserToggleCooldownResult;
  /** Callback when toggle changes - should call updateShareMyTransactions and show toast */
  onToggle: (enabled: boolean) => Promise<void>;
  /** Whether a toggle operation is in progress */
  isPending: boolean;
  /** Translation function */
  t: (key: string) => string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * UserTransactionSharingToggle provides a toggle UI for managing user-level
 * transaction sharing preferences with cooldown/rate-limit awareness.
 */
export function UserTransactionSharingToggle({
  preference,
  groupSharingEnabled,
  canToggle,
  onToggle,
  isPending,
  t,
}: UserTransactionSharingToggleProps): JSX.Element {
  // Local state for optimistic updates
  const [optimisticEnabled, setOptimisticEnabled] = useState<boolean | null>(null);

  // Get current sharing state (default to false if no preference)
  const actualEnabled = preference?.shareMyTransactions ?? false;

  // Calculate the display value (optimistic or actual)
  const displayEnabled = optimisticEnabled !== null
    ? optimisticEnabled
    : actualEnabled;

  // Determine if toggle should be disabled
  const isDisabled = isPending || !groupSharingEnabled || !canToggle.allowed;

  // Memoize cooldown message calculation (Story 14d-v2-1-12c Action Item)
  const cooldownMessage = useMemo((): string | null => {
    if (!canToggle.allowed) {
      if (canToggle.reason === 'cooldown' && canToggle.waitMinutes) {
        // Story 14d-v2-1-12c ECC Review #2: Translation interpolation safety documentation
        //
        // SAFETY NOTES:
        // - The `{minutes}` placeholder is replaced with `canToggle.waitMinutes` which is a number
        // - Number-to-string conversion via String() is inherently safe (no XSS risk)
        // - The translation key 'userSharingCooldownActive' is a static string from translations.ts
        // - No user-provided content is interpolated, only computed numeric values
        const message = t('userSharingCooldownActive');
        return message.replace('{minutes}', String(canToggle.waitMinutes));
      }
      if (canToggle.reason === 'daily_limit') {
        return t('userSharingDailyLimitReached');
      }
    }
    return null;
  }, [canToggle, t]);

  /**
   * Handle toggle click with optimistic update and rollback on error.
   */
  const handleToggle = useCallback(async () => {
    // Don't toggle if disabled
    if (isDisabled) return;

    const newValue = !displayEnabled;

    // Apply optimistic update immediately
    setOptimisticEnabled(newValue);

    try {
      await onToggle(newValue);
      // On success, clear optimistic state (will use actual preference value)
      setOptimisticEnabled(null);
    } catch {
      // On error, rollback to original state
      setOptimisticEnabled(null);
    }
  }, [displayEnabled, isDisabled, onToggle]);

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-light)',
      }}
      data-testid="user-sharing-container"
    >
      {/* Toggle Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label
            id="user-sharing-label"
            htmlFor="user-sharing-toggle"
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('shareMyTransactionsLabel')}
          </label>
          <InfoTooltip
            content={t('shareMyTransactionsHelperText')}
            iconSize={14}
            testId="user-sharing-info"
            autoDismissMs={5000}
          />
        </div>
        <button
          id="user-sharing-toggle"
          role="switch"
          type="button"
          aria-checked={displayEnabled}
          aria-labelledby="user-sharing-label"
          aria-describedby={
            !groupSharingEnabled
              ? 'user-sharing-disabled-notice'
              : cooldownMessage
                ? 'user-sharing-cooldown'
                : undefined
          }
          onClick={handleToggle}
          disabled={isDisabled}
          className="relative w-12 h-7 rounded-full transition-colors disabled:opacity-50"
          style={{
            backgroundColor: displayEnabled
              ? 'var(--primary)'
              : 'var(--border-light)',
          }}
          data-testid="user-sharing-preference-toggle"
        >
          <span
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
            style={{
              left: displayEnabled ? '26px' : '4px',
            }}
          />
        </button>
      </div>

      {/* Disabled by Owner Notice (highest priority) */}
      {!groupSharingEnabled && (
        <div
          id="user-sharing-disabled-notice"
          className="mt-3 text-xs"
          style={{ color: '#ef4444' }}
          data-testid="user-sharing-disabled-notice"
        >
          {t('sharingDisabledByOwner')}
        </div>
      )}

      {/* Cooldown/Rate Limit Message (only show if group sharing is enabled) */}
      {groupSharingEnabled && cooldownMessage && (
        <div
          id="user-sharing-cooldown"
          className="mt-3 text-xs"
          style={{ color: '#ef4444' }}
          data-testid="user-sharing-cooldown-message"
        >
          {cooldownMessage}
        </div>
      )}
    </div>
  );
}
