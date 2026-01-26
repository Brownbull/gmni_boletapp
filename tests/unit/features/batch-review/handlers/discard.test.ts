/**
 * Story 14e-14c: Batch Discard Handlers Tests
 *
 * Tests for handleReviewBack, confirmDiscard, and cancelDiscard handlers.
 * Covers:
 * - AC2: Discard handlers extracted
 * - AC4: Unit tests for discard behavior
 *
 * Source: App.tsx lines 1904-1926 (handleBatchReviewBack, handleBatchDiscardConfirm, handleBatchDiscardCancel)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleReviewBack,
  confirmDiscard,
  cancelDiscard,
} from '@features/batch-review/handlers';
import type { DiscardContext } from '@features/batch-review/handlers';
import { DIALOG_TYPES } from '@/types/scanStateMachine';
import { batchReviewActions } from '@features/batch-review/store';

// Mock the batch review store
vi.mock('@features/batch-review/store', () => ({
  batchReviewActions: {
    reset: vi.fn(),
  },
}));

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a mock discard context for testing.
 */
function createMockContext(
  hasBatchReceipts: boolean = false
): {
  context: DiscardContext;
  mocks: {
    showScanDialog: ReturnType<typeof vi.fn>;
    dismissScanDialog: ReturnType<typeof vi.fn>;
    setBatchImages: ReturnType<typeof vi.fn>;
    batchProcessingReset: ReturnType<typeof vi.fn>;
    resetScanContext: ReturnType<typeof vi.fn>;
    setView: ReturnType<typeof vi.fn>;
  };
} {
  const mocks = {
    showScanDialog: vi.fn(),
    dismissScanDialog: vi.fn(),
    setBatchImages: vi.fn(),
    batchProcessingReset: vi.fn(),
    resetScanContext: vi.fn(),
    setView: vi.fn(),
  };

  return {
    context: {
      hasBatchReceipts,
      showScanDialog: mocks.showScanDialog,
      dismissScanDialog: mocks.dismissScanDialog,
      setBatchImages: mocks.setBatchImages,
      batchProcessing: { reset: mocks.batchProcessingReset },
      resetScanContext: mocks.resetScanContext,
      setView: mocks.setView,
    },
    mocks,
  };
}

// =============================================================================
// Tests: handleReviewBack
// =============================================================================

describe('handleReviewBack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reset batch review store when no receipts exist', () => {
    const { context } = createMockContext(false);

    handleReviewBack(context);

    expect(batchReviewActions.reset).toHaveBeenCalled();
  });

  describe('when batch receipts exist', () => {
    it('should show discard confirmation dialog', () => {
      const { context, mocks } = createMockContext(true);

      handleReviewBack(context);

      expect(mocks.showScanDialog).toHaveBeenCalledWith(
        DIALOG_TYPES.BATCH_DISCARD,
        {}
      );
    });

    it('should not navigate or reset state', () => {
      const { context, mocks } = createMockContext(true);

      handleReviewBack(context);

      expect(mocks.setBatchImages).not.toHaveBeenCalled();
      expect(mocks.batchProcessingReset).not.toHaveBeenCalled();
      expect(mocks.resetScanContext).not.toHaveBeenCalled();
      expect(mocks.setView).not.toHaveBeenCalled();
    });
  });

  describe('when no batch receipts exist', () => {
    it('should not show dialog', () => {
      const { context, mocks } = createMockContext(false);

      handleReviewBack(context);

      expect(mocks.showScanDialog).not.toHaveBeenCalled();
    });

    it('should clear batch images', () => {
      const { context, mocks } = createMockContext(false);

      handleReviewBack(context);

      expect(mocks.setBatchImages).toHaveBeenCalledWith([]);
    });

    it('should reset batch processing', () => {
      const { context, mocks } = createMockContext(false);

      handleReviewBack(context);

      expect(mocks.batchProcessingReset).toHaveBeenCalled();
    });

    it('should reset scan context', () => {
      const { context, mocks } = createMockContext(false);

      handleReviewBack(context);

      expect(mocks.resetScanContext).toHaveBeenCalled();
    });

    it('should navigate to dashboard', () => {
      const { context, mocks } = createMockContext(false);

      handleReviewBack(context);

      expect(mocks.setView).toHaveBeenCalledWith('dashboard');
    });

    it('should call all cleanup functions in correct order', () => {
      const { context, mocks } = createMockContext(false);
      const callOrder: string[] = [];

      mocks.setBatchImages.mockImplementation(() => callOrder.push('setBatchImages'));
      mocks.batchProcessingReset.mockImplementation(() => callOrder.push('batchProcessingReset'));
      mocks.resetScanContext.mockImplementation(() => callOrder.push('resetScanContext'));
      mocks.setView.mockImplementation(() => callOrder.push('setView'));

      handleReviewBack(context);

      expect(callOrder).toEqual([
        'setBatchImages',
        'batchProcessingReset',
        'resetScanContext',
        'setView',
      ]);
    });
  });
});

// =============================================================================
// Tests: confirmDiscard
// =============================================================================

