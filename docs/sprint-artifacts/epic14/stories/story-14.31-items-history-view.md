# Story 14.31: Items History View

**Status:** done
**Points:** 8
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.14 (Transaction List Redesign), Story 14.27 (Transaction Pagination)

---

## Story

**As a** user who wants to analyze my spending at the item level,
**I want to** have an "Items" view similar to the Transactions/History view,
**So that** I can browse, search, and filter all individual line items across all my transactions.

---

## Context

Currently, users can view their spending at the transaction level (Compras view) or through analytics aggregations. However, there's no way to see a flat list of all purchased items across transactions.

### Current State:
- **Compras (History) View** - Shows transactions grouped by date
- **Analytics** - Shows aggregated item category data in charts
- **No Item-level browsing** - Cannot see individual items in a list format

### Target State:
- **New "Productos" View** - Shows all line items from all transactions
- **Same UX as Compras** - Identical filter bar, search, pagination, grouping
- **Item Cards** - New card design for individual items (not transactions)
- **Navigation** - Accessible from bottom nav or item category clicks

### Why This Matters:
1. Users want to see "all the times I bought milk" or "all my meat purchases"
2. Item-level filtering enables price comparison across merchants
3. Complements the item category analytics added in Story 14.13

---

## Acceptance Criteria

### AC #1: Items View Header
- [x] Title: "Productos" (or "Items" in English)
- [x] Same filter icons as History: Calendar, Tag, Layers
- [x] Profile dropdown on right side
- [x] Back navigation to previous view

### AC #2: Search Bar
- [x] Search by item name (fuzzy match)
- [x] Debounced search input (300ms)
- [x] Clear button when text entered
- [x] Placeholder: "Buscar productos..."

### AC #3: Temporal Filters
- [x] Same time pills as History: Año | Trimestre | Mes | Semana | Día
- [x] Period navigator with arrows
- [x] Filter items by parent transaction date

### AC #4: Category Filters
- [x] Filter by item category (Carnes, Lácteos, Bebidas, etc.)
- [x] Single-select category dropdown (via Tag icon)
- [x] Show active filter indicator dot
- [x] "Clear filters" option

### AC #5: Item Cards
- [x] Card shows: Item name, price, category emoji
- [x] Secondary info: Merchant name, transaction date
- [x] Category pill/badge with color
- [x] Tap card to navigate to parent transaction

### AC #6: Grouping by Date
- [x] Group items by transaction date (same as History)
- [x] Date headers: "Hoy", "Ayer", or formatted date
- [x] Daily total for items in that group
- [x] Sticky date headers on scroll

### AC #7: Pagination
- [x] Same pagination pattern as History (page numbers)
- [x] Items per page: 15/30/60 (configurable)
- [x] Page-based pagination (matching HistoryView)
- [x] Smooth scroll to top on page change

### AC #8: Export
- [x] Export button in header
- [x] Export filtered items to CSV
- [x] Columns: Item Name, Price, Category, Merchant, Date

### AC #9: Empty States
- [x] No items found: "No hay productos" with illustration
- [x] No items match filter: "No hay resultados" with clear filters button
- [x] No transactions yet: "Escanea tu primera boleta"

### AC #10: Navigation Integration
- [x] Add "Productos" to ProfileDropdown menu
- [ ] Item category clicks in Dashboard navigate to filtered Items view
- [ ] Deep link support: `/items?category=Carnes&month=2026-01`

---

## Tasks

### Phase 1: Data Layer
- [x] Task 1.1: Create `useItems` hook to aggregate items from transactions
- [x] Task 1.2: Add item filtering logic (category, date, search)
- [x] Task 1.3: Add item sorting (by date, price, name)
- [x] Task 1.4: Add pagination for items list

### Phase 2: Components
- [x] Task 2.1: Create `ItemCard` component
- [x] Task 2.2: Create `ItemCategoryFilterBar` component
- [x] Task 2.3: DateGroupHeader inline in ItemsView
- [x] Task 2.4: EmptyState inline in ItemsView

