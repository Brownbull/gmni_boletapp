# Story 14e.29: BatchReviewFeature Handler Completion

Status: split

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 3 (original) → 4 pts (split total)
**Created:** 2026-01-28
**Split:** 2026-01-28 via Atlas Workflow Analysis
**Author:** Archie (React Opinionated Architect)
**Depends:** 14e-28 (TransactionEditorView Handler Extraction)

---

## Split Notice

> **SPLIT 2026-01-28:** This story exceeded sizing guidelines (9 tasks, 32 subtasks - 2.1x limit)
>
> Split into 4 sub-stories:
>
> | Sub-Story | Description | Points |
> |-----------|-------------|--------|
> | [14e-29a](./14e-29a-hook-structure-consolidation.md) | Hook structure + consolidate extractions | 1 |
> | [14e-29b](./14e-29b-processing-navigation-handlers.md) | Processing & navigation handlers | 1 |
> | [14e-29c](./14e-29c-save-discard-handlers.md) | Save/discard handlers + feature update | 1 |
> | [14e-29d](./14e-29d-cleanup-tests-verification.md) | App.tsx cleanup + tests + verification | 1 |
>
> **Dependency Chain:** 14e-28 → 14e-29a → 14e-29b → 14e-29c → 14e-29d

---

## Story (Original - See sub-stories for implementation)

As a **developer**,
I want **BatchReviewFeature to own all its handlers instead of receiving them from App.tsx**,
So that **batch processing logic is fully encapsulated in the feature module**.

---

## Context

### Problem Statement

App.tsx currently contains **13 handler functions** for batch processing:

| Handler | Lines | Purpose |
|---------|-------|---------|
| `handleCancelBatchPreview` | 1670-1674 | Cancel batch preview modal |
| `handleBatchConfirmWithCreditCheck` | 1677-1679 | Trigger credit check flow |
| `handleBatchProcessingStart` | 1683-1720 | Start batch processing (~40 lines) |
| `handleCreditCheckComplete` | 1724-1726 | Reset credit check state |
| `handleReduceBatch` | 1729-1731 | Reduce batch size from credit dialog |
| `handleBatchEditReceipt` | 1735-1742 | Edit single receipt from batch |
| `handleBatchPrevious` | 1744-1751 | Navigate to previous receipt |
| `handleBatchNext` | 1753-1761 | Navigate to next receipt |
| `handleBatchReviewBack` | 2002-2012 | Back navigation with discard check |
| `handleBatchDiscardConfirm` | 2015-2025 | Confirm discard all receipts |
| `handleBatchDiscardCancel` | 2027-2037 | Cancel discard dialog |
| `handleBatchSaveComplete` | 2040-2048 | Handle batch save completion |
| `handleBatchSaveTransaction` | 2051-2060 | Save single transaction from batch |
| `handleRemoveBatchImage` | 2063-2075 | Remove image from batch |

### Architecture Decision Reference

From `architecture-decision.md`, Phase 3:
> - Create `src/features/batch-review/` structure
> - Implement `useBatchReviewStore` with Zustand
> - **Extract batch-related handlers**
> - **Remove batch-related code from App.tsx**

This was scoped but not fully completed. The store exists, but handlers remain in App.tsx.

### Current BatchReviewFeature Structure

```
src/features/batch-review/
├── index.ts
├── BatchReviewFeature.tsx
├── store/
│   └── useBatchReviewStore.ts     # ✅ Exists
├── handlers/
│   ├── index.ts
│   ├── editBatchReceipt.ts        # ✅ Partial extraction
│   ├── handleReviewBack.ts        # ✅ Partial extraction
│   ├── confirmDiscard.ts          # ✅ Partial extraction
│   ├── cancelDiscard.ts           # ✅ Partial extraction
│   ├── handleSaveComplete.ts      # ✅ Partial extraction
│   └── saveBatchTransaction.ts    # ✅ Partial extraction
└── components/
```

**Note:** Some handlers were "extracted" but App.tsx still has wrapper functions that call them with dependencies. The wrappers need to be eliminated.

---

## Acceptance Criteria

### AC1: Create useBatchReviewHandlers Hook

**Given** the handler extraction pattern
**When** implementing the feature's internal handlers
**Then:**
- [ ] Create `src/features/batch-review/hooks/useBatchReviewHandlers.ts`
- [ ] Hook returns all 13+ handlers
- [ ] Hook accesses stores directly (scan, batch-review, credit)
- [ ] Hook consolidates existing partial extractions

### AC2: Extract All Batch Handlers

