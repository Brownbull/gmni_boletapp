/**
 * Story 11.1: One Image = One Transaction
 * Story 14e-34a: Updated tests to use store mock instead of images prop
 * Unit tests for BatchUploadPreview component
 *
 * Tests AC #2 (X boletas detectadas), AC #7 (10 image limit)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchUploadPreview, MAX_BATCH_IMAGES } from '../../../../src/components/scan/BatchUploadPreview';

// Story 14e-34a: Mock the scan store module
let mockImages: string[] = [];
vi.mock('@/features/scan/store', () => ({
  useScanImages: () => mockImages,
}));

// Mock translation function
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    batchReceiptsDetected: 'receipts detected',
    batchExplanation: 'Each image will become a separate transaction.',
    batchMaxLimitError: 'Maximum 10 images per batch',
    viewImages: 'View images',
    hideImages: 'Hide images',
    batchImageList: 'Selected images',
    removeImage: 'Remove image',
    processAll: 'Process All',
    cancel: 'Cancel',
    receipt: 'Receipt',
  };
  return translations[key] || key;
};

// Sample base64 image data (small placeholder)
const createMockImages = (count: number): string[] => {
  return Array.from({ length: count }, (_, i) =>
    `data:image/png;base64,mockImageData${i}`
  );
};

// Story 14e-34a: Helper to set mock images for tests
const setMockImages = (images: string[]) => {
  mockImages = images;
};

describe('BatchUploadPreview', () => {
  // Story 14e-34a: images prop removed - now reads from store
  const defaultProps = {
    theme: 'light' as const,
    t: mockT,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Story 14e-34a: Default to 3 images for most tests
    setMockImages(createMockImages(3));
  });

  describe('AC #2: Show "X boletas detectadas" message', () => {
    it('should display correct count for 3 images', () => {
      setMockImages(createMockImages(3));
      render(<BatchUploadPreview {...defaultProps} />);
      expect(screen.getByText('3 receipts detected')).toBeInTheDocument();
    });

    it('should display correct count for 5 images', () => {
      setMockImages(createMockImages(5));
      render(<BatchUploadPreview {...defaultProps} />);
      expect(screen.getByText('5 receipts detected')).toBeInTheDocument();
    });

    it('should display explanation text', () => {
      render(<BatchUploadPreview {...defaultProps} />);
      expect(screen.getByText('Each image will become a separate transaction.')).toBeInTheDocument();
    });
  });

  describe('AC #7: Maximum 10 images per batch', () => {
    it('should show error when more than 10 images', () => {
      setMockImages(createMockImages(11));
      render(<BatchUploadPreview {...defaultProps} />);
      expect(screen.getByText('Maximum 10 images per batch')).toBeInTheDocument();
    });

    it('should disable Process All button when over limit', () => {
      setMockImages(createMockImages(11));
      render(<BatchUploadPreview {...defaultProps} />);
      const processButton = screen.getByText('Process All');
      expect(processButton).toBeDisabled();
    });

    it('should enable Process All button when within limit', () => {
      setMockImages(createMockImages(10));
      render(<BatchUploadPreview {...defaultProps} />);
      const processButton = screen.getByText('Process All');
      expect(processButton).not.toBeDisabled();
    });

    it('should export MAX_BATCH_IMAGES as 10', () => {
      expect(MAX_BATCH_IMAGES).toBe(10);
    });
  });

  describe('Thumbnail toggle', () => {
    it('should show "View images" toggle initially', () => {
      render(<BatchUploadPreview {...defaultProps} />);
      expect(screen.getByText('View images')).toBeInTheDocument();
    });

    it('should show thumbnails when toggle is clicked', () => {
      render(<BatchUploadPreview {...defaultProps} />);
      fireEvent.click(screen.getByText('View images'));
      // Should now show "Hide images"
      expect(screen.getByText('Hide images')).toBeInTheDocument();
      // Thumbnails should be visible
      expect(screen.getByRole('list', { name: 'Selected images' })).toBeInTheDocument();
    });

    it('should hide thumbnails when toggle is clicked again', () => {
      render(<BatchUploadPreview {...defaultProps} />);
      // Open
      fireEvent.click(screen.getByText('View images'));
      // Close
      fireEvent.click(screen.getByText('Hide images'));
      expect(screen.getByText('View images')).toBeInTheDocument();
    });
  });

  describe('Action buttons', () => {
    it('should call onConfirm when Process All is clicked', () => {
      const onConfirm = vi.fn();
      render(<BatchUploadPreview {...defaultProps} onConfirm={onConfirm} />);
      fireEvent.click(screen.getByText('Process All'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when Cancel is clicked', () => {
      const onCancel = vi.fn();
      render(<BatchUploadPreview {...defaultProps} onCancel={onCancel} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onConfirm when over limit', () => {
      setMockImages(createMockImages(11));
      const onConfirm = vi.fn();
      render(
        <BatchUploadPreview
          {...defaultProps}
          onConfirm={onConfirm}
        />
      );
      fireEvent.click(screen.getByText('Process All'));
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Image removal', () => {
    it('should call onRemoveImage when remove button is clicked', () => {
      const onRemoveImage = vi.fn();
      render(
        <BatchUploadPreview
          {...defaultProps}
          onRemoveImage={onRemoveImage}
        />
      );
      // Open thumbnails
      fireEvent.click(screen.getByText('View images'));
      // Click first remove button
      const removeButtons = screen.getAllByLabelText(/Remove image/);
      fireEvent.click(removeButtons[0]);
      expect(onRemoveImage).toHaveBeenCalledWith(0);
    });

    it('should not show remove buttons if onRemoveImage is not provided', () => {
      render(<BatchUploadPreview {...defaultProps} onRemoveImage={undefined} />);
      fireEvent.click(screen.getByText('View images'));
      // Remove buttons should not exist
      expect(screen.queryByLabelText(/Remove image/)).not.toBeInTheDocument();
    });
  });

  describe('AC #1 (Story 14e-33): Remove buttons visible on mobile', () => {
    it('should have remove buttons always visible (not hover-only)', () => {
      render(
        <BatchUploadPreview
          {...defaultProps}
          onRemoveImage={vi.fn()}
        />
      );
      // Open thumbnails
      fireEvent.click(screen.getByText('View images'));
      // Remove buttons should be visible (no opacity-0 class)
      const removeButtons = screen.getAllByLabelText(/Remove image/);
      removeButtons.forEach((button) => {
        expect(button).not.toHaveClass('opacity-0');
      });
    });

    it('should have sufficient touch target size (minimum 44px)', () => {
      render(
        <BatchUploadPreview
          {...defaultProps}
          onRemoveImage={vi.fn()}
        />
      );
      // Open thumbnails
      fireEvent.click(screen.getByText('View images'));
      const removeButtons = screen.getAllByLabelText(/Remove image/);
      removeButtons.forEach((button) => {
        // Check for min-w-[44px] and min-h-[44px] or equivalent classes
        // The button should have touch-friendly sizing
        expect(button.className).toMatch(/min-w-\[44px\]|w-11|min-h-\[44px\]|h-11/);
      });
    });

    it('should have semi-transparent background for visibility', () => {
      render(
        <BatchUploadPreview
          {...defaultProps}
          onRemoveImage={vi.fn()}
        />
      );
      // Open thumbnails
      fireEvent.click(screen.getByText('View images'));
      const removeButtons = screen.getAllByLabelText(/Remove image/);
      removeButtons.forEach((button) => {
        // Should have background opacity styling
        expect(button.className).toMatch(/bg-.*\/[0-9]+|bg-black\/|bg-white\/|bg-slate-/);
      });
    });
  });

  describe('Theme support (AC #9)', () => {
    it('should apply dark theme styles', () => {
      const { container } = render(
        <BatchUploadPreview {...defaultProps} theme="dark" />
      );
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveClass('bg-slate-800');
    });

    it('should apply light theme styles', () => {
      const { container } = render(
        <BatchUploadPreview {...defaultProps} theme="light" />
      );
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveClass('bg-white');
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      render(<BatchUploadPreview {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have accessible labels', () => {
      render(<BatchUploadPreview {...defaultProps} />);
      expect(screen.getByLabelText(/receipts detected/i)).toBeInTheDocument();
    });

    it('should have expandable button with aria-expanded', () => {
      render(<BatchUploadPreview {...defaultProps} />);
      const toggle = screen.getByRole('button', { name: /view images/i });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
