/**
 * Unit Tests for BatchCaptureView Component
 *
 * Story 12.1: Batch Capture UI
 * Tests for the batch capture view with mode toggle and image management.
 *
 * @see docs/sprint-artifacts/epic12/story-12.1-batch-capture-ui.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock the useBatchCapture hook before importing the component
vi.mock('../../../src/hooks/useBatchCapture', () => ({
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
import { BatchCaptureView } from '../../../src/views/BatchCaptureView';

// Mock translation function
const t = (key: string) => {
  const translations: Record<string, string> = {
    back: 'Back',
    batchModeBatch: 'Batch Mode',
    batchModeSelector: 'Capture mode selector',
    batchModeIndividual: 'Individual',
    batchModeHint: 'Capture multiple receipts, then process all at once',
    batchTapToCapture: 'Tap to capture or select images',
    batchCapturePhoto: 'Capture Photo',
    batchCaptureAnother: 'Capture Another',
    batchProcessBatch: 'Process Batch',
    batchProcessing: 'Processing...',
    batchCancel: 'Cancel Batch',
    batchCancelConfirmTitle: 'Cancel Batch?',
    batchCancelConfirmMessage: 'Only {count} completed transactions will be saved.',
    batchCancelConfirmYes: 'Yes, cancel',
    batchCancelConfirmNo: 'Continue processing',
    receipt: 'Receipt',
    removeImage: 'Remove image',
    batchAddMore: 'Add',
    batchOfMax: 'of',
    batchImages: 'images',
    batchImageList: 'Captured images',
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
  });

  describe('Rendering', () => {
    it('should render batch mode title in header', () => {
      render(<BatchCaptureView {...defaultProps} />);

      // Get the h1 title specifically
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('Batch Mode');
    });

    it('should render mode toggle tabs (AC #1)', () => {
      render(<BatchCaptureView {...defaultProps} />);

      expect(screen.getByRole('tab', { name: 'Individual' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Batch Mode' })).toBeInTheDocument();
    });

    it('should show batch mode as active when isBatchMode is true', () => {
      render(<BatchCaptureView {...defaultProps} isBatchMode={true} />);

      const batchTab = screen.getByRole('tab', { name: 'Batch Mode' });
      expect(batchTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should show individual mode as active when isBatchMode is false', () => {
      render(<BatchCaptureView {...defaultProps} isBatchMode={false} />);

      const individualTab = screen.getByRole('tab', { name: 'Individual' });
      expect(individualTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should show batch mode hint when in batch mode', () => {
      render(<BatchCaptureView {...defaultProps} isBatchMode={true} />);

      // The hint appears twice in the UI (in toggle section and empty state)
      const hints = screen.getAllByText('Capture multiple receipts, then process all at once');
      expect(hints.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Mode Toggle', () => {
    it('should call onToggleMode when Individual tab is clicked', () => {
      const onToggleMode = vi.fn();
      render(<BatchCaptureView {...defaultProps} onToggleMode={onToggleMode} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Individual' }));

      // May call onSwitchToIndividual instead since we're mocking with no images
      expect(onToggleMode).toHaveBeenCalledWith(false);
    });

    it('should call onToggleMode when Batch Mode tab is clicked', () => {
      const onToggleMode = vi.fn();
      render(<BatchCaptureView {...defaultProps} isBatchMode={false} onToggleMode={onToggleMode} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Batch Mode' }));

      expect(onToggleMode).toHaveBeenCalledWith(true);
    });
  });

  describe('Empty State', () => {
    it('should show capture area when no images', () => {
      render(<BatchCaptureView {...defaultProps} />);

      expect(screen.getByText('Tap to capture or select images')).toBeInTheDocument();
    });

    it('should show Capture Photo button when no images', () => {
      render(<BatchCaptureView {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Capture Photo' })).toBeInTheDocument();
    });
  });

  describe('Back Button', () => {
    it('should call onBack when back button is clicked with no images', () => {
      const onBack = vi.fn();
      render(<BatchCaptureView {...defaultProps} onBack={onBack} />);

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));

      expect(onBack).toHaveBeenCalled();
    });
  });

  describe('Processing State', () => {
    it('should disable capture buttons when processing', () => {
      render(<BatchCaptureView {...defaultProps} isProcessing={true} />);

      const captureButton = screen.getByRole('button', { name: 'Capture Photo' });
      expect(captureButton).toBeDisabled();
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
    it('should have proper tablist role for mode selector', () => {
      render(<BatchCaptureView {...defaultProps} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should have accessible back button', () => {
      render(<BatchCaptureView {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });
  });
});
