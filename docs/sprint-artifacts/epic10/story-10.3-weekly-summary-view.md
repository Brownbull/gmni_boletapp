# Story 10.3: Weekly Summary View

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** Draft
**Story Points:** 5
**Dependencies:** Story 10.1 (Insight Engine Core)

---

## User Story

As a **user**,
I want **to see a weekly summary of my spending every Friday**,
So that **I can reflect on my week's expenses and understand my patterns**.

---

## Acceptance Criteria

- [ ] **AC #1:** Weekly Summary view accessible in-app via Reports Section
- [ ] **AC #2:** Summary shows: period dates (Mon-Sun), total spending, receipt count
- [ ] **AC #3:** Summary shows comparison to prior week (%, up/down indicator)
- [ ] **AC #4:** Summary shows top 5 categories with amounts and percentages
- [ ] **AC #5:** "Ver más" button navigates to Analytics with week filter applied
- [ ] **AC #6:** User can dismiss summary to return to normal app state
- [ ] **AC #7:** Reports Section on home screen shows max 5 reports (FIFO order)
- [ ] **AC #8:** New/unseen reports have visual indicator (badge)
- [ ] **AC #9:** Reports marked as "seen" when user views them
- [ ] **AC #10:** Weekly summary loads in <1 second

---

## Tasks / Subtasks

### Task 1: Create Reports Section on Home Screen (1.5h)
- [ ] Add Reports Section component to HomeView
- [ ] Design card-based layout for reports:
  ```
  ┌─────────────────────────────────────────┐
  │  📊 Reportes                  [Ver todo]│
  │                                         │
  │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
  │  │ Semana  │ │ Semana  │ │  Mes    │   │
  │  │ Dic 9-15│ │ Dic 2-8 │ │  Nov    │   │
  │  │  🔴 New │ │         │ │         │   │
  │  └─────────┘ └─────────┘ └─────────┘   │
  │                                         │
  └─────────────────────────────────────────┘
  ```
- [ ] FIFO ordering (most recent on left/top)
- [ ] Maximum 5 reports displayed
- [ ] "Ver todo" link to full reports list (future)

### Task 2: Create Weekly Summary View Component (1.5h)
- [ ] Create `src/views/WeeklySummaryView.tsx`
- [ ] Design summary layout:
  ```
  ┌─────────────────────────────────────────┐
  │  ← Resumen Semanal           [X Cerrar] │
  │                                         │
  │  📅 9 - 15 de Diciembre 2025            │
  │                                         │
  │  ┌─────────────────────────────────┐    │
  │  │  Total: $247.890               │    │
  │  │  ↓ 12% vs semana anterior      │    │
  │  │  23 boletas                    │    │
  │  └─────────────────────────────────┘    │
  │                                         │
  │  Top Categorías                         │
  │  ─────────────────────────────────      │
  │  🛒 Supermercado    $98.450   40%      │
  │  🍽️ Restaurante     $52.300   21%      │
  │  🚗 Transporte      $38.200   15%      │
  │  📱 Servicios       $31.000   13%      │
  │  🎬 Entretenimiento $27.940   11%      │
  │                                         │
  │  [Ver análisis detallado]               │
  │                                         │
  └─────────────────────────────────────────┘
  ```
- [ ] Show loading state while fetching data
- [ ] Handle empty state (no transactions this week)

### Task 3: Implement Weekly Data Aggregation (1h)
- [ ] Create `src/services/summaryService.ts`
- [ ] Implement `getWeeklySummary(weekStartDate)`:
  ```typescript
  interface WeeklySummary {
    periodStart: Date;
    periodEnd: Date;
    totalSpent: number;
    transactionCount: number;
    vsLastWeek: {
      amount: number;
      percentage: number;
      direction: 'up' | 'down' | 'same';
    };
    topCategories: CategoryBreakdown[];
  }

  interface CategoryBreakdown {
    category: string;
    amount: number;
    percentage: number;
    emoji: string;
  }
  ```
- [ ] Use transactionQuery service from Story 10.0
- [ ] Calculate week-over-week comparison
- [ ] Cache results for performance

### Task 4: Implement Reports Data Model (0.5h)
- [ ] Create `src/types/report.ts`:
  ```typescript
  interface Report {
    id: string;
    type: 'weekly' | 'monthly';
    periodStart: Date;
    periodEnd: Date;
    createdAt: Date;
    seen: boolean;
    seenAt?: Date;
  }
  ```
- [ ] Store reports in localStorage or Firestore user doc
- [ ] Track seen/unseen status
- [ ] Auto-generate reports at appropriate times