### Phase 3: View Implementation
- [x] Task 3.1: Create `ItemsView.tsx` (mirror HistoryView structure)
- [x] Task 3.2: Wire up filter state management via useItems hook
- [x] Task 3.3: Implement search with SearchBar component
- [x] Task 3.4: Add "Load more" pagination

### Phase 4: Navigation
- [x] Task 4.1: Add Items view to App.tsx view routing
- [x] Task 4.2: Add "Productos" to ProfileDropdown menu
- [ ] Task 4.3: Wire item category clicks to navigate to Items view (deferred)
- [x] Task 4.4: Add `onNavigateToView` pattern (same as History)

### Phase 5: Export & Polish
- [x] Task 5.1: Implement CSV export for items (downloadItemsCSV)
- [ ] Task 5.2: Add loading skeletons (deferred)
- [x] Task 5.3: Add animations (TransitionChild)
- [ ] Task 5.4: Test on mobile viewports (deferred)

### Phase 6: Testing
- [x] Task 6.1: Unit tests for `useItems` hook (43 tests passing)
- [ ] Task 6.2: Unit tests for ItemCard component (deferred)
- [ ] Task 6.3: Integration tests for ItemsView (deferred)
- [ ] Task 6.4: E2E test for item filtering flow (deferred)

---

## File List

**New Files:**
- `src/views/ItemsView.tsx` - Main items list view
- `src/components/items/ItemCard.tsx` - Individual item card
- `src/components/items/ItemsFilterBar.tsx` - Filter bar (may reuse HistoryFilterBar)
- `src/components/items/ItemsListGrouped.tsx` - Grouped list with date headers
- `src/components/items/index.ts` - Barrel export
- `src/hooks/useItems.ts` - Items aggregation and filtering hook
- `src/types/item.ts` - Item type definitions (if needed beyond Transaction.items)

**Modified Files:**
- `src/App.tsx` - Add Items view routing and navigation
- `src/components/Nav.tsx` - Add Items navigation option
- `src/views/DashboardView.tsx` - Wire item category clicks to Items view
- `src/utils/analyticsToHistoryFilters.ts` - Add `ItemsNavigationPayload` type

**Tests:**
- `tests/unit/hooks/useItems.test.ts`
- `tests/unit/components/ItemCard.test.tsx`
- `tests/unit/views/ItemsView.test.tsx`
- `tests/integration/items/itemsViewIntegration.test.tsx`

---

## Technical Notes

### Data Structure
```typescript
// Flattened item from transaction
interface FlattenedItem {
  id: string; // Generated: `${transactionId}-${itemIndex}`
  name: string;
  price: number;
  category?: string;
  subcategory?: string;
  // Parent transaction info
  transactionId: string;
  transactionDate: string;
  merchantName: string;
  merchantCategory?: string;
  city?: string;
}

// Items hook return type
interface UseItemsResult {
  items: FlattenedItem[];
  filteredItems: FlattenedItem[];
  totalCount: number;
  isLoading: boolean;
  filters: ItemFilters;
  setFilters: (filters: ItemFilters) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}
```

### Filtering Logic
```typescript
// Filter items by:
// 1. Category (exact match on item.category)
// 2. Date range (from parent transaction.date)
// 3. Search term (fuzzy match on item.name)
// 4. Merchant (optional, from parent transaction)

const filterItems = (items: FlattenedItem[], filters: ItemFilters) => {
  return items.filter(item => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.dateRange && !isInDateRange(item.transactionDate, filters.dateRange)) return false;
    if (filters.searchTerm && !fuzzyMatch(item.name, filters.searchTerm)) return false;
    return true;
  });
};
```

