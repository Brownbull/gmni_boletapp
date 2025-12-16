# Story 10.4: Monthly Summary View

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** Draft
**Story Points:** 5
**Dependencies:** Story 10.1 (Insight Engine Core), Story 10.3 (Weekly Summary - for shared infrastructure)

---

## User Story

As a **user**,
I want **to see a comprehensive monthly summary at the end of each month**,
So that **I can celebrate my progress and understand my monthly spending patterns**.

---

## Acceptance Criteria

- [ ] **AC #1:** Monthly Summary view accessible via Reports Section
- [ ] **AC #2:** Summary shows: month name, total spending, receipt count
- [ ] **AC #3:** Summary shows month-over-month change with trend indicator (↑↓)
- [ ] **AC #4:** Summary shows full category breakdown with change indicators
- [ ] **AC #5:** Celebration animation for under-budget or improved months
- [ ] **AC #6:** Identifies biggest category increase and decrease
- [ ] **AC #7:** "Ver más" button navigates to Analytics with month filter
- [ ] **AC #8:** User can dismiss summary to return to home
- [ ] **AC #9:** Monthly report appears in Reports Section on last day of month
- [ ] **AC #10:** Monthly summary loads in <1 second

---

## Tasks / Subtasks

### Task 1: Create Monthly Summary View Component (1.5h)
- [ ] Create `src/views/MonthlySummaryView.tsx`
- [ ] Design summary layout:
  ```
  ┌─────────────────────────────────────────┐
  │  ← Resumen de Noviembre          [X]   │
  │                                         │
  │  🎉 ¡Mes completo!                      │
  │                                         │
  │  ┌─────────────────────────────────┐    │
  │  │  Total: $987.450               │    │
  │  │  ↓ 8% vs mes anterior          │    │
  │  │  47 boletas                    │    │
  │  └─────────────────────────────────┘    │
  │                                         │
  │  Categorías                            │
  │  ─────────────────────────────────      │
  │  🛒 Supermercado  $398.200  40%  ↓5%  │
  │  🍽️ Restaurante   $198.450  20%  ↑12% │
  │  🚗 Transporte    $156.800  16%  ↓3%  │
  │  📱 Servicios     $118.000  12%  =    │
  │  🎬 Entret.       $78.000   8%   ↑25% │
  │  📦 Otros         $38.000   4%   ↓8%  │
  │                                         │
  │  ─────────────────────────────────      │
  │  📈 Mayor aumento: Entretenimiento +25%│
  │  📉 Mayor ahorro: Supermercado -5%     │
  │                                         │
  │  [Ver análisis completo]               │
  │                                         │
  └─────────────────────────────────────────┘
  ```
- [ ] Handle loading state
- [ ] Handle empty state (no transactions this month)

### Task 2: Implement Monthly Data Aggregation (1h)
- [ ] Extend `src/services/summaryService.ts`
- [ ] Implement `getMonthlySummary(year, month)`:
  ```typescript
  interface MonthlySummary {
    month: number;
    year: number;
    monthName: string;
    totalSpent: number;
    transactionCount: number;
    vsLastMonth: {
      amount: number;
      percentage: number;
      direction: 'up' | 'down' | 'same';
    };
    categories: CategoryComparison[];
    highlights: {
      biggestIncrease: CategoryChange | null;
      biggestDecrease: CategoryChange | null;
    };
    shouldCelebrate: boolean;
  }

  interface CategoryComparison {
    category: string;
    amount: number;
    percentage: number;
    vsLastMonth: {
      percentage: number;
      direction: 'up' | 'down' | 'same';
    };
    emoji: string;
  }

  interface CategoryChange {
    category: string;
    changePercentage: number;
  }
  ```
- [ ] Calculate all category comparisons
- [ ] Identify biggest increase and decrease
- [ ] Determine celebration eligibility

### Task 3: Implement Celebration Animation (1h)
- [ ] Trigger celebration when:
  - Total spending decreased vs last month (any amount)
  - OR specific category improved significantly (>10%)
- [ ] Create celebration component:
  - Confetti animation (20 particles, 60° spread)
  - "¡Felicitaciones!" text with bounce
  - Optional: 🎉 emoji animation
- [ ] Respect `prefers-reduced-motion`:
  - Reduced: No animation, just show success badge
  - Normal: Full celebration

### Task 4: Implement Month-over-Month Comparison Logic (0.5h)
- [ ] Compare each category to previous month
- [ ] Calculate percentage change for each
- [ ] Handle new categories (no previous data)
- [ ] Handle removed categories (no current data)
- [ ] Edge case: First month (no comparison available)

### Task 5: Create Category Change Indicators (0.5h)
- [ ] Visual indicators:
  - ↑ Up (red/orange for increase in spending)
  - ↓ Down (green for decrease - savings!)
  - = Same (gray dash for <2% change)
- [ ] Display percentage change next to each category
- [ ] Color coding: Green for savings, neutral for increases (no shame)

