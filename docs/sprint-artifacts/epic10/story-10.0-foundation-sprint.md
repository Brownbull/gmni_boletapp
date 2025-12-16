# Story 10.0: Foundation Sprint

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** Draft
**Story Points:** 8
**Dependencies:** None (Prerequisite for all other Epic 10 stories)

---

## User Story

As a **developer**,
I want **to refactor critical parts of the codebase that block Epic 10 features**,
So that **the Insight Engine and subsequent features can be built on a clean, maintainable foundation**.

---

## Acceptance Criteria

- [ ] **AC #1:** Transaction filtering logic extracted into `src/services/transactionQuery.ts`
- [ ] **AC #2:** `computeBarData()` split into 4 composable functions
- [ ] **AC #3:** Change detection in EditView generalized for reuse
- [ ] **AC #4:** Learning prompt orchestration extracted into `useLearningPhases` hook
- [ ] **AC #5:** App.tsx state management reduced from 21 to ~10 state variables
- [ ] **AC #6:** All existing tests pass (977+ tests)
- [ ] **AC #7:** No regression in app load time or scan processing speed
- [ ] **AC #8:** Code coverage maintained or improved

---

## Tasks / Subtasks

### Task 1: Extract `transactionQuery.ts` Service (3h)
- [ ] Audit existing filtering logic across codebase
- [ ] Create `src/services/transactionQuery.ts` with unified interface
- [ ] Implement core query functions:
  - [ ] `filterByDateRange(transactions, startDate, endDate)`
  - [ ] `filterByCategory(transactions, category)`
  - [ ] `filterByMerchant(transactions, merchant)`
  - [ ] `filterByAmount(transactions, min, max)`
  - [ ] `aggregateByCategory(transactions)`
  - [ ] `aggregateByMerchant(transactions)`
  - [ ] `getThisWeek(transactions)`
  - [ ] `getThisMonth(transactions)`
  - [ ] `getLastNDays(transactions, n)`
- [ ] Replace existing filtering code with service calls
- [ ] Write unit tests for all query functions

### Task 2: Split `computeBarData()` (4h)
- [ ] Analyze current `computeBarData()` function (159 lines)
- [ ] Extract into 4 composable functions:
  - [ ] `groupTransactionsByPeriod(transactions, period)` - Group by day/week/month
  - [ ] `calculatePeriodTotals(groupedTransactions)` - Sum totals per period
  - [ ] `calculateCategoryBreakdown(transactions)` - Category percentages
  - [ ] `formatChartData(data, chartType)` - Format for chart library
- [ ] Update Analytics components to use new functions
- [ ] Ensure exact same output for existing visualizations
- [ ] Write unit tests verifying computation accuracy

### Task 3: Generalize Change Detection (2h)
- [ ] Extract change detection logic from EditView
- [ ] Create `useChangeDetection` hook or utility
- [ ] Interface: `{ hasChanges, changedFields, resetChanges }`
- [ ] Support deep object comparison
- [ ] Document for reuse in Tags/Groups features
- [ ] Write tests for change detection edge cases

### Task 4: Extract `useLearningPhases` Hook (3h)
- [ ] Audit current learning prompt orchestration in App.tsx
- [ ] Create `src/hooks/useLearningPhases.ts`
- [ ] Implement phases:
  - [ ] `shouldShowLearningPrompt(merchantHistory, config)`
  - [ ] `getLearningPhase(transaction, userHistory)`
  - [ ] `handleLearningResponse(response, transaction)`
- [ ] Move learning prompt state management to hook
- [ ] Integrate with App.tsx via hook consumption
- [ ] Write tests for learning phase logic

### Task 5: Refactor App.tsx State Management (6h)
- [ ] Audit current 21 state variables in App.tsx
- [ ] Group related state into logical contexts:
  - [ ] `ScanContext` - scan state, processing, results
  - [ ] `TransactionContext` - transactions, filters, selected
  - [ ] `UIContext` - view mode, modals, toasts
  - [ ] `SettingsContext` - user preferences, feature flags
- [ ] Create new context providers (or consolidate existing)
- [ ] Migrate state from App.tsx to appropriate contexts
- [ ] Ensure prop drilling reduced
- [ ] Target: ~10 state variables remaining in App.tsx
- [ ] Verify all views still function correctly

