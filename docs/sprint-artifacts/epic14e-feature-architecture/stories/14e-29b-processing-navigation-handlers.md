# Story 14e.29b: BatchReviewFeature Processing & Navigation Handlers

Status: done

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 1
**Created:** 2026-01-28
**Author:** Archie (React Opinionated Architect) + Atlas Workflow
**Depends:** 14e-29a (Hook Structure & Consolidation)
**Split From:** 14e-29 (Batch Review Handler Completion)

---

## Story

As a **developer**,
I want **batch processing and navigation handlers extracted from App.tsx to useBatchReviewHandlers**,
So that **batch preview and navigation flows are encapsulated in the feature**.

---

## Context

### Split Context

This is **Part 2 of 4** - Processing and navigation handlers.

Story 14e-29a created the hook structure and consolidated existing partial extractions.
This story extracts the **remaining** processing and navigation handlers from App.tsx.

### Handlers to Extract

From App.tsx (lines 1670-1761):

| Handler | App.tsx Lines | Purpose |
|---------|---------------|---------|
| `handleCancelBatchPreview` | 1670-1674 | Cancel batch preview modal |
| `handleBatchConfirmWithCreditCheck` | 1677-1679 | Trigger credit check flow |
| `handleBatchProcessingStart` | 1683-1720 | Start batch processing (~40 lines) |
| `handleBatchEditReceipt` | 1735-1742 | Edit single receipt from batch |
| `handleBatchPrevious` | 1744-1751 | Navigate to previous receipt |
| `handleBatchNext` | 1753-1761 | Navigate to next receipt |

---

## Acceptance Criteria

### AC1: Extract Processing Handlers

**Given** handlers in App.tsx
**When** extraction is complete
**Then:**
- [x] `handleCancelBatchPreview` moved to hook
- [x] `handleBatchConfirmWithCreditCheck` moved to hook
- [x] `handleBatchProcessingStart` moved to hook (largest - ~40 lines)
- [x] Hook accesses stores directly (no dependency injection)

### AC2: Extract Navigation Handlers

**Given** handlers in App.tsx
**When** extraction is complete
**Then:**
- [x] `handleBatchEditReceipt` moved to hook
- [x] `handleBatchPrevious` moved to hook
- [x] `handleBatchNext` moved to hook
- [x] Navigation works with scan store (setBatchEditingIndex)

### AC3: Processing Workflow Functions

**Given** the refactored handlers
**When** testing processing workflow
**Then:**
- [x] Cancel preview: Preview modal → Cancel → Returns to capture
- [x] Credit check: Preview → Confirm → Credit check dialog shows
- [x] Processing start: Credit confirmed → Processing starts → Progress shows
- [x] Batch processes all images with progress indicator

### AC4: Navigation Workflow Functions

**Given** the refactored handlers
**When** testing navigation workflow
**Then:**
- [x] Edit receipt: Review screen → Edit → Opens in editor
- [x] Previous: Navigate to previous receipt in batch
- [x] Next: Navigate to next receipt in batch
- [x] Boundary handling: First/last receipt disables prev/next

### AC5: Tests Pass

**Given** the extracted handlers
**When** running tests
**Then:**
- [x] Build succeeds: `npm run build`
- [x] TypeScript clean: `tsc --noEmit`
- [x] Existing batch-review tests still pass

---

## Tasks / Subtasks

### Task 1: Extract Processing Handlers (AC: 1)

- [x] **1.1** Move `handleCancelBatchPreview` to hook
- [x] **1.2** Move `handleBatchConfirmWithCreditCheck` to hook
- [x] **1.3** Move `handleBatchProcessingStart` to hook
- [x] **1.4** Wire up store access (useScanStore, useBatchReviewStore)
- [x] **1.5** Test processing workflow

### Task 2: Extract Navigation Handlers (AC: 2)

- [x] **2.1** Move `handleBatchEditReceipt` to hook (was already done in 14e-29a)
- [x] **2.2** Move `handleBatchPrevious` to hook (was already done in 14e-29a)
- [x] **2.3** Move `handleBatchNext` to hook (was already done in 14e-29a)
- [x] **2.4** Wire up scan store integration (setBatchEditingIndex)
- [x] **2.5** Test navigation workflow

---

## Dev Notes

### Key Handler: handleBatchProcessingStart

This is the largest handler (~40 lines). It orchestrates:
1. Get images from scan store
2. Reserve credits
3. Call batch processing service
4. Handle success/failure
5. Navigate to review screen

```typescript
const handleBatchProcessingStart = useCallback(async () => {
    const images = scanStore.images;
    if (!images.length || !user || !services) return;

    try {
        // Reserve credits
        const { available } = await services.creditService.getCreditInfo(user.uid);
        // ... processing logic

        // Start processing
        batchReviewStore.setPhase('processing');
        const results = await services.batchProcessingService.process(images);

        // Navigate to review
        batchReviewStore.setResults(results);
        batchReviewStore.setPhase('reviewing');
    } catch (error) {
        // Handle error
    }
}, [scanStore, batchReviewStore, user, services]);
```

### Store Interactions