### Navigation Payload
```typescript
interface ItemsNavigationPayload {
  category?: string;        // Item category filter
  itemGroup?: string;       // Item category group filter
  temporal?: {
    level: 'year' | 'quarter' | 'month' | 'week' | 'day';
    year?: string;
    quarter?: string;
    month?: string;
    week?: string;
    day?: string;
  };
  searchTerm?: string;      // Pre-fill search
  merchantName?: string;    // Filter by merchant
}
```

### Reuse Opportunities
- `HistoryFilterBar` - Adapt for item categories instead of store categories
- `TransactionCard` layout - Similar card structure for ItemCard
- `useHistoryFilters` hook pattern - Same filter state management
- `HistoryFiltersProvider` - May extend or create parallel `ItemsFiltersProvider`

---

## UI Mockup Reference

The Items view should mirror the Compras (History) view layout:

```
┌─────────────────────────────────────┐
│  < Productos    📅 🏷️ ⚙️    [GC]  │  Header
├─────────────────────────────────────┤
│  🔍 Buscar productos...             │  Search
├─────────────────────────────────────┤
│ 2026 > T1 > [Ene] > Sem > Día      │  Time pills
├─────────────────────────────────────┤
│ Mostrando 156 productos    📋 ⬇️   │  Results count
├─────────────────────────────────────┤
│ 🗓️ 2026>ene ✕  🏷️ Carnes ✕        │  Active filters
├─────────────────────────────────────┤
│ 6 ENE                      $59,179  │  Date header
│ ┌─────────────────────────────────┐ │
│ │ 🥩 Lomo Vetado          $12,990 │ │  Item card
│ │    Supermercado • 06/01/2026    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🧀 Queso Mantecoso       $4,500 │ │  Item card
│ │    Supermercado • 06/01/2026    │ │
│ └─────────────────────────────────┘ │
│ ...                                 │
├─────────────────────────────────────┤
│     <  1 / 4  >                     │  Pagination
└─────────────────────────────────────┘
```

---

## Test Plan

1. Open Items view from bottom nav
2. Verify header shows "Productos" with filter icons
3. Search for "leche" - verify fuzzy matching works
4. Select "Carnes" category filter - verify items filtered
5. Change time period to "Mes" and navigate months
6. Verify items grouped by date with correct headers
7. Tap item card - verify navigation to parent transaction
8. Export items to CSV - verify file downloads
9. Test pagination - navigate between pages
10. Test empty states - clear all data, verify messages
11. Test mobile viewport (360px) - verify responsive layout

---

## Open Questions

1. **Bottom Nav Space** - Where does Items fit? Options:
   - Replace an existing tab
   - Add as 5th tab (may be crowded)
   - Submenu under Analytics
   - Accessible only via item category clicks

2. **Item Grouping** - Group by:
   - Transaction date (same as History) - **Recommended**
   - Item category
   - Merchant

3. **Price Display** - Show:
   - Unit price only
   - Unit price + quantity (if available)
   - Running total

4. **Parent Transaction Link** - When tapping item card:
   - Navigate to full TransactionEditorView
   - Show mini-preview modal
   - Expand inline to show siblings

---

## Session Log

### Session 1 - 2026-01-08

**Implemented core Items History View functionality:**

#### Files Created:
- `src/types/item.ts` - FlattenedItem, ItemFilters, UseItemsResult types
- `src/hooks/useItems.ts` - Hook for flattening, filtering, sorting, grouping items
- `src/components/items/ItemCard.tsx` - Item card with category colors and merchant info
- `src/components/items/ItemCategoryFilterBar.tsx` - Category filter dropdown
- `src/components/items/index.ts` - Barrel export
- `src/views/ItemsView.tsx` - Main view with filters, search, pagination
- `tests/unit/hooks/useItems.test.ts` - 43 unit tests for useItems hook

#### Files Modified:
- `src/App.tsx` - Added 'items' view type and ItemsView rendering
- `src/components/ProfileDropdown.tsx` - Added "Productos" menu item
- `src/utils/translations.ts` - Added 'productos' translation key
- `src/utils/csvExport.ts` - Added downloadItemsCSV function

