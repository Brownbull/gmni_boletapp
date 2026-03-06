/**
 * useScanStore — Credit & Control tests
 *
 * Control actions: restoreState, refundCredit (credit lifecycle management).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useScanStore, initialScanState, getScanState, scanActions } from '../index';
import { createMockTransaction } from './helpers';

describe('useScanStore — Credit & Control', () => {
  beforeEach(() => {
    useScanStore.setState(initialScanState);
  });

  describe('Control actions', () => {
    it('restoreState restores state from persistence', () => {
      const savedState = {
        phase: 'capturing' as const,
        mode: 'single' as const,
        images: ['saved-image'],
        requestId: 'saved-req',
        userId: 'saved-user',
      };
      scanActions.restoreState(savedState);
      expect(getScanState().phase).toBe('capturing');
      expect(getScanState().images).toContain('saved-image');
      expect(getScanState().requestId).toBe('saved-req');
    });

    it('restoreState transitions interrupted scanning to error', () => {
      const interruptedState = {
        phase: 'scanning' as const,
        creditStatus: 'reserved' as const,
      };
      scanActions.restoreState(interruptedState);
      expect(getScanState().phase).toBe('error');
      expect(getScanState().creditStatus).toBe('refunded');
      expect(getScanState().error).toContain('interrumpido');
    });

    it('refundCredit changes creditStatus from reserved to refunded', () => {
      scanActions.startSingle('test-user');
      scanActions.addImage('image');
      scanActions.processStart('normal', 1);
      expect(getScanState().creditStatus).toBe('reserved');
      scanActions.refundCredit();
      expect(getScanState().creditStatus).toBe('refunded');
    });

    it('refundCredit does NOT change if creditStatus is not reserved', () => {
      scanActions.startSingle('test-user');
      scanActions.addImage('image');
      scanActions.processStart('normal', 1);
      scanActions.processSuccess([createMockTransaction()]);
      expect(getScanState().creditStatus).toBe('confirmed');
      scanActions.refundCredit();
      expect(getScanState().creditStatus).toBe('confirmed');
    });
  });

  describe('restoreState runtime validation', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('rejects state with unknown keys and logs warning', () => {
      const malformed = {
        phase: 'capturing' as const,
        bogusKey: 'should-not-exist',
        anotherFake: 42,
      };
      scanActions.restoreState(malformed as Record<string, unknown>);
      // Should still restore valid keys
      expect(getScanState().phase).toBe('capturing');
      // Should log warning about unknown keys
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ScanStore:guard]',
        expect.stringContaining('unknown keys')
      );
    });

    it('rejects non-object input gracefully', () => {
      scanActions.restoreState(null as unknown as Record<string, unknown>);
      // Should remain in initial state
      expect(getScanState().phase).toBe('idle');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ScanStore:guard]',
        expect.stringContaining('invalid restoreState input')
      );
    });

    it('accepts valid partial state without warnings', () => {
      const validPartial = {
        phase: 'reviewing' as const,
        results: [createMockTransaction()],
      };
      scanActions.restoreState(validPartial);
      expect(getScanState().phase).toBe('reviewing');
      // No guard violation warnings for valid input
      const guardCalls = consoleSpy.mock.calls.filter(
        (c: unknown[]) => typeof c[0] === 'string' && c[0].includes('[ScanStore:guard]') && typeof c[1] === 'string' && c[1].includes('unknown keys')
      );
      expect(guardCalls).toHaveLength(0);
    });

    it('applies malformed value types without crashing (no runtime type validation)', () => {
      const malformedValues = {
        phase: 123,
        images: 'not-an-array',
      } as unknown as Record<string, unknown>;
      scanActions.restoreState(malformedValues);
      // Known keys are applied even with wrong types (no runtime type check yet)
      expect(getScanState().phase).toBe(123);
      expect(getScanState().images).toBe('not-an-array');
    });
  });
});