**Given** handlers currently in App.tsx
**When** extraction is complete
**Then:**
- [ ] `handleCancelBatchPreview` moved to hook
- [ ] `handleBatchConfirmWithCreditCheck` moved to hook
- [ ] `handleBatchProcessingStart` moved to hook
- [ ] `handleCreditCheckComplete` moved to hook/CreditFeature
- [ ] `handleReduceBatch` moved to hook/CreditFeature
- [ ] `handleBatchEditReceipt` moved to hook
- [ ] `handleBatchPrevious` moved to hook
- [ ] `handleBatchNext` moved to hook
- [ ] `handleBatchReviewBack` moved to hook
- [ ] `handleBatchDiscardConfirm` moved to hook
- [ ] `handleBatchDiscardCancel` moved to hook
- [ ] `handleBatchSaveComplete` moved to hook
- [ ] `handleBatchSaveTransaction` moved to hook
- [ ] `handleRemoveBatchImage` moved to hook

### AC3: App.tsx Handler Removal

**Given** handlers moved to feature
**When** reviewing App.tsx
**Then:**
- [ ] All `handleBatch*` functions DELETED from App.tsx
- [ ] `handleCancelBatchPreview` DELETED
- [ ] `handleCreditCheckComplete` DELETED (or moved to CreditFeature)
- [ ] `handleReduceBatch` DELETED (or moved to CreditFeature)
- [ ] `handleRemoveBatchImage` DELETED
- [ ] App.tsx reduced by ~250 lines

### AC4: Update BatchReviewFeature

**Given** the new hook exists
**When** the feature is updated
**Then:**
- [ ] Feature imports `useBatchReviewHandlers`
- [ ] Feature no longer receives handler props from App.tsx
- [ ] All batch UI components use feature-internal handlers
- [ ] BatchReviewView uses feature handlers

### AC5: Consolidate Partial Extractions

**Given** existing partial handler extractions
**When** consolidation is complete
**Then:**
- [ ] `editBatchReceipt.ts` integrated into hook
- [ ] `handleReviewBack.ts` integrated into hook
- [ ] `confirmDiscard.ts` integrated into hook
- [ ] `cancelDiscard.ts` integrated into hook
- [ ] `handleSaveComplete.ts` integrated into hook
- [ ] `saveBatchTransaction.ts` integrated into hook
- [ ] No more "dependency injection" pattern from App.tsx

### AC6: All Tests Pass

**Given** the refactored architecture
**When** running the test suite
**Then:**
- [ ] Build succeeds: `npm run build`
- [ ] All tests pass: `npm run test`
- [ ] TypeScript clean: `tsc --noEmit`

### AC7: Batch Workflows Function

**Given** the refactored feature
**When** testing batch workflows
**Then:**
- [ ] Batch capture: Long-press → capture multiple → preview
- [ ] Credit check: Preview → confirm → credit dialog → start
- [ ] Processing: Shows progress → completes → review screen
- [ ] Edit receipt: Review → edit → save → return to review
- [ ] Navigation: Prev/Next through receipts
- [ ] Save all: Review → save all → completion modal
- [ ] Discard: Back → confirm discard → returns to dashboard
- [ ] Remove image: Preview → remove → updates count

---

## Tasks / Subtasks

### Task 1: Create Handler Hook Structure (AC: 1)

- [ ] **1.1** Create `src/features/batch-review/hooks/` directory
- [ ] **1.2** Create `useBatchReviewHandlers.ts` skeleton
- [ ] **1.3** Define handler interface types
- [ ] **1.4** Set up store imports

### Task 2: Consolidate Existing Extractions (AC: 5)

- [ ] **2.1** Review existing `handlers/` files
- [ ] **2.2** Move logic into `useBatchReviewHandlers`
- [ ] **2.3** Remove dependency injection pattern
- [ ] **2.4** Delete redundant handler files (keep as utilities if needed)

### Task 3: Extract Processing Handlers (AC: 2)

- [ ] **3.1** Move `handleBatchProcessingStart` to hook
- [ ] **3.2** Move `handleCancelBatchPreview` to hook
- [ ] **3.3** Move credit-related handlers (or coordinate with CreditFeature)
- [ ] **3.4** Test processing workflow

### Task 4: Extract Navigation Handlers (AC: 2)

- [ ] **4.1** Move `handleBatchPrevious` to hook
- [ ] **4.2** Move `handleBatchNext` to hook
- [ ] **4.3** Move `handleBatchEditReceipt` to hook
- [ ] **4.4** Test navigation workflow

### Task 5: Extract Save/Discard Handlers (AC: 2)