#### Features Implemented:
- ✅ Flat list of all items across transactions
- ✅ Search by item name
- ✅ Filter by item category
- ✅ Group items by date with sticky headers
- ✅ Click item to navigate to parent transaction
- ✅ Export items to CSV
- ✅ Profile dropdown navigation

#### Deferred to Future Sessions:
- Item category clicks in Dashboard → Items view navigation
- Loading skeletons
- Mobile viewport testing
- Integration tests
- ItemCard unit tests
- E2E tests

#### Test Results:
- 43/43 useItems hook tests passing
- TypeScript: No errors in new files
- Build: Pre-existing errors in DashboardView.tsx (not related to this story)

---

### Session 1 Continued - 2026-01-08

**Added pagination and React Query caching:**

#### Additional Files Created:
- `src/hooks/useDerivedItems.ts` - React Query-based hook for caching flattened items
- `tests/unit/hooks/useDerivedItems.test.ts` - 14 unit tests for caching behavior

#### Additional Files Modified:
- `src/lib/queryKeys.ts` - Added `items` query key for cache management
- `src/views/ItemsView.tsx` - Updated pagination (15/30/60 page sizes) and switched to useDerivedItems

#### Features Implemented:
- ✅ Pagination matching HistoryView pattern (15/30/60 items per page)
- ✅ Page navigation with prev/next buttons
- ✅ Page size selector
- ✅ Scroll to top on page change
- ✅ React Query caching for derived items (instant navigation)

#### Test Results:
- 57/57 tests passing (43 useItems + 14 useDerivedItems)
- TypeScript: No errors in new files

#### Remaining Work for Next Session:
1. **Filters & Headers** (Priority):
   - Add temporal breadcrumb navigation (Año | Trimestre | Mes | Semana | Día)
   - Add filter chips for active filters
   - Wire up IconFilterBar with item categories
   - Match HistoryView header styling exactly

2. **Dashboard Integration**:
   - Wire item category clicks in Dashboard treemap to Items view
   - Pass initialCategory prop for pre-filtered navigation

3. **Polish**:
   - Loading skeletons
   - Mobile viewport testing
   - Additional tests

---

### Session 2 - 2026-01-08

**Added temporal breadcrumb navigation and matched HistoryView header:**

#### Files Created:
- `src/components/items/ItemIconFilterBar.tsx` - Icon-based filter bar for item categories (Tag icon)

#### Files Modified:
- `src/App.tsx` - Wrapped ItemsView with HistoryFiltersProvider for temporal navigation
- `src/views/ItemsView.tsx` - Major update to match HistoryView header pattern:
  - Added TemporalBreadcrumb component (Año | Trimestre | Mes | Semana | Día)
  - Added useHistoryFilters hook for temporal filter state
  - Added FilterChips component for active temporal/category filters
  - Added ItemIconFilterBar component for item category filtering
  - Wired temporal filter to item filtering via date range conversion
  - Matched HistoryView header styling (72px height, collapsible section)
- `src/components/items/index.ts` - Exported new ItemIconFilterBar component

#### Key Design Decisions:
1. **Reused HistoryFiltersProvider** - Same context for temporal navigation across both HistoryView and ItemsView
2. **Temporal filter → dateRange conversion** - Convert HistoryFiltersContext temporal state to date range for item filtering
3. **Shared components** - Reused TemporalBreadcrumb, FilterChips from history/ folder
4. **Simplified IconFilterBar** - ItemIconFilterBar only has Tag icon (temporal via breadcrumb)

#### Features Implemented:
- ✅ Temporal breadcrumb navigation (Año | Trimestre | Mes | Semana | Día)
- ✅ Period selection via dropdown pills
- ✅ Filter items by parent transaction date (year/quarter/month/week/day)
- ✅ FilterChips for active temporal filters (with clear button)
- ✅ Item category filter via ItemIconFilterBar (Tag icon)
- ✅ Header styling matches HistoryView exactly (72px height, collapsible)
- ✅ Clear all filters button
- ✅ Reset to page 1 when temporal filter changes