describe('confirmDiscard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reset batch review store', () => {
    const { context } = createMockContext(true);

    confirmDiscard(context);

    expect(batchReviewActions.reset).toHaveBeenCalled();
  });

  it('should dismiss the dialog', () => {
    const { context, mocks } = createMockContext(true);

    confirmDiscard(context);

    expect(mocks.dismissScanDialog).toHaveBeenCalled();
  });

  it('should clear batch images', () => {
    const { context, mocks } = createMockContext(true);

    confirmDiscard(context);

    expect(mocks.setBatchImages).toHaveBeenCalledWith([]);
  });

  it('should reset batch processing', () => {
    const { context, mocks } = createMockContext(true);

    confirmDiscard(context);

    expect(mocks.batchProcessingReset).toHaveBeenCalled();
  });

  it('should reset scan context', () => {
    const { context, mocks } = createMockContext(true);

    confirmDiscard(context);

    expect(mocks.resetScanContext).toHaveBeenCalled();
  });

  it('should navigate to dashboard', () => {
    const { context, mocks } = createMockContext(true);

    confirmDiscard(context);

    expect(mocks.setView).toHaveBeenCalledWith('dashboard');
  });

  it('should call all functions in correct order', () => {
    const { context, mocks } = createMockContext(true);
    const callOrder: string[] = [];

    mocks.dismissScanDialog.mockImplementation(() => callOrder.push('dismissScanDialog'));
    mocks.setBatchImages.mockImplementation(() => callOrder.push('setBatchImages'));
    mocks.batchProcessingReset.mockImplementation(() => callOrder.push('batchProcessingReset'));
    mocks.resetScanContext.mockImplementation(() => callOrder.push('resetScanContext'));
    mocks.setView.mockImplementation(() => callOrder.push('setView'));

    confirmDiscard(context);

    expect(callOrder).toEqual([
      'dismissScanDialog',
      'setBatchImages',
      'batchProcessingReset',
      'resetScanContext',
      'setView',
    ]);
  });

  it('should work regardless of hasBatchReceipts value', () => {
    const { context: noReceiptsCtx, mocks: noReceiptsMocks } = createMockContext(false);

    confirmDiscard(noReceiptsCtx);

    expect(noReceiptsMocks.dismissScanDialog).toHaveBeenCalled();
    expect(noReceiptsMocks.setView).toHaveBeenCalledWith('dashboard');
  });
});

// =============================================================================
// Tests: cancelDiscard
// =============================================================================

describe('cancelDiscard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should dismiss the dialog', () => {
    const { context, mocks } = createMockContext(true);

    cancelDiscard(context);

    expect(mocks.dismissScanDialog).toHaveBeenCalled();
  });

  it('should not clear batch images', () => {
    const { context, mocks } = createMockContext(true);

    cancelDiscard(context);

    expect(mocks.setBatchImages).not.toHaveBeenCalled();
  });

  it('should not reset batch processing', () => {
    const { context, mocks } = createMockContext(true);

    cancelDiscard(context);

    expect(mocks.batchProcessingReset).not.toHaveBeenCalled();
  });

  it('should not reset scan context', () => {
    const { context, mocks } = createMockContext(true);

    cancelDiscard(context);

    expect(mocks.resetScanContext).not.toHaveBeenCalled();
  });

  it('should not navigate', () => {
    const { context, mocks } = createMockContext(true);

    cancelDiscard(context);

    expect(mocks.setView).not.toHaveBeenCalled();
  });

  it('should only call dismissScanDialog', () => {
    const { context, mocks } = createMockContext(true);

    cancelDiscard(context);

    expect(mocks.dismissScanDialog).toHaveBeenCalledTimes(1);
    expect(mocks.setBatchImages).not.toHaveBeenCalled();
    expect(mocks.batchProcessingReset).not.toHaveBeenCalled();
    expect(mocks.resetScanContext).not.toHaveBeenCalled();
    expect(mocks.setView).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Tests: Integration scenarios
// =============================================================================

describe('Discard handlers integration', () => {
  it('should allow discard flow: back -> confirm', () => {
    // Step 1: User clicks back with receipts
    const { context: ctx1, mocks: mocks1 } = createMockContext(true);
    handleReviewBack(ctx1);
    expect(mocks1.showScanDialog).toHaveBeenCalledWith(DIALOG_TYPES.BATCH_DISCARD, {});

    // Step 2: User confirms discard
    const { context: ctx2, mocks: mocks2 } = createMockContext(true);
    confirmDiscard(ctx2);
    expect(mocks2.dismissScanDialog).toHaveBeenCalled();
    expect(mocks2.setView).toHaveBeenCalledWith('dashboard');
  });

  it('should allow cancel flow: back -> cancel -> still on batch review', () => {
    // Step 1: User clicks back with receipts
    const { context: ctx1, mocks: mocks1 } = createMockContext(true);
    handleReviewBack(ctx1);
    expect(mocks1.showScanDialog).toHaveBeenCalledWith(DIALOG_TYPES.BATCH_DISCARD, {});

    // Step 2: User cancels discard
    const { context: ctx2, mocks: mocks2 } = createMockContext(true);
    cancelDiscard(ctx2);
    expect(mocks2.dismissScanDialog).toHaveBeenCalled();
    // Should not navigate away
    expect(mocks2.setView).not.toHaveBeenCalled();
  });

  it('should allow direct navigation when no receipts exist', () => {
    const { context, mocks } = createMockContext(false);

    handleReviewBack(context);

    // Should skip dialog and navigate directly
    expect(mocks.showScanDialog).not.toHaveBeenCalled();
    expect(mocks.setView).toHaveBeenCalledWith('dashboard');
  });
});
