# Story 14c-refactor.30a: HistoryView Interface Prop Renames

Status: done

> **Split from:** [14c-refactor-30-historyview-props-alignment.md](14c-refactor-30-historyview-props-alignment.md)
> **Split strategy:** by_phase (interface → hook → integration)
> **Split date:** 2026-01-23

## Story

As a **developer maintaining App.tsx**,
I want **HistoryView's prop names to match useHistoryViewProps hook output names**,
So that **future integration can use direct spreading without manual property mapping**.

## Background

This is Phase 1 of the HistoryView props alignment work. It focuses solely on renaming props in the HistoryView interface to match what the composition hook returns.

### Current State

| Hook Returns | View Expects (Current) |
|--------------|------------------------|
| `transactions` | `historyTrans` |
| `hasMore` | `hasMoreTransactions` |
| `isLoadingMore` | `loadingMoreTransactions` |

### Target State

| Hook Returns | View Expects (After) |
|--------------|----------------------|
| `transactions` | `transactions` |
| `hasMore` | `hasMore` |
| `isLoadingMore` | `isLoadingMore` |

## Acceptance Criteria

1. **Given** HistoryView expects `historyTrans` prop
   **When** this story is completed
   **Then:**
   - Prop renamed to `transactions` in HistoryViewProps interface
   - All internal usages updated to use `transactions`
   - No runtime errors

2. **Given** HistoryView expects `hasMoreTransactions` and `loadingMoreTransactions`
   **When** this story is completed
   **Then:**
   - Props renamed to `hasMore` and `isLoadingMore`
   - Internal component usages updated

3. **Given** App.tsx currently passes `historyTrans={...}`
   **When** this story is completed
   **Then:**
   - App.tsx updated to pass `transactions={...}` (temporary manual mapping)
   - TypeScript compiles without errors

## Tasks / Subtasks

### Task 1: Update HistoryViewProps Interface

- [x] 1.1 Open `src/views/HistoryView.tsx`
- [x] 1.2 Rename `historyTrans` to `transactions` in interface
- [x] 1.3 Rename `hasMoreTransactions` to `hasMore`
- [x] 1.4 Rename `loadingMoreTransactions` to `isLoadingMore`
- [x] 1.5 Update all internal usages of renamed props in component body
- [x] 1.6 Verify TypeScript compiles: `npm run type-check`

### Task 2: Update App.tsx Call Site

- [x] 2.1 Update prop names in App.tsx HistoryView rendering (lines ~3695-3738)
- [x] 2.2 Keep manual mapping for now (hook expansion in 30b)
- [x] 2.3 Verify TypeScript compiles

### Task 3: Update Tests

- [x] 3.1 Update any HistoryView tests using old prop names
- [x] 3.2 Run test suite: `npm run test`
- [x] 3.3 Verify no test failures from rename

## Dev Notes

### Estimation

- **Points:** 2 pts (was part of 5 pt story)
- **Risk:** LOW - Simple renames, single file focus

### Dependencies

- **Requires:** Story 29 (hooks integrated) - DONE
- **Blocks:** Story 30b (hook expansion)

### Cross-References

- **Parent story:** [14c-refactor-30](14c-refactor-30-historyview-props-alignment.md)
- **Next:** [14c-refactor-30b](14c-refactor-30b-hook-expansion.md) (hook expansion)
- **Final:** [14c-refactor-30c](14c-refactor-30c-integration-verification.md) (integration)

## File List

**Modified:**
- `src/views/HistoryView.tsx` - Rename props in interface + internal usages
- `src/App.tsx` - Update prop names at call site (manual mapping still)
- `tests/unit/components/HistoryViewThumbnails.test.tsx` - Update test props (31 occurrences)

## Dev Agent Record

### Implementation Plan
Simple prop renames in HistoryView interface to align with useHistoryViewProps hook output names.

### Completion Notes
- Renamed 3 props in HistoryViewProps interface:
  - `historyTrans` → `transactions`
  - `hasMoreTransactions` → `hasMore`
  - `loadingMoreTransactions` → `isLoadingMore`
- Updated 6 internal usages in HistoryView component body
- Updated 3 prop name usages in App.tsx call site
- Updated 30 occurrences of `historyTrans:` → `transactions:` in test file
- TypeScript compiles without errors
- All 30 HistoryView tests pass

### Debug Log
- Story command: `npm run type-check` (not `npm run typecheck`)
- Test file location: `tests/unit/components/HistoryViewThumbnails.test.tsx` (not `tests/unit/views/`)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-23 | Code review passed - fixed doc count 31→30, status→done | Atlas Code Review |
| 2026-01-23 | Story implemented - all tasks complete | Atlas Dev Story |