### Task 6: Implement Highlights Section (0.5h)
- [ ] Calculate biggest increase category
- [ ] Calculate biggest decrease category (savings!)
- [ ] Display in summary:
  ```
  📈 Mayor aumento: Entretenimiento +25%
  📉 Mayor ahorro: Supermercado -5%
  ```
- [ ] Handle ties (show first alphabetically)
- [ ] Handle no significant changes (<5%)

### Task 7: Monthly Report Generation Logic (0.5h)
- [ ] Trigger monthly report creation:
  - Last day of month, 6pm
  - Or on first app open after last day
- [ ] Check if report already exists for this month
- [ ] Only generate if user has transactions in the month

### Task 8: Integration with Reports Section (0.5h)
- [ ] Monthly reports appear in same Reports Section as weekly
- [ ] Different card style/icon for monthly vs weekly
- [ ] Same FIFO ordering (most recent first)
- [ ] Same new/unseen badge behavior

### Task 9: Testing (0.5h)
- [ ] Unit tests for monthly aggregation
- [ ] Unit tests for celebration logic
- [ ] Unit tests for category comparison
- [ ] Integration test for full monthly flow
- [ ] Test edge cases: first month, gap in data

---

## Technical Summary

The Monthly Summary is the "big reward" in the habit loop - a comprehensive review that celebrates the user's progress and provides deep insights. The celebration animation creates positive reinforcement for good financial habits.

**Celebration Criteria (Ethical Design):**
- Total spending down ANY amount vs last month → Celebrate!
- NO celebrations for spending more
- NO shame messaging for increases
- Framing: "Tu gasto en X bajó" (neutral) not "Gastaste demasiado en X" (negative)

**Monthly Summary Flow:**
```
End of month →
  Generate summary →
  Calculate all comparisons →
  Determine celebration eligibility →
  Store in Reports Section →
  User opens → Show celebration (if applicable) → Display summary
```

---

## Project Structure Notes

- **Files to create:**
  - `src/views/MonthlySummaryView.tsx`
  - `src/components/CelebrationAnimation.tsx`

- **Files to modify:**
  - `src/services/summaryService.ts` - Add monthly functions
  - `src/components/ReportsSection.tsx` - Monthly card type
  - `src/utils/translations.ts` - Add monthly strings

- **Expected test locations:**
  - `tests/unit/services/summaryService.test.ts`
  - `tests/unit/views/MonthlySummaryView.test.tsx`

- **Estimated effort:** 5 story points (~8 hours)
- **Prerequisites:** Story 10.1, Story 10.3 (shared infrastructure)

---

## Key Code References

**From habits loops.md - Monthly Milestone:**
```typescript
function generateMonthlyInsight(current: MonthData, previous: MonthData): string {
  const percentChange = ((current.total - previous.total) / previous.total) * 100;

  if (percentChange < -10) {
    return `¡Felicitaciones! Gastaste ${Math.abs(percentChange).toFixed(0)}% menos que el mes pasado 🎉`;
  } else if (percentChange < 0) {
    return `Gastaste un poco menos que el mes pasado. ¡Vas bien! 👍`;
  } else if (percentChange < 10) {
    return `Tu gasto se mantuvo similar al mes pasado`;
  } else {
    return `Este mes gastaste más que el anterior. Revisa las categorías para entender por qué.`;
  }
}
```

**Celebration Animation Spec:**
```typescript
const celebrationAnimation: RewardAnimation = {
  type: 'celebration',
  duration: 1500,
  elements: [
    { type: 'confetti', particles: 20, spread: 60 },
    { type: 'emoji', content: '🎉', bounce: true },
    { type: 'text', fadeIn: 300, emphasis: true }
  ]
};
```

---

## UI Specifications

**Category Change Colors:**
- Increase: `text-orange-500` (neutral, not alarming)
- Decrease: `text-green-500` (positive - savings!)
- Same: `text-gray-400`

**Celebration Animation:**
- Duration: 1.5 seconds
- Confetti colors: Brand colors (teal, green accents)
- Text: "¡Felicitaciones!" in large, bold font
- Fade out gracefully to summary content

**Monthly Card in Reports Section:**
- Different icon than weekly (calendar with checkmark?)
- Label: "Noviembre 2025" (full month name)
- Same size as weekly cards

---

## Context References

**Tech-Spec:** [tech-spec.md](../../tech-spec.md)
**PRD:** [epic-10-prd.md](../../planning/epic-10-prd.md) - FR23-FR28
**Research:** [habits loops.md](../../uxui/research/habits%20loops.md) - Section 1.1 Monthly Milestone

---

## Definition of Done

- [ ] All 10 acceptance criteria verified
- [ ] Monthly Summary view renders correctly
- [ ] All categories show with comparisons
- [ ] Celebration animation works
- [ ] Highlights section accurate
- [ ] Navigation to Analytics works
- [ ] <1 second load time verified
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
