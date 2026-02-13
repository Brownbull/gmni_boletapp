/**
 * History Filters Context — Story 15-7a, 15-TD-7
 *
 * State management migrated from React Context to Zustand (useHistoryFiltersStore).
 * Types extracted to src/types/historyFilters.ts (Story 15-TD-7).
 *
 * This file retains only:
 * - HistoryFiltersProvider (thin initialization boundary)
 * - getDefaultFilterState (re-exported from store)
 * - Deprecated null context export (backward compat)
 *
 * All consumers access filters via useHistoryFilters() hook from '@/shared/hooks'.
 *
 * Story 9.19: History Transaction Filters (original)
 * @see docs/sprint-artifacts/epic9/story-9.19-history-transaction-filters.md
 */

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    useHistoryFiltersStore,
    getDefaultFilterState as storeGetDefaultFilterState,
} from '@/shared/stores/useHistoryFiltersStore';
import type { HistoryFilterState } from '@/types/historyFilters';

// ============================================================================
// Default State (re-exported from store)
// ============================================================================

/**
 * Get default filter state.
 * Story 14.13b: Default temporal filter is current month (not "all time").
 */
export const getDefaultFilterState = storeGetDefaultFilterState;

// ============================================================================
// Provider Component (thin Zustand initialization boundary)
// ============================================================================

interface HistoryFiltersProviderProps {
    children: React.ReactNode;
    /**
     * Optional initial state. Applied on mount only (same as useReducer).
     */
    initialState?: HistoryFilterState;
    /**
     * Story 14.13b: Callback when filter state changes.
     * Used to sync filter state to parent (App.tsx) for persistence across navigation.
     */
    onStateChange?: (state: HistoryFilterState) => void;
}

/**
 * History Filters Provider Component
 *
 * Story 15-7a: Now a thin wrapper that initializes the Zustand store on mount.
 * The Context + useReducer pattern has been replaced by useHistoryFiltersStore.
 *
 * @example
 * <HistoryFiltersProvider>
 *   <HistoryView />
 * </HistoryFiltersProvider>
 */
export function HistoryFiltersProvider({
    children,
    initialState,
    onStateChange,
}: HistoryFiltersProviderProps): React.ReactElement {
    const initializedRef = useRef(false);

    // Story 15-TD-7: Moved from render-phase side effect to useLayoutEffect.
    // useLayoutEffect fires after children render but before browser paint.
    // Children may briefly see default state if initialState differs from defaults,
    // but the update applies before the user sees anything (no visual flash).
    useLayoutEffect(() => {
        if (!initializedRef.current) {
            useHistoryFiltersStore.getState().initializeFilters(
                initialState ?? storeGetDefaultFilterState()
            );
            initializedRef.current = true;
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: initialize once on mount only

    // Sync state changes to parent (backward compat with onStateChange prop)
    const state = useHistoryFiltersStore(
        useShallow((s) => ({ temporal: s.temporal, category: s.category, location: s.location }))
    );

    useEffect(() => {
        if (initializedRef.current && onStateChange) {
            onStateChange(state);
        }
    }, [state, onStateChange]);

    return <>{children}</>;
}
