/**
 * Story 16-7: useScanEventSubscription Tests
 *
 * Verifies that transaction-editor subscribes to scan:completed events
 * and sets up editor state from scan store results.
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

// Mock scan store getScanState for synchronous reads
const makeTx = (merchant = 'Test Store') => ({
  merchant,
  total: 1000,
  date: '2026-03-07',
  category: 'Other' as const,
});

let mockScanState = {
  results: [makeTx()],
  activeResultIndex: 0,
};

vi.mock('@features/scan/store', () => ({
  getScanState: () => mockScanState,
}));

// Import after mocks
import { useScanEventSubscription } from '@features/transaction-editor/hooks/useScanEventSubscription';

describe('useScanEventSubscription', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    appEvents.all.clear();
    mockScanState = {
      results: [makeTx()],
      activeResultIndex: 0,
    };
  });

  afterEach(() => {
    appEvents.all.clear();
  });

  it('should set up editor state when scan:completed fires', () => {
    renderHook(() => useScanEventSubscription());

    act(() => {
      appEvents.emit('scan:completed', { transactionIds: [] });
    });

    expect(mockSetTransaction).toHaveBeenCalledWith(makeTx());
    expect(mockSetCreditUsed).toHaveBeenCalledWith(true);
    expect(mockSetAnimateItems).toHaveBeenCalledWith(true);
  });

  it('should clean up subscription on unmount (AC-4)', () => {
    const { unmount } = renderHook(() => useScanEventSubscription());

    unmount();

    act(() => {
      appEvents.emit('scan:completed', { transactionIds: [] });
    });

    expect(mockSetTransaction).not.toHaveBeenCalled();
  });

  it('should not set transaction if scan results are empty', () => {
    mockScanState = { results: [], activeResultIndex: 0 };
    renderHook(() => useScanEventSubscription());

    act(() => {
      appEvents.emit('scan:completed', { transactionIds: [] });
    });

    expect(mockSetTransaction).not.toHaveBeenCalled();
    expect(mockSetCreditUsed).not.toHaveBeenCalled();
  });
});