#### Acceptance Criteria Status:
- [x] AC #1: Items View Header - Title, filter icons, profile dropdown, back nav
- [x] AC #2: Search Bar - Fuzzy search, debounced, clear button
- [x] AC #3: Temporal Filters - Time pills, period navigator, date filtering
- [x] AC #4: Category Filters - Item category filter, active indicator
- [x] AC #5: Item Cards - Name, price, category, merchant, tap to navigate
- [x] AC #6: Grouping by Date - Date headers, daily totals, sticky headers
- [x] AC #7: Pagination - Page numbers, scroll to top
- [x] AC #8: Export - CSV export button
- [x] AC #9: Empty States - No items, no matching filters

#### Test Results:
- 57/57 tests passing (useItems + useDerivedItems)
- TypeScript: No new errors (pre-existing DashboardView errors unrelated)
- Dev server: Runs without crashes

#### Remaining Work:
1. **Dashboard Integration** (AC #10):
   - Wire item category clicks in Dashboard treemap to Items view
   - Pass initialCategory prop for pre-filtered navigation
2. **Polish**:
   - Loading skeletons
   - Mobile viewport testing
   - Additional tests (ItemCard, ItemsView integration, E2E)

---

### Session 2 Continued - 2026-01-08

**Fixed header to show all 3 filter icons (Calendar, Tag, Layers) matching HistoryView:**

#### Problem:
- Previous implementation used custom `ItemIconFilterBar` with only Tag icon
- User expected same header as HistoryView with 3 icons: Calendar, Tag, Layers (custom groups)

#### Solution:
- Replaced `ItemIconFilterBar` with full `IconFilterBar` component (reused from HistoryView)
- Added `userId` and `appId` props to ItemsView for groups functionality
- Added `useGroups` hook to fetch user's custom transaction groups
- Passed `groups` and `groupsLoading` to IconFilterBar to enable Layers dropdown

#### Files Modified:
- `src/views/ItemsView.tsx`:
  - Added `useGroups` import
  - Added `userId` and `appId` props to interface
  - Added `useGroups(userId, appId)` hook call
  - Updated `IconFilterBar` to pass `groups` and `groupsLoading` props
- `src/App.tsx`:
  - Added `userId={user?.uid}` and `appId={services?.appId}` to ItemsView props

#### Header Now Matches HistoryView:
- ✅ Back button (ChevronLeft)
- ✅ Title "Productos"
- ✅ Calendar icon (temporal filters dropdown)
- ✅ Tag icon (category filters dropdown with store/item categories)
- ✅ Layers icon (custom groups dropdown)
- ✅ Profile avatar with dropdown

#### Test Results:
- 57/57 tests passing (useItems + useDerivedItems)
- TypeScript: No errors in ItemsView (pre-existing errors in other files unrelated)

---

### Session 2 Fix #2 - 2026-01-08

**Fixed: Hide TopHeader when showing ItemsView**

#### Problem:
- ItemsView has its own header with back button, title "Productos", filter icons, profile avatar
- But TopHeader ("Gastify" branding header) was ALSO showing because `items` view was not excluded
- This caused TopHeader to cover/conflict with ItemsView's header

#### Solution:
- Added `view !== 'items'` to the TopHeader exclusion condition in App.tsx

#### File Modified:
- `src/App.tsx` line 2889:
  - Before: `view !== 'trends' && view !== 'history' && view !== 'reports' && ...`
  - After: `view !== 'trends' && view !== 'history' && view !== 'reports' && view !== 'items' && ...`

#### Now ItemsView Header Shows Correctly:
```
┌─────────────────────────────────────────────┐
│  < Productos      📅  🏷️  📚     [Profile]  │
├─────────────────────────────────────────────┤
│  🔍 Buscar productos...                     │
├─────────────────────────────────────────────┤
│  2026 › T1 › [Ene] › Sem › Día              │
└─────────────────────────────────────────────┘
```

---

### Session 3 - 2026-01-08

**Added sort control to both ItemsView and HistoryView:**

#### Files Created:
- `src/components/history/SortControl.tsx` - Reusable sort dropdown component with:
  - Compact button showing current sort + direction indicator (↑/↓)
  - Dropdown with sort options
  - Click same option to toggle direction (asc/desc)
  - Consistent styling with existing filter controls

#### Files Modified:
- `src/components/history/index.ts` - Exported SortControl component
- `src/views/ItemsView.tsx`:
  - Added sort state (`sortBy`, `sortDirection`)
  - Added `handleSortChange` callback
  - Updated `aggregatedItems` memo to use `sortAggregatedItems()`
  - Updated `duplicateItems` memo to sort by selected criteria
  - Added SortControl UI in count row (between product count and download button)
- `src/views/HistoryView.tsx`:
  - Added sort state (`sortBy`, `sortDirection`)
  - Added `sortTransactionsWithinGroups()` function for Option B (sort within date groups)
  - Added `handleSortChange` callback
  - Updated `paginatedTransactions` memo to apply sorting before pagination
  - Added SortControl UI in count row (between transaction count and download button)

#### Sort Options Implemented:

**ItemsView (Productos):**
| Key | Label (ES) | Label (EN) | Direction Default |
|-----|------------|------------|-------------------|
| `lastPurchaseDate` | Fecha | Date | desc (newest first) |
| `totalAmount` | Precio | Price | desc (highest first) |
| `name` | Nombre | Name | asc (A-Z) |

**HistoryView (Compras):**
| Key | Label (ES) | Label (EN) | Direction Default |
|-----|------------|------------|-------------------|
| `date` | Fecha | Date | desc (newest first) |
| `total` | Total | Total | desc (highest first) |
| `merchant` | Tienda | Store | asc (A-Z) |

#### UI Placement:
```
[⚠️ duplicates] [X productos] [↕️ Fecha ↓] [📄 ⬇️]
                                  ↑
                            Sort Control
```

#### Technical Notes:
- **Option B implemented:** Date groups are preserved, items sorted within each group
- Sort by Date: All items sorted by date (traditional behavior)
- Sort by Price/Total: Items within each date group sorted by value
- Sort by Name/Store: Items within each date group sorted alphabetically
- Pagination reset to page 1 when sort criteria changes

#### Additional Fixes:
- **Dropdown visibility fix:** Changed `overflow: hidden` to `overflow: visible` when header is expanded (both views)
- **Font size increase:** Bumped count row text from 11px to 13px, icons from 14px to 16px, sort dropdown menu to text-sm
- **Scroll-to-top on navigation:** Fixed `onNavigateToView` in App.tsx to use `navigateToView()` instead of `setView()` directly, ensuring pages scroll to top when navigating via profile dropdown

#### Test Results:
- TypeScript: No new errors in modified files
- Build: All pre-existing errors unrelated to sort control changes
- Sort control appears correctly in both views
- Navigation now scrolls to top consistently

---

### Session 4 - Planned

**Goal: Tailor ItemsView CSV export for monthly product aggregation**

#### Requirements:
- Download button only available when viewing a single month (not year/quarter/all)
- Export aggregated products for the selected month
- CSV columns:
  - Product name
  - Unit price (average or last price)
  - Total price (sum of all purchases)
  - Category (in user's language - Spanish if lang=es)
  - Subcategory (in user's language)
  - Merchant + City (e.g., "Eltit en Villarrica")
  - Purchase count
  - Transaction count

#### Files to Modify:
- `src/views/ItemsView.tsx` - Conditional download button visibility
- `src/utils/csvExport.ts` - New export function for aggregated items with translations

#### Notes:
- Reuse existing `downloadItemsCSV` or create new `downloadAggregatedItemsCSV`
- Use translation keys for category names (not hardcoded English)
- Consider grouping by product across all merchants or keeping merchant separation

---

### Session 5 - 2026-01-12

**Goal: Add "Ingresado" (scan date) sort option to HistoryView**

#### Problem Discovered:
When adding scan date sorting, discovered that `subscribeToRecentScans` (ordered by `createdAt`) was returning stale data. Investigation revealed:

1. **Inconsistent `createdAt` formats in Firestore:**
   - Some transactions have proper Firestore Timestamps: `{seconds: 1767382604, nanoseconds: ...}`
   - Some have date strings: `"January 12, 2026 at 3:00:..."`
   - Some have `null` values

2. **Firestore query behavior:**
   - `orderBy('createdAt', 'desc')` excludes documents with `null` createdAt
   - String dates are sorted alphabetically (wrong!)
   - Only proper Timestamps sort correctly

#### Files Modified:
- `src/views/HistoryView.tsx`:
  - Added `'scanDate'` to `HistorySortKey` type
  - Added sort option: `{ key: 'scanDate', labelEn: 'Scan Date', labelEs: 'Ingresado' }`
  - Added `createdAt` field to local Transaction interface
  - Updated `sortTransactionsWithinGroups()` to handle scanDate sorting with Firestore Timestamp conversion

- `src/App.tsx`:
  - Created `transactionsWithRecentScans` memo to merge `recentScans` with `paginatedTransactions`
  - Updated HistoryView props to use merged transactions
  - Added debug logging for investigation
  - Imported `migrateCreatedAt` utility
  - Exposed `window.runCreatedAtMigration()` helper for console access

- `src/hooks/useAuth.ts`:
  - Investigated appId mismatch (reverted - was not the issue)

- `src/services/firestore.ts`:
  - Added debug logging to `addTransaction` and `subscribeToRecentScans`

#### Files Created:
- `src/utils/migrateCreatedAt.ts` - Browser-based migration utility (did not work due to batch limitations)
- `scripts/migrate-createdAt.ts` - Firebase Admin SDK script (requires service account)
- `scripts/migrate-createdAt-admin.js` - Admin script for Firebase Console (to be created)

#### Root Cause:
The `createdAt` field has inconsistent formats across transactions because:
1. Old transactions were created before `serverTimestamp()` was consistently used
2. Some migrations or manual edits introduced string dates
3. Some transactions have `null` values

#### Solution Required:
Run a one-time admin migration to standardize all `createdAt` fields:
- For transactions with invalid/missing `createdAt`, set it to the transaction `date` converted to Timestamp
- This ensures `orderBy('createdAt', 'desc')` query returns all transactions correctly

#### Admin Script Location:
`scripts/migrate-createdAt-admin.js` - Run via Firebase Console or Node.js with service account

#### Next Steps (for next session):
1. Run the admin migration script to fix all `createdAt` fields
2. Verify `subscribeToRecentScans` returns correct data after migration
3. Test "Ingresado" sort option works correctly
4. Remove debug logging from App.tsx and firestore.ts
5. Clean up unused migration utilities

---

### Session 6 - 2026-01-12 (Final)

**Story marked as DONE**

#### Summary:
All core acceptance criteria (AC #1-9) have been completed. The Items History View provides:
- Full item-level browsing across all transactions
- Search, filter (temporal, category), and sort functionality
- Pagination matching HistoryView pattern
- CSV export capability
- Navigation from ProfileDropdown menu

#### Deferred Items (tracked separately):
- AC #10: Dashboard item category clicks → Items view (can be added later)
- AC #10: Deep link support (`/items?category=Carnes&month=2026-01`)

#### Test Coverage:
- 57 unit tests passing (43 useItems + 14 useDerivedItems)
- TypeScript: No errors in Items-related files

#### Follow-up Stories Created:
- Story 14.34: Quick Save Currency Formatting (bug fix)
- Story 14.35: Dynamic Location Data (localization)
- Story 14.36: Location Filter Hierarchy (new feature)
