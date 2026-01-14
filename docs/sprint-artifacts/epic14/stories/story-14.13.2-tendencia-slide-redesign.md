# Story 14.13.2: Tendencia Slide Redesign

**Status:** in-progress (Phase 1, 2, 3, 6 complete; Phase 4 deferred; UI polish ongoing)
**Points:** 13 → 8 (reduced scope: deferred Sankey + drill-down)
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.13 (Analytics Polygon Integration - complete)
**Mockup Reference:** Left side of comparison screenshot showing trend list layout
**Sankey Reference:** https://echarts.apache.org/examples/en/index.html#chart-type-sankey
**Implementation Date:** 2026-01-11
**Last Session:** 2026-01-11 (Session 2)

---

## Story

**As a** user viewing my spending analytics in the "Explora" view,
**I want to** see a redesigned "Tendencia" slide with period-over-period comparison and a Sankey flow diagram,
**So that** I can understand how my spending in each category has changed compared to the previous period and visualize the flow from store categories to item categories.

---

## Context

The "Tendencia" slide is the second slide in the Analytics (Explora) carousel. Currently it shows a basic trend list with sparklines. This story redesigns it with:

1. **Primary View (List)**: Period-over-period comparison with sparklines
2. **Alternate View (Sankey)**: Vertical flow diagram showing category hierarchy

### Current State (What We Have):
- Basic trend list with sparklines
- Static percentage display
- No drill-down in trend view
- Sparklines show trend over time but not period comparison

### Target State:

#### Primary View: Trend List
- Refined row layout matching mockup design
- **Period-over-period comparison** (always compare to previous corresponding period):
  - Week mode: Compare to previous week (Week 2 vs Week 1)
  - Month mode: Compare to previous month (Feb vs Jan)
  - Quarter mode: Compare to previous quarter (Q2 vs Q1)
  - Year mode: Compare to previous year (2026 vs 2025)
- **NO custom period comparisons** (e.g., May vs November not supported)
- Percentage change indicator (↑ red for increase, ↓ green for decrease)
- Drill-down support (same as Distribution slide)
- **Sorting**: By current period amount descending

#### Alternate View: Vertical Sankey Diagram
- **4-level vertical flow**:
  1. Store Category Groups (top)
  2. Store Categories
  3. Item Category Groups
  4. Item Categories (bottom)
- Shows how money flows from store types → item types
- **Same 10% threshold** as TreeMap/DonutChart:
  - Show categories with ≥10% of total
  - Show one additional category with highest % below 10%
  - Aggregate remaining into "Más" category
- **Expand/collapse buttons** for "Más" category (same position as TreeMap)
- Uses ECharts Sankey chart type

### Period Comparison Logic

| Time Period | Current | Compare To |
|-------------|---------|------------|
| **Week** | Selected week | Previous week |
| **Month** | Selected month | Previous month |
| **Quarter** | Selected quarter | Previous quarter |
| **Year** | Selected year | Previous year |

**Edge Cases:**
- No data in previous period → Show "nuevo" (new) badge instead of percentage
- Category exists only in previous period → Don't show (filtered to current period categories)
- 0% change → Show "= 0%" in gray

---

## Acceptance Criteria

### AC #1: Row Layout Redesign (List View)
- [ ] Each row shows: Icon | Name + transaction count | Sparkline | Amount | Change %
- [ ] Layout matches mockup proportions
- [ ] Sparkline positioned between name and amount
- [ ] Change percentage on far right with up/down arrow
- [ ] Categories sorted by current period amount (descending)

### AC #2: Period-Over-Period Comparison
- [ ] Calculate spending change vs previous corresponding period only
- [ ] Week: Compare selected week to week before
- [ ] Month: Compare selected month to month before
- [ ] Quarter: Compare selected quarter to quarter before
- [ ] Year: Compare selected year to year before
- [ ] Show percentage with direction indicator (↑/↓)
- [ ] NO custom period comparisons supported

### AC #3: Change Indicator Styling
- [ ] Positive change (spent more): Red text with ↑ arrow (spending increase = bad)
- [ ] Negative change (spent less): Green text with ↓ arrow (spending decrease = good)
- [ ] No change: Gray text with "= 0%"
- [ ] New category (no previous data): "nuevo" badge in blue

