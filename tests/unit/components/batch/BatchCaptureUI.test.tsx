/**
 * Unit Tests for BatchCaptureUI Component
 *
 * Story 12.1: Batch Capture UI
 * Tests for the batch capture UI component with mode toggle and actions.
 *
 * @see docs/sprint-artifacts/epic12/story-12.1-batch-capture-ui.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock the useBatchCapture hook before importing the component
vi.mock('../../../../src/hooks/useBatchCapture', () => ({
  useBatchCapture: vi.fn(() => ({
    images: [],
    addImages: vi.fn(),
    removeImage: vi.fn(),
    clearBatch: vi.fn(),
    canAddMore: true,
    count: 0,
    maxImages: 10,
    hasImages: false,
  })),
  MAX_BATCH_CAPTURE_IMAGES: 10,
}));

// Import after mocking
import { BatchCaptureUI } from '../../../../src/components/batch/BatchCaptureUI';
import { useBatchCapture } from '../../../../src/hooks/useBatchCapture';
import type { CapturedImage } from '../../../../src/hooks/useBatchCapture';

// Mock translation function
const t = (key: string) => {
  const translations: Record<string, string> = {
    back: 'Back',
    batchModeSelector: 'Capture mode selector',
    batchModeIndividual: 'Individual',
    batchModeBatch: 'Batch Mode',
    batchModeHint: 'Capture multiple receipts, then process all at once',
    batchTapToCapture: 'Tap to capture or select images',
    batchCapturePhoto: 'Capture Photo',
    batchCaptureAnother: 'Capture Another',
    batchProcessBatch: 'Process Batch',
    batchProcessing: 'Processing...',
    batchCancel: 'Cancel Batch',
    batchCancelConfirmTitle: 'Cancel batch?',
    receipt: 'Receipt',
    removeImage: 'Remove image',
    batchAddMore: 'Add',
    batchOfMax: 'of',
    batchImages: 'images',
    batchImageList: 'Captured images',
  };
  return translations[key] || key;
};

// Helper to create mock CapturedImage
const createMockImage = (id: string, index: number): CapturedImage => ({
  id,
  file: new File([''], `test${index}.jpg`, { type: 'image/jpeg' }),
  dataUrl: `data:image/jpeg;base64,mockData${index}`,
  thumbnailUrl: `data:image/jpeg;base64,mockThumbnail${index}`,
  addedAt: new Date(),
});

describe('BatchCaptureUI Component', () => {
  const defaultProps = {
    isBatchMode: true,
    onToggleMode: vi.fn(),
    onProcessBatch: vi.fn(),
    onCancel: vi.fn(),
    isProcessing: false,
    theme: 'light' as const,
    t,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset hook mock to default state
    vi.mocked(useBatchCapture).mockReturnValue({
      images: [],
      addImages: vi.fn(),
      removeImage: vi.fn(),
      clearBatch: vi.fn(),
      canAddMore: true,
      count: 0,
      maxImages: 10,
      hasImages: false,
    });
  });

  describe('Rendering', () => {
    it('should render mode toggle tabs (AC #1)', () => {
      render(<BatchCaptureUI {...defaultProps} />);

      expect(screen.getByRole('tab', { name: 'Individual' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Batch Mode' })).toBeInTheDocument();
    });

    it('should show batch mode as active when isBatchMode is true', () => {
      render(<BatchCaptureUI {...defaultProps} isBatchMode={true} />);

      const batchTab = screen.getByRole('tab', { name: 'Batch Mode' });
      expect(batchTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should show individual mode as active when isBatchMode is false', () => {
      render(<BatchCaptureUI {...defaultProps} isBatchMode={false} />);

      const individualTab = screen.getByRole('tab', { name: 'Individual' });
      expect(individualTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should show batch mode hint when in batch mode', () => {
      render(<BatchCaptureUI {...defaultProps} isBatchMode={true} />);

      expect(screen.getByText('Capture multiple receipts, then process all at once')).toBeInTheDocument();
    });

    it('should not show batch mode hint when in individual mode', () => {
      render(<BatchCaptureUI {...defaultProps} isBatchMode={false} />);

      expect(screen.queryByText('Capture multiple receipts, then process all at once')).not.toBeInTheDocument();
    });
  });

  describe('Mode Toggle', () => {
    it('should call onToggleMode(false) when Individual tab is clicked', () => {
      const onToggleMode = vi.fn();
      render(<BatchCaptureUI {...defaultProps} onToggleMode={onToggleMode} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Individual' }));

      expect(onToggleMode).toHaveBeenCalledWith(false);
    });

    it('should call onToggleMode(true) when Batch Mode tab is clicked', () => {
      const onToggleMode = vi.fn();
      render(<BatchCaptureUI {...defaultProps} isBatchMode={false} onToggleMode={onToggleMode} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Batch Mode' }));

      expect(onToggleMode).toHaveBeenCalledWith(true);
    });
  });

  describe('Empty State', () => {
    it('should show capture area when no images', () => {
      render(<BatchCaptureUI {...defaultProps} />);

      expect(screen.getByText('Tap to capture or select images')).toBeInTheDocument();
    });

    it('should show Capture Photo button when no images', () => {
      render(<BatchCaptureUI {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Capture Photo/i })).toBeInTheDocument();
    });
  });

  describe('With Images', () => {
    beforeEach(() => {
      const mockImages = [
        createMockImage('img-1', 1),
        createMockImage('img-2', 2),
      ];
      vi.mocked(useBatchCapture).mockReturnValue({
        images: mockImages,
        addImages: vi.fn(),
        removeImage: vi.fn(),
        clearBatch: vi.fn(),
        canAddMore: true,
        count: 2,
        maxImages: 10,
        hasImages: true,
      });
    });

    it('should show thumbnail strip when images exist (AC #3)', () => {
      render(<BatchCaptureUI {...defaultProps} />);

      // BatchThumbnailStrip renders a list
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should show "Capturar otra" button when can add more (AC #4)', () => {
      render(<BatchCaptureUI {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Capture Another/i })).toBeInTheDocument();
    });

    it('should show "Procesar lote" button with count (AC #5)', () => {
      render(<BatchCaptureUI {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Process Batch \(2\)/i })).toBeInTheDocument();
    });

    it('should show Cancel Batch button (AC #8)', () => {
      render(<BatchCaptureUI {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel Batch/i })).toBeInTheDocument();
    });
  });

  describe('Process Batch Action', () => {
    it('should call onProcessBatch with images when Process Batch is clicked (AC #5)', () => {
      const mockImages = [createMockImage('img-1', 1)];
      vi.mocked(useBatchCapture).mockReturnValue({
        images: mockImages,
        addImages: vi.fn(),
        removeImage: vi.fn(),
        clearBatch: vi.fn(),
        canAddMore: true,
        count: 1,
        maxImages: 10,
        hasImages: true,
      });

      const onProcessBatch = vi.fn();
      render(<BatchCaptureUI {...defaultProps} onProcessBatch={onProcessBatch} />);

      fireEvent.click(screen.getByRole('button', { name: /Process Batch/i }));

      expect(onProcessBatch).toHaveBeenCalledWith(mockImages);
    });

    it('should disable Process Batch button when processing', () => {
      vi.mocked(useBatchCapture).mockReturnValue({
        images: [createMockImage('img-1', 1)],
        addImages: vi.fn(),
        removeImage: vi.fn(),
        clearBatch: vi.fn(),
        canAddMore: true,
        count: 1,
        maxImages: 10,
        hasImages: true,
      });

      render(<BatchCaptureUI {...defaultProps} isProcessing={true} />);

      expect(screen.getByRole('button', { name: /Processing/i })).toBeDisabled();
    });
  });

  describe('Cancel Action', () => {
    it('should call onCancel directly when 0-1 images (no confirmation)', () => {
      const clearBatch = vi.fn();
      vi.mocked(useBatchCapture).mockReturnValue({
        images: [createMockImage('img-1', 1)],
        addImages: vi.fn(),
        removeImage: vi.fn(),
        clearBatch,
        canAddMore: true,
        count: 1,
        maxImages: 10,
        hasImages: true,
      });

      const onCancel = vi.fn();
      render(<BatchCaptureUI {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: /Cancel Batch/i }));

      expect(clearBatch).toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });

    it('should show styled confirmation dialog when 2+ images exist (AC #8)', () => {
      const clearBatch = vi.fn();
      vi.mocked(useBatchCapture).mockReturnValue({
        images: [createMockImage('img-1', 1), createMockImage('img-2', 2)],
        addImages: vi.fn(),
        removeImage: vi.fn(),
        clearBatch,
        canAddMore: true,
        count: 2,
        maxImages: 10,
        hasImages: true,
      });

      const onCancel = vi.fn();
      render(<BatchCaptureUI {...defaultProps} onCancel={onCancel} />);

      // Click cancel batch button
      fireEvent.click(screen.getByRole('button', { name: /Cancel Batch/i }));

      // Confirmation dialog should appear (styled dialog, not window.confirm)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // Dialog has confirm and cancel buttons
      expect(screen.getByRole('button', { name: 'batchCancelConfirmYes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'batchCancelConfirmNo' })).toBeInTheDocument();

      // Should NOT cancel yet (dialog shown)
      expect(clearBatch).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should cancel batch when confirm is clicked in dialog', () => {
      const clearBatch = vi.fn();
      vi.mocked(useBatchCapture).mockReturnValue({
        images: [createMockImage('img-1', 1), createMockImage('img-2', 2)],
        addImages: vi.fn(),
        removeImage: vi.fn(),
        clearBatch,
        canAddMore: true,
        count: 2,
        maxImages: 10,
        hasImages: true,
      });

      const onCancel = vi.fn();
      render(<BatchCaptureUI {...defaultProps} onCancel={onCancel} />);

      // Open confirmation dialog
      fireEvent.click(screen.getByRole('button', { name: /Cancel Batch/i }));

      // Click confirm in dialog
      fireEvent.click(screen.getByRole('button', { name: 'batchCancelConfirmYes' }));

      // Should cancel
      expect(clearBatch).toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });

    it('should dismiss dialog when cancel is clicked in dialog', () => {
      const clearBatch = vi.fn();
      vi.mocked(useBatchCapture).mockReturnValue({
        images: [createMockImage('img-1', 1), createMockImage('img-2', 2)],
        addImages: vi.fn(),
        removeImage: vi.fn(),
        clearBatch,
        canAddMore: true,
        count: 2,
        maxImages: 10,
        hasImages: true,
      });

      const onCancel = vi.fn();
      render(<BatchCaptureUI {...defaultProps} onCancel={onCancel} />);

      // Open confirmation dialog
      fireEvent.click(screen.getByRole('button', { name: /Cancel Batch/i }));

      // Click dismiss in dialog
      fireEvent.click(screen.getByRole('button', { name: 'batchCancelConfirmNo' }));

      // Dialog should close, batch should NOT be cancelled
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(clearBatch).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Back Button', () => {
    it('should have accessible back button', () => {
      render(<BatchCaptureUI {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should render with light theme', () => {
      const { container } = render(<BatchCaptureUI {...defaultProps} theme="light" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with dark theme', () => {
      const { container } = render(<BatchCaptureUI {...defaultProps} theme="dark" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper tablist role for mode selector', () => {
      render(<BatchCaptureUI {...defaultProps} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should have aria-label on mode selector', () => {
      render(<BatchCaptureUI {...defaultProps} />);

      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Capture mode selector');
    });
  });
});
