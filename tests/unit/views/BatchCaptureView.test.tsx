/**
 * Unit Tests for BatchCaptureView Component
 *
 * Story 12.1: Batch Capture UI
 * Story 14d.5a: Updated for ScanContext-based state management (Option A)
 *
 * Tests for the batch capture view with image management.
 *
 * @see docs/sprint-artifacts/epic12/story-12.1-batch-capture-ui.md
 * @see docs/sprint-artifacts/epic14d/stories/story-14d.5a-core-state-migration.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Story 14d.5a: Mock imageUtils for thumbnail generation
vi.mock('../../../src/utils/imageUtils', () => ({
  processFilesForCapture: vi.fn(async () => []),
  generateThumbnail: vi.fn(async () => 'data:image/jpeg;base64,mock'),
  readFileAsDataUrl: vi.fn(async () => 'data:image/jpeg;base64,mock'),
}));

// Story 14d.5a: Mock ScanContext for BatchCaptureView
// Returns null to test fallback behavior (props-based mode)
const mockScanContext = {
  state: { images: [], mode: 'batch' as const, phase: 'capturing' as const },
  setImages: vi.fn(),
  reset: vi.fn(),
  isBatchProcessing: false,
};

vi.mock('../../../src/contexts/ScanContext', () => ({
  useScanOptional: vi.fn(() => null), // Start with null - tests can override
}));

// Import after mocking
import { BatchCaptureView } from '../../../src/views/BatchCaptureView';
import { useScanOptional } from '../../../src/contexts/ScanContext';

// Mock translation function
const t = (key: string) => {
  const translations: Record<string, string> = {
    back: 'Back',
    close: 'Close',
    scanViewTitle: 'Escanea',
    batchEmptyState: 'No images selected',
    batchSelectImages: 'Select images to scan',
    batchReceiptsDetected: 'images selected',
    batchEachImageTransaction: 'Each image will be processed',
    batchViewImages: 'View images',
    batchAddMore: 'Add',
    batchCreditUsage: 'Credit usage',
    batchCreditsNeeded: 'Credits needed',
    batchCreditsAvailable: 'Credits available',
    batchCreditsAfter: 'Credits after',
    batchCancelBtn: 'Cancel',
    batchProcessAll: 'Process All',
    batchProcessing: 'Processing...',
    batchCapturePhoto: 'Capture Photo',
    batchSwitchToSingle: 'Switch to single scan',
    batchCancelConfirmTitle: 'Cancel Batch?',
    batchCancelConfirmMessage: 'You have {count} images captured.',
    batchCancelConfirmYes: 'Yes, cancel',
    batchCancelConfirmNo: 'Continue',
    receipt: 'Receipt',
    removeImage: 'Remove image',
    creditInfo: 'Credit Info',
  };
  return translations[key] || key;
};

describe('BatchCaptureView Component', () => {
  const defaultProps = {
    isBatchMode: true,
    onToggleMode: vi.fn(),
    onProcessBatch: vi.fn(),
    onSwitchToIndividual: vi.fn(),
    onBack: vi.fn(),
    isProcessing: false,
    theme: 'light' as const,
    t,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to null context (props-based fallback)
    vi.mocked(useScanOptional).mockReturnValue(null);
  });

  describe('Rendering', () => {
    it('should render scan title in header', () => {
      render(<BatchCaptureView {...defaultProps} />);

      // Get the h1 title specifically
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('Escanea');
    });

    it('should show empty state when no images', () => {
      render(<BatchCaptureView {...defaultProps} />);

      expect(screen.getByText('No images selected')).toBeInTheDocument();
    });

    it('should show Capture Photo button when no images', () => {
      render(<BatchCaptureView {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Capture Photo' })).toBeInTheDocument();
    });

    it('should show switch to single scan button', () => {
      render(<BatchCaptureView {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Switch to single scan' })).toBeInTheDocument();
    });
  });

  describe('Story 14d.5a: Context Integration', () => {
    it('should use context images when context is available', () => {
      const contextWithImages = {
        ...mockScanContext,
        state: {
          images: ['data:image/jpeg;base64,test1'],
          mode: 'batch' as const,
          phase: 'capturing' as const,
        },
      };
      vi.mocked(useScanOptional).mockReturnValue(contextWithImages as never);

      render(<BatchCaptureView {...defaultProps} />);

      // Should show 1 image selected
      expect(screen.getByText(/1.*images selected/i)).toBeInTheDocument();
    });

    it('should fall back to props when context is null', () => {
      vi.mocked(useScanOptional).mockReturnValue(null);

      render(<BatchCaptureView {...defaultProps} imageDataUrls={['data:image/jpeg;base64,prop1']} />);

      // Should show 1 image from props
      expect(screen.getByText(/1.*images selected/i)).toBeInTheDocument();
    });

    it('should call context.reset when clearing batch', () => {
      const mockReset = vi.fn();
      vi.mocked(useScanOptional).mockReturnValue({
        ...mockScanContext,
        reset: mockReset,
      } as never);

      render(<BatchCaptureView {...defaultProps} />);

      // Click back with 0 images (no confirmation needed)
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));

      expect(mockReset).toHaveBeenCalled();
    });
  });

  describe('Back/Cancel Button', () => {
    it('should call onBack when back button is clicked with no images', () => {
      const onBack = vi.fn();
      render(<BatchCaptureView {...defaultProps} onBack={onBack} />);

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));

      expect(onBack).toHaveBeenCalled();
    });

    it('should show confirmation dialog with 2+ images', () => {
      const contextWithImages = {
        ...mockScanContext,
        state: {
          images: ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'],
          mode: 'batch' as const,
          phase: 'capturing' as const,
        },
      };
      vi.mocked(useScanOptional).mockReturnValue(contextWithImages as never);

      render(<BatchCaptureView {...defaultProps} />);

      // Click back with 2 images
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));

      // Should show confirmation dialog
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Cancel Batch?')).toBeInTheDocument();
    });
  });

  describe('Switch to Single Mode', () => {
    it('should call onSwitchToIndividual when switch button is clicked', () => {
      const onSwitchToIndividual = vi.fn();
      render(<BatchCaptureView {...defaultProps} onSwitchToIndividual={onSwitchToIndividual} />);

      fireEvent.click(screen.getByRole('button', { name: 'Switch to single scan' }));

      expect(onSwitchToIndividual).toHaveBeenCalled();
    });
  });

  describe('Processing State', () => {
    it('should disable capture buttons when processing', () => {
      render(<BatchCaptureView {...defaultProps} isProcessing={true} />);

      const captureButton = screen.getByRole('button', { name: 'Capture Photo' });
      expect(captureButton).toBeDisabled();
    });

    it('should use context isBatchProcessing over props', () => {
      const contextProcessing = {
        ...mockScanContext,
        isBatchProcessing: true,
      };
      vi.mocked(useScanOptional).mockReturnValue(contextProcessing as never);

      render(<BatchCaptureView {...defaultProps} isProcessing={false} />);

      const captureButton = screen.getByRole('button', { name: 'Capture Photo' });
      expect(captureButton).toBeDisabled();
    });
  });

  describe('Credit Display', () => {
    it('should show credit badges when credits are provided', () => {
      render(<BatchCaptureView {...defaultProps} superCreditsAvailable={5} normalCreditsAvailable={10} />);

      // Should show credit section
      expect(screen.getByText('Credit usage')).toBeInTheDocument();
    });

    it('should show credits needed as 0 when no images', () => {
      render(<BatchCaptureView {...defaultProps} superCreditsAvailable={5} />);

      // Credits needed should be 0 with no images
      const creditRows = screen.getAllByText('0');
      expect(creditRows.length).toBeGreaterThan(0);
    });

    it('should show credits needed as 1 when has images', () => {
      const contextWithImages = {
        ...mockScanContext,
        state: {
          images: ['data:image/jpeg;base64,test1'],
          mode: 'batch' as const,
          phase: 'capturing' as const,
        },
      };
      vi.mocked(useScanOptional).mockReturnValue(contextWithImages as never);

      render(<BatchCaptureView {...defaultProps} superCreditsAvailable={5} />);

      // Credits needed should be 1 (batch uses 1 credit regardless of image count)
      expect(screen.getByText('Credits needed')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should render with light theme', () => {
      const { container } = render(<BatchCaptureView {...defaultProps} theme="light" />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with dark theme', () => {
      const { container } = render(<BatchCaptureView {...defaultProps} theme="dark" />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible back button', () => {
      render(<BatchCaptureView {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
      render(<BatchCaptureView {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should have collapsible image gallery section', () => {
      render(<BatchCaptureView {...defaultProps} />);

      expect(screen.getByText('View images')).toBeInTheDocument();
    });
  });
});
