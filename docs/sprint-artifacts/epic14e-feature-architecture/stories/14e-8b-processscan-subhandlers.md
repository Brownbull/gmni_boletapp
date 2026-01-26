# Story 14e.8b: processScan Sub-Handlers Extraction

Status: done

## Story

As a **developer**,
I want **to extract sub-handler functions from processScan**,
So that **the complex validation, mapping, and routing logic is modular and testable**.

## Context

This is **Part 2 of 3** from the split of Story 14e.8 (Extract processScan Handler).

**Split Rationale:** Original story had 5 tasks / 28 subtasks - exceeding context window capacity guidelines (max 4 tasks / 15 subtasks). Split by phase to enable layer-by-layer extraction.

**Story Chain:**
- **14e-8a**: Pre-Audit + Pure Utilities (completed)
- **14e-8b** (this): Sub-Handlers extraction ← YOU ARE HERE
- **14e-8c**: Main Handler + Integration (depends on 14e-8b)

**Depends on:** 14e-8a (utilities and directory structure must exist)

## Acceptance Criteria

1. **AC1: Dependency Types Defined**
   - `types.ts` created with all dependency interfaces
   - `ScanDependencies` interface (state values)
   - `UserDependencies` interface (user, services, credits)
   - `MappingDependencies` interface (mappings, apply functions)
   - `UIDependencies` interface (setters, dispatchers, dialogs)

2. **AC2: Sub-Handlers Extracted**
   - `validateScanResult()` - total validation + dialog trigger
   - `applyAllMappings()` - category + merchant + item mappings
   - `handleCurrencyDetection()` - currency check + dialog trigger
   - `handleScanSuccess()` - QuickSave/Trusted/EditView routing
   - Each sub-handler uses dependency injection pattern

3. **AC3: Test Coverage**
   - Unit tests for each sub-handler with mocked dependencies
   - Edge cases covered (validation failures, missing mappings, etc.)
   - All tests pass

4. **AC4: No Regressions**
   - All existing tests still pass
   - No changes to App.tsx behavior yet
   - Sub-handlers exported but not yet consumed by main handler

## Tasks / Subtasks

### Task 2: Extract Sub-Handlers (AC: 1, 2, 3, 4)

- [x] **2.1** Extend `src/features/scan/handlers/processScan/types.ts`
  - Define `ScanDependencies` interface
  - Define `UserDependencies` interface
  - Define `MappingDependencies` interface
  - Define `UIDependencies` interface
  - Define `ProcessScanParams` (combines all dependency groups)
  - Added dialog data types and result interfaces

- [x] **2.2** Extract `validateScanResult()` sub-handler
  - Validates total against items sum using `validateTotal()`
  - Triggers TotalMismatchDialog when >40% difference
  - Returns validation result with continue/abort signal
  - Also includes `reconcileItemsTotal()` utility

- [x] **2.3** Extract `applyAllMappings()` sub-handler
  - Applies category mappings
  - Finds merchant matches (confidence > 0.7 threshold)
  - Applies item name mappings scoped to merchant
  - Increments usage counters (fire-and-forget)
  - Returns mapped transaction with applied IDs

- [x] **2.4** Extract `handleCurrencyDetection()` sub-handler
  - Compares detected currency vs user default currency
  - Triggers CurrencyMismatchDialog when different
  - Returns currency decision (use detected or default)
  - Handles undefined cases gracefully

- [x] **2.5** Extract `handleScanSuccess()` sub-handler
  - Calculates confidence score using `calculateConfidence()`
  - Checks for trusted merchant via async `checkTrusted()`
  - Determines routing: QuickSave vs Trusted-AutoSave vs EditView
  - Returns route decision (insight generation deferred to 14e-8c)

- [x] **2.6** Add unit tests for all sub-handlers
  - `subhandlers.test.ts` with 32 comprehensive tests
  - Mock all dependencies with vi.fn()
  - Test happy paths, error paths, and edge cases
  - All tests pass

## Dev Notes

### Type Definitions (Expected)

```typescript
// types.ts

export interface ScanDependencies {
  images: ScanImage[];
  currency: string;
  storeType: string;
  defaultCountry: string;
  defaultCity: string;
}

export interface UserDependencies {
  user: User;
  userCredits: { remaining: number };
  userPreferences: { defaultCurrency: string };
  transactions: Transaction[];
}

export interface MappingDependencies {
  mappings: CategoryMapping[];
  applyCategoryMappings: (items: Item[]) => Item[];
  findMerchantMatch: (merchant: string) => MerchantMatch | null;
  applyItemNameMappings: (items: Item[]) => Item[];
  incrementMappingUsage: (id: string) => void;
  incrementMerchantMappingUsage: (id: string) => void;
  incrementItemNameMappingUsage: (id: string) => void;
}

export interface UIDependencies {
  setScanError: (error: string | null) => void;
  setCurrentTransaction: (tx: Transaction | null) => void;
  setView: (view: ViewMode) => void;
  showScanDialog: (type: DialogType, data?: any) => void;
  dispatchProcessStart: () => void;
  dispatchProcessSuccess: () => void;
  dispatchProcessError: (error: string) => void;
  // ... other setters
}

export interface ProcessScanParams {
  scan: ScanDependencies;
  user: UserDependencies;
  mapping: MappingDependencies;
  ui: UIDependencies;
  imagesToProcess?: ScanImage[];
}
```

