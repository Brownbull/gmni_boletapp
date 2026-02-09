/**
 * Unit Tests for ConfirmationDialog Component
 *
 * Story 15-3a: Shared confirmation dialog with enhanced accessibility.
 * Tests rendering, actions, theme, destructive mode, and a11y features
 * (ESC key, body scroll lock, focus management, data-testid).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from '../../../../src/components/shared/ConfirmationDialog';

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

  afterEach(() => {
    // Ensure body overflow is restored
    document.body.style.overflow = '';
  });

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
      render(<ConfirmationDialog {...defaultProps} confirmText={undefined} cancelText={undefined} />);
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
      fireEvent.click(screen.getByRole('dialog'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when clicking inside dialog card', () => {
      const onCancel = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);
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
      expect(confirmButton.className).toContain('bg-blue-600');
    });

    it('should render red confirm button when isDestructive is true', () => {
      render(<ConfirmationDialog {...defaultProps} isDestructive={true} />);
      const confirmButton = screen.getByRole('button', { name: 'Yes' });
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

    it('should close on ESC key', () => {
      const onCancel = vi.fn();
      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should lock body scroll when open', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('data-testid attributes', () => {
    it('should have data-testid on dialog', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
    });

    it('should have data-testid on confirm button', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByTestId('confirm-button')).toBeInTheDocument();
    });

    it('should have data-testid on cancel button', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });
  });
});
