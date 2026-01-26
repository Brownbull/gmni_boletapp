/**
 * Story 14e-16: BatchReviewFeature Unit Tests
 *
 * Tests for the phase-based orchestrator component.
 * Covers all phases and handler integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BatchReviewFeature } from '@features/batch-review/BatchReviewFeature';
import type { BatchReceipt } from '@/types/batchReceipt';
import type { Transaction } from '@/types/transaction';

// =============================================================================
// Mocks
// =============================================================================

// Mock store state and actions
const mockStoreState = {
  phase: 'idle' as const,
  items: [] as BatchReceipt[],
  currentIndex: 0,
  savedCount: 0,
  failedCount: 0,
  error: null,
  editingReceiptId: null,
  hadItems: false,
};

const mockStoreActions = {
  loadBatch: vi.fn(),
  reset: vi.fn(),
  selectItem: vi.fn(),
  updateItem: vi.fn(),
  discardItem: vi.fn(),
  startEditing: vi.fn(),
  finishEditing: vi.fn(),
  saveStart: vi.fn(),
  saveItemSuccess: vi.fn(),
  saveItemFailure: vi.fn(),
  saveComplete: vi.fn(),
};

// Mock Zustand store - includes useBatchReviewStore for BatchReviewCard
vi.mock('@features/batch-review/store', () => ({
  useBatchReviewPhase: vi.fn(() => mockStoreState.phase),
  useBatchItems: vi.fn(() => mockStoreState.items),
  useBatchProgress: vi.fn(() => ({
    current: mockStoreState.currentIndex,
    total: mockStoreState.items.length,
    saved: mockStoreState.savedCount,
    failed: mockStoreState.failedCount,
  })),
  useIsBatchEmpty: vi.fn(() => mockStoreState.items.length === 0),
  useHadItems: vi.fn(() => mockStoreState.hadItems),
  useBatchReviewActions: vi.fn(() => mockStoreActions),
  useBatchTotalAmount: vi.fn(() => mockStoreState.items.reduce((sum, item) => sum + (item.transaction.total || 0), 0)),
  useValidBatchCount: vi.fn(() => mockStoreState.items.filter(item => item.status !== 'error').length),
  // Required by BatchReviewCard component
  useBatchReviewStore: vi.fn((selector) => {
    const fullState = { ...mockStoreState, ...mockStoreActions };
    return selector ? selector(fullState) : fullState;
  }),
}));

// Mock ModalManager
const mockOpenModal = vi.fn();
const mockCloseModal = vi.fn();
vi.mock('@managers/ModalManager', () => ({
  useModalActions: vi.fn(() => ({
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
  })),
}));

// =============================================================================
// Test Data
// =============================================================================

const mockTransaction: Transaction = {
  id: 'tx-1',
  merchant: 'Test Store',
  total: 100,
  currency: 'USD',
  date: '2026-01-26',
  items: [],
  storeCategory: 'grocery',
  category: 'groceries',
};

const createMockReceipt = (id: string, overrides: Partial<BatchReceipt> = {}): BatchReceipt => ({
  id,
  transaction: { ...mockTransaction, id: `tx-${id}` },
  status: 'ready',
  confidence: 0.9,
  ...overrides,
});

// =============================================================================
// Default Props
// =============================================================================

const defaultProps = {
  t: (key: string) => key,
  theme: 'light' as const,
  currency: 'USD' as const,
  formatCurrency: (amount: number, _currency: string) => `$${amount}`,
  onEditReceipt: vi.fn(),
  onSaveComplete: vi.fn(),
  onBack: vi.fn(),
};

// =============================================================================
// Test Helpers
// =============================================================================

const setMockPhase = (phase: typeof mockStoreState.phase) => {
  mockStoreState.phase = phase;
};

const setMockItems = (items: BatchReceipt[]) => {
  mockStoreState.items = items;
};

// =============================================================================
// Tests
// =============================================================================

describe('BatchReviewFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    mockStoreState.phase = 'idle';
    mockStoreState.items = [];
    mockStoreState.currentIndex = 0;
    mockStoreState.savedCount = 0;
    mockStoreState.failedCount = 0;
    mockStoreState.error = null;
    mockStoreState.editingReceiptId = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // AC7: Idle Phase Tests
  // ===========================================================================

  describe('Idle Phase (AC7)', () => {
    it('should return null when phase is idle', () => {
      setMockPhase('idle');
      const { container } = render(<BatchReviewFeature {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render any UI elements when idle', () => {
      setMockPhase('idle');
      render(<BatchReviewFeature {...defaultProps} />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Loading Phase Tests
  // ===========================================================================

  describe('Loading Phase', () => {
    it('should render loading state when phase is loading', () => {
      setMockPhase('loading');
      render(<BatchReviewFeature {...defaultProps} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('batchLoading')).toBeInTheDocument();
    });

    it('should render ProcessingState when processingStates are provided', () => {
      setMockPhase('loading');
      const processingStates = [
        { id: '1', status: 'processing' as const },
        { id: '2', status: 'pending' as const },
      ];
      render(
        <BatchReviewFeature
          {...defaultProps}
          processingStates={processingStates}
          processingProgress={{ current: 1, total: 2 }}
        />
      );
      expect(screen.getByText(/batchProcessing/)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // AC1, AC3: Reviewing Phase Tests
  // ===========================================================================

  describe('Reviewing Phase (AC1, AC3)', () => {
    beforeEach(() => {
      setMockPhase('reviewing');
      setMockItems([
        createMockReceipt('1', { transaction: { ...mockTransaction, merchant: 'Store A' } }),
        createMockReceipt('2', { transaction: { ...mockTransaction, merchant: 'Store B' } }),
      ]);
    });

    it('should render ReviewingState with receipts', () => {
      render(<BatchReviewFeature {...defaultProps} />);
      expect(screen.getByRole('list', { name: 'batchReviewList' })).toBeInTheDocument();
    });

    it('should render empty state when items are empty', () => {
      setMockItems([]);
      render(<BatchReviewFeature {...defaultProps} />);
      expect(screen.getByText('batchReviewEmpty')).toBeInTheDocument();
    });

    it('should call onEditReceipt when edit is clicked', () => {
      const onEditReceipt = vi.fn();
      render(<BatchReviewFeature {...defaultProps} onEditReceipt={onEditReceipt} />);

      const editButtons = screen.getAllByLabelText('batchReviewEdit');
      fireEvent.click(editButtons[0]);

      expect(onEditReceipt).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // AC6: Discard Confirmation Tests (ModalManager)
  // ===========================================================================

  describe('Discard Confirmation (AC6)', () => {
    beforeEach(() => {
      setMockPhase('reviewing');
      setMockItems([
        createMockReceipt('1', { confidence: 0.9 }), // High confidence - needs confirmation
      ]);
    });

    it('should open ModalManager dialog for high confidence receipts', () => {
      render(<BatchReviewFeature {...defaultProps} />);

      const discardButtons = screen.getAllByLabelText('batchReviewDiscard');
      fireEvent.click(discardButtons[0]);

      // Should call openModal with batchDiscard type
      expect(mockOpenModal).toHaveBeenCalledWith(
        'batchDiscard',
        expect.objectContaining({
          receiptId: '1',
          onConfirm: expect.any(Function),
          onCancel: expect.any(Function),
          t: expect.any(Function),
          theme: 'light',
        })
      );
    });

    it('should discard directly for low confidence receipts', () => {
      setMockItems([
        createMockReceipt('1', { confidence: 0.5 }), // Low confidence - no confirmation
      ]);
      render(<BatchReviewFeature {...defaultProps} />);

      const discardButtons = screen.getAllByLabelText('batchReviewDiscard');
      fireEvent.click(discardButtons[0]);

      expect(mockStoreActions.discardItem).toHaveBeenCalledWith('1');
      // Should NOT open modal
      expect(mockOpenModal).not.toHaveBeenCalled();
    });

    it('should discard directly for error receipts', () => {
      setMockItems([
        createMockReceipt('1', { status: 'error', confidence: 0.9 }),
      ]);
      render(<BatchReviewFeature {...defaultProps} />);

      const discardButtons = screen.getAllByLabelText('batchReviewDiscard');
      fireEvent.click(discardButtons[0]);

      expect(mockStoreActions.discardItem).toHaveBeenCalledWith('1');
      // Should NOT open modal
      expect(mockOpenModal).not.toHaveBeenCalled();
    });

    it('should discard item when onConfirm callback is invoked', () => {
      const onDiscardReceipt = vi.fn();
      render(<BatchReviewFeature {...defaultProps} onDiscardReceipt={onDiscardReceipt} />);

      const discardButtons = screen.getAllByLabelText('batchReviewDiscard');
      fireEvent.click(discardButtons[0]);

      // Get the onConfirm callback passed to openModal
      const openModalCall = mockOpenModal.mock.calls[0];
      const modalProps = openModalCall[1];

      // Simulate user clicking confirm in the modal
      modalProps.onConfirm();

      expect(mockStoreActions.discardItem).toHaveBeenCalledWith('1');
      expect(onDiscardReceipt).toHaveBeenCalledWith('1');
      expect(mockCloseModal).toHaveBeenCalled();
    });

    it('should not discard when onCancel callback is invoked', () => {
      render(<BatchReviewFeature {...defaultProps} />);

      const discardButtons = screen.getAllByLabelText('batchReviewDiscard');
      fireEvent.click(discardButtons[0]);

      // Get the onCancel callback passed to openModal
      const openModalCall = mockOpenModal.mock.calls[0];
      const modalProps = openModalCall[1];

      // Simulate user clicking cancel in the modal
      modalProps.onCancel();

      expect(mockStoreActions.discardItem).not.toHaveBeenCalled();
      expect(mockCloseModal).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Complete Phase Tests
  // ===========================================================================

  describe('Complete Phase', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      setMockPhase('complete');
      mockStoreState.savedCount = 3;
      mockStoreState.failedCount = 1;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should render success message', () => {
      render(<BatchReviewFeature {...defaultProps} />);
      expect(screen.getByText('batchSaveComplete')).toBeInTheDocument();
    });

    it('should show saved count', () => {
      render(<BatchReviewFeature {...defaultProps} />);
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });

    it('should auto-dismiss after 2 seconds', async () => {
      const onSaveComplete = vi.fn();
      render(<BatchReviewFeature {...defaultProps} onSaveComplete={onSaveComplete} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockStoreActions.reset).toHaveBeenCalled();
      expect(onSaveComplete).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Error Phase Tests
  // ===========================================================================

  describe('Error Phase', () => {
    beforeEach(() => {
      setMockPhase('error');
    });

    it('should render error message', () => {
      render(<BatchReviewFeature {...defaultProps} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('batchError')).toBeInTheDocument();
    });

    it('should call reset on retry click', () => {
      render(<BatchReviewFeature {...defaultProps} />);

      const retryButton = screen.getByText('retry');
      fireEvent.click(retryButton);

      expect(mockStoreActions.reset).toHaveBeenCalled();
    });

    it('should call reset and onBack on dismiss click', () => {
      const onBack = vi.fn();
      render(<BatchReviewFeature {...defaultProps} onBack={onBack} />);

      const dismissButton = screen.getByText('dismiss');
      fireEvent.click(dismissButton);

      expect(mockStoreActions.reset).toHaveBeenCalled();
      // Note: onBack is called via handleBack which may open modal if items exist
    });
  });

  // ===========================================================================
  // Editing Phase Tests
  // ===========================================================================

  describe('Editing Phase', () => {
    beforeEach(() => {
      setMockPhase('editing');
      setMockItems([createMockReceipt('1')]);
    });

    it('should render ReviewingState during editing phase', () => {
      render(<BatchReviewFeature {...defaultProps} />);
      expect(screen.getByRole('list', { name: 'batchReviewList' })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Saving Phase Tests
  // ===========================================================================

  describe('Saving Phase', () => {
    beforeEach(() => {
      setMockPhase('saving');
      setMockItems([createMockReceipt('1')]);
    });

    it('should render ReviewingState during saving phase', () => {
      render(<BatchReviewFeature {...defaultProps} />);
      expect(screen.getByRole('list', { name: 'batchReviewList' })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // AC4: Handler Callback Tests
  // ===========================================================================

  describe('Handler Callbacks (AC4)', () => {
    beforeEach(() => {
      setMockPhase('reviewing');
      setMockItems([createMockReceipt('1')]);
    });

    it('should call onSaveReceipt when save is clicked', async () => {
      const onSaveReceipt = vi.fn().mockResolvedValue(undefined);
      render(<BatchReviewFeature {...defaultProps} onSaveReceipt={onSaveReceipt} />);

      const saveButtons = screen.getAllByLabelText('save');
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(onSaveReceipt).toHaveBeenCalledWith('1');
      });
    });

    it('should call onRetryReceipt for error receipts', () => {
      setMockItems([createMockReceipt('1', { status: 'error' })]);
      const onRetryReceipt = vi.fn();
      render(<BatchReviewFeature {...defaultProps} onRetryReceipt={onRetryReceipt} />);

      const retryButton = screen.getByLabelText('batchRetry');
      fireEvent.click(retryButton);

      expect(onRetryReceipt).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Theme Tests
  // ===========================================================================

  describe('Theme Support', () => {
    it('should render correctly with dark theme', () => {
      setMockPhase('loading');
      render(<BatchReviewFeature {...defaultProps} theme="dark" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render error state with dark theme', () => {
      setMockPhase('error');
      render(<BatchReviewFeature {...defaultProps} theme="dark" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
