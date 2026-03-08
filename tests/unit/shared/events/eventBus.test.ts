/**
 * Story 16-7: Event Bus Tests
 * Story TD-16-5: Updated payloads (resultIndex) and renamed batch:editing-finished.
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
    it('should emit and receive scan:completed with resultIndex', () => {
      const handler = vi.fn();
      appEvents.on('scan:completed', handler);

      appEvents.emit('scan:completed', { resultIndex: 0 });

      expect(handler).toHaveBeenCalledWith({ resultIndex: 0 });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not fire handler after unsubscribe via off()', () => {
      const handler = vi.fn();
      appEvents.on('scan:completed', handler);

      appEvents.off('scan:completed', handler);
      appEvents.emit('scan:completed', { resultIndex: 0 });

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

  describe('batch:editing-finished event', () => {
    it('should emit and receive batch:editing-finished with empty payload', () => {
      const handler = vi.fn();
      appEvents.on('batch:editing-finished', handler);

      appEvents.emit('batch:editing-finished', {});

      expect(handler).toHaveBeenCalledWith({});
    });
  });

  describe('cleanup', () => {
    it('should support multiple listeners on same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      appEvents.on('scan:completed', handler1);
      appEvents.on('scan:completed', handler2);

      appEvents.emit('scan:completed', { resultIndex: 0 });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should only unsubscribe the specific handler via off()', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      appEvents.on('scan:completed', handler1);
      appEvents.on('scan:completed', handler2);

      appEvents.off('scan:completed', handler1);
      appEvents.emit('scan:completed', { resultIndex: 0 });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('type safety', () => {
    it('should enforce AppEvents type contract at compile time', () => {
      // This test validates the type contract exists and is usable
      const events: AppEvents = {
        'scan:completed': { resultIndex: 0 },
        'scan:cancelled': { mode: 'batch' },
        'batch:editing-finished': {},
      };
      expect(events['scan:completed'].resultIndex).toBe(0);
      expect(events['scan:cancelled'].mode).toBe('batch');
      expect(events['batch:editing-finished']).toEqual({});
    });
  });
});
