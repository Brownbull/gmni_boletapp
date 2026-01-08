/**
 * TotalMismatchDialog Component Tests
 *
 * Tests for the dialog that appears when extracted total
 * doesn't match the sum of items (OCR error detection).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TotalMismatchDialog } from '../../../../src/components/scan/TotalMismatchDialog';
import { TotalValidationResult } from '../../../../src/utils/totalValidation';

describe('TotalMismatchDialog', () => {
  const defaultValidationResult: TotalValidationResult = {
    isValid: false,
    extractedTotal: 10205,
    itemsSum: 102052,
    discrepancy: 0.9,
    discrepancyPercent: 90,
    suggestedTotal: 102052,
    errorType: 'missing_digit',
  };

  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      totalMismatchTitle: 'Total does not match items',
      totalMismatchMessage: 'The total ({extractedTotal}) differs from items ({itemsSum}).',
      totalMismatchMissingDigit: 'A digit may be missing.',
      totalMismatchExtraDigit: 'Extra digit detected.',
      useItemsSum: 'Use items sum ({total})',
      useExtractedTotal: 'Keep original ({total})',
      itemsSum: 'Items sum',
      total: 'Total',
      diff: 'Difference',
      close: 'Close',
    };
    return translations[key] || key;
  };

  const defaultProps = {
    validationResult: defaultValidationResult,
    currency: 'CLP',
    onUseItemsSum: vi.fn(),
    onKeepOriginal: vi.fn(),
    onCancel: vi.fn(),
    theme: 'light' as const,
    t: mockT,
    isOpen: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<TotalMismatchDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Total does not match items')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<TotalMismatchDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays the extracted total and items sum', () => {
    render(<TotalMismatchDialog {...defaultProps} />);
    // The dialog should show both values - use getAllByText since they appear in buttons too
    const totals = screen.getAllByText(/10\.205/i);
    const itemsSums = screen.getAllByText(/102\.052/i);
    expect(totals.length).toBeGreaterThanOrEqual(1);
    expect(itemsSums.length).toBeGreaterThanOrEqual(1);
  });

  it('shows missing digit hint when errorType is missing_digit', () => {
    render(<TotalMismatchDialog {...defaultProps} />);
    expect(screen.getByText('A digit may be missing.')).toBeInTheDocument();
  });

  it('shows extra digit hint when errorType is extra_digit', () => {
    const props = {
      ...defaultProps,
      validationResult: {
        ...defaultValidationResult,
        errorType: 'extra_digit' as const,
      },
    };
    render(<TotalMismatchDialog {...props} />);
    expect(screen.getByText('Extra digit detected.')).toBeInTheDocument();
  });

  it('does not show hint when errorType is unknown', () => {
    const props = {
      ...defaultProps,
      validationResult: {
        ...defaultValidationResult,
        errorType: 'unknown' as const,
      },
    };
    render(<TotalMismatchDialog {...props} />);
    expect(screen.queryByText('A digit may be missing.')).not.toBeInTheDocument();
    expect(screen.queryByText('Extra digit detected.')).not.toBeInTheDocument();
  });

  it('calls onUseItemsSum when items sum button is clicked', () => {
    render(<TotalMismatchDialog {...defaultProps} />);
    const useItemsSumButton = screen.getByRole('button', { name: /items sum/i });
    fireEvent.click(useItemsSumButton);
    expect(defaultProps.onUseItemsSum).toHaveBeenCalledTimes(1);
  });

  it('calls onKeepOriginal when keep original button is clicked', () => {
    render(<TotalMismatchDialog {...defaultProps} />);
    const keepOriginalButton = screen.getByRole('button', { name: /keep original/i });
    fireEvent.click(keepOriginalButton);
    expect(defaultProps.onKeepOriginal).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when close button is clicked', () => {
    render(<TotalMismatchDialog {...defaultProps} />);
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked', () => {
    render(<TotalMismatchDialog {...defaultProps} />);
    // Backdrop is the first element with bg-black/50 class
    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    }
  });

  it('applies dark theme styles when theme is dark', () => {
    render(<TotalMismatchDialog {...defaultProps} theme="dark" />);
    const dialog = screen.getByRole('dialog');
    const dialogContent = dialog.querySelector('.bg-gray-800');
    expect(dialogContent).toBeInTheDocument();
  });

  it('shows discrepancy percentage', () => {
    render(<TotalMismatchDialog {...defaultProps} />);
    expect(screen.getByText(/90%/)).toBeInTheDocument();
  });
});
