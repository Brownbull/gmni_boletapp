# Story 14e.14d: Batch Handler App.tsx Integration

Status: ready-for-dev

## Story

As a **developer**,
I want **all extracted batch handlers integrated into App.tsx**,
So that **App.tsx uses the feature handlers and is simplified**.

## Context

This is Part 4 of 4 for extracting batch review handlers (split from 14e-14 due to sizing).

**Part 1 (14e-14a):** Handler directory, context types, navigation handlers
**Part 2 (14e-14b):** Edit and save handlers
**Part 3 (14e-14c):** Discard and credit check handlers
**Part 4 (this story):** App.tsx integration and verification

### Prerequisites

Stories 14e-14a, 14e-14b, and 14e-14c must be completed. All handlers should be extracted and exported from `@features/batch-review/handlers`.

## Atlas Workflow Analysis

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **#3: Batch Processing Flow** | INTEGRATION - All handlers connected |
| **#9: Scan Request Lifecycle** | INTEGRATION - Batch phase handlers connected |

## Acceptance Criteria

### AC1: Handler Imports

**Given** all handlers extracted in previous stories
**When** reviewing App.tsx imports
**Then:**
- Import statement: `import { navigateToPreviousReceipt, navigateToNextReceipt, editBatchReceipt, saveBatchTransaction, handleSaveComplete, handleReviewBack, confirmDiscard, cancelDiscard, confirmWithCreditCheck } from '@features/batch-review/handlers'`
- Import context types if needed for type safety

### AC2: Context Object Creation

**Given** handlers require context objects
**When** reviewing App.tsx
**Then:**
- Context objects created using existing App.tsx state and callbacks
- Context objects are created inline or via useMemo for stability
- No prop drilling changes required - handlers called at same locations

### AC3: Handler Replacement

**Given** original handlers in App.tsx
**When** this story is completed
**Then:**
- `handleBatchPrevious` → calls `navigateToPreviousReceipt(context)`
- `handleBatchNext` → calls `navigateToNextReceipt(context)`
- `handleBatchEditReceipt` → calls `editBatchReceipt(receipt, index, context)`
- `handleBatchSaveComplete` → calls `handleSaveComplete(txs, context)`
- `handleBatchSaveTransaction` → calls `saveBatchTransaction(tx, context)`
- `handleBatchReviewBack` → calls `handleReviewBack(context)`
- `handleBatchDiscardConfirm` → calls `confirmDiscard(context)`
- `handleBatchDiscardCancel` → calls `cancelDiscard(context)`
- `handleBatchConfirmWithCreditCheck` → calls `confirmWithCreditCheck(context)`

### AC4: Original Handler Removal

**Given** all handlers replaced with imported functions
**When** reviewing App.tsx
**Then:**
- Original handler function definitions removed
- ~100-150 lines removed from App.tsx
- No dead code remaining

### AC5: Existing Tests Pass

**Given** handlers integrated
**When** running test suite
**Then:**
- All existing batch-related tests pass
- No regressions in BatchReviewView functionality
- No regressions in batch capture → review → save flow

### AC6: Smoke Test Verification

**Given** handlers integrated
**When** running manual smoke test
**Then:**
- Batch capture (3 images) works
- Batch review navigation (prev/next) works
- Edit receipt in batch works
- Save all completes successfully
- Discard with confirmation works
- Credit check shows warning

## Tasks / Subtasks

- [ ] **Task 1: Add imports to App.tsx** (AC: 1)
  - [ ] 1.1 Add import statement for all handlers
  - [ ] 1.2 Add import for context types if needed

- [ ] **Task 2: Replace handler calls** (AC: 2, 3)
  - [ ] 2.1 Replace `handleBatchPrevious` usage with context + imported function
  - [ ] 2.2 Replace `handleBatchNext` usage with context + imported function
  - [ ] 2.3 Replace `handleBatchEditReceipt` usage
  - [ ] 2.4 Replace `handleBatchSaveComplete` usage
  - [ ] 2.5 Replace `handleBatchSaveTransaction` usage
  - [ ] 2.6 Replace `handleBatchReviewBack` usage
  - [ ] 2.7 Replace `handleBatchDiscardConfirm` usage
  - [ ] 2.8 Replace `handleBatchDiscardCancel` usage
  - [ ] 2.9 Replace `handleBatchConfirmWithCreditCheck` usage

