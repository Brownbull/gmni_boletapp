# Story 9.19: History Transaction Filters

**Epic:** Epic 9 - Scan Enhancement & Merchant Learning
**Status:** drafted
**Story Points:** 5
**Dependencies:** Story 9.1 (Transaction type has country/city fields)

---

## User Story

**As a** user reviewing my transaction history,
**I want** to filter transactions by time period, category, and location,
**So that** I can quickly find specific transactions without scrolling through pages.

---

## Background

The current HistoryView shows a paginated list of all transactions without any filtering capability. Users with many transactions need a way to narrow down results by:
- **Temporal filters:** Year, month, week, or specific day
- **Category filters:** Store category, item group, or subcategory
- **Location filters:** Country and/or city

This aligns with the existing TrendsView analytics filtering patterns (dual-axis navigation with temporal + category breadcrumbs) but adapted for transaction list filtering rather than aggregate visualization.

---

## Acceptance Criteria

### AC 1: Filter Header UI
- [ ] Filter bar appears below the History title
- [ ] Filter bar has compact collapsed state (icon-only buttons)
- [ ] Filter bar shows active filter count badge when filters applied
- [ ] "Clear all filters" button appears when any filter is active
- [ ] Filter bar follows existing theme CSS variables (--surface, --accent, etc.)

### AC 2: Temporal Filtering
- [ ] Temporal filter dropdown with hierarchical options: Year → Month → Week → Day
- [ ] Default shows "All time" (no temporal filter)
- [ ] Selecting a year shows months within that year
- [ ] Selecting a month shows weeks (W1-W5) within that month
- [ ] Selecting a week shows days within that week
- [ ] Selected temporal range displayed as breadcrumb trail (e.g., "2024 > Dec > W2")
- [ ] Click any breadcrumb segment to go back to that level

### AC 3: Category Filtering
- [ ] Category filter dropdown with hierarchical options: All → Store Category → Item Group → Subcategory
- [ ] Default shows "All categories" (no category filter)
- [ ] Selecting a store category (e.g., "Supermarket") filters to those transactions
- [ ] Selecting an item group filters to transactions containing items in that group
- [ ] Selecting a subcategory filters to transactions containing items in that subcategory
- [ ] Selected category path displayed as breadcrumb trail (e.g., "Supermarket > Produce > Fruits")
- [ ] Categories translated per user language (Story 9.12 pattern)

### AC 4: Location Filtering
- [ ] Location filter dropdown with Country → City hierarchy
- [ ] Default shows "All locations" (no location filter)
- [ ] Country dropdown shows unique countries from transaction data
- [ ] City dropdown shows cities within selected country
- [ ] Selected location displayed (e.g., "Chile > Santiago" or just "Chile")
- [ ] Gracefully handles transactions without location data

