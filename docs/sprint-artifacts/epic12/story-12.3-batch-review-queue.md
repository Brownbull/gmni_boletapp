# Story 12.3: Batch Review Queue

**Epic:** Epic 12 - Batch Mode
**Status:** Draft
**Story Points:** 5
**Dependencies:** Story 12.2 (Parallel Processing Service)

---

## User Story

As a **user with processed batch results**,
I want **to review all receipts before saving**,
So that **I can verify accuracy and make edits where needed**.

---

## Acceptance Criteria

- [ ] **AC #1:** Summary cards displayed for all processed receipts
- [ ] **AC #2:** Cards show: merchant, total, item count, confidence indicator
- [ ] **AC #3:** Low confidence/error receipts flagged for attention
- [ ] **AC #4:** Individual "Editar" option per receipt
- [ ] **AC #5:** Total batch summary: "5 boletas - $123.450 total"
- [ ] **AC #6:** "Guardar todo" button saves all receipts
- [ ] **AC #7:** Individual receipt can be discarded from batch
- [ ] **AC #8:** Scroll navigation for batches larger than screen

---

## Tasks / Subtasks

### Task 1: Create Batch Review View (1.5h)
- [ ] Create `src/views/BatchReviewView.tsx`
- [ ] Design review layout:
  ```
  ┌─────────────────────────────────────────┐
  │  ← Revisar Lote                         │
  │                                         │
  │  5 boletas • $123.450 total             │
  │                                         │
  │  ┌─────────────────────────────────┐    │
  │  │ 🛒 Líder              $24.990   │    │
  │  │    12 items        ✓ Alta conf. │    │
  │  │              [Editar] [Descartar]│    │
  │  └─────────────────────────────────┘    │
  │                                         │
  │  ┌─────────────────────────────────┐    │
  │  │ 🍽️ Restaurant X        $8.450   │    │
  │  │    3 items         ⚠️ Revisar   │    │
  │  │              [Editar] [Descartar]│    │
  │  └─────────────────────────────────┘    │
  │                                         │
  │  ... more cards (scroll) ...            │
  │                                         │
  │  ┌─────────────────────────────────┐    │
  │  │       ✓ Guardar todo (5)        │    │
  │  └─────────────────────────────────┘    │
  └─────────────────────────────────────────┘
  ```
- [ ] Handle scroll for many receipts

### Task 2: Create Batch Summary Card Component (1h)
- [ ] Create `src/components/BatchSummaryCard.tsx`
- [ ] Display: emoji, merchant, total, item count
- [ ] Confidence indicator:
  - ✓ High confidence (>85%): Green check
  - ⚠️ Review needed (<85%): Amber warning
  - ❌ Error: Red X with message
- [ ] Actions: Edit, Discard

### Task 3: Implement Individual Edit Flow (1h)
- [ ] "Editar" opens Edit View for that receipt
- [ ] Edit View shows batch context (e.g., "2 of 5")
- [ ] On save, return to Batch Review
- [ ] Update card to show "Editado" badge

### Task 4: Implement Discard Action (0.5h)
- [ ] "Descartar" removes receipt from batch
- [ ] Confirm if high confidence receipt
- [ ] Update batch total after removal
- [ ] Animate card removal

### Task 5: Create Batch Summary Header (0.5h)
- [ ] Show: count + total amount
- [ ] Format: "5 boletas • $123.450 total"
- [ ] Update dynamically as receipts edited/discarded

### Task 6: Implement Save All Action (0.5h)
- [ ] "Guardar todo" saves all receipts to Firestore
- [ ] Show progress: "Guardando... (3/5)"
- [ ] Handle partial failures gracefully
- [ ] After success: show batch insight (Story 12.5)

### Task 7: Handle Failed Receipts (0.25h)
- [ ] Failed receipts show error message
- [ ] "Reintentar" option per failed receipt
- [ ] Failed receipts excluded from "Guardar todo" count
- [ ] Can discard failed receipts

### Task 8: Testing (0.5h)
- [ ] Unit tests for BatchSummaryCard
- [ ] Unit tests for edit flow navigation
- [ ] Integration test for save all
- [ ] Test discard and total update
- [ ] Test with mixed success/error results

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
  - `src/views/BatchReviewView.tsx`
  - `src/components/BatchSummaryCard.tsx`
  - `src/hooks/useBatchReview.ts`

- **Files to modify:**
  - `src/views/EditView.tsx` - Support batch context
  - `src/App.tsx` - Navigation for batch review flow

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

- [ ] All 8 acceptance criteria verified
- [ ] Summary cards render correctly
- [ ] Individual edit works
- [ ] Discard removes from batch
- [ ] Total updates dynamically
- [ ] Save all completes successfully
- [ ] Tests passing
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 12 definition |