### Task 6: Test Updates & Validation (2h)
- [ ] Run full test suite (977+ tests)
- [ ] Fix any broken tests from refactoring
- [ ] Add new tests for extracted services/hooks
- [ ] Verify test coverage maintained (aim for same or better)
- [ ] Run build and verify no TypeScript errors
- [ ] Manual smoke test of critical flows

---

## Technical Summary

This foundation sprint addresses technical debt identified by the Architect that blocks Epic 10 features:

1. **Transaction Query Service:** Currently, filtering logic is duplicated across multiple components. Consolidating into a service enables the Insight Engine to efficiently query transaction data.

2. **`computeBarData()` Refactoring:** The 159-line monolithic function makes it difficult to reuse aggregation logic for insights. Splitting enables composition.

3. **Change Detection:** EditView's change detection is tightly coupled. Generalizing enables reuse for the upcoming Tags/Groups feature.

4. **Learning Phases Hook:** Learning prompt logic scattered in App.tsx. Extracting enables Quick Save flow (Epic 11) integration.

5. **App.tsx Cleanup:** 21 state variables indicate poor separation of concerns. This blocks Batch Mode (Epic 12) which needs clean state management.

---

## Project Structure Notes

- **Files to create:**
  - `src/services/transactionQuery.ts`
  - `src/services/transactionQuery.test.ts`
  - `src/hooks/useLearningPhases.ts`
  - `src/hooks/useLearningPhases.test.ts`
  - `src/hooks/useChangeDetection.ts` (or `src/utils/changeDetection.ts`)

- **Files to modify:**
  - `src/App.tsx` - Major refactoring
  - `src/contexts/*.tsx` - New/updated contexts
  - `src/views/AnalyticsView.tsx` - Use new analytics functions
  - `src/views/EditView.tsx` - Use change detection utility
  - Various components using inline filtering

- **Expected test locations:**
  - `tests/unit/services/transactionQuery.test.ts`
  - `tests/unit/hooks/useLearningPhases.test.ts`

- **Estimated effort:** 8 story points (~20 hours)
- **Prerequisites:** None

---

## Key Code References

**Current State (From Architect Assessment):**

```typescript
// App.tsx - Current state variables (21 total)
// Needs consolidation into contexts
const [transactions, setTransactions] = useState([]);
const [selectedCategory, setSelectedCategory] = useState(null);
const [dateRange, setDateRange] = useState({ start: null, end: null });
// ... 18 more state variables
```

```typescript
// AnalyticsView.tsx - computeBarData() (159 lines)
// Needs splitting into composable functions
function computeBarData(transactions, period, category) {
  // Monolithic function doing grouping, aggregation, formatting
  // ...159 lines of tightly coupled logic
}
```

**Target Architecture:**

```typescript
// src/services/transactionQuery.ts
export interface TransactionQueryService {
  filterByDateRange(txns: Transaction[], start: Date, end: Date): Transaction[];
  filterByCategory(txns: Transaction[], category: string): Transaction[];
  aggregateByCategory(txns: Transaction[]): CategoryAggregate[];
  getThisWeek(txns: Transaction[]): Transaction[];
  getThisMonth(txns: Transaction[]): Transaction[];
}
```

---

## Context References

**Tech-Spec:** [tech-spec.md](../../tech-spec.md)
**Architecture:** [architecture-epic7.md](../../architecture-epic7.md)
**PRD:** [epic-10-prd.md](../../planning/epic-10-prd.md)

**Architect Assessment (from Party Mode):**
- `computeBarData()` is 159 lines - needs splitting
- Filtering logic duplicated in 4+ locations
- App.tsx has 21 state variables - violates SRP
- Change detection in EditView is not reusable

---

## Definition of Done

- [ ] All 6 acceptance criteria verified
- [ ] All 977+ existing tests pass
- [ ] New service/hook tests added and passing
- [ ] No TypeScript errors
- [ ] Code review approved
- [ ] App.tsx reduced to ~10 state variables
- [ ] Manual smoke test passed
- [ ] No performance regression

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing tests | Incremental PRs, run tests after each change |
| Regression in analytics | Verify chart output unchanged before/after |
| State management bugs | Extensive manual testing of all views |
| Scope creep | Strict focus on Tier 1 blockers only |

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
