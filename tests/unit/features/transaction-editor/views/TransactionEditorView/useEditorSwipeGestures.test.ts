/**
 * Tests for useEditorSwipeGestures hook
 *
 * Story 15b-2o: Swipe gesture navigation for batch transaction editing.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useEditorSwipeGestures } from '@features/transaction-editor/views/TransactionEditorView/useEditorSwipeGestures';

function createTouchEvent(clientX: number): React.TouchEvent {
  return {
    targetTouches: [{ clientX }],
  } as unknown as React.TouchEvent;
}

describe('useEditorSwipeGestures', () => {
  const defaultProps = {
    batchContext: { index: 2, total: 5 },
    onBatchPrevious: vi.fn(),
    onBatchNext: vi.fn(),
    transactionId: 'tx-1',
  };

  it('returns initial state with offset=0 and fadeInKey=0', () => {
    const { result } = renderHook(() => useEditorSwipeGestures(defaultProps));

    expect(result.current.swipeOffset).toBe(0);
    expect(result.current.swipeTouchStart).toBeNull();
    expect(result.current.fadeInKey).toBe(0);
  });

  it('tracks touch start position', () => {
    const { result } = renderHook(() => useEditorSwipeGestures(defaultProps));

    act(() => {
      result.current.handleSwipeTouchStart(createTouchEvent(200));
    });

    expect(result.current.swipeOffset).toBe(0);
  });

  it('tracks swipe offset during touch move', () => {
    const { result } = renderHook(() => useEditorSwipeGestures(defaultProps));

    act(() => {
      result.current.handleSwipeTouchStart(createTouchEvent(200));
    });
    act(() => {
      result.current.handleSwipeTouchMove(createTouchEvent(150));
    });

    expect(result.current.swipeOffset).toBe(-50);
  });

  it('triggers onBatchNext on left swipe past threshold', () => {
    const onBatchNext = vi.fn();
    const { result } = renderHook(() =>
      useEditorSwipeGestures({ ...defaultProps, onBatchNext })
    );

    act(() => {
      result.current.handleSwipeTouchStart(createTouchEvent(200));
    });
    act(() => {
      result.current.handleSwipeTouchMove(createTouchEvent(100));
    });
    act(() => {
      result.current.handleSwipeTouchEnd();
    });

    expect(onBatchNext).toHaveBeenCalledOnce();
  });

  it('triggers onBatchPrevious on right swipe past threshold', () => {
    const onBatchPrevious = vi.fn();
    const { result } = renderHook(() =>
      useEditorSwipeGestures({ ...defaultProps, onBatchPrevious })
    );

    act(() => {
      result.current.handleSwipeTouchStart(createTouchEvent(100));
    });
    act(() => {
      result.current.handleSwipeTouchMove(createTouchEvent(200));
    });
    act(() => {
      result.current.handleSwipeTouchEnd();
    });

    expect(onBatchPrevious).toHaveBeenCalledOnce();
  });

  it('applies resistance when swiping past boundaries (first item, swipe right)', () => {
    const { result } = renderHook(() =>
      useEditorSwipeGestures({
        ...defaultProps,
        batchContext: { index: 1, total: 5 }, // First item, can't go previous
      })
    );

    act(() => {
      result.current.handleSwipeTouchStart(createTouchEvent(100));
    });
    act(() => {
      result.current.handleSwipeTouchMove(createTouchEvent(200));
    });

    // 100px movement * 0.2 resistance = 20px
    expect(result.current.swipeOffset).toBe(20);
  });

  it('applies resistance when swiping past boundaries (last item, swipe left)', () => {
    const { result } = renderHook(() =>
      useEditorSwipeGestures({
        ...defaultProps,
        batchContext: { index: 5, total: 5 }, // Last item, can't go next
      })
    );

    act(() => {
      result.current.handleSwipeTouchStart(createTouchEvent(200));
    });
    act(() => {
      result.current.handleSwipeTouchMove(createTouchEvent(100));
    });

    // -100px movement * 0.2 resistance = -20px
    expect(result.current.swipeOffset).toBe(-20);
  });

  it('is a no-op when batchContext is null', () => {
    const onBatchNext = vi.fn();
    const { result } = renderHook(() =>
      useEditorSwipeGestures({
        ...defaultProps,
        batchContext: null,
        onBatchNext,
      })
    );

    act(() => {
      result.current.handleSwipeTouchStart(createTouchEvent(200));
    });
    act(() => {
      result.current.handleSwipeTouchMove(createTouchEvent(100));
    });
    act(() => {
      result.current.handleSwipeTouchEnd();
    });

    expect(result.current.swipeOffset).toBe(0);
    expect(onBatchNext).not.toHaveBeenCalled();
  });

  it('increments fadeInKey on transactionId change', () => {
    const { result, rerender } = renderHook(
      (props) => useEditorSwipeGestures(props),
      { initialProps: defaultProps }
    );

    expect(result.current.fadeInKey).toBe(0);

    rerender({ ...defaultProps, transactionId: 'tx-2' });
    expect(result.current.fadeInKey).toBe(1);

    rerender({ ...defaultProps, transactionId: 'tx-3' });
    expect(result.current.fadeInKey).toBe(2);
  });

  it('does not increment fadeInKey when transactionId stays the same', () => {
    const { result, rerender } = renderHook(
      (props) => useEditorSwipeGestures(props),
      { initialProps: defaultProps }
    );

    expect(result.current.fadeInKey).toBe(0);

    rerender({ ...defaultProps, transactionId: 'tx-1' });
    expect(result.current.fadeInKey).toBe(0);
  });

  it('resets swipe state on touch end', () => {
    const { result } = renderHook(() => useEditorSwipeGestures(defaultProps));

    act(() => {
      result.current.handleSwipeTouchStart(createTouchEvent(200));
    });
    act(() => {
      result.current.handleSwipeTouchMove(createTouchEvent(170));
    });
    act(() => {
      result.current.handleSwipeTouchEnd();
    });

    expect(result.current.swipeOffset).toBe(0);
    expect(result.current.swipeTouchStart).toBeNull();
  });

  it('does not trigger navigation when swipe distance is below threshold', () => {
    const onBatchNext = vi.fn();
    const { result } = renderHook(() =>
      useEditorSwipeGestures({ ...defaultProps, onBatchNext })
    );

    act(() => {
      result.current.handleSwipeTouchStart(createTouchEvent(200));
    });
    act(() => {
      result.current.handleSwipeTouchMove(createTouchEvent(170)); // Only 30px, below 50px threshold
    });
    act(() => {
      result.current.handleSwipeTouchEnd();
    });

    expect(onBatchNext).not.toHaveBeenCalled();
  });
});
