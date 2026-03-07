/**
 * Story 16-7: useBatchReviewEventSubscription Tests
 * Story TD-16-5: Renamed from review:saved to batch:editing-finished (AC-3).
 *
 * Verifies that batch-review subscribes to batch:editing-finished events
 * and calls local finishEditing action.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { appEvents } from '@shared/events';

// Mock batch-review store
const { mockFinishEditing } = vi.hoisted(() => ({
  mockFinishEditing: vi.fn(),
}));

vi.mock('@features/batch-review', () => ({
  batchReviewActions: {
    finishEditing: mockFinishEditing,
  },
}));

// Import after mocks
import { useBatchReviewEventSubscription } from '@features/batch-review/hooks/useBatchReviewEventSubscription';

describe('useBatchReviewEventSubscription', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    appEvents.all.clear();
  });

  afterEach(() => {
    appEvents.all.clear();
  });

  it('should call finishEditing when batch:editing-finished fires', () => {
    renderHook(() => useBatchReviewEventSubscription());

    act(() => {
      appEvents.emit('batch:editing-finished', {});
    });

    expect(mockFinishEditing).toHaveBeenCalledTimes(1);
  });

  it('should clean up subscription on unmount (AC-4)', () => {
    const { unmount } = renderHook(() => useBatchReviewEventSubscription());

    unmount();

    act(() => {
      appEvents.emit('batch:editing-finished', {});
    });

    expect(mockFinishEditing).not.toHaveBeenCalled();
  });
});
