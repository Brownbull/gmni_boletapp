# Story 11.1: One Image = One Transaction (Multi-Image Detection)

**Epic:** Epic 11 - Quick Save & Scan Flow Optimization
**Status:** Done
**Story Points:** 5
**Dependencies:** None (Foundation story)
**Parallel With:** Story 11.5 (Scan Status Clarity)
**Tech Context:** [tech-context-epic11.md](./tech-context-epic11.md)

---

## User Story

As a **user**,
I want **each image I upload to create exactly one transaction**,
So that **I can scan multiple receipts at once and have them processed individually**.

---

## Background

Currently, when a user uploads multiple images, they are all sent to Gemini as a single transaction request. This is problematic because:
1. Multiple receipt images get merged into one transaction
2. The user has no clarity on how many transactions will be created
3. It creates confusion about what "batch scanning" means

The desired behavior is:
- **1 image = 1 transaction** (strict mapping)
- **Multi-image upload = multi-transaction batch** (each image processed separately)
- **Clear UI indication** showing exactly how many transactions will be created

---

## Acceptance Criteria

- [x] **AC #1:** When user selects 1 image → standard single transaction flow
- [x] **AC #2:** When user selects 2+ images → show "X boletas detectadas" message
- [x] **AC #3:** Each image is processed as a separate Gemini API call
- [x] **AC #4:** Progress indicator shows "Procesando 1/X, 2/X..." during batch processing
- [x] **AC #5:** After all images processed → automatically trigger Batch Mode Summary (Story 10.7)
- [x] **AC #6:** If any image fails → continue with others, show partial success summary
- [x] **AC #7:** Maximum 10 images per batch upload (UX limit)
- [x] **AC #8:** All processed transactions appear in history immediately
- [x] **AC #9:** Dark mode support for all new UI elements

### Expanded Scope (2025-12-21)
- [x] **AC #10:** After batch summary dismissed → redirect to Home screen (not stay on Nueva page)
- [x] **AC #11:** Cancel button shown during batch processing with confirmation dialog
- [x] **AC #12:** Cancelling batch saves completed transactions, skips remaining
- [x] **AC #13:** Home screen sort options: Transaction date vs Scan date (createdAt)
- [x] **AC #14:** Home screen filter: Show only possible duplicates toggle

---

## UX Flow Documentation

### Scenario 1: Single Image Upload (Unchanged)
```
User taps "Escanear" → Selects 1 image → Standard processing → Edit View → Save
```

### Scenario 2: Multi-Image Upload (NEW)
```
User taps "Escanear"
    ↓
Selects 3 images from gallery
    ↓
┌─────────────────────────────────────┐
│  📷 3 boletas detectadas            │
│                                     │
│  Cada imagen será una transacción   │
│  separada.                          │
│                                     │
│  [Ver imágenes ▼]                   │
│                                     │
│  ┌───┐ ┌───┐ ┌───┐                 │
│  │ 1 │ │ 2 │ │ 3 │  (thumbnails)   │
│  └───┘ └───┘ └───┘                 │
│                                     │
│  [Cancelar]  [Procesar todas]       │
└─────────────────────────────────────┘
    ↓
User taps "Procesar todas"
    ↓
┌─────────────────────────────────────┐
│  Procesando boletas...              │
│                                     │
│  ████████░░░░░░  2/3                │
│                                     │
│  ✓ Supermercado Jumbo - $25.000     │
│  ✓ Farmacia Cruz Verde - $8.500    │
│  ⏳ Procesando...                    │
└─────────────────────────────────────┘
    ↓
All complete
    ↓
BatchSummary appears (from Story 10.7)
┌─────────────────────────────────────┐
│  Resumen de escaneo                 │
│                                     │
│  Total escaneado  │  Boletas        │
│  $33.500          │  🧾 3           │
│                                     │
│  ↓ 15% menos que la semana pasada   │
│                                     │
│  [Top insight displayed here]       │
│                                     │
│  🔔 Silenciar insights (4h)         │
└─────────────────────────────────────┘
```

### Scenario 3: Partial Failure
```
User selects 4 images → Processing starts
    ↓
Image 3 fails (blurry/unreadable)
    ↓
┌─────────────────────────────────────┐
│  Procesando boletas...              │
│                                     │
│  ████████████████  4/4              │
│                                     │
│  ✓ Supermercado Jumbo - $25.000     │
│  ✓ Farmacia Cruz Verde - $8.500    │
│  ✗ No se pudo leer la imagen        │
│  ✓ Café Starbucks - $4.200          │
└─────────────────────────────────────┘
    ↓
Summary shows 3 successful transactions
Warning: "1 imagen no pudo ser procesada"
```

