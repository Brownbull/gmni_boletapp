# Story 10.5: Analytics Insight Cards

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** Draft
**Story Points:** 3
**Dependencies:** Story 10.1 (Insight Engine Core)

---

## User Story

As a **user**,
I want **to see personalized insight cards on the Analytics screen**,
So that **I can discover patterns in my spending without doing analysis myself**.

---

## Acceptance Criteria

- [ ] **AC #1:** 1-2 rotating insight cards displayed on Analytics screen
- [ ] **AC #2:** Insights are relevant to the currently selected time period
- [ ] **AC #3:** Insights refresh when analytics date range changes
- [ ] **AC #4:** Users can dismiss individual insight cards
- [ ] **AC #5:** Dismissed insights don't reappear for that insight type (session)
- [ ] **AC #6:** Insight cards have subtle animation on appearance
- [ ] **AC #7:** Cards show: emoji, insight message, optional "Ver más" action
- [ ] **AC #8:** Empty state when no insights available for period
- [ ] **AC #9:** Insight cards don't block main analytics content

---

## Tasks / Subtasks

### Task 1: Create Insight Card Component (1h)
- [ ] Create `src/components/InsightCard.tsx`
- [ ] Design card layout:
  ```
  ┌─────────────────────────────────────────┐
  │  💡  El 35% de tu gasto este mes es    │
  │      en Supermercado                   │
  │                                    [X] │
  └─────────────────────────────────────────┘
  ```
- [ ] Support emoji display
- [ ] Add dismiss button (X)
- [ ] Optional "Ver más" link
- [ ] Subtle background color (light teal/gray)

### Task 2: Create Insight Cards Container (0.5h)
- [ ] Create `src/components/InsightCardsContainer.tsx`
- [ ] Position at top of Analytics view (below filters, above charts)
- [ ] Support 1-2 cards maximum
- [ ] Horizontal scroll if 2 cards don't fit
- [ ] Handle empty state gracefully

### Task 3: Integrate Insight Engine with Analytics Context (1h)
- [ ] Hook into Analytics view state (selected period, category filter)
- [ ] Call InsightEngine with current context:
  ```typescript
  const insights = insightEngine.getAnalyticsInsights({
    transactions: filteredTransactions,
    dateRange: selectedDateRange,
    category: selectedCategory,
    locale: userLanguage
  });
  ```
- [ ] Filter to top 2 most relevant insights
- [ ] Refresh insights when filters change

### Task 4: Implement Dismiss Functionality (0.5h)
- [ ] Track dismissed insight types in session state
- [ ] When user taps X:
  - Remove card with fade animation
  - Store insight type in dismissed list
  - Don't show same type again this session
- [ ] Reset dismissed list on new session

### Task 5: Implement Analytics-Specific Insights (1h)
- [ ] Create analytics-optimized insight generation:
  ```typescript
  interface AnalyticsInsightContext {
    transactions: Transaction[];
    dateRange: { start: Date; end: Date };
    selectedCategory?: string;
    comparisonPeriod?: Transaction[];
  }
  ```
- [ ] Insight types for Analytics:
  - Category concentration for selected period
  - Comparison to previous period (if applicable)
  - Trend direction (spending velocity)
  - Merchant insights within category
- [ ] Consider what's already visible on screen (avoid redundancy)

### Task 6: Add Card Animations (0.5h)
- [ ] Enter animation: Fade in + slight slide up
- [ ] Exit animation: Fade out + slide left
- [ ] Respect `prefers-reduced-motion`
- [ ] Stagger animation if 2 cards appear

### Task 7: Testing (0.5h)
- [ ] Unit tests for InsightCard component
- [ ] Unit tests for analytics insight generation
- [ ] Test dismiss functionality
- [ ] Test filter change → insight refresh
- [ ] Accessibility: keyboard navigation, screen reader

---

## Technical Summary

