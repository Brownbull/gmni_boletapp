# Story 14.12: Home Dashboard Refresh

**Status:** done
**Points:** 5
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.1 (Animation Framework), Story 14.5 (DynamicPolygon)
**Mockup:** [home-dashboard.html](../../../uxui/mockups/01_views/home-dashboard.html)

---

## Story

**As a** user landing on the home screen,
**I want to** see a refreshed dashboard with a carousel of visualizations,
**So that** I get an immediate overview of my spending through multiple views.

---

## Context

The home-dashboard.html mockup shows a redesigned home screen with:
- **Carousel with 3 views**: Este Mes (treemap), Mes a Mes (polygon), Ultimos 4 Meses (bump chart)
- **Month/year picker dropdown** on title to select data period
- **Collapse/expand button** (+/-) to minimize carousel
- **Arrow navigation** to switch between carousel slides
- **Indicator bar** at bottom showing current slide
- "Recientes" expandable transaction list
- Quick actions via FAB in bottom navigation

This story updates DashboardView to match the mockup design.

---

## Acceptance Criteria

### AC #1: Carousel with 3 Views
- [x] Card with 3 slides: "Este Mes", "Mes a Mes", "Ultimos 4 Meses"
- [x] Left/right arrow buttons to navigate slides (wraps around)
- [x] Indicator bar at bottom with 3 segments (clickable)
- [x] +/- button to collapse/expand carousel content
- [x] Slide 0 (Este Mes): Treemap grid with top 4 categories
- [x] Slide 1 (Mes a Mes): DynamicPolygon comparing categories
- [x] Slide 2 (Ultimos 4 Meses): Bump chart showing category rankings over 4 months

### AC #2: Month Picker Dropdown
- [x] Tap title to open month/year picker
- [x] Year navigation with left/right arrows
- [x] Month navigation with left/right arrows
- [x] Future months disabled
- [x] "Aplicar" button to confirm selection
- [x] Selection updates all carousel data
- [x] Click outside closes picker

### AC #3: Recientes Section
- [x] Show 3 transactions collapsed, 5 when expanded
- [x] Expand button (+/-) to toggle
- [x] Each transaction shows: merchant, amount, category emoji, date/time, location
- [x] "Ver todo" link navigates to full HistoryView
- [x] Transactions filtered by selected month

### AC #4: Quick Actions
- [x] Quick actions handled by FAB in Nav.tsx (per mockup alignment)
- [x] Scan functionality integrated into bottom navigation FAB
- Note: Separate dashboard buttons removed per UX review - FAB provides better mobile ergonomics

### AC #5: Screen Transitions
- [x] PageTransition wraps dashboard content
- [x] Staggered entry for sections (carousel, actions, recientes)

---

## Tasks

- [x] Task 1: Create carousel state management (slide index, collapsed state)
- [x] Task 2: Build carousel header with title, +/- button, and nav arrows
- [x] Task 3: Implement month picker dropdown with year/month selectors
- [x] Task 4: Create treemap slide (Slide 0: Este Mes)
- [x] Task 5: Create polygon slide (Slide 1: Mes a Mes) with DynamicPolygon
- [x] Task 6: Create bump chart slide (Slide 2: Ultimos 4 Meses) with SVG
- [x] Task 7: Add carousel indicator bar at bottom
- [x] Task 8: Update tests for new carousel behavior (48 tests)

---

## Implementation Details

### Architecture
The dashboard now has:
1. **Carousel Card**: 3-slide carousel with title, controls, and indicator bar
2. **Recientes Section**: Collapsible transaction list (3/5 items) with dual-mode carousel (by scan date / by transaction date)
3. **Quick Actions**: Handled by FAB in Nav.tsx (per UX mockup alignment)

### Key Features

**Carousel State:**
```typescript
type CarouselSlide = 0 | 1 | 2;
const CAROUSEL_TITLES = ['Este Mes', 'Mes a Mes', 'Ultimos 4 Meses'] as const;

const [carouselSlide, setCarouselSlide] = useState<CarouselSlide>(0);
const [carouselCollapsed, setCarouselCollapsed] = useState(false);
const [showMonthPicker, setShowMonthPicker] = useState(false);
```

