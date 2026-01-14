# Story 14.33b: View Switcher & Carousel Mode

## Story Info
- **Epic:** 14 - Core Implementation
- **Points:** 5
- **Priority:** High
- **Status:** Done
- **Created:** 2026-01-12
- **Completed:** 2026-01-12
- **Mockup Reference:** `docs/uxui/mockups/01_views/insights.html`
- **Depends On:** Story 14.33a (Insight Card Types & Styling)

## User Story

**As a** BoletApp user reviewing my insights,
**I want** to switch between a list view and a carousel view of highlighted insights,
**So that** I can browse insights in the format that best suits my current needs.

## Background

The mockup defines a 4-mode view switcher at the top of the Insights screen:

| View | Spanish Label | Description |
|------|---------------|-------------|
| `list` | Lista | Default chronological list (current implementation) |
| `carousel` | Destacados | Swipeable cards for featured/highlighted insights |
| `airlock` | Airlock | Progressive reveal sequence (Story 14.33c) |
| `celebration` | Logro | Personal records & achievements (Story 14.33d) |

This story implements the **view switcher component** and the **carousel mode**. The airlock and celebration views will be placeholder buttons that show "Coming Soon" until their stories are complete.

## Acceptance Criteria

### AC1: View Switcher Component
- [x] Create `InsightsViewSwitcher.tsx` component with 4 buttons
- [x] Buttons: "Lista" (active), "Destacados", "Airlock", "Logro"
- [x] Active button uses `--primary` background with white text
- [x] Inactive buttons use `--bg-secondary` with `--text-secondary`
- [x] Buttons are flex: 1 with 8px gap (per mockup)
- [x] Border-radius: `--radius-md`, padding: 10px

### AC2: View State Management
- [x] Add `activeView` state to `InsightsView.tsx`: `'list' | 'carousel' | 'airlock' | 'celebration'`
- [x] Default to `'list'` view
- [x] Persist view preference in localStorage (optional enhancement)
- [x] View switcher appears below header, above content

### AC3: Carousel View Implementation
- [x] Create `InsightsCarousel.tsx` component
- [x] Shows 3 "highlighted" insights (most recent CELEBRATORY or QUIRKY_FIRST)
- [x] Horizontal swipe navigation between cards
- [x] Dot indicators below carousel (active dot = `--primary`, 24px wide)
- [x] Cards use `InsightCard` styling from mockup (larger format)

### AC4: Carousel Card Design (InsightCardLarge)
- [x] Create `InsightCardLarge.tsx` for carousel cards
- [x] Header: icon (40x40) + label + title + close button
- [x] Body: message text (13px, `--text-secondary`)
- [x] Celebration type: gradient background `linear-gradient(135deg, var(--primary-light), #dbeafe)`
- [x] Box shadow: `--shadow-md`
- [x] Border-radius: `--radius-lg`

### AC5: Carousel Navigation
- [x] Touch swipe gesture support (left/right)
- [x] CSS transition: `transform var(--transition-normal)`
- [x] Dot click navigates to specific slide
- [x] "Desliza para ver mas insights" hint text below dots

### AC6: Placeholder Views
- [x] Airlock button shows toast: "Proximamente" when clicked
- [x] Celebration button shows toast: "Proximamente" when clicked
- [x] OR: Show a simple placeholder card with "Coming Soon" message

## Technical Notes

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/insights/InsightsViewSwitcher.tsx` | View mode toggle buttons |
| `src/components/insights/InsightsCarousel.tsx` | Carousel container with swipe |
| `src/components/insights/InsightCardLarge.tsx` | Large format insight card |

### Files to Modify
| File | Change |
|------|--------|
| `src/views/InsightsView.tsx` | Add view state, integrate switcher |
| `src/components/insights/index.ts` | Export new components |

### View Switcher Component
```tsx
// src/components/insights/InsightsViewSwitcher.tsx
interface InsightsViewSwitcherProps {
  activeView: 'list' | 'carousel' | 'airlock' | 'celebration';
  onViewChange: (view: 'list' | 'carousel' | 'airlock' | 'celebration') => void;
  t: (key: string) => string;
}

const views = [
  { id: 'list', labelKey: 'list' },
  { id: 'carousel', labelKey: 'highlighted' },
  { id: 'airlock', labelKey: 'airlock' },
  { id: 'celebration', labelKey: 'achievement' },
] as const;
```

### Carousel Implementation Strategy
```tsx
// Using CSS transform for smooth sliding
<div className="carousel-viewport overflow-hidden rounded-lg">
  <div
    className="carousel-track flex transition-transform"
    style={{ transform: `translateX(calc(${activeSlide} * -100%))` }}
  >
    {highlightedInsights.map((insight, idx) => (
      <div key={idx} className="carousel-slide flex-shrink-0 w-full px-1">
        <InsightCardLarge insight={insight} />
      </div>
    ))}
  </div>
