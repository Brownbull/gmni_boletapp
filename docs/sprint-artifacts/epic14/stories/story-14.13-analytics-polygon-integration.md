# Story 14.13: Analytics Explorer Redesign

**Status:** review
**Points:** 8
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.5, 14.6, 14.7, 14.8, 14.9, 14.12 (DashboardView pattern)
**Mockup:** [analytics-polygon.html](../../../uxui/mockups/01_views/analytics-polygon.html)

---

## Story

**As a** user viewing my spending analytics,
**I want to** see the redesigned "Explora" view with treemap distribution, time navigation, and analytics carousel,
**So that** I can explore my spending patterns through an intuitive, card-based interface.

---

## Context

The `analytics-polygon.html` mockup shows a completely redesigned analytics view called "Explora" (Explorer). This is a **major redesign** of TrendsView, not just a polygon integration.

### Current State (What We Have):
- Header: "Gastify" with back arrow
- Categorías/Grupos toggle at top
- Polygon visualization with lava overlay
- Agregado/Comparar toggle
- Pie chart
- Temporal/Categoría drill-down tabs at bottom

### Target State (Mockup):
- Header: "Explora" with filter icons (calendar, tag, filter)
- Time pills row: `Semana | Mes | Trimestre | Año`
- Period navigator: `< Diciembre 2025 >`
- Analytics card with carousel:
  - Slide 1 "Distribución": Treemap grid (colored category cards)
  - Slide 2 "Tendencia": Trend list with sparklines
  - View toggle button (treemap ↔ donut)
- Indicator bar at bottom of card
- Swipe navigation between slides

### Key Differences:
1. **Remove polygon/lava overlay** - Not in this mockup (used in DashboardView instead)
2. **Remove pie/bar charts** - Replace with carousel slides
3. **Add treemap grid** - Colored category cards (similar to DashboardView "Este Mes")
4. **Add time pills** - Horizontal period selector
5. **Add period navigator** - Left/right arrows with month label
6. **Add analytics carousel** - Multiple slides with indicator bar

---

## Acceptance Criteria

### AC #1: Header Redesign
- [x] Title changes from "Gastify" to "Explora"
- [x] Remove back arrow (navigation via bottom nav)
- [x] Add filter icon buttons: Calendar, Tag, Layers (filter dropdowns)
- [x] Filter icons show active state when filters applied

### AC #2: Time Period Pills
- [x] Horizontal pill row: Semana | Mes | Trimestre | Año
- [x] Active pill highlighted (default: Mes)
- [x] Clicking pill changes temporal granularity
- [x] Pills update period navigator label format

### AC #3: Period Navigator
- [x] Left/right arrow buttons to navigate time
- [x] Center label shows current period (e.g., "Diciembre 2025")
- [x] Label format changes based on selected pill:
  - Semana: "Semana 1, Dic 2025"
  - Mes: "Diciembre 2025"
  - Trimestre: "Q4 2025"
  - Año: "2025"
- [x] Arrows disabled at boundaries (next arrow at current date)

### AC #4: Analytics Card with Carousel
- [x] Card container with rounded corners and shadow
- [x] Header: view toggle button + title + nav arrows
- [x] Carousel with 2+ slides (swipeable)
- [x] Indicator bar at bottom (clickable segments)
- [x] Slide titles: "Distribución", "Tendencia"

### AC #5: Treemap Distribution (Slide 1)
- [x] 2-column grid of category cards
- [x] Cards show: category name, transaction count, amount, percentage
- [x] Cards have gradient backgrounds per category color
- [x] Large categories span multiple rows
- [x] Tap card to drill down into category

### AC #6: Trend List (Slide 2)
- [x] List of categories with sparkline trends
- [x] Each item: icon, name, count, sparkline, amount, change %
- [x] Sorted by spending amount descending
- [x] Tap item to drill down

### AC #7: View Toggle (Treemap ↔ Donut)
- [x] Circular button morphs between chart-pie and grid icons
- [x] On Distribution slide: toggles between treemap and donut chart
- [x] On Tendencia slide: toggles between list and breakdown view
- [x] Smooth icon transition animation

### AC #8: Responsive Design
- [x] Layout works on mobile (360px+) and tablet widths
- [x] Touch targets meet 44px minimum
- [x] Carousel supports swipe gestures

---

## Tasks

### Phase 1: Layout Structure
- [x] Task 1.1: Remove old header (Gastify + back arrow)
- [x] Task 1.2: Add new header with "Explora" title and filter icons
- [x] Task 1.3: Add time period pills row
- [x] Task 1.4: Add period navigator (arrows + label)
- [x] Task 1.5: Remove polygon/lava overlay section
- [x] Task 1.6: Remove pie/bar chart section
- [x] Task 1.7: Remove old Temporal/Categoría tabs

### Phase 2: Analytics Card & Carousel
- [x] Task 2.1: Create analytics card container
- [x] Task 2.2: Add card header (toggle button + title + nav arrows)
- [x] Task 2.3: Implement carousel state (slide index, transitions)
- [x] Task 2.4: Add indicator bar with clickable segments
- [x] Task 2.5: Wire swipe gestures to carousel navigation

