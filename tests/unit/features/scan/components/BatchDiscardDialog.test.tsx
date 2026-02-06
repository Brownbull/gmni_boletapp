/**
 * Story 14e-23: BatchDiscardDialog Unit Tests
 *
 * Tests for the BatchDiscardDialog component extracted from App.tsx.
 * This dialog reads visibility from the Zustand scan store (activeDialog).
 *
 * Test Categories:
 * - Visibility guard (renders only when BATCH_DISCARD dialog active)
 * - Handler callbacks (onConfirm, onCancel)
 * - Content rendering
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchDiscardDialog } from '@features/scan/components/BatchDiscardDialog';
import { DIALOG_TYPES } from '@/types/scanStateMachine';

// Mock the scan store
vi.mock('@features/scan/store/useScanStore', () => ({
  useScanStore: vi.fn(),
}));

import { useScanStore } from '@features/scan/store/useScanStore';

// Mock translation function
const mockT = (key: string): string => {
  const translations: Record<string, string> = {
    batchDiscardConfirmTitle: 'Discard Batch?',
    batchDiscardConfirmMessage: 'You have unsaved receipts. Discard them?',
    batchDiscardConfirmYes: 'Discard',
    batchDiscardConfirmNo: 'Keep Editing',
  };
  return translations[key] || key;
};

describe('BatchDiscardDialog', () => {
  const defaultProps = {
    t: mockT,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility guard', () => {
    it('should return null when activeDialog is null', () => {
      vi.mocked(useScanStore).mockImplementation((selector: (state: { activeDialog: null }) => unknown) =>
        selector({ activeDialog: null })
      );

      const { container } = render(<BatchDiscardDialog {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should return null when activeDialog type is not BATCH_DISCARD', () => {
      vi.mocked(useScanStore).mockImplementation((selector: (state: { activeDialog: { type: string } }) => unknown) =>
        selector({ activeDialog: { type: DIALOG_TYPES.QUICK_SAVE } })
      );

      const { container } = render(<BatchDiscardDialog {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should render when activeDialog type is BATCH_DISCARD', () => {
      vi.mocked(useScanStore).mockImplementation((selector: (state: { activeDialog: { type: string } }) => unknown) =>
        selector({ activeDialog: { type: DIALOG_TYPES.BATCH_DISCARD } })
      );

      render(<BatchDiscardDialog {...defaultProps} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });

  describe('content rendering', () => {
    beforeEach(() => {
      vi.mocked(useScanStore).mockImplementation((selector: (state: { activeDialog: { type: string } }) => unknown) =>
        selector({ activeDialog: { type: DIALOG_TYPES.BATCH_DISCARD } })
      );
    });

    it('should display the dialog title', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      expect(screen.getByText('Discard Batch?')).toBeInTheDocument();
    });

    it('should display the dialog message', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      expect(screen.getByText('You have unsaved receipts. Discard them?')).toBeInTheDocument();
    });

    it('should display discard button with correct text', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
    });

    it('should display cancel button with correct text', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /keep editing/i })).toBeInTheDocument();
    });
  });

  describe('handler callbacks', () => {
    beforeEach(() => {
      vi.mocked(useScanStore).mockImplementation((selector: (state: { activeDialog: { type: string } }) => unknown) =>
        selector({ activeDialog: { type: DIALOG_TYPES.BATCH_DISCARD } })
      );
    });

    it('should call onConfirm when discard button is clicked', () => {
      const onConfirm = vi.fn();
      render(<BatchDiscardDialog {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByRole('button', { name: /discard/i }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      render(<BatchDiscardDialog {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: /keep editing/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when backdrop is clicked', () => {
      const onCancel = vi.fn();
      render(<BatchDiscardDialog {...defaultProps} onCancel={onCancel} />);

      // Click the backdrop (the outermost div)
      const backdrop = screen.getByRole('alertdialog').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when dialog content is clicked', () => {
      const onCancel = vi.fn();
      render(<BatchDiscardDialog {...defaultProps} onCancel={onCancel} />);

      // Click on the dialog content itself (not a button)
      fireEvent.click(screen.getByText('Discard Batch?'));

      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      vi.mocked(useScanStore).mockImplementation((selector: (state: { activeDialog: { type: string } }) => unknown) =>
        selector({ activeDialog: { type: DIALOG_TYPES.BATCH_DISCARD } })
      );
    });

    it('should have role="alertdialog"', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('should have aria-labelledby pointing to the title', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'discard-dialog-title');
    });

    it('should have aria-describedby pointing to the description', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'discard-dialog-desc');
    });

    it('should have title with correct id', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      const title = screen.getByText('Discard Batch?');
      expect(title).toHaveAttribute('id', 'discard-dialog-title');
    });

    it('should have description with correct id', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      const desc = screen.getByText('You have unsaved receipts. Discard them?');
      expect(desc).toHaveAttribute('id', 'discard-dialog-desc');
    });
  });

  describe('styling', () => {
    beforeEach(() => {
      vi.mocked(useScanStore).mockImplementation((selector: (state: { activeDialog: { type: string } }) => unknown) =>
        selector({ activeDialog: { type: DIALOG_TYPES.BATCH_DISCARD } })
      );
    });

    it('should have fixed positioning on backdrop', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      const backdrop = screen.getByRole('alertdialog').parentElement;
      expect(backdrop).toHaveClass('fixed', 'inset-0');
    });

    it('should have proper z-index for overlay', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      const backdrop = screen.getByRole('alertdialog').parentElement;
      expect(backdrop).toHaveClass('z-50');
    });

    it('should center the dialog', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      const backdrop = screen.getByRole('alertdialog').parentElement;
      expect(backdrop).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('icons', () => {
    beforeEach(() => {
      vi.mocked(useScanStore).mockImplementation((selector: (state: { activeDialog: { type: string } }) => unknown) =>
        selector({ activeDialog: { type: DIALOG_TYPES.BATCH_DISCARD } })
      );
    });

    it('should render Trash2 icon on discard button', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      // The button should have an SVG (Trash2 icon from lucide-react)
      const discardButton = screen.getByRole('button', { name: /discard/i });
      const svg = discardButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render ArrowLeft icon on cancel button', () => {
      render(<BatchDiscardDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /keep editing/i });
      const svg = cancelButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
