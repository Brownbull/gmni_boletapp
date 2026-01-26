# Story 14e.14c: Batch Discard & Credit Check Handlers

Status: done

## Story

As a **developer**,
I want **the discard and credit check handlers extracted to the batch-review feature**,
So that **batch discard and credit operations are colocated with batch state**.

## Context

This is Part 3 of 4 for extracting batch review handlers (split from 14e-14 due to sizing).

**Part 1 (14e-14a):** Handler directory, context types, navigation handlers
**Part 2 (14e-14b):** Edit and save handlers
**Part 3 (this story):** Discard and credit check handlers
**Part 4 (14e-14d):** App.tsx integration and verification

### Current Implementation

Discard and credit handlers in `src/App.tsx`:
- `handleBatchReviewBack` (~10 lines) - Back from batch review with confirmation
- `handleBatchDiscardConfirm` (~8 lines) - Confirm discard batch results
- `handleBatchDiscardCancel` (~3 lines) - Cancel discard dialog
- `handleBatchConfirmWithCreditCheck` (~5 lines) - Credit check before batch processing

## Atlas Workflow Analysis

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **#3: Batch Processing Flow** | DIRECT - Discard/cancel operations |
| **#9: Scan Request Lifecycle** | DIRECT - Credit check before scan |

## Acceptance Criteria

### AC1: Context Type Additions

**Given** types.ts from Story 14e-14a/b
**When** this story is completed
**Then:**
- `DiscardContext` interface added with:
  - `hasBatchReceipts: boolean`
  - `showScanDialog: (type: DialogType, props: object) => void`
  - `dismissScanDialog: () => void`
  - `setBatchImages: (images: string[]) => void`
  - `batchProcessing: { reset: () => void }`
  - `resetScanContext: () => void`
  - `setView: (view: ViewType) => void`
- `CreditCheckContext` interface added with:
  - `userCredits: UserCredits`
  - `checkCreditSufficiency: (credits: UserCredits, required: number, isSuper: boolean) => CreditCheckResult`
  - `setCreditCheckResult: (result: CreditCheckResult) => void`
  - `setShowCreditWarning: (show: boolean) => void`

### AC2: Discard Handlers Extracted

**Given** `handleBatchReviewBack`, `handleBatchDiscardConfirm`, `handleBatchDiscardCancel` in App.tsx
**When** reviewing `src/features/batch-review/handlers/discard.ts`
**Then:**
- `handleReviewBack(context: DiscardContext)` - shows confirmation if receipts exist
- `confirmDiscard(context: DiscardContext)` - dismisses dialog, resets state, navigates to dashboard
- `cancelDiscard(context: DiscardContext)` - dismisses dialog only
- All handlers use DIALOG_TYPES.BATCH_DISCARD constant

### AC3: Credit Check Handler Extracted

**Given** `handleBatchConfirmWithCreditCheck` in App.tsx
**When** reviewing `src/features/batch-review/handlers/creditCheck.ts`
**Then:**
- `confirmWithCreditCheck(context: CreditCheckContext)` extracted
- Uses 1 super credit (batch pricing, regardless of image count)
- Sets credit check result and shows warning dialog

### AC4: Unit Tests

**Given** discard and credit handlers extracted
**When** running tests
**Then:**
- Tests verify handleReviewBack shows dialog when receipts exist
- Tests verify handleReviewBack navigates directly when no receipts
- Tests verify confirmDiscard resets all state and navigates
- Tests verify cancelDiscard only dismisses dialog
- Tests verify credit check uses super credit (isSuper: true)

## Tasks / Subtasks

- [x] **Task 1: Add context types** (AC: 1)
  - [x] 1.1 Add `DiscardContext` to types.ts
  - [x] 1.2 Add `CreditCheckContext` to types.ts

- [x] **Task 2: Extract discard handlers** (AC: 2)
  - [x] 2.1 Create `discard.ts` with `handleReviewBack`
  - [x] 2.2 Add `confirmDiscard` to discard.ts
  - [x] 2.3 Add `cancelDiscard` to discard.ts
  - [x] 2.4 Export from index.ts
  - [x] 2.5 Write unit tests for all three handlers

