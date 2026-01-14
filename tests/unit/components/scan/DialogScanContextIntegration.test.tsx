/**
 * Story 14d.4b: Dialog Component ScanContext Integration Tests
 *
 * Tests verifying that dialog components correctly:
 * 1. Read state from ScanContext when available
 * 2. Fall back to props when context not available
 * 3. Dispatch resolveDialog/dismissDialog actions on user interaction
 *
 * Note: We mock useScanOptional at the module level to control context behavior.
 *
 * @see docs/sprint-artifacts/epic14d/stories/story-14d.4b-consumer-migration.md
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  createMockScanContext,
  initialMockScanState,
  createMockDialogState,
  DIALOG_TYPES,
} from '../../../setup/test-utils';
import type { Transaction } from '../../../../src/types/transaction';
import type { TotalValidationResult } from '../../../../src/utils/totalValidation';
import type { ScanContextValue } from '../../../../src/contexts/ScanContext';

// Mock the context hook
const mockUseScanOptional = vi.fn<[], ScanContextValue | null>();
vi.mock('../../../../src/contexts/ScanContext', () => ({
  useScanOptional: () => mockUseScanOptional(),
}));

// Import components after mock setup
import { CurrencyMismatchDialog } from '../../../../src/components/scan/CurrencyMismatchDialog';
import { TotalMismatchDialog } from '../../../../src/components/scan/TotalMismatchDialog';
import { QuickSaveCard } from '../../../../src/components/scan/QuickSaveCard';
import { ScanCompleteModal } from '../../../../src/components/scan/ScanCompleteModal';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockTransaction: Transaction = {
  id: 'test-tx-1',
  userId: 'user-1',
  merchant: 'Test Store',
  category: 'Supermercado',
  total: 10000,
  currency: 'CLP',
  date: new Date().toISOString(),
  items: [
    { name: 'Item 1', price: 5000, qty: 1, category: 'Food' },
    { name: 'Item 2', price: 5000, qty: 1, category: 'Food' },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockValidationResult: TotalValidationResult = {
  isValid: false,
  extractedTotal: 10000,
  itemsSum: 9500,
  discrepancy: 500,
  discrepancyPercent: 5,
  suggestedTotal: null,
  errorType: 'none',
};

const defaultProps = {
  theme: 'light' as const,
  t: (key: string) => key,
  formatCurrency: (amount: number, currency: string) => `${currency} ${amount}`,
  currency: 'CLP',
};

// =============================================================================
// CurrencyMismatchDialog Tests
// =============================================================================

describe('CurrencyMismatchDialog ScanContext Integration', () => {
  const currencyDialogProps = {
    ...defaultProps,
    userCurrency: 'CLP',
  };

  beforeEach(() => {
    mockUseScanOptional.mockReset();
  });

  describe('Context Reading (AC6)', () => {
    it('should read dialog state from ScanContext when type matches', () => {
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.CURRENCY_MISMATCH, {
            detectedCurrency: 'EUR',
            pendingTransaction: mockTransaction,
          }),
        },
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<CurrencyMismatchDialog {...currencyDialogProps} />);

      // Dialog should be visible since context has active dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should fall back to props when context not available', () => {
      mockUseScanOptional.mockReturnValue(null);

      render(
        <CurrencyMismatchDialog
          {...currencyDialogProps}
          isOpen={true}
          detectedCurrency="USD"
        />
      );

      // Dialog should be visible via props
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render when neither context nor props indicate open', () => {
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: null,
        },
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      const { container } = render(
        <CurrencyMismatchDialog {...currencyDialogProps} isOpen={false} />
      );

      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });
  });

  describe('Context Actions', () => {
    it('should call resolveDialog when user clicks "Use Detected"', () => {
      const resolveDialog = vi.fn();
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.CURRENCY_MISMATCH, {
            detectedCurrency: 'EUR',
            pendingTransaction: mockTransaction,
          }),
        },
        resolveDialog,
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<CurrencyMismatchDialog {...currencyDialogProps} />);

      // Click the "use detected currency" button
      const useDetectedButton = screen.getByText(/useDetectedCurrency/i);
      fireEvent.click(useDetectedButton);

      expect(resolveDialog).toHaveBeenCalledWith(
        DIALOG_TYPES.CURRENCY_MISMATCH,
        { choice: 'detected' }
      );
    });

    it('should call dismissDialog when user clicks cancel', () => {
      const dismissDialog = vi.fn();
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.CURRENCY_MISMATCH, {
            detectedCurrency: 'EUR',
            pendingTransaction: mockTransaction,
          }),
        },
        dismissDialog,
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<CurrencyMismatchDialog {...currencyDialogProps} />);

      // Click the close button (X)
      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      expect(dismissDialog).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// TotalMismatchDialog Tests
// =============================================================================

describe('TotalMismatchDialog ScanContext Integration', () => {
  beforeEach(() => {
    mockUseScanOptional.mockReset();
  });

  describe('Context Reading (AC7)', () => {
    it('should read dialog state from ScanContext when type matches', () => {
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.TOTAL_MISMATCH, {
            validationResult: mockValidationResult,
            pendingTransaction: mockTransaction,
          }),
        },
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<TotalMismatchDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should fall back to props when context not available', () => {
      mockUseScanOptional.mockReturnValue(null);

      render(
        <TotalMismatchDialog
          {...defaultProps}
          isOpen={true}
          validationResult={mockValidationResult}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Context Actions', () => {
    it('should call resolveDialog with items_sum when user clicks "Use Items Sum"', () => {
      const resolveDialog = vi.fn();
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.TOTAL_MISMATCH, {
            validationResult: mockValidationResult,
            pendingTransaction: mockTransaction,
          }),
        },
        resolveDialog,
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<TotalMismatchDialog {...defaultProps} />);

      const useItemsSumButton = screen.getByText(/useItemsSum/i);
      fireEvent.click(useItemsSumButton);

      expect(resolveDialog).toHaveBeenCalledWith(
        DIALOG_TYPES.TOTAL_MISMATCH,
        { choice: 'items_sum' }
      );
    });

    it('should call resolveDialog with original when user clicks "Keep Original"', () => {
      const resolveDialog = vi.fn();
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.TOTAL_MISMATCH, {
            validationResult: mockValidationResult,
            pendingTransaction: mockTransaction,
          }),
        },
        resolveDialog,
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<TotalMismatchDialog {...defaultProps} />);

      const keepOriginalButton = screen.getByText(/useExtractedTotal/i);
      fireEvent.click(keepOriginalButton);

      expect(resolveDialog).toHaveBeenCalledWith(
        DIALOG_TYPES.TOTAL_MISMATCH,
        { choice: 'original' }
      );
    });
  });
});

// =============================================================================
// QuickSaveCard Tests
// =============================================================================

describe('QuickSaveCard ScanContext Integration', () => {
  const quickSaveProps = {
    ...defaultProps,
    lang: 'es' as const,
  };

  beforeEach(() => {
    mockUseScanOptional.mockReset();
  });

  describe('Context Reading (AC8)', () => {
    it('should read dialog state from ScanContext when type matches', () => {
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.QUICKSAVE, {
            transaction: mockTransaction,
            confidence: 0.95,
          }),
        },
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<QuickSaveCard {...quickSaveProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    it('should fall back to props when context not available', () => {
      mockUseScanOptional.mockReturnValue(null);

      render(
        <QuickSaveCard
          {...quickSaveProps}
          transaction={mockTransaction}
          confidence={0.95}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Context Actions', () => {
    it('should call resolveDialog with save when user clicks "Guardar"', async () => {
      const resolveDialog = vi.fn();
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.QUICKSAVE, {
            transaction: mockTransaction,
            confidence: 0.95,
          }),
        },
        resolveDialog,
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<QuickSaveCard {...quickSaveProps} />);

      const saveButton = screen.getByTestId('quick-save-button');
      fireEvent.click(saveButton);

      expect(resolveDialog).toHaveBeenCalledWith(
        DIALOG_TYPES.QUICKSAVE,
        { choice: 'save' }
      );
    });

    it('should call resolveDialog with edit when user clicks "Editar"', () => {
      const resolveDialog = vi.fn();
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.QUICKSAVE, {
            transaction: mockTransaction,
            confidence: 0.95,
          }),
        },
        resolveDialog,
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<QuickSaveCard {...quickSaveProps} />);

      const editButton = screen.getByTestId('quick-save-edit-button');
      fireEvent.click(editButton);

      expect(resolveDialog).toHaveBeenCalledWith(
        DIALOG_TYPES.QUICKSAVE,
        { choice: 'edit' }
      );
    });
  });
});

// =============================================================================
// ScanCompleteModal Tests
// =============================================================================

describe('ScanCompleteModal ScanContext Integration', () => {
  const modalProps = {
    ...defaultProps,
    lang: 'es' as const,
  };

  beforeEach(() => {
    mockUseScanOptional.mockReset();
  });

  describe('Context Reading (AC9)', () => {
    it('should read dialog state from ScanContext when type matches', () => {
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.SCAN_COMPLETE, {
            transaction: mockTransaction,
          }),
        },
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<ScanCompleteModal {...modalProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should fall back to props when context not available', () => {
      mockUseScanOptional.mockReturnValue(null);

      render(
        <ScanCompleteModal
          {...modalProps}
          visible={true}
          transaction={mockTransaction}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Context Actions', () => {
    it('should call resolveDialog with save when user clicks "Guardar ahora"', () => {
      const resolveDialog = vi.fn();
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.SCAN_COMPLETE, {
            transaction: mockTransaction,
          }),
        },
        resolveDialog,
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<ScanCompleteModal {...modalProps} />);

      const saveButton = screen.getByText(/saveNow/i);
      fireEvent.click(saveButton);

      expect(resolveDialog).toHaveBeenCalledWith(
        DIALOG_TYPES.SCAN_COMPLETE,
        { choice: 'save' }
      );
    });

    it('should call resolveDialog with edit when user clicks "Editar primero"', () => {
      const resolveDialog = vi.fn();
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.SCAN_COMPLETE, {
            transaction: mockTransaction,
          }),
        },
        resolveDialog,
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<ScanCompleteModal {...modalProps} />);

      const editButton = screen.getByText(/editFirst/i);
      fireEvent.click(editButton);

      expect(resolveDialog).toHaveBeenCalledWith(
        DIALOG_TYPES.SCAN_COMPLETE,
        { choice: 'edit' }
      );
    });

    it('should call dismissDialog when user clicks close button', () => {
      const dismissDialog = vi.fn();
      const mockContext = createMockScanContext({
        state: {
          ...initialMockScanState,
          activeDialog: createMockDialogState(DIALOG_TYPES.SCAN_COMPLETE, {
            transaction: mockTransaction,
          }),
        },
        dismissDialog,
      });
      mockUseScanOptional.mockReturnValue(mockContext);

      render(<ScanCompleteModal {...modalProps} />);

      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      expect(dismissDialog).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Cross-Component Tests
// =============================================================================

describe('Dialog Type Constants Usage', () => {
  it('DIALOG_TYPES should have correct values', () => {
    expect(DIALOG_TYPES.CURRENCY_MISMATCH).toBe('currency_mismatch');
    expect(DIALOG_TYPES.TOTAL_MISMATCH).toBe('total_mismatch');
    expect(DIALOG_TYPES.QUICKSAVE).toBe('quicksave');
    expect(DIALOG_TYPES.SCAN_COMPLETE).toBe('scan_complete');
    expect(DIALOG_TYPES.CANCEL_WARNING).toBe('cancel_warning');
    expect(DIALOG_TYPES.BATCH_CANCEL_WARNING).toBe('batch_cancel_warning');
    expect(DIALOG_TYPES.DISCARD_WARNING).toBe('discard_warning');
  });
});
