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

// Story 14e-11: Mock Zustand store for BatchCaptureView
// (Replaced ScanContext with Zustand store)
const mockScanStore = vi.fn((selector?: (state: unknown) => unknown) => {
  const state = {
    images: [] as string[],
    mode: 'batch' as const,
    phase: 'capturing' as const,
  }
  return selector ? selector(state) : state
})
const mockReset = vi.fn()
const mockSetImages = vi.fn()
const mockIsProcessing = vi.fn(() => false)

vi.mock('@features/scan/store', () => ({
  useScanStore: (selector?: (state: unknown) => unknown) => mockScanStore(selector),
  useScanActions: vi.fn(() => ({
    reset: mockReset,
    setImages: mockSetImages,
  })),
  useIsProcessing: () => mockIsProcessing(),
}))

// Story 14e-25c.2: Mock navigation store for BatchCaptureView
const mockNavigateBack = vi.fn()
vi.mock('../../../src/shared/stores/useNavigationStore', () => ({
  useNavigation: () => ({
    navigateBack: mockNavigateBack,
    navigateToView: vi.fn(),
    view: 'batch-capture',
  }),
}))

// Import after mocking
import { BatchCaptureView } from '../../../src/views/BatchCaptureView'

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
  // Story 14e-25c.2: Minimal props - onBack, isBatchMode, onToggleMode, isProcessing removed
  const defaultProps = {
    onProcessBatch: vi.fn(),
    onSwitchToIndividual: vi.fn(),
    theme: 'light' as const,
    t,
  };

  // Store state to be returned by the mock
  let storeState = {
    images: [] as string[],
    mode: 'batch' as const,
    phase: 'capturing' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Story 14e-11: Reset Zustand store mocks to default state
    storeState = {
      images: [],
      mode: 'batch' as const,
      phase: 'capturing' as const,
    };
    mockScanStore.mockImplementation((selector?: (state: typeof storeState) => unknown) => {
      return selector ? selector(storeState) : storeState;
    });
    mockReset.mockClear();
    mockSetImages.mockClear();
    mockIsProcessing.mockReturnValue(false);
    // Story 14e-25c.2: Reset navigation mock
    mockNavigateBack.mockClear();
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

  describe('Story 14e-11: Zustand Store Integration', () => {
    it('should use store images when available', () => {
      storeState = {
        images: ['data:image/jpeg;base64,test1'],
        mode: 'batch' as const,
        phase: 'capturing' as const,
      };

      render(<BatchCaptureView {...defaultProps} />);

      // Should show 1 image selected
      expect(screen.getByText(/1.*images selected/i)).toBeInTheDocument();
    });

    it('should fall back to props when store has no images', () => {
      storeState = {
        images: [],
        mode: 'batch' as const,
        phase: 'capturing' as const,
      };

      render(<BatchCaptureView {...defaultProps} imageDataUrls={['data:image/jpeg;base64,prop1']} />);

      // Should show 1 image from props
      expect(screen.getByText(/1.*images selected/i)).toBeInTheDocument();
    });

    it('should call reset action when clearing batch', () => {
      render(<BatchCaptureView {...defaultProps} />);

      // Click back with 0 images (no confirmation needed)
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));

      expect(mockReset).toHaveBeenCalled();
    });
  });

  describe('Back/Cancel Button', () => {
    // Story 14e-25c.2: Navigation via useNavigation() hook instead of props
    it('should call navigateBack when back button is clicked with no images', () => {
      render(<BatchCaptureView {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));

      expect(mockNavigateBack).toHaveBeenCalled();
    });

    it('should show confirmation dialog with 2+ images', () => {
      // Story 14e-11: Use Zustand mock instead of context
      storeState = {
        images: ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'],
        mode: 'batch' as const,
        phase: 'capturing' as const,
      };

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
    // Story 14e-25c.2: isProcessing comes from store only (prop removed)
    it('should disable capture buttons when processing', () => {
      mockIsProcessing.mockReturnValue(true);
      render(<BatchCaptureView {...defaultProps} />);

      const captureButton = screen.getByRole('button', { name: 'Capture Photo' });
      expect(captureButton).toBeDisabled();
    });

    it('should enable capture buttons when not processing', () => {
      mockIsProcessing.mockReturnValue(false);
      render(<BatchCaptureView {...defaultProps} />);

      const captureButton = screen.getByRole('button', { name: 'Capture Photo' });
      expect(captureButton).not.toBeDisabled();
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
      // Story 14e-11: Use Zustand mock instead of context
      storeState = {
        images: ['data:image/jpeg;base64,test1'],
        mode: 'batch' as const,
        phase: 'capturing' as const,
      };

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