- `useScanStore`: images, setBatchEditingIndex
- `useBatchReviewStore`: phase, results, currentIndex, setPhase, setResults
- `useNavigationActions`: setView

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 2 | ≤4 | OK |
| Subtasks | 10 | ≤15 | OK |
| Files Changed | ~3 | ≤8 | OK |

---

## References

- [14e-29a Story](./14e-29a-hook-structure-consolidation.md) - Prerequisite
- [14e-29 Original Story](./14e-29-batch-review-handler-completion.md) - Full handler list

---

## Dev Agent Record

### Implementation Summary

**Story completed:** 2026-01-28

#### Processing Handlers Implemented (Task 1)

Replaced stub implementations in `useBatchReviewHandlers` with actual logic:

1. **handleCancelPreview** - Closes preview modal, clears batch images
2. **handleConfirmWithCreditCheck** - Triggers credit check via `setShouldTriggerCreditCheck`
3. **handleProcessingStart** - Full batch processing orchestration:
   - Hides preview modal
   - Navigates to batch-review view
   - Dispatches `processStart` to scan store
   - Starts parallel processing with progress callbacks
   - Tags results with group ID if in group mode
   - Creates batch receipts and dispatches completion
4. **handleRemoveImage** - Removes image from batch, switches to single mode if 1 image left

#### Navigation Handlers Verified (Task 2)

The navigation handlers were already implemented in story 14e-29a:
- `handlePrevious` - Navigate to previous receipt in batch
- `handleNext` - Navigate to next receipt in batch
- `handleEditReceipt` - Edit single receipt, opens transaction editor

These handlers use `setBatchEditingIndexContext` prop which wraps the scan store's `setBatchEditingIndex`.

### Files Modified

| File | Change |
|------|--------|
| `src/features/batch-review/hooks/useBatchReviewHandlers.ts` | Added new props, store access, implemented 4 handlers |
| `tests/unit/features/batch-review/hooks/useBatchReviewHandlers.test.ts` | Added scan store mock, updated tests for new handlers |

### Props Added to Hook Interface

```typescript
// Story 14e-29b: Processing handler dependencies
setShowBatchPreview: (show: boolean) => void;
setShouldTriggerCreditCheck: (trigger: boolean) => void;
batchImages: string[];
scanCurrency: string;
scanStoreType: string;
viewMode: 'personal' | 'group';
activeGroup: { id?: string } | null;
batchProcessingExtended: ExtendedBatchProcessingController;
setScanImages: (images: string[]) => void;
```

### Store Access

The hook now directly accesses scan store actions via `useScanStore()`:
- `processStart`
- `batchItemStart`
- `batchItemSuccess`
- `batchItemError`
- `batchComplete`

### Test Results

- **Build:** ✅ Succeeds
- **TypeScript:** ✅ Clean (`tsc --noEmit`)
- **Batch-review tests:** ✅ 332 tests pass
- **Hook tests:** ✅ 36 tests pass (including new behavior tests)

---

## Atlas Code Review (2026-01-28)

### Issues Found & Fixed

| Severity | Issue | Resolution |
|----------|-------|------------|
| CRITICAL | Story file 14e-29b untracked (`??`) | Staged with `git add` |
| MEDIUM | Implementation files had unstaged changes (`AM`) | Re-staged all changes |
| MEDIUM | Handler stability test missing 4 new handlers | Added all 14 handlers to stability test |

### Deferred (Low Priority)

| Issue | Reason |
|-------|--------|
| Missing `useMemo` for return object | All handlers use `useCallback` - practical impact minimal |

### Atlas Validation Summary

- **Architecture Compliance:** ✅ Store access pattern correct
- **Pattern Compliance:** ✅ Props-based injection, fire-and-forget pattern
- **Workflow Impacts:** None - handlers encapsulated in feature

### Files Modified by Review

| File | Change |
|------|--------|
| `tests/unit/features/batch-review/hooks/useBatchReviewHandlers.test.ts` | Extended stability test to cover all 14 handlers |

---

## Archie Post-Dev Review (2026-01-28)

### Issues Found & Fixed

| Severity | Issue | Resolution |
|----------|-------|------------|
| HIGH | Missing error handling in `handleProcessingStart` | Added try/catch with reset to safe state |
| LOW | `console.warn` in stub handler leaks to production | Removed console.warn, made no-op stub |

### Deferred (Architectural Debt)

| Issue | Reason |
|-------|--------|
| FSD Layer Violation - import from `@/hooks/useBatchReview` | Requires moving utility to feature layer - out of scope |
| Props Interface Size (25+ deps) | Architectural - future story may split hook further |

### Pattern Compliance

- **State Management:** ✅ Direct store access via `useScanStore()`
- **Handler Encapsulation:** ✅ All handlers use `useCallback` with proper deps
- **Error Handling:** ✅ Now catches and recovers from processing failures

### Files Modified by Review

| File | Change |
|------|--------|
| `src/features/batch-review/hooks/useBatchReviewHandlers.ts` | Added try/catch error handling, removed console.warn |
| `tests/unit/features/batch-review/hooks/useBatchReviewHandlers.test.ts` | Added error handling test, updated stub test |

### Test Results

- **Hook tests:** ✅ 37 tests pass
- **TypeScript:** ✅ Clean (`tsc --noEmit`)
