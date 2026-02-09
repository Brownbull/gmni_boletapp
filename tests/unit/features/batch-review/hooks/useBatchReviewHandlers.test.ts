/**
 * Story 14e-29a: useBatchReviewHandlers Hook Tests
 *
 * Tests for the consolidated batch review handlers hook.
 * Covers all handler functions extracted from handlers/ directory.
 *
 * AC4: Tests for hook functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBatchReviewHandlers } from '../../../../../src/features/batch-review/hooks/useBatchReviewHandlers';
import type { BatchReviewHandlersProps } from '../../../../../src/features/batch-review/hooks/useBatchReviewHandlers';
import type { User } from 'firebase/auth';
import type { Transaction } from '../../../../../src/types/transaction';
import type { BatchReceipt } from '../../../../../src/types/batchReceipt';
import type { ScanState, ScanDialogType } from '../../../../../src/types/scanStateMachine';
import { DIALOG_TYPES } from '../../../../../src/types/scanStateMachine';

// =============================================================================
// Mocks
// =============================================================================

// Mock store actions - use vi.hoisted to define mocks before they're used
const { mockBatchReviewActions, mockScanStoreActions, mockBatchReviewStoreState, mockScanStoreImages } = vi.hoisted(() => ({
  mockBatchReviewActions: {
    startEditing: vi.fn(),
    reset: vi.fn(),
    loadBatch: vi.fn(),
  },
  mockScanStoreActions: {
    processStart: vi.fn(),
    batchItemStart: vi.fn(),
    batchItemSuccess: vi.fn(),
    batchItemError: vi.fn(),
    batchComplete: vi.fn(),
    // Story 14e-34a: Add images and setImages for single source of truth
    images: ['image1.jpg', 'image2.jpg'],
    setImages: vi.fn(),
  },
  // Story 14e-33: Mock store state for handleBack
  mockBatchReviewStoreState: {
    items: [] as unknown[],
  },
  // Story 14e-34a: Mutable images array for test manipulation
  mockScanStoreImages: {
    current: ['image1.jpg', 'image2.jpg'],
  },
}));

vi.mock('../../../../../src/features/batch-review/store', () => ({
  batchReviewActions: mockBatchReviewActions,
  // Story 14e-33: Mock useBatchReviewStore for handleBack to check items
  useBatchReviewStore: {
    getState: () => mockBatchReviewStoreState,
  },
}));

// Mock scan store
// Story 14e-34a: Include images and setImages for single source of truth
vi.mock('../../../../../src/features/scan/store', () => ({
  useScanStore: () => ({
    ...mockScanStoreActions,
    // Story 14e-34a: Return current images from mutable reference
    images: mockScanStoreImages.current,
    setImages: mockScanStoreActions.setImages,
  }),
}));

// Mock createBatchReceiptsFromResults
vi.mock('../../../../../src/hooks/useBatchReview', () => ({
  createBatchReceiptsFromResults: vi.fn().mockReturnValue([]),
}));

// Mock Firestore services
vi.mock('../../../../../src/services/firestore', () => ({
  addTransaction: vi.fn().mockResolvedValue('new-tx-id'),
}));

vi.mock('../../../../../src/services/categoryMappingService', () => ({
  incrementMappingUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../../../src/services/merchantMappingService', () => ({
  incrementMerchantMappingUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../../../src/services/itemNameMappingService', () => ({
  incrementItemNameMappingUsage: vi.fn().mockResolvedValue(undefined),
}));

// =============================================================================
// Test Helpers
// =============================================================================

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    ...overrides,
  } as User;
}

function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-tx-1',
    date: '2026-01-28',
    merchant: 'Test Merchant',
    category: 'Supermarket',
    total: 1000,
    items: [{ name: 'Test Item', price: 1000, qty: 1 }],
    currency: 'CLP',
    ...overrides,
  };
}

function createMockBatchReceipts(count: number = 3): BatchReceipt[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `receipt-${i}`,
    index: i,
    transaction: createMockTransaction({
      id: `tx-${i}`,
      merchant: `Store ${i}`,
      total: (i + 1) * 1000,
    }),
    status: 'ready' as const,
    confidence: 0.9,
    imageUrl: i === 1 ? 'https://example.com/image1.jpg' : undefined,
  })) as BatchReceipt[];
}

function createMockScanState(overrides: Partial<ScanState> = {}): ScanState {
  return {
    phase: 'reviewing',
    mode: 'batch',
    requestId: 'test-request',
    userId: 'test-user',
    startedAt: Date.now(),
    images: [],
    results: [],
    activeResultIndex: 0,
    creditStatus: 'confirmed',
    creditType: 'super',
    creditsCount: 1,
    activeDialog: null,
    error: null,
    batchProgress: null,
    batchReceipts: null,
    batchEditingIndex: null,
    storeType: null,
    currency: null,
    ...overrides,
  };
}

function createMockProps(overrides: Partial<BatchReviewHandlersProps> = {}): BatchReviewHandlersProps {
  return {
    user: createMockUser(),
    services: {
      db: {} as never,
      auth: {} as never,
      appId: 'test-app-id',
    },
    scanState: createMockScanState(),
    setBatchEditingIndexContext: vi.fn(),
    setCurrentTransaction: vi.fn(),
    setTransactionEditorMode: vi.fn(),
    navigateToView: vi.fn(),
    setView: vi.fn(),
    // Story 14e-34a: setBatchImages removed - now uses useScanStore.setImages directly
    batchProcessing: {
      reset: vi.fn(),
    },
    resetScanContext: vi.fn(),
    showScanDialog: vi.fn(),
    dismissScanDialog: vi.fn(),
    mappings: [],
    applyCategoryMappings: vi.fn().mockReturnValue({
      transaction: createMockTransaction(),
      appliedMappingIds: [],
    }),
    findMerchantMatch: vi.fn().mockReturnValue(null),
    applyItemNameMappings: vi.fn().mockReturnValue({
      transaction: createMockTransaction(),
      appliedIds: [],
    }),
    userCredits: {
      remaining: 10,
      used: 0,
      superRemaining: 5,
      superUsed: 0,
    },
    checkCreditSufficiency: vi.fn().mockReturnValue({
      sufficient: true,
      available: 5,
      required: 1,
      remaining: 4,
      shortage: 0,
      maxProcessable: 5,
      creditType: 'super' as const,
    }),
    setCreditCheckResult: vi.fn(),
    setShowCreditWarning: vi.fn(),
    // Story 14e-29b: Processing handler dependencies
    setShowBatchPreview: vi.fn(),
    setShouldTriggerCreditCheck: vi.fn(),
    // Story 14e-34a: batchImages removed - now uses useScanStore.images directly
    scanCurrency: 'CLP',
    scanStoreType: 'auto',
    batchProcessingExtended: {
      reset: vi.fn(),
      startProcessing: vi.fn().mockResolvedValue([]),
    },
    setScanImages: vi.fn(),
    ...overrides,
  };
}

// =============================================================================
// Tests: Hook Initialization
// =============================================================================

describe('useBatchReviewHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Story 14e-33: Reset mock store state
    mockBatchReviewStoreState.items = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hook initialization', () => {
    it('should return all handler functions', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      // Navigation handlers
      expect(result.current.handlePrevious).toBeInstanceOf(Function);
      expect(result.current.handleNext).toBeInstanceOf(Function);

      // Edit handler
      expect(result.current.handleEditReceipt).toBeInstanceOf(Function);

      // Save handlers
      expect(result.current.handleSaveTransaction).toBeInstanceOf(Function);
      expect(result.current.handleSaveComplete).toBeInstanceOf(Function);

      // Discard handlers
      expect(result.current.handleBack).toBeInstanceOf(Function);
      expect(result.current.handleDiscardConfirm).toBeInstanceOf(Function);
      expect(result.current.handleDiscardCancel).toBeInstanceOf(Function);

      // Credit check handler
      expect(result.current.handleCreditCheckComplete).toBeInstanceOf(Function);

      // Stub handlers
      expect(result.current.handleCancelPreview).toBeInstanceOf(Function);
      expect(result.current.handleConfirmWithCreditCheck).toBeInstanceOf(Function);
      expect(result.current.handleProcessingStart).toBeInstanceOf(Function);
      expect(result.current.handleRemoveImage).toBeInstanceOf(Function);
      expect(result.current.handleReduceBatch).toBeInstanceOf(Function);
    });
  });

  // ===========================================================================
  // Tests: Navigation Handlers
  // ===========================================================================

  describe('handlePrevious', () => {
    it('should return early if no batch receipts', () => {
      const props = createMockProps({
        scanState: createMockScanState({ batchReceipts: null, batchEditingIndex: 1 }),
      });
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handlePrevious();
      });

      expect(props.setBatchEditingIndexContext).not.toHaveBeenCalled();
      expect(props.setCurrentTransaction).not.toHaveBeenCalled();
    });

    it('should return early if batchEditingIndex is null', () => {
      const props = createMockProps({
        scanState: createMockScanState({
          batchReceipts: createMockBatchReceipts(3),
          batchEditingIndex: null,
        }),
      });
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handlePrevious();
      });

      expect(props.setBatchEditingIndexContext).not.toHaveBeenCalled();
    });

    it('should return early if at first receipt (index 0)', () => {
      const props = createMockProps({
        scanState: createMockScanState({
          batchReceipts: createMockBatchReceipts(3),
          batchEditingIndex: 0,
        }),
      });
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handlePrevious();
      });

      expect(props.setBatchEditingIndexContext).not.toHaveBeenCalled();
    });

    it('should navigate from index 1 to index 0', () => {
      const batchReceipts = createMockBatchReceipts(3);
      const props = createMockProps({
        scanState: createMockScanState({
          batchReceipts,
          batchEditingIndex: 1,
        }),
      });
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handlePrevious();
      });

      expect(props.setBatchEditingIndexContext).toHaveBeenCalledWith(0);
      expect(props.setCurrentTransaction).toHaveBeenCalled();
    });
  });

  describe('handleNext', () => {
    it('should return early if no batch receipts', () => {
      const props = createMockProps({
        scanState: createMockScanState({ batchReceipts: null, batchEditingIndex: 0 }),
      });
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleNext();
      });

      expect(props.setBatchEditingIndexContext).not.toHaveBeenCalled();
    });

    it('should return early if at last receipt', () => {
      const props = createMockProps({
        scanState: createMockScanState({
          batchReceipts: createMockBatchReceipts(3),
          batchEditingIndex: 2,
        }),
      });
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleNext();
      });

      expect(props.setBatchEditingIndexContext).not.toHaveBeenCalled();
    });

    it('should navigate from index 0 to index 1', () => {
      const batchReceipts = createMockBatchReceipts(3);
      const props = createMockProps({
        scanState: createMockScanState({
          batchReceipts,
          batchEditingIndex: 0,
        }),
      });
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleNext();
      });

      expect(props.setBatchEditingIndexContext).toHaveBeenCalledWith(1);
      expect(props.setCurrentTransaction).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Tests: Edit Handler
  // ===========================================================================

  describe('handleEditReceipt', () => {
    it('should call store startEditing with receipt id', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));
      const receipt = createMockBatchReceipts(1)[0];

      act(() => {
        result.current.handleEditReceipt(receipt, 1);
      });

      expect(mockBatchReviewActions.startEditing).toHaveBeenCalledWith('receipt-0');
    });

    it('should convert 1-based UI index to 0-based', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));
      const receipt = createMockBatchReceipts(1)[0];

      act(() => {
        result.current.handleEditReceipt(receipt, 3); // 1-based
      });

      expect(props.setBatchEditingIndexContext).toHaveBeenCalledWith(2); // 0-based
    });

    it('should set current transaction and navigate', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));
      const receipt = createMockBatchReceipts(1)[0];

      act(() => {
        result.current.handleEditReceipt(receipt, 1);
      });

      expect(props.setCurrentTransaction).toHaveBeenCalled();
      expect(props.setTransactionEditorMode).toHaveBeenCalledWith('existing');
      expect(props.navigateToView).toHaveBeenCalledWith('transaction-editor');
    });
  });

  // ===========================================================================
  // Tests: Save Handlers
  // ===========================================================================

  describe('handleSaveTransaction', () => {
    it('should throw error if not authenticated', async () => {
      const props = createMockProps({ user: null });
      const { result } = renderHook(() => useBatchReviewHandlers(props));
      const transaction = createMockTransaction();

      await expect(result.current.handleSaveTransaction(transaction)).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should throw error if no services', async () => {
      const props = createMockProps({ services: null });
      const { result } = renderHook(() => useBatchReviewHandlers(props));
      const transaction = createMockTransaction();

      await expect(result.current.handleSaveTransaction(transaction)).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should apply category mappings', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));
      const transaction = createMockTransaction();

      await act(async () => {
        await result.current.handleSaveTransaction(transaction);
      });

      expect(props.applyCategoryMappings).toHaveBeenCalledWith(transaction, props.mappings);
    });

    it('should return transaction ID on success', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));
      const transaction = createMockTransaction();

      let txId: string | undefined;
      await act(async () => {
        txId = await result.current.handleSaveTransaction(transaction);
      });

      expect(txId).toBe('new-tx-id');
    });
  });

  describe('handleSaveComplete', () => {
    it('should reset batch state', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));
      const transactions = [createMockTransaction()];

      act(() => {
        result.current.handleSaveComplete(transactions);
      });

      // Story 14e-34a: Check store action instead of prop
      expect(mockScanStoreActions.setImages).toHaveBeenCalledWith([]);
      expect(props.batchProcessing.reset).toHaveBeenCalled();
      expect(props.resetScanContext).toHaveBeenCalled();
    });

    it('should show BATCH_COMPLETE dialog if transactions exist', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));
      const transactions = [createMockTransaction()];

      act(() => {
        result.current.handleSaveComplete(transactions);
      });

      expect(props.showScanDialog).toHaveBeenCalledWith(
        DIALOG_TYPES.BATCH_COMPLETE,
        expect.objectContaining({
          transactions,
          creditsUsed: 1,
        })
      );
    });

    it('should not show dialog if no transactions', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleSaveComplete([]);
      });

      expect(props.showScanDialog).not.toHaveBeenCalled();
    });

    it('should navigate to dashboard', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleSaveComplete([]);
      });

      expect(props.setView).toHaveBeenCalledWith('dashboard');
    });
  });

  // ===========================================================================
  // Tests: Discard Handlers
  // ===========================================================================

  describe('handleBack', () => {
    it('should show BATCH_DISCARD dialog if items exist in store', () => {
      // Story 14e-33: handleBack now checks Zustand store items instead of scanState.batchReceipts
      mockBatchReviewStoreState.items = createMockBatchReceipts(3);
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleBack();
      });

      expect(props.showScanDialog).toHaveBeenCalledWith(DIALOG_TYPES.BATCH_DISCARD, {});
    });

    it('should navigate directly if no items in store', () => {
      // Story 14e-33: handleBack now checks Zustand store items instead of scanState.batchReceipts
      mockBatchReviewStoreState.items = [];
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleBack();
      });

      expect(props.showScanDialog).not.toHaveBeenCalled();
      // Story 14e-34a: Check store action instead of prop
      expect(mockScanStoreActions.setImages).toHaveBeenCalledWith([]);
      expect(props.resetScanContext).toHaveBeenCalled();
      expect(mockBatchReviewActions.reset).toHaveBeenCalled();
      expect(props.setView).toHaveBeenCalledWith('dashboard');
    });
  });

  describe('handleDiscardConfirm', () => {
    it('should dismiss dialog and reset state', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleDiscardConfirm();
      });

      expect(props.dismissScanDialog).toHaveBeenCalled();
      // Story 14e-34a: Check store action instead of prop
      expect(mockScanStoreActions.setImages).toHaveBeenCalledWith([]);
      expect(props.batchProcessing.reset).toHaveBeenCalled();
      expect(props.resetScanContext).toHaveBeenCalled();
      expect(mockBatchReviewActions.reset).toHaveBeenCalled();
      expect(props.setView).toHaveBeenCalledWith('dashboard');
    });
  });

  describe('handleDiscardCancel', () => {
    it('should only dismiss dialog', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleDiscardCancel();
      });

      expect(props.dismissScanDialog).toHaveBeenCalled();
      // Story 14e-34a: Check store action instead of prop
      expect(mockScanStoreActions.setImages).not.toHaveBeenCalled();
      expect(props.resetScanContext).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Tests: Credit Check Handler
  // ===========================================================================

  describe('handleCreditCheckComplete', () => {
    it('should check credit sufficiency for batch (1 super credit)', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleCreditCheckComplete();
      });

      expect(props.checkCreditSufficiency).toHaveBeenCalledWith(
        props.userCredits,
        1, // Batch uses 1 credit
        true // isSuper
      );
    });

    it('should store result and show warning', () => {
      const mockResult = {
        sufficient: true,
        available: 5,
        required: 1,
        remaining: 4,
        shortage: 0,
        maxProcessable: 5,
        creditType: 'super' as const,
      };
      const props = createMockProps({
        checkCreditSufficiency: vi.fn().mockReturnValue(mockResult),
      });
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleCreditCheckComplete();
      });

      expect(props.setCreditCheckResult).toHaveBeenCalledWith(mockResult);
      expect(props.setShowCreditWarning).toHaveBeenCalledWith(true);
    });
  });

  // ===========================================================================
  // Tests: Story 14e-29b Processing Handlers
  // ===========================================================================

  describe('handleCancelPreview', () => {
    it('should hide batch preview and clear images', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleCancelPreview();
      });

      expect(props.setShowBatchPreview).toHaveBeenCalledWith(false);
      // Story 14e-34a: Check store action instead of prop
      expect(mockScanStoreActions.setImages).toHaveBeenCalledWith([]);
    });
  });

  describe('handleConfirmWithCreditCheck', () => {
    it('should trigger credit check via setShouldTriggerCreditCheck', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleConfirmWithCreditCheck();
      });

      expect(props.setShouldTriggerCreditCheck).toHaveBeenCalledWith(true);
    });
  });

  describe('handleProcessingStart', () => {
    it('should hide preview and navigate to batch-review', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      await act(async () => {
        await result.current.handleProcessingStart();
      });

      expect(props.setShowBatchPreview).toHaveBeenCalledWith(false);
      expect(props.setView).toHaveBeenCalledWith('batch-review');
    });

    it('should dispatch processStart to scan store', async () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      await act(async () => {
        await result.current.handleProcessingStart();
      });

      expect(mockScanStoreActions.processStart).toHaveBeenCalledWith('super', 1);
    });

    it('should call startProcessing with correct params', async () => {
      // Story 14e-34a: Set mock store images instead of props
      mockScanStoreImages.current = ['img1.jpg', 'img2.jpg'];
      const props = createMockProps({
        scanCurrency: 'USD',
        scanStoreType: 'supermarket',
      });
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      await act(async () => {
        await result.current.handleProcessingStart();
      });

      expect(props.batchProcessingExtended.startProcessing).toHaveBeenCalledWith(
        ['img1.jpg', 'img2.jpg'],
        'USD',
        'supermarket',
        expect.objectContaining({
          onItemStart: expect.any(Function),
          onItemSuccess: expect.any(Function),
          onItemError: expect.any(Function),
          onComplete: expect.any(Function),
        })
      );
    });

    it('should not pass receiptType when scanStoreType is auto', async () => {
      const props = createMockProps({
        scanStoreType: 'auto',
      });
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      await act(async () => {
        await result.current.handleProcessingStart();
      });

      expect(props.batchProcessingExtended.startProcessing).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(String),
        undefined, // receiptType should be undefined for 'auto'
        expect.any(Object)
      );
    });

    it('should reset state and navigate to dashboard on processing error', async () => {
      const props = createMockProps({
        batchProcessingExtended: {
          reset: vi.fn(),
          startProcessing: vi.fn().mockRejectedValue(new Error('Processing failed')),
        },
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      await act(async () => {
        await result.current.handleProcessingStart();
      });

      // Should log the error
      expect(consoleSpy).toHaveBeenCalledWith(
        '[useBatchReviewHandlers] Batch processing failed:',
        expect.any(Error)
      );
      // Should reset state and navigate to dashboard
      expect(props.batchProcessing.reset).toHaveBeenCalled();
      expect(props.resetScanContext).toHaveBeenCalled();
      expect(mockBatchReviewActions.reset).toHaveBeenCalled();
      expect(props.setView).toHaveBeenCalledWith('dashboard');

      consoleSpy.mockRestore();
    });
  });

  describe('handleRemoveImage', () => {
    it('should remove image at specified index', () => {
      // Story 14e-34a: Set mock store images instead of props
      mockScanStoreImages.current = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleRemoveImage(1);
      });

      // Story 14e-34a: Check store action instead of prop
      expect(mockScanStoreActions.setImages).toHaveBeenCalledWith(['img1.jpg', 'img3.jpg']);
    });

    it('should switch to single mode when one image left', () => {
      // Story 14e-34a: Set mock store images instead of props
      mockScanStoreImages.current = ['img1.jpg', 'img2.jpg'];
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleRemoveImage(0);
      });

      expect(props.setShowBatchPreview).toHaveBeenCalledWith(false);
      expect(props.setScanImages).toHaveBeenCalledWith(['img2.jpg']);
      expect(props.setTransactionEditorMode).toHaveBeenCalledWith('new');
      expect(props.navigateToView).toHaveBeenCalledWith('transaction-editor');
    });

    it('should not switch mode when more than one image left', () => {
      // Story 14e-34a: Set mock store images instead of props
      mockScanStoreImages.current = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      act(() => {
        result.current.handleRemoveImage(0);
      });

      expect(props.setShowBatchPreview).not.toHaveBeenCalled();
      expect(props.setScanImages).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Tests: Stub Handlers (14e-29c)
  // ===========================================================================

  describe('handleReduceBatch (stub)', () => {
    it('should be a no-op stub handler (14e-29c will implement)', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useBatchReviewHandlers(props));

      // Should not throw when called - just a no-op for now
      expect(() => {
        act(() => {
          result.current.handleReduceBatch(3);
        });
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // Tests: Handler Stability
  // ===========================================================================

  describe('handler stability', () => {
    it('should return stable handler references across re-renders', () => {
      const props = createMockProps();
      const { result, rerender } = renderHook(() => useBatchReviewHandlers(props));

      const firstRender = {
        // Navigation handlers
        handlePrevious: result.current.handlePrevious,
        handleNext: result.current.handleNext,
        // Edit handler
        handleEditReceipt: result.current.handleEditReceipt,
        // Discard handlers
        handleBack: result.current.handleBack,
        handleDiscardConfirm: result.current.handleDiscardConfirm,
        handleDiscardCancel: result.current.handleDiscardCancel,
        // Save handlers
        handleSaveTransaction: result.current.handleSaveTransaction,
        handleSaveComplete: result.current.handleSaveComplete,
        // Credit check handler
        handleCreditCheckComplete: result.current.handleCreditCheckComplete,
        // Story 14e-29b: Processing & navigation handlers
        handleCancelPreview: result.current.handleCancelPreview,
        handleConfirmWithCreditCheck: result.current.handleConfirmWithCreditCheck,
        handleProcessingStart: result.current.handleProcessingStart,
        handleRemoveImage: result.current.handleRemoveImage,
        // Stub handler
        handleReduceBatch: result.current.handleReduceBatch,
      };

      rerender();

      // Handlers should be stable due to useCallback
      expect(result.current.handlePrevious).toBe(firstRender.handlePrevious);
      expect(result.current.handleNext).toBe(firstRender.handleNext);
      expect(result.current.handleEditReceipt).toBe(firstRender.handleEditReceipt);
      expect(result.current.handleBack).toBe(firstRender.handleBack);
      expect(result.current.handleDiscardConfirm).toBe(firstRender.handleDiscardConfirm);
      expect(result.current.handleDiscardCancel).toBe(firstRender.handleDiscardCancel);
      expect(result.current.handleSaveTransaction).toBe(firstRender.handleSaveTransaction);
      expect(result.current.handleSaveComplete).toBe(firstRender.handleSaveComplete);
      expect(result.current.handleCreditCheckComplete).toBe(firstRender.handleCreditCheckComplete);
      // Story 14e-29b handlers
      expect(result.current.handleCancelPreview).toBe(firstRender.handleCancelPreview);
      expect(result.current.handleConfirmWithCreditCheck).toBe(firstRender.handleConfirmWithCreditCheck);
      expect(result.current.handleProcessingStart).toBe(firstRender.handleProcessingStart);
      expect(result.current.handleRemoveImage).toBe(firstRender.handleRemoveImage);
      expect(result.current.handleReduceBatch).toBe(firstRender.handleReduceBatch);
    });
  });
});
