/**
 * Story TD-18-5: TransactionEditorScanStatus Tests
 *
 * Tests for the ScanCompleteModal save/edit UX fix.
 *
 * AC-1: After pressing save, modal stays visible with spinner
 * AC-3: No flash of editor between modal close and navigation
 * AC-4: Edit flow (dismiss modal) is unaffected
 * AC-5: setShowScanCompleteModal(false) removed from save handler
 * AC-6: Local saving flag set before onSaveWithLearning is called
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Transaction } from '@/types/transaction';
import { TransactionEditorScanStatus } from '@features/transaction-editor/views/TransactionEditorScanStatus';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('@shared/stores', () => ({
  useWorkflowIsProcessing: () => false,
  useWorkflowActiveDialog: () => null,
}));

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// Mock ScanCompleteModal to expose props as data attributes for assertion.
// ProcessingOverlay is mocked to null to avoid its dependency tree.
vi.mock('@features/scan/components', () => ({
  ProcessingOverlay: () => null,
  ScanCompleteModal: (props: {
    visible: boolean;
    isSaving: boolean;
    onSave: () => void;
    onEdit: () => void;
    onDismiss?: () => void;
    transaction: Transaction | null;
  }) => {
    if (!props.visible) return null;
    return (
      <div
        data-testid="scan-complete-modal"
        data-is-saving={String(props.isSaving)}
      >
        <button data-testid="save-btn" onClick={props.onSave}>
          Save
        </button>
        <button data-testid="edit-btn" onClick={props.onEdit}>
          Edit
        </button>
        {props.isSaving && <span data-testid="spinner">Saving...</span>}
      </div>
    );
  },
}));

// =============================================================================
// Test helpers
// =============================================================================

const mockTransaction: Transaction = {
  id: 'tx-test-001',
  merchant: 'Test Merchant',
  total: 5000,
  currency: 'CLP',
  date: '2026-03-14',
  time: '10:00',
  items: [],
  category: 'grocery',
  storeCategory: 'grocery',
};

function buildProps(overrides: Partial<Parameters<typeof TransactionEditorScanStatus>[0]> = {}) {
  return {
    scanButtonState: 'idle' as const,
    isProcessing: false,
    processingEta: null,
    skipScanCompleteModal: false,
    transaction: mockTransaction,
    mode: 'new' as const,
    onSaveWithLearning: vi.fn().mockResolvedValue(undefined),
    theme: 'light' as const,
    t: (key: string) => key,
    formatCurrency: (amount: number, _currency: string) => `$${amount}`,
    currency: 'CLP',
    lang: 'es' as const,
    isSaving: false,
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('TransactionEditorScanStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Task 2.1 — save path: modal stays visible with spinner while saving', () => {
    it('shows the modal after scan transitions to complete', () => {
      const props = buildProps({ scanButtonState: 'idle' });
      const { rerender } = render(<TransactionEditorScanStatus {...props} />);

      // Modal should NOT be visible on initial idle state
      expect(screen.queryByTestId('scan-complete-modal')).not.toBeInTheDocument();

      // Transition to complete — useEffect fires on re-render
      rerender(<TransactionEditorScanStatus {...props} scanButtonState="complete" />);

      expect(screen.getByTestId('scan-complete-modal')).toBeInTheDocument();
    });

    it('modal remains visible and shows spinner when save button is clicked (AC-1, AC-3, AC-6)', async () => {
      // onSaveWithLearning never resolves during this test — simulates async save in-flight
      let resolveSave!: () => void;
      const hangingSave = new Promise<void>((resolve) => {
        resolveSave = resolve;
      });
      const onSaveWithLearning = vi.fn().mockReturnValue(hangingSave);

      const props = buildProps({ scanButtonState: 'idle', onSaveWithLearning });
      const { rerender } = render(<TransactionEditorScanStatus {...props} />);

      // Trigger modal by transitioning to complete
      rerender(<TransactionEditorScanStatus {...props} scanButtonState="complete" />);

      // Confirm modal is visible before clicking save
      expect(screen.getByTestId('scan-complete-modal')).toBeInTheDocument();

      // Click save
      fireEvent.click(screen.getByTestId('save-btn'));

      // AC-6: onSaveWithLearning must have been called
      expect(onSaveWithLearning).toHaveBeenCalledTimes(1);

      // AC-1: modal is still visible (not unmounted/hidden) — no editor flash (AC-3)
      expect(screen.getByTestId('scan-complete-modal')).toBeInTheDocument();

      // AC-1: spinner is shown because isSaving local state is true
      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      // AC-1: data-is-saving attribute confirms the prop was set to true
      expect(screen.getByTestId('scan-complete-modal')).toHaveAttribute(
        'data-is-saving',
        'true'
      );

      // Cleanup: resolve the hanging promise so no unhandled rejection
      resolveSave();
      await waitFor(() => expect(onSaveWithLearning).toHaveBeenCalledTimes(1));
    });
  });

  describe('Task 2.2 — edit path: modal closes, save is NOT called', () => {
    it('hides modal when edit button is clicked (AC-4)', async () => {
      const onSaveWithLearning = vi.fn().mockResolvedValue(undefined);
      const props = buildProps({ scanButtonState: 'idle', onSaveWithLearning });
      const { rerender } = render(<TransactionEditorScanStatus {...props} />);

      // Trigger modal
      rerender(<TransactionEditorScanStatus {...props} scanButtonState="complete" />);
      expect(screen.getByTestId('scan-complete-modal')).toBeInTheDocument();

      // Click edit
      fireEvent.click(screen.getByTestId('edit-btn'));

      // Modal should be gone
      await waitFor(() =>
        expect(screen.queryByTestId('scan-complete-modal')).not.toBeInTheDocument()
      );

      // onSaveWithLearning must NOT have been called
      expect(onSaveWithLearning).not.toHaveBeenCalled();
    });
  });
});