### Task 5: Implement New/Unseen Badge (0.5h)
- [ ] Add badge indicator for unseen reports
- [ ] Style: Small red dot or "Nuevo" label
- [ ] Update `seen` status when user opens report
- [ ] Persist seen status across sessions

### Task 6: Weekly Report Generation Logic (0.5h)
- [ ] Trigger weekly report creation:
  - Friday 7pm (as per PRD decision)
  - Or on first app open after Friday 7pm
- [ ] Check if report already exists for this week
- [ ] Only generate if user has transactions in the week

### Task 7: Navigation Integration (0.5h)
- [ ] Tap report card → Open WeeklySummaryView
- [ ] "Ver análisis detallado" → Navigate to AnalyticsView with date filter
- [ ] Pass filter params: `?startDate=2025-12-09&endDate=2025-12-15`
- [ ] "X" or swipe → Close and return to home

### Task 8: Empty State Handling (0.5h)
- [ ] If no transactions this week:
  ```
  "No hay gastos registrados esta semana.
   ¡Escanea tu primera boleta!"
  ```
- [ ] If no previous week to compare:
  - Hide comparison section
  - Or show "Primera semana" indicator

### Task 9: Testing (0.5h)
- [ ] Unit tests for summaryService
- [ ] Unit tests for WeeklySummaryView
- [ ] Integration test for report generation
- [ ] Test edge cases: new user, gap in data

---

## Technical Summary

The Weekly Summary provides a "delayed reward" in the habit loop - a comprehensive view of the week's spending delivered every Friday. This creates anticipation and a reason to return to the app.

**Key Design Decisions (from PRD):**
1. **Fixed timing:** Friday 7pm (simpler for MVP)
2. **Reports Section:** Home screen section with FIFO ordering
3. **Max 5 reports:** Prevent clutter, "View All" for history
4. **Seen tracking:** Visual indicator for new reports

**Report Generation Flow:**
```
Friday 7pm (or next app open) →
  Check: transactions exist this week? →
    Yes: Generate weekly summary →
    Store report metadata →
    Show in Reports Section with badge
```

---

## Project Structure Notes

- **Files to create:**
  - `src/views/WeeklySummaryView.tsx`
  - `src/components/ReportsSection.tsx`
  - `src/services/summaryService.ts`
  - `src/types/report.ts`

- **Files to modify:**
  - `src/views/HomeView.tsx` - Add Reports Section
  - `src/utils/translations.ts` - Add summary strings

- **Expected test locations:**
  - `tests/unit/services/summaryService.test.ts`
  - `tests/unit/views/WeeklySummaryView.test.tsx`

- **Estimated effort:** 5 story points (~8 hours)
- **Prerequisites:** Story 10.1 (Insight Engine Core)

---

## Key Code References

**From habits loops.md - Weekly Digest:**
```typescript
interface WeeklyDigestNotification {
  type: 'weekly_digest';
  weekStart: Date;
  weekEnd: Date;
  totalSpent: number;
  vsLastWeek: number; // percentage change
  topCategory: {
    name: string;
    amount: number;
    percentage: number;
  };
  transactionCount: number;
}
```

**Category Emojis:**
```typescript
const categoryEmojis: Record<string, string> = {
  'Supermercado': '🛒',
  'Restaurante': '🍽️',
  'Transporte': '🚗',
  'Entretenimiento': '🎬',
  'Salud': '💊',
  'Shopping': '🛍️',
  'Servicios': '📱',
  'Otro': '📦'
};
```

---

## UI Specifications

**Reports Section Card:**
- Width: ~100px (3 cards per row)
- Height: ~80px
- Border radius: 8px
- Background: Light gray/white
- New badge: Red dot (8px) or "Nuevo" label

**Weekly Summary View:**
- Full screen modal or dedicated view
- Header: Back arrow + title + close button
- Scrollable content
- Bottom action button: "Ver análisis detallado"

**Comparison Indicator:**
- Up: Green arrow ↑, "subió X%"
- Down: Green arrow ↓ (savings are good!), "bajó X%"
- Same: Gray dash −, "igual que la semana anterior"

---

## Context References

**Tech-Spec:** [tech-spec.md](../../tech-spec.md)
**PRD:** [epic-10-prd.md](../../planning/epic-10-prd.md) - FR17-FR22
**Research:** [habits loops.md](../../uxui/research/habits%20loops.md) - Section 1.1 Weekly Digest

---

## Definition of Done

- [ ] All 10 acceptance criteria verified
- [ ] Weekly Summary view renders correctly
- [ ] Reports Section shows on home screen
- [ ] New/unseen badge works
- [ ] Week comparison calculation accurate
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
