# Story 14c-refactor.32b: BatchReviewView Hook Expansion

Status: done

> **Split from:** Story 14c-refactor.32 (atlas-story-sizing workflow, 2026-01-23)
> **Split strategy:** by_phase (interface -> hook -> integration)
> **Related stories:** 32a (interface rename), 32c (integration verification)

## Story

As a **developer maintaining App.tsx**,
I want **useBatchReviewViewProps to return ALL props required by BatchReviewView**,
So that **the hook output can be spread directly without additional inline props**.

## Background

### The Problem

useBatchReviewViewProps currently has partial coverage - some props are returned by the hook while others are still passed inline in App.tsx.

### Current State

Hook returns subset of required props; App.tsx supplements with inline props.

### Target State

Hook returns 100% of BatchReviewView's required props with matching names.

## Acceptance Criteria

1. **Given** useBatchReviewViewProps has partial coverage
   **When** this story is completed
   **Then:**
   - Hook options interface includes ALL required inputs
   - Hook return type includes ALL props BatchReviewView needs
   - All return properties use names matching BatchReviewViewProps interface (from 32a)

2. **Given** the hook is expanded
   **When** TypeScript compiles
   **Then:**
   - Return type satisfies BatchReviewViewProps
   - No type errors in hook file

## Tasks / Subtasks

### Task 2: Update useBatchReviewViewProps Hook (AC: 1, 2)

- [x] 2.1 Open `src/hooks/app/useBatchReviewViewProps.ts`
- [x] 2.2 Audit BatchReviewViewProps (from 32a) for all required props
- [x] 2.3 Add missing props to options interface
- [x] 2.4 Add missing props to return type with matching names

## Dev Notes

### Estimation

- **Points:** 2 pts
- **Risk:** LOW - Hook expansion, straightforward additions

### Dependencies

- **Requires:** Story 32a (interface aligned) - ensures target prop names
- **Blocks:** Story 32c (integration needs complete hook)

### Pattern Reference

Following the same approach as:
- Story 30b (HistoryView hook expansion)
- Story 31b (TrendsView hook expansion)

### Expected Additions

Based on BatchReviewView interface (verify in implementation):
- Any callbacks for edit/save/discard
- Navigation handlers if needed
- Transaction data props

### Testing Notes

- Hook unit tests should be updated to cover new props
- Test file: `tests/unit/hooks/app/useBatchReviewViewProps.test.ts`

## References

- [Split from: 14c-refactor-32-batchreviewview-props-alignment.md]
- [Depends on: 14c-refactor-32a-batchreviewview-interface-rename.md]
- [Source: src/hooks/app/useBatchReviewViewProps.ts]
- [Source: src/views/BatchReviewView.tsx]

## Dev Agent Record

### Implementation Plan

Expand useBatchReviewViewProps hook to return ALL props required by BatchReviewView:
1. Add required callback props to options interface
2. Add props to return type with matching names
3. Update hook implementation with stable callback references using useCallback
4. Update tests to cover new props
5. Update App.tsx to use spread pattern

### Debug Log

- TypeScript initially failed because App.tsx didn't pass required callback props
- Updated hook call in App.tsx to include: onEditReceipt, onCancel, onSaveComplete, saveTransaction
- Updated BatchReviewView rendering to use spread pattern: `{...batchReviewViewDataProps}`

### Completion Notes

**Props Added to Hook:**
- `formatCurrencyFn` - optional utility function (defaults to formatCurrency)
- `onEditReceipt` - required callback for editing receipts
- `onReceiptUpdated` - optional callback when receipt updated
- `onCancel` - optional callback for cancel/discard
- `onSaveComplete` - required callback for save completion
- `saveTransaction` - required function to save transactions
- `onRetryReceipt` - optional callback for retrying failed receipts
- `onCancelProcessing` - optional callback in processingState for canceling processing

**Callback Stability:**
Used useCallback for stable callback references to prevent unnecessary re-renders.

**Tests:**
- 20 tests added/updated covering all new props
- All tests pass (43 total for hook + BatchReviewView)

## File List

**Modified:**
- `src/hooks/app/useBatchReviewViewProps.ts` - Expanded to include all callback props (196 → 292 lines)
- `src/App.tsx` - Updated hook call with callbacks, simplified BatchReviewView rendering to spread pattern
- `tests/unit/hooks/app/useBatchReviewViewProps.test.ts` - Added 13 new tests for callback props (125 → 287 lines)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-23 | Story created via atlas-story-sizing | Atlas |
| 2026-01-23 | Implementation complete | Dev Agent |
| 2026-01-23 | Atlas code review PASSED - 0 HIGH, 0 MEDIUM, 2 LOW (trivial) | Code Review |
