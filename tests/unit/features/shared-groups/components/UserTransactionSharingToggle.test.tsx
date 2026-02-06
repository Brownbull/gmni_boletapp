/**
 * Story 14d-v2-1-12c: UserTransactionSharingToggle Component Tests
 *
 * Tests the UserTransactionSharingToggle component for:
 * - Toggle with helper text and current state display (AC #1, AC #2)
 * - Cooldown UI: disabled toggle + "Please wait X minutes" (AC #3)
 * - Daily limit UI: disabled toggle + "Daily limit reached" (AC #4)
 * - Disabled when group-level sharing is off (AC #5)
 * - Success toast notification via onToggle callback (AC #6)
 * - Error toast + optimistic rollback on failure (AC #7, AC #8)
 * - 12+ unit tests (AC #9)
 *
 * TDD Methodology:
 * - Tests written FIRST (RED phase)
 * - Implementation follows to make tests pass (GREEN phase)
 * - Refactoring with tests green (REFACTOR phase)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UserTransactionSharingToggle } from '@/features/shared-groups/components/UserTransactionSharingToggle';
import type { UserTransactionSharingToggleProps } from '@/features/shared-groups/components/UserTransactionSharingToggle';
import type { UserGroupPreference } from '@/types/sharedGroup';
import type { UserToggleCooldownResult } from '@/utils/userSharingCooldown';
import type { Timestamp } from 'firebase/firestore';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Creates a mock Timestamp for testing.
 */
const createMockTimestamp = (date: Date): Timestamp => ({
  toDate: () => date,
  toMillis: () => date.getTime(),
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  isEqual: () => false,
  valueOf: () => '',
} as Timestamp);

/**
 * Creates a mock UserGroupPreference with customizable properties.
 */
const createMockPreference = (overrides: Partial<UserGroupPreference> = {}): UserGroupPreference => ({
  shareMyTransactions: true,
  lastToggleAt: null,
  toggleCountToday: 0,
  toggleCountResetAt: null,
  ...overrides,
});

/**
 * Mock translation function.
 */
const mockT = (key: string): string => {
  const translations: Record<string, string> = {
    shareMyTransactionsLabel: 'Share My Transactions',
    shareMyTransactionsHelperText: 'Your spending totals always appear in group statistics. This controls whether others see your individual transaction details.',
    sharingPreferenceUpdated: 'Sharing preference updated',
    failedToUpdatePreference: 'Failed to update preference. Please try again.',
    userSharingCooldownActive: 'Please wait {minutes} minutes before changing this setting',
    userSharingDailyLimitReached: 'Daily limit reached. Try again tomorrow.',
    sharingDisabledByOwner: 'Transaction sharing is disabled for this group by the owner',
  };
  return translations[key] || key;
};

/**
 * Default props for rendering the component.
 */
