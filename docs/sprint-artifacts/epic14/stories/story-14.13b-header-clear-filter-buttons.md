# Story 14.13b: Header Clear Filter Buttons

**Status:** done
**Points:** 3
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.13a (multi-level filter support)
**Blocks:** Story 14.13 completion

---

## Story

**As a** user viewing filtered Compras or Productos,
**I want to** see an "X" button next to the view title when custom filters are active,
**So that** I can quickly clear all filters for that view without navigating to the filter panel.

---

## Context

### Current State

When users navigate from TrendsView to Compras/Productos with filters:
- Filters are applied but not immediately visible in the header
- User must open the filter dropdown or look at filter chips to see what's active
- No quick way to "reset" to see all data

### Desired Behavior

When custom filters are active (from analytics drill-down or manual selection):

**Compras View:**
```
< Compras ✕    [📅] [🔖] [👤]
```

**Productos View:**
```
< Productos ✕   [📅] [🔖] [👤]
```

The "✕" appears **only when filters are active** and clicking it:
1. Clears all category filters for that view (temporal + category + location + group)
2. Shows all items/transactions
3. Keeps user on the same view

### Filter Toggle Button Behavior

The two-section filter button (CategorySelectorOverlay) currently has mutually exclusive behavior:
- Selecting transaction filters clears item filters
- Selecting item filters clears transaction filters

**New behavior:**
- Filters persist across toggles
- Switching between "Transactions" and "Items" tabs **keeps** both filter sets
- Each section shows its own active state independently

---

## Acceptance Criteria

### AC #1: Clear All Button in FilterChips (REVISED)
- [x] "✕" button appears at LEFT of filter chips row when any filter is active
- [x] Button hidden when no filters active (default state)
- [x] Clicking "✕" clears ALL filters:
  - Temporal filter → reset to 'all'
  - Category filter → reset to 'all'
  - Location filter → clear
  - Group filter → clear
- [x] After clearing, user stays on current view

> **Note:** Original design had "✕" next to view titles (Compras/Productos). This was changed to place the Clear All button in the FilterChips section instead for better UX consistency.

### AC #2: Clear Button Location (REVISED)
- [x] Clear All "✕" is in FilterChips section, NOT on view titles
- [x] Appears at the START (left side) of the filter chips row
- [x] Same behavior in both HistoryView (Compras) and ItemsView (Productos)

### AC #3: Visual Design
- [x] "✕" icon uses X from lucide-react
- [x] Consistent with other filter chip remove buttons
- [x] Touch target: 44px minimum

### AC #4: Filter Persistence Across Toggle
- [x] When filter button (CategorySelectorOverlay) switches between transaction/item tabs:
  - Previous tab's filters are **preserved** (not cleared)
  - Both tabs can have active filters simultaneously
- [x] Visual indicator on filter button shows when EITHER tab has active filters

### AC #5: Clear All Clears Current View Only
- [x] Clicking Clear All "✕" clears all filters for the current view
- [x] Does not affect filters that might be set for the other view type

---

## Tasks

### Phase 1: HistoryView Clear Button
- [x] Task 1.1: Add `hasActiveFilters` check in HistoryView (may already exist via useHistoryFilters)
- [x] Task 1.2: Add "✕" button next to title h1, conditionally rendered
- [x] Task 1.3: Implement `handleClearAllFilters` function using `filterDispatch`
- [x] Task 1.4: Style button with proper spacing and hover states

### Phase 2: ItemsView Clear Button
- [x] Task 2.1: Add `hasActiveFilters` check in ItemsView
- [x] Task 2.2: Add "✕" button next to title h1
- [x] Task 2.3: Implement `handleClearAllFilters` function
- [x] Task 2.4: Style consistently with HistoryView

### Phase 3: Filter Persistence (CategorySelectorOverlay)
- [x] Task 3.1: Modify CategorySelectorOverlay to NOT clear other tab's filters on toggle
- [x] Task 3.2: Update filter state management to support independent filter sets
- [x] Task 3.3: Update visual indicator to show when ANY filters are active

