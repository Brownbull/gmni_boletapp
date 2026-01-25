# Story 14e.14c: Batch Discard & Credit Check Handlers

Status: ready-for-dev

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

- [ ] **Task 1: Add context types** (AC: 1)
  - [ ] 1.1 Add `DiscardContext` to types.ts
  - [ ] 1.2 Add `CreditCheckContext` to types.ts

- [ ] **Task 2: Extract discard handlers** (AC: 2)
  - [ ] 2.1 Create `discard.ts` with `handleReviewBack`
  - [ ] 2.2 Add `confirmDiscard` to discard.ts
  - [ ] 2.3 Add `cancelDiscard` to discard.ts
  - [ ] 2.4 Export from index.ts
  - [ ] 2.5 Write unit tests for all three handlers

- [ ] **Task 3: Extract credit check handler** (AC: 3, 4)
  - [ ] 3.1 Create `creditCheck.ts` with `confirmWithCreditCheck`
  - [ ] 3.2 Use 1 super credit for batch pricing
  - [ ] 3.3 Export from index.ts
  - [ ] 3.4 Write unit tests

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
