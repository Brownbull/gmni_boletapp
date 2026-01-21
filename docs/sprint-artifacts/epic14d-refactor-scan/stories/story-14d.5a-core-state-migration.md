# Story 14d.5a: Core Batch State Migration

**Epic:** 14d - Scan Architecture Refactor
**Points:** 5
**Priority:** HIGH
**Status:** In Progress
**Depends On:** Story 14d.4 (complete), Story 14d.5 analysis
**Parent Story:** 14d.5

## Description

Migrate the core batch state variables (`batchImages`, `isBatchCaptureMode`) from App.tsx to ScanContext as the source of truth. This is the first phase of the batch scan refactor, focusing on the foundational state that controls batch mode entry and image collection.

## Architectural Decision: Option A (Full Migration)

**Decision Date:** 2026-01-10

After analysis, **Option A (Full Migration)** was chosen over Option B (Incremental Migration):

### Why Option A?
1. **Single source of truth** - ScanContext owns images, no dual-sync complexity
2. **Cleaner architecture** - No bridge/sync layer to maintain
3. **Better for 14d.5b-e** - When we wire processing/results/persistence, everything is already in context
4. **Less technical debt** - No intermediary state to clean up later
5. **Matches single-scan pattern** - Single scan already uses `scanState.images` directly

### Key Implementation:
1. **Thumbnail logic extracted** to `src/utils/imageUtils.ts`
2. **BatchCaptureView uses ScanContext directly** for images (with props fallback for tests)
3. **Remove `batchImages`/`isBatchCaptureMode`** from App.tsx (64 usages to migrate)
4. **Remove batch sync** from `useScanStateBridge`

## Background

Currently, App.tsx manages batch mode with local useState:
```typescript
const [batchImages, setBatchImages] = useState<string[]>([]);
const [isBatchCaptureMode, setIsBatchCaptureMode] = useState(false);
```

These variables have ~64 usages across App.tsx. The bridge layer (useScanStateBridge) already syncs these to ScanContext, but App.tsx remains the source of truth.

## Technical Approach

### Phase 0: Extract Utilities (DONE)

Created `src/utils/imageUtils.ts` with:
- `generateThumbnail(file, maxSize)` - Canvas-based thumbnail generation
- `readFileAsDataUrl(file)` - FileReader wrapper
- `processFilesForCapture(files, maxCount)` - Batch processing helper
- `processFileForCapture(file)` - Single file processing

### Phase 1: Update BatchCaptureView (DONE)

BatchCaptureView now:
- Uses `useScanOptional()` to read from context when available
- Falls back to props for backwards compatibility (tests, migration period)
- Manages thumbnails locally (context stores only data URLs)
- Dispatches `setImages()` to context on add/remove
- Calls `context.reset()` on cancel

### Phase 2: Update App.tsx (REMAINING)

1. **Update App.tsx batch entry** to only dispatch `startBatchScan()` (remove `setIsBatchCaptureMode`)
2. **Update image capture handlers** to dispatch `addImage()` / `setImages()` to context
3. **Remove `batchImages`, `setBatchImages`** useState
4. **Remove `isBatchCaptureMode`, `setIsBatchCaptureMode`** useState
5. **Update all 64 usages** to read from context

### Phase 3: Clean Up Bridge (REMAINING)

Remove batch sync logic from `useScanStateBridge.ts` (lines 316-378).

### State Mapping

| Old (App.tsx) | New (ScanContext) |
|---------------|-------------------|
| `batchImages` | `state.images` |
| `setBatchImages(imgs)` | `setImages(imgs)` |
| `isBatchCaptureMode` | `state.mode === 'batch'` |
| `setIsBatchCaptureMode(true)` | `startBatchScan(userId)` |
| `setIsBatchCaptureMode(false)` | `reset()` or `cancel()` |

### Files Updated

```
src/
├── utils/
│   └── imageUtils.ts          # NEW: Thumbnail generation utilities
├── views/
│   └── BatchCaptureView.tsx   # UPDATED: Uses context directly
└── tests/unit/views/
    └── BatchCaptureView.test.tsx  # UPDATED: New test structure
```

### Files to Update (Remaining)

```
src/
├── App.tsx                    # Remove batchImages, isBatchCaptureMode state
└── hooks/
    └── useScanStateBridge.ts  # Remove batch image sync (context is source)
```

## Acceptance Criteria

### State Migration

- [x] **AC0:** Thumbnail logic extracted to utility function (imageUtils.ts)
- [ ] **AC1:** Remove `batchImages` useState from App.tsx
- [ ] **AC2:** Remove `isBatchCaptureMode` useState from App.tsx
- [x] **AC3:** BatchCaptureView reads images from `useScan().state.images`
- [x] **AC4:** All image add/remove operations dispatch to ScanContext

### Functionality Preserved

- [ ] **AC5:** Long press FAB enters batch mode (via `startBatchScan`)
- [ ] **AC6:** Camera capture adds images to context
- [ ] **AC7:** Gallery selection adds images to context
- [x] **AC8:** Remove image button works (via `removeImage`)
- [x] **AC9:** Max 10 images limit enforced
- [ ] **AC10:** Batch mode indicator shows in Nav

### Navigation

- [x] **AC11:** "Back" from batch capture clears batch state
- [ ] **AC12:** Navigating away from batch capture preserves images (until explicit cancel)

### Testing

- [x] **AC13:** Existing BatchCaptureView tests pass (update mocks as needed) - 20/20 passing
- [x] **AC14:** New tests verify context integration
- [ ] **AC15:** No regressions in single scan flow

## Test Cases

```typescript
describe('Core Batch State Migration', () => {
  describe('batch mode entry', () => {
    it('should start batch scan via context on long press');
    it('should set mode to batch in context');
    it('should navigate to batch-capture view');
  });

  describe('image capture', () => {
    it('should add camera image to context.state.images');
    it('should add gallery images to context.state.images');
    it('should enforce MAX_BATCH_IMAGES limit');
    it('should remove image by index from context');
  });

  describe('batch mode exit', () => {
    it('should reset context on cancel');
    it('should preserve images on navigation within batch flow');
  });
});
```

## Implementation Progress

### Completed

1. [x] Create `src/utils/imageUtils.ts` with thumbnail logic
2. [x] Update BatchCaptureView to use `useScanOptional()` for context
3. [x] BatchCaptureView dispatches to context when available
4. [x] BatchCaptureView falls back to props for backwards compatibility
5. [x] Update tests with new context mocks (20 tests passing)

### Remaining

6. [ ] Update App.tsx onBatchClick to only use `startBatchScan()`
7. [ ] Update image capture handlers to dispatch context actions
8. [ ] Remove batchImages, setBatchImages from App.tsx
9. [ ] Remove isBatchCaptureMode, setIsBatchCaptureMode from App.tsx
10. [ ] Update useScanStateBridge to remove batch image sync
11. [ ] Verify all 64 usages are migrated
12. [ ] Run full test suite

## Notes

- Keep useBatchProcessing hook for now (migrated in 14d.5b)
- Keep batchReviewResults for now (migrated in 14d.5c)
- Dialog states migrated in 14d.5d
- The ~64 App.tsx usages require careful migration to avoid regressions

---

*Story created by Atlas - Project Intelligence Guardian*
*Updated 2026-01-10: Option A decision, Phase 0-1 complete*