### UI Copy (Spanish)
| Element | Text |
|---------|------|
| Multi-image detected | "X boletas detectadas" |
| Explanation | "Cada imagen será una transacción separada." |
| View images toggle | "Ver imágenes" / "Ocultar imágenes" |
| Cancel button | "Cancelar" |
| Process button | "Procesar todas" |
| Progress title | "Procesando boletas..." |
| Success item | "✓ {merchant} - {amount}" |
| Processing item | "⏳ Procesando..." |
| Failed item | "✗ No se pudo leer la imagen" |
| Partial warning | "X imagen(es) no pudo(ieron) ser procesada(s)" |
| Max limit error | "Máximo 10 imágenes por vez" |

---

## Tasks / Subtasks

### Task 1: Multi-Image Detection Component (1.5h)
- [x] Create `BatchUploadPreview` component
- [x] Show "X boletas detectadas" when images.length > 1
- [x] Display thumbnail grid of selected images
- [x] Implement "Ver imágenes" collapsible toggle
- [x] Add "Cancelar" and "Procesar todas" buttons
- [x] Enforce 10 image maximum with error message

### Task 2: Sequential Processing Logic (1.5h)
- [x] Create `processBatchImages()` function in App.tsx
- [x] Process each image with individual `analyzeReceipt()` call
- [x] Track progress state: `{current: number, total: number, results: []}`
- [x] Handle failures gracefully, continue with remaining images
- [x] Collect all successful transactions

### Task 3: Processing Progress UI (1h)
- [x] Create `BatchProcessingProgress` component
- [x] Show progress bar with "X/Y" indicator
- [x] Display real-time results list (success/processing/failed)
- [x] Animate progress updates

### Task 4: Integration with Batch Mode Summary (0.5h)
- [x] After all images processed, add all transactions to batch session
- [x] Trigger `BatchSummary` display automatically
- [x] Handle case where all images fail (no summary, show error)

### Task 5: Update Existing Flow (0.5h)
- [x] Modify `handlePhotosSelected()` to detect multi-image
- [x] Route to `BatchUploadPreview` when images.length > 1
- [x] Keep single-image flow unchanged

### Task 6: Testing (1h)
- [x] Unit tests for `BatchUploadPreview` component
- [x] Unit tests for `BatchProcessingProgress` component
- [x] Unit tests for `processBatchImages()` function (via integration test simulation)
- [x] Integration test: multi-image → batch summary flow ✓ Added 2025-12-21
- [x] Test partial failure scenarios
- [x] Test 10 image limit enforcement

### Review Follow-ups (AI-Review)
- [x] [AI-Review][HIGH] Add integration test for processBatchImages flow ✓ Added 2025-12-21 (19 tests in batch-processing.test.tsx)
- [x] [AI-Review][HIGH] Fix credit deduction timing - moved after successful transaction save [App.tsx:622-626] ✓ Fixed 2025-12-21
- [x] [AI-Review][MEDIUM] Extract 500ms delay to BATCH_COMPLETE_DELAY_MS constant [App.tsx:668] ✓ Fixed 2025-12-21

---

## Technical Summary

### New Components
```
src/components/scan/
├── BatchUploadPreview.tsx    # Multi-image confirmation UI
└── BatchProcessingProgress.tsx  # Real-time processing progress
```

### Modified Files
- `src/App.tsx` - Add multi-image detection and routing
- `src/views/EditView.tsx` - Integrate batch components
- `src/hooks/useBatchSession.ts` - Support bulk transaction addition

### State Flow
```typescript
// In App.tsx
interface BatchProcessingState {
  isProcessing: boolean;
  current: number;
  total: number;
  results: Array<{
    index: number;
    status: 'success' | 'processing' | 'failed';
    transaction?: Transaction;
    error?: string;
  }>;
}
```

### Key Code Changes

**Detection Logic:**
```typescript
const handlePhotosSelected = async (files: File[]) => {
  const images = await convertToBase64(files);

  if (images.length > 10) {
    showToast('Máximo 10 imágenes por vez', 'error');
    return;
  }

  if (images.length > 1) {
    // Show BatchUploadPreview
    setShowBatchPreview(true);
    setBatchImages(images);
  } else {
    // Standard single-image flow
    setScanImages(images);
  }
};
```

