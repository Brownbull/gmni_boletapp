/**
 * Story 14d-v2-1-11c: TransactionSharingToggle Component Tests
 *
 * Tests the TransactionSharingToggle component for:
 * - Toggle with helper text and current state display (AC #1, AC #2)
 * - Cooldown UI: disabled toggle + "Please wait X minutes" (AC #3)
 * - Daily limit UI: disabled toggle + "Daily limit reached" (AC #4)
 * - Read-only mode for non-owners (AC #5)
 * - Success toast notification via onToggle callback (AC #6)
 * - Error toast + optimistic rollback on failure (AC #7, AC #8)
 * - 10+ unit tests (AC #9)
 *
 * TDD Methodology:
 * - Tests written FIRST (RED phase)
 * - Implementation follows to make tests pass (GREEN phase)
 * - Refactoring with tests green (REFACTOR phase)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TransactionSharingToggle } from '@/features/shared-groups/components/TransactionSharingToggle';
import type { TransactionSharingToggleProps } from '@/features/shared-groups/components/TransactionSharingToggle';
import type { SharedGroup } from '@/types/sharedGroup';
import type { Timestamp } from 'firebase/firestore';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock canToggleTransactionSharing
const mockCanToggle = vi.fn();

vi.mock('@/utils/sharingCooldown', () => ({
    canToggleTransactionSharing: (group: SharedGroup) => mockCanToggle(group),
}));

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
 * Creates a mock SharedGroup with customizable properties.
 */
const createMockGroup = (overrides: Partial<SharedGroup> = {}): SharedGroup => ({
    id: 'group-123',
    name: 'Test Group',
    ownerId: 'owner-user-id',
    appId: 'boletapp',
    color: '#10b981',
    shareCode: 'ABC123DEF456GHIJ',
    shareCodeExpiresAt: createMockTimestamp(new Date('2026-03-01')),
    members: ['owner-user-id', 'member-user-id'],
    memberUpdates: {},
    createdAt: createMockTimestamp(new Date('2026-01-01')),
    updatedAt: createMockTimestamp(new Date('2026-01-15')),
    timezone: 'America/Santiago',
    transactionSharingEnabled: true,
    transactionSharingLastToggleAt: null,
    transactionSharingToggleCountToday: 0,
    transactionSharingToggleCountResetAt: null,
    ...overrides,
});

/**
 * Mock translation function.
 */
const mockT = (key: string): string => {
    const translations: Record<string, string> = {
        transactionSharingToggleLabel: 'Transaction Sharing',
        transactionSharingHelperText: 'When enabled, members can choose to share their transaction details with the group.',
        transactionSharingCooldownActive: 'Please wait {minutes} minutes before changing this setting',
        transactionSharingDailyLimitReached: 'Daily limit reached. Try again tomorrow.',
        transactionSharingOwnerOnly: 'Only the group owner can change this setting',
        transactionSharingEnabled: 'Transaction sharing enabled',
        transactionSharingDisabled: 'Transaction sharing disabled',
    };
    return translations[key] || key;
};

/**
 * Default props for rendering the component.
 */
