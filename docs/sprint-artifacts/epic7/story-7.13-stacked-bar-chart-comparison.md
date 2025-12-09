# Story 7.13: Stacked Bar Chart for Comparison Mode

Status: done

## Story

As a **user**,
I want **the Comparison mode to show stacked bar charts where categories are vertically stacked within each bar**,
so that **I can see both the total spending per time period AND the category breakdown in a single visual**.

## Acceptance Criteria

1. **AC #1:** Comparison mode displays stacked bars (categories vertically stacked) instead of grouped bars (categories side-by-side)
2. **AC #2:** Each bar shows the total height representing total spending for that period
3. **AC #3:** Bars are segmented by category with consistent colors matching the legend
4. **AC #4:** Hovering/tapping a segment shows tooltip with category name and amount
5. **AC #5:** Bar widths adjust dynamically based on the number of time periods shown (w-10 for few bars, w-6 for many)
6. **AC #6:** The chart maintains consistent gap-2 spacing between bars
7. **AC #7:** All existing unit tests pass after refactoring

### Extended AC (from UX review 2025-12-08)

8. **AC #8:** Year view shows 4 bars (Q1, Q2, Q3, Q4) - group by quarters
9. **AC #9:** Quarter view shows 3 bars (months within quarter) - e.g., Oct, Nov, Dec
10. **AC #10:** Month view shows 4-5 bars (W1, W2, W3, W4, W5) - group by weeks
11. **AC #11:** Week view shows 7 bars (Mon-Sun) - group by days of week
12. **AC #12:** Day view has no comparison mode (pie chart only)
13. **AC #13:** Bars use full container width with justify-between distribution
14. **AC #14:** When too many bars to display cleanly (e.g., 31 days), enable horizontal scroll

## Tasks / Subtasks

### Phase 1: Basic Stacked Bar Implementation (COMPLETED)

