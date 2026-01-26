# Story 14e.14b: Batch Edit & Save Handlers

Status: done

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
  - `setCurrentTransaction: (tx: Transaction | null) => void` *(implementation naming: setCurrentTransaction instead of setPendingTransaction)*
  - `setTransactionEditorMode: (mode: 'new' | 'existing') => void` *(added: sets editor mode to 'existing' for batch editing)*
  - `navigateToView: (view: View) => void`
- `SaveContext` interface added with:
  - `services: AppServices | null`
  - `user: User | null`
- `SaveCompleteContext` interface added with:
  - `setBatchImages: (images: string[]) => void`
  - `batchProcessing: { reset: () => void }`
  - `resetScanContext: () => void`
  - `showScanDialog: (type: ScanDialogType, data: BatchCompleteDialogData) => void` *(implementation deviation: uses unified dialog system instead of setShowBatchCompleteModal)*
  - `setView: (view: View) => void` *(implementation deviation: matches App.tsx naming instead of navigateToView)*
  - *(removed: setBatchSavedTransactions - transactions passed in BatchCompleteDialogData instead)*
  - *(removed: generateBatchInsight - deferred to future story, not in current App.tsx implementation)*

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
- Tests verify BATCH_COMPLETE dialog shown with saved transactions *(implementation deviation: insight generation deferred to future story)*

## Tasks / Subtasks

- [x] **Task 1: Add context types** (AC: 1)
  - [x] 1.1 Add `BatchEditContext` to types.ts
  - [x] 1.2 Add `SaveContext` to types.ts
  - [x] 1.3 Add `SaveCompleteContext` to types.ts

- [x] **Task 2: Extract edit handler** (AC: 2)
  - [x] 2.1 Create `editReceipt.ts` with `editBatchReceipt`
  - [x] 2.2 Handle thumbnail URL injection
  - [x] 2.3 Export from index.ts
  - [x] 2.4 Write unit tests (12 tests)

- [x] **Task 3: Extract save handlers** (AC: 3, 4)
  - [x] 3.1 Create `save.ts` with `saveBatchTransaction`
  - [x] 3.2 Add `handleSaveComplete` to `save.ts`
  - [x] 3.3 Include auth check in saveBatchTransaction
  - [x] 3.4 Include batch complete dialog in handleSaveComplete
  - [x] 3.5 Export from index.ts
  - [x] 3.6 Write unit tests for both handlers (27 tests)

### Review Follow-ups (Archie)

- [x] [Archie-Review][HIGH] Update AC1 SaveCompleteContext spec to match implementation [story file] - AC specifies setShowBatchCompleteModal/setBatchSavedTransactions/generateBatchInsight but impl uses showScanDialog/setView. Document deviation for 14e-14d integration.
- [x] [Archie-Review][MEDIUM] Update feature barrel to export new handlers and types [src/features/batch-review/index.ts] - Add exports for editBatchReceipt, saveBatchTransaction, handleSaveComplete, BatchEditContext, SaveContext, SaveCompleteContext
- [x] [Archie-Review][LOW] Replace `any[]` types in SaveContext with proper CategoryMapping type [src/features/batch-review/handlers/types.ts:147-155]

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
  const { setBatchEditingIndexContext, setCurrentTransaction, setTransactionEditorMode, navigateToView } = context;

  // batchIndex is 1-based from UI, convert to 0-based
  setBatchEditingIndexContext(batchIndex - 1);

  // Set transaction with thumbnail if available
  const transactionWithThumbnail = receipt.imageUrl
    ? { ...receipt.transaction, thumbnailUrl: receipt.imageUrl }
    : receipt.transaction;

  setCurrentTransaction(transactionWithThumbnail);
  setTransactionEditorMode('existing');
  navigateToView('transaction-editor');
}
```

### Save Handler Implementation

```typescript
// src/features/batch-review/handlers/save.ts
import type { Transaction } from '@/types/transaction';
import type { SaveContext, SaveCompleteContext } from './types';
import { DIALOG_TYPES, type BatchCompleteDialogData } from '@/types/scanStateMachine';

export async function saveBatchTransaction(
  transaction: Transaction,
  context: SaveContext
): Promise<string> {
  const { services, user, mappings, applyCategoryMappings, findMerchantMatch, applyItemNameMappings } = context;

  if (!services || !user) {
    throw new Error('Not authenticated');
  }

  const { db, appId } = services;
  // Apply category/merchant/item name mappings
  // Save to Firestore
  // Return transaction ID
}