- [ ] **Task 3: Remove original handlers** (AC: 4)
  - [ ] 3.1 Delete `handleBatchPrevious` function definition
  - [ ] 3.2 Delete `handleBatchNext` function definition
  - [ ] 3.3 Delete `handleBatchEditReceipt` function definition
  - [ ] 3.4 Delete `handleBatchSaveComplete` function definition
  - [ ] 3.5 Delete `handleBatchSaveTransaction` function definition
  - [ ] 3.6 Delete `handleBatchReviewBack` function definition
  - [ ] 3.7 Delete `handleBatchDiscardConfirm` function definition
  - [ ] 3.8 Delete `handleBatchDiscardCancel` function definition
  - [ ] 3.9 Delete `handleBatchConfirmWithCreditCheck` function definition

- [ ] **Task 4: Verification** (AC: 5, 6)
  - [ ] 4.1 Run `npm test` - all tests pass
  - [ ] 4.2 Run `npm run build` - build succeeds
  - [ ] 4.3 Smoke test: batch capture → review → prev/next → edit → save
  - [ ] 4.4 Smoke test: batch review → back → confirm discard
  - [ ] 4.5 Smoke test: batch capture → credit warning shown

## Dev Notes

### Integration Pattern

There are two approaches for integrating extracted handlers:

**Approach A: Inline context creation (Recommended for this story)**
```typescript
// In App.tsx
const handleBatchPrevious = useCallback(() => {
  navigateToPreviousReceipt({
    scanState,
    setBatchEditingIndexContext,
    pendingTransaction,
    setPendingTransaction,
    navigateToView,
  });
}, [scanState, setBatchEditingIndexContext, pendingTransaction, setPendingTransaction, navigateToView]);
```

**Approach B: Context object via useMemo**
```typescript
// In App.tsx
const batchNavigationContext = useMemo(() => ({
  scanState,
  setBatchEditingIndexContext,
  pendingTransaction,
  setPendingTransaction,
  navigateToView,
}), [scanState, setBatchEditingIndexContext, pendingTransaction, setPendingTransaction, navigateToView]);

const handleBatchPrevious = useCallback(() => {
  navigateToPreviousReceipt(batchNavigationContext);
}, [batchNavigationContext]);
```

Choose Approach A for simplicity. Approach B is useful if multiple handlers share the same context.

### Lines Removed Estimate

| Handler | Lines | Notes |
|---------|-------|-------|
| handleBatchPrevious | ~15 | Navigation logic |
| handleBatchNext | ~15 | Navigation logic |
| handleBatchEditReceipt | ~10 | Edit setup |
| handleBatchSaveComplete | ~15 | State reset + modal |
| handleBatchSaveTransaction | ~10 | Firestore save |
| handleBatchReviewBack | ~10 | Confirmation logic |
| handleBatchDiscardConfirm | ~8 | Reset + navigate |
| handleBatchDiscardCancel | ~3 | Dismiss only |
| handleBatchConfirmWithCreditCheck | ~5 | Credit check |
| **Total** | **~91** | Conservative estimate |

Actual removal may be higher due to associated comments and whitespace.

### Dependencies

- **Depends on:** Stories 14e-14a, 14e-14b, 14e-14c (all handlers extracted)
- **Blocks:** Story 14e-15 (batch review components), 14e-16 (orchestrator)

### Rollback Plan

If integration breaks functionality:
1. Revert App.tsx changes (git checkout src/App.tsx)
2. Keep extracted handler files (they don't break anything)
3. Investigate issue in isolation
4. Re-attempt integration with fixes

### References

- [Source: src/App.tsx:1642-2014 - Original handler locations]
- [Source: docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-20a-hook-integration.md - Integration pattern]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
