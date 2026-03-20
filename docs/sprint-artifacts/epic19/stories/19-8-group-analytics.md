# Story 19-8: Group Analytics

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "Add a summary card on top of the board — how much the group spent and on what"

## Story
As a group member, I want to see group-level spending analytics (by category, by member, over time) when viewing a group, so that the group has shared financial visibility.

## Acceptance Criteria

### Functional
- **AC-1:** Given group view is active (from 19-5 context store), when user navigates to Analytics, then group-level analytics are shown instead of personal analytics
- **AC-2:** Given a group with transactions, when viewing analytics, then total spending by category is shown (pie chart)
- **AC-3:** Given a group, when viewing analytics, then spending per member is shown (bar chart, using postedByName from group transactions)
- **AC-4:** Given a group, when viewing analytics, then monthly spending trend is shown
- **AC-5:** Given group analytics are client-side computed, when group has < 5000 transactions, then computation completes in < 2s

### Architectural
- **AC-ARCH-LOC-1:** Analytics at `src/features/groups/components/GroupAnalytics.tsx`
- **AC-ARCH-LOC-2:** Analytics utils at `src/features/groups/utils/groupAnalytics.ts`
- **AC-ARCH-PATTERN-1:** Client-side computation from group transaction list (same approach as personal analytics)
- **AC-ARCH-NO-1:** No server-side aggregation — client-side only at this scale

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Group analytics | `src/features/groups/components/GroupAnalytics.tsx` | FSD component | NEW |
| Analytics utils | `src/features/groups/utils/groupAnalytics.ts` | Utility | NEW |
| Analytics view integration | `src/views/` or analytics view | Existing view | MODIFIED |
| Tests | `tests/unit/features/groups/groupAnalytics.test.ts` | Vitest | NEW |

## Tasks

### Task 1: Analytics Computation (3 subtasks)
- [ ] 1.1: Create `groupAnalytics.ts` — aggregate by category, by member (using postedByName), by month
- [ ] 1.2: Reuse existing chart computation patterns from personal analytics (trends feature)
- [ ] 1.3: **HARDENING:** Handle empty group (0 transactions) — show helpful empty state with "Post some transactions to see group analytics"

### Task 2: Analytics UI (3 subtasks)
- [ ] 2.1: Category pie chart (reuse existing pie chart component)
- [ ] 2.2: Member contribution bar chart (unique to groups — aggregates by postedByName)
- [ ] 2.3: Monthly trend line/bar chart

### Task 3: Group View Integration (1 subtask)
- [ ] 3.1: Modify Analytics view: when `useGroupContextStore.activeGroupId` is set, render GroupAnalytics with group transactions instead of personal analytics. Default to current month with date range selector.

### Task 4: Tests (2 subtasks)
- [ ] 4.1: Unit tests for aggregation functions (by category, by member, by month, empty group edge case)
- [ ] 4.2: Component test: renders charts with sample data, empty state renders correctly

### Task 5: Verification (1 subtask)
- [ ] 5.1: Run `npm run test:quick`

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 10
- **Files:** ~4

## Dependencies
- **19-5** (group context store — determines when group view is active)
- **19-6** (group transaction hook — provides data)

## Risk Flags
- PURE_COMPONENT (empty state, loading state)

## Dev Notes
- Architecture doc: "Client-side computation from group transaction list. Same approach as personal analytics. No server-side aggregation needed at 50-member scale."
- Reuse existing SVG chart components — don't build new ones
- "By member" is unique to groups — personal analytics doesn't have this dimension. Uses `postedByName` field for display labels.
- Performance: with 50 members × 100 transactions = 5000 docs max. Client-side computation is fine for MVP.
- **V1 assumes single currency (CLP).** Multi-currency aggregation deferred to Epic 18.5. If mixed currencies appear, show a disclaimer.
- Default analytics view: current month. Users can select date range for historical view. This keeps client-side computation fast.