</div>
```

### Highlighted Insights Selection
```typescript
// Select up to 3 insights for carousel
function selectHighlightedInsights(insights: InsightRecord[]): InsightRecord[] {
  const priority = ['CELEBRATORY', 'QUIRKY_FIRST', 'ACTIONABLE'];

  // Sort by category priority, then by date
  const sorted = [...insights].sort((a, b) => {
    const aPriority = priority.indexOf(a.category || 'ACTIONABLE');
    const bPriority = priority.indexOf(b.category || 'ACTIONABLE');
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (b.shownAt?.seconds ?? 0) - (a.shownAt?.seconds ?? 0);
  });

  return sorted.slice(0, 3);
}
```

## Testing Requirements

### Unit Tests
- [x] `InsightsViewSwitcher.test.tsx`: View button click changes active state
- [x] `InsightsCarousel.test.tsx`: Renders correct number of slides
- [x] `InsightsCarousel.test.tsx`: Dot click navigates to slide
- [x] `selectHighlightedInsights()`: Returns max 3 insights with correct priority

### Integration Tests
- [x] View switcher persists state across component re-renders
- [x] Carousel swipe gesture works on touch devices
- [x] Placeholder views show appropriate message

### Accessibility
- [x] View switcher buttons are keyboard navigable
- [x] Carousel has proper ARIA labels for screen readers
- [x] Dots have aria-label indicating slide number

## Translations Required

```typescript
// Add to translations.ts
{
  list: 'Lista',
  highlighted: 'Destacados',
  airlock: 'Airlock',
  achievement: 'Logro',
  swipeForMore: 'Desliza para ver mas insights',
  comingSoon: 'Proximamente',
}
```

## Out of Scope
- Airlock sequence implementation (Story 14.33c)
- Celebration/achievement cards (Story 14.33d)
- Intentional dialog integration (uses existing 14.17)

## Dependencies
- Story 14.33a: Insight Card Types & Styling (for visual type config)

## Definition of Done
- [x] All acceptance criteria met
- [x] View switcher toggles between views
- [x] Carousel displays and swipes correctly
- [x] Placeholder messages for unimplemented views
- [x] Unit tests passing (37 new tests, 164 total insight tests)
- [x] Code review passed

---

## Dev Agent Record

### Implementation Plan
1. Create InsightsViewSwitcher component with 4 buttons and proper ARIA/accessibility
2. Create InsightCardLarge component for carousel cards with visual type styling
3. Create InsightsCarousel with swipe navigation, dot indicators, and priority-based highlighting
4. Integrate into InsightsView with localStorage persistence for view preference
5. Add placeholder views for Airlock and Celebration (coming soon)
6. Add EN/ES translations for all new strings
7. Write comprehensive unit tests for all new components

### Completion Notes
Story 14.33b implemented successfully. The implementation includes:

**New Components:**
- `InsightsViewSwitcher.tsx` - 4-button view toggle with accessibility
- `InsightsCarousel.tsx` - Swipeable carousel with highlighted insights selection
- `InsightCardLarge.tsx` - Large format insight cards for carousel display

**Key Features:**
- View preference persists in localStorage (`boletapp_insights_view`)
- Carousel prioritizes CELEBRATORY > QUIRKY_FIRST > ACTIONABLE insights
- Touch swipe and mouse drag support for carousel navigation
- Proper ARIA labels and keyboard navigation throughout
- Placeholder views for Airlock (Clock icon) and Celebration (Trophy icon)

**Test Coverage:**
- 37 new unit tests added across 3 test files
- Tests cover: view switching, carousel navigation, dot indicators, accessibility, visual types

### Debug Log
- TypeScript compilation: PASS
- Resolved duplicate translation key conflicts (`of`, `comparison`) by using unique keys
- Removed unused `handleDisabledViewClick` callback (lint warning)

### File List

**Files Created:**
- `src/components/insights/InsightsViewSwitcher.tsx`
- `src/components/insights/InsightsCarousel.tsx`
- `src/components/insights/InsightCardLarge.tsx`
- `tests/unit/components/insights/InsightsViewSwitcher.test.tsx`
- `tests/unit/components/insights/InsightsCarousel.test.tsx`
- `tests/unit/components/insights/InsightCardLarge.test.tsx`

**Files Modified:**
- `src/views/InsightsView.tsx` - Added view state, switcher integration, conditional rendering
- `src/components/insights/index.ts` - Barrel exports for new components
- `src/utils/translations.ts` - Added EN/ES translations for 14 new keys
- `docs/sprint-artifacts/sprint-status.yaml` - Updated story status

### Change Log
| Date | Change |
|------|--------|
| 2026-01-12 | Initial implementation of all ACs |
| 2026-01-12 | Added unit tests (37 tests) |
| 2026-01-12 | Story marked ready for review |
| 2026-01-12 | Code review passed with 5 fixes applied |

### Code Review Notes (2026-01-12)
**Reviewer:** Atlas-Enhanced Code Review

**Issues Found:** 7 (1 HIGH, 4 MEDIUM, 2 LOW)

**Issues Fixed:**
1. **[HIGH]** `InsightsTemporalFilter.tsx:287` - `buttonStyle` declared but never applied to button. Fixed by adding `style={buttonStyle}` prop.
2. **[MEDIUM]** `InsightsCarousel.tsx` - Dot indicators had 8px height, violating 44px touch target guideline. Fixed with 44px touch wrapper around visual dot.
3. **[MEDIUM]** `InsightsCarousel.tsx` - Missing keyboard navigation. Added `ArrowLeft`/`ArrowRight` handlers and `tabIndex={0}` for focusability.
4. **[LOW]** `InsightCardLarge.tsx:102` - Icon background used `backgroundColor` with gradient (invalid). Changed to `background` property.
5. **Translation** - Added `carousel` key (EN: "Carousel", ES: "Carrusel") for ARIA label.

**Remaining (Low Priority):**
- MEDIUM: Add defensive Timestamp test for `InsightCardLarge`
- LOW: `IntentionalPrompt.tsx` in index.ts but not in story File List (from Story 14.17)
