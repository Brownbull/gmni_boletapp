# Story 14e.8b: processScan Sub-Handlers Extraction

Status: ready-for-dev

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

- [ ] **2.1** Create `src/features/scan/handlers/processScan/types.ts`
  - Define `ScanDependencies` interface
  - Define `UserDependencies` interface
  - Define `MappingDependencies` interface
  - Define `UIDependencies` interface
  - Define `ProcessScanParams` (combines all dependency groups)

- [ ] **2.2** Extract `validateScanResult()` sub-handler
  - Validates total against items sum
  - Triggers TotalMismatchDialog when >40% difference
  - Returns validation result with continue/abort signal

- [ ] **2.3** Extract `applyAllMappings()` sub-handler
  - Applies category mappings
  - Finds merchant matches
  - Applies item name mappings
  - Increments usage counters
  - Returns mapped transaction

- [ ] **2.4** Extract `handleCurrencyDetection()` sub-handler
  - Compares detected currency vs default currency
  - Triggers CurrencyMismatchDialog when different
  - Returns currency decision (use detected or default)

- [ ] **2.5** Extract `handleScanSuccess()` sub-handler
  - Calculates confidence score
  - Checks for trusted merchant auto-save
  - Determines routing: QuickSave vs EditView
  - Handles insight generation for auto-save path

- [ ] **2.6** Add unit tests for all sub-handlers
  - `subhandlers.test.ts` with comprehensive coverage
  - Mock all dependencies
  - Test happy paths and error paths

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

_To be filled by dev agent_

### Completion Notes List

_To be filled during development_

### File List

_To be filled during development_