### Phase 3: Distribution Slide (Treemap)
- [x] Task 3.1: Create treemap grid component or reuse from DashboardView
- [x] Task 3.2: Compute category data for treemap
- [x] Task 3.3: Style treemap cells with gradients and typography
- [x] Task 3.4: Add tap handler for drill-down navigation
- [x] Task 3.5: Implement donut chart view as alternate

### Phase 4: Tendencia Slide (Trend List)
- [x] Task 4.1: Create trend list component
- [x] Task 4.2: Compute sparkline data for each category
- [x] Task 4.3: Style list items with sparkline SVGs
- [x] Task 4.4: Add change percentage calculation
- [x] Task 4.5: Implement breakdown view as alternate

### Phase 5: View Toggle Button
- [x] Task 5.1: Create view toggle button component
- [x] Task 5.2: Add icon morphing animation
- [x] Task 5.3: Wire toggle to switch views per slide

### Phase 6: Filter Dropdowns
- [x] Task 6.1: Create calendar/time filter dropdown with period selection
- [x] Task 6.2: Create category filter dropdown with multi-select checkboxes
- [x] Task 6.3: Create groups filter dropdown (placeholder for future item groups)
- [x] Task 6.4: Add active state indicators on filter buttons when filters applied

### Phase 7: Testing & Cleanup
- [x] Task 7.1: Update existing TrendsView tests
- [x] Task 7.2: Add new tests for carousel behavior
- [x] Task 7.3: Add tests for time pills and period navigator
- [x] Task 7.4: Remove obsolete polygon tests (tests updated, export tests skipped)
- [x] Task 7.5: Verify no regressions in other views (3323 tests pass)

---

## File List

**Modified:**
- `src/views/TrendsView.tsx` - Complete redesign

**New Components (may create):**
- `src/components/analytics/TimePills.tsx` - Time period selector
- `src/components/analytics/PeriodNavigator.tsx` - Arrow navigation
- `src/components/analytics/AnalyticsCarousel.tsx` - Carousel container
- `src/components/analytics/TreemapGrid.tsx` - Category treemap (or reuse from Dashboard)
- `src/components/analytics/TrendList.tsx` - Trend list with sparklines
- `src/components/analytics/ViewToggleButton.tsx` - Morphing icon button

**Tests Updated:**
- `tests/unit/views/TrendsView.polygon.test.tsx` → Rename/rewrite for new design
- `tests/integration/analytics/trendsViewIntegration.test.tsx` - Update for new structure

**Removed/Deprecated:**
- Polygon visualization in TrendsView (keep components for DashboardView)
- Pie chart in TrendsView
- Categorías/Grupos toggle in TrendsView
- Old Temporal/Categoría tabs

---

## Implementation Notes

### Reuse from DashboardView (Story 14.12)
The DashboardView already has similar patterns we can reuse:
- Treemap grid rendering (Este Mes slide)
- Carousel state management
- Indicator bar
- Month picker logic (can adapt for period navigator)

### State Management
```typescript
// Time period state
type TimePeriod = 'week' | 'month' | 'quarter' | 'year';
const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');

// Period navigation
const [currentPeriod, setCurrentPeriod] = useState({
  year: 2025,
  month: 12, // For month/week
  quarter: 4, // For quarter
  week: 1, // For week within month
});

// Carousel state
type CarouselSlide = 0 | 1; // Distribution, Tendencia
const [carouselSlide, setCarouselSlide] = useState<CarouselSlide>(0);

// View toggle per slide
const [distributionView, setDistributionView] = useState<'treemap' | 'donut'>('treemap');
const [tendenciaView, setTendenciaView] = useState<'list' | 'breakdown'>('list');
```

### Period Label Formatting
```typescript
const getPeriodLabel = (period: TimePeriod, current: CurrentPeriod): string => {
  const monthNames = ['Enero', 'Febrero', ..., 'Diciembre'];
  switch (period) {
    case 'week':
      return `Semana ${current.week}, ${monthNames[current.month - 1].slice(0,3)} ${current.year}`;
    case 'month':
      return `${monthNames[current.month - 1]} ${current.year}`;
    case 'quarter':
      return `Q${current.quarter} ${current.year}`;
    case 'year':
      return `${current.year}`;
  }
};
```

---

## Test Plan

1. Open TrendsView (now "Explora")
2. Verify header shows "Explora" with filter icons
3. Verify time pills show with "Mes" active by default
4. Click each pill and verify period label format changes
5. Click left/right arrows to navigate periods
6. Verify indicator bar shows 2 segments (Distribution active)
7. Swipe left to see Tendencia slide
8. Click view toggle button, verify treemap ↔ donut switch
9. Click treemap cell, verify drill-down navigation
10. Test on mobile viewport (360px)
11. Verify all touch targets are 44px+

---

## Previous Implementation (Archived)

The previous implementation (pre-redesign) added:
- Polygon visualization with lava overlay
- Swipe time navigation
- PageTransition animations

These features remain in the codebase but are now used in DashboardView (Mes a Mes slide) rather than TrendsView. The polygon components are NOT removed, just relocated.