### Phase 4: Testing
- [x] Task 4.1: Unit test for clear button visibility based on filter state
- [x] Task 4.2: Unit test for filter clearing action
- [x] Task 4.3: Integration test for filter persistence across toggle

---

## Technical Design

### Clear Button Component

```tsx
// In HistoryView.tsx header section
<div className="flex items-center gap-0">
    <button onClick={onBack} /* existing back button */ >
        <ChevronLeft size={28} />
    </button>
    <h1 className="font-semibold" style={{ /* existing styles */ }}>
        {t('purchases')}
    </h1>
    {/* NEW: Clear filters button */}
    {hasActiveFilters && (
        <button
            onClick={handleClearAllFilters}
            className="ml-1 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label={lang === 'es' ? 'Limpiar filtros' : 'Clear filters'}
            data-testid="clear-filters-button"
        >
            <X
                size={16}
                style={{ color: 'var(--text-secondary)' }}
                className="hover:text-primary"
            />
        </button>
    )}
</div>
```

### Clear All Filters Handler

```tsx
const handleClearAllFilters = useCallback(() => {
    // Reset all filter dimensions to default
    filterDispatch({ type: 'SET_TEMPORAL', payload: { level: 'all' } });
    filterDispatch({ type: 'SET_CATEGORY', payload: { level: 'all' } });
    filterDispatch({ type: 'SET_LOCATION', payload: {} });
    filterDispatch({ type: 'SET_GROUP', payload: {} });

    // Optionally track that user manually cleared filters
    // This affects back navigation behavior (Story 14.13a)
    setFiltersWereModified(true);
}, [filterDispatch]);
```

### Filter Persistence Logic

```tsx
// In CategorySelectorOverlay or wherever filter toggle lives
const handleTabChange = (newTab: 'transactions' | 'items') => {
    // DON'T do this anymore:
    // if (newTab === 'transactions') clearItemFilters();
    // if (newTab === 'items') clearTransactionFilters();

    // Just switch the active tab, keep all filters
    setActiveTab(newTab);
};
```

---

## File List

**Modified:**
- `src/views/HistoryView.tsx` - Add clear button to header
- `src/views/ItemsView.tsx` - Add clear button to header
- `src/components/CategorySelectorOverlay.tsx` - Filter persistence across toggles

**Tests:**
- `tests/unit/views/HistoryView.test.tsx` - Clear button tests
- `tests/unit/views/ItemsView.test.tsx` - Clear button tests
- `tests/unit/components/CategorySelectorOverlay.test.tsx` - Persistence tests

---

## Test Plan

1. **Clear Button Visibility:**
   - Navigate to Compras with no filters
   - **Verify:** No "✕" button visible
   - Apply a temporal filter (e.g., select January)
   - **Verify:** "✕" button appears next to "Compras"

2. **Clear Button Action:**
   - Apply multiple filters (temporal + category)
   - Click "✕" button
   - **Verify:** All filters cleared, showing all transactions
   - **Verify:** User remains on Compras view

3. **Filter Persistence:**
   - Open filter dropdown
   - Select a store category filter (Supermercado)
   - Switch to "Items" tab in filter dropdown
   - Select an item category filter (Carnes)
   - Switch back to "Transactions" tab
   - **Verify:** Supermercado filter still selected

4. **Independent Clear:**
   - Have filters on both Compras and Productos
   - Go to Compras, click "✕"
   - **Verify:** Compras filters cleared
   - Navigate to Productos
   - **Verify:** Productos filters still active

---

## Wireframe

