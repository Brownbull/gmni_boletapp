/**
 * Story 18-13b: usePendingScan hook tests
 *
 * Tests the Firestore listener, status transitions, cancel resolution,
 * and retry flow for the async scan pipeline.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePendingScan } from '@features/scan/hooks/usePendingScan';

// Mock firebase/firestore
const mockOnSnapshot = vi.fn();
const mockDeleteDoc = vi.fn();
const mockRunTransaction = vi.fn();
const mockDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
}));

vi.mock('@/config/firebase', () => ({
  db: { type: 'firestore' },
}));

// Mock scan store
const mockClearPendingScan = vi.fn();
const mockSetPendingScanStatus = vi.fn();
const mockSetOverlayError = vi.fn();
const mockResetOverlay = vi.fn();

vi.mock('@features/scan/store', () => ({
  scanActions: {
    clearPendingScan: (...args: unknown[]) => mockClearPendingScan(...args),
    setPendingScanStatus: (...args: unknown[]) => mockSetPendingScanStatus(...args),
    setOverlayError: (...args: unknown[]) => mockSetOverlayError(...args),
    resetOverlay: (...args: unknown[]) => mockResetOverlay(...args),
  },
}));

describe('usePendingScan', () => {
  const defaultProps = {
    scanId: 'scan-123',
    userId: 'user-456',
    onCompleted: vi.fn(),
    t: (key: string) => key,
  };

  let unsubscribeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    unsubscribeMock = vi.fn();
    mockOnSnapshot.mockReturnValue(unsubscribeMock);
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: (tx: unknown) => Promise<void>) => {
      const txMock = {
        get: vi.fn().mockResolvedValue({ exists: () => true }),
        delete: vi.fn(),
      };
      return fn(txMock);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribes to Firestore doc when scanId is provided', () => {
    renderHook(() => usePendingScan(defaultProps));

    expect(mockDoc).toHaveBeenCalledWith({ type: 'firestore' }, 'pending_scans', 'scan-123');
    expect(mockOnSnapshot).toHaveBeenCalled();
  });

  it('does not subscribe when scanId is null', () => {
    renderHook(() => usePendingScan({ ...defaultProps, scanId: null }));

    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount (AC-ARCH-PATTERN-4)', () => {
    const { unmount } = renderHook(() => usePendingScan(defaultProps));

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('calls onCompleted with mapped ScanResult when status=completed', () => {
    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      callback({
        exists: () => true,
        data: () => ({
          userId: 'user-456',
          status: 'completed',
          creditDeducted: true,
          result: {
            transactionId: 'tx-789',
            merchant: 'Test Store',
            date: '2026-03-17',
            total: 1500,
            category: 'Supermercado',
            items: [{ name: 'Item 1', totalPrice: 1500 }],
            imageUrls: ['url1'],
            thumbnailUrl: 'thumb1',
            promptVersion: 'v4',
            merchantSource: 'scan',
          },
          imageUrls: ['url1'],
        }),
      });
      return unsubscribeMock;
    });

    renderHook(() => usePendingScan(defaultProps));

    expect(defaultProps.onCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ merchant: 'Test Store', total: 1500, date: '2026-03-17' }),
      ['url1']
    );
    expect(mockClearPendingScan).toHaveBeenCalled();
  });

  it('rejects completed scan when creditDeducted is false', () => {
    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      callback({
        exists: () => true,
        data: () => ({
          userId: 'user-456',
          status: 'completed',
          creditDeducted: false,
          result: { merchant: 'Store', items: [] },
          imageUrls: ['url1'],
        }),
      });
      return unsubscribeMock;
    });

    renderHook(() => usePendingScan(defaultProps));

    expect(defaultProps.onCompleted).not.toHaveBeenCalled();
    expect(mockSetOverlayError).toHaveBeenCalledWith('api', 'scanError');
  });

  it('shows error overlay when status=failed', () => {
    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      callback({
        exists: () => true,
        data: () => ({
          userId: 'user-456',
          status: 'failed',
          error: 'Gemini API error',
        }),
      });
      return unsubscribeMock;
    });

    renderHook(() => usePendingScan(defaultProps));

    expect(mockSetOverlayError).toHaveBeenCalledWith('api', 'Gemini API error');
  });

  it('treats past-deadline processing as timeout', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-17T12:00:00Z'));

    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      callback({
        exists: () => true,
        data: () => ({
          userId: 'user-456',
          status: 'processing',
          processingDeadline: { toMillis: () => new Date('2026-03-17T11:59:00Z').getTime() },
        }),
      });
      return unsubscribeMock;
    });

    renderHook(() => usePendingScan(defaultProps));

    expect(mockSetOverlayError).toHaveBeenCalledWith('timeout', 'scanTimeout');
    vi.useRealTimers();
  });

  it('clears state when doc is deleted', () => {
    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      callback({ exists: () => false });
      return unsubscribeMock;
    });

    renderHook(() => usePendingScan(defaultProps));

    expect(mockClearPendingScan).toHaveBeenCalled();
  });

  it('cancelPendingScan deletes doc and clears state', async () => {
    const { result } = renderHook(() => usePendingScan(defaultProps));

    await act(async () => {
      await result.current.cancelPendingScan();
    });

    expect(mockRunTransaction).toHaveBeenCalled();
    expect(mockClearPendingScan).toHaveBeenCalled();
    expect(mockResetOverlay).toHaveBeenCalled();
  });

  it('retryPendingScan clears state for re-initiation', () => {
    const { result } = renderHook(() => usePendingScan(defaultProps));

    act(() => {
      result.current.retryPendingScan();
    });

    expect(mockClearPendingScan).toHaveBeenCalled();
    expect(mockResetOverlay).toHaveBeenCalled();
  });

  it('handles listener errors gracefully', () => {
    mockOnSnapshot.mockImplementation((_ref: unknown, _callback: unknown, errorCallback: (err: Error) => void) => {
      errorCallback(new Error('Permission denied'));
      return unsubscribeMock;
    });

    renderHook(() => usePendingScan(defaultProps));

    expect(mockSetOverlayError).toHaveBeenCalledWith('api', 'Permission denied');
  });

  it('cancelPendingScan skips deletion when doc already resolved', async () => {
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: (tx: unknown) => Promise<void>) => {
      const txMock = {
        get: vi.fn().mockResolvedValue({ exists: () => false }),
        delete: vi.fn(),
      };
      await fn(txMock);
      // delete should NOT have been called since doc doesn't exist
      expect(txMock.delete).not.toHaveBeenCalled();
    });

    const { result } = renderHook(() => usePendingScan(defaultProps));

    await act(async () => {
      await result.current.cancelPendingScan();
    });

    expect(mockRunTransaction).toHaveBeenCalled();
    expect(mockClearPendingScan).toHaveBeenCalled();
  });

  it('ignores docs owned by different user', () => {
    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      callback({
        exists: () => true,
        data: () => ({
          userId: 'other-user',
          status: 'completed',
          result: { merchant: 'Store' },
        }),
      });
      return unsubscribeMock;
    });

    renderHook(() => usePendingScan(defaultProps));

    expect(defaultProps.onCompleted).not.toHaveBeenCalled();
  });
});
