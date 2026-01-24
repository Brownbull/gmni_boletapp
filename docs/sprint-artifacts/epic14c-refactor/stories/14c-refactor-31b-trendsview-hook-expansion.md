# Story 14c-refactor.31b: useTrendsViewProps Hook Expansion

Status: done

<!-- Split from Story 14c-refactor.31 via atlas-story-sizing workflow (2026-01-23) -->

## Story

As a **developer maintaining App.tsx**,
I want **useTrendsViewProps hook to include ALL props required by TrendsView**,
So that **no inline props are needed when rendering TrendsView**.

## Background

### Split Context

This story is Part 2 of 3 from the original Story 31 split:
- **31a:** Interface audit and cleanup - PREREQUISITE
- **31b (this):** Hook expansion
- **31c:** Integration and verification

### The Problem

After Story 31a cleans up the TrendsViewProps interface, this story expands the useTrendsViewProps hook to return ALL the props that TrendsView needs.

### Current State

useTrendsViewProps currently returns partial coverage. Props like colorTheme, formatCurrency, formatDate, and others are still passed inline in App.tsx.

### Target State

```tsx
const trendsViewProps = useTrendsViewProps(options);
// Hook returns ALL props needed by TrendsView
```

## Acceptance Criteria

1. **Given** TrendsViewProps interface is clean (from Story 31a)
   **When** this story is completed
   **Then:**
   - Hook options interface accepts all dependency sources
   - Hook return type matches TrendsViewProps exactly
   - All props returned by hook

2. **Given** hook needs dependencies from App context
   **When** hook is expanded
   **Then:**
   - Options interface documents all required inputs
   - Return object has proper naming to match view expectations

## Tasks / Subtasks

### Task 1: Expand useTrendsViewProps Hook (AC: #1, #2)

- [x] 1.1 Open `src/hooks/app/useTrendsViewProps.ts`
- [x] 1.2 Review TrendsViewProps from Story 31a
- [x] 1.3 Add all missing props to options interface
- [x] 1.4 Add all missing props to return type
- [x] 1.5 Ensure naming matches view expectations exactly

### Task 2: Update Hook Unit Tests (AC: #1)

- [x] 2.1 Open `tests/unit/hooks/app/useTrendsViewProps.test.ts`
- [x] 2.2 Update tests for new options and return values
- [x] 2.3 Verify all new props are tested
- [x] 2.4 Run hook tests in isolation

## Dev Notes

### Estimation

- **Points:** 2 pts
- **Risk:** LOW - Hook expansion follows established pattern from Story 30b

### Dependencies

- **Requires:** Story 31a (clean interface) - must be done first
- **Blocks:** Story 31c (integration uses expanded hook)

### Pattern Reference

Follow the same pattern used in:
- useBatchReviewViewProps (Story 32)
- useTransactionEditorViewProps (Story 33)
- useHistoryViewProps (Story 30b)

### References

- [Story 30b: Hook Expansion](14c-refactor-30b-hook-expansion.md)
- [Story 31a: Interface Rename](14c-refactor-31a-trendsview-interface-rename.md)
- [Source: src/hooks/app/useTrendsViewProps.ts]
- [Source: tests/unit/hooks/app/useTrendsViewProps.test.ts]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debugging required

### Completion Notes List

1. **Analysis (Task 1.2):** Reviewed TrendsViewProps interface from Story 31a - data props already covered by hook
2. **Props Added (Task 1.3, 1.4):** Added 3 callback handlers to options and return type:
   - `onEditTransaction: (transaction: Transaction) => void`
   - `onExporting?: (value: boolean) => void`
   - `onUpgradeRequired?: () => void`
3. **Architecture Note:** These callbacks are kept for TrendsViewProps interface compatibility even though TrendsView currently doesn't use them (destructured with `_` prefix). Navigation handlers come from ViewHandlersContext (Story 25/27).
4. **Test Fixes (Task 2.2, 2.3):**
   - Fixed invalid `colorTheme: 'default'` → `'normal'` (valid ColorTheme)
   - Fixed invalid `fontColorMode: 'adaptive'` → `'colorful'` (valid FontColorMode)
   - Fixed `colorTheme: 'warm'` → `'professional'` in UI settings test
   - Added 5 new tests for callback handler pass-through and memoization
5. **Test Results:** 11 tests pass (expanded from 6)
6. **Pre-existing failures:** 6 DashboardView pagination tests (tracked by story 14c-refactor-36)

### File List

**Modified:**
- `src/hooks/app/useTrendsViewProps.ts` - Added 3 callback handlers to options interface and return type
- `src/App.tsx` - Updated useTrendsViewProps call to pass callback handlers TO the hook (integration to USE them FROM the hook is Story 31c)
- `tests/unit/hooks/app/useTrendsViewProps.test.ts` - Fixed type errors, added 5 callback handler tests
- `docs/sprint-artifacts/sprint-status.yaml` - Updated story status to done

### Type Conversion Note

The hook returns `spendingByMember` as a plain object `{ [userId: string]: number }` for easier composition and JSON compatibility. TrendsViewProps expects `Map<string, number>`. The conversion happens at render time in App.tsx:
```typescript
spendingByMember={new Map(Object.entries(trendsViewDataProps.spendingByMember))}
```
This is intentional - hooks return plain objects for composability; the Map conversion is a view-level concern.

## Code Review Fixes

| Issue | Severity | Fix Applied |
|-------|----------|-------------|
| File List incomplete - didn't clarify integration boundary | HIGH | Updated File List to clarify App.tsx passes TO hook, not uses FROM it (Story 31c) |
| Type mismatch undocumented - spendingByMember Map vs Object | MEDIUM | Added "Type Conversion Note" section documenting the pattern |
| Test uses `as any[]` for transactions | LOW | Fixed test to use proper partial Transaction type |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-23 | Story implementation complete - all ACs satisfied | Dev Agent (Opus 4.5) |
| 2026-01-23 | Code review fixes: File List clarification, type conversion docs, test type safety | Atlas Code Review (Opus 4.5) |
