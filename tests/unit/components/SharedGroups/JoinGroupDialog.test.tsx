/**
 * Story 14c-refactor.5: Placeholder UI States - JoinGroupDialog Tests
 *
 * Tests the simplified JoinGroupDialog that shows "Feature coming soon" message
 * instead of the full join flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JoinGroupDialog } from '../../../../src/components/SharedGroups/JoinGroupDialog';

describe('JoinGroupDialog (Story 14c-refactor.5)', () => {
  const mockOnCancel = vi.fn();
  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      featureComingSoon: 'Próximamente',
      featureComingSoonDescription: 'Esta función está siendo rediseñada para una mejor experiencia. ¡Mantente atento!',
      close: 'Cerrar',
      ok: 'OK',
    };
    return translations[key] || key;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC #1: Coming soon message', () => {
    it('does not render when isOpen is false', () => {
      render(
        <JoinGroupDialog
          isOpen={false}
          onCancel={mockOnCancel}
          t={mockT}
        />
      );

      expect(screen.queryByTestId('join-group-dialog')).not.toBeInTheDocument();
    });

    it('renders "Coming soon" message when open', () => {
      render(
        <JoinGroupDialog
          isOpen={true}
          onCancel={mockOnCancel}
          t={mockT}
        />
      );

      expect(screen.getByTestId('join-group-dialog')).toBeInTheDocument();
      expect(screen.getByText('Próximamente')).toBeInTheDocument();
      expect(screen.getByText(/Esta función está siendo rediseñada/)).toBeInTheDocument();
    });

    it('shows house emoji icon', () => {
      render(
        <JoinGroupDialog
          isOpen={true}
          onCancel={mockOnCancel}
          t={mockT}
        />
      );

      expect(screen.getByText('🏠')).toBeInTheDocument();
    });
  });

  describe('AC #1: No form submission', () => {
    it('has no join/confirm button', () => {
      render(
        <JoinGroupDialog
          isOpen={true}
          onCancel={mockOnCancel}
          t={mockT}
        />
      );

      expect(screen.queryByTestId('join-group-confirm-btn')).not.toBeInTheDocument();
    });

    it('only has OK button to close', () => {
      render(
        <JoinGroupDialog
          isOpen={true}
          onCancel={mockOnCancel}
          t={mockT}
        />
      );

      const okButton = screen.getByTestId('join-group-ok-btn');
      expect(okButton).toBeInTheDocument();
      expect(okButton).toHaveTextContent('OK');
    });
  });

  describe('AC #2: Deep link handling', () => {
    it('shows friendly message regardless of state/props', () => {
      // Even with old props, should show coming soon
      render(
        <JoinGroupDialog
          isOpen={true}
          onCancel={mockOnCancel}
          t={mockT}
        />
      );

      // Should not show loading, error, or confirmation states
      expect(screen.queryByTestId('join-group-loading')).not.toBeInTheDocument();
      expect(screen.queryByTestId('join-group-joining')).not.toBeInTheDocument();
      expect(screen.getByText('Próximamente')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onCancel when OK button clicked', () => {
      render(
        <JoinGroupDialog
          isOpen={true}
          onCancel={mockOnCancel}
          t={mockT}
        />
      );

      fireEvent.click(screen.getByTestId('join-group-ok-btn'));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('calls onCancel when close button clicked', () => {
      render(
        <JoinGroupDialog
          isOpen={true}
          onCancel={mockOnCancel}
          t={mockT}
        />
      );

      fireEvent.click(screen.getByTestId('join-group-close-btn'));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('calls onCancel when Escape key pressed', () => {
      render(
        <JoinGroupDialog
          isOpen={true}
          onCancel={mockOnCancel}
          t={mockT}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('calls onCancel when backdrop clicked', () => {
      render(
        <JoinGroupDialog
          isOpen={true}
          onCancel={mockOnCancel}
          t={mockT}
        />
      );

      fireEvent.click(screen.getByTestId('join-group-dialog-backdrop'));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role and aria-modal', () => {
      render(
        <JoinGroupDialog
          isOpen={true}
          onCancel={mockOnCancel}
          t={mockT}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      render(
        <JoinGroupDialog
          isOpen={true}
          onCancel={mockOnCancel}
          t={mockT}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'join-group-modal-title');
    });
  });
});
