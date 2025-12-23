# Story 12.2: Parallel Processing Service

**Epic:** Epic 12 - Batch Mode
**Status:** Done
**Story Points:** 5
**Dependencies:** Story 12.1 (Batch Capture UI)

---

## User Story

As a **user processing multiple receipts**,
I want **images to process in parallel**,
So that **batch processing is faster than scanning one-by-one**.

---

## Acceptance Criteria

- [x] **AC #1:** Multiple images process concurrently (max 3 parallel)
- [x] **AC #2:** Individual status shown per image: pending → processing → ready → error
- [x] **AC #3:** Total batch progress indicator shows overall completion
- [x] **AC #4:** Individual errors don't block other images from processing
- [x] **AC #5:** Processing can be cancelled (stops pending, completes in-progress)
- [x] **AC #6:** Retry available for failed individual images
- [x] **AC #7:** All results collected before moving to review queue
- [x] **AC #8:** Processing completes even if app loses focus

---

## Tasks / Subtasks

### Task 1: Create Parallel Processing Service (1.5h)
- [x] Create `src/services/batchProcessingService.ts`
- [x] Implement concurrent processing with limit:
  ```typescript
  interface BatchProcessingService {
    processImages(images: File[]): Promise<ProcessingResult[]>;
    cancel(): void;
    retry(imageId: string): void;
    onProgress: (callback: ProgressCallback) => void;
  }
  ```
- [x] Use Promise.allSettled for parallel execution
- [x] Limit concurrency to 3 simultaneous requests

### Task 2: Implement Status Tracking Per Image (1h)
- [x] Create status model:
  ```typescript
  type ImageStatus = 'pending' | 'uploading' | 'processing' | 'ready' | 'error';

  interface ImageProcessingState {
    id: string;
    status: ImageStatus;
    progress: number; // 0-100 for upload
    result?: ScanResult;
    error?: Error;
  }
  ```
- [x] Update status in real-time
- [x] Emit status changes via callback/observable

### Task 3: Create Batch Processing UI (1h)
- [x] Create `src/components/batch/BatchProcessingView.tsx`
- [x] Show each image with its status:
  ```
  ┌─────────────────────────────────────────┐
  │  Procesando 5 recibos...                │
  │                                         │
  │  ████████████░░░░░░░░  60% (3/5)        │
  │                                         │
  │  ┌───┐ ✓ Líder - $24.990               │
  │  │img│ Listo                           │
  │  └───┘                                  │
  │  ┌───┐ ✓ Jumbo - $18.450               │
  │  │img│ Listo                           │
  │  └───┘                                  │
  │  ┌───┐ 🔄 Procesando...                │
  │  │img│ ████████░░░░                    │
  │  └───┘                                  │
  │  ┌───┐ ⏳ En cola                      │
  │  │img│                                  │
  │  └───┘                                  │
  │  ┌───┐ ⏳ En cola                      │
  │  │img│                                  │
  │  └───┘                                  │
  │                                         │
  │         [Cancelar]                      │
  └─────────────────────────────────────────┘
  ```
- [x] Status icons: ✓ ready, 🔄 processing, ⏳ pending, ⚠️ error

### Task 4: Implement Concurrency Limiter (0.5h)
- [x] Create async queue with concurrency limit
- [x] FIFO order: first image starts first
- [x] Release slot when image completes/errors

### Task 5: Implement Error Handling (0.5h)
- [x] Individual errors marked but don't block others
- [x] Error message shown per image
- [x] "Reintentar" button per failed image
- [x] Batch continues even with errors