- [ ] **5.1** Move `handleBatchSaveTransaction` to hook
- [ ] **5.2** Move `handleBatchSaveComplete` to hook
- [ ] **5.3** Move `handleBatchReviewBack` to hook
- [ ] **5.4** Move `handleBatchDiscardConfirm` to hook
- [ ] **5.5** Move `handleBatchDiscardCancel` to hook
- [ ] **5.6** Move `handleRemoveBatchImage` to hook
- [ ] **5.7** Test save/discard workflows

### Task 6: Update Feature Components (AC: 4)

- [ ] **6.1** Update `BatchReviewFeature.tsx` to use hook
- [ ] **6.2** Update any sub-components
- [ ] **6.3** Remove prop drilling from App.tsx

### Task 7: Clean Up App.tsx (AC: 3)

- [ ] **7.1** Delete all `handleBatch*` function definitions
- [ ] **7.2** Delete batch-related state that moves to feature
- [ ] **7.3** Clean up unused imports
- [ ] **7.4** Verify line count reduction

### Task 8: Update Tests (AC: 6)

- [ ] **8.1** Create `useBatchReviewHandlers.test.ts`
- [ ] **8.2** Update `BatchReviewFeature.test.tsx`
- [ ] **8.3** Run full test suite

### Task 9: Final Verification (AC: 6, 7)

- [ ] **9.1** Run `npm run build`
- [ ] **9.2** Run `npm run test`
- [ ] **9.3** Manual smoke test batch workflows
- [ ] **9.4** Verify App.tsx line count

---

## Dev Notes

### Target Hook Structure

```typescript
// src/features/batch-review/hooks/useBatchReviewHandlers.ts

interface BatchReviewHandlersProps {
    user: User | null;
    services: AppServices | null;
}

interface BatchReviewHandlers {
    // Preview handlers
    handleCancelPreview: () => void;
    handleConfirmWithCreditCheck: () => void;
    handleProcessingStart: () => Promise<void>;
    handleRemoveImage: (index: number) => void;

    // Navigation handlers
    handlePrevious: () => void;
    handleNext: () => void;
    handleEditReceipt: (receipt: BatchReceipt, index: number) => void;

    // Save/Discard handlers
    handleSaveTransaction: (transaction: Transaction) => Promise<string>;
    handleSaveComplete: (ids: string[], transactions: Transaction[]) => Promise<void>;
    handleBack: () => void;
    handleDiscardConfirm: () => void;
    handleDiscardCancel: () => void;

    // Credit handlers (may coordinate with CreditFeature)
    handleCreditCheckComplete: () => void;
    handleReduceBatch: (maxProcessable: number) => void;
}

export function useBatchReviewHandlers(
    props: BatchReviewHandlersProps
): BatchReviewHandlers {
    const scanStore = useScanStore();
    const batchStore = useBatchReviewStore();
    const { setView } = useNavigationActions();
    const { openModal } = useModalActions();

    const handleProcessingStart = useCallback(async () => {
        // Logic from handleBatchProcessingStart
        // No more dependency injection - direct store access
    }, [scanStore, batchStore]);

    // ... other handlers

    return { ... };
}
```

### Coordination with CreditFeature

Some handlers (`handleCreditCheckComplete`, `handleReduceBatch`) may belong in CreditFeature instead. Options:

1. **Keep in BatchReviewFeature** - Since they're batch-specific credit logic
2. **Move to CreditFeature** - Since they're credit-related
3. **Shared hook** - Create `useBatchCreditHandlers` used by both

Recommendation: Keep in BatchReviewFeature since they're specific to batch processing credit checks.

### Directory Structure After

```
src/features/batch-review/
├── index.ts
├── BatchReviewFeature.tsx
├── store/
│   └── useBatchReviewStore.ts
├── hooks/                              # NEW
│   ├── index.ts
│   └── useBatchReviewHandlers.ts       # NEW - consolidates all handlers
├── handlers/                           # SIMPLIFIED
│   └── utils.ts                        # Keep utilities only
└── components/
```

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 9 | ≤4 | MEDIUM-LARGE |
| Subtasks | 32 | ≤15 | LARGE |
| Files Changed | ~8 | ≤8 | ACCEPTABLE |
| Handlers Extracted | 13 | - | Medium complexity |

---

## References

- [Architecture Decision](../architecture-decision.md) - Phase 3 scope
- [14e-28 Story](./14e-28-transaction-editor-handler-extraction.md) - Prerequisite
- [BatchReviewFeature](../../../../src/features/batch-review/) - Current feature structure
