/**
 * Unit Tests for ConfirmationDialog Component
 *
 * Story 12.1: Batch Capture UI
 * Tests for the styled confirmation dialog (replacement for window.confirm).
 *
 * @see docs/sprint-artifacts/epic12/story-12.1-batch-capture-ui.md
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from '../../../../src/components/batch/ConfirmationDialog';

describe('ConfirmationDialog Component', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Yes',
    cancelText: 'No',
    theme: 'light' as const,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<ConfirmationDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display the title', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('should display the message', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('should display custom button text', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
    });

    it('should use default button text when not provided', () => {
      const propsWithoutText = {
        ...defaultProps,
        confirmText: undefined,
        cancelText: undefined,
      };
      render(<ConfirmationDialog {...propsWithoutText} />);

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: 'No' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when clicking overlay', () => {
      const onCancel = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);

      // Click on the overlay (dialog container)
      fireEvent.click(screen.getByRole('dialog'));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when clicking inside dialog card', () => {
      const onCancel = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);

      // Click on the message text (inside the card)
      fireEvent.click(screen.getByText('Are you sure you want to proceed?'));

      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Theme Support', () => {
    it('should render with light theme', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} theme="light" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with dark theme', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} theme="dark" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Destructive Mode', () => {
    it('should render normal confirm button by default', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: 'Yes' });
      // Default blue styling
      expect(confirmButton.className).toContain('bg-blue-600');
    });

    it('should render red confirm button when isDestructive is true', () => {
      render(<ConfirmationDialog {...defaultProps} isDestructive={true} />);

      const confirmButton = screen.getByRole('button', { name: 'Yes' });
      // Destructive red styling
      expect(confirmButton.className).toContain('bg-red-600');
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirmation-dialog-title');
      expect(screen.getByText('Confirm Action')).toHaveAttribute('id', 'confirmation-dialog-title');
    });

    it('should have type="button" on all buttons', () => {
      render(<ConfirmationDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});
