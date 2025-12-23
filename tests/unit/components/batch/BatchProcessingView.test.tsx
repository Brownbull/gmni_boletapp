/**
 * Story 12.2: Parallel Processing Service - BatchProcessingView Tests
 *
 * Tests for the BatchProcessingView component that displays
 * parallel batch processing progress.
 *
 * @see docs/sprint-artifacts/epic12/story-12.2-parallel-processing-service.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BatchProcessingView } from '../../../../src/components/batch/BatchProcessingView';
import * as useBatchProcessingHook from '../../../../src/hooks/useBatchProcessing';
import type { Transaction } from '../../../../src/types/transaction';

// Mock the useBatchProcessing hook
vi.mock('../../../../src/hooks/useBatchProcessing', () => ({
  useBatchProcessing: vi.fn(),
}));

describe('BatchProcessingView', () => {
  const mockUseBatchProcessing = vi.mocked(useBatchProcessingHook.useBatchProcessing);

  // Default mock return value
  const defaultMockReturn: ReturnType<typeof useBatchProcessingHook.useBatchProcessing> = {
    states: [],
    isProcessing: false,
    progress: { current: 0, total: 0 },
    startProcessing: vi.fn().mockResolvedValue([]),
    cancel: vi.fn(),
    retry: vi.fn().mockResolvedValue({ id: 'test', index: 0, success: true }),
    reset: vi.fn(),
    summary: {
      total: 0,
      pending: 0,
      processing: 0,
      ready: 0,
      error: 0,
      percentComplete: 0,
    },
    isComplete: false,
    successfulTransactions: [],
    failedStates: [],
    results: [],
  };

  // Mock translation function
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      batchProcessingTitle: 'Processing receipts...',
      batchProcessingCount: 'Processing {count} receipts in parallel...',
      batchResultsList: 'Processing results',
      batchItemFailed: 'Could not read the image',
      batchItemProcessing: 'Processing...',
      batchItemPending: 'Waiting...',
      batchItemUploading: 'Uploading...',
      batchItemReady: 'Ready',
      batchSuccessful: 'successful',
      batchFailed: 'failed',
      batchRetry: 'Retry',
      batchContinue: 'Continue',
      batchCancelProcessing: 'Cancel',
      receipt: 'Receipt',
      unknown: 'Unknown',
    };
    return translations[key] || key;
  });

  // Default props
  const defaultProps = {
    images: ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'],
    currency: 'CLP',
    theme: 'light' as const,
    displayCurrency: 'CLP' as const,
    t: mockT,
    onComplete: vi.fn(),
    onCancel: vi.fn(),
    autoStart: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBatchProcessing.mockReturnValue(defaultMockReturn);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering', () => {
    it('should render with title and count', () => {
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        isProcessing: true,
        progress: { current: 0, total: 2 },
        states: [
          { id: '1', index: 0, status: 'pending', progress: 0 },
          { id: '2', index: 1, status: 'pending', progress: 0 },
        ],
        summary: { ...defaultMockReturn.summary, total: 2, pending: 2 },
      });

      render(<BatchProcessingView {...defaultProps} />);

      expect(screen.getByText('Processing receipts...')).toBeInTheDocument();
    });

    it('should render progress bar', () => {
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        isProcessing: true,
        progress: { current: 1, total: 2 },
        summary: { ...defaultMockReturn.summary, total: 2, ready: 1, percentComplete: 50 },
        states: [
          { id: '1', index: 0, status: 'ready', progress: 100 },
          { id: '2', index: 1, status: 'processing', progress: 50 },
        ],
      });

      render(<BatchProcessingView {...defaultProps} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('1/2')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render individual image statuses (AC #2)', () => {
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        states: [
          { id: '1', index: 0, status: 'ready', progress: 100 },
          { id: '2', index: 1, status: 'processing', progress: 50 },
          { id: '3', index: 2, status: 'pending', progress: 0 },
        ],
        summary: { ...defaultMockReturn.summary, total: 3, ready: 1, processing: 1, pending: 1 },
      });

      render(
        <BatchProcessingView
          {...defaultProps}
          images={[...defaultProps.images, 'data:image/jpeg;base64,test3']}
        />
      );

      // Should show status list
      expect(screen.getByRole('list', { name: /results/i })).toBeInTheDocument();

      // Should show different status texts
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByText('Waiting...')).toBeInTheDocument();
    });

    it('should render with dark theme', () => {
      render(<BatchProcessingView {...defaultProps} theme="dark" />);

      // Component should render without errors
      expect(screen.getByText('Processing receipts...')).toBeInTheDocument();
    });
  });

  describe('auto-start', () => {
    it('should auto-start processing when autoStart is true', async () => {
      const mockStartProcessing = vi.fn().mockResolvedValue([]);
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        startProcessing: mockStartProcessing,
      });

      render(<BatchProcessingView {...defaultProps} autoStart={true} />);

      await waitFor(() => {
        expect(mockStartProcessing).toHaveBeenCalledWith(
          defaultProps.images,
          defaultProps.currency,
          undefined
        );
      });
    });

    it('should not auto-start when autoStart is false', async () => {
      const mockStartProcessing = vi.fn().mockResolvedValue([]);
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        startProcessing: mockStartProcessing,
      });

      render(<BatchProcessingView {...defaultProps} autoStart={false} />);

      // Wait a bit to ensure it doesn't start
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockStartProcessing).not.toHaveBeenCalled();
    });
  });

  describe('cancel functionality (AC #5)', () => {
    it('should show cancel button when processing', () => {
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        isProcessing: true,
      });

      render(<BatchProcessingView {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call cancel and onCancel when cancel button clicked', () => {
      const mockCancel = vi.fn();
      const mockOnCancel = vi.fn();
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        isProcessing: true,
        cancel: mockCancel,
      });

      render(<BatchProcessingView {...defaultProps} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockCancel).toHaveBeenCalled();
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('completion', () => {
    it('should call onComplete when processing completes', async () => {
      const tx = { merchant: 'Store', total: 1000 } as Transaction;
      const mockOnComplete = vi.fn();

      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        isComplete: true,
        successfulTransactions: [tx],
        summary: { ...defaultMockReturn.summary, ready: 1, error: 0 },
      });

      render(<BatchProcessingView {...defaultProps} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith({
          successCount: 1,
          failCount: 0,
          transactions: [tx],
        });
      });
    });

    it('should show continue button when complete', () => {
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        isComplete: true,
        summary: { ...defaultMockReturn.summary, ready: 2 },
      });

      render(<BatchProcessingView {...defaultProps} />);

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('should show summary stats when complete', () => {
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        isComplete: true,
        summary: {
          ...defaultMockReturn.summary,
          total: 3,
          ready: 2,
          error: 1,
          percentComplete: 100,
        },
        states: [
          { id: '1', index: 0, status: 'ready', progress: 100 },
          { id: '2', index: 1, status: 'ready', progress: 100 },
          { id: '3', index: 2, status: 'error', progress: 0, error: 'Failed' },
        ],
      });

      render(<BatchProcessingView {...defaultProps} />);

      expect(screen.getByText(/2 successful/i)).toBeInTheDocument();
      expect(screen.getByText(/1 failed/i)).toBeInTheDocument();
    });
  });

  describe('retry functionality (AC #6)', () => {
    it('should show retry button for failed items', () => {
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        states: [{ id: '1', index: 0, status: 'error', progress: 0, error: 'Failed' }],
        summary: { ...defaultMockReturn.summary, total: 1, error: 1, percentComplete: 100 },
        isComplete: true,
      });

      render(<BatchProcessingView {...defaultProps} images={['data:image/jpeg;base64,test1']} />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call retry when retry button clicked', () => {
      const mockRetry = vi.fn().mockResolvedValue({ id: 'test', index: 0, success: true });
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        states: [{ id: 'failed-1', index: 0, status: 'error', progress: 0, error: 'Failed' }],
        summary: { ...defaultMockReturn.summary, total: 1, error: 1, percentComplete: 100 },
        isComplete: true,
        retry: mockRetry,
      });

      render(<BatchProcessingView {...defaultProps} images={['data:image/jpeg;base64,test1']} />);

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      expect(mockRetry).toHaveBeenCalledWith('failed-1', 'data:image/jpeg;base64,test1');
    });

    it('should not show retry button for successful items', () => {
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        states: [
          {
            id: '1',
            index: 0,
            status: 'ready',
            progress: 100,
            result: { merchant: 'Store', total: 1000 } as Transaction,
          },
        ],
        summary: { ...defaultMockReturn.summary, total: 1, ready: 1, percentComplete: 100 },
        isComplete: true,
      });

      render(<BatchProcessingView {...defaultProps} images={['data:image/jpeg;base64,test1']} />);

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  describe('transaction display', () => {
    it('should display merchant and total for successful items', () => {
      const tx = {
        merchant: 'Test Store',
        alias: 'My Store',
        total: 15000,
        date: '2024-12-22',
        category: 'Supermarket',
        items: [],
      } as Transaction;

      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        states: [{ id: '1', index: 0, status: 'ready', progress: 100, result: tx }],
        summary: { ...defaultMockReturn.summary, total: 1, ready: 1, percentComplete: 100 },
        isComplete: true,
      });

      render(<BatchProcessingView {...defaultProps} images={['data:image/jpeg;base64,test1']} />);

      // Should show alias (preferred) over merchant
      expect(screen.getByText(/My Store/)).toBeInTheDocument();
    });

    it('should display error message for failed items', () => {
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        states: [
          {
            id: '1',
            index: 0,
            status: 'error',
            progress: 0,
            error: 'Network error',
          },
        ],
        summary: { ...defaultMockReturn.summary, total: 1, error: 1, percentComplete: 100 },
        isComplete: true,
      });

      render(<BatchProcessingView {...defaultProps} images={['data:image/jpeg;base64,test1']} />);

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible status region', () => {
      render(<BatchProcessingView {...defaultProps} />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible progress bar', () => {
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        isProcessing: true,
        progress: { current: 1, total: 2 },
        summary: { ...defaultMockReturn.summary, percentComplete: 50 },
      });

      render(<BatchProcessingView {...defaultProps} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '1');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '2');
    });

    it('should have accessible list of results', () => {
      mockUseBatchProcessing.mockReturnValue({
        ...defaultMockReturn,
        states: [{ id: '1', index: 0, status: 'pending', progress: 0 }],
      });

      render(<BatchProcessingView {...defaultProps} />);

      expect(screen.getByRole('list', { name: /results/i })).toBeInTheDocument();
      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });
  });
});
