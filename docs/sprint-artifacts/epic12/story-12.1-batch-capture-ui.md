# Story 12.1: Batch Capture UI

**Epic:** Epic 12 - Batch Mode
**Status:** Draft
**Story Points:** 5
**Dependencies:** Epic 11 completed (Quick Save Card pattern)

---

## User Story

As a **user who accumulates receipts**,
I want **to capture multiple receipt images in one session**,
So that **I can process a day's or week's worth of receipts efficiently**.

---

## Acceptance Criteria

- [ ] **AC #1:** "Modo Lote" entry point visible in scan view
- [ ] **AC #2:** Batch capture UI supports 1-10 images per batch
- [ ] **AC #3:** Thumbnail preview strip shows captured images
- [ ] **AC #4:** "Capturar otra" button allows adding more images
- [ ] **AC #5:** "Procesar lote" button initiates batch processing
- [ ] **AC #6:** User can remove individual images before processing
- [ ] **AC #7:** Image count indicator shows "X de 10" limit
- [ ] **AC #8:** Cancel batch returns to normal scan mode
- [ ] **AC #9:** Gallery upload supports multi-select for batch

---

## Tasks / Subtasks

### Task 1: Create Batch Mode Entry Point (0.5h)
- [ ] Add "Modo Lote" button/toggle in ScanView
- [ ] Design toggle or tab UI:
  ```
  ┌─────────────────────────────────────────┐
  │  [Individual]  [Modo Lote]              │
  └─────────────────────────────────────────┘
  ```
- [ ] State: `isBatchMode: boolean`

### Task 2: Create Batch Capture State Management (1h)
- [ ] Create `useBatchCapture` hook:
  ```typescript
  interface BatchState {
    images: CapturedImage[];
    maxImages: number;
    addImage: (image: File) => void;
    removeImage: (index: number) => void;
    clearBatch: () => void;
    canAddMore: boolean;
  }
  ```
- [ ] Enforce 10 image maximum
- [ ] Store images in memory (not uploaded until processing)

### Task 3: Create Thumbnail Preview Strip (1.5h)
- [ ] Create `src/components/BatchThumbnailStrip.tsx`
- [ ] Design horizontal scrollable strip:
  ```
  ┌─────────────────────────────────────────┐
  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌─────────┐  │
  │  │ X │ │ X │ │ X │ │ X │ │    +    │  │
  │  │img│ │img│ │img│ │img│ │ Agregar │  │
  │  └───┘ └───┘ └───┘ └───┘ └─────────┘  │
  │                                         │
  │        3 de 10 imágenes                │
  └─────────────────────────────────────────┘
  ```
- [ ] Thumbnail size: 80x80px
- [ ] X button on each thumbnail for removal
- [ ] Placeholder "+ Agregar" button at end

### Task 4: Implement Multi-Image Capture Flow (1h)
- [ ] Camera capture adds to batch (not replaces)
- [ ] After capture: show "Capturar otra" + "Procesar lote"
- [ ] Gallery picker allows multi-select
- [ ] Validate images before adding (size, format)

### Task 5: Implement Remove Image (0.25h)
- [ ] Tap X on thumbnail removes from batch
- [ ] Update count indicator
- [ ] Smooth removal animation

### Task 6: Implement Process Batch Action (0.5h)
- [ ] "Procesar lote" button becomes active with 1+ images
- [ ] Triggers Story 12.2 (Parallel Processing)
- [ ] Disables capture UI during processing
- [ ] Shows processing indicator

### Task 7: Implement Cancel Batch (0.25h)
- [ ] "Cancelar" discards all captured images
- [ ] Confirm if 2+ images captured
- [ ] Returns to normal scan mode

### Task 8: Testing (0.5h)
- [ ] Unit tests for batch state management
- [ ] Unit tests for thumbnail strip
- [ ] Test 10 image limit enforcement
- [ ] Test removal and count update
- [ ] Test cancel confirmation

---

## Technical Summary

The Batch Capture UI is the entry point for users who accumulate receipts. It provides a visual staging area where users can capture multiple images before initiating parallel processing.

**User Flow:**
```
Enter Batch Mode → Capture/Upload → See thumbnail → Capture more →
... repeat until done ...
→ "Procesar lote" → Parallel Processing (Story 12.2)
```

**Technical Constraints:**
- Max 10 images per batch (credit consideration)
- Images stored in memory until processing initiated
- Preview thumbnails generated client-side

---

## Project Structure Notes

- **Files to create:**
  - `src/components/BatchThumbnailStrip.tsx`
  - `src/hooks/useBatchCapture.ts`

- **Files to modify:**
  - `src/views/ScanView.tsx` - Add batch mode toggle and UI
  - `src/utils/translations.ts` - Add batch strings

- **Estimated effort:** 5 story points (~8 hours)
- **Prerequisites:** Epic 11 (Quick Save patterns)

---

## Key Code References

**Batch Capture Hook:**
```typescript
// src/hooks/useBatchCapture.ts
interface CapturedImage {
  id: string;
  file: File;
  thumbnailUrl: string;
  addedAt: Date;
}

export function useBatchCapture(maxImages = 10) {
  const [images, setImages] = useState<CapturedImage[]>([]);

  const addImage = async (file: File) => {
    if (images.length >= maxImages) return;

    const thumbnailUrl = await generateThumbnail(file);
    setImages(prev => [...prev, {
      id: crypto.randomUUID(),
      file,
      thumbnailUrl,
      addedAt: new Date()
    }]);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearBatch = () => {
    // Revoke thumbnail URLs to free memory
    images.forEach(img => URL.revokeObjectURL(img.thumbnailUrl));
    setImages([]);
  };

  return {
    images,
    addImage,
    removeImage,
    clearBatch,
    canAddMore: images.length < maxImages,
    count: images.length,
    maxImages
  };
}
```

---

## UI Specifications

**Batch Mode Toggle:**
- Segmented control or tab bar
- Clear visual distinction between modes

**Thumbnail Strip:**
- Horizontal scroll
- Thumbnail: 80x80px, 4px border radius
- X button: 20px, positioned top-right of thumbnail
- "+ Agregar" button: Same size as thumbnails, dashed border

**Count Indicator:**
- Format: "X de 10 imágenes"
- Below thumbnail strip
- Color: Gray when under limit, amber when near limit

---

## Context References

**PRD:** [epics.md](../../planning/epics.md) - Epic 12 Batch Mode

---

## Definition of Done

- [ ] All 9 acceptance criteria verified
- [ ] Batch mode toggle working
- [ ] Thumbnail strip displays correctly
- [ ] Multi-image capture functional
- [ ] Remove image works
- [ ] 10 image limit enforced
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
