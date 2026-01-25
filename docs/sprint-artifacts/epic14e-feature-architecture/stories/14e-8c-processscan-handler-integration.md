# Story 14e.8c: processScan Main Handler & App.tsx Integration

Status: ready-for-dev

## Story

As a **developer**,
I want **the main processScan handler assembled and integrated into App.tsx**,
So that **the ~302-line function is removed from App.tsx and lives in the feature module**.

## Context

This is **Part 3 of 3** from the split of Story 14e.8 (Extract processScan Handler).

**Split Rationale:** Original story had 5 tasks / 28 subtasks - exceeding context window capacity guidelines (max 4 tasks / 15 subtasks). Split by phase to enable layer-by-layer extraction.

**Story Chain:**
- **14e-8a**: Pre-Audit + Pure Utilities (completed)
- **14e-8b**: Sub-Handlers extraction (completed)
- **14e-8c** (this): Main Handler + Integration ← YOU ARE HERE

**Depends on:** 14e-8a (utilities), 14e-8b (sub-handlers, types)

## Acceptance Criteria

1. **AC1: Main Handler Created**
   - `processScan.ts` created with main orchestration function
   - Uses utilities from 14e-8a
   - Uses sub-handlers from 14e-8b
   - Accepts `ProcessScanParams` interface
   - JSDoc documentation complete

2. **AC2: Feature Exports Set Up**
   - Handler exported from `src/features/scan/handlers/index.ts`
   - Handler exported from `src/features/scan/index.ts`
   - Can import via `@features/scan`

3. **AC3: App.tsx Integration**
   - Original processScan (~302 lines) removed from App.tsx
   - Thin wrapper function calls extracted handler
   - All dependencies passed correctly
   - Import uses `@features/scan` path alias

4. **AC4: Full Test Coverage**
   - Integration tests verify handler works with real hooks
   - All ~74 existing scan tests pass
   - Handler unit tests with mocked dependencies
   - Coverage maintained or improved

5. **AC5: No Regressions (Smoke Tests)**
   - Single scan flow: capture -> process -> review -> save
   - Quick save flow: high confidence -> QuickSaveCard
   - Trusted merchant flow: auto-save
   - Currency mismatch dialog triggers correctly
   - Total mismatch dialog triggers correctly
   - Error path refunds credits correctly

## Tasks / Subtasks

### Task 3: Create Main processScan Handler (AC: 1, 2)

- [ ] **3.1** Create `src/features/scan/handlers/processScan/processScan.ts`
- [ ] **3.2** Implement `processScan(params: ProcessScanParams)` function
  - Orchestrates: validate -> mappings -> currency -> success routing
  - Uses utilities from utils.ts
  - Uses sub-handlers from subhandlers.ts
  - Handles error paths and credit refunds
- [ ] **3.3** Add comprehensive JSDoc documentation
- [ ] **3.4** Update barrel export in `processScan/index.ts`
- [ ] **3.5** Export from `src/features/scan/handlers/index.ts`
- [ ] **3.6** Export from `src/features/scan/index.ts`

### Task 4: App.tsx Integration & Verification (AC: 3, 4, 5)

- [ ] **4.1** Import handler in App.tsx: `import { processScan } from '@features/scan'`
- [ ] **4.2** Create wrapper function that:
  - Collects all dependencies from App.tsx state/hooks
  - Groups into ProcessScanParams structure
  - Calls extracted handler
- [ ] **4.3** Delete original processScan function from App.tsx (~302 lines)
- [ ] **4.4** Run all tests - verify all pass
- [ ] **4.5** Execute smoke test checklist from 14e-8a audit
- [ ] **4.6** Update any imports in other files if needed

## Dev Notes

### Main Handler Structure (Expected)

```typescript
// processScan.ts

import { ProcessScanParams } from './types';
import { getSafeDate, parseLocationResult, buildInitialTransaction } from './utils';
import {
  validateScanResult,
  applyAllMappings,
  handleCurrencyDetection,
  handleScanSuccess
} from './subhandlers';

/**
 * Process scanned receipt image(s) through OCR and validation pipeline.
 *
 * @param params - All dependencies grouped by category
 * @param params.scan - Scan state (images, currency, storeType)
 * @param params.user - User context (credits, preferences, transactions)
 * @param params.mapping - Mapping functions and data
 * @param params.ui - UI callbacks (setters, dialogs, dispatchers)
 * @param params.imagesToProcess - Optional override for images to process
 */
export async function processScan(params: ProcessScanParams): Promise<void> {
  const { scan, user, mapping, ui, imagesToProcess } = params;

  // 1. Setup and validation
  ui.dispatchProcessStart();
  const images = imagesToProcess ?? scan.images;

  try {
    // 2. Deduct credits
    // 3. Call Gemini OCR
    // 4. Build initial transaction
    // 5. Validate result (may show dialog)
    // 6. Apply mappings
    // 7. Handle currency detection (may show dialog)
    // 8. Route to success handler
  } catch (error) {
    // Handle error, refund credits
    ui.dispatchProcessError(error.message);
  }
}
```

### App.tsx Wrapper Pattern

```typescript
// In App.tsx

import { processScan as processScanHandler } from '@features/scan';

// Wrapper that collects dependencies
const handleProcessScan = useCallback(async (imagesToProcess?: ScanImage[]) => {
  await processScanHandler({
    scan: {
      images: scanImages,
      currency: scanCurrency,
      storeType: scanStoreType,
      defaultCountry,
      defaultCity,
    },
    user: {
      user,
      userCredits,
      userPreferences,
      transactions,
    },
    mapping: {
      mappings,
      applyCategoryMappings,
      findMerchantMatch,
      applyItemNameMappings,
      incrementMappingUsage,
      incrementMerchantMappingUsage,
      incrementItemNameMappingUsage,
    },
    ui: {
      setScanError,
      setCurrentTransaction,
      setView,
      showScanDialog,
      dispatchProcessStart,
      dispatchProcessSuccess,
      dispatchProcessError,
      // ... other setters
    },
    imagesToProcess,
  });
}, [/* dependencies */]);
```

### Smoke Test Checklist (From 14e-8a)

Run these manual tests after integration:

1. **Single Scan Flow**
   - [ ] Capture receipt photo
   - [ ] Verify processing animation
   - [ ] Verify EditView shows with transaction
   - [ ] Save transaction
   - [ ] Verify credit deduction

2. **Quick Save Flow**
   - [ ] Scan high-confidence receipt
   - [ ] Verify QuickSaveCard appears
   - [ ] Accept quick save
   - [ ] Verify transaction saved

3. **Trusted Merchant Flow**
   - [ ] Scan receipt from trusted merchant
   - [ ] Verify auto-save occurs
   - [ ] Verify insight generated

4. **Error Paths**
   - [ ] Test invalid image (verify error toast)
   - [ ] Test network error (verify credit refund)

### Workflow Chains Affected

From Atlas analysis - verify these still work:
- **#1 Scan Receipt Flow** - CRITICAL
- **#2 Quick Save Flow** - HIGH
- **#8 Trust Merchant Flow** - HIGH
- **#5 Learning Flow** - MEDIUM

### References

- [Source: src/App.tsx#L1241-1543] - Original processScan to delete
- [Depends on: 14e-8a] - Utilities
- [Depends on: 14e-8b] - Sub-handlers and types
- [Parent Story: 14e-8] - Original story definition

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 2 | <= 4 | ✅ OK |
| Subtasks | 12 | <= 15 | ✅ OK |
| Files | 4 | <= 8 | ✅ OK |

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Completion Notes List

_To be filled during development_

### File List

_To be filled during development_
