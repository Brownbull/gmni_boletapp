/**
 * Story 14e-15: BatchProgressIndicator Tests
 *
 * Tests for the BatchProgressIndicator component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchProgressIndicator } from '@features/batch-review/components/BatchProgressIndicator';
import type { ImageProcessingState } from '@features/batch-review/components/BatchProgressIndicator';

// Mock Zustand store
vi.mock('@features/batch-review/store', () => ({
  useBatchProgress: vi.fn(() => ({ current: 2, total: 5 })),
}));

describe('BatchProgressIndicator', () => {
  const defaultProps = {
    t: (key: string) => key,
    theme: 'light' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render progress header with current/total count', () => {
    render(<BatchProgressIndicator {...defaultProps} progress={{ current: 2, total: 5 }} />);

    expect(screen.getByText('batchProcessing (2/5)')).toBeInTheDocument();
  });

  it('should render progress bar with correct width', () => {
    render(<BatchProgressIndicator {...defaultProps} progress={{ current: 3, total: 6 }} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('should render processing status badge', () => {
    render(<BatchProgressIndicator {...defaultProps} />);

    expect(screen.getByText('processing')).toBeInTheDocument();
  });

  it('should render cancel button when onCancel is provided', () => {
    const onCancel = vi.fn();
    render(<BatchProgressIndicator {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByText('cancel');
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should not render cancel button when onCancel is not provided', () => {
    render(<BatchProgressIndicator {...defaultProps} />);

    expect(screen.queryByText('cancel')).not.toBeInTheDocument();
  });

  it('should render processing states list when provided', () => {
    const states: ImageProcessingState[] = [
      { id: '1', status: 'ready', result: { merchant: 'Store A', total: 100 } },
      { id: '2', status: 'processing' },
      { id: '3', status: 'pending' },
    ];

    render(
      <BatchProgressIndicator
        {...defaultProps}
        states={states}
        formatCurrency={(amt) => `$${amt}`}
      />
    );

    // Should show receipt labels
    expect(screen.getByText('receipt 1')).toBeInTheDocument();
    expect(screen.getByText('receipt 2')).toBeInTheDocument();
    expect(screen.getByText('receipt 3')).toBeInTheDocument();

    // Should show ready result
    expect(screen.getByText('Store A • $100')).toBeInTheDocument();

    // Should show processing status
    expect(screen.getByText('analyzing...')).toBeInTheDocument();

    // Should show pending status
    expect(screen.getByText('waiting...')).toBeInTheDocument();
  });

  it('should render error state with error message', () => {
    const states: ImageProcessingState[] = [
      { id: '1', status: 'error', error: 'OCR failed' },
    ];

    render(<BatchProgressIndicator {...defaultProps} states={states} />);

    expect(screen.getByText('OCR failed')).toBeInTheDocument();
  });

  it('should use dark theme styling', () => {
    render(<BatchProgressIndicator {...defaultProps} theme="dark" />);

    // Component should render without errors in dark mode
    expect(screen.getByText(/batchProcessing/)).toBeInTheDocument();
  });

  it('should handle zero progress gracefully', () => {
    render(<BatchProgressIndicator {...defaultProps} progress={{ current: 0, total: 0 }} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  it('should use formatCurrency for result display', () => {
    const states: ImageProcessingState[] = [
      { id: '1', status: 'ready', result: { merchant: 'Store', total: 99.99 } },
    ];

    const formatCurrency = vi.fn((amt) => `€${amt.toFixed(2)}`);

    render(
      <BatchProgressIndicator
        {...defaultProps}
        states={states}
        formatCurrency={formatCurrency}
        currency="EUR"
      />
    );

    expect(formatCurrency).toHaveBeenCalledWith(99.99, 'EUR');
    expect(screen.getByText('Store • €99.99')).toBeInTheDocument();
  });
});
