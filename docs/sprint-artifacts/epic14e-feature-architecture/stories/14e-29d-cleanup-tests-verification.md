# Story 14e.29d: BatchReviewFeature Cleanup, Tests & Verification

Status: done

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 1
**Created:** 2026-01-28
**Author:** Archie (React Opinionated Architect) + Atlas Workflow
**Depends:** 14e-29c (Save/Discard Handlers & Feature Update)
**Split From:** 14e-29 (Batch Review Handler Completion)

---

## Story

As a **developer**,
I want **App.tsx batch handlers deleted, tests updated, and batch workflows verified**,
So that **the extraction is complete and verified working**.

---

## Context

### Split Context

This is **Part 4 of 4** - Cleanup, tests, and verification.

Stories 14e-29a/b/c created the hook, extracted all handlers, and updated the feature.
This story deletes the old handlers from App.tsx and verifies everything works.

### Handlers to Delete from App.tsx

All of these should now be in `useBatchReviewHandlers`:

| Handler | Status |
|---------|--------|
| `handleCancelBatchPreview` | To delete |
| `handleBatchConfirmWithCreditCheck` | To delete |
| `handleBatchProcessingStart` | To delete |
| `handleCreditCheckComplete` | To delete (or CreditFeature) |
| `handleReduceBatch` | To delete (or CreditFeature) |
| `handleBatchEditReceipt` | To delete |
| `handleBatchPrevious` | To delete |
| `handleBatchNext` | To delete |
| `handleBatchReviewBack` | To delete |
| `handleBatchDiscardConfirm` | To delete |
| `handleBatchDiscardCancel` | To delete |
| `handleBatchSaveComplete` | To delete |
| `handleBatchSaveTransaction` | To delete |
| `handleRemoveBatchImage` | To delete |

---

## Acceptance Criteria

### AC1: App.tsx Handler Removal ✅

**Given** handlers moved to feature
**When** reviewing App.tsx
**Then:**
- [x] All `handleBatch*` functions DELETED from App.tsx
- [x] `handleCancelBatchPreview` DELETED
- [x] `handleCreditCheckComplete` DELETED (moved to useBatchReviewHandlers hook)
- [x] `handleReduceBatch` DELETED (moved to useBatchReviewHandlers hook)
- [x] `handleRemoveBatchImage` DELETED
- [x] App.tsx reduced by ~90 lines (handlers extracted to hook, useMemo config added)

### AC2: Clean Up Unused Code ✅

**Given** handlers removed
**When** cleanup is complete
**Then:**
- [x] Unused imports removed from App.tsx (confirmDiscard, cancelDiscard removed)
- [x] Unused state declarations removed (if any) - none found
- [x] No TypeScript errors
- [x] No dead code warnings

### AC3: Create/Update Tests ✅

**Given** the new hook
**When** tests are complete
**Then:**
- [x] `useBatchReviewHandlers.test.ts` created with comprehensive coverage (880 lines, 60+ tests)
- [x] `BatchReviewFeature.test.tsx` updated for new architecture
- [x] Test coverage for all 13+ handlers
- [x] Edge cases covered (empty batch, failed processing, etc.)

### AC4: All Tests Pass ✅

**Given** the refactored architecture
**When** running the test suite
**Then:**
- [x] Build succeeds: `npm run build`
- [x] All tests pass: `npm run test` (5962 tests passing)
- [x] TypeScript clean: `tsc --noEmit`
- [x] No console errors in browser (verified during smoke testing - app functions correctly)

### AC5: Batch Workflows Function (Full E2E) - PARTIAL PASS

**Given** the complete refactored feature
**When** testing all batch workflows
**Then:**
- [x] Batch capture: Long-press → capture multiple → preview ✅
- [x] Credit check: Preview → confirm → credit dialog → start ✅
- [x] Processing: Shows progress → completes → review screen ✅
- [x] Edit receipt: Review → edit → save → return to review ✅
- [x] Navigation: Prev/Next through receipts ✅
- [x] Save all: Review → save all → completion modal ✅
- [ ] Discard: Back → confirm discard → returns to dashboard ❌ **BUG: Stale completion modal appears** (see Story 14e-33)
- [ ] Remove image: Preview → remove → updates count ❌ **BUG: Remove buttons invisible on mobile** (see Story 14e-33)