**Month Picker:**
```typescript
const handleMonthSelect = (year: number, month: number) => {
    setSelectedMonth({ year, month });
    setShowMonthPicker(false);
};

// Close on outside click
useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
            setShowMonthPicker(false);
        }
    };
    if (showMonthPicker) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showMonthPicker]);
```

**Bump Chart Data:**
```typescript
const bumpChartData = useMemo(() => {
    // Get last 4 months including current
    const months = []; // [{year, month, label}]
    // Calculate category rankings per month
    const categoryRankings = {}; // {cat: {amounts: [n,n,n,n], color}}
    // Return top 4 categories by total across all months
    return { months: ['Oct', 'Nov', 'Dic', 'Hoy'], categories: [...] };
}, [allTx, selectedMonth]);
```

### Navigation
- Slide arrows → `goToPrevSlide()` / `goToNextSlide()` (wraps at 0/2)
- Indicator click → `setCarouselSlide(idx)`
- Collapse button → `toggleCarouselCollapse()`
- Title click → `setShowMonthPicker(true)`
- Month select → `handleMonthSelect(year, month)`
- Treemap tap → `onViewTrends(selectedMonthString)`
- Transaction tap → `onEditTransaction(tx)`
- Ver todo tap → `onViewHistory()` or internal full list view
- Scan FAB → Handled in Nav.tsx

---

## File List

**Modified:**
- `src/views/DashboardView.tsx` - Complete dashboard refresh with carousel

**Updated:**
- `tests/unit/views/DashboardView.test.tsx` - Updated tests (47 tests)

**Referenced:**
- `src/components/polygon/DynamicPolygon.tsx` - Polygon for Mes a Mes view
- `src/components/animation/PageTransition.tsx` - View transitions
- `src/components/animation/TransitionChild.tsx` - Staggered entry
- `src/hooks/useCountUp.ts` - Animated values
- `src/utils/colors.ts` - Category colors
- `src/utils/categoryEmoji.ts` - Category emojis

---

## Test Results

```
✓ tests/unit/views/DashboardView.test.tsx (48 tests) 801ms
```

### Test Coverage
- AC#1: Carousel with 3 views (13 tests)
  - Carousel card rendering
  - Navigation buttons (prev/next)
  - Slide title changes
  - Indicator bar segments
  - Indicator click navigation
  - Collapse/expand functionality
  - Wrap-around navigation
- AC#1a: Treemap view (4 tests)
- AC#1b: Polygon view (2 tests)
- AC#1c: Bump chart view (1 test)
- AC#2: Month picker dropdown (7 tests)
- AC#3: Recientes section (6 tests)
- AC#4: Quick actions - handled by Nav.tsx FAB (no separate tests needed)
- AC#5: Duplicate detection (3 tests)
- Thumbnail functionality (4 tests)
- Full list view (6 tests)
- Backward compatibility (1 test)

---

## Test Plan

1. ✅ Open app to home/dashboard
2. ✅ Verify carousel shows "Este Mes" treemap by default
3. ✅ Click right arrow to see "Mes a Mes" polygon
4. ✅ Click right arrow to see "Ultimos 4 Meses" bump chart
5. ✅ Click right arrow again to wrap back to treemap
6. ✅ Click indicator bar segment to jump to specific slide
7. ✅ Click +/- button to collapse carousel
8. ✅ Click +/- button again to expand
9. ✅ Click title to open month picker
10. ✅ Select different year and month
11. ✅ Verify all slides update with selected month's data
12. ✅ Click outside picker to close
13. ✅ Tap treemap, verify navigation to TrendsView
14. ✅ Check recientes shows 3 transactions collapsed
15. ✅ Tap expand button, verify 5 transactions shown
16. ✅ Tap FAB in bottom nav, verify scan triggered (FAB handles quick actions)
17. ✅ Tap "Ver todo" to see full transaction list