### AC 5: Filter Persistence & Behavior
- [ ] Filters apply independently (changing one doesn't reset others)
- [ ] Filtered results update transaction list immediately
- [ ] Pagination resets to page 1 when filters change
- [ ] Total count shows filtered results (e.g., "Showing 15 of 234 transactions")
- [ ] Empty state shows helpful message when no transactions match filters

### AC 6: Mobile Responsiveness
- [ ] Filter bar works on mobile (collapsible/expandable)
- [ ] Touch-friendly targets (minimum 44px)
- [ ] Dropdowns don't overflow screen on mobile
- [ ] Keyboard navigation supported for accessibility

### AC 7: Performance
- [ ] Filters applied client-side (no additional API calls)
- [ ] Filter computation memoized to avoid re-renders
- [ ] Large transaction lists (1000+) filter without noticeable lag

---

## Tasks / Subtasks

### Infrastructure
- [ ] Create `HistoryFiltersContext` for filter state management
- [ ] Define `HistoryFilterState` interface (temporal, category, location)
- [ ] Create `useHistoryFilters` hook with memoized selectors
- [ ] Create `filterTransactionsByHistoryFilters()` utility function

### Temporal Filter Component
- [ ] Create `TemporalFilterDropdown.tsx` component
- [ ] Implement year/month/week/day selection hierarchy
- [ ] Add breadcrumb trail display for selected temporal range
- [ ] Extract available years/months from transaction data

### Category Filter Component
- [ ] Create `CategoryFilterDropdown.tsx` component
- [ ] Implement category/group/subcategory selection hierarchy
- [ ] Add breadcrumb trail display for selected category path
- [ ] Extract unique categories/groups/subcategories from transaction data
- [ ] Integrate with existing category translation (Story 9.12)

### Location Filter Component
- [ ] Create `LocationFilterDropdown.tsx` component
- [ ] Implement country/city selection hierarchy
- [ ] Extract unique countries/cities from transaction data
- [ ] Handle transactions without location data gracefully

### Integration
- [ ] Update `HistoryView.tsx` to include filter bar
- [ ] Wire filter state to transaction list display
- [ ] Add "Clear all filters" functionality
- [ ] Add filtered results count display
- [ ] Add empty state for no matching results

### Translations
- [ ] Add filter-related translation keys (EN)
- [ ] Add filter-related translation keys (ES)

---

## Technical Summary

### New Files

1. **`src/contexts/HistoryFiltersContext.tsx`**
   - State: `{ temporal, category, location }`
   - Actions: SET_TEMPORAL_FILTER, SET_CATEGORY_FILTER, SET_LOCATION_FILTER, CLEAR_ALL_FILTERS
   - Pattern: Follow `AnalyticsContext.tsx` reducer pattern

2. **`src/hooks/useHistoryFilters.ts`**
   - Consumer hook for HistoryFiltersContext
   - Memoized selectors: `hasActiveFilters`, `activeFilterCount`
   - Convenience getters: `temporalLabel`, `categoryLabel`, `locationLabel`

3. **`src/components/history/TemporalFilterDropdown.tsx`**
   - Collapsible dropdown (Calendar icon when collapsed)
   - Hierarchical navigation: Year → Month → Week → Day
   - Pattern: Follow `TemporalBreadcrumb.tsx` UI patterns

4. **`src/components/history/CategoryFilterDropdown.tsx`**
   - Collapsible dropdown (Tag icon when collapsed)
   - Hierarchical navigation: All → Category → Group → Subcategory
   - Pattern: Follow `CategoryBreadcrumb.tsx` UI patterns

5. **`src/components/history/LocationFilterDropdown.tsx`**
   - Collapsible dropdown (MapPin icon when collapsed)
   - Two-level hierarchy: Country → City
   - Show only values present in transaction data

6. **`src/components/history/HistoryFilterBar.tsx`**
   - Container for all filter dropdowns
   - Active filter count badge
   - "Clear all" button
   - Results count display

7. **`src/utils/historyFilterUtils.ts`**
   - `filterTransactionsByHistoryFilters(transactions, filters)` - Main filtering logic
   - `extractAvailableFilters(transactions)` - Get unique values for dropdowns
   - `formatTemporalRange(temporal)` - Format temporal selection for display
   - `formatCategoryPath(category)` - Format category selection for display

### Files to Modify

1. **`src/views/HistoryView.tsx`**
   - Wrap with `HistoryFiltersProvider`
   - Add `HistoryFilterBar` below header
   - Apply filters before pagination
   - Show filtered count

2. **`src/App.tsx`**
   - Pass full transaction list to HistoryView (for filter extraction)
   - No additional props needed if context-based

3. **`src/utils/translations.ts`**
   - Add keys: `allTime`, `allCategories`, `allLocations`, `clearFilters`, `showingResults`, `noMatchingTransactions`
   - Add keys: `filterByTime`, `filterByCategory`, `filterByLocation`

### Filter State Interface

```typescript
interface HistoryFilterState {
  temporal: {
    level: 'all' | 'year' | 'month' | 'week' | 'day';
    year?: string;      // "2024"
    month?: string;     // "2024-12"
    week?: number;      // 1-5
    day?: string;       // "2024-12-15"
  };
  category: {
    level: 'all' | 'category' | 'group' | 'subcategory';
    category?: string;  // "Supermarket"
    group?: string;     // "Produce"
    subcategory?: string; // "Fruits"
  };
  location: {
    country?: string;   // "Chile"
    city?: string;      // "Santiago"
  };
}
```

### Filtering Logic

```typescript
function filterTransactionsByHistoryFilters(
  transactions: Transaction[],
  filters: HistoryFilterState
): Transaction[] {
  return transactions.filter(tx => {
    // Temporal filter
    if (filters.temporal.level !== 'all') {
      if (!matchesTemporalFilter(tx.date, filters.temporal)) return false;
    }

    // Category filter
    if (filters.category.level !== 'all') {
      if (!matchesCategoryFilter(tx, filters.category)) return false;
    }

    // Location filter
    if (filters.location.country) {
      if (tx.country !== filters.location.country) return false;
      if (filters.location.city && tx.city !== filters.location.city) return false;
    }

    return true;
  });
}
```

---

## UI Design Notes

### Filter Bar Layout (Mobile)
```
┌─────────────────────────────────────────────┐
│ History                               [←]   │
├─────────────────────────────────────────────┤
│ [📅 ▼] [🏷️ ▼] [📍 ▼]  [Clear] (3 active)   │
├─────────────────────────────────────────────┤
│ Showing 15 of 234 transactions              │
└─────────────────────────────────────────────┘
```

### Expanded Temporal Dropdown
```
┌─────────────────────────┐
│ All time         ← Back │
├─────────────────────────┤
│ ● 2024                  │
│   2023                  │
│   2022                  │
└─────────────────────────┘
         ↓ (after selecting 2024)
┌─────────────────────────┐
│ 2024             ← Back │
├─────────────────────────┤
│ ● December              │
│   November              │
│   October               │
│   ...                   │
└─────────────────────────┘
```

### No Results State
```
┌─────────────────────────────────────────────┐
│          📭                                 │
│   No transactions match your filters        │
│                                             │
│   [Clear all filters]                       │
└─────────────────────────────────────────────┘
```

---

## Key Code References

**AnalyticsContext Pattern:**
- `src/contexts/AnalyticsContext.tsx` - Reducer pattern, dual-axis state
- `src/hooks/useAnalyticsNavigation.ts` - Memoized selectors

**Breadcrumb Dropdown Pattern:**
- `src/components/analytics/TemporalBreadcrumb.tsx` - Collapsible dropdown UI
- `src/components/analytics/CategoryBreadcrumb.tsx` - Category hierarchy UI

**Filtering Logic Reference:**
- `src/views/TrendsView.tsx:91-146` - `filterTransactionsByNavState()` function

**Theme Pattern:**
- CSS variables: `--surface`, `--primary`, `--secondary`, `--accent`
- Dark mode handling with `isDark` boolean

---

## Out of Scope

- Search by merchant name (future story)
- Date range picker (calendar widget) - using hierarchy instead
- Saved/favorite filters
- Filter presets

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted - History transaction filtering |
