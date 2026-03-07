/**
 * Story 16-7: useScanEventSubscription Tests
 * Story TD-16-5: Updated to read from shared workflow store (AC-2).
 *
 * Verifies that transaction-editor subscribes to scan:completed events
 * and sets up editor state from shared workflow store's pendingTransaction.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { appEvents } from '@shared/events';

// Mock the transaction-editor store
const mockSetTransaction = vi.fn();
const mockSetCreditUsed = vi.fn();
const mockSetAnimateItems = vi.fn();

vi.mock('@features/transaction-editor/store', () => ({
  useTransactionEditorActions: () => ({
    setTransaction: mockSetTransaction,
    setCreditUsed: mockSetCreditUsed,
    setAnimateItems: mockSetAnimateItems,
  }),
}));

// Mock shared workflow store (TD-16-5: replaces @features/scan/store mock)
const makeTx = (merchant = 'Test Store') => ({
  merchant,
  total: 1000,
  date: '2026-03-07',
  category: 'Other' as const,
});

let mockPendingTransaction: ReturnType<typeof makeTx> | null = makeTx();

vi.mock('@shared/stores', () => ({
  getWorkflowState: () => ({
    pendingTransaction: mockPendingTransaction,
  }),
}));

// Import after mocks
import { useScanEventSubscription } from '@features/transaction-editor/hooks/useScanEventSubscription';

describe('useScanEventSubscription', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    appEvents.all.clear();
    mockPendingTransaction = makeTx();
  });

  afterEach(() => {
    appEvents.all.clear();
  });

  it('should set up editor state when scan:completed fires', () => {
    renderHook(() => useScanEventSubscription());

    act(() => {
      appEvents.emit('scan:completed', { resultIndex: 0 });
    });

    expect(mockSetTransaction).toHaveBeenCalledWith(makeTx());
    expect(mockSetCreditUsed).toHaveBeenCalledWith(true);
    expect(mockSetAnimateItems).toHaveBeenCalledWith(true);
  });

  it('should clean up subscription on unmount (AC-4)', () => {
    const { unmount } = renderHook(() => useScanEventSubscription());

    unmount();

    act(() => {
      appEvents.emit('scan:completed', { resultIndex: 0 });
    });

    expect(mockSetTransaction).not.toHaveBeenCalled();
  });

  it('should not set transaction if pendingTransaction is null', () => {
    mockPendingTransaction = null;
    renderHook(() => useScanEventSubscription());

    act(() => {
      appEvents.emit('scan:completed', { resultIndex: 0 });
    });

    expect(mockSetTransaction).not.toHaveBeenCalled();
    expect(mockSetCreditUsed).not.toHaveBeenCalled();
  });
});
