/**
 * History Filters Context — Story 15-7a
 *
 * State management migrated from React Context to Zustand (useHistoryFiltersStore).
 * This file retains types and the HistoryFiltersProvider component for backward
 * compatibility. The Provider is now a thin initialization boundary that resets
 * the Zustand store on mount.
 *
 * All consumers access filters via useHistoryFilters() hook from '@/shared/hooks'.
 *
 * Story 9.19: History Transaction Filters (original)
 * @see docs/sprint-artifacts/epic9/story-9.19-history-transaction-filters.md
 */

import React, { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    useHistoryFiltersStore,
    getDefaultFilterState as storeGetDefaultFilterState,
} from '@/shared/stores/useHistoryFiltersStore';

// ============================================================================
// Types (unchanged — backward compatible)
// ============================================================================

/**
 * Temporal filter state for filtering by time period.
 * Hierarchical: All -> Year -> Quarter -> Month -> Week -> Day
 * Story 9.19: Initial implementation (Year -> Month -> Week -> Day)
 * Story 9.20: Added quarter level for analytics navigation
 */
export interface TemporalFilterState {
    level: 'all' | 'year' | 'quarter' | 'month' | 'week' | 'day';
    year?: string;      // "2024"
    quarter?: string;   // "Q1", "Q2", "Q3", "Q4" (Story 9.20)
    month?: string;     // "2024-12"
    week?: number;      // 1-5 (week within month)
    day?: string;       // "2024-12-15"
    /** Story 14.16: Date range for ISO week filtering (used by Reports navigation) */
    dateRange?: { start: string; end: string }; // "2024-12-30" format
}

/**
 * Category filter state for filtering by spending category.
 * Hierarchical: All -> Store Category -> Item Group -> Subcategory
 *
 * Story 14.13a: Extended to support multi-level drill-down filters.
 * - drillDownPath: Accumulated context from analytics drill-down navigation
 * - Allows filtering by store category AND item group simultaneously
 */
export interface CategoryFilterState {
    level: 'all' | 'category' | 'group' | 'subcategory';
    category?: string;    // Store category (e.g., "Supermarket")
    group?: string;       // Item group (e.g., "Produce")
    subcategory?: string; // Item subcategory (e.g., "Fruits")

    /**
     * Story 14.13a: Accumulated drill-down path from TrendsView navigation.
     * Contains all filter dimensions from the drill-down hierarchy.
     * When present, enables multi-dimension filtering (e.g., items in "Supermercado" + "Alimentos Frescos").
     */
    drillDownPath?: {
        storeGroup?: string;     // Store category group (e.g., "food-dining")
        storeCategory?: string;  // Store category (e.g., "Supermercado")
        itemGroup?: string;      // Item category group (e.g., "food-fresh")
        itemCategory?: string;   // Item category (e.g., "Carnes y Mariscos")
        subcategory?: string;    // Subcategory (e.g., "Res")
    };
}

/**
 * Location filter state for filtering by country/city.
 * Two-level hierarchy: Country -> City
 *
 * Story 14.36: Extended to support multi-select cities from multiple countries.
 * - selectedCities: Comma-separated city codes (e.g., "santiago,mendoza,lima")
 * - When selectedCities is present, it takes priority over legacy city field
 * - country field is used for display purposes (primary country)
 */
export interface LocationFilterState {
    country?: string;   // "Chile" - Primary country for display
    city?: string;      // "Santiago" - Legacy single-city selection
    /** Story 14.36: Comma-separated city codes for multi-select */
    selectedCities?: string;
}

/**
 * Complete history filter state.
 */
export interface HistoryFilterState {
    temporal: TemporalFilterState;
    category: CategoryFilterState;
    location: LocationFilterState;
}

/**
 * Filter actions for the history reducer.
 */
export type HistoryFilterAction =
    | { type: 'SET_TEMPORAL_FILTER'; payload: TemporalFilterState }
    | { type: 'SET_CATEGORY_FILTER'; payload: CategoryFilterState }
    | { type: 'SET_LOCATION_FILTER'; payload: LocationFilterState }
    | { type: 'CLEAR_TEMPORAL' }
    | { type: 'CLEAR_CATEGORY' }
    | { type: 'CLEAR_LOCATION' }
    | { type: 'CLEAR_ALL_FILTERS' };

/**
 * @deprecated Story 15-7a: Context replaced by Zustand store (useHistoryFiltersStore).
 * Use useHistoryFilters() hook from '@/shared/hooks'.
 */
export interface HistoryFiltersContextValue {
    state: HistoryFilterState;
    dispatch: React.Dispatch<HistoryFilterAction>;
}

// ============================================================================
// Deprecated Context (kept for type compatibility)
// ============================================================================

/**
 * @deprecated Story 15-7a: Use useHistoryFilters() hook instead of useContext().
 * Kept as null export for backward-compatible imports.
 */
export const HistoryFiltersContext = null as unknown as React.Context<HistoryFiltersContextValue | null>;

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

    // Synchronous initialization on first render (matches useReducer semantics)
    if (!initializedRef.current) {
        useHistoryFiltersStore.getState().initializeFilters(
            initialState ?? storeGetDefaultFilterState()
        );
        initializedRef.current = true;
    }

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

// ============================================================================
// Action Creators (unchanged — backward compatible)
// ============================================================================

/**
 * Creates a SET_TEMPORAL_FILTER action.
 */
export function setTemporalFilter(payload: TemporalFilterState): HistoryFilterAction {
    return { type: 'SET_TEMPORAL_FILTER', payload };
}

/**
 * Creates a SET_CATEGORY_FILTER action.
 */
export function setCategoryFilter(payload: CategoryFilterState): HistoryFilterAction {
    return { type: 'SET_CATEGORY_FILTER', payload };
}

/**
 * Creates a SET_LOCATION_FILTER action.
 */
export function setLocationFilter(payload: LocationFilterState): HistoryFilterAction {
    return { type: 'SET_LOCATION_FILTER', payload };
}

/**
 * Creates a CLEAR_ALL_FILTERS action.
 */
export function clearAllFilters(): HistoryFilterAction {
    return { type: 'CLEAR_ALL_FILTERS' };
}
