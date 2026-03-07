/**
 * Story 16-7: Event Bus Tests
 *
 * Tests for typed event bus infrastructure using mitt.
 * Validates: type safety, emit/subscribe, cleanup, AppEvents contract.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appEvents } from '@shared/events';
import type { AppEvents } from '@shared/events';

describe('appEvents (typed mitt event bus)', () => {
  beforeEach(() => {
    // Clear all listeners between tests
    appEvents.all.clear();
  });

  describe('scan:completed event', () => {
    it('should emit and receive scan:completed with transactionIds', () => {
      const handler = vi.fn();
      appEvents.on('scan:completed', handler);

      appEvents.emit('scan:completed', { transactionIds: ['tx-1', 'tx-2'] });

      expect(handler).toHaveBeenCalledWith({ transactionIds: ['tx-1', 'tx-2'] });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not fire handler after unsubscribe via off()', () => {
      const handler = vi.fn();
      appEvents.on('scan:completed', handler);

      appEvents.off('scan:completed', handler);
      appEvents.emit('scan:completed', { transactionIds: ['tx-1'] });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('scan:cancelled event', () => {
    it('should emit and receive scan:cancelled with mode', () => {
      const handler = vi.fn();
      appEvents.on('scan:cancelled', handler);

      appEvents.emit('scan:cancelled', { mode: 'single' });

      expect(handler).toHaveBeenCalledWith({ mode: 'single' });
    });
  });

  describe('review:saved event', () => {
    it('should emit and receive review:saved with transactionIds', () => {
      const handler = vi.fn();
      appEvents.on('review:saved', handler);

      appEvents.emit('review:saved', { transactionIds: ['tx-3'] });

      expect(handler).toHaveBeenCalledWith({ transactionIds: ['tx-3'] });
    });
  });

  describe('cleanup', () => {
    it('should support multiple listeners on same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      appEvents.on('scan:completed', handler1);
      appEvents.on('scan:completed', handler2);

      appEvents.emit('scan:completed', { transactionIds: ['tx-1'] });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should only unsubscribe the specific handler via off()', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      appEvents.on('scan:completed', handler1);
      appEvents.on('scan:completed', handler2);

      appEvents.off('scan:completed', handler1);
      appEvents.emit('scan:completed', { transactionIds: ['tx-1'] });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('type safety', () => {
    it('should enforce AppEvents type contract at compile time', () => {
      // This test validates the type contract exists and is usable
      const events: AppEvents = {
        'scan:completed': { transactionIds: ['id'] },
        'scan:cancelled': { mode: 'batch' },
        'review:saved': { transactionIds: ['id'] },
      };
      expect(events['scan:completed'].transactionIds).toEqual(['id']);
      expect(events['scan:cancelled'].mode).toBe('batch');
      expect(events['review:saved'].transactionIds).toEqual(['id']);
    });
  });
});