**Sequential Processing:**
```typescript
const processBatchImages = async (images: string[]) => {
  const results = [];

  for (let i = 0; i < images.length; i++) {
    setBatchProgress({ current: i + 1, total: images.length });

    try {
      const transaction = await analyzeReceipt([images[i]], currency);
      await saveTransaction(transaction);
      results.push({ status: 'success', transaction });
      addToBatch(transaction, []); // Add to batch session
    } catch (error) {
      results.push({ status: 'failed', error: error.message });
    }
  }

  // Show batch summary if any succeeded
  if (results.some(r => r.status === 'success')) {
    setShowBatchSummary(true);
  }
};
```

---

## Project Structure Notes

- **Files to create:**
  - `src/components/scan/BatchUploadPreview.tsx`
  - `src/components/scan/BatchProcessingProgress.tsx`
  - `tests/unit/components/scan/BatchUploadPreview.test.tsx`
  - `tests/unit/components/scan/BatchProcessingProgress.test.tsx`

- **Files to modify:**
  - `src/App.tsx` - Add batch processing logic
  - `src/views/EditView.tsx` - Integrate batch components

- **Estimated effort:** 5 story points (~6-7 hours)
- **Prerequisites:** Story 10.7 (Batch Mode Summary) - COMPLETED ✓

---

## Context References

**PRD:** [epics.md](../../planning/epics.md) - Epic 11 scope
**UX Research:** [habits loops.md](../../uxui/research/habits%20loops.md) - Quick Save flow
**Story 10.7:** [Batch Mode Summary](../epic10/story-10.7-batch-mode-summary.md) - Batch summary UI

---

## Definition of Done

- [x] All 14 acceptance criteria verified (original 9 + 5 expanded scope)
- [x] Multi-image detection shows "X boletas detectadas"
- [x] Each image processed as separate transaction
- [x] Progress UI shows real-time status with Cancel button
- [x] Partial failures handled gracefully
- [x] Batch Summary triggers after completion
- [x] Redirect to Home after batch summary dismissed
- [x] 10 image limit enforced
- [x] Cancel batch with confirmation dialog
- [x] Home screen sort by transaction date / scan date
- [x] Home screen filter by possible duplicates
- [x] All tests passing (unit + integration) - *1,876 tests passing*
- [x] Code review approved - *All 3 action items resolved 2025-12-21*
- [x] Dark mode verified

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes
Implementation complete for all 14 acceptance criteria (9 original + 5 expanded scope). Code review identified and resolved 3 action items:
1. ✅ Added integration test for processBatchImages flow (19 tests)
2. ✅ Fixed credit deduction timing - now deducts after successful save
3. ✅ Extracted 500ms to BATCH_COMPLETE_DELAY_MS constant

Expanded scope (based on user testing feedback):
4. ✅ Redirect to Home after batch summary dismissed
5. ✅ Cancel button with confirmation dialog during batch processing
6. ✅ Home screen sort options (transaction date vs scan date)
7. ✅ Home screen duplicates-only filter toggle

### Files Modified
**Created:**
- `src/components/scan/BatchUploadPreview.tsx` - Multi-image confirmation UI (200 lines)
- `src/components/scan/BatchProcessingProgress.tsx` - Real-time processing progress with Cancel button
- `src/components/scan/index.ts` - Barrel exports for scan components
- `tests/unit/components/scan/BatchUploadPreview.test.tsx` - 204 lines, 16 tests
- `tests/unit/components/scan/BatchProcessingProgress.test.tsx` - 178 lines, 14 tests
- `tests/integration/batch-processing.test.tsx` - 19 integration tests for full flow

**Modified:**
- `src/App.tsx` - Batch processing logic, cancel handling, redirect to Home after batch
- `src/views/DashboardView.tsx` - Sort options (transaction date/scan date), duplicates filter
- `src/utils/translations.ts` - 22 new translation keys for batch UI and home enhancements
- `src/components/scan/BatchProcessingProgress.tsx` - Added onCancel prop for cancel button

### Test Results
```
Test Files: 74 passed (74)
Tests: 1,876 passed (1,876)
Duration: 49.76s
```

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 11 definition |
| 2025-12-19 | 2.0 | **Major revision:** Changed approach from "remove multi-image" to "multi-image = multi-transaction". Added detailed UX flow documentation, batch processing logic, and integration with Story 10.7 Batch Mode Summary. |
| 2025-12-21 | 2.1 | Implementation complete, moved to Review status. Atlas-enhanced code review identified 3 action items. |
| 2025-12-21 | 2.2 | All review items resolved: added integration tests (19), fixed credit timing, extracted constant. Ready for done. |
| 2025-12-21 | 3.0 | **Expanded scope:** Based on user testing feedback, added 5 new ACs: redirect to Home after batch, cancel button with confirmation, sort by scan date, and duplicates filter on Home screen. |