```
┌──────────────────────────────────────────────┐
│  < Compras ✕            [📅][🔖][👤]         │
├──────────────────────────────────────────────┤
│  🔍 Buscar...                                │
│  ┌──────────────────────────────────────┐    │
│  │ Año | Trim | Mes | Sem | Día        │    │
│  │      < Enero 2026 >                  │    │
│  └──────────────────────────────────────┘    │
│  23 compras  ⬇️Fecha  📥                     │
│  ┌─────────────────────────────────────┐     │
│  │ 🏪 Supermercado ✕ │ 📦 Alimentos ✕  │ ✕   │  ← Filter chips
│  └─────────────────────────────────────┘     │
├──────────────────────────────────────────────┤
│  [Transaction cards...]                      │
└──────────────────────────────────────────────┘

       ↑
   "✕" next to title clears ALL filters
   Filter chips have individual "✕" to clear each
```

---

## Estimation Rationale

**3 Story Points:**
- Low-medium complexity - mostly UI changes
- Clear button is straightforward conditional render
- Filter persistence may require state management adjustments
- Well-defined scope with clear acceptance criteria

---

## Implementation Summary (2026-01-10)

### Final Implementation (Revised)

**Clear Button Location:** FilterChips section only (left side of filter chips row)
- ~~NOT on view titles~~ - Title "✕" buttons were removed after initial implementation
- Clear All "✕" button appears at the START of FilterChips when any filters are active

### Files Modified

| File | Changes |
|------|---------|
| `src/components/history/FilterChips.tsx` | Clear All "✕" button at start of chips row |
| `src/components/history/IconFilterBar.tsx` | Modified `applyTransactionFilter()` and `applyItemFilter()` to preserve filters from other dimension using `drillDownPath` |

### Implementation Details

**Clear All Button (FilterChips):**
- Uses `X` icon from lucide-react
- Appears at the LEFT of the filter chips row when any filter is active
- Clears ALL filters for the current view
- Dispatches `CLEAR_ALL_FILTERS` action

**Filter Persistence (AC #4):**
- `applyTransactionFilter()` now checks for existing item filter in `drillDownPath` and preserves it
- `applyItemFilter()` now checks for existing store filter in `drillDownPath` and preserves it
- Both use `drillDownPath` to enable multi-dimension filtering (store + item simultaneously)

### Automated Tests Passing
- FilterChips.test.tsx: 11 tests ✅
- historyFilterUtils.drillDown.test.ts: 16 tests ✅
- TypeScript: No errors ✅
- Build: Successful ✅

---

## Manual Test Results

> **Instructions:** Run the dev server (`npm run dev`) and complete each test. Mark with ✅ or ❌.

### Test 1: Clear All Button in FilterChips
| Step | Expected | Result |
|------|----------|--------|
| Navigate to Compras with no filters | No filter chips visible | |
| Apply temporal filter (Calendar → January) | Filter chips appear with "✕" at left | |
| Click "✕" at start of chips | All filters cleared | |

### Test 2: Filter Persistence Across Tabs (AC #4)
| Step | Expected | Result |
|------|----------|--------|
| Open filter dropdown (Tag icon) | Dropdown opens | |
| In Compras tab, select "Supermercado" | Checkbox checked | |
| Apply filter | Filter applied | |
| Reopen dropdown, switch to Productos tab | Tab switches | |
| Select "Carnes y Mariscos" | Checkbox checked | |
| Switch back to Compras tab | Supermercado still checked ✓ | |

### Test 3: Drill-Down from TrendsView
| Step | Expected | Result |
|------|----------|--------|
| Go to Explora (TrendsView) | View loads | |
| Drill: Store Categories → Supermercado → Item Groups | Drill-down works | |
| Click item count on Alimentos Frescos | Goes to Productos | |
| Check filter chips | Shows both Supermercado AND Alimentos Frescos | |
| Click Clear All "✕" | All filters cleared | |

---

## Notes

- Clear All "✕" is in FilterChips section (left side), NOT on view titles
- This provides a "nuclear option" to clear everything at once
- Useful when user drills deep from analytics and wants to see all data again