- [x] **Task 3: Extract credit check handler** (AC: 3, 4)
  - [x] 3.1 Create `creditCheck.ts` with `confirmWithCreditCheck`
  - [x] 3.2 Use 1 super credit for batch pricing
  - [x] 3.3 Export from index.ts
  - [x] 3.4 Write unit tests

## Dev Notes

### Discard Handler Implementation

```typescript
// src/features/batch-review/handlers/discard.ts
import { DIALOG_TYPES } from '@/config/dialogTypes';
import type { DiscardContext } from './types';

export function handleReviewBack(context: DiscardContext): void {
  const { hasBatchReceipts, showScanDialog, setBatchImages, batchProcessing, resetScanContext, setView } = context;

  // Show confirmation if results exist (credit was spent)
  if (hasBatchReceipts) {
    showScanDialog(DIALOG_TYPES.BATCH_DISCARD, {});
    return;
  }

  // No results to lose - navigate directly
  setBatchImages([]);
  batchProcessing.reset();
  resetScanContext();
  setView('dashboard');
}

export function confirmDiscard(context: DiscardContext): void {
  const { dismissScanDialog, setBatchImages, batchProcessing, resetScanContext, setView } = context;

  dismissScanDialog();
  setBatchImages([]);
  batchProcessing.reset();
  resetScanContext();
  setView('dashboard');
}

export function cancelDiscard(context: DiscardContext): void {
  const { dismissScanDialog } = context;
  dismissScanDialog();
}
```

### Credit Check Handler Implementation

```typescript
// src/features/batch-review/handlers/creditCheck.ts
import type { CreditCheckContext } from './types';

export function confirmWithCreditCheck(context: CreditCheckContext): void {
  const { userCredits, checkCreditSufficiency, setCreditCheckResult, setShowCreditWarning } = context;

  // Batch uses 1 super credit regardless of image count
  const result = checkCreditSufficiency(userCredits, 1, true);
  setCreditCheckResult(result);
  setShowCreditWarning(true);
}
```

### Dependencies

- **Depends on:** Story 14e-14a (types), Story 14e-14b (save handlers)
- **Blocks:** Story 14e-14d (App.tsx integration)

### References

- [Source: src/App.tsx:1973-1995 - handleBatchReviewBack, handleBatchDiscardConfirm, handleBatchDiscardCancel]
- [Source: src/App.tsx:1642-1646 - handleBatchConfirmWithCreditCheck]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - clean implementation following established patterns.

### Completion Notes List

1. **AC1 Complete**: Added `DiscardContext` and `CreditCheckContext` interfaces to types.ts with all required properties matching the story specification.

2. **AC2 Complete**: Extracted three discard handlers to `discard.ts`:
   - `handleReviewBack`: Shows BATCH_DISCARD dialog when receipts exist, navigates directly when none
   - `confirmDiscard`: Dismisses dialog, clears all batch state, navigates to dashboard
   - `cancelDiscard`: Dismisses dialog only (minimal function)

3. **AC3 Complete**: Extracted `confirmWithCreditCheck` to `creditCheck.ts` with 1 super credit batch pricing model.

4. **AC4 Complete**: 36 unit tests passing (24 discard + 12 credit check):
   - Discard tests cover dialog showing, state cleanup, navigation, and execution order
   - Credit check tests verify super credit usage, result handling, and batch pricing model

5. **Pattern Compliance**: Followed established handler patterns from Story 14e-14a/b with props-based dependency injection.

6. **Full Test Suite**: 5667 tests passing with no regressions.

### File List

**New Files:**
- `src/features/batch-review/handlers/discard.ts` - Discard handlers
- `src/features/batch-review/handlers/creditCheck.ts` - Credit check handler
- `tests/unit/features/batch-review/handlers/discard.test.ts` - 24 tests
- `tests/unit/features/batch-review/handlers/creditCheck.test.ts` - 12 tests

**Modified Files:**
- `src/features/batch-review/handlers/types.ts` - Added DiscardContext, CreditCheckContext interfaces
- `src/features/batch-review/handlers/index.ts` - Added barrel exports for new handlers
