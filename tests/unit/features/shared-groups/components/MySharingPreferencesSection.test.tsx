/**
 * Story 14d-v2-1-12d: MySharingPreferencesSection Component Tests
 *
 * Tests the MySharingPreferencesSection component for:
 * - AC1: Shows UserTransactionSharingToggle in Group Settings under "My Sharing Preferences"
 * - AC3: Shows eventual consistency explanation text
 * - AC4: Info tooltip explaining double-gate model
 *
 * TDD Methodology:
 * - Tests written FIRST (RED phase)
 * - Implementation follows to make tests pass (GREEN phase)
 * - Refactoring with tests green (REFACTOR phase)
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MySharingPreferencesSection } from '@/features/shared-groups/components/MySharingPreferencesSection';
import type { MySharingPreferencesSectionProps } from '@/features/shared-groups/components/MySharingPreferencesSection';

// =============================================================================
// Mocks
// =============================================================================

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useUserGroupPreference hook
const mockUseUserGroupPreference = vi.fn();
vi.mock('@/features/shared-groups/hooks/useUserGroupPreference', () => ({
  useUserGroupPreference: (...args: unknown[]) => mockUseUserGroupPreference(...args),
}));

// Mock UserTransactionSharingToggle component
vi.mock('@/features/shared-groups/components/UserTransactionSharingToggle', () => ({
  UserTransactionSharingToggle: vi.fn(({ t }: { t: (key: string) => string }) => (
    <div data-testid="mock-user-sharing-toggle">
      <button role="switch" aria-checked="true" data-testid="mock-toggle">
        {t('shareMyTransactionsLabel')}
      </button>
    </div>
  )),
}));

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Mock translation function.
 */
const mockT = vi.fn((key: string): string => {
  const translations: Record<string, string> = {
    mySharingPreferences: 'My Sharing Preferences',
    mySharingPreferencesDesc: 'Control what you share with this group',
    doubleGateTooltip: "Transaction sharing requires two switches: the group owner's master switch AND your personal preference. Both must be on for your transactions to be visible.",
    eventualConsistencyNotice: 'Other members will stop seeing your transactions on their next sync.',
    shareMyTransactionsLabel: 'Share My Transactions',
    groupSharingDisabledWarning: 'The group owner has disabled transaction sharing. Your preference will be saved but won\'t take effect until sharing is re-enabled.',
    failedToUpdatePreference: 'Failed to update preference. Please try again.',
    sharingPreferenceUpdated: 'Sharing preference updated',
  };
  return translations[key] || key;
});

/**
 * Default props for rendering the component.
 */
const createDefaultProps = (overrides: Partial<MySharingPreferencesSectionProps> = {}): MySharingPreferencesSectionProps => ({
  groupId: 'test-group-id',
  t: mockT,
  groupSharingEnabled: true,
  lang: 'en',
  theme: 'light',
  ...overrides,
});

/**
 * Setup default mock values.
 */