### AC #4: Drill-Down Support (List View)
- [ ] Tap category row to drill down (same as Distribution slide)
- [ ] Back button appears when drilled down
- [ ] Drill-down hierarchy follows view mode:
  - Store Categories → Item Groups → Item Categories → Subcategories
  - Store Groups → Store Categories → Item Groups → Item Categories
  - Item Groups → Item Categories → Subcategories
  - Item Categories → Subcategories
- [ ] Period comparison works at all drill-down levels

### AC #5: Sankey Diagram (Alternate View)
- [ ] Vertical orientation (top to bottom flow)
- [ ] 4 levels: Store Groups → Store Categories → Item Groups → Item Categories
- [ ] Node width proportional to spending amount
- [ ] Flow lines show money distribution
- [ ] Category colors match TreeMap/DonutChart colors
- [ ] Tooltips show category name and amount on hover

### AC #6: Sankey Data Filtering (Same as TreeMap)
- [ ] Show categories with ≥10% of total spending
- [ ] Show one additional category with highest % below 10%
- [ ] Aggregate remaining categories into "Más" group
- [ ] Expand button (+) on "Más" to show hidden categories
- [ ] Collapse button (-) to re-aggregate
- [ ] Button position matches TreeMap expand/collapse buttons

### AC #7: View Toggle Button
- [ ] Toggle button switches between List and Sankey views
- [ ] Button shows list icon when on Sankey, chart icon when on List
- [ ] Smooth transition between views
- [ ] State persists during session

### AC #8: View Mode Support
- [ ] Works with all 4 view modes (store-groups, store-categories, item-groups, item-categories)
- [ ] Emojis and translations match selected view mode
- [ ] Count mode toggle (transactions vs items) affects display

---

## Tasks

### Phase 1: Data Layer - Previous Period Calculation
- [x] Task 1.1: Create `getPreviousPeriod()` utility function
- [x] Task 1.2: Compute previous period data (transactions in previous period)
- [x] Task 1.3: Calculate percentage change for each category
- [x] Task 1.4: Handle edge cases (new categories, missing data)
- [x] Task 1.5: Sort categories by current period amount descending

