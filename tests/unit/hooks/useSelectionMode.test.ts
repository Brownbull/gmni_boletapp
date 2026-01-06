/**
 * useSelectionMode Hook Tests
 *
 * Story 14.15b: Transaction Selection Mode & Groups (AC #1, #2)
 * Tests for transaction selection mode state management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelectionMode } from '../../../src/hooks/useSelectionMode';

// ============================================================================
// Basic State Tests
// ============================================================================

describe('useSelectionMode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('starts with selection mode disabled', () => {
      const { result } = renderHook(() => useSelectionMode());

      expect(result.current.isSelectionMode).toBe(false);
    });

    it('starts with no selections', () => {
      const { result } = renderHook(() => useSelectionMode());

      expect(result.current.selectedCount).toBe(0);
      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  describe('enterSelectionMode', () => {
    it('enables selection mode', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode();
      });

      expect(result.current.isSelectionMode).toBe(true);
    });

    it('selects initial transaction when provided', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode('tx-123');
      });

      expect(result.current.isSelectionMode).toBe(true);
      expect(result.current.selectedIds.has('tx-123')).toBe(true);
      expect(result.current.selectedCount).toBe(1);
    });

    it('does not select if no initial ID provided', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode();
      });

      expect(result.current.isSelectionMode).toBe(true);
      expect(result.current.selectedCount).toBe(0);
    });
  });

  describe('exitSelectionMode', () => {
    it('disables selection mode', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode('tx-1');
      });

      expect(result.current.isSelectionMode).toBe(true);

      act(() => {
        result.current.exitSelectionMode();
      });

      expect(result.current.isSelectionMode).toBe(false);
    });

    it('clears all selections', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode('tx-1');
        result.current.toggleSelection('tx-2');
        result.current.toggleSelection('tx-3');
      });

      expect(result.current.selectedCount).toBe(3);

      act(() => {
        result.current.exitSelectionMode();
      });

      expect(result.current.selectedCount).toBe(0);
      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  describe('toggleSelection', () => {
    it('adds unselected transaction to selection', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode();
        result.current.toggleSelection('tx-123');
      });

      expect(result.current.isSelected('tx-123')).toBe(true);
      expect(result.current.selectedCount).toBe(1);
    });

    it('removes selected transaction from selection', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode('tx-123');
      });

      expect(result.current.isSelected('tx-123')).toBe(true);

      act(() => {
        result.current.toggleSelection('tx-123');
      });

      expect(result.current.isSelected('tx-123')).toBe(false);
      expect(result.current.selectedCount).toBe(0);
    });

    it('handles multiple toggles correctly', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode();
        result.current.toggleSelection('tx-1');
        result.current.toggleSelection('tx-2');
        result.current.toggleSelection('tx-3');
      });

      expect(result.current.selectedCount).toBe(3);

      act(() => {
        result.current.toggleSelection('tx-2');
      });

      expect(result.current.selectedCount).toBe(2);
      expect(result.current.isSelected('tx-1')).toBe(true);
      expect(result.current.isSelected('tx-2')).toBe(false);
      expect(result.current.isSelected('tx-3')).toBe(true);
    });
  });

  describe('selectAll', () => {
    it('selects all provided IDs', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode();
        result.current.selectAll(['tx-1', 'tx-2', 'tx-3', 'tx-4']);
      });

      expect(result.current.selectedCount).toBe(4);
      expect(result.current.isSelected('tx-1')).toBe(true);
      expect(result.current.isSelected('tx-2')).toBe(true);
      expect(result.current.isSelected('tx-3')).toBe(true);
      expect(result.current.isSelected('tx-4')).toBe(true);
    });

    it('replaces existing selection', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode();
        result.current.toggleSelection('tx-old-1');
        result.current.toggleSelection('tx-old-2');
      });

      expect(result.current.selectedCount).toBe(2);

      act(() => {
        result.current.selectAll(['tx-new-1', 'tx-new-2', 'tx-new-3']);
      });

      expect(result.current.selectedCount).toBe(3);
      expect(result.current.isSelected('tx-old-1')).toBe(false);
      expect(result.current.isSelected('tx-old-2')).toBe(false);
      expect(result.current.isSelected('tx-new-1')).toBe(true);
    });
  });

  describe('clearSelection', () => {
    it('clears all selections', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode();
        result.current.selectAll(['tx-1', 'tx-2', 'tx-3']);
      });

      expect(result.current.selectedCount).toBe(3);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedCount).toBe(0);
    });

    it('stays in selection mode after clearing', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode('tx-1');
        result.current.clearSelection();
      });

      expect(result.current.isSelectionMode).toBe(true);
      expect(result.current.selectedCount).toBe(0);
    });
  });

  describe('isSelected', () => {
    it('returns true for selected transactions', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode('tx-123');
      });

      expect(result.current.isSelected('tx-123')).toBe(true);
    });

    it('returns false for unselected transactions', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode('tx-123');
      });

      expect(result.current.isSelected('tx-456')).toBe(false);
    });
  });

  describe('getSelectedArray', () => {
    it('returns array of selected IDs', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.enterSelectionMode();
        result.current.toggleSelection('tx-1');
        result.current.toggleSelection('tx-2');
        result.current.toggleSelection('tx-3');
      });

      const array = result.current.getSelectedArray();

      expect(array).toHaveLength(3);
      expect(array).toContain('tx-1');
      expect(array).toContain('tx-2');
      expect(array).toContain('tx-3');
    });

    it('returns empty array when nothing selected', () => {
      const { result } = renderHook(() => useSelectionMode());

      expect(result.current.getSelectedArray()).toHaveLength(0);
    });
  });

  describe('Long Press Handlers', () => {
    it('enters selection mode after long press duration', () => {
      const { result } = renderHook(() => useSelectionMode());

      expect(result.current.isSelectionMode).toBe(false);

      act(() => {
        result.current.handleLongPressStart('tx-123');
      });

      // Before timeout - should not be in selection mode
      expect(result.current.isSelectionMode).toBe(false);

      // Advance time past LONG_PRESS_DURATION (500ms)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isSelectionMode).toBe(true);
      expect(result.current.isSelected('tx-123')).toBe(true);
    });

    it('cancels long press when handleLongPressEnd is called', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.handleLongPressStart('tx-123');
      });

      // Cancel before timeout
      act(() => {
        vi.advanceTimersByTime(200);
        result.current.handleLongPressEnd();
      });

      // Advance past original timeout
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isSelectionMode).toBe(false);
    });

    it('cancels long press when handleLongPressMove is called', () => {
      const { result } = renderHook(() => useSelectionMode());

      act(() => {
        result.current.handleLongPressStart('tx-123');
      });

      // Simulate scrolling
      act(() => {
        vi.advanceTimersByTime(200);
        result.current.handleLongPressMove();
      });

      // Advance past original timeout
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isSelectionMode).toBe(false);
    });

    it('does not start new long press if already in selection mode', () => {
      const { result } = renderHook(() => useSelectionMode());

      // Enter selection mode
      act(() => {
        result.current.enterSelectionMode('tx-1');
      });

      // Try to start long press for different transaction
      act(() => {
        result.current.handleLongPressStart('tx-2');
        vi.advanceTimersByTime(500);
      });

      // Should only have original selection
      expect(result.current.selectedCount).toBe(1);
      expect(result.current.isSelected('tx-1')).toBe(true);
      expect(result.current.isSelected('tx-2')).toBe(false);
    });
  });
});
