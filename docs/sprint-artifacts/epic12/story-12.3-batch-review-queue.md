# Story 12.3: Batch Review Queue

**Epic:** Epic 12 - Batch Mode
**Status:** Done
**Story Points:** 5
**Dependencies:** Story 12.2 (Parallel Processing Service)
**Completed:** 2025-12-22

---

## User Story

As a **user with processed batch results**,
I want **to review all receipts before saving**,
So that **I can verify accuracy and make edits where needed**.

---

## Acceptance Criteria

- [x] **AC #1:** Summary cards displayed for all processed receipts
- [x] **AC #2:** Cards show: merchant, total, item count, confidence indicator
- [x] **AC #3:** Low confidence/error receipts flagged for attention
- [x] **AC #4:** Individual "Editar" option per receipt
- [x] **AC #5:** Total batch summary: "5 boletas - $123.450 total"
- [x] **AC #6:** "Guardar todo" button saves all receipts
- [x] **AC #7:** Individual receipt can be discarded from batch
- [x] **AC #8:** Scroll navigation for batches larger than screen

---

## Tasks / Subtasks

### Task 1: Create Batch Review View (1.5h) ✅
- [x] Create `src/views/BatchReviewView.tsx`
- [x] Design review layout with header, summary, and scrollable card list
- [x] Handle scroll for many receipts

### Task 2: Create Batch Summary Card Component (1h) ✅
- [x] Create `src/components/batch/BatchSummaryCard.tsx`
- [x] Display: emoji, merchant, total, item count
- [x] Confidence indicator:
  - ✓ High confidence (>85%): Green check "Ready"
  - ⚠️ Review needed (<85%): Amber warning "Review"
  - ✓ Edited: Blue badge "Edited"
  - ❌ Error: Red X with message
- [x] Actions: Edit, Discard, Retry (for errors)

### Task 3: Implement Individual Edit Flow (1h) ✅
- [x] "Editar" calls onEditReceipt with batch context
- [x] Batch context provided (e.g., "2 of 5")
- [x] updateReceipt function marks receipt as "edited"

### Task 4: Implement Discard Action (0.5h) ✅
- [x] "Descartar" removes receipt from batch
- [x] Confirm if high confidence receipt (≥85%)
- [x] Update batch total after removal
- [x] discardReceipt function in hook

### Task 5: Create Batch Summary Header (0.5h) ✅
- [x] Show: count + total amount
- [x] Format: "2 receipts • $40.000 total"
- [x] Update dynamically as receipts edited/discarded
- [x] Show review count badge if any need review

### Task 6: Implement Save All Action (0.5h) ✅
- [x] "Guardar todo" saves all valid receipts to Firestore
- [x] Show progress: "Guardando... (3/5)"
- [x] Handle partial failures gracefully
- [x] saveAll function returns { saved, failed }

### Task 7: Handle Failed Receipts (0.25h) ✅
- [x] Failed receipts show error message
- [x] "Reintentar" option per failed receipt (via onRetryReceipt)
- [x] Failed receipts excluded from "Guardar todo" count
- [x] Can discard failed receipts

### Task 8: Testing (0.5h) ✅
- [x] Unit tests for useBatchReview hook (20 tests)
- [x] Unit tests for BatchSummaryCard (27 tests)
- [x] Unit tests for BatchReviewView (23 tests)
- [x] Test discard and total update
- [x] Test with mixed success/error results

---

## Technical Summary

The Batch Review Queue presents all processed receipts for final review before saving. Users can verify accuracy, make individual edits, and save all at once.

**Review Flow:**
```
Parallel Processing → Batch Review Queue →
  Review cards (low confidence flagged) →
  Edit individual receipts as needed →
  Discard unwanted receipts →
  "Guardar todo" →
Batch Insight → Home
```

**Card States:**
- Ready (high confidence): Green check, no action needed
- Review needed (low confidence): Amber warning, suggest edit
- Edited: Blue badge, user made changes
- Error: Red, needs retry or discard

---

## Project Structure Notes

- **Files to create:**
  - `src/views/BatchReviewView.tsx` ✅
  - `src/components/batch/BatchSummaryCard.tsx` ✅ (in batch/ subfolder)
  - `src/hooks/useBatchReview.ts` ✅

