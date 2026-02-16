/**
 * useBatchSession Hook Tests
 *
 * Story 10.7: Batch Mode Summary
 * Tests the batch session tracking hook for multi-receipt scanning.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBatchSession } from '@features/batch-review/hooks/useBatchSession';
import { Transaction } from '@/types/transaction';
import { Insight } from '@/types/insight';

// Mock transaction factory
function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `tx-${Date.now()}-${Math.random()}`,
    merchant: 'Test Store',
    date: '2025-12-19',
    total: 10000,
    category: 'Supermarket',
    items: [],
    ...overrides,
  };
}

// Mock insight factory
function createMockInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'test_insight',
    category: 'QUIRKY_FIRST',
    title: 'Test Insight',
    message: 'This is a test insight',
    priority: 5,
    ...overrides,
  };
}

describe('useBatchSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with null session and isBatchMode false', () => {
      const { result } = renderHook(() => useBatchSession());

      expect(result.current.session).toBeNull();
      expect(result.current.isBatchMode).toBe(false);
    });
  });

  describe('addToBatch', () => {
    it('should create a new session when adding first receipt', () => {
      const { result } = renderHook(() => useBatchSession());
      const tx = createMockTransaction({ total: 5000 });

      act(() => {
        result.current.addToBatch(tx, null);
      });

      expect(result.current.session).not.toBeNull();
      expect(result.current.session?.receipts).toHaveLength(1);
      expect(result.current.session?.receipts[0]).toEqual(tx);
      expect(result.current.session?.totalAmount).toBe(5000);
      expect(result.current.session?.insights).toHaveLength(0);
    });

    it('should add insight to session when provided', () => {
      const { result } = renderHook(() => useBatchSession());
      const tx = createMockTransaction();
      const insight = createMockInsight();

      act(() => {
        result.current.addToBatch(tx, insight);
      });

      expect(result.current.session?.insights).toHaveLength(1);
      expect(result.current.session?.insights[0]).toEqual(insight);
    });

    it('should accumulate receipts in existing session', () => {
      const { result } = renderHook(() => useBatchSession());
      const tx1 = createMockTransaction({ total: 5000 });
      const tx2 = createMockTransaction({ total: 7000 });

      act(() => {
        result.current.addToBatch(tx1, null);
        result.current.addToBatch(tx2, null);
      });

      expect(result.current.session?.receipts).toHaveLength(2);
      expect(result.current.session?.totalAmount).toBe(12000);
    });

    it('should accumulate insights when provided', () => {
      const { result } = renderHook(() => useBatchSession());
      const tx1 = createMockTransaction();
      const tx2 = createMockTransaction();
      const insight1 = createMockInsight({ id: 'insight_1' });
      const insight2 = createMockInsight({ id: 'insight_2' });

      act(() => {
        result.current.addToBatch(tx1, insight1);
        result.current.addToBatch(tx2, insight2);
      });

      expect(result.current.session?.insights).toHaveLength(2);
    });

    it('should set isBatchMode true when 3+ receipts added (AC #1)', () => {
      const { result } = renderHook(() => useBatchSession());

      act(() => {
        result.current.addToBatch(createMockTransaction(), null);
        result.current.addToBatch(createMockTransaction(), null);
      });

      expect(result.current.isBatchMode).toBe(false);

      act(() => {
        result.current.addToBatch(createMockTransaction(), null);
      });

      expect(result.current.isBatchMode).toBe(true);
    });
  });

  describe('clearBatch', () => {
    it('should reset session to null', () => {
      const { result } = renderHook(() => useBatchSession());

      act(() => {
        result.current.addToBatch(createMockTransaction(), null);
        result.current.addToBatch(createMockTransaction(), null);
        result.current.addToBatch(createMockTransaction(), null);
      });

      expect(result.current.session).not.toBeNull();
      expect(result.current.isBatchMode).toBe(true);

      act(() => {
        result.current.clearBatch();
      });

      expect(result.current.session).toBeNull();
      expect(result.current.isBatchMode).toBe(false);
    });
  });

  describe('session timeout', () => {
    it('should start new session if previous expired (30 min timeout)', () => {
      const { result } = renderHook(() => useBatchSession());
      const tx1 = createMockTransaction({ id: 'tx-1', total: 5000 });

      act(() => {
        result.current.addToBatch(tx1, null);
      });

      const originalStartedAt = result.current.session?.startedAt;
      expect(result.current.session?.totalAmount).toBe(5000);

      // Advance time by 31 minutes (past the 30 minute timeout)
      act(() => {
        vi.advanceTimersByTime(31 * 60 * 1000);
      });

      // Add new transaction - should start fresh session
      const tx2 = createMockTransaction({ id: 'tx-2', total: 7000 });
      act(() => {
        result.current.addToBatch(tx2, null);
      });

      // Should be new session with only tx2
      expect(result.current.session?.receipts).toHaveLength(1);
      expect(result.current.session?.receipts[0].id).toBe('tx-2');
      expect(result.current.session?.totalAmount).toBe(7000);
      expect(result.current.session?.startedAt).not.toEqual(originalStartedAt);
    });

    it('should keep session if within timeout window', () => {
      const { result } = renderHook(() => useBatchSession());

      act(() => {
        result.current.addToBatch(createMockTransaction({ total: 5000 }), null);
      });

      // Advance time by 20 minutes (within 30 minute timeout)
      act(() => {
        vi.advanceTimersByTime(20 * 60 * 1000);
      });

      act(() => {
        result.current.addToBatch(createMockTransaction({ total: 3000 }), null);
      });

      // Should still be same session with accumulated total
      expect(result.current.session?.receipts).toHaveLength(2);
      expect(result.current.session?.totalAmount).toBe(8000);
    });

    it('should auto-clear session via useEffect after timeout expires', () => {
      const { result } = renderHook(() => useBatchSession());

      act(() => {
        result.current.addToBatch(createMockTransaction({ total: 5000 }), null);
      });

      expect(result.current.session).not.toBeNull();

      // Advance time past the 30 minute timeout - this triggers the setTimeout cleanup
      act(() => {
        vi.advanceTimersByTime(30 * 60 * 1000 + 1);
      });

      // The useEffect timer should have cleared the session
      expect(result.current.session).toBeNull();
    });
  });

  describe('batch threshold constant', () => {
    it('should use BATCH_THRESHOLD of 3 receipts', () => {
      const { result } = renderHook(() => useBatchSession());

      // Add 2 receipts - not batch mode
      act(() => {
        result.current.addToBatch(createMockTransaction(), null);
        result.current.addToBatch(createMockTransaction(), null);
      });
      expect(result.current.isBatchMode).toBe(false);

      // Add 3rd receipt - enters batch mode
      act(() => {
        result.current.addToBatch(createMockTransaction(), null);
      });
      expect(result.current.isBatchMode).toBe(true);
    });
  });
});