export function handleSaveComplete(
  savedTransactions: Transaction[],
  context: SaveCompleteContext
): void {
  const { setBatchImages, batchProcessing, resetScanContext, showScanDialog, setView } = context;

  // Reset batch state
  setBatchImages([]);
  batchProcessing.reset();
  resetScanContext();

  // Show results dialog if transactions were saved
  if (savedTransactions.length > 0) {
    const dialogData: BatchCompleteDialogData = {
      transactions: savedTransactions,
      creditsUsed: 1,
    };
    showScanDialog(DIALOG_TYPES.BATCH_COMPLETE, dialogData);
  }

  setView('dashboard');
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

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Types Implementation**: Added `BatchEditContext`, `SaveContext`, and `SaveCompleteContext` interfaces to types.ts. Also added helper types: `CategoryMappingResult`, `MerchantMatchResult`, `ItemNameMappingResult`, `BatchProcessingController`. Imported `StoreCategory` for type safety on merchant category mapping.

2. **Edit Handler**: Extracted `editBatchReceipt` function that:
   - Converts 1-based UI index to 0-based internal index
   - Builds transaction with optional thumbnailUrl from receipt imageUrl
   - Sets transaction editor mode to 'existing'
   - Navigates to 'transaction-editor' view

3. **Save Handlers**: Extracted two handlers:
   - `saveBatchTransaction`: Applies category/merchant/item name mappings, saves to Firestore, updates shared group member timestamps (fire-and-forget)
   - `handleSaveComplete`: Resets batch state, shows BATCH_COMPLETE dialog if transactions saved, navigates to dashboard

4. **Type Safety Fix**: Updated `MerchantMatchResult.mapping.storeCategory` from `string` to `StoreCategory` to ensure type compatibility with Transaction.category

5. **Note on AC4**: Story spec says "insight generation called with saved transactions" but actual App.tsx implementation shows batch complete dialog instead. Implementation follows actual App.tsx behavior.

### File List

- `src/features/batch-review/handlers/types.ts` - Added context types + CategoryMapping type fix
- `src/features/batch-review/handlers/editReceipt.ts` - New file: edit handler
- `src/features/batch-review/handlers/save.ts` - New file: save handlers
- `src/features/batch-review/handlers/index.ts` - Updated exports
- `src/features/batch-review/index.ts` - Updated feature barrel with new exports
- `tests/unit/features/batch-review/handlers/editReceipt.test.ts` - New file: 12 tests
- `tests/unit/features/batch-review/handlers/save.test.ts` - New file: 27 tests

### Test Summary

- **Total Tests**: 39 passing
- **editReceipt.test.ts**: 12 tests covering index conversion, thumbnail handling, editor mode, navigation
- **save.test.ts**: 27 tests covering auth check, mapping applications, Firestore save, shared groups, state reset, dialog display

### Review Follow-up Resolution Notes

6. **[HIGH] AC1 Spec Documentation**: Updated AC1 in story file to document actual implementation:
   - SaveCompleteContext uses `showScanDialog` and `setView` instead of `setShowBatchCompleteModal`/`navigateToView`
   - Removed `setBatchSavedTransactions` (passed in BatchCompleteDialogData instead)
   - Removed `generateBatchInsight` (deferred to future story)
   - BatchEditContext uses `setCurrentTransaction` instead of `setPendingTransaction`
   - Added `setTransactionEditorMode` to BatchEditContext

7. **[MEDIUM] Feature Barrel Exports**: Updated `src/features/batch-review/index.ts` to export:
   - Handler functions: `editBatchReceipt`, `saveBatchTransaction`, `handleSaveComplete`
   - Types: `BatchEditContext`, `SaveContext`, `SaveCompleteContext`, `CategoryMappingResult`, `MerchantMatchResult`, `ItemNameMappingResult`, `BatchProcessingController`

8. **[LOW] Type Safety Fix**: Replaced `any[]` types in SaveContext with proper `CategoryMapping[]` type, imported from `@/types/categoryMapping`. Removed eslint-disable comments.

### Code Review Fix (Atlas-Enhanced Review)

9. **[MEDIUM] Console Warning Prefix**: Fixed console.warn prefix in `save.ts:135` from `[BatchSave]` to `[App]` to match source App.tsx:2004 for consistency.