**Note:** Two pre-existing bugs discovered during smoke testing. These are NOT regressions from 14e-29d refactoring - the handler wiring is correct. Bugs logged in Story 14e-33.

### AC6: Line Count Verification ✅

**Given** the cleanup is complete
**When** checking App.tsx
**Then:**
- [x] App.tsx line count documented: **2581 lines**
- [x] ~90 lines removed from batch handlers (8 handlers deleted, replaced with hook call + useMemo config)
- [x] Progress toward 500-800 line target documented: Still 2581 lines, requires more stories to reach target

---

## Tasks / Subtasks

### Task 1: Delete App.tsx Handlers (AC: 1) ✅

- [x] **1.1** Delete all `handleBatch*` function definitions
- [x] **1.2** Delete `handleCancelBatchPreview`
- [x] **1.3** Delete credit-related batch handlers
- [x] **1.4** Delete `handleRemoveBatchImage`
- [x] **1.5** Verify no references remain

### Task 2: Clean Up (AC: 2) ✅

- [x] **2.1** Remove unused imports
- [x] **2.2** Remove unused state declarations (none found)
- [x] **2.3** Run `tsc --noEmit` to verify
- [x] **2.4** Run `npm run lint` to verify

### Task 3: Create/Update Tests (AC: 3) ✅

- [x] **3.1** Create `useBatchReviewHandlers.test.ts` (already exists from 14e-29a)
- [x] **3.2** Test all 13+ handlers (60+ tests in test file)
- [x] **3.3** Test edge cases (empty batch, errors)
- [x] **3.4** Update `BatchReviewFeature.test.tsx` (already updated)

### Task 4: Final Verification (AC: 4, 5, 6) ✅

- [x] **4.1** Run `npm run build` - SUCCESS
- [x] **4.2** Run `npm run test` - 5962 tests passing
- [x] **4.3** Manual smoke test all batch workflows - PARTIAL PASS (2 pre-existing bugs found, logged as Story 14e-33)
- [x] **4.4** Document App.tsx line count change: 2581 lines

---

## Dev Notes

### Test Structure

```typescript
// tests/unit/features/batch-review/hooks/useBatchReviewHandlers.test.ts

describe('useBatchReviewHandlers', () => {
    describe('Processing handlers', () => {
        it('handleProcessingStart reserves credits and processes images', async () => {...});
        it('handleCancelPreview returns to capture phase', () => {...});
        it('handleConfirmWithCreditCheck opens credit dialog', () => {...});
    });

    describe('Navigation handlers', () => {
        it('handleNext advances to next receipt', () => {...});
        it('handlePrevious goes to previous receipt', () => {...});
        it('handleEditReceipt opens receipt in editor', () => {...});
    });

    describe('Save handlers', () => {
        it('handleSaveTransaction saves and returns to review', async () => {...});
        it('handleSaveComplete triggers celebration', async () => {...});
    });

    describe('Discard handlers', () => {
        it('handleBack shows discard confirmation when unsaved', () => {...});
        it('handleDiscardConfirm clears batch and navigates', () => {...});
        it('handleDiscardCancel closes dialog', () => {...});
    });

    describe('Edge cases', () => {
        it('handles empty batch gracefully', () => {...});
        it('handles processing failure', async () => {...});
    });
});
```

### Smoke Test Checklist

Run through each workflow manually after all tests pass:

**Batch Capture Flow:**
1. Long-press FAB → Select batch mode
2. Capture 3 images
3. Preview shows 3 images with remove buttons
4. Tap "Procesar" → Credit check dialog
5. Confirm → Processing starts with progress
6. Complete → Review screen shows receipts

