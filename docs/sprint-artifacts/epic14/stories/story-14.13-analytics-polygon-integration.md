# Story 14.13: Analytics Polygon Integration

**Status:** ready-for-dev
**Points:** 5
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.5, 14.6, 14.7, 14.8, 14.9 (all done)
**Mockup:** [analytics-polygon.html](../../../uxui/mockups/01_views/analytics-polygon.html)

---

## Story

**As a** user viewing my spending analytics,
**I want to** see the new polygon visualization and enhanced charts in TrendsView,
**So that** I can understand my spending patterns at a glance with the new visual design.

---

## Context

Epic 14 stories 14.5-14.9 built individual components (DynamicPolygon, LavaOverlay, PolygonModeToggle, enhanced charts, swipe navigation) but they are not yet integrated into the actual TrendsView. This story wires everything together so users can see the new analytics visualization.

### Components to Integrate:
- `DynamicPolygon` - 3-6 sided spending shape
- `PolygonWithModeToggle` - Wrapper with merchant/category toggle
- `LavaOverlay` - Budget proximity visualization
- Enhanced `SimplePieChart` and `GroupedBarChart` with animations
- `useSwipeNavigation` for time period navigation

---

## Acceptance Criteria

### AC #1: Polygon Visualization in TrendsView
- [ ] DynamicPolygon component rendered in TrendsView header area
- [ ] Polygon shows top 3-6 spending categories based on current filter
- [ ] PolygonModeToggle allows switching between merchant and category views
- [ ] LavaOverlay shows budget proximity when budget is set

### AC #2: Chart Selection and Layout
- [ ] Charts appear below polygon in scrollable area
- [ ] Existing chart mode toggle (Pie/Bar/Stacked) still works
- [ ] Charts use new animation framework (staggered entry, count-up)
- [ ] Layout matches analytics-polygon.html mockup structure

### AC #3: Swipe Time Navigation
- [ ] useSwipeNavigation integrated with temporal filter context
- [ ] Swipe left advances to next period (week/month/quarter/year)
- [ ] Swipe right goes to previous period
- [ ] Visual indicator during swipe gesture
- [ ] Haptic feedback on successful navigation (respecting reduced motion)

### AC #4: Screen Transitions
- [ ] PageTransition wraps TrendsView content
- [ ] TransitionChild used for staggered entry of sections
- [ ] Animations respect useReducedMotion preference

### AC #5: Responsive Design
- [ ] Polygon scales appropriately for different screen sizes
- [ ] Layout works on mobile (360px+) and tablet widths
- [ ] Touch targets meet 44px minimum

---

## Tasks

- [ ] Task 1: Import polygon components into TrendsView
- [ ] Task 2: Add polygon section to TrendsView header (above breadcrumbs or below)
- [ ] Task 3: Wire PolygonWithModeToggle to transaction data aggregation
- [ ] Task 4: Add LavaOverlay with budget context (if budget exists)
- [ ] Task 5: Integrate useSwipeNavigation with HistoryFiltersContext
- [ ] Task 6: Wrap view content with PageTransition + TransitionChild
- [ ] Task 7: Verify chart animations still work with new layout
- [ ] Task 8: Test on mobile viewport sizes
- [ ] Task 9: Write integration tests for polygon rendering

---

## File List

**Modified:**
- `src/views/TrendsView.tsx` - Main integration point

**Referenced (read-only):**
- `src/components/polygon/PolygonWithModeToggle.tsx`
- `src/components/polygon/DynamicPolygon.tsx`
- `src/components/polygon/LavaOverlay.tsx`
- `src/components/animation/PageTransition.tsx`
- `src/components/animation/TransitionChild.tsx`
- `src/hooks/useSwipeNavigation.ts`
- `src/hooks/useHistoryFilters.ts`

**New:**
- `tests/unit/views/TrendsView.polygon.test.tsx` - Integration tests

---

## Dev Notes

### Data Flow for Polygon
```typescript
// TrendsView needs to aggregate transactions by category
const categoryTotals = useMemo(() => {
  return filteredTransactions.reduce((acc, tx) => {
    const cat = tx.category || 'Other';
    acc[cat] = (acc[cat] || 0) + tx.total;
    return acc;
  }, {} as Record<string, number>);
}, [filteredTransactions]);

// Convert to polygon data format
const polygonData: CategoryData[] = Object.entries(categoryTotals)
  .map(([name, value]) => ({ name, value, color: getCategoryColor(name) }))
  .sort((a, b) => b.value - a.value)
  .slice(0, 6); // Top 6 categories
```

### Swipe Integration
```typescript
const { goNextPeriod, goPrevPeriod, canGoNext, canGoPrev } = useHistoryFilters();
const prefersReducedMotion = useReducedMotion();

const swipeHandlers = useSwipeNavigation({
  onSwipeLeft: canGoNext ? goNextPeriod : undefined,
  onSwipeRight: canGoPrev ? goPrevPeriod : undefined,
  hapticEnabled: !prefersReducedMotion,
});

// Apply to swipeable container
<div {...swipeHandlers}>
  {/* Polygon and charts */}
</div>
```

---

## Test Plan

1. Open TrendsView with transaction data
2. Verify polygon displays with correct category proportions
3. Toggle between merchant/category mode
4. Swipe left/right to navigate time periods
5. Verify animations play (or skip if reduced motion)
6. Test on mobile device for touch interactions
