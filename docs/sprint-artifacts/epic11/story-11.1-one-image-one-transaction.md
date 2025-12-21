# Story 11.1: One Image = One Transaction (Multi-Image Detection)

**Epic:** Epic 11 - Quick Save & Scan Flow Optimization
**Status:** Ready for Dev
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

- [ ] **AC #1:** When user selects 1 image → standard single transaction flow
- [ ] **AC #2:** When user selects 2+ images → show "X boletas detectadas" message
- [ ] **AC #3:** Each image is processed as a separate Gemini API call
- [ ] **AC #4:** Progress indicator shows "Procesando 1/X, 2/X..." during batch processing
- [ ] **AC #5:** After all images processed → automatically trigger Batch Mode Summary (Story 10.7)
- [ ] **AC #6:** If any image fails → continue with others, show partial success summary
- [ ] **AC #7:** Maximum 10 images per batch upload (UX limit)
- [ ] **AC #8:** All processed transactions appear in history immediately
- [ ] **AC #9:** Dark mode support for all new UI elements

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
- [ ] Create `BatchUploadPreview` component
- [ ] Show "X boletas detectadas" when images.length > 1
- [ ] Display thumbnail grid of selected images
- [ ] Implement "Ver imágenes" collapsible toggle
- [ ] Add "Cancelar" and "Procesar todas" buttons
- [ ] Enforce 10 image maximum with error message

### Task 2: Sequential Processing Logic (1.5h)
- [ ] Create `processBatchImages()` function in App.tsx
- [ ] Process each image with individual `analyzeReceipt()` call
- [ ] Track progress state: `{current: number, total: number, results: []}`
- [ ] Handle failures gracefully, continue with remaining images
- [ ] Collect all successful transactions

### Task 3: Processing Progress UI (1h)
- [ ] Create `BatchProcessingProgress` component
- [ ] Show progress bar with "X/Y" indicator
- [ ] Display real-time results list (success/processing/failed)
- [ ] Animate progress updates

### Task 4: Integration with Batch Mode Summary (0.5h)
- [ ] After all images processed, add all transactions to batch session
- [ ] Trigger `BatchSummary` display automatically
- [ ] Handle case where all images fail (no summary, show error)

### Task 5: Update Existing Flow (0.5h)
- [ ] Modify `handlePhotosSelected()` to detect multi-image
- [ ] Route to `BatchUploadPreview` when images.length > 1
- [ ] Keep single-image flow unchanged

### Task 6: Testing (1h)
- [ ] Unit tests for `BatchUploadPreview` component
- [ ] Unit tests for `BatchProcessingProgress` component
- [ ] Unit tests for `processBatchImages()` function
- [ ] Integration test: multi-image → batch summary flow
- [ ] Test partial failure scenarios
- [ ] Test 10 image limit enforcement

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

- [ ] All 9 acceptance criteria verified
- [ ] Multi-image detection shows "X boletas detectadas"
- [ ] Each image processed as separate transaction
- [ ] Progress UI shows real-time status
- [ ] Partial failures handled gracefully
- [ ] Batch Summary triggers after completion
- [ ] 10 image limit enforced
- [ ] All tests passing (unit + integration)
- [ ] Code review approved
- [ ] Dark mode verified

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
| 2025-12-16 | 1.0 | Story drafted from Epic 11 definition |
| 2025-12-19 | 2.0 | **Major revision:** Changed approach from "remove multi-image" to "multi-image = multi-transaction". Added detailed UX flow documentation, batch processing logic, and integration with Story 10.7 Batch Mode Summary. |
