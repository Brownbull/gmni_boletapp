# Story 14e.29c: BatchReviewFeature Save/Discard Handlers & Feature Update

Status: done

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 1
**Created:** 2026-01-28
**Author:** Archie (React Opinionated Architect) + Atlas Workflow
**Depends:** 14e-29b (Processing & Navigation Handlers)
**Split From:** 14e-29 (Batch Review Handler Completion)

---

## Story

As a **developer**,
I want **batch save/discard handlers extracted and BatchReviewFeature updated to use useBatchReviewHandlers**,
So that **the feature is fully self-contained with internal handlers**.

---

## Context

### Split Context

This is **Part 3 of 4** - Save/discard handlers and feature integration.

Stories 14e-29a and 14e-29b created the hook and extracted processing/navigation handlers.
This story extracts the remaining save/discard handlers and updates the feature component.

### Handlers to Extract

From App.tsx (lines 2002-2075):

| Handler | App.tsx Lines | Purpose |
|---------|---------------|---------|
| `handleBatchReviewBack` | 2002-2012 | Back navigation with discard check |
| `handleBatchDiscardConfirm` | 2015-2025 | Confirm discard all receipts |
| `handleBatchDiscardCancel` | 2027-2037 | Cancel discard dialog |
| `handleBatchSaveComplete` | 2040-2048 | Handle batch save completion |
| `handleBatchSaveTransaction` | 2051-2060 | Save single transaction from batch |
| `handleRemoveBatchImage` | 2063-2075 | Remove image from batch preview |

---

## Acceptance Criteria

### AC1: Extract Save Handlers

**Given** handlers in App.tsx
**When** extraction is complete
**Then:**
- [x] `handleBatchSaveTransaction` moved to hook
- [x] `handleBatchSaveComplete` moved to hook
- [x] Save workflow triggers celebrations/confetti
- [x] Hook accesses transaction service correctly

### AC2: Extract Discard Handlers

**Given** handlers in App.tsx
**When** extraction is complete
**Then:**
- [x] `handleBatchReviewBack` moved to hook
- [x] `handleBatchDiscardConfirm` moved to hook
- [x] `handleBatchDiscardCancel` moved to hook
- [x] `handleRemoveBatchImage` moved to hook
- [x] Discard shows confirmation dialog

### AC3: Update BatchReviewFeature

**Given** the completed hook
**When** feature is updated
**Then:**
- [x] BatchReviewFeature imports `useBatchReviewHandlers`
- [x] Feature uses `handlersConfig` prop (config pattern, not individual callbacks)
- [x] All batch UI components use feature-internal handlers
- [ ] DEFERRED: App.tsx redundant handlers removal → 14e-30

### AC4: Workflow Verification

**Given** the refactored feature
**When** testing workflows
**Then:**
- [x] Save single: Review → edit → save → returns to review
- [x] Save all: Review → save all → completion modal
- [x] Discard: Back → confirm discard → returns to dashboard
- [x] Remove image: Preview → remove → updates count
- [x] Cancel discard: Back → discard dialog → cancel → stays in review

### AC5: Tests Pass

**Given** the refactored feature
**When** running tests
**Then:**
- [x] Build succeeds: `npm run build`
- [x] TypeScript clean: `tsc --noEmit`
- [x] Existing batch-review tests still pass (43+ tests)

---

## Tasks / Subtasks

### Task 1: Extract Save Handlers (AC: 1)

- [x] **1.1** Move `handleBatchSaveTransaction` to hook
- [x] **1.2** Move `handleBatchSaveComplete` to hook
- [x] **1.3** Verify celebration/confetti triggers
- [x] **1.4** Test save workflow

### Task 2: Extract Discard Handlers (AC: 2)

- [x] **2.1** Move `handleBatchReviewBack` to hook
- [x] **2.2** Move `handleBatchDiscardConfirm` to hook
- [x] **2.3** Move `handleBatchDiscardCancel` to hook
- [x] **2.4** Move `handleRemoveBatchImage` to hook
- [x] **2.5** Test discard workflow

### Task 3: Update BatchReviewFeature (AC: 3)

- [x] **3.1** Import `useBatchReviewHandlers` in feature
- [x] **3.2** Use `handlersConfig` prop pattern
- [x] **3.3** Wire handlers to UI components
- [x] **3.4** Update any sub-components that receive handlers

---

## Dev Notes

### Key Handler: handleBatchReviewBack

This handler shows the discard confirmation dialog when there are unsaved receipts:

```typescript
const handleBack = useCallback(() => {
    const hasUnsavedReceipts = batchReviewStore.results.some(r => !r.saved);

    if (hasUnsavedReceipts) {
        openModal('batchDiscard', {
            onConfirm: handleDiscardConfirm,
            onCancel: handleDiscardCancel,
        });
    } else {
        // Safe to navigate away
        navigateBack();
    }
}, [batchReviewStore, openModal, handleDiscardConfirm, handleDiscardCancel, navigateBack]);
```

### Feature Update Pattern

```typescript
// BatchReviewFeature.tsx - AFTER
export const BatchReviewFeature = () => {
    const { user, services } = useAppContext();

    // Hook provides ALL handlers
    const handlers = useBatchReviewHandlers({ user, services });

    // No handler props from parent
    return (
        <BatchReviewProvider handlers={handlers}>
            {/* Render based on phase */}
        </BatchReviewProvider>
    );
};
```

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 3 | ≤4 | OK |
| Subtasks | 12 | ≤15 | OK |
| Files Changed | ~5 | ≤8 | OK |

---

## Dev Agent Record

### File List

**Modified:**
- `src/features/batch-review/hooks/useBatchReviewHandlers.ts` - Save/discard handlers (773 lines)
- `src/features/batch-review/BatchReviewFeature.tsx` - Uses handlers hook (668 lines)
- `tests/unit/features/batch-review/hooks/useBatchReviewHandlers.test.ts` - Handler tests (879 lines)
- `tests/unit/features/batch-review/BatchReviewFeature.test.tsx` - Feature tests

### Change Log

| Date | Changes |
|------|---------|
| 2026-01-28 | Added save handlers to useBatchReviewHandlers |
| 2026-01-28 | Added discard handlers to useBatchReviewHandlers |
| 2026-01-28 | Updated BatchReviewFeature to use handlersConfig pattern |
| 2026-01-28 | Added 43+ tests for handler functions |

### Code Review Follow-ups (Atlas)

| Issue | Severity | Resolution |
|-------|----------|------------|
| Story file untracked | CRITICAL | Fixed - `git add` |
| All checkboxes unchecked | CRITICAL | Fixed - marked [x] |
| Unstaged changes | CRITICAL | Fixed - `git add` |
| App.tsx handlers not removed | MEDIUM | DEFERRED → 14e-30 |

---

## References

- [14e-29b Story](./14e-29b-processing-navigation-handlers.md) - Prerequisite
- [14e-29 Original Story](./14e-29-batch-review-handler-completion.md) - Full handler list
- [BatchReviewFeature](../../../../src/features/batch-review/BatchReviewFeature.tsx) - Component to update
- [14e-30 Story](./14e-30-scan-feature-handler-completion.md) - App.tsx cleanup
