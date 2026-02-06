/**
 * TransactionSharingToggle Component
 *
 * Story 14d-v2-1-11c: Transaction Sharing Toggle UI
 *
 * Provides a toggle UI for group-level transaction sharing settings.
 * Features:
 * - Toggle with helper text and current state display (AC #1, AC #2)
 * - Cooldown UI: disabled toggle + "Please wait X minutes" (AC #3)
 * - Daily limit UI: disabled toggle + "Daily limit reached" (AC #4)
 * - Read-only mode for non-owners (AC #5)
 * - Optimistic updates with rollback on error (AC #7, AC #8)
 *
 * @example
 * ```tsx
 * <TransactionSharingToggle
 *     group={group}
 *     isOwner={true}
 *     onToggle={async (enabled) => {
 *         await updateTransactionSharingEnabled(db, groupId, userId, enabled);
 *         showToast('Transaction sharing updated');
 *     }}
 *     isPending={false}
 *     t={t}
 * />
 * ```
 */

import { useState, useCallback } from 'react';
import type { SharedGroup } from '@/types/sharedGroup';
import { canToggleTransactionSharing } from '@/utils/sharingCooldown';
import { InfoTooltip } from './InfoTooltip';

// =============================================================================
// Types
// =============================================================================

/**
 * Props for TransactionSharingToggle component.
 */
export interface TransactionSharingToggleProps {
    /** Group to manage toggle for */
    group: SharedGroup;
    /** Whether current user is the group owner */
    isOwner: boolean;
    /** Callback when toggle changes - should call updateTransactionSharingEnabled and show toast */
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
 * TransactionSharingToggle provides a toggle UI for managing group-level
 * transaction sharing settings with cooldown/rate-limit awareness.
 */
export function TransactionSharingToggle({
    group,
    isOwner,
    onToggle,
    isPending,
    t,
}: TransactionSharingToggleProps): JSX.Element {
    // Local state for optimistic updates
    const [optimisticEnabled, setOptimisticEnabled] = useState<boolean | null>(null);

    // Calculate the display value (optimistic or actual)
    const displayEnabled = optimisticEnabled !== null
        ? optimisticEnabled
        : group.transactionSharingEnabled;

    // Check if toggling is allowed (cooldown/rate-limit)
    const cooldownResult = canToggleTransactionSharing(group);

    // Determine if toggle should be disabled
    const isDisabled = isPending || !isOwner || !cooldownResult.allowed;

    // Determine which message to show (priority: non-owner > cooldown > daily_limit)
    const getMessage = (): string | null => {
        if (!isOwner) {
            return t('transactionSharingOwnerOnly');
        }
        if (!cooldownResult.allowed) {
            if (cooldownResult.reason === 'cooldown' && cooldownResult.waitMinutes) {
                // Interpolate the minutes into the message
                const message = t('transactionSharingCooldownActive');
                return message.replace('{minutes}', String(cooldownResult.waitMinutes));
            }
            if (cooldownResult.reason === 'daily_limit') {
                return t('transactionSharingDailyLimitReached');
            }
        }
        return null;
    };

    const restrictionMessage = getMessage();

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
            // On success, clear optimistic state (will use actual group value)
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
            data-testid="transaction-sharing-container"
        >
            {/* Toggle Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <label
                        id="transaction-sharing-label"
                        htmlFor="transaction-sharing-toggle"
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {t('transactionSharingToggleLabel')}
                    </label>
                    <InfoTooltip
                        content={t('transactionSharingHelperText')}
                        iconSize={14}
                        testId="transaction-sharing-info"
                        autoDismissMs={5000}
                    />
                </div>
                <button
                    id="transaction-sharing-toggle"
                    role="switch"
                    type="button"
                    aria-checked={displayEnabled}
                    aria-labelledby="transaction-sharing-label"
                    aria-describedby={restrictionMessage ? 'transaction-sharing-restriction' : undefined}
                    onClick={handleToggle}
                    disabled={isDisabled}
                    className="relative w-12 h-7 rounded-full transition-colors disabled:opacity-50"
                    style={{
                        backgroundColor: displayEnabled
                            ? 'var(--primary)'
                            : 'var(--border-light)',
                    }}
                    data-testid="transaction-sharing-toggle"
                >
                    <span
                        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
                        style={{
                            left: displayEnabled ? '26px' : '4px',
                        }}
                    />
                </button>
            </div>

            {/* Restriction Message (cooldown, daily limit, or non-owner) */}
            {restrictionMessage && (
                <div
                    id="transaction-sharing-restriction"
                    className="mt-3 text-xs"
                    style={{ color: '#ef4444' }}
                    data-testid="transaction-sharing-cooldown-message"
                >
                    {restrictionMessage}
                </div>
            )}
        </div>
    );
}