### Phase 2: UI - Row Layout Redesign
- [x] Task 2.1: Update `TrendListItem` component layout to match mockup
- [x] Task 2.2: Position sparkline between name and amount
- [x] Task 2.3: Add change percentage with arrow indicator
- [x] Task 2.4: Style positive/negative/neutral/new changes (AC #3)
- [x] Task 2.5: Ensure proper alignment of all elements

### Phase 3: Drill-Down Implementation (List View) - COMPLETE
> **Note:** Implemented in Session 1 (2026-01-11)
- [x] Task 3.1: Add `trendDrillDownLevel` and `trendDrillDownPath` state
- [x] Task 3.2: Compute drill-down data for trend view with period comparison
- [x] Task 3.3: Add row click handler for drilling down (chevron click)
- [x] Task 3.4: Add back button to trend view header
- [x] Task 3.5: Calculate previous period data at each drill-down level
- [x] Task 3.6: Fix `handleTrendCountClick` to include `drillDownPath` for proper filtering (Session 2)

### Phase 4: Sankey Diagram Implementation - DEFERRED
> **Note:** Sankey diagram deferred to follow-up story (significant complexity).
- [ ] Task 4.1: Install/configure ECharts for React (if not already)
- [ ] Task 4.2: Create Sankey data structure from transaction data
- [ ] Task 4.3: Build 4-level hierarchy (Store Groups → Store Cats → Item Groups → Item Cats)
- [ ] Task 4.4: Apply 10% threshold + "Más" aggregation
- [ ] Task 4.5: Style Sankey with category colors
- [ ] Task 4.6: Add expand/collapse buttons for "Más" category
- [ ] Task 4.7: Add tooltips and hover effects

### Phase 5: View Toggle Integration - EXISTING
> **Note:** View toggle already implemented from Story 14.13.
- [x] Task 5.1: Add `tendenciaView` state ('list' | 'breakdown')
- [x] Task 5.2: Update view toggle button behavior
- [ ] Task 5.3: Persist view state to sessionStorage (use list default)
- [x] Task 5.4: Animate transition between views

### Phase 6: Testing
- [x] Task 6.1: Add tests for period comparison calculation (38 tests)
- [ ] Task 6.2: Add tests for trend view drill-down (deferred with Phase 3)
- [ ] Task 6.3: Add tests for Sankey data generation (deferred with Phase 4)
- [x] Task 6.4: Add tests for edge cases (new categories, no previous data)

---

## File List

**Modified:**
- `src/views/TrendsView.tsx` - Trend slide redesign, drill-down state, period comparison, Sankey integration

**New Components (may create):**
- `src/components/analytics/SankeyChart.tsx` - Vertical Sankey diagram component
- `src/utils/periodComparison.ts` - Period calculation utilities
- `src/utils/sankeyDataBuilder.ts` - Sankey data structure builder

**Dependencies (may need to add):**
- `echarts` - Charting library for Sankey diagram
- `echarts-for-react` - React wrapper for ECharts

**Tests:**
- `tests/unit/views/TrendsView.trend.test.tsx` - Tests for trend list functionality
- `tests/unit/components/SankeyChart.test.tsx` - Tests for Sankey component

---

## Implementation Notes

### Previous Period Calculation

```typescript
// Get previous period based on time granularity
const getPreviousPeriod = (
    currentPeriod: { year: number; month?: number; quarter?: number; week?: number },
    timePeriod: 'week' | 'month' | 'quarter' | 'year'
): { year: number; month?: number; quarter?: number; week?: number } => {
    switch (timePeriod) {
        case 'week':
            // Previous week (handle year boundary)
            if (currentPeriod.week === 1) {
                return { year: currentPeriod.year - 1, month: 12, week: 52 };
            }
            return { ...currentPeriod, week: currentPeriod.week! - 1 };
        case 'month':
            // Previous month (handle year boundary)
            if (currentPeriod.month === 1) {
                return { year: currentPeriod.year - 1, month: 12 };
            }
            return { year: currentPeriod.year, month: currentPeriod.month! - 1 };
        case 'quarter':
            // Previous quarter (handle year boundary)
            if (currentPeriod.quarter === 1) {
                return { year: currentPeriod.year - 1, quarter: 4 };
            }
            return { year: currentPeriod.year, quarter: currentPeriod.quarter! - 1 };
        case 'year':
            return { year: currentPeriod.year - 1 };
    }
};
```

### Change Percentage Calculation

```typescript
interface CategoryTrendData {
    name: string;
    currentValue: number;
    previousValue: number;
    changePercent: number | null; // null = new category
    changeDirection: 'up' | 'down' | 'same' | 'new';
}

const calculateChange = (current: number, previous: number): { percent: number; direction: 'up' | 'down' | 'same' | 'new' } => {
    if (previous === 0) {
        return { percent: 0, direction: 'new' }; // New category
    }
    const percent = ((current - previous) / previous) * 100;
    if (Math.abs(percent) < 0.5) {
        return { percent: 0, direction: 'same' };
    }
    return {
        percent: Math.round(percent),
        direction: percent > 0 ? 'up' : 'down',
    };
};
```

### Row Layout Structure (Target - Mockup)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Icon]  Supermerca...  [~~~sparkline~~~]    $420k    ↓ -8%     │
│         18 compras                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Sankey Data Structure (ECharts)

```typescript
const sankeyOption = {
    tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove'
    },
    series: [{
        type: 'sankey',
        orient: 'vertical',  // Vertical flow (top to bottom)
        bottom: '10%',
        data: [
            // Level 1: Store Groups
            { name: 'Food & Dining', itemStyle: { color: '#22c55e' } },
            { name: 'Transportation', itemStyle: { color: '#3b82f6' } },
            // Level 2: Store Categories
            { name: 'Supermercado', itemStyle: { color: '#22c55e' } },
            { name: 'Restaurante', itemStyle: { color: '#f59e0b' } },
            // Level 3: Item Groups
            { name: 'Fresh Food', itemStyle: { color: '#10b981' } },
            { name: 'Packaged Food', itemStyle: { color: '#6366f1' } },
            // Level 4: Item Categories
            { name: 'Carnes', itemStyle: { color: '#ef4444' } },
            { name: 'Lácteos', itemStyle: { color: '#f8fafc' } },
        ],
        links: [
            // Store Group → Store Category
            { source: 'Food & Dining', target: 'Supermercado', value: 420000 },
            { source: 'Food & Dining', target: 'Restaurante', value: 57000 },
            // Store Category → Item Group
            { source: 'Supermercado', target: 'Fresh Food', value: 200000 },
            { source: 'Supermercado', target: 'Packaged Food', value: 150000 },
            // Item Group → Item Category
            { source: 'Fresh Food', target: 'Carnes', value: 80000 },
            { source: 'Fresh Food', target: 'Lácteos', value: 60000 },
        ],
        label: {
            position: 'top'
        },
        lineStyle: {
            color: 'source',
            curveness: 0.5
        }
    }]
};
```

### Color Scheme for Changes

| Direction | Color | Icon | Meaning |
|-----------|-------|------|---------|
| **up** | Red (#ef4444) | ↑ | Spent MORE than previous period (bad) |
| **down** | Green (#22c55e) | ↓ | Spent LESS than previous period (good) |
| **same** | Gray (#6b7280) | = | No significant change |
| **new** | Blue (#3b82f6) | nuevo | Category is new (no previous data) |

### 10% Threshold Logic (Same as TreeMap)

```typescript
const applyThreshold = (categories: CategoryData[], total: number) => {
    const threshold = total * 0.10; // 10%

    // Categories above threshold
    const aboveThreshold = categories.filter(c => c.value >= threshold);

    // Categories below threshold
    const belowThreshold = categories
        .filter(c => c.value < threshold)
        .sort((a, b) => b.value - a.value);

    // Take highest below threshold
    const nextHighest = belowThreshold[0];

    // Aggregate the rest into "Más"
    const remaining = belowThreshold.slice(1);
    const masValue = remaining.reduce((sum, c) => sum + c.value, 0);

    return {
        displayCategories: [
            ...aboveThreshold,
            ...(nextHighest ? [nextHighest] : []),
            ...(remaining.length > 0 ? [{
                name: 'Más',
                value: masValue,
                categoryCount: remaining.length,
            }] : [])
        ],
        hiddenCategories: remaining,
    };
};
```

---

## Test Plan

### List View Tests
1. Switch to Tendencia slide in Analytics
2. Verify row layout matches mockup (icon, name, sparkline, amount, change %)
3. Verify categories sorted by amount descending
4. Check percentage change calculation:
   - Navigate to a month with data in previous month → verify % shown
   - Navigate to first month of data → verify "nuevo" badges
5. Test drill-down:
   - Click category → drills into subcategories
   - Click back → returns to parent level
   - Verify period comparison works at all drill-down levels
6. Test all time periods:
   - Week mode: Verify comparison to previous week
   - Month mode: Verify comparison to previous month
   - Quarter mode: Verify comparison to previous quarter
   - Year mode: Verify comparison to previous year

### Sankey View Tests
1. Click view toggle to switch to Sankey
2. Verify 4 levels displayed vertically
3. Verify flow lines connect related categories
4. Verify 10% threshold applied (Más category appears)
5. Click expand button on "Más" → hidden categories appear
6. Click collapse button → categories re-aggregate
7. Hover on nodes/links → tooltips appear
8. Verify category colors match TreeMap

### View Mode Tests
- All 4 view modes should show correct data in both List and Sankey views
- Count mode toggle should affect displays

---

## Resolved Questions

1. **Sparkline data source**: Shows trend within current period, compares to previous corresponding period only (no custom period comparisons)
2. **Sorting**: Categories sorted by current period amount descending
3. **Second visualization**: Vertical Sankey diagram showing 4-level hierarchy with same 10% threshold and expand/collapse as TreeMap

---

## Session Log

### Session 1 (2026-01-11) - Drill-Down Implementation
**Completed:**
1. Added drill-down state for trend list (`trendDrillDownLevel`, `trendDrillDownPath`)
2. Added drill-down data computation with period comparison (`trendDrillDownData`, `effectiveTrendData`)
3. Added drill-down handlers (`handleTrendDrillDown`, `handleTrendBack`)
4. Updated trend list UI with drill-down support (back button, chevron navigation)
5. Updated count click to include drill-down path

**Behavior:**
- Click chevron (>) to drill into subcategories
- Sparklines, amounts, and period comparisons update for drilled-down data
- Click back button (<) to go up one level
- Click count pill to navigate to History/Items with proper filters

### Session 2 (2026-01-11) - Bug Fixes & UI Polish
**Bug Fixes:**
1. Fixed `handleTrendCountClick` - was not setting correct filters when drilled down
   - Problem: Not building `drillDownPath` object like donut/treemap handlers
   - Solution: Build proper `DrillDownPath` with semantic fields (storeCategory, itemGroup, etc.)

**UI Changes:**
1. Increased font sizes in trend cards:
   - Category name: 13px → 15px
   - Amount: 13px → 14px
   - Count pill: 10px → 11px
   - Change indicators: 10px → 11px

2. Card layout redesign - two-part structure:
   - Main card (rounded-l-xl) with content
   - Chevron zone (rounded-r-xl) with different bg color for drill-down affordance

3. Sparkline positioning:
   - Moved closer to numbers (gap-1.5)
   - Removed ml-auto to keep compact on right

4. Container padding reduced:
   - Carousel content: px-3 → px-1.5 (more width for cards)
   - Card internal padding reduced for more title room

**Remaining Work (Next Session):**
- Continue UI polish based on user feedback
- Ensure chevron alignment across all cards
- Fine-tune spacing and proportions

### Session 3 (2026-01-11) - Card Sizing & Period Comparison Fixes

**UI Fixes - Card Uniformity:**
1. Added title truncation - category names capped at 16 characters with ellipsis (`…`)
   - Full name shown on hover via `title` attribute
2. Uniform card height - added `minHeight: '64px'` to ensure all cards same size
3. Rounded corners on main card - changed from `rounded-l-xl` to `rounded-xl`
   - Card now has rounded corners on all sides
   - Added `marginRight: '-8px'` and `zIndex: 1` so card overlaps button
   - Creates visual effect of button "emerging from behind" the card
4. Narrowed drill-down button - reduced from `w-7` to `w-6`, added `pl-2` padding
   - Button has `zIndex: 0` to sit behind card overlap

**Critical Bug Fixes - Period Comparison:**

1. **Week-of-month vs ISO weeks mismatch** (`src/utils/periodComparison.ts`)
   - Problem: `isDateInPeriod()` was using ISO week numbers (1-52/53) but TrendsView uses "week of month" (1-5)
   - Solution: Updated `isDateInPeriod()` to check year, month, AND week-of-month
   - Added `getWeekOfMonth(date)` - returns `Math.ceil(date.getDate() / 7)`
   - Added `getWeeksInMonth(year, month)` - returns number of weeks in a month
   - Updated `getPreviousPeriod()` for week: now requires `month`, Week 1 goes to last week of previous month

2. **STORE_CATEGORY_GROUPS lookup bug** (`src/views/TrendsView.tsx` lines 3220-3224)
   - Problem: Code was iterating `Object.entries(STORE_CATEGORY_GROUPS)` and calling `.includes()` on strings
   - `STORE_CATEGORY_GROUPS` is `Record<StoreCategory, StoreCategoryGroup>` (category → group), not group → categories[]
   - Solution: Direct lookup `STORE_CATEGORY_GROUPS[storeCat]` instead of iteration

3. **ITEM_CATEGORY_GROUPS lookup bug** (`src/views/TrendsView.tsx` lines 3236-3240 and 3278-3280)
   - Same issue: Code was iterating and calling `.includes()` incorrectly
   - Solution: Direct lookup `ITEM_CATEGORY_GROUPS[groupKey]`

**Root Cause Analysis:**
- The lookup bugs in `previousPeriodTotals` caused it to return empty maps for `store-groups` and `item-groups` view modes
- Empty previous period data → `calculateChange()` returns `{ direction: 'new' }` for every category
- Result: All categories showed "nuevo" badge instead of actual percentage changes

**Test Updates:**
- Updated `tests/unit/utils/periodComparison.test.ts`:
  - Changed week tests from ISO weeks to week-of-month semantics
  - Added tests for `getWeeksInMonth()` and `getWeekOfMonth()`
  - All 47 tests passing

**Files Modified:**
- `src/views/TrendsView.tsx` - Card styling, truncation, bug fixes in `previousPeriodTotals`
- `src/utils/periodComparison.ts` - Week-of-month logic for `getPreviousPeriod()` and `isDateInPeriod()`
- `tests/unit/utils/periodComparison.test.ts` - Updated tests for new week semantics

**Verified Working:**
- Period comparison now works for all 4 view modes:
  - 🏪 store-groups (was broken, now fixed)
  - 🛒 store-categories (was working)
  - 📦 item-groups (was broken, now fixed)
  - 🏷️ item-categories (was working)
- Week 1 of January 2026 correctly compares to Week 4/5 of December 2025

### Session 4 (2026-01-11) - Expand/Collapse Buttons & Filter Integration

**New Features Implemented:**

1. **Expand/Collapse Buttons for Sparklines** (AC #6 partial)
   - Added `trendExpandedCount` and `trendDrillDownExpandedCount` state variables
   - Created `computeTrendCategories()` function (mirrors `computeTreemapCategories()`)
   - Added +/- buttons to sparklines view matching TreeMap positioning (`left-2`, `top: 80px`)
   - Buttons show count badges (hidden categories count, expanded count)
   - "Más" group aggregates categories with ≤10% participation

2. **Category Filter Integration** (Bug Fix)
   - **Problem:** CategorySelectorOverlay filters weren't affecting Tendencia sparklines
   - **Root Cause:** `filteredTransactions` only filtered by time period, ignored `filterState.category/location/group`
   - **Solution:** Updated `filteredTransactions` to apply both period AND category/location/group filters
   - Also updated `previousPeriodTransactions` to apply same filters for consistency
   - Now all views (TreeMap, DonutChart, Sparklines) respect the filter selection

3. **"Más" Navigation Fix** (Bug Fix)
   - **Problem:** Clicking "Más" in sparklines navigated with "Más" as filter (not a real category)
   - **Solution:** Updated `handleTrendCountClick` to expand "Más" to constituent categories
     - For store-categories: joins hidden category names
     - For store-groups: expands each group to store categories
     - For item-groups: expands each group to item categories
     - For item-categories: joins hidden item category names
   - Updated `handleTrendDrillDown` to block drilling into "Más" (not a real category)

**Files Modified:**
- `src/views/TrendsView.tsx`:
  - Added import for `filterTransactionsByHistoryFilters`, `HistoryFilterState`
  - Added state: `trendExpandedCount`, `trendDrillDownExpandedCount`
  - Added function: `computeTrendCategories()` (lines 662-766)
  - Updated `filteredTransactions` to apply category/location/group filters (lines 2955-2972)
  - Updated `previousPeriodTransactions` to apply same filters (lines 3310-3347)
  - Added computed: `displayTrendData`, `otroTrendCategories`, `trendCanExpand`, `trendCanCollapse`
  - Updated `handleTrendCountClick` to handle "Más" expansion (lines 4002-4113)
  - Updated `handleTrendDrillDown` to block "Más" drill-down (lines 3979-3994)
  - Added expand/collapse buttons UI to sparklines section (lines 5002-5075)

**Known Issue - FIXED (Session 5):**
- ~~**Expand/Collapse buttons not working correctly:** Clicking +/- buttons should show/hide more categories in the sparklines list, but the display is not updating as expected.~~
- **Root Cause:** `displayTrendData.slice(0, 5)` at line 5045 was limiting display to only 5 items regardless of expansion state
- **Fix:** Removed `.slice(0, 5)` - `displayTrendData` already handles filtering via `computeTrendCategories()`

### Session 5 (2026-01-11) - Expand/Collapse Bug Fix

**Bug Fixed:**
- **Problem:** Clicking +/- expand/collapse buttons in sparklines view didn't show more/fewer categories
- **Root Cause:** Line 5045 had `displayTrendData.slice(0, 5).map(...)` which hard-limited the display to 5 items
  - `computeTrendCategories()` correctly computed expanded categories
  - `displayTrendData` correctly contained all expanded categories
  - But `.slice(0, 5)` threw away any categories beyond the first 5
- **Solution:** Changed `displayTrendData.slice(0, 5).map(...)` to `displayTrendData.map(...)`
  - Now all categories from `displayTrendData` are rendered
  - Expand/collapse buttons now correctly show/hide categories

**Files Modified:**
- `src/views/TrendsView.tsx` - Removed `.slice(0, 5)` limit from sparklines rendering (line 5045)

---