### Sub-Handler Signatures (Expected)

```typescript
// subhandlers.ts

export function validateScanResult(
  result: ScanResult,
  deps: { showScanDialog: UIDependencies['showScanDialog'] }
): { valid: boolean; shouldContinue: boolean };

export function applyAllMappings(
  transaction: Transaction,
  deps: MappingDependencies
): Transaction;

export function handleCurrencyDetection(
  detectedCurrency: string,
  defaultCurrency: string,
  deps: { showScanDialog: UIDependencies['showScanDialog'] }
): Promise<string>;

export function handleScanSuccess(
  transaction: Transaction,
  deps: {
    checkTrusted: (merchant: string) => boolean;
    shouldShowQuickSave: (confidence: number) => boolean;
    calculateConfidence: (tx: Transaction) => number;
    ui: UIDependencies;
  }
): void;
```

### Integration with useScanHandlers

The `useScanHandlers` hook (from 14c-refactor.20) provides:
- `reconcileItemsTotal()` - can be used in validateScanResult
- `applyItemNameMappings()` - can be reused
- Dialog handlers - reference for patterns

### Testing Strategy

- Each sub-handler tested in isolation
- Mock all dependencies with jest.fn()
- Test dialog triggers with spy assertions
- Test mapping transformations with snapshot tests

### References

- [Source: src/App.tsx#L1241-1543] - processScan function
- [Source: src/hooks/app/useScanHandlers.ts] - Related patterns
- [Depends on: 14e-8a] - Utilities must exist
- [Parent Story: 14e-8] - Original story definition

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 1 | <= 4 | ✅ OK |
| Subtasks | 6 | <= 15 | ✅ OK |
| Files | 2-3 | <= 8 | ✅ OK |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 via Atlas dev-story workflow

### Completion Notes List

1. **Types Extended (AC1):** Extended `types.ts` with 15+ new interfaces:
   - `ScanDependencies`, `UserDependencies`, `MappingDependencies`, `UIDependencies`
   - `ProcessScanParams` combining all dependency groups
   - Dialog data types: `TotalMismatchDialogData`, `CurrencyMismatchDialogData`, `QuickSaveDialogData`
   - Result types: `ValidateScanResultOutput`, `CurrencyDetectionResult`, `ScanSuccessResult`
   - Supporting types: `CategoryMapping`, `MerchantMatchResult`, `ItemNameMappingResult`, etc.

2. **Sub-Handlers Created (AC2):** Created `subhandlers.ts` with 5 sub-handlers:
   - `validateScanResult()` - Uses `validateTotal()` from totalValidation.ts
   - `applyAllMappings()` - Sequential: category → merchant (0.7 threshold) → item names
   - `handleCurrencyDetection()` - Dialog trigger or fallback to default
   - `handleScanSuccess()` - Returns `route: 'quicksave' | 'trusted-autosave' | 'edit-view'`
   - `reconcileItemsTotal()` - Pure utility for item total reconciliation

3. **Tests Created (AC3):** 32 unit tests in `subhandlers.test.ts`:
   - validateScanResult: 5 tests (valid/invalid total, dialog data, reconciliation)
   - applyAllMappings: 6 tests (no mappings, category, merchant, items, usage increment)
   - handleCurrencyDetection: 5 tests (match, mismatch, default fallback)
   - handleScanSuccess: 6 tests (trusted, quicksave, edit-view, alias handling)
   - reconcileItemsTotal: 10 tests (no discrepancy, surplus, discount, Spanish, edge cases)

4. **No Regressions (AC4):** All 6,269 existing tests pass. Sub-handlers exported but not yet integrated into App.tsx (deferred to 14e-8c).

### File List

**Created:**
- `src/features/scan/handlers/processScan/subhandlers.ts` (521 lines)
- `tests/unit/features/scan/handlers/processScan/subhandlers.test.ts` (639 lines)

**Modified:**
- `src/features/scan/handlers/processScan/types.ts` (+200 lines)
- `src/features/scan/handlers/processScan/index.ts` (+1 export)

### Test Results

```
Test Files: 256 passed, 2 skipped (258)
Tests: 6,269 passed, 62 skipped (6,331)
Duration: 149.44s
```

Story 14e-8b specific tests: 32 passed

### Archie Review Record (Post-Dev)

**Reviewed by:** React Opinionated Architect (Archie)
**Date:** 2026-01-25
**Verdict:** ✅ APPROVED WITH NOTES

**Fixes Applied:**
1. Extracted magic number `0.7` → `MERCHANT_MATCH_CONFIDENCE_THRESHOLD` constant in `subhandlers.ts`
2. Added `@throws` JSDoc annotation to `handleScanSuccess()` for async error handling documentation

**Pattern Compliance:**
- ✅ FSD architecture (correct feature slice placement)
- ✅ State management (DI pattern, no direct state management)
- ✅ Testing standards (32 tests, factories, edge cases)
- ✅ Chilean localization (Spanish translations verified)

**Accepted Notes:**
- Decimal rounding in `reconcileItemsTotal` handles AI floats; Zod schema enforces integer storage for CLP downstream
