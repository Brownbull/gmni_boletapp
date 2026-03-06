/**
 * useScanStore — Dialog & UI Flags tests
 *
 * Dialog actions (show/resolve/dismiss) and Story 14e-38 UI flags.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScanStore, initialScanState, getScanState, scanActions } from '../index';

describe('useScanStore — Dialog & UI Flags', () => {
  beforeEach(() => {
    useScanStore.setState(initialScanState);
  });

  describe('Dialog actions', () => {
    it('showDialog sets activeDialog', () => {
      scanActions.showDialog({
        type: 'currency_mismatch',
        data: { detected: 'USD', expected: 'CLP' },
      });
      expect(getScanState().activeDialog).toEqual({
        type: 'currency_mismatch',
        data: { detected: 'USD', expected: 'CLP' },
      });
    });

    it('resolveDialog clears dialog when type matches', () => {
      scanActions.showDialog({ type: 'currency_mismatch', data: {} });
      expect(getScanState().activeDialog).not.toBeNull();
      scanActions.resolveDialog('currency_mismatch', { accepted: true });
      expect(getScanState().activeDialog).toBeNull();
    });

    it('resolveDialog does NOT clear dialog when type mismatches', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      scanActions.showDialog({ type: 'currency_mismatch', data: {} });
      scanActions.resolveDialog('total_mismatch', {});
      expect(getScanState().activeDialog?.type).toBe('currency_mismatch');
      consoleSpy.mockRestore();
    });

    it('dismissDialog clears any active dialog', () => {
      scanActions.showDialog({ type: 'quicksave', data: {} });
      expect(getScanState().activeDialog).not.toBeNull();
      scanActions.dismissDialog();
      expect(getScanState().activeDialog).toBeNull();
    });
  });

  describe('Story 14e-38: UI Flags', () => {
    describe('AC1: State initialization', () => {
      it('skipScanCompleteModal defaults to false', () => {
        expect(getScanState().skipScanCompleteModal).toBe(false);
      });

      it('isRescanning defaults to false', () => {
        expect(getScanState().isRescanning).toBe(false);
      });

      it('initial state includes UI flags with correct defaults', () => {
        expect(initialScanState.skipScanCompleteModal).toBe(false);
        expect(initialScanState.isRescanning).toBe(false);
      });
    });

    describe('AC2: Actions', () => {
      it('setSkipScanCompleteModal(true) sets flag to true', () => {
        scanActions.setSkipScanCompleteModal(true);
        expect(getScanState().skipScanCompleteModal).toBe(true);
      });

      it('setSkipScanCompleteModal(false) sets flag to false', () => {
        scanActions.setSkipScanCompleteModal(true);
        expect(getScanState().skipScanCompleteModal).toBe(true);
        scanActions.setSkipScanCompleteModal(false);
        expect(getScanState().skipScanCompleteModal).toBe(false);
      });

      it('setIsRescanning(true) sets flag to true', () => {
        scanActions.setIsRescanning(true);
        expect(getScanState().isRescanning).toBe(true);
      });

      it('setIsRescanning(false) sets flag to false', () => {
        scanActions.setIsRescanning(true);
        expect(getScanState().isRescanning).toBe(true);
        scanActions.setIsRescanning(false);
        expect(getScanState().isRescanning).toBe(false);
      });

      it('reset() clears skipScanCompleteModal to false', () => {
        scanActions.setSkipScanCompleteModal(true);
        expect(getScanState().skipScanCompleteModal).toBe(true);
        scanActions.reset();
        expect(getScanState().skipScanCompleteModal).toBe(false);
      });

      it('reset() clears isRescanning to false', () => {
        scanActions.setIsRescanning(true);
        expect(getScanState().isRescanning).toBe(true);
        scanActions.reset();
        expect(getScanState().isRescanning).toBe(false);
      });

      it('reset() clears both UI flags simultaneously', () => {
        scanActions.setSkipScanCompleteModal(true);
        scanActions.setIsRescanning(true);
        expect(getScanState().skipScanCompleteModal).toBe(true);
        expect(getScanState().isRescanning).toBe(true);
        scanActions.reset();
        expect(getScanState().skipScanCompleteModal).toBe(false);
        expect(getScanState().isRescanning).toBe(false);
      });
    });

    describe('AC7: UI flags preserved during scan flow', () => {
      it('skipScanCompleteModal preserved through startSingle', () => {
        scanActions.setSkipScanCompleteModal(true);
        scanActions.startSingle('test-user');
        expect(getScanState().skipScanCompleteModal).toBe(false);
      });

      it('UI flags work independently of scan phase', () => {
        scanActions.startSingle('test-user');
        scanActions.setSkipScanCompleteModal(true);
        scanActions.setIsRescanning(true);
        expect(getScanState().skipScanCompleteModal).toBe(true);
        expect(getScanState().isRescanning).toBe(true);
        scanActions.addImage('image');
        scanActions.processStart('normal', 1);
        expect(getScanState().skipScanCompleteModal).toBe(true);
        expect(getScanState().isRescanning).toBe(true);
      });
    });
  });
});
