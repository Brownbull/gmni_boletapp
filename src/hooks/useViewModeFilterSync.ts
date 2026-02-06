/**
 * Story 14d-v2-1-10d: Sync filters when view mode changes
 *
 * Watches view mode changes and calls a callback.
 * Used to auto-clear filters on mode switch.
 *
 * This hook:
 * - Watches the current view mode (personal/group)
 * - Calls the provided callback when mode actually changes
 * - Does NOT call on initial mount (only on actual mode changes)
 *
 * Architecture Reference:
 * - Story 14d-v2-1-10d: History Filters and View Mode Integration
 * - AC#3: Filters cleared when switching modes
 * - AC#5: Filters cleared but scroll position preserved
 */

import { useEffect, useRef } from 'react';
import { useViewModeMode } from '@/shared/stores/useViewModeStore';

/**
 * Hook to sync actions when view mode changes.
 *
 * @param onModeChange - Callback called when mode changes (not on initial mount)
 *
 * @example
 * ```tsx
 * // In HistoryFiltersProvider
 * const handleModeChange = useCallback(() => {
 *   dispatch({ type: 'CLEAR_ALL_FILTERS' });
 * }, []);
 *
 * useViewModeFilterSync(handleModeChange);
 * ```
 */
export function useViewModeFilterSync(onModeChange: () => void): void {
  const mode = useViewModeMode();
  const prevModeRef = useRef(mode);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    // Skip first mount - we don't want to clear filters when the component mounts
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevModeRef.current = mode;
      return;
    }

    // Check if mode actually changed
    if (prevModeRef.current !== mode) {
      onModeChange();
      prevModeRef.current = mode;
    }
  }, [mode, onModeChange]);
}
