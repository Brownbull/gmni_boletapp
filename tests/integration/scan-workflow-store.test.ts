/**
 * Story TD-16-4: Scan -> Shared Workflow Store -> Batch-Review Data Flow
 *
 * Verifies scanStore (writer) --> useScanWorkflowStore (shared) <-- batch-review (reader)
 * data flow: phase/mode mirroring, image writes, batch progress, and receipt handoff.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getScanState, scanActions } from '@features/scan/store';
import {
  useScanWorkflowStore,
  getWorkflowState,
} from '@shared/stores/useScanWorkflowStore';
import {
  createMockTransaction,
  createMockBatchReceipts,
  resetAllStores,
} from '@features/scan/store/__tests__/helpers';

beforeEach(() => {
  resetAllStores();
});

// =============================================================================
// 1. startBatch -> shared workflow store mirrors phase and mode
// =============================================================================

describe('startBatch -> shared workflow store mirroring', () => {
  it('sets shared store phase to capturing after startBatch', () => {
    scanActions.startBatch('user-1');

    const wf = getWorkflowState();
    expect(wf.phase).toBe('capturing');
  });

  it('sets shared store mode to batch after startBatch', () => {
    scanActions.startBatch('user-1');

    const wf = getWorkflowState();
    expect(wf.mode).toBe('batch');
  });

  it('initializes batchProgress with zeroed counters', () => {
    scanActions.startBatch('user-1');

    const wf = getWorkflowState();
    expect(wf.batchProgress).toEqual({
      current: 0,
      total: 0,
      completed: [],
      failed: [],
    });
  });

  it('resets shared store images to empty array', () => {
    // Pre-seed some images to ensure reset works
    useScanWorkflowStore.getState().setImages(['old-img']);

    scanActions.startBatch('user-1');

    const wf = getWorkflowState();
    expect(wf.images).toEqual([]);
  });

  it('mirrors phase and mode in both scan and shared stores', () => {
    scanActions.startBatch('user-1');

    const scan = getScanState();
    const wf = getWorkflowState();

    expect(scan.phase).toBe('capturing');
    expect(scan.mode).toBe('batch');
    expect(wf.phase).toBe('capturing');
    expect(wf.mode).toBe('batch');
  });
});

// =============================================================================
// 2. addImage -> shared workflow store images
// =============================================================================

describe('addImage -> shared workflow store images', () => {
  beforeEach(() => {
    scanActions.startBatch('user-1');
  });

  it('adds first image to shared store', () => {
    scanActions.addImage('img1');

    const wf = getWorkflowState();
    expect(wf.images).toEqual(['img1']);
  });

  it('adds multiple images to shared store cumulatively', () => {
    scanActions.addImage('img1');
    scanActions.addImage('img2');

    const wf = getWorkflowState();
    expect(wf.images).toEqual(['img1', 'img2']);
  });

  it('updates batchProgress.total when adding images in batch mode', () => {
    scanActions.addImage('img1');
    scanActions.addImage('img2');

    const wf = getWorkflowState();
    expect(wf.batchProgress?.total).toBe(2);
  });

  it('does not add images when phase is not capturing (guard)', () => {
    // Move to scanning phase first
    scanActions.addImage('img1');
    scanActions.processStart('super', 1);

    // Try to add image during scanning -- should be blocked by guard
    scanActions.addImage('should-not-add');

    const wf = getWorkflowState();
    expect(wf.images).toEqual(['img1']);
  });
});

// =============================================================================
// 3. processStart -> shared workflow store phase = scanning
// =============================================================================

describe('processStart -> shared workflow store phase transitions', () => {
  beforeEach(() => {
    scanActions.startBatch('user-1');
    scanActions.addImage('img1');
    scanActions.addImage('img2');
  });

  it('sets shared store phase to scanning on processStart', () => {
    scanActions.processStart('super', 2);

    const wf = getWorkflowState();
    expect(wf.phase).toBe('scanning');
  });

  it('mirrors scanning phase in both stores', () => {
    scanActions.processStart('super', 2);

    const scan = getScanState();
    const wf = getWorkflowState();
    expect(scan.phase).toBe('scanning');
    expect(wf.phase).toBe('scanning');
  });

  it('preserves images in shared store during scanning', () => {
    scanActions.processStart('super', 2);

    const wf = getWorkflowState();
    expect(wf.images).toEqual(['img1', 'img2']);
  });

  it('blocks processStart when no images exist', () => {
    // Reset and start fresh with no images
    resetAllStores();
    scanActions.startBatch('user-1');

    scanActions.processStart('super', 1);

    // Should remain in capturing since guard blocks it
    const scan = getScanState();
    expect(scan.phase).toBe('capturing');
  });
});

// =============================================================================
// 4. processSuccess -> shared workflow store phase = reviewing
// =============================================================================

describe('processSuccess -> shared workflow store phase transitions', () => {
  const mockResults = [
    createMockTransaction({ id: 'tx-1', merchant: 'Store A', total: 5000 }),
    createMockTransaction({ id: 'tx-2', merchant: 'Store B', total: 3000 }),
  ];

  beforeEach(() => {
    scanActions.startBatch('user-1');
    scanActions.addImage('img1');
    scanActions.addImage('img2');
    scanActions.processStart('super', 2);
  });

  it('sets shared store phase to reviewing on processSuccess', () => {
    scanActions.processSuccess(mockResults);

    const wf = getWorkflowState();
    expect(wf.phase).toBe('reviewing');
  });

  it('mirrors reviewing phase in both stores', () => {
    scanActions.processSuccess(mockResults);

    const scan = getScanState();
    const wf = getWorkflowState();
    expect(scan.phase).toBe('reviewing');
    expect(wf.phase).toBe('reviewing');
  });

  it('stores results in scan store (not shared store)', () => {
    scanActions.processSuccess(mockResults);

    const scan = getScanState();
    expect(scan.results).toHaveLength(2);
    expect(scan.results[0].merchant).toBe('Store A');
    expect(scan.results[1].merchant).toBe('Store B');
  });
});

// =============================================================================
// 5. After processSuccess: shared store has correct images, phase, mode
// =============================================================================

describe('shared store integrity after processSuccess', () => {
  beforeEach(() => {
    scanActions.startBatch('user-1');
    scanActions.addImage('img1');
    scanActions.addImage('img2');
    scanActions.processStart('super', 2);
    scanActions.processSuccess([
      createMockTransaction({ id: 'tx-1' }),
      createMockTransaction({ id: 'tx-2' }),
    ]);
  });

  it('preserves images through the entire scan lifecycle', () => {
    const wf = getWorkflowState();
    expect(wf.images).toEqual(['img1', 'img2']);
  });

  it('has phase=reviewing after processSuccess', () => {
    const wf = getWorkflowState();
    expect(wf.phase).toBe('reviewing');
  });

  it('has mode=batch throughout the lifecycle', () => {
    const wf = getWorkflowState();
    expect(wf.mode).toBe('batch');
  });

  it('has all three properties consistent for batch-review readers', () => {
    const wf = getWorkflowState();

    // This is what batch-review feature reads from shared store
    expect(wf).toMatchObject({
      images: ['img1', 'img2'],
      phase: 'reviewing',
      mode: 'batch',
    });
  });
});

// =============================================================================
// 6. setBatchReceipts -> shared store batchReceipts accessible
// =============================================================================

describe('setBatchReceipts -> shared store batchReceipts', () => {
  const mockReceipts = createMockBatchReceipts(3);

  beforeEach(() => {
    scanActions.startBatch('user-1');
    scanActions.addImage('img1');
    scanActions.addImage('img2');
    scanActions.addImage('img3');
    scanActions.processStart('super', 3);
    scanActions.processSuccess([
      createMockTransaction({ id: 'tx-0' }),
      createMockTransaction({ id: 'tx-1' }),
      createMockTransaction({ id: 'tx-2' }),
    ]);
  });

  it('writes batch receipts to shared store via scan action', () => {
    scanActions.setBatchReceipts(mockReceipts);

    const wf = getWorkflowState();
    expect(wf.batchReceipts).toHaveLength(3);
  });

  it('stores correct receipt data accessible by batch-review readers', () => {
    scanActions.setBatchReceipts(mockReceipts);

    const wf = getWorkflowState();
    expect(wf.batchReceipts![0].id).toBe('receipt-0');
    expect(wf.batchReceipts![0].status).toBe('ready');
    expect(wf.batchReceipts![1].status).toBe('review');
    expect(wf.batchReceipts![2].status).toBe('error');
  });

  it('updates batch receipts in shared store when called again', () => {
    scanActions.setBatchReceipts(mockReceipts);

    const updatedReceipts = createMockBatchReceipts(2);
    scanActions.setBatchReceipts(updatedReceipts);

    const wf = getWorkflowState();
    expect(wf.batchReceipts).toHaveLength(2);
  });

  it('blocks setBatchReceipts when not in reviewing phase', () => {
    // Reset to idle -- setBatchReceipts should be guarded
    resetAllStores();
    scanActions.startBatch('user-1');

    scanActions.setBatchReceipts(mockReceipts);

    const wf = getWorkflowState();
    expect(wf.batchReceipts).toBeNull();
  });
});

// =============================================================================
// 7. batchComplete -> batch-review reads correct data from shared store
// =============================================================================

describe('batchComplete -> batch-review reads correct data', () => {
  const batchReceipts = createMockBatchReceipts(3);

  beforeEach(() => {
    scanActions.startBatch('user-1');
    scanActions.addImage('img1');
    scanActions.addImage('img2');
    scanActions.addImage('img3');
    scanActions.processStart('super', 3);
  });

  it('sets phase to reviewing via shared store after batchComplete', () => {
    // Simulate batch item processing
    scanActions.batchItemSuccess(0, createMockTransaction({ id: 'tx-0' }));
    scanActions.batchItemSuccess(1, createMockTransaction({ id: 'tx-1' }));
    scanActions.batchItemSuccess(2, createMockTransaction({ id: 'tx-2' }));

    scanActions.batchComplete(batchReceipts);

    const wf = getWorkflowState();
    expect(wf.phase).toBe('reviewing');
  });

  it('writes batchReceipts to shared store via batchComplete', () => {
    scanActions.batchItemSuccess(0, createMockTransaction({ id: 'tx-0' }));
    scanActions.batchComplete(batchReceipts);

    const wf = getWorkflowState();
    expect(wf.batchReceipts).toHaveLength(3);
    expect(wf.batchReceipts![0].id).toBe('receipt-0');
  });

  it('preserves images in shared store after batchComplete', () => {
    scanActions.batchItemSuccess(0, createMockTransaction({ id: 'tx-0' }));
    scanActions.batchComplete(batchReceipts);

    const wf = getWorkflowState();
    expect(wf.images).toEqual(['img1', 'img2', 'img3']);
  });

  it('provides complete data snapshot for batch-review feature', () => {
    scanActions.batchItemSuccess(0, createMockTransaction({ id: 'tx-0' }));
    scanActions.batchItemSuccess(1, createMockTransaction({ id: 'tx-1' }));
    scanActions.batchComplete(batchReceipts);

    // This simulates what batch-review reads from shared store
    const wf = getWorkflowState();

    expect(wf).toMatchObject({
      phase: 'reviewing',
      mode: 'batch',
      images: ['img1', 'img2', 'img3'],
    });
    expect(wf.batchReceipts).toHaveLength(3);
    expect(wf.batchProgress).toMatchObject({
      total: 3,
    });
    expect(wf.batchProgress!.completed).toHaveLength(2);
  });

  it('tracks batch progress through item-level success and error', () => {
    scanActions.batchItemStart(0);
    scanActions.batchItemSuccess(0, createMockTransaction({ id: 'tx-0' }));
    scanActions.batchItemStart(1);
    scanActions.batchItemError(1, 'OCR failed');
    scanActions.batchItemStart(2);
    scanActions.batchItemSuccess(2, createMockTransaction({ id: 'tx-2' }));

    const wf = getWorkflowState();
    expect(wf.batchProgress!.completed).toHaveLength(2);
    expect(wf.batchProgress!.failed).toEqual([{ index: 1, error: 'OCR failed' }]);
  });
});

// =============================================================================
// 8. Full lifecycle: idle -> capturing -> scanning -> reviewing -> reset
// =============================================================================

describe('full batch scan lifecycle through shared store', () => {
  it('mirrors all phase transitions end-to-end', () => {
    expect(getWorkflowState().phase).toBe('idle');

    scanActions.startBatch('user-1');
    expect(getWorkflowState().phase).toBe('capturing');
    expect(getWorkflowState().mode).toBe('batch');

    scanActions.addImage('img1');
    scanActions.addImage('img2');
    expect(getWorkflowState().images).toEqual(['img1', 'img2']);

    scanActions.processStart('super', 2);
    expect(getWorkflowState().phase).toBe('scanning');

    scanActions.processSuccess([createMockTransaction({ id: 'tx-1' }), createMockTransaction({ id: 'tx-2' })]);
    expect(getWorkflowState().phase).toBe('reviewing');

    scanActions.setBatchReceipts(createMockBatchReceipts(2));
    expect(getWorkflowState().batchReceipts).toHaveLength(2);

    scanActions.reset();
    expect(getWorkflowState().phase).toBe('idle');
    expect(getWorkflowState().images).toEqual([]);
    expect(getWorkflowState().batchReceipts).toBeNull();
    expect(getWorkflowState().batchProgress).toBeNull();
  });
});

// =============================================================================
// 9. Single mode: shared store mirroring without batch state
// =============================================================================

describe('single mode -> shared workflow store mirroring', () => {
  it('mirrors phase=capturing, mode=single, batchProgress=null', () => {
    scanActions.startSingle('user-1');
    const wf = getWorkflowState();
    expect(wf.phase).toBe('capturing');
    expect(wf.mode).toBe('single');
    expect(wf.batchProgress).toBeNull();
  });
});

// =============================================================================
// 10. Error and cancel paths
// =============================================================================

describe('error and cancel paths -> shared store cleanup', () => {
  beforeEach(() => {
    scanActions.startBatch('user-1');
    scanActions.addImage('img1');
  });

  it('mirrors error phase to shared store on processError', () => {
    scanActions.processStart('super', 1);
    scanActions.processError('Network error');
    expect(getWorkflowState().phase).toBe('error');
  });

  it('resets shared store completely on cancel', () => {
    scanActions.cancel();
    const wf = getWorkflowState();
    expect(wf.phase).toBe('idle');
    expect(wf.mode).toBe('single');
    expect(wf.images).toEqual([]);
    expect(wf.batchProgress).toBeNull();
  });

  it('preserves images in shared store during error phase', () => {
    scanActions.processStart('super', 1);
    scanActions.processError('Scan failed');
    expect(getWorkflowState().images).toEqual(['img1']);
  });
});

// =============================================================================
// 11. Batch editing index flow
// =============================================================================

describe('batchEditingIndex -> shared store for batch-review', () => {
  beforeEach(() => {
    scanActions.startBatch('user-1');
    scanActions.addImage('img1');
    scanActions.addImage('img2');
    scanActions.processStart('super', 2);
    scanActions.batchComplete(createMockBatchReceipts(2));
  });

  it('sets batchEditingIndex in shared store', () => {
    scanActions.setBatchEditingIndex(0);
    expect(getWorkflowState().batchEditingIndex).toBe(0);
  });

  it('clears batchEditingIndex when set to null', () => {
    scanActions.setBatchEditingIndex(0);
    scanActions.setBatchEditingIndex(null);
    expect(getWorkflowState().batchEditingIndex).toBeNull();
  });

  it('rejects invalid batchEditingIndex', () => {
    scanActions.setBatchEditingIndex(99);
    expect(getWorkflowState().batchEditingIndex).toBeNull();
  });
});