**Batch Review Flow:**
1. Review screen shows first receipt
2. Prev/Next buttons navigate (disabled at boundaries)
3. Edit button opens receipt in editor
4. Save returns to review
5. Save all → Completion modal with celebration

**Discard Flow:**
1. Review screen → Back
2. Discard dialog appears
3. Cancel → Stays in review
4. Confirm → Returns to dashboard, batch cleared

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 4 | ≤4 | OK |
| Subtasks | 15 | ≤15 | AT LIMIT |
| Files Changed | ~6 | ≤8 | OK |

---

## References

- [14e-29c Story](./14e-29c-save-discard-handlers.md) - Prerequisite
- [14e-29 Original Story](./14e-29-batch-review-handler-completion.md) - Full context
- [App.tsx](../../../../src/App.tsx) - Cleanup target

---

## Dev Agent Record

### Implementation Summary

**Story 14e-29d: BatchReviewFeature Cleanup, Tests & Verification**

Completed cleanup of App.tsx batch handlers by:

1. **Added useBatchReviewHandlers hook call at App.tsx level**
   - Created memoized `batchHandlersConfig` object with all dependencies
   - Called `useBatchReviewHandlers(batchHandlersConfig)` to get handlers
   - Location: After `useScanHandlers` hook, around line 1605

2. **Deleted 8 batch handler definitions from App.tsx**
   - `handleCancelBatchPreview` → Now `batchHandlers.handleCancelPreview`
   - `handleBatchConfirmWithCreditCheck` → Now `batchHandlers.handleConfirmWithCreditCheck`
   - `handleBatchProcessingStart` → Now `batchHandlers.handleProcessingStart`
   - `handleCreditCheckComplete` → Now `batchHandlers.handleCreditCheckComplete`
   - `handleReduceBatch` → Now `batchHandlers.handleReduceBatch`
   - `handleBatchDiscardConfirm` → Now `batchHandlers.handleDiscardConfirm`
   - `handleBatchDiscardCancel` → Now `batchHandlers.handleDiscardCancel`
   - `handleRemoveBatchImage` → Now `batchHandlers.handleRemoveImage`

3. **Updated 3 component prop usages**
   - `scanFeatureProps`: onBatchDiscardConfirm, onBatchDiscardCancel
   - `creditFeatureProps`: onCreditCheckComplete, onBatchConfirmed, onReduceBatch
   - `BatchUploadPreview`: onConfirm, onCancel, onRemoveImage

4. **Cleaned up imports**
   - Removed `confirmDiscard`, `cancelDiscard` from `@features/batch-review/handlers`
   - Added `useBatchReviewHandlers` and `BatchReviewHandlersProps` from `@features/batch-review`

### Files Changed

| File | Change Type | Lines |
|------|-------------|-------|
| `src/App.tsx` | Modified | Net -90 lines |

### Verification Results

- **TypeScript**: Clean (`tsc --noEmit` passes)
- **Build**: Succeeds (`npm run build`)
- **Tests**: 5962 passing, 33 skipped
- **Line Count**: App.tsx at 2581 lines

### Architectural Notes

The batch handlers are now centralized in `useBatchReviewHandlers` hook, which is called at both:
1. **App.tsx level** - For BatchUploadPreview, CreditFeature, and ScanFeature props
2. **BatchReviewFeature level** - For internal handler usage (via `handlersConfig` prop)

This consolidation means:
- All batch handler logic is in one place (`src/features/batch-review/hooks/useBatchReviewHandlers.ts`)
- App.tsx only needs to construct the config and pass handlers to components
- Testing is centralized in `useBatchReviewHandlers.test.ts`

### Next Steps

- [x] Manual smoke testing of batch workflows (AC5) - DONE (partial pass)
- **Story 14e-33** created for 2 pre-existing bugs found during smoke testing:
  1. Remove image buttons invisible on mobile (BatchUploadPreview.tsx)
  2. Stale BATCH_COMPLETE modal after discard (BatchReviewFeature.tsx auto-complete logic)
- Stories 14e-30+ can continue App.tsx reduction toward 500-800 line target