- [x] Task 1: Rename/refactor GroupedBarChart to StackedBarChart (AC: #1, #2, #3)
  - [x] Update component to stack segments vertically instead of side-by-side
  - [x] Each bar is a single column with segments stacked on top of each other
  - [x] Height of each segment proportional to its value
  - [x] Total bar height = sum of all segment values

- [x] Task 2: Update segment rendering logic (AC: #3, #4)
  - [x] Segments render from bottom to top within each bar
  - [x] Maintain segment colors from category color map
  - [x] Tooltip shows category name and value on hover

- [x] Task 3: Dynamic bar width adjustment (AC: #5, #6)
  - [x] Few bars (1-6): w-10 (40px)
  - [x] Medium bars (7-12): w-8 (32px)
  - [x] Many bars (13+): w-6 (24px)
  - [x] Maintain gap-2 between all bars

- [x] Task 4: Update TrendsView import if component is renamed (AC: All)
  - [x] Update import statement in TrendsView.tsx
  - [x] Verify chart renders correctly in Comparison mode

- [x] Task 5: Run tests and verify (AC: #7)
  - [x] TypeScript compilation passes
  - [x] All unit tests pass
  - [x] Visual verification in browser

### Phase 2: Correct Temporal Grouping (COMPLETED)

- [x] Task 6: Fix computeBarData to group by correct temporal periods (AC: #8-#12)
  - [x] Year view → group transactions by quarters (Q1-Q4)
  - [x] Quarter view → group by months within quarter (3 months)
  - [x] Month view → group by weeks (W1-W5)
  - [x] Week view → group by days of week (Mon-Sun)
  - [x] Day view → return empty (no comparison)
  - **FILE MODIFIED:** `src/views/TrendsView.tsx` - `computeBarData()` function rewritten

- [x] Task 7: Update StackedBarChart for full-width distribution (AC: #13)
  - [x] Use `justify-between` for ≤8 bars to spread across full width
  - [x] Bars use `flex-1 max-w-16` to fill available space evenly
  - [x] Max bar width capped at 48px when using justify-between
  - **FILE MODIFIED:** `src/components/charts/GroupedBarChart.tsx`

- [x] Task 8: Handle horizontal scroll for many bars (AC: #14)
  - [x] `needsScroll` flag when `data.length > 8`
  - [x] Scroll mode uses `gap-2 min-w-max overflow-x-auto`
  - [x] Fixed widths (w-10, w-8) in scroll mode
  - **FILE MODIFIED:** `src/components/charts/GroupedBarChart.tsx`

- [x] Task 9: Test all temporal levels
  - [x] TypeScript compilation passes
  - [x] All 634 unit tests pass
  - [x] Ready for visual verification

## Dev Notes

### Architecture Alignment

This story fixes a UX discrepancy where the mockup shows stacked bars but the implementation shows grouped bars.

**Current Implementation (GroupedBarChart):**
```tsx
// Each bar group has segments SIDE BY SIDE
<div className="flex items-end gap-1 h-full">
  {d.segments.map((seg, j) => (
    <div key={j} className="w-3 sm:w-4 rounded-t" ... />
  ))}
</div>
```

**Target Implementation (StackedBarChart per UX Spec):**
```tsx
// Each bar has segments STACKED VERTICALLY
<div className="flex flex-col-reverse w-10 h-full">
  {d.segments.map((seg, j) => (
    <div key={j} style={{ height: `${(seg.value / total) * 100}%` }} ... />
  ))}
</div>
```

### UX Mockup Reference (docs/ux-design-directions.html)

**Bar data per temporal level from mockup:**

```javascript
// Year view - 4 quarters
barData: [
    { label: 'Q1', total: 85, segments: [...] },
    { label: 'Q2', total: 92, segments: [...] },
    { label: 'Q3', total: 78, segments: [...] },
    { label: 'Q4', total: 100, segments: [...] }
]

// Quarter view - 3 months
barData: [
    { label: 'Oct', total: 88, segments: [...] },
    { label: 'Nov', total: 100, segments: [...] },
    { label: 'Dec', total: 95, segments: [...] }
]

// Month view - 4-5 weeks
barData: [
    { label: 'W1', total: 75, segments: [...] },
    { label: 'W2', total: 90, segments: [...] },
    { label: 'W3', total: 100, segments: [...] },
    { label: 'W4', total: 85, segments: [...] }
]

// Week view - 7 days
barData: [
    { label: 'Mon', total: 60, segments: [...] },
    { label: 'Tue', total: 45, segments: [...] },
    { label: 'Wed', total: 80, segments: [...] },
    { label: 'Thu', total: 55, segments: [...] },
    { label: 'Fri', total: 100, segments: [...] },
    { label: 'Sat', total: 95, segments: [...] },
    { label: 'Sun', total: 70, segments: [...] }
]

// Day view - NO comparison (returns empty)
barData: []
```

**Mockup bar chart rendering:**
```javascript
// From UX mockup - bars use justify-between for full width
<div class="flex justify-between items-end px-6 gap-2">${barsHtml}</div>
```

### Visual Reference

**Grouped (WRONG - old implementation):**
```
  █ █ █   █ █ █   █ █ █
  A B C   A B C   A B C
  Jan     Feb     Mar
```

**Stacked with months (WRONG - current grouping):**
```
█ █ █ █ █ █ █ █ █ █ █ █
J F M A M J J A S O N D
```

**Stacked with quarters (CORRECT - per UX mockup):**
```
    █         █         █         █
    █         █         █         █
    █         █         █         █
   Q1        Q2        Q3        Q4
```

### Files Modified

1. `src/components/charts/GroupedBarChart.tsx` - Phase 1: Stacked bar implementation
2. `src/views/TrendsView.tsx` - Phase 2: computeBarData() rewritten for correct grouping

### Testing Strategy

```bash
# During development
npx tsc --noEmit
npm run test:unit

# Before marking story as "review"
npm run test:all

# Manual verification at each temporal level
- Year view: Should show Q1, Q2, Q3, Q4
- Quarter view: Should show 3 months (e.g., Oct, Nov, Dec)
- Month view: Should show W1, W2, W3, W4 (maybe W5)
- Week view: Should show Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Day view: Should show pie chart only (no bars)
```

### References

- [Source: docs/ux-design-specification.md](docs/ux-design-specification.md) - Section 6.2 StackedBarChart spec
- [Source: docs/ux-design-directions.html](docs/ux-design-directions.html) - Visual mockup with stacked bars and correct temporal grouping

## Dev Agent Record

### Context Reference

- [7-13-stacked-bar-chart-comparison.context.xml](7-13-stacked-bar-chart-comparison.context.xml) - Generated 2025-12-08

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

**Phase 1 Implementation Plan (2025-12-08):**
1. Rename component to StackedBarChart with GroupedBarChart alias for backward compatibility
2. Change scaling from max segment value to maxTotal (bar height represents total spending)
3. Change layout from horizontal (flex items-end gap-1) to vertical stacking (flex-col-reverse)
4. Add dynamic bar width: w-10 (≤6 bars), w-8 (7-12 bars), w-6 (13+ bars)
5. Change container gap from gap-4 to gap-2 per UX spec
6. Update segment height calculation: (seg.value / d.total) * 100%
7. Add hover state tracking for tooltip display
8. Keep tooltip functionality with proper positioning

**Phase 2 Implementation Plan (2025-12-08):**
1. Rewrite computeBarData() in TrendsView.tsx to handle all temporal levels
2. Year level → group by quarters using getQuarterFromMonth()
3. Quarter level → group by months (YYYY-MM keys)
4. Month level → group by weeks (W1-W5 based on day/7)
5. Week level → group by day of week (0-6 → Mon-Sun labels)
6. Day level → return empty array (no comparison)
7. Update StackedBarChart to use justify-between for full width
8. Keep horizontal scroll for edge cases

### Completion Notes List

**Phase 1 (COMPLETED):**
- Refactored GroupedBarChart.tsx to implement stacked vertical bars per UX spec Section 6.2
- Bar heights now scale to maxTotal (total of all segments), not individual segment max
- Segments stack vertically using flex-col-reverse (bottom-to-top)
- Dynamic bar widths: w-10 for ≤6 bars, w-8 for 7-12 bars, w-6 for 13+ bars
- Container uses gap-2 for consistent spacing between bars
- Tooltip shows on individual segment hover via state tracking
- Exported alias GroupedBarChart = StackedBarChart for backward compatibility with TrendsView
- All 634 unit tests pass; TypeScript compilation clean

**Phase 2 (COMPLETED):**
- Rewrote computeBarData() function in TrendsView.tsx for correct temporal grouping
- Year view → Q1, Q2, Q3, Q4 (4 bars)
- Quarter view → 3 months (e.g., Oct, Nov, Dec)
- Month view → W1, W2, W3, W4, W5 (4-5 bars)
- Week view → Mon, Tue, Wed, Thu, Fri, Sat, Sun (7 bars)
- Day view → no comparison (returns empty)
- Updated StackedBarChart for full-width distribution using `justify-between`
- Bars fill container width with `flex-1 max-w-16`, max 48px width
- Horizontal scroll enabled for >8 bars (edge cases)
- All 634 unit tests pass; TypeScript compilation clean

**Phase 2.1 - Fixed Slot Layout (COMPLETED):**
- Updated computeBarData() to ALWAYS show all slots for each temporal level
- Year: Always 4 quarters (Q1-Q4), empty bars for quarters without data
- Quarter: Always 3 months for that quarter, empty bars for months without data
- Month: 4-5 weeks depending on month length, empty bars for weeks without data
- Week: Always 7 days (Mon-Sun), empty bars for days without data
- Provides consistent chart layout regardless of data availability
- All 634 unit tests pass; TypeScript compilation clean

**Phase 2.2 - Bar Label Font Size Fix (COMPLETED):**
- Changed bar label font from `text-[10px]` to `text-xs` (12px) per UX spec Section 3.3
- Labels now match mockup font size

**Phase 2.3 - Calculation Mismatch Fix (COMPLETED):**
- User reported: Q4 header shows $642,460 but Oct+Nov+Dec sum to ~$6,326 (100x discrepancy)
- Root cause: DrillDownCard.tsx was dividing values by 100, assuming cents (incorrect for CLP)
- Fix: Removed `/100` division - CLP has no decimal places, values are stored as-is
- Updated DrillDownCard.test.tsx to expect correct behavior

**Phase 2.4 - Week Calculation Fix (COMPLETED):**
- Changed default from 5 weeks to 4 weeks per UX mockup
- Week 5 only appears if there's data in days 29-31
- Updated DrillDownGrid.tsx and TrendsView.tsx

**Phase 2.5 - Font Size & UX Polish (COMPLETED):**
- Increased DrillDownCard label: text-sm → text-base (16px)
- Increased DrillDownCard value: added text-lg (18px)
- Increased DrillDownCard percentage: text-xs → text-sm (14px)
- Increased section labels: text-sm → text-base
- Increased tap hint: text-sm → text-base
- Increased CategoryLegend: text-xs → text-sm
- Increased bar chart labels: text-xs → text-sm (14px)

**Phase 2.6 - Label Capitalization & Temporal Colors (COMPLETED):**
- Added capitalizeFirst() helper for temporal labels (e.g., "octubre" → "Octubre")
- Applied to getShortMonthName(), getFullMonthName(), and bar chart labels
- Added TEMPORAL_COLORS array: blue → green → orange → red pattern
- Updated getColor() to handle temporal keys (temporal-0, temporal-1, etc.)

**Phase 2.7 - Collapsible Empty Items (COMPLETED):**
- Drill-down cards now show only items with data first
- Empty items hidden in collapsible section ("Show X empty periods")
- Independent collapse state for temporal and category sections
- Updated tests for new collapsible behavior
- All 636 tests pass

### File List

- `src/components/charts/GroupedBarChart.tsx` (modified) - Stacked bar + full-width distribution, label font size
- `src/views/TrendsView.tsx` (modified) - computeBarData() rewritten for temporal grouping, month label capitalization
- `src/components/analytics/DrillDownCard.tsx` (modified) - Fixed currency formatting (no /100), increased font sizes
- `src/components/analytics/DrillDownGrid.tsx` (modified) - Week calculation, capitalization, collapsible empty sections
- `src/components/analytics/CategoryLegend.tsx` (modified) - Increased font size
- `src/utils/colors.ts` (modified) - Added TEMPORAL_COLORS array for temporal drill-down items
- `tests/unit/analytics/DrillDownCard.test.tsx` (modified) - Updated for correct currency behavior
- `tests/unit/analytics/DrillDownGrid.test.tsx` (modified) - Updated for 4-week default and collapsible behavior

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-08 | Story created to fix Comparison mode chart from grouped to stacked bars | Dev Agent |
| 2025-12-08 | Phase 1 complete - stacked bar component implementation | Dev Agent |
| 2025-12-08 | Phase 2 started - UX review revealed incorrect temporal grouping | Dev Agent |
| 2025-12-08 | Added extended ACs #8-#14 for correct temporal grouping and full-width bars | Dev Agent |
| 2025-12-08 | Rewrote computeBarData() for correct grouping (Year→Q, Quarter→M, Month→W, Week→D) | Dev Agent |
| 2025-12-08 | Phase 2 complete - full-width bars with justify-between, all tests pass | Dev Agent |
| 2025-12-08 | Phase 2.1 - Fixed slot layout: always show all Q/M/W/D slots even without data | Dev Agent |
| 2025-12-08 | Phase 2.2 - Fixed bar label font size from 10px to 12px (text-xs) per UX spec | Dev Agent |
| 2025-12-08 | Phase 2.3 - Fixed 100x calculation mismatch (DrillDownCard /100 bug for CLP) | Dev Agent |
| 2025-12-08 | Phase 2.4 - Fixed week calculation (4 weeks default, W5 only if data exists) | Dev Agent |
| 2025-12-08 | Phase 2.5 - Increased font sizes across DrillDownCard, CategoryLegend, bar labels | Dev Agent |
| 2025-12-08 | Phase 2.6 - Added label capitalization and temporal color palette (blue→green→orange→red) | Dev Agent |
| 2025-12-08 | Phase 2.7 - Added collapsible section for empty drill-down items | Dev Agent |

---

## Code Review

### Review Metadata

| Field | Value |
|-------|-------|
| **Review Date** | 2025-12-08 |
| **Reviewer** | Code Review Agent (Claude Opus 4.5) |
| **Story Key** | 7-13-stacked-bar-chart-comparison |
| **Epic** | 7 - Analytics & Trends Dashboard |
| **Review Outcome** | ✅ **APPROVED** |

### AC Validation Summary

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| #1 | Stacked bars (vertically stacked) | ✅ PASS | `GroupedBarChart.tsx:76-84` - `flex-col-reverse` |
| #2 | Bar height = total spending | ✅ PASS | `GroupedBarChart.tsx:45` - maxTotal scaling |
| #3 | Segments with consistent colors | ✅ PASS | `colors.ts:22-53` - getColor() preset map |
| #4 | Tooltips on segment hover | ✅ PASS | `GroupedBarChart.tsx:107-113` - hover state |
| #5 | Dynamic bar widths | ✅ PASS | `GroupedBarChart.tsx:53-57` - getBarWidthClass() |
| #6 | gap-2 spacing | ✅ PASS | `GroupedBarChart.tsx:73` - gap-2 class |
| #7 | All tests pass | ✅ PASS | 636 unit tests pass |
| #8 | Year → 4 quarters | ✅ PASS | `TrendsView.tsx:256-262` |
| #9 | Quarter → 3 months | ✅ PASS | `TrendsView.tsx:264-277` |
| #10 | Month → 4-5 weeks | ✅ PASS | `TrendsView.tsx:278-292` |
| #11 | Week → 7 days | ✅ PASS | `TrendsView.tsx:293-305` |
| #12 | Day → no comparison | ✅ PASS | `TrendsView.tsx:208-209` |
| #13 | justify-between distribution | ✅ PASS | `GroupedBarChart.tsx:73` |
| #14 | Horizontal scroll for many bars | ✅ PASS | `GroupedBarChart.tsx:48,67` |

### Test Verification

```bash
# TypeScript compilation
npm run type-check  # ✅ PASS

# Unit tests
npm run test:unit:parallel  # ✅ 636 tests pass
```

### Code Quality Assessment

**Strengths:**
- Clean component architecture with clear separation of concerns
- Comprehensive JSDoc documentation referencing UX spec sections
- Full TypeScript coverage with proper interfaces
- Performance optimizations (React.memo, useMemo)
- Consistent color system with presets + temporal palette
- Accessibility: aria-hidden on decorative elements

**Files Reviewed:**
- [GroupedBarChart.tsx](src/components/charts/GroupedBarChart.tsx) - Stacked bar component
- [TrendsView.tsx](src/views/TrendsView.tsx) - computeBarData() temporal logic
- [DrillDownCard.tsx](src/components/analytics/DrillDownCard.tsx) - Currency formatting
- [DrillDownGrid.tsx](src/components/analytics/DrillDownGrid.tsx) - Week calculation, collapsible sections
- [CategoryLegend.tsx](src/components/analytics/CategoryLegend.tsx) - Legend display
- [colors.ts](src/utils/colors.ts) - TEMPORAL_COLORS palette
- Test files: DrillDownCard.test.tsx (40 tests), DrillDownGrid.test.tsx (41 tests)

### Risk Assessment

| Risk | Level | Notes |
|------|-------|-------|
| Performance with many bars | Low | needsScroll logic handles >8 bars |
| Color collision | Low | Preset colors + hash fallback |
| i18n edge cases | Low | Spanish/English locales tested |

### Follow-up Items

None identified. Implementation is complete and well-tested.

### Approval

**APPROVED** - All 14 acceptance criteria verified, 636 tests pass, code quality meets project standards. Story is ready for deployment.
