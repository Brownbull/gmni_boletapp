/**
 * Story 16-6: Shared Scan Workflow Store Tests
 *
 * Tests for the shared store that holds scan workflow data consumed by
 * batch-review and transaction-editor features. No phase guards — scan
 * feature mediates access.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import type { BatchReceipt } from '@/types/batchReceipt';
import type { BatchProgress } from '@shared/types/scanWorkflow';

// Store under test
import {
  useScanWorkflowStore,
  getWorkflowState,
  workflowActions,
} from '../useScanWorkflowStore';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockBatchReceipt(overrides: Partial<BatchReceipt> = {}): BatchReceipt {
  return {
    id: 'receipt-1',
    index: 0,
    transaction: {
      id: 'tx-1',
      date: '2026-01-01',
      merchant: 'Test Store',
      category: 'Supermarket',
      total: 1000,
      items: [{ name: 'Item', price: 1000, qty: 1 }],
      currency: 'CLP',
    },
    status: 'ready',
    confidence: 0.95,
    ...overrides,
  } as BatchReceipt;
}

function createMockBatchProgress(overrides: Partial<BatchProgress> = {}): BatchProgress {
  return {
    current: 0,
    total: 3,
    completed: [],
    failed: [],
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('useScanWorkflowStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useScanWorkflowStore.getState().reset();
    });
  });

  // =========================================================================
  // Initial State
  // =========================================================================

  describe('initial state', () => {
    it('has empty images array', () => {
      expect(getWorkflowState().images).toEqual([]);
    });

    it('has null batchReceipts', () => {
      expect(getWorkflowState().batchReceipts).toBeNull();
    });

    it('has null batchProgress', () => {
      expect(getWorkflowState().batchProgress).toBeNull();
    });

    it('has null batchEditingIndex', () => {
      expect(getWorkflowState().batchEditingIndex).toBeNull();
    });

    it('has single mode by default', () => {
      expect(getWorkflowState().mode).toBe('single');
    });

    it('has idle phase by default', () => {
      expect(getWorkflowState().phase).toBe('idle');
    });

    it('has null activeDialog', () => {
      expect(getWorkflowState().activeDialog).toBeNull();
    });
  });

  // =========================================================================
  // Image Actions
  // =========================================================================

  describe('image actions', () => {
    it('setImages replaces all images', () => {
      act(() => {
        workflowActions.setImages(['img1', 'img2']);
      });
      expect(getWorkflowState().images).toEqual(['img1', 'img2']);
    });

    it('addImage appends to images array', () => {
      act(() => {
        workflowActions.setImages(['img1']);
        workflowActions.addImage('img2');
      });
      expect(getWorkflowState().images).toEqual(['img1', 'img2']);
    });

    it('removeImage removes by index', () => {
      act(() => {
        workflowActions.setImages(['a', 'b', 'c']);
        workflowActions.removeImage(1);
      });
      expect(getWorkflowState().images).toEqual(['a', 'c']);
    });

    it('removeImage with out-of-range index is safe', () => {
      act(() => {
        workflowActions.setImages(['a', 'b']);
        workflowActions.removeImage(5);
      });
      expect(getWorkflowState().images).toEqual(['a', 'b']);
    });
  });

  // =========================================================================
  // Batch Receipt Actions
  // =========================================================================

  describe('batch receipt actions', () => {
    it('setBatchReceipts sets receipts array', () => {
      const receipts = [createMockBatchReceipt()];
      act(() => {
        workflowActions.setBatchReceipts(receipts);
      });
      expect(getWorkflowState().batchReceipts).toEqual(receipts);
    });

    it('updateBatchReceipt updates by id', () => {
      const receipt = createMockBatchReceipt({ id: 'r1' });
      act(() => {
        workflowActions.setBatchReceipts([receipt]);
        workflowActions.updateBatchReceipt('r1', { confidence: 0.5 });
      });
      expect(getWorkflowState().batchReceipts![0].confidence).toBe(0.5);
    });

    it('updateBatchReceipt ignores unknown id', () => {
      const receipt = createMockBatchReceipt({ id: 'r1' });
      act(() => {
        workflowActions.setBatchReceipts([receipt]);
        workflowActions.updateBatchReceipt('unknown', { confidence: 0.5 });
      });
      expect(getWorkflowState().batchReceipts![0].confidence).toBe(0.95);
    });

    it('discardBatchReceipt removes by id', () => {
      const r1 = createMockBatchReceipt({ id: 'r1' });
      const r2 = createMockBatchReceipt({ id: 'r2', index: 1 });
      act(() => {
        workflowActions.setBatchReceipts([r1, r2]);
        workflowActions.discardBatchReceipt('r1');
      });
      expect(getWorkflowState().batchReceipts).toHaveLength(1);
      expect(getWorkflowState().batchReceipts![0].id).toBe('r2');
    });

    it('clearBatchReceipts sets to null', () => {
      act(() => {
        workflowActions.setBatchReceipts([createMockBatchReceipt()]);
        workflowActions.clearBatchReceipts();
      });
      expect(getWorkflowState().batchReceipts).toBeNull();
    });
  });

  // =========================================================================
  // Batch Progress Actions
  // =========================================================================

  describe('batch progress actions', () => {
    it('setBatchProgress sets progress object', () => {
      const progress = createMockBatchProgress();
      act(() => {
        workflowActions.setBatchProgress(progress);
      });
      expect(getWorkflowState().batchProgress).toEqual(progress);
    });

    it('setBatchProgress(null) clears progress', () => {
      act(() => {
        workflowActions.setBatchProgress(createMockBatchProgress());
        workflowActions.setBatchProgress(null);
      });
      expect(getWorkflowState().batchProgress).toBeNull();
    });
  });

  // =========================================================================
  // Batch Editing Index Actions
  // =========================================================================

  describe('batch editing index actions', () => {
    it('setBatchEditingIndex sets index', () => {
      act(() => {
        workflowActions.setBatchEditingIndex(2);
      });
      expect(getWorkflowState().batchEditingIndex).toBe(2);
    });

    it('setBatchEditingIndex(null) clears index', () => {
      act(() => {
        workflowActions.setBatchEditingIndex(2);
        workflowActions.setBatchEditingIndex(null);
      });
      expect(getWorkflowState().batchEditingIndex).toBeNull();
    });
  });

  // =========================================================================
  // Mode Actions
  // =========================================================================

  describe('mode actions', () => {
    it('setMode changes mode', () => {
      act(() => {
        workflowActions.setMode('batch');
      });
      expect(getWorkflowState().mode).toBe('batch');
    });

    it('setMode to statement', () => {
      act(() => {
        workflowActions.setMode('statement');
      });
      expect(getWorkflowState().mode).toBe('statement');
    });
  });

  // =========================================================================
  // Mirrored State Actions
  // =========================================================================

  describe('mirrored state actions', () => {
    it('setPhase changes phase', () => {
      act(() => {
        workflowActions.setPhase('scanning');
      });
      expect(getWorkflowState().phase).toBe('scanning');
    });

    it('setActiveDialog sets dialog state', () => {
      const dialog = { type: 'cancel_warning' as const, data: null };
      act(() => {
        workflowActions.setActiveDialog(dialog);
      });
      expect(getWorkflowState().activeDialog).toEqual(dialog);
    });

    it('setActiveDialog(null) clears dialog', () => {
      act(() => {
        workflowActions.setActiveDialog({ type: 'cancel_warning' as const, data: null });
        workflowActions.setActiveDialog(null);
      });
      expect(getWorkflowState().activeDialog).toBeNull();
    });
  });

  // =========================================================================
  // Reset
  // =========================================================================

  describe('reset', () => {
    it('restores all state to initial values', () => {
      act(() => {
        workflowActions.setImages(['img1']);
        workflowActions.setMode('batch');
        workflowActions.setPhase('scanning');
        workflowActions.setBatchProgress(createMockBatchProgress());
        workflowActions.setBatchReceipts([createMockBatchReceipt()]);
        workflowActions.setBatchEditingIndex(1);
        workflowActions.setActiveDialog({ type: 'cancel_warning' as const, data: null });
      });

      act(() => {
        useScanWorkflowStore.getState().reset();
      });

      const state = getWorkflowState();
      expect(state.images).toEqual([]);
      expect(state.mode).toBe('single');
      expect(state.phase).toBe('idle');
      expect(state.batchProgress).toBeNull();
      expect(state.batchReceipts).toBeNull();
      expect(state.batchEditingIndex).toBeNull();
      expect(state.activeDialog).toBeNull();
    });
  });

  // =========================================================================
  // Direct Access (getWorkflowState, workflowActions)
  // =========================================================================

  describe('direct access', () => {
    it('getWorkflowState returns current state snapshot', () => {
      act(() => {
        workflowActions.setImages(['snapshot']);
      });
      expect(getWorkflowState().images).toEqual(['snapshot']);
    });

    it('workflowActions.setImages works outside React', () => {
      workflowActions.setImages(['direct']);
      expect(getWorkflowState().images).toEqual(['direct']);
    });
  });

  // =========================================================================
  // Derived Selectors
  // =========================================================================

  describe('derived selectors (isProcessing)', () => {
    it('isProcessing is false when idle', () => {
      const state = getWorkflowState();
      expect(state.phase === 'scanning' || state.phase === 'saving').toBe(false);
    });

    it('isProcessing is true when scanning', () => {
      act(() => {
        workflowActions.setPhase('scanning');
      });
      const state = getWorkflowState();
      expect(state.phase === 'scanning' || state.phase === 'saving').toBe(true);
    });

    it('isProcessing is true when saving', () => {
      act(() => {
        workflowActions.setPhase('saving');
      });
      const state = getWorkflowState();
      expect(state.phase === 'scanning' || state.phase === 'saving').toBe(true);
    });
  });
});