const createDefaultProps = (overrides: Partial<UserTransactionSharingToggleProps> = {}): UserTransactionSharingToggleProps => ({
  preference: createMockPreference(),
  groupSharingEnabled: true,
  canToggle: { allowed: true },
  onToggle: vi.fn().mockResolvedValue(undefined),
  isPending: false,
  t: mockT,
  ...overrides,
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Renders UserTransactionSharingToggle with default props merged with overrides.
 */
const renderToggle = (overrides: Partial<UserTransactionSharingToggleProps> = {}) => {
  const props = createDefaultProps(overrides);
  return {
    ...render(<UserTransactionSharingToggle {...props} />),
    props,
  };
};

// =============================================================================
// Tests
// =============================================================================

describe('UserTransactionSharingToggle (Story 14d-v2-1-12c)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // AC #1, AC #2: Toggle with correct initial state and helper text
  // ===========================================================================
  describe('AC #1, AC #2: Toggle with correct initial state and helper text', () => {
    it('renders toggle with correct initial state (enabled)', () => {
      const preference = createMockPreference({ shareMyTransactions: true });
      renderToggle({ preference });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('renders toggle with correct initial state (disabled)', () => {
      const preference = createMockPreference({ shareMyTransactions: false });
      renderToggle({ preference });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('renders info tooltip button with helper text', async () => {
      renderToggle();

      // Info button should be visible
      const infoButton = screen.getByTestId('user-sharing-info-button');
      expect(infoButton).toBeInTheDocument();

      // Click to open tooltip
      await act(async () => {
        fireEvent.click(infoButton);
      });

      // Tooltip should now be visible with helper text
      const tooltip = screen.getByTestId('user-sharing-info');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('Your spending totals always appear in group statistics. This controls whether others see your individual transaction details.');
    });

    it('displays the toggle label', () => {
      renderToggle();

      expect(screen.getByText('Share My Transactions')).toBeInTheDocument();
    });

    it('handles null preference gracefully (defaults to disabled)', () => {
      renderToggle({ preference: null });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  // ===========================================================================
  // AC #3: Cooldown UI
  // ===========================================================================
  describe('AC #3: Cooldown UI', () => {
    it('shows cooldown message when in cooldown', () => {
      const canToggle: UserToggleCooldownResult = {
        allowed: false,
        waitMinutes: 3,
        reason: 'cooldown',
      };

      renderToggle({ canToggle });

      const cooldownMessage = screen.getByTestId('user-sharing-cooldown-message');
      expect(cooldownMessage).toBeInTheDocument();
      expect(cooldownMessage).toHaveTextContent('Please wait 3 minutes before changing this setting');
    });

    it('disables toggle during cooldown', () => {
      const canToggle: UserToggleCooldownResult = {
        allowed: false,
        waitMinutes: 5,
        reason: 'cooldown',
      };

      renderToggle({ canToggle });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      expect(toggle).toBeDisabled();
    });
  });

  // ===========================================================================
  // AC #4: Daily limit UI
  // ===========================================================================
  describe('AC #4: Daily limit UI', () => {
    it('shows daily limit message when limit reached', () => {
      const canToggle: UserToggleCooldownResult = {
        allowed: false,
        reason: 'daily_limit',
      };

      renderToggle({ canToggle });

      const limitMessage = screen.getByTestId('user-sharing-cooldown-message');
      expect(limitMessage).toBeInTheDocument();
      expect(limitMessage).toHaveTextContent('Daily limit reached. Try again tomorrow.');
    });

    it('disables toggle when daily limit reached', () => {
      const canToggle: UserToggleCooldownResult = {
        allowed: false,
        reason: 'daily_limit',
      };

      renderToggle({ canToggle });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      expect(toggle).toBeDisabled();
    });
  });

  // ===========================================================================
  // AC #5: Disabled when group-level sharing is off
  // ===========================================================================
  describe('AC #5: Disabled when group-level sharing is off', () => {
    it('shows disabled message when group sharing is off', () => {
      renderToggle({ groupSharingEnabled: false });

      const disabledNotice = screen.getByTestId('user-sharing-disabled-notice');
      expect(disabledNotice).toBeInTheDocument();
      expect(disabledNotice).toHaveTextContent('Transaction sharing is disabled for this group by the owner');
    });

    it('disables toggle when group sharing is off', () => {
      renderToggle({ groupSharingEnabled: false });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      expect(toggle).toBeDisabled();
    });

    it('prioritizes group-disabled message over cooldown message', () => {
      const canToggle: UserToggleCooldownResult = {
        allowed: false,
        waitMinutes: 5,
        reason: 'cooldown',
      };

      renderToggle({ groupSharingEnabled: false, canToggle });

      // Should show group-disabled message, not cooldown
      const disabledNotice = screen.getByTestId('user-sharing-disabled-notice');
      expect(disabledNotice).toHaveTextContent('Transaction sharing is disabled for this group by the owner');
    });
  });

  // ===========================================================================
  // AC #6: onToggle callback
  // ===========================================================================
  describe('AC #6: onToggle callback', () => {
    it('calls onToggle with new value when clicked', async () => {
      const preference = createMockPreference({ shareMyTransactions: true });
      const onToggle = vi.fn().mockResolvedValue(undefined);

      renderToggle({ preference, onToggle });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');

      await act(async () => {
        fireEvent.click(toggle);
      });

      expect(onToggle).toHaveBeenCalledWith(false);
    });

    it('calls onToggle with true when currently disabled', async () => {
      const preference = createMockPreference({ shareMyTransactions: false });
      const onToggle = vi.fn().mockResolvedValue(undefined);

      renderToggle({ preference, onToggle });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');

      await act(async () => {
        fireEvent.click(toggle);
      });

      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });

  // ===========================================================================
  // AC #7, AC #8: Optimistic UI and rollback on error
  // ===========================================================================
  describe('AC #7, AC #8: Optimistic UI and rollback on error', () => {
    it('shows optimistic state immediately after click', async () => {
      const preference = createMockPreference({ shareMyTransactions: true });
      // Create a promise that we control for timing
      let resolveToggle: () => void;
      const togglePromise = new Promise<void>((resolve) => {
        resolveToggle = resolve;
      });
      const onToggle = vi.fn().mockReturnValue(togglePromise);

      renderToggle({ preference, onToggle });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'true');

      // Click to toggle - should immediately show optimistic state
      await act(async () => {
        fireEvent.click(toggle);
      });

      // Optimistic state: should show false immediately
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      // Resolve the promise
      await act(async () => {
        resolveToggle!();
      });
    });

    it('reverts to original state on error (optimistic rollback)', async () => {
      const preference = createMockPreference({ shareMyTransactions: true });
      const onToggle = vi.fn().mockRejectedValue(new Error('Network error'));

      renderToggle({ preference, onToggle });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'true');

      await act(async () => {
        fireEvent.click(toggle);
      });

      // After error, should revert to original state
      await waitFor(() => {
        expect(toggle).toHaveAttribute('aria-checked', 'true');
      });
    });
  });

  // ===========================================================================
  // Pending state
  // ===========================================================================
  describe('Pending state', () => {
    it('disables toggle during pending state', () => {
      renderToggle({ isPending: true });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      expect(toggle).toBeDisabled();
    });

    it('does not call onToggle when pending', async () => {
      const onToggle = vi.fn();
      renderToggle({ isPending: true, onToggle });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');

      await act(async () => {
        fireEvent.click(toggle);
      });

      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // ARIA attributes
  // ===========================================================================
  describe('ARIA attributes', () => {
    it('has correct ARIA attributes (role="switch", aria-checked)', () => {
      renderToggle();

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      expect(toggle).toHaveAttribute('role', 'switch');
      expect(toggle).toHaveAttribute('aria-checked');
    });

    it('has correct aria-checked="true" when enabled', () => {
      const preference = createMockPreference({ shareMyTransactions: true });
      renderToggle({ preference });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('has correct aria-checked="false" when disabled', () => {
      const preference = createMockPreference({ shareMyTransactions: false });
      renderToggle({ preference });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  // ===========================================================================
  // Visual styling
  // ===========================================================================
  describe('Visual styling', () => {
    it('applies correct background color when enabled', () => {
      const preference = createMockPreference({ shareMyTransactions: true });
      renderToggle({ preference });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      // JSDOM doesn't resolve CSS variables, so check inline style attribute
      expect(toggle.getAttribute('style')).toContain('--primary');
    });

    it('applies correct background color when disabled', () => {
      const preference = createMockPreference({ shareMyTransactions: false });
      renderToggle({ preference });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');
      // JSDOM doesn't resolve CSS variables, so check inline style attribute
      expect(toggle.getAttribute('style')).toContain('--border-light');
    });

    it('cooldown message uses warning color', () => {
      const canToggle: UserToggleCooldownResult = {
        allowed: false,
        waitMinutes: 3,
        reason: 'cooldown',
      };

      renderToggle({ canToggle });

      const cooldownMessage = screen.getByTestId('user-sharing-cooldown-message');
      // Story 14d-v2-1-12c ECC Review #2: Hardcoded color assertion is brittle.
      // This is tracked in TD-14d-51 (error color CSS variable) for future improvement.
      // For now, we verify the style attribute contains the warning color.
      // TODO(TD-14d-51): Replace with CSS variable or data-attribute check.
      expect(cooldownMessage.getAttribute('style')).toContain('#ef4444');
    });
  });

  // ===========================================================================
  // Edge cases
  // ===========================================================================
  describe('Edge cases', () => {
    it('handles preference with null toggle fields gracefully', () => {
      const preference = createMockPreference({
        shareMyTransactions: true,
        lastToggleAt: null,
        toggleCountToday: 0,
        toggleCountResetAt: null,
      });

      renderToggle({ preference });

      // Should render without crashing
      expect(screen.getByTestId('user-sharing-preference-toggle')).toBeInTheDocument();
    });

    it('does not call onToggle when disabled due to cooldown', async () => {
      const canToggle: UserToggleCooldownResult = {
        allowed: false,
        waitMinutes: 5,
        reason: 'cooldown',
      };
      const onToggle = vi.fn();

      renderToggle({ canToggle, onToggle });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');

      await act(async () => {
        fireEvent.click(toggle);
      });

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('does not call onToggle when group sharing is disabled', async () => {
      const onToggle = vi.fn();

      renderToggle({ groupSharingEnabled: false, onToggle });

      const toggle = screen.getByTestId('user-sharing-preference-toggle');

      await act(async () => {
        fireEvent.click(toggle);
      });

      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Translation interpolation
  // ===========================================================================
  describe('Translation interpolation', () => {
    it('interpolates minutes correctly in cooldown message', () => {
      const canToggle: UserToggleCooldownResult = {
        allowed: false,
        waitMinutes: 4,
        reason: 'cooldown',
      };

      renderToggle({ canToggle });

      const cooldownMessage = screen.getByTestId('user-sharing-cooldown-message');
      expect(cooldownMessage).toHaveTextContent('4 minutes');
    });

    it('handles 1 minute correctly', () => {
      const canToggle: UserToggleCooldownResult = {
        allowed: false,
        waitMinutes: 1,
        reason: 'cooldown',
      };

      renderToggle({ canToggle });

      const cooldownMessage = screen.getByTestId('user-sharing-cooldown-message');
      expect(cooldownMessage).toHaveTextContent('1 minutes');
    });
  });
});
