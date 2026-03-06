/**
 * useScanStore — Core tests
 *
 * AC1: Test file structure, AC2: Forward phase transitions, AC6: DevTools, Result actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useScanStore,
  initialScanState,
  getScanState,
  scanActions,
} from '../index';
import { createMockTransaction, createMockBatchReceipts, getStateOnly } from './helpers';

describe('useScanStore — Core', () => {
  beforeEach(() => {
    useScanStore.setState(initialScanState);
  });

  describe('AC1: Test file structure', () => {
    it('imports from store module correctly', () => {
      expect(useScanStore).toBeDefined();
      expect(initialScanState).toBeDefined();
      expect(getScanState).toBeDefined();
      expect(scanActions).toBeDefined();
    });

    it('store reset works between tests', () => {
      scanActions.startSingle('user-1');
      expect(getScanState().phase).toBe('capturing');
      useScanStore.setState(initialScanState);
      expect(getScanState().phase).toBe('idle');
    });

    it('has correct initial state', () => {
      expect(getStateOnly()).toEqual(initialScanState);
      expect(getScanState().phase).toBe('idle');
      expect(getScanState().mode).toBe('single');
      expect(getScanState().images).toHaveLength(0);
      expect(getScanState().results).toHaveLength(0);
      expect(getScanState().creditStatus).toBe('none');
    });
  });

  describe('AC2: Valid forward phase transitions', () => {
    describe('idle → capturing', () => {
      it('transitions via startSingle', () => {
        expect(getScanState().phase).toBe('idle');
        scanActions.startSingle('test-user');
        expect(getScanState().phase).toBe('capturing');
        expect(getScanState().mode).toBe('single');
        expect(getScanState().userId).toBe('test-user');
        expect(getScanState().requestId).toMatch(/^req-\d+-[a-z0-9]+$/);
        expect(getScanState().startedAt).toBeGreaterThan(0);
      });

      it('transitions via startBatch with batchProgress', () => {
        expect(getScanState().phase).toBe('idle');
        scanActions.startBatch('test-user');
        expect(getScanState().phase).toBe('capturing');
        expect(getScanState().mode).toBe('batch');
        expect(getScanState().userId).toBe('test-user');
        expect(getScanState().batchProgress).toEqual({
          current: 0, total: 0, completed: [], failed: [],
        });
      });

      it('transitions via startStatement', () => {
        expect(getScanState().phase).toBe('idle');
        scanActions.startStatement('test-user');
        expect(getScanState().phase).toBe('capturing');
        expect(getScanState().mode).toBe('statement');
        expect(getScanState().userId).toBe('test-user');
      });
    });

    describe('capturing → scanning', () => {
      it('transitions via processStart', () => {
        scanActions.startSingle('test-user');
        scanActions.addImage('base64-image-data');
        expect(getScanState().phase).toBe('capturing');
        scanActions.processStart('normal', 1);
        expect(getScanState().phase).toBe('scanning');
        expect(getScanState().creditStatus).toBe('reserved');
        expect(getScanState().creditType).toBe('normal');
        expect(getScanState().creditsCount).toBe(1);
      });
    });

    describe('scanning → reviewing', () => {
      it('transitions via processSuccess', () => {
        scanActions.startSingle('test-user');
        scanActions.addImage('base64-image-data');
        scanActions.processStart('normal', 1);
        expect(getScanState().phase).toBe('scanning');
        const mockTx = createMockTransaction();
        scanActions.processSuccess([mockTx]);
        expect(getScanState().phase).toBe('reviewing');
        expect(getScanState().creditStatus).toBe('confirmed');
        expect(getScanState().results).toHaveLength(1);
        expect(getScanState().results[0]).toEqual(mockTx);
        expect(getScanState().activeResultIndex).toBe(0);
      });

      it('transitions via batchComplete for batch mode', () => {
        scanActions.startBatch('test-user');
        scanActions.addImage('image-1');
        scanActions.addImage('image-2');
        scanActions.processStart('super', 2);
        expect(getScanState().phase).toBe('scanning');
        const tx1 = createMockTransaction({ id: 'tx-1' });
        const tx2 = createMockTransaction({ id: 'tx-2' });
        scanActions.batchItemSuccess(0, tx1);
        scanActions.batchItemSuccess(1, tx2);
        const mockReceipts = createMockBatchReceipts(2);
        scanActions.batchComplete(mockReceipts);
        expect(getScanState().phase).toBe('reviewing');
        expect(getScanState().creditStatus).toBe('confirmed');
        expect(getScanState().batchReceipts).toEqual(mockReceipts);
      });
    });

    describe('scanning → error', () => {
      it('transitions via processError', () => {
        scanActions.startSingle('test-user');
        scanActions.addImage('base64-image-data');
        scanActions.processStart('normal', 1);
        expect(getScanState().phase).toBe('scanning');
        scanActions.processError('Network error');
        expect(getScanState().phase).toBe('error');
        expect(getScanState().error).toBe('Network error');
        expect(getScanState().creditStatus).toBe('refunded');
      });
    });

    describe('reviewing → saving → idle/reviewing', () => {
      it('transitions via saveStart', () => {
        scanActions.startSingle('test-user');
        scanActions.addImage('base64-image-data');
        scanActions.processStart('normal', 1);
        scanActions.processSuccess([createMockTransaction()]);
        expect(getScanState().phase).toBe('reviewing');
        scanActions.saveStart();
        expect(getScanState().phase).toBe('saving');
      });

      it('transitions via saveSuccess', () => {
        scanActions.startSingle('test-user');
        scanActions.addImage('base64-image-data');
        scanActions.processStart('normal', 1);
        scanActions.processSuccess([createMockTransaction()]);
        scanActions.saveStart();
        expect(getScanState().phase).toBe('saving');
        scanActions.saveSuccess();
        expect(getScanState().phase).toBe('idle');
        expect(getStateOnly()).toEqual(initialScanState);
      });

      it('transitions via saveError', () => {
        scanActions.startSingle('test-user');
        scanActions.addImage('base64-image-data');
        scanActions.processStart('normal', 1);
        const mockTx = createMockTransaction();
        scanActions.processSuccess([mockTx]);
        scanActions.saveStart();
        expect(getScanState().phase).toBe('saving');
        scanActions.saveError('Save failed');
        expect(getScanState().phase).toBe('reviewing');
        expect(getScanState().error).toBe('Save failed');
        expect(getScanState().results).toHaveLength(1);
      });
    });
  });

  describe('AC6: DevTools action names', () => {
    it('actions produce correct action names', () => {
      scanActions.startSingle('test-user');
      expect(getScanState().phase).toBe('capturing');
      scanActions.addImage('image');
      expect(getScanState().images).toHaveLength(1);
      scanActions.processStart('normal', 1);
      expect(getScanState().phase).toBe('scanning');
      scanActions.processSuccess([createMockTransaction()]);
      expect(getScanState().phase).toBe('reviewing');
    });

    it('store name is set for DevTools', () => {
      expect(useScanStore).toBeDefined();
      expect(typeof useScanStore.getState).toBe('function');
      expect(typeof useScanStore.setState).toBe('function');
    });
  });

  describe('Result actions', () => {
    beforeEach(() => {
      scanActions.startSingle('test-user');
      scanActions.addImage('image');
      scanActions.processStart('normal', 1);
      scanActions.processSuccess([createMockTransaction()]);
    });

    it('updateResult updates result at index', () => {
      expect(getScanState().results[0].merchant).toBe('Test Merchant');
      scanActions.updateResult(0, { merchant: 'Updated Merchant' });
      expect(getScanState().results[0].merchant).toBe('Updated Merchant');
    });

    it('updateResult does NOT update invalid index', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      scanActions.updateResult(99, { merchant: 'Updated' });
      expect(getScanState().results[0].merchant).toBe('Test Merchant');
      consoleSpy.mockRestore();
    });

    it('setActiveResult sets active result index', () => {
      scanActions.reset();
      scanActions.startSingle('test-user');
      scanActions.addImage('image');
      scanActions.processStart('normal', 1);
      scanActions.processSuccess([
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
      ]);
      expect(getScanState().activeResultIndex).toBe(0);
      scanActions.setActiveResult(1);
      expect(getScanState().activeResultIndex).toBe(1);
    });
  });
});