Analytics Insight Cards provide "ambient insights" - relevant observations that appear as users explore their data. Unlike the Scan Complete toast (active reward) or Weekly Summary (scheduled reward), these are passive insights that enhance the analytics experience.

**Design Principles:**
1. **Non-intrusive:** Cards don't block charts or data
2. **Contextual:** Insights relate to what user is viewing
3. **Dismissible:** User can remove cards they're not interested in
4. **Complementary:** Don't repeat what's already visible in charts

**Insight Selection for Analytics:**
- Avoid insights that are obvious from the visible chart
- Prioritize comparative insights (vs last period)
- Prioritize concentration/pattern insights
- Maximum 2 insights to avoid clutter

---

## Project Structure Notes

- **Files to create:**
  - `src/components/InsightCard.tsx`
  - `src/components/InsightCardsContainer.tsx`
  - `src/components/InsightCard.test.tsx`

- **Files to modify:**
  - `src/views/AnalyticsView.tsx` - Add InsightCardsContainer
  - `src/services/insightEngine.ts` - Add analytics-specific methods

- **Expected test locations:**
  - `tests/unit/components/InsightCard.test.tsx`

- **Estimated effort:** 3 story points (~5 hours)
- **Prerequisites:** Story 10.1 (Insight Engine Core)

---

## Key Code References

**InsightEngine Extension:**
```typescript
// src/services/insightEngine.ts
class InsightEngine {
  // Existing methods...

  getAnalyticsInsights(context: AnalyticsInsightContext): Insight[] {
    const allInsights = this.generateAllInsights(context);
    // Filter out insights that are obvious from charts
    // Return top 2 by priority
    return allInsights
      .filter(i => !this.isRedundantWithChart(i, context))
      .slice(0, 2);
  }

  private isRedundantWithChart(insight: Insight, context: AnalyticsInsightContext): boolean {
    // Don't show "Top category is X" when pie chart shows it
    // Don't show "You spent Y" when bar chart shows total
    // ...
  }
}
```

**Analytics View Integration:**
```typescript
// src/views/AnalyticsView.tsx
const [dismissedInsights, setDismissedInsights] = useState<Set<InsightType>>(new Set());

const analyticsInsights = useMemo(() => {
  return insightEngine
    .getAnalyticsInsights(analyticsContext)
    .filter(i => !dismissedInsights.has(i.type));
}, [analyticsContext, dismissedInsights]);

const handleDismiss = (insightType: InsightType) => {
  setDismissedInsights(prev => new Set([...prev, insightType]));
};
```

---

## UI Specifications

**Insight Card:**
- Width: Full width with 16px margins
- Height: Auto (content-driven, typically 60-80px)
- Background: `bg-teal-50` (light) / `bg-teal-900` (dark)
- Border radius: 8px
- Padding: 12px
- Shadow: Subtle (`shadow-sm`)

**Card Content:**
- Emoji: 24px, left-aligned
- Text: `text-sm`, `text-gray-700` (light) / `text-gray-200` (dark)
- Dismiss button: 16px X icon, right-aligned, `text-gray-400`

**Animation:**
- Enter: 300ms, `opacity: 0→1`, `translateY: 8px→0`
- Exit: 200ms, `opacity: 1→0`, `translateX: 0→-20px`

**Positioning:**
- Below date filters
- Above charts
- Fixed position (doesn't scroll with charts)

---

## Context References

**Tech-Spec:** [tech-spec.md](../../tech-spec.md)
**PRD:** [epic-10-prd.md](../../planning/epic-10-prd.md) - FR29-FR32
**Research:** [habits loops.md](../../uxui/research/habits%20loops.md) - Section 3.1 Insights

---

## Definition of Done

- [ ] All 9 acceptance criteria verified
- [ ] Insight cards display on Analytics screen
- [ ] Cards refresh when filters change
- [ ] Dismiss functionality works
- [ ] Animations smooth and accessible
- [ ] Unit tests passing
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

## Review Notes
<!-- Will be populated during code review -->

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 10 PRD |