### Task 6: Implement Cancel Functionality (0.5h)
- [x] Cancel stops pending images
- [x] In-progress images complete (can't abort API call)
- [x] Confirm cancel if 1+ images already ready
- [x] Return to Batch Capture UI with remaining images

### Task 7: Implement Completion Handler (0.5h)
- [x] Collect all results (successful + failed)
- [x] Transition to Batch Review Queue (Story 12.3)
- [x] Pass results with original image association

### Task 8: Testing (0.5h)
- [x] Unit tests for parallel processing logic
- [x] Test concurrency limit (only 3 at a time)
- [x] Test error isolation (one error doesn't affect others)
- [x] Test cancel functionality
- [x] Test progress callbacks

---

## Technical Summary

The Parallel Processing Service enables efficient batch processing by running multiple AI extractions concurrently. A concurrency limit of 3 prevents overwhelming the API while still providing significant speedup over sequential processing.

**Processing Flow:**
```
Batch Capture UI → "Procesar lote" →
  Upload all images →
  Process in parallel (max 3) →
  Track individual statuses →
  Collect all results →
Batch Review Queue
```

**Time Improvement:**
- Sequential: 5 images × 5 seconds = 25 seconds
- Parallel (3): 5 images = ~10 seconds (2 batches of 3, 2)

---

## Project Structure Notes

- **Files to create:**
  - `src/services/batchProcessingService.ts`
  - `src/components/BatchProcessingView.tsx`
  - `src/hooks/useBatchProcessing.ts`

- **Files to modify:**
  - `src/views/ScanView.tsx` - Integrate batch processing flow

- **Estimated effort:** 5 story points (~8 hours)
- **Prerequisites:** Story 12.1 (Batch Capture UI)

---

## Key Code References

**Batch Processing Service:**
```typescript
// src/services/batchProcessingService.ts
export class BatchProcessingService {
  private readonly concurrencyLimit = 3;
  private abortController: AbortController | null = null;
  private statusCallbacks: ((states: ImageProcessingState[]) => void)[] = [];

  async processImages(images: CapturedImage[]): Promise<ProcessingResult[]> {
    this.abortController = new AbortController();

    const states: ImageProcessingState[] = images.map(img => ({
      id: img.id,
      status: 'pending',
      progress: 0
    }));

    this.emitStatus(states);

    // Create processing queue with concurrency limit
    const results = await this.processWithConcurrency(
      images,
      states,
      this.concurrencyLimit
    );

    return results;
  }

  private async processWithConcurrency(
    images: CapturedImage[],
    states: ImageProcessingState[],
    limit: number
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    const queue = [...images];

    const workers = Array(Math.min(limit, queue.length))
      .fill(null)
      .map(() => this.processWorker(queue, states, results));

    await Promise.all(workers);
    return results;
  }

  private async processWorker(
    queue: CapturedImage[],
    states: ImageProcessingState[],
    results: ProcessingResult[]
  ): Promise<void> {
    while (queue.length > 0) {
      if (this.abortController?.signal.aborted) break;

      const image = queue.shift()!;
      const state = states.find(s => s.id === image.id)!;

      try {
        state.status = 'uploading';
        this.emitStatus(states);

        const uploadResult = await this.uploadImage(image.file, (progress) => {
          state.progress = progress;
          this.emitStatus(states);
        });

        state.status = 'processing';
        this.emitStatus(states);

        const scanResult = await this.processReceipt(uploadResult);

        state.status = 'ready';
        state.result = scanResult;
        results.push({ id: image.id, success: true, result: scanResult });
      } catch (error) {
        state.status = 'error';
        state.error = error;
        results.push({ id: image.id, success: false, error });
      }

      this.emitStatus(states);
    }
  }

  cancel(): void {
    this.abortController?.abort();
  }

  onStatus(callback: (states: ImageProcessingState[]) => void): void {
    this.statusCallbacks.push(callback);
  }

  private emitStatus(states: ImageProcessingState[]): void {
    this.statusCallbacks.forEach(cb => cb([...states]));
  }
}
```

---

## UI Specifications

**Overall Progress Bar:**
- Full width, 8px height
- Shows: completed / total percentage
- Text: "60% (3/5)"

**Individual Image Status:**
- Thumbnail: 60x60px
- Status icon: 20px, colored by status
- Result preview: Merchant + Total when ready
- Mini progress bar for uploading state

**Status Colors:**
- Pending: Gray
- Uploading/Processing: Blue
- Ready: Green
- Error: Red

---

## Context References

**PRD:** [epics.md](../../planning/epics.md) - Epic 12 Parallel Processing

---

## Definition of Done

- [x] All 8 acceptance criteria verified
- [x] Parallel processing with 3 concurrency
- [x] Individual status tracking working
- [x] Errors isolated per image
- [x] Cancel works correctly
- [x] Retry available for failed images
- [x] Tests passing (55 tests)
- [x] Code review approved

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes
Successfully implemented the Parallel Processing Service with all acceptance criteria met:

1. **Concurrent Processing (AC #1):** Worker-based queue with configurable concurrency limit (default: 3)
2. **Individual Status Tracking (AC #2):** State machine with pending → uploading → processing → ready/error
3. **Progress Indication (AC #3):** Real-time callbacks for overall and per-image progress
4. **Error Isolation (AC #4):** Individual errors marked without blocking other images
5. **Cancel Support (AC #5):** AbortController-based cancellation that stops pending images
6. **Retry Capability (AC #6):** Per-image retry button with state update
7. **Results Collection (AC #7):** Complete results array with success/failure status
8. **Background Processing (AC #8):** Service continues processing regardless of focus state

Key implementation decisions:
- Used worker pattern for concurrency instead of Promise.allSettled to maintain FIFO order
- AbortController for cancellation (can't abort in-flight API calls, only pending items)
- Functional service module pattern per project conventions
- React hook wrapper for UI integration

### Files Created
- `src/services/batchProcessingService.ts` - Core parallel processing logic
- `src/hooks/useBatchProcessing.ts` - React hook for state management
- `src/components/batch/BatchProcessingView.tsx` - UI component for processing display
- `tests/unit/services/batchProcessingService.test.ts` - Service unit tests (22 tests)
- `tests/unit/hooks/useBatchProcessing.test.ts` - Hook unit tests (14 tests)
- `tests/unit/components/batch/BatchProcessingView.test.tsx` - Component tests (19 tests)

### Files Modified
- `src/components/batch/index.ts` - Added BatchProcessingView export
- `src/utils/translations.ts` - Added new translation keys for EN/ES

### Test Results
```
✓ tests/unit/services/batchProcessingService.test.ts (22 tests) 53ms
✓ tests/unit/hooks/useBatchProcessing.test.ts (14 tests) 39ms
✓ tests/unit/components/batch/BatchProcessingView.test.tsx (19 tests) 151ms

Total: 55 tests passing
```

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 12 definition |
| 2025-12-22 | 2.0 | Implementation complete with all ACs verified |
| 2025-12-22 | 2.1 | Code review approved - Atlas workflow chains updated |
