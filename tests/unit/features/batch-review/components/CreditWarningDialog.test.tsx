/**
 * Story 12.4: Credit Warning System - Credit Warning Dialog Tests
 *
 * Tests for the CreditWarningDialog component behavior in both
 * sufficient and insufficient credits scenarios.
 *
 * @see docs/sprint-artifacts/epic12/story-12.4-credit-warning-system.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreditWarningDialog } from '../../../../src/components/batch/CreditWarningDialog';
import type { CreditCheckResult } from '../../../../src/services/creditService';

// Mock translation function - keys must match actual component usage
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    // Header titles
    batchCreditUsage: 'Credit Usage',
    insufficientCreditsTitle: 'Insufficient Credits',
    // Batch description
    batchWillUse: 'This batch of {count} receipts will use {credits} credits',
    // Credit breakdown labels (match component's actual keys)
    batchCreditsNeeded: 'Credits required',
    batchCreditsAvailable: 'Credits available',
    superCreditsAvailable: 'Super credits available',
    batchCreditsAfter: 'After batch',
    // Warnings and messages
    lowCreditsWarning: 'This will use all your remaining credits',
    insufficientCreditsMessage: 'You need {required} credits but only have {available} available.',
    canProcessPartial: 'You can process up to {count} receipts with your current credits.',
    // Buttons
    reduceBatch: 'Reduce Batch',
    getMoreCredits: 'Get more credits',
    continue: 'Continue',
    cancel: 'Cancel',
  };
  return translations[key] || key;
};

describe('CreditWarningDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnReduceBatch = vi.fn();
  const mockOnGetMoreCredits = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sufficient credits mode', () => {
    const sufficientCredits: CreditCheckResult = {
      sufficient: true,
      available: 10,
      required: 5,
      remaining: 5,
      shortage: 0,
      maxProcessable: 5,
    };

    it('should render warning title for sufficient credits', () => {
      render(
        <CreditWarningDialog
          creditCheck={sufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Credit Usage')).toBeInTheDocument();
    });

    it('should display credit breakdown correctly (AC #2)', () => {
      render(
        <CreditWarningDialog
          creditCheck={sufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Credits required')).toBeInTheDocument();
      expect(screen.getByText('Credits available')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('After batch')).toBeInTheDocument();
      // There are two "5" values (required and remaining), verify both exist
      const fives = screen.getAllByText('5');
      expect(fives.length).toBe(2);
    });

    it('should show Continue and Cancel buttons (AC #5)', () => {
      render(
        <CreditWarningDialog
          creditCheck={sufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should call onConfirm when Continue is clicked', () => {
      render(
        <CreditWarningDialog
          creditCheck={sufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when Cancel is clicked', () => {
      render(
        <CreditWarningDialog
          creditCheck={sufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should show low credits warning when batch will exhaust credits (AC #4)', () => {
      const lowCredits: CreditCheckResult = {
        sufficient: true,
        available: 5,
        required: 5,
        remaining: 0,
        shortage: 0,
        maxProcessable: 5,
      };

      render(
        <CreditWarningDialog
          creditCheck={lowCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('This will use all your remaining credits')).toBeInTheDocument();
    });

    it('should render correctly in dark theme', () => {
      render(
        <CreditWarningDialog
          creditCheck={sufficientCredits}
          receiptCount={5}
          theme="dark"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Credit Usage')).toBeInTheDocument();
    });
  });

  describe('insufficient credits mode (AC #3)', () => {
    const insufficientCredits: CreditCheckResult = {
      sufficient: false,
      available: 3,
      required: 5,
      remaining: 0,
      shortage: 2,
      maxProcessable: 3,
    };

    it('should render error title for insufficient credits', () => {
      render(
        <CreditWarningDialog
          creditCheck={insufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Insufficient Credits')).toBeInTheDocument();
    });

    it('should display insufficient credits message with required and available counts', () => {
      render(
        <CreditWarningDialog
          creditCheck={insufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // The message gets interpolated by the component
      expect(screen.getByText(/5 credits.*3 available/i)).toBeInTheDocument();
    });

    it('should show partial processing option when some credits available', () => {
      render(
        <CreditWarningDialog
          creditCheck={insufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onReduceBatch={mockOnReduceBatch}
        />
      );

      expect(screen.getByText(/3 receipts/i)).toBeInTheDocument();
    });

    it('should show Reduce Batch button when onReduceBatch is provided', () => {
      render(
        <CreditWarningDialog
          creditCheck={insufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onReduceBatch={mockOnReduceBatch}
        />
      );

      expect(screen.getByRole('button', { name: 'Reduce Batch' })).toBeInTheDocument();
    });

    it('should call onReduceBatch when Reduce Batch is clicked', () => {
      render(
        <CreditWarningDialog
          creditCheck={insufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onReduceBatch={mockOnReduceBatch}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Reduce Batch' }));
      expect(mockOnReduceBatch).toHaveBeenCalledTimes(1);
    });

    it('should show Get More Credits button when handler is provided', () => {
      render(
        <CreditWarningDialog
          creditCheck={insufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onGetMoreCredits={mockOnGetMoreCredits}
        />
      );

      expect(screen.getByRole('button', { name: 'Get more credits' })).toBeInTheDocument();
    });

    it('should call onGetMoreCredits when Get More Credits is clicked', () => {
      render(
        <CreditWarningDialog
          creditCheck={insufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onGetMoreCredits={mockOnGetMoreCredits}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Get more credits' }));
      expect(mockOnGetMoreCredits).toHaveBeenCalledTimes(1);
    });

    it('should not show Reduce Batch when no credits available', () => {
      const noCredits: CreditCheckResult = {
        sufficient: false,
        available: 0,
        required: 5,
        remaining: 0,
        shortage: 5,
        maxProcessable: 0,
      };

      render(
        <CreditWarningDialog
          creditCheck={noCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onReduceBatch={mockOnReduceBatch}
        />
      );

      expect(screen.queryByRole('button', { name: 'Reduce Batch' })).not.toBeInTheDocument();
    });

    it('should not show Continue button for insufficient credits', () => {
      render(
        <CreditWarningDialog
          creditCheck={insufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper dialog role and aria attributes', () => {
      const sufficientCredits: CreditCheckResult = {
        sufficient: true,
        available: 10,
        required: 5,
        remaining: 5,
        shortage: 0,
        maxProcessable: 5,
      };

      render(
        <CreditWarningDialog
          creditCheck={sufficientCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'credit-warning-title');
    });

    it('should have alert role for low credits warning', () => {
      const lowCredits: CreditCheckResult = {
        sufficient: true,
        available: 5,
        required: 5,
        remaining: 0,
        shortage: 0,
        maxProcessable: 5,
      };

      render(
        <CreditWarningDialog
          creditCheck={lowCredits}
          receiptCount={5}
          theme="light"
          t={mockT}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
