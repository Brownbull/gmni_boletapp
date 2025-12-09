# Story 7.16: Drill-Down Section Toggle (Temporal vs Category)

Status: done

## Story

As a **user**,
I want **to switch between temporal and category drill-down views using a toggle similar to Aggregation/Comparison**,
so that **I can choose to explore my data either by time periods or by spending categories**.

## Acceptance Criteria

1. **AC #1:** A toggle component appears above the drill-down cards section
2. **AC #2:** Toggle has two options: "Temporal" and "Category" (or localized equivalents)
3. **AC #3:** Toggle uses the same styling pattern as the Aggregation/Comparison toggle
4. **AC #4:** When "Temporal" is selected, drill-down cards show time periods (Q1, Q2, Q3, Q4 at year level; Week 1-4 at month level; etc.)
5. **AC #5:** When "Category" is selected, drill-down cards show spending categories (Supermarket, Veterinary, Technology, etc.)
6. **AC #6:** Default selection is "Temporal" to maintain current behavior
7. **AC #7:** Toggle state is independent from the chart mode toggle (Aggregation/Comparison)
8. **AC #8:** Works correctly in both English and Spanish

## Tasks / Subtasks

- [x] Task 1: Create DrillDownModeToggle component (AC: #1, #2, #3)
  - [x] Create new component similar to ChartModeToggle
  - [x] Two options: "Temporal" / "Category"
  - [x] Same styling pattern (outlined container, accent active state)
  - [x] Add to chart registry or manage locally

- [x] Task 2: Add drill-down mode state to AnalyticsContext (AC: #6, #7)
  - [x] Add `drillDownMode: 'temporal' | 'category'` state
  - [x] Default value is 'temporal'
  - [x] Add dispatch action to change mode

- [x] Task 3: Update DrillDownGrid to respect mode (AC: #4, #5)
  - [x] When mode is 'temporal', show time period cards (existing behavior)
  - [x] When mode is 'category', show category cards from current data
  - [x] Category cards show: Supermarket, Veterinary, Technology, Butcher, Restaurant, Other, Bakery, Bazaar, etc.

- [x] Task 4: Integrate toggle into TrendsView (AC: #1)
  - [x] Place toggle above DrillDownGrid
  - [x] Toggle controls what cards are displayed

- [x] Task 5: Add translations (AC: #8)
  - [x] `drillDownTemporal`: "Temporal" (EN) / "Temporal" (ES)
  - [x] `drillDownCategory`: "Category" (EN) / "Categoría" (ES)

- [x] Task 6: Run tests and verify (AC: All)
  - [x] TypeScript compilation passes
  - [x] All 654 unit tests pass
  - [x] Visual verification of both modes

## Dev Notes

### Visual Layout

```
┌─────────────────────────────────────────┐
│              [PIE CHART]                │
├─────────────────────────────────────────┤
│ ● Food 35%  ● Transport 20%  ...        │  ← Legend
├─────────────────────────────────────────┤
│          Tap to drill down              │
│ [◯ Temporal          ] [◯ Category    ] │  ← NEW TOGGLE
├─────────────────────────────────────────┤
│  TEMPORAL MODE:          CATEGORY MODE: │
│  ┌───────────────────┐   ┌───────────────────┐
│  │ ● Q1 2024  $2.8M  │   │ ● Supermarket 73% │
│  └───────────────────┘   └───────────────────┘
│  ┌───────────────────┐   ┌───────────────────┐
│  │ ● Q2 2024  $3.1M  │   │ ● Veterinary 11%  │
│  └───────────────────┘   └───────────────────┘
└─────────────────────────────────────────┘
```

### Category Cards Content

When in "Category" mode at year level, cards would show:
- All store categories with their totals and percentages
- Clicking a category card would filter to that category (same as clicking pie slice)

Example cards:
- Supermarket - $543,000 - 73%
- Veterinary - $82,000 - 11%
- Technology - $22,000 - 3%
- Butcher - $22,000 - 3%
- Restaurant - $22,000 - 3%
- Other - $22,000 - 3%
- Bakery - $14,000 - 2%
- Bazaar - $7,000 - 1%

### Files to Create/Update

1. **src/components/analytics/DrillDownModeToggle.tsx** (NEW)
   - Similar pattern to ChartModeToggle

2. **src/contexts/AnalyticsContext.tsx**
   - Add drillDownMode state and action

3. **src/components/analytics/DrillDownGrid.tsx**
   - Accept mode prop or read from context
   - Render temporal or category cards based on mode

4. **src/views/TrendsView.tsx**
   - Add DrillDownModeToggle above DrillDownGrid

5. **src/utils/translations.ts**
   - Add new translation keys

### Interaction with Existing Navigation

- **Temporal Mode + Temporal Cards**: Clicking Q1 navigates to Q1 (current behavior)
- **Category Mode + Category Cards**: Clicking Supermarket filters to Supermarket category
- Both modes work independently from Aggregation/Comparison chart mode

### Testing Strategy

```bash
# During development
npx tsc --noEmit
npm run test:unit

# Visual verification
- Toggle between Temporal and Category modes
- Verify cards change appropriately
- Test clicking cards in both modes
- Test all temporal levels (year, quarter, month, week)
```

### References

- [Source: docs/ux-design-directions.html](docs/ux-design-directions.html) - UX mockup
- User feedback about separating temporal/category drill-downs

## Dev Agent Record

### Context Reference

- [7-16-drill-down-section-toggle.context.xml](7-16-drill-down-section-toggle.context.xml) - Generated 2025-12-08

### Agent Model Used

- claude-opus-4-5-20251101

### Debug Log References

N/A

### Completion Notes List

1. Created DrillDownModeToggle component with Clock/Tag icons matching ChartModeToggle styling
2. Added DrillDownMode type ('temporal' | 'category') to analytics types
3. Extended AnalyticsNavigationState with drillDownMode field (default: 'temporal')
4. Added TOGGLE_DRILLDOWN_MODE action and reducer case
5. Updated DrillDownGrid to only show one section based on drillDownMode
6. Integrated toggle into TrendsView above drill-down cards
7. Added translations: drillDownTemporal, drillDownCategory (EN/ES)
8. Created 15 new unit tests for DrillDownModeToggle
9. Updated existing DrillDownGrid tests for new behavior
10. All 654 unit tests pass, TypeScript compiles, build succeeds

### File List

**Created:**
- src/components/analytics/DrillDownModeToggle.tsx
- tests/unit/analytics/DrillDownModeToggle.test.tsx

**Modified:**
- src/types/analytics.ts - Added DrillDownMode type and updated state/actions
- src/utils/analyticsHelpers.ts - Updated getDefaultNavigationState, validateNavigationState
- src/contexts/AnalyticsContext.tsx - Added TOGGLE_DRILLDOWN_MODE reducer case and action creator
- src/hooks/useAnalyticsNavigation.ts - Exposed drillDownMode selector
- src/components/analytics/DrillDownGrid.tsx - Respects drillDownMode to show one section
- src/views/TrendsView.tsx - Added DrillDownModeToggle import and component
- src/utils/translations.ts - Added drillDownTemporal, drillDownCategory keys
- tests/unit/analytics/DrillDownGrid.test.tsx - Updated for new drillDownMode behavior
- tests/unit/analytics/validateNavigationState.test.ts - Added drillDownMode to test states

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-08 | Story created based on user feedback about drill-down navigation | Dev Agent |
| 2025-12-08 | Implementation complete - all ACs satisfied, 654 tests pass | Dev Agent (Claude Opus 4.5) |
