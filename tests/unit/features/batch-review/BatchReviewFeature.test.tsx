/**
 * Story 14e-16: BatchReviewFeature Unit Tests
 * Story 14e-29c: Updated to use handlersConfig and mock useBatchReviewHandlers
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
// Mocks - Use vi.hoisted to handle mock hoisting
// =============================================================================

// Use vi.hoisted to make these available to hoisted mocks
const { mockStoreState, mockStoreActions, mockHandlers, mockOpenModal, mockCloseModal, mockBatchReviewActions, mockAtomicActions } = vi.hoisted(() => ({
  mockStoreState: {
    phase: 'idle' as 'idle' | 'loading' | 'reviewing' | 'editing' | 'saving' | 'complete' | 'error',
    items: [] as BatchReceipt[],
    currentIndex: 0,
    savedCount: 0,
    failedCount: 0,
    error: null,
    editingReceiptId: null,
    hadItems: false,
  },
  mockStoreActions: {
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
  },
  mockBatchReviewActions: {
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
  },
  mockHandlers: {
    handleSaveTransaction: vi.fn().mockResolvedValue('saved-id'),
    handleSaveComplete: vi.fn(),
    handleBack: vi.fn(),
    handleDiscardConfirm: vi.fn(),
    handleDiscardCancel: vi.fn(),
    handleEditReceipt: vi.fn(),
    handlePrevious: vi.fn(),
    handleNext: vi.fn(),
    handleCreditCheckComplete: vi.fn(),
    handleCancelPreview: vi.fn(),
    handleConfirmBatch: vi.fn(),
    handleRemoveImage: vi.fn(),
  },
  mockOpenModal: vi.fn(),
  mockCloseModal: vi.fn(),
  // Story 14e-34b: Mock atomic batch actions
  mockAtomicActions: {
    discardReceiptAtomic: vi.fn(),
    updateReceiptAtomic: vi.fn(),
  },
}));

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
  useBatchTotalAmount: vi.fn(() => mockStoreState.items.reduce((sum: number, item: BatchReceipt) => sum + (item.transaction.total || 0), 0)),
  useValidBatchCount: vi.fn(() => mockStoreState.items.filter((item: BatchReceipt) => item.status !== 'error').length),
  // Required by BatchReviewCard component
  useBatchReviewStore: vi.fn((selector: any) => {
    const fullState = { ...mockStoreState, ...mockStoreActions };
    return selector ? selector(fullState) : fullState;
  }),
  // Story 14e-29c: batchReviewActions for direct imports
  batchReviewActions: mockBatchReviewActions,
}));

// Story 14e-29c: Mock useBatchReviewHandlers hook
// Story 14e-34b: Add useAtomicBatchActions mock
vi.mock('@features/batch-review/hooks', () => ({
  useBatchReviewHandlers: vi.fn(() => mockHandlers),
  useAtomicBatchActions: vi.fn(() => mockAtomicActions),
}));

// Mock ModalManager
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

// Story 14e-29c: Mock handlersConfig for useBatchReviewHandlers
const mockHandlersConfig = {
  user: { uid: 'test-user' } as any,
  services: { db: {} } as any,
  scanState: { batchReceipts: [] },
  setBatchEditingIndexContext: vi.fn(),
  setCurrentTransaction: vi.fn(),
  setTransactionEditorMode: vi.fn(),
  navigateToView: vi.fn(),
  setView: vi.fn(),
  setBatchImages: vi.fn(),
  batchProcessing: { isProcessing: false, states: [], progress: { current: 0, total: 0 }, cancel: vi.fn() } as any,
  resetScanContext: vi.fn(),
  showScanDialog: vi.fn(),
  dismissScanDialog: vi.fn(),
  mappings: { categories: [], merchants: {}, itemNames: {}, subcategories: {} } as any,
  applyCategoryMappings: vi.fn((tx: any) => tx),
  findMerchantMatch: vi.fn(() => null),
  applyItemNameMappings: vi.fn((tx: any) => tx),
  userCredits: { remaining: 10, used: 0, superRemaining: 5, superUsed: 0 },
  setShowBatchPreview: vi.fn(),
  setShouldTriggerCreditCheck: vi.fn(),
  batchImages: [],
  scanCurrency: 'USD',
  scanStoreType: 'grocery',
  viewMode: 'personal',
  activeGroup: null,
  batchProcessingExtended: { isProcessing: false, states: [], progress: { current: 0, total: 0 }, cancel: vi.fn() } as any,
  setScanImages: vi.fn(),
};

const defaultProps = {
  t: (key: string) => key,
  theme: 'light' as const,
  currency: 'USD' as const,
  formatCurrency: (amount: number, _currency: string) => `$${amount}`,
  handlersConfig: mockHandlersConfig,
  onRetryReceipt: vi.fn(),
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
      // Story 14e-29c: Now uses handleEditReceipt from useBatchReviewHandlers hook
      render(<BatchReviewFeature {...defaultProps} />);

      const editButtons = screen.getAllByLabelText('batchReviewEdit');
      fireEvent.click(editButtons[0]);

      // handleEditReceipt is called via the internal handler
      expect(mockHandlers.handleEditReceipt).toHaveBeenCalled();
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

      // Story 14e-34b: Now uses atomic discard action
      expect(mockAtomicActions.discardReceiptAtomic).toHaveBeenCalledWith('1');
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

      // Story 14e-34b: Now uses atomic discard action
      expect(mockAtomicActions.discardReceiptAtomic).toHaveBeenCalledWith('1');
      // Should NOT open modal
      expect(mockOpenModal).not.toHaveBeenCalled();
    });

    it('should discard item when onConfirm callback is invoked', () => {
      // Story 14e-29c: onDiscardReceipt prop removed - feature handles internally
      render(<BatchReviewFeature {...defaultProps} />);

      const discardButtons = screen.getAllByLabelText('batchReviewDiscard');
      fireEvent.click(discardButtons[0]);

      // Get the onConfirm callback passed to openModal
      const openModalCall = mockOpenModal.mock.calls[0];
      const modalProps = openModalCall[1];

      // Simulate user clicking confirm in the modal
      modalProps.onConfirm();

      // Story 14e-34b: Now uses atomic discard action
      expect(mockAtomicActions.discardReceiptAtomic).toHaveBeenCalledWith('1');
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

      // Story 14e-34b: Now uses atomic discard action
      expect(mockAtomicActions.discardReceiptAtomic).not.toHaveBeenCalled();
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
      // Story 14e-29c: handleSaveComplete is from the hook now
      render(<BatchReviewFeature {...defaultProps} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockStoreActions.reset).toHaveBeenCalled();
      // handleSaveComplete is called via the internal handler
      expect(mockHandlers.handleSaveComplete).toHaveBeenCalled();
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
      // Story 14e-29c: handleBack is from the hook now
      render(<BatchReviewFeature {...defaultProps} />);

      const dismissButton = screen.getByText('dismiss');
      fireEvent.click(dismissButton);

      expect(mockStoreActions.reset).toHaveBeenCalled();
      // handleBack is called via the internal handler
      expect(mockHandlers.handleBack).toHaveBeenCalled();
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
      // Story 14e-29c: handleSaveTransaction is from the hook now
      render(<BatchReviewFeature {...defaultProps} />);

      const saveButtons = screen.getAllByLabelText('save');
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        // handleSaveTransaction is called via the internal handleSaveReceipt
        expect(mockHandlers.handleSaveTransaction).toHaveBeenCalled();
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

  // ===========================================================================
  // Story 14e-33 AC3: Auto-Complete Discard Logic Tests
  // ===========================================================================

  describe('Auto-Complete Discard Logic (Story 14e-33 AC3)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should NOT call handleSaveComplete when all items are discarded (savedCount = 0)', () => {
      // Simulate: reviewing phase, had items, now empty, but nothing saved
      setMockPhase('reviewing');
      mockStoreState.items = []; // Empty
      mockStoreState.hadItems = true;
      mockStoreState.savedCount = 0; // Nothing was saved - all discarded

      render(<BatchReviewFeature {...defaultProps} />);

      // Should call handleBack (go home), NOT handleSaveComplete
      expect(mockBatchReviewActions.reset).toHaveBeenCalled();
      expect(mockHandlers.handleBack).toHaveBeenCalled();
      expect(mockHandlers.handleSaveComplete).not.toHaveBeenCalled();
    });

    it('should call handleSaveComplete when items were saved (savedCount > 0)', () => {
      // Simulate: reviewing phase, had items, now empty, some saved
      setMockPhase('reviewing');
      mockStoreState.items = []; // Empty
      mockStoreState.hadItems = true;
      mockStoreState.savedCount = 2; // 2 items were saved

      render(<BatchReviewFeature {...defaultProps} />);

      // Should call handleSaveComplete (show completion modal)
      expect(mockBatchReviewActions.reset).toHaveBeenCalled();
      expect(mockHandlers.handleSaveComplete).toHaveBeenCalled();
      expect(mockHandlers.handleBack).not.toHaveBeenCalled();
    });

    it('should not trigger auto-complete when batch still has items', () => {
      // Simulate: reviewing phase with items remaining
      setMockPhase('reviewing');
      setMockItems([createMockReceipt('1')]);
      mockStoreState.hadItems = true;
      mockStoreState.savedCount = 0;

      render(<BatchReviewFeature {...defaultProps} />);

      // Neither handleSaveComplete nor handleBack should be called
      expect(mockHandlers.handleSaveComplete).not.toHaveBeenCalled();
      expect(mockHandlers.handleBack).not.toHaveBeenCalled();
    });

    it('should auto-recover from stale state (empty items, hadItems=false)', () => {
      // Simulate: Stale state after localStorage clear
      // User is on batch-review but never had items (state was reset)
      setMockPhase('reviewing');
      mockStoreState.items = []; // Empty
      mockStoreState.hadItems = false; // Never had items (cleared state)
      mockStoreState.savedCount = 0;

      render(<BatchReviewFeature {...defaultProps} />);

      // Should auto-recover: reset and navigate back to dashboard
      expect(mockBatchReviewActions.reset).toHaveBeenCalled();
      expect(mockHandlers.handleBack).toHaveBeenCalled();
      expect(mockHandlers.handleSaveComplete).not.toHaveBeenCalled();
    });
  });
});