const createDefaultProps = (overrides: Partial<TransactionSharingToggleProps> = {}): TransactionSharingToggleProps => ({
    group: createMockGroup(),
    isOwner: true,
    onToggle: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    t: mockT,
    lang: 'en',
    ...overrides,
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Renders TransactionSharingToggle with default props merged with overrides.
 */
const renderToggle = (overrides: Partial<TransactionSharingToggleProps> = {}) => {
    const props = createDefaultProps(overrides);
    return {
        ...render(<TransactionSharingToggle {...props} />),
        props,
    };
};

// =============================================================================
// Tests
// =============================================================================

describe('TransactionSharingToggle (Story 14d-v2-1-11c)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: toggling is allowed
        mockCanToggle.mockReturnValue({ allowed: true });
    });

    // ===========================================================================
    // AC #1, AC #2: Toggle with correct initial state and helper text
    // ===========================================================================
    describe('AC #1, AC #2: Toggle with correct initial state and helper text', () => {
        it('renders toggle with correct initial state (enabled)', () => {
            const group = createMockGroup({ transactionSharingEnabled: true });
            renderToggle({ group });

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            expect(toggle).toBeInTheDocument();
            expect(toggle).toHaveAttribute('aria-checked', 'true');
        });

        it('renders toggle with correct initial state (disabled)', () => {
            const group = createMockGroup({ transactionSharingEnabled: false });
            renderToggle({ group });

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            expect(toggle).toBeInTheDocument();
            expect(toggle).toHaveAttribute('aria-checked', 'false');
        });

        it('renders info tooltip button with helper text', async () => {
            renderToggle();

            // Info button should be visible
            const infoButton = screen.getByTestId('transaction-sharing-info-button');
            expect(infoButton).toBeInTheDocument();

            // Click to open tooltip
            await act(async () => {
                fireEvent.click(infoButton);
            });

            // Tooltip should now be visible with helper text
            const tooltip = screen.getByTestId('transaction-sharing-info');
            expect(tooltip).toBeInTheDocument();
            expect(tooltip).toHaveTextContent('When enabled, members can choose to share their transaction details with the group.');
        });

        it('displays the toggle label', () => {
            renderToggle();

            expect(screen.getByText('Transaction Sharing')).toBeInTheDocument();
        });
    });

    // ===========================================================================
    // AC #3: Cooldown UI
    // ===========================================================================
    describe('AC #3: Cooldown UI', () => {
        it('shows cooldown message when in cooldown', () => {
            mockCanToggle.mockReturnValue({
                allowed: false,
                waitMinutes: 10,
                reason: 'cooldown'
            });

            renderToggle();

            const cooldownMessage = screen.getByTestId('transaction-sharing-cooldown-message');
            expect(cooldownMessage).toBeInTheDocument();
            expect(cooldownMessage).toHaveTextContent('Please wait 10 minutes before changing this setting');
        });

        it('disables toggle during cooldown', () => {
            mockCanToggle.mockReturnValue({
                allowed: false,
                waitMinutes: 5,
                reason: 'cooldown'
            });

            renderToggle();

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            expect(toggle).toBeDisabled();
        });
    });

    // ===========================================================================
    // AC #4: Daily limit UI
    // ===========================================================================
    describe('AC #4: Daily limit UI', () => {
        it('shows daily limit message when limit reached', () => {
            mockCanToggle.mockReturnValue({
                allowed: false,
                reason: 'daily_limit'
            });

            renderToggle();

            const limitMessage = screen.getByTestId('transaction-sharing-cooldown-message');
            expect(limitMessage).toBeInTheDocument();
            expect(limitMessage).toHaveTextContent('Daily limit reached. Try again tomorrow.');
        });

        it('disables toggle when daily limit reached', () => {
            mockCanToggle.mockReturnValue({
                allowed: false,
                reason: 'daily_limit'
            });

            renderToggle();

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            expect(toggle).toBeDisabled();
        });
    });

    // ===========================================================================
    // AC #5: Read-only mode for non-owners
    // ===========================================================================
    describe('AC #5: Read-only mode for non-owners', () => {
        it('shows read-only message for non-owners', () => {
            renderToggle({ isOwner: false });

            const readOnlyMessage = screen.getByTestId('transaction-sharing-cooldown-message');
            expect(readOnlyMessage).toBeInTheDocument();
            expect(readOnlyMessage).toHaveTextContent('Only the group owner can change this setting');
        });

        it('disables toggle for non-owners', () => {
            renderToggle({ isOwner: false });

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            expect(toggle).toBeDisabled();
        });
    });

    // ===========================================================================
    // AC #6: onToggle callback
    // ===========================================================================
    describe('AC #6: onToggle callback', () => {
        it('calls onToggle with new value when clicked', async () => {
            const group = createMockGroup({ transactionSharingEnabled: true });
            const onToggle = vi.fn().mockResolvedValue(undefined);

            renderToggle({ group, onToggle });

            const toggle = screen.getByTestId('transaction-sharing-toggle');

            await act(async () => {
                fireEvent.click(toggle);
            });

            expect(onToggle).toHaveBeenCalledWith(false);
        });

        it('calls onToggle with true when currently disabled', async () => {
            const group = createMockGroup({ transactionSharingEnabled: false });
            const onToggle = vi.fn().mockResolvedValue(undefined);

            renderToggle({ group, onToggle });

            const toggle = screen.getByTestId('transaction-sharing-toggle');

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
            const group = createMockGroup({ transactionSharingEnabled: true });
            // Create a promise that we control for timing
            let resolveToggle: () => void;
            const togglePromise = new Promise<void>((resolve) => {
                resolveToggle = resolve;
            });
            const onToggle = vi.fn().mockReturnValue(togglePromise);

            renderToggle({ group, onToggle });

            const toggle = screen.getByTestId('transaction-sharing-toggle');
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
            const group = createMockGroup({ transactionSharingEnabled: true });
            const onToggle = vi.fn().mockRejectedValue(new Error('Network error'));

            renderToggle({ group, onToggle });

            const toggle = screen.getByTestId('transaction-sharing-toggle');
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

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            expect(toggle).toBeDisabled();
        });

        it('does not call onToggle when pending', async () => {
            const onToggle = vi.fn();
            renderToggle({ isPending: true, onToggle });

            const toggle = screen.getByTestId('transaction-sharing-toggle');

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

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            expect(toggle).toHaveAttribute('role', 'switch');
            expect(toggle).toHaveAttribute('aria-checked');
        });

        it('has correct aria-checked="true" when enabled', () => {
            const group = createMockGroup({ transactionSharingEnabled: true });
            renderToggle({ group });

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            expect(toggle).toHaveAttribute('aria-checked', 'true');
        });

        it('has correct aria-checked="false" when disabled', () => {
            const group = createMockGroup({ transactionSharingEnabled: false });
            renderToggle({ group });

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            expect(toggle).toHaveAttribute('aria-checked', 'false');
        });
    });

    // ===========================================================================
    // Visual styling
    // ===========================================================================
    describe('Visual styling', () => {
        it('applies correct background color when enabled', () => {
            const group = createMockGroup({ transactionSharingEnabled: true });
            renderToggle({ group });

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            // JSDOM doesn't resolve CSS variables, so check inline style attribute
            expect(toggle.getAttribute('style')).toContain('--primary');
        });

        it('applies correct background color when disabled', () => {
            const group = createMockGroup({ transactionSharingEnabled: false });
            renderToggle({ group });

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            // JSDOM doesn't resolve CSS variables, so check inline style attribute
            expect(toggle.getAttribute('style')).toContain('--border-light');
        });

        it('cooldown message uses warning color', () => {
            mockCanToggle.mockReturnValue({
                allowed: false,
                waitMinutes: 10,
                reason: 'cooldown'
            });

            renderToggle();

            const cooldownMessage = screen.getByTestId('transaction-sharing-cooldown-message');
            // Check inline style attribute for hardcoded warning color
            expect(cooldownMessage.getAttribute('style')).toContain('#ef4444');
        });
    });

    // ===========================================================================
    // Edge cases
    // ===========================================================================
    describe('Edge cases', () => {
        it('handles group with null toggle fields gracefully', () => {
            const group = createMockGroup({
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
                transactionSharingToggleCountResetAt: null,
            });

            renderToggle({ group });

            // Should render without crashing
            expect(screen.getByTestId('transaction-sharing-toggle')).toBeInTheDocument();
        });

        it('does not call onToggle when disabled due to cooldown', async () => {
            mockCanToggle.mockReturnValue({
                allowed: false,
                waitMinutes: 5,
                reason: 'cooldown'
            });
            const onToggle = vi.fn();

            renderToggle({ onToggle });

            const toggle = screen.getByTestId('transaction-sharing-toggle');

            await act(async () => {
                fireEvent.click(toggle);
            });

            expect(onToggle).not.toHaveBeenCalled();
        });

        it('does not call onToggle when non-owner', async () => {
            const onToggle = vi.fn();

            renderToggle({ isOwner: false, onToggle });

            const toggle = screen.getByTestId('transaction-sharing-toggle');

            await act(async () => {
                fireEvent.click(toggle);
            });

            expect(onToggle).not.toHaveBeenCalled();
        });

        it('owner priority: shows owner message instead of cooldown for non-owners', () => {
            mockCanToggle.mockReturnValue({
                allowed: false,
                waitMinutes: 10,
                reason: 'cooldown'
            });

            renderToggle({ isOwner: false });

            // Should show owner-only message, not cooldown
            const message = screen.getByTestId('transaction-sharing-cooldown-message');
            expect(message).toHaveTextContent('Only the group owner can change this setting');
        });
    });

    // ===========================================================================
    // Translation interpolation
    // ===========================================================================
    describe('Translation interpolation', () => {
        it('interpolates minutes correctly in cooldown message', () => {
            mockCanToggle.mockReturnValue({
                allowed: false,
                waitMinutes: 15,
                reason: 'cooldown'
            });

            renderToggle();

            const cooldownMessage = screen.getByTestId('transaction-sharing-cooldown-message');
            expect(cooldownMessage).toHaveTextContent('15 minutes');
        });

        it('handles 1 minute correctly', () => {
            mockCanToggle.mockReturnValue({
                allowed: false,
                waitMinutes: 1,
                reason: 'cooldown'
            });

            renderToggle();

            const cooldownMessage = screen.getByTestId('transaction-sharing-cooldown-message');
            expect(cooldownMessage).toHaveTextContent('1 minutes');
        });
    });
});