const setupDefaultMocks = () => {
  mockUseAuth.mockReturnValue({
    user: { uid: 'test-user-id' },
    services: { db: {}, appId: 'test-app' },
  });

  mockUseUserGroupPreference.mockReturnValue({
    preference: { shareMyTransactions: true },
    isLoading: false,
    updatePreference: vi.fn(),
    canToggle: { allowed: true },
    error: null,
  });
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Renders MySharingPreferencesSection with default props merged with overrides.
 */
const renderSection = (overrides: Partial<MySharingPreferencesSectionProps> = {}) => {
  const props = createDefaultProps(overrides);
  return {
    ...render(<MySharingPreferencesSection {...props} />),
    props,
  };
};

// =============================================================================
// Tests
// =============================================================================

describe('MySharingPreferencesSection (Story 14d-v2-1-12d)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  // ===========================================================================
  // AC #1: Section Header "My Sharing Preferences"
  // ===========================================================================
  describe('AC #1: Section rendering and header', () => {
    it('renders section header "My Sharing Preferences"', () => {
      renderSection();

      expect(mockT).toHaveBeenCalledWith('mySharingPreferences');
      expect(screen.getByText('My Sharing Preferences')).toBeInTheDocument();
    });

    it('renders section description', () => {
      renderSection();

      expect(mockT).toHaveBeenCalledWith('mySharingPreferencesDesc');
      expect(screen.getByText('Control what you share with this group')).toBeInTheDocument();
    });

    it('renders UserTransactionSharingToggle component', () => {
      renderSection();

      // Check that the mocked toggle is rendered
      expect(screen.getByTestId('user-transaction-sharing-toggle')).toBeInTheDocument();
    });

    it('passes correct props to useUserGroupPreference hook', () => {
      renderSection({ groupId: 'custom-group-id' });

      expect(mockUseUserGroupPreference).toHaveBeenCalledWith(
        { uid: 'test-user-id' },
        { db: {}, appId: 'test-app' },
        'custom-group-id'
      );
    });
  });

  // ===========================================================================
  // AC #3: Eventual Consistency Notice
  // ===========================================================================
  describe('AC #3: Eventual consistency notice', () => {
    it('displays eventual consistency notice', () => {
      renderSection();

      expect(mockT).toHaveBeenCalledWith('eventualConsistencyNotice');
      expect(screen.getByText('Other members will stop seeing your transactions on their next sync.')).toBeInTheDocument();
    });

    it('renders notice with muted styling', () => {
      renderSection();

      const notice = screen.getByText('Other members will stop seeing your transactions on their next sync.');
      expect(notice).toHaveClass('text-xs');
    });
  });

  // ===========================================================================
  // AC #4: Info Tooltip with Double-Gate Explanation
  // ===========================================================================
  describe('AC #4: Info tooltip with double-gate explanation', () => {
    it('shows info icon button', () => {
      renderSection();

      const infoButton = screen.getByTestId('double-gate-tooltip-button');
      expect(infoButton).toBeInTheDocument();
    });

    it('shows tooltip on click', async () => {
      renderSection();

      const infoButton = screen.getByTestId('double-gate-tooltip-button');

      fireEvent.click(infoButton);

      await waitFor(() => {
        expect(screen.getByTestId('double-gate-tooltip')).toBeInTheDocument();
      });
    });

    it('tooltip contains double-gate explanation', async () => {
      renderSection();

      const infoButton = screen.getByTestId('double-gate-tooltip-button');
      fireEvent.click(infoButton);

      await waitFor(() => {
        const tooltip = screen.getByTestId('double-gate-tooltip');
        expect(tooltip).toHaveTextContent("Transaction sharing requires two switches");
        expect(tooltip).toHaveTextContent("Both must be on");
      });
    });

    it('hides tooltip on second click (toggle off)', async () => {
      renderSection();

      const infoButton = screen.getByTestId('double-gate-tooltip-button');

      // Show tooltip
      fireEvent.click(infoButton);
      await waitFor(() => {
        expect(screen.getByTestId('double-gate-tooltip')).toBeInTheDocument();
      });

      // Hide tooltip (toggle off)
      fireEvent.click(infoButton);
      await waitFor(() => {
        expect(screen.queryByTestId('double-gate-tooltip')).not.toBeInTheDocument();
      });
    });

    it('closes tooltip on Escape key (keyboard accessibility)', async () => {
      renderSection();

      const infoButton = screen.getByTestId('double-gate-tooltip-button');

      // Open tooltip
      fireEvent.click(infoButton);
      await waitFor(() => {
        expect(screen.getByTestId('double-gate-tooltip')).toBeInTheDocument();
      });

      // Close with Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByTestId('double-gate-tooltip')).not.toBeInTheDocument();
      });
    });

    it('closes tooltip on click outside', async () => {
      renderSection();

      const infoButton = screen.getByTestId('double-gate-tooltip-button');

      // Show tooltip
      fireEvent.click(infoButton);
      await waitFor(() => {
        expect(screen.getByTestId('double-gate-tooltip')).toBeInTheDocument();
      });

      // Click outside to close
      fireEvent.mouseDown(document.body);
      await waitFor(() => {
        expect(screen.queryByTestId('double-gate-tooltip')).not.toBeInTheDocument();
      });
    });

    it('tooltip has correct ARIA attributes', async () => {
      renderSection();

      const infoButton = screen.getByTestId('double-gate-tooltip-button');
      fireEvent.click(infoButton);

      await waitFor(() => {
        const tooltip = screen.getByTestId('double-gate-tooltip');
        expect(tooltip).toHaveAttribute('role', 'tooltip');
        expect(tooltip).toHaveAttribute('id', 'double-gate-tooltip-content');
      });

      // Info button should reference the tooltip content
      expect(infoButton).toHaveAttribute('aria-describedby', 'double-gate-tooltip-content');
    });
  });

  // ===========================================================================
  // Group Sharing Disabled Warning
  // ===========================================================================
  describe('Group sharing disabled warning', () => {
    it('shows warning when group sharing is disabled', () => {
      renderSection({ groupSharingEnabled: false });

      const warning = screen.getByText(/group owner has disabled transaction sharing/i);
      expect(warning).toBeInTheDocument();
    });

    it('does not show warning when group sharing is enabled', () => {
      renderSection({ groupSharingEnabled: true });

      expect(screen.queryByText(/group owner has disabled transaction sharing/i)).not.toBeInTheDocument();
    });

    it('warning has distinct styling (yellow/warning colors)', () => {
      renderSection({ groupSharingEnabled: false });

      const warningContainer = screen.getByText(/group owner has disabled transaction sharing/i).closest('div');
      expect(warningContainer).toHaveClass('bg-yellow-50');
    });
  });

  // ===========================================================================
  // Theme Support
  // ===========================================================================
  describe('Theme support', () => {
    it('applies light theme styling', () => {
      const { container } = renderSection({ theme: 'light' });

      const section = container.firstChild as HTMLElement;
      expect(section).toHaveClass('border-gray-200');
      expect(section).toHaveClass('bg-gray-50');
    });

    it('applies dark theme styling', () => {
      const { container } = renderSection({ theme: 'dark' });

      const section = container.firstChild as HTMLElement;
      expect(section).toHaveClass('border-gray-700');
      expect(section).toHaveClass('bg-gray-800');
    });

    it('warning styling adapts to dark theme', () => {
      renderSection({ theme: 'dark', groupSharingEnabled: false });

      const warningContainer = screen.getByText(/group owner has disabled transaction sharing/i).closest('div');
      expect(warningContainer).toHaveClass('bg-yellow-900/20');
      expect(warningContainer).toHaveClass('text-yellow-400');
    });
  });

  // ===========================================================================
  // Loading State
  // ===========================================================================
  describe('Loading state', () => {
    it('shows loading spinner when preference is loading', () => {
      mockUseUserGroupPreference.mockReturnValue({
        preference: null,
        isLoading: true,
        updatePreference: vi.fn(),
        canToggle: { allowed: true },
        error: null,
      });

      renderSection();

      // Should show header but with loading indicator
      expect(screen.getByText('My Sharing Preferences')).toBeInTheDocument();
      // Toggle should not be visible during loading
      expect(screen.queryByTestId('mock-user-sharing-toggle')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Error State
  // ===========================================================================
  describe('Error state', () => {
    it('shows error message when there is an error', () => {
      mockUseUserGroupPreference.mockReturnValue({
        preference: null,
        isLoading: false,
        updatePreference: vi.fn(),
        canToggle: { allowed: true },
        error: new Error('Network error'),
      });

      renderSection();

      expect(screen.getByTestId('preference-error')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Toggle Handler
  // ===========================================================================
  describe('Toggle handler', () => {
    it('calls updatePreference when UserTransactionSharingToggle invokes onToggle', async () => {
      const mockUpdatePreference = vi.fn().mockResolvedValue(undefined);
      mockUseUserGroupPreference.mockReturnValue({
        preference: { shareMyTransactions: true },
        isLoading: false,
        updatePreference: mockUpdatePreference,
        canToggle: { allowed: true },
        error: null,
      });

      // Use a custom mock to capture onToggle
      let capturedOnToggle: ((enabled: boolean) => Promise<void>) | null = null;
      const { UserTransactionSharingToggle } = await import('@/features/shared-groups/components/UserTransactionSharingToggle');
      (UserTransactionSharingToggle as Mock).mockImplementation(
        ({ onToggle, t }: { onToggle: (enabled: boolean) => Promise<void>; t: (key: string) => string }) => {
          capturedOnToggle = onToggle;
          return (
            <div data-testid="mock-user-sharing-toggle">
              <button
                role="switch"
                aria-checked="true"
                data-testid="mock-toggle"
                onClick={() => onToggle(false)}
              >
                {t('shareMyTransactionsLabel')}
              </button>
            </div>
          );
        }
      );

      renderSection();

      // Click the toggle button to trigger onToggle
      const toggle = screen.getByTestId('mock-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockUpdatePreference).toHaveBeenCalledWith(false);
      });
    });

    it('calls onShowToast with success message when toggle succeeds', async () => {
      const mockUpdatePreference = vi.fn().mockResolvedValue(undefined);
      const mockOnShowToast = vi.fn();
      mockUseUserGroupPreference.mockReturnValue({
        preference: { shareMyTransactions: true },
        isLoading: false,
        updatePreference: mockUpdatePreference,
        canToggle: { allowed: true },
        error: null,
      });

      const { UserTransactionSharingToggle } = await import('@/features/shared-groups/components/UserTransactionSharingToggle');
      (UserTransactionSharingToggle as Mock).mockImplementation(
        ({ onToggle, t }: { onToggle: (enabled: boolean) => Promise<void>; t: (key: string) => string }) => (
          <div data-testid="mock-user-sharing-toggle">
            <button data-testid="mock-toggle" onClick={() => onToggle(false)}>
              {t('shareMyTransactionsLabel')}
            </button>
          </div>
        )
      );

      renderSection({ onShowToast: mockOnShowToast });

      const toggle = screen.getByTestId('mock-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockOnShowToast).toHaveBeenCalledWith('Sharing preference updated', 'success');
      });
    });

    it('calls onShowToast with error message and re-throws when toggle fails', async () => {
      const mockUpdatePreference = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockOnShowToast = vi.fn();
      mockUseUserGroupPreference.mockReturnValue({
        preference: { shareMyTransactions: true },
        isLoading: false,
        updatePreference: mockUpdatePreference,
        canToggle: { allowed: true },
        error: null,
      });

      const { UserTransactionSharingToggle } = await import('@/features/shared-groups/components/UserTransactionSharingToggle');
      (UserTransactionSharingToggle as Mock).mockImplementation(
        ({ onToggle, t }: { onToggle: (enabled: boolean) => Promise<void>; t: (key: string) => string }) => (
          <div data-testid="mock-user-sharing-toggle">
            <button data-testid="mock-toggle" onClick={() => onToggle(false).catch(() => { /* expected re-throw */ })}>
              {t('shareMyTransactionsLabel')}
            </button>
          </div>
        )
      );

      renderSection({ onShowToast: mockOnShowToast });

      const toggle = screen.getByTestId('mock-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockOnShowToast).toHaveBeenCalledWith('Failed to update preference. Please try again.', 'error');
      });
    });

    it('does not crash when onShowToast is not provided', async () => {
      const mockUpdatePreference = vi.fn().mockResolvedValue(undefined);
      mockUseUserGroupPreference.mockReturnValue({
        preference: { shareMyTransactions: true },
        isLoading: false,
        updatePreference: mockUpdatePreference,
        canToggle: { allowed: true },
        error: null,
      });

      const { UserTransactionSharingToggle } = await import('@/features/shared-groups/components/UserTransactionSharingToggle');
      (UserTransactionSharingToggle as Mock).mockImplementation(
        ({ onToggle, t }: { onToggle: (enabled: boolean) => Promise<void>; t: (key: string) => string }) => (
          <div data-testid="mock-user-sharing-toggle">
            <button data-testid="mock-toggle" onClick={() => onToggle(false)}>
              {t('shareMyTransactionsLabel')}
            </button>
          </div>
        )
      );

      // No onShowToast prop - should not crash
      renderSection();

      const toggle = screen.getByTestId('mock-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockUpdatePreference).toHaveBeenCalledWith(false);
      });
    });
  });

  // ===========================================================================
  // Language Support
  // ===========================================================================
  describe('Language support', () => {
    it('falls back to inline Spanish text when groupSharingDisabledWarning translation is missing and lang is es', () => {
      const tWithMissingKey = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          mySharingPreferences: 'Mis Preferencias',
          mySharingPreferencesDesc: 'Descripcion',
          doubleGateTooltip: 'Tooltip text',
          eventualConsistencyNotice: 'Notice text',
          shareMyTransactionsLabel: 'Share label',
        };
        // Return empty string (undefined translation)
        return translations[key] || '';
      });

      renderSection({
        t: tWithMissingKey,
        lang: 'es',
        groupSharingEnabled: false
      });

      expect(screen.getByText(/El dueno del grupo ha desactivado/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================
  describe('Edge cases', () => {
    it('handles missing groupId gracefully', () => {
      // Should not crash even with empty groupId
      expect(() => renderSection({ groupId: '' })).not.toThrow();
    });

    it('defaults groupSharingEnabled to true when not provided', () => {
      render(
        <MySharingPreferencesSection groupId="test" t={mockT} />
      );

      // Warning should not be shown (default is true)
      expect(screen.queryByText(/group owner has disabled/i)).not.toBeInTheDocument();
    });

    it('defaults theme to light when not provided', () => {
      const { container } = render(
        <MySharingPreferencesSection groupId="test" t={mockT} />
      );

      const section = container.firstChild as HTMLElement;
      expect(section).toHaveClass('bg-gray-50');
    });

    it('handles null user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        services: null,
      });

      // Should not crash
      expect(() => renderSection()).not.toThrow();
    });

    it('handles null services gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-id' },
        services: null,
      });

      // Should not crash
      expect(() => renderSection()).not.toThrow();
    });
  });

  // ===========================================================================
  // Structure and Layout
  // ===========================================================================
  describe('Structure and layout', () => {
    it('renders in a bordered container', () => {
      const { container } = renderSection();

      const section = container.firstChild as HTMLElement;
      expect(section).toHaveClass('rounded-lg');
      expect(section).toHaveClass('border');
      expect(section).toHaveClass('p-4');
    });

    it('renders header with info icon inline', () => {
      renderSection();

      const header = screen.getByText('My Sharing Preferences');
      const infoButton = screen.getByTestId('double-gate-tooltip-button');

      // Both should be in the same flex container
      expect(header.parentElement).toContainElement(infoButton);
    });

    it('renders toggle before the eventual consistency notice', () => {
      const { container } = renderSection();

      const toggle = screen.getByTestId('user-transaction-sharing-toggle');
      const notice = screen.getByText('Other members will stop seeing your transactions on their next sync.');

      // Both should be in the document
      expect(toggle).toBeInTheDocument();
      expect(notice).toBeInTheDocument();

      // Use compareDocumentPosition to check ordering
      // DOCUMENT_POSITION_FOLLOWING (4) means toggle comes before notice
      const position = toggle.compareDocumentPosition(notice);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  // Coverage summary:
  // AC1: Section header - covered by "renders section header" tests
  // AC3: Eventual consistency - covered by "displays eventual consistency notice"
  // AC4: Double-gate tooltip - covered by tooltip tests
  // Plus: theme support, loading state, error state, edge cases
});
