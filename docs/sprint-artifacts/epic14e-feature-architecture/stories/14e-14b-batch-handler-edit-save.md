# Story 14e.14b: Batch Edit & Save Handlers

Status: ready-for-dev

## Story

As a **developer**,
I want **the edit and save handlers extracted to the batch-review feature**,
So that **batch editing and saving logic is colocated with batch state**.

## Context

This is Part 2 of 4 for extracting batch review handlers (split from 14e-14 due to sizing).

**Part 1 (14e-14a):** Handler directory, context types, navigation handlers
**Part 2 (this story):** Edit and save handlers
**Part 3 (14e-14c):** Discard and credit check handlers
**Part 4 (14e-14d):** App.tsx integration and verification

### Current Implementation

Edit and save handlers in `src/App.tsx`:
- `handleBatchEditReceipt` (~10 lines) - Edit a receipt during batch review
- `handleBatchSaveComplete` (~15 lines) - Handle when save all completes
- `handleBatchSaveTransaction` (~10 lines) - Save a single transaction during batch

## Atlas Workflow Analysis

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **#3: Batch Processing Flow** | DIRECT - Save operations in batch review |
| **#1: Scan Receipt Flow** | DOWNSTREAM - Batch feeds into save |

## Acceptance Criteria

### AC1: Context Type Additions

**Given** types.ts from Story 14e-14a
**When** this story is completed
**Then:**
- `BatchEditContext` interface added with:
  - `setBatchEditingIndexContext: (index: number | null) => void`
  - `setPendingTransaction: (tx: Transaction | null) => void`
  - `navigateToView: (view: ViewType) => void`
- `SaveContext` interface added with:
  - `services: AppServices | null`
  - `user: User | null`
- `SaveCompleteContext` interface added with:
  - `setBatchImages: (images: string[]) => void`
  - `batchProcessing: { reset: () => void }`
  - `resetScanContext: () => void`
  - `setShowBatchCompleteModal: (show: boolean) => void`
  - `setBatchSavedTransactions: (txs: Transaction[]) => void`
  - `navigateToView: (view: ViewType) => void`
  - `generateBatchInsight?: (txs: Transaction[]) => void`

### AC2: Edit Handler Extracted

**Given** `handleBatchEditReceipt` in App.tsx
**When** reviewing `src/features/batch-review/handlers/editReceipt.ts`
**Then:**
- `editBatchReceipt(receipt: BatchReceipt, batchIndex: number, context: BatchEditContext)` extracted
- Handler sets batch editing index (batchIndex - 1 for 0-based)
- Handler sets thumbnail URL on transaction if present
- Handler navigates to transaction-editor view

### AC3: Save Handlers Extracted

**Given** `handleBatchSaveComplete` and `handleBatchSaveTransaction` in App.tsx
**When** reviewing `src/features/batch-review/handlers/save.ts`
**Then:**
- `saveBatchTransaction(transaction: Transaction, context: SaveContext): Promise<string>` extracted
- `handleSaveComplete(savedTransactions: Transaction[], context: SaveCompleteContext)` extracted
- `saveBatchTransaction` includes auth check and Firestore save
- `handleSaveComplete` resets state, shows modal, generates insights

### AC4: Unit Tests

**Given** edit and save handlers extracted
**When** running tests
**Then:**
- Tests verify edit handler sets correct index and navigates
- Tests verify save handler throws on missing auth
- Tests verify save complete resets all state
- Tests verify insight generation called with saved transactions

## Tasks / Subtasks

- [ ] **Task 1: Add context types** (AC: 1)
  - [ ] 1.1 Add `BatchEditContext` to types.ts
  - [ ] 1.2 Add `SaveContext` to types.ts
  - [ ] 1.3 Add `SaveCompleteContext` to types.ts

- [ ] **Task 2: Extract edit handler** (AC: 2)
  - [ ] 2.1 Create `editReceipt.ts` with `editBatchReceipt`
  - [ ] 2.2 Handle thumbnail URL injection
  - [ ] 2.3 Export from index.ts
  - [ ] 2.4 Write unit tests

- [ ] **Task 3: Extract save handlers** (AC: 3, 4)
  - [ ] 3.1 Create `save.ts` with `saveBatchTransaction`
  - [ ] 3.2 Add `handleSaveComplete` to `save.ts`
  - [ ] 3.3 Include auth check in saveBatchTransaction
  - [ ] 3.4 Include insight generation in handleSaveComplete
  - [ ] 3.5 Export from index.ts
  - [ ] 3.6 Write unit tests for both handlers

## Dev Notes

### Edit Handler Implementation

```typescript
// src/features/batch-review/handlers/editReceipt.ts
import type { BatchReceipt } from '@/types/batchReceipt';
import type { BatchEditContext } from './types';

export function editBatchReceipt(
  receipt: BatchReceipt,
  batchIndex: number,
  context: BatchEditContext
): void {
  const { setBatchEditingIndexContext, setPendingTransaction, navigateToView } = context;

  // batchIndex is 1-based from UI, convert to 0-based
  setBatchEditingIndexContext(batchIndex - 1);

  // Set transaction with thumbnail if available
  const transactionWithThumbnail = receipt.imageUrl
    ? { ...receipt.transaction, thumbnailUrl: receipt.imageUrl }
    : receipt.transaction;

  setPendingTransaction(transactionWithThumbnail);
  navigateToView('transaction-editor');
}
```

### Save Handler Implementation

```typescript
// src/features/batch-review/handlers/save.ts
import type { Transaction } from '@/types/transaction';
import type { SaveContext, SaveCompleteContext } from './types';

export async function saveBatchTransaction(
  transaction: Transaction,
  context: SaveContext
): Promise<string> {
  const { services, user } = context;

  if (!services || !user) {
    throw new Error('Not authenticated');
  }

  const { db, appId } = services;
  // Actual Firestore save logic here
  // Return transaction ID
}

export function handleSaveComplete(
  savedTransactions: Transaction[],
  context: SaveCompleteContext
): void {
  const {
    setBatchImages,
    batchProcessing,
    resetScanContext,
    setShowBatchCompleteModal,
    setBatchSavedTransactions,
    navigateToView,
    generateBatchInsight,
  } = context;

  // Reset batch state
  setBatchImages([]);
  batchProcessing.reset();
  resetScanContext();

  // Show results modal if transactions were saved
  if (savedTransactions.length > 0) {
    setBatchSavedTransactions(savedTransactions);
    setShowBatchCompleteModal(true);

    // Generate batch insight
    if (generateBatchInsight) {
      generateBatchInsight(savedTransactions);
    }
  }

  navigateToView('dashboard');
}
```

### Dependencies

- **Depends on:** Story 14e-14a (types, directory structure)
- **Blocks:** Story 14e-14d (App.tsx integration)

### References

- [Source: src/App.tsx:1707-1715 - handleBatchEditReceipt]
- [Source: src/App.tsx:1998-2011 - handleBatchSaveComplete]
- [Source: src/App.tsx:2014-2024 - handleBatchSaveTransaction]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
