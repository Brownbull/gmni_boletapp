# Story 19-8: Group Analytics

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "This story builds the shared board by adding a summary card on top -- how much the group spent and on what"

## Story
As a group member, I want to see group-level spending analytics (by category, by member, over time), so that the group has shared financial visibility.

## Acceptance Criteria

### Functional
- **AC-1:** Given a group with transactions, when viewing analytics, then total spending by category is shown (pie chart)
- **AC-2:** Given a group, when viewing analytics, then spending per member is shown (bar chart)
- **AC-3:** Given a group, when viewing analytics, then monthly spending trend is shown
- **AC-4:** Given analytics are client-side computed, when group has < 1000 transactions, then computation completes in < 2s

### Architectural
- **AC-ARCH-LOC-1:** Analytics at `src/features/groups/components/GroupAnalytics.tsx`
- **AC-ARCH-PATTERN-1:** Client-side computation from group transaction list (same approach as personal analytics)
- **AC-ARCH-NO-1:** No server-side aggregation -- client-side only at this scale

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Group analytics | `src/features/groups/components/GroupAnalytics.tsx` | FSD component | NEW |
| Analytics utils | `src/features/groups/utils/groupAnalytics.ts` | Utility | NEW |
| Tests | `tests/unit/features/groups/groupAnalytics.test.ts` | Vitest | NEW |

## Tasks

### Task 1: Analytics Computation (3 subtasks)
- [ ] 1.1: Create `groupAnalytics.ts` -- aggregate by category, by member, by month
- [ ] 1.2: Reuse existing chart computation patterns from personal analytics (trends feature)
- [ ] 1.3: **HARDENING:** Handle empty group (0 transactions) -- show helpful empty state

### Task 2: Analytics UI (3 subtasks)
- [ ] 2.1: Category pie chart (reuse existing Pie chart component)
- [ ] 2.2: Member contribution bar chart
- [ ] 2.3: Monthly trend line/bar chart

### Task 3: Tests (2 subtasks)
- [ ] 3.1: Unit tests for aggregation functions (by category, by member, by month)
- [ ] 3.2: Component test: renders charts with sample data

### Task 4: Verification (1 subtask)
- [ ] 4.1: Run `npm run test:quick`

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 4
- **Subtasks:** 9
- **Files:** ~3

## Dependencies
- **19-6** (transaction feed provides data)

## Risk Flags
- PURE_COMPONENT (empty state, loading state)

## Dev Notes
- Architecture doc: "Client-side computation from group transaction list. Same approach as personal analytics. No server-side aggregation needed at 50-member scale."
- Reuse existing SVG chart components -- don't build new ones
- "By member" is unique to groups -- personal analytics doesn't have this dimension
- Performance: with 50 members x 100 transactions = 5000 docs max. Client-side computation is fine.
