/**
 * Story 18-13b: useScanLock hook tests
 *
 * Tests FAB lock state based on pending scans in Firestore.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScanLock } from '@features/scan/hooks/useScanLock';

// Mock firebase/firestore
const mockOnSnapshot = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

vi.mock('@/config/firebase', () => ({
  db: { type: 'firestore' },
}));

describe('useScanLock', () => {
  let unsubscribeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    unsubscribeMock = vi.fn();
    mockOnSnapshot.mockReturnValue(unsubscribeMock);
    mockCollection.mockReturnValue('pending_scans_ref');
    mockQuery.mockReturnValue('query_ref');
    mockWhere.mockReturnValue('where_clause');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns isLocked=false when no pending scans', () => {
    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      callback({ empty: true, docs: [] });
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useScanLock('user-123'));

    expect(result.current.isLocked).toBe(false);
    expect(result.current.pendingScan).toBeNull();
  });

  it('returns isLocked=true when processing scan exists', () => {
    const pendingData = {
      scanId: 'scan-456',
      userId: 'user-123',
      status: 'processing',
      createdAt: { toMillis: () => Date.now() },
    };

    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      callback({
        empty: false,
        docs: [{ id: 'scan-456', data: () => pendingData }],
      });
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useScanLock('user-123'));

    expect(result.current.isLocked).toBe(true);
    expect(result.current.pendingScan).toBeTruthy();
    expect(result.current.pendingScan?.scanId).toBe('scan-456');
  });

  it('does not subscribe when userId is null', () => {
    const { result } = renderHook(() => useScanLock(null));

    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(result.current.isLocked).toBe(false);
    expect(result.current.pendingScan).toBeNull();
  });

  it('unsubscribes on unmount (AC-ARCH-PATTERN-4)', () => {
    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      callback({ empty: true, docs: [] });
      return unsubscribeMock;
    });

    const { unmount } = renderHook(() => useScanLock('user-123'));

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('queries pending_scans with userId filter', () => {
    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      callback({ empty: true, docs: [] });
      return unsubscribeMock;
    });

    renderHook(() => useScanLock('user-123'));

    expect(mockCollection).toHaveBeenCalledWith({ type: 'firestore' }, 'pending_scans');
    expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-123');
    expect(mockWhere).toHaveBeenCalledWith('status', '==', 'processing');
  });

  it('handles listener errors gracefully', () => {
    mockOnSnapshot.mockImplementation((_ref: unknown, _callback: unknown, errorCallback: (err: Error) => void) => {
      errorCallback(new Error('Permission denied'));
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useScanLock('user-123'));

    expect(result.current.isLocked).toBe(false);
    expect(result.current.pendingScan).toBeNull();
  });

  it('transitions from locked to unlocked when scan resolves', () => {
    let snapshotCallback: ((snap: unknown) => void) | null = null;

    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      snapshotCallback = callback;
      // Initial: locked
      callback({
        empty: false,
        docs: [{ id: 'scan-1', data: () => ({ scanId: 'scan-1', userId: 'user-123', status: 'processing' }) }],
      });
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useScanLock('user-123'));

    expect(result.current.isLocked).toBe(true);

    // Simulate resolution: empty snapshot
    act(() => {
      snapshotCallback?.({ empty: true, docs: [] });
    });

    expect(result.current.isLocked).toBe(false);
    expect(result.current.pendingScan).toBeNull();
  });
});