- **Files to modify:**
  - `src/views/EditView.tsx` - Support batch context ✅
  - `src/App.tsx` - Navigation for batch review flow ✅
  - `src/utils/translations.ts` - Added batchSaveSuccess, "of" keys ✅

- **Estimated effort:** 5 story points (~8 hours)
- **Prerequisites:** Story 12.2 (Parallel Processing)

---

## Key Code References

**Batch Review State:**
```typescript
// src/hooks/useBatchReview.ts
interface BatchReviewState {
  receipts: BatchReceipt[];
  totalAmount: number;
  editReceipt: (id: string) => void;
  discardReceipt: (id: string) => void;
  saveAll: () => Promise<void>;
  isSaving: boolean;
  saveProgress: number;
}

interface BatchReceipt {
  id: string;
  imageUrl: string;
  scanResult: ScanResult;
  status: 'ready' | 'review' | 'edited' | 'error';
  error?: Error;
}

export function useBatchReview(results: ProcessingResult[]): BatchReviewState {
  const [receipts, setReceipts] = useState<BatchReceipt[]>(
    results.map(r => ({
      id: r.id,
      imageUrl: r.imageUrl,
      scanResult: r.result,
      status: r.result.confidence > 0.85 ? 'ready' : 'review'
    }))
  );

  const totalAmount = receipts
    .filter(r => r.status !== 'error')
    .reduce((sum, r) => sum + (r.scanResult?.total || 0), 0);

  const discardReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const saveAll = async () => {
    const validReceipts = receipts.filter(r => r.status !== 'error');
    // Save each receipt to Firestore
    // ... implementation
  };

  return { receipts, totalAmount, editReceipt, discardReceipt, saveAll, ... };
}
```

---

## UI Specifications

**Summary Header:**
- Font: 16px, semi-bold
- Format: "{count} boletas • {total} total"
- Position: Fixed at top of scroll area

**Summary Card:**
- Width: Full width - 32px margin
- Height: ~100px
- Background: White (light) / Gray 800 (dark)
- Border radius: 8px
- Shadow: sm

**Confidence Indicator:**
- High: ✓ Green (#22c55e)
- Review: ⚠️ Amber (#f59e0b)
- Error: ❌ Red (#ef4444)

**Save All Button:**
- Fixed at bottom
- Full width with 16px margin
- Height: 48px
- Background: Green 600

---

## Context References

**PRD:** [epics.md](../../planning/epics.md) - Epic 12 Batch Review Queue

---

## Definition of Done

- [x] All 8 acceptance criteria verified
- [x] Summary cards render correctly
- [x] Individual edit works
- [x] Discard removes from batch
- [x] Total updates dynamically
- [x] Save all completes successfully
- [x] Tests passing (70 tests for 12.3 components)
- [x] Code review approved

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes
**Integration Completed:** Story 12.3 components (BatchReviewView, BatchSummaryCard, useBatchReview) were previously created but NOT integrated into App.tsx. This code review discovered the integration gap and completed the wiring:

1. Added `useBatchProcessing` hook integration (Story 12.2) to replace sequential processing
2. Added `BatchReviewView` rendering with proper navigation flow
3. Added batch context support to EditView for "Editing 2 of 5" display
4. Added translation keys for batch save success and "of" context
5. Deprecated old `processBatchImages` function (kept for reference)

**New Flow:** Batch Capture → Credit Warning → Parallel Processing → Batch Review Queue → Save All → Dashboard

### Files Modified
- `src/App.tsx` - Integration of useBatchProcessing, BatchReviewView, batch handlers
- `src/views/EditView.tsx` - Added batchContext prop for batch editing indicator
- `src/utils/translations.ts` - Added batchSaveSuccess and "of" translation keys

### Test Results
- All 1943 unit tests passing
- Story 12.3 specific: 70 tests (useBatchReview: 20, BatchSummaryCard: 27, BatchReviewView: 23)

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 12 definition |
| 2025-12-22 | 1.1 | Code review: Integration gap discovered - components existed but not wired to App.tsx |
| 2025-12-22 | 2.0 | Integration completed: BatchReviewView + useBatchProcessing wired into App.tsx |
