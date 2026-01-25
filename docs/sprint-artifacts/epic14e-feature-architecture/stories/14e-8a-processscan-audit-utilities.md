# Story 14e.8a: processScan Pre-Audit & Pure Utilities

Status: ready-for-dev

## Story

As a **developer**,
I want **to audit processScan dependencies and extract pure utility functions**,
So that **I have a solid foundation for the full processScan extraction with minimal risk**.

## Context

This is **Part 1 of 3** from the split of Story 14e.8 (Extract processScan Handler).

**Split Rationale:** Original story had 5 tasks / 28 subtasks - exceeding context window capacity guidelines (max 4 tasks / 15 subtasks). Split by phase to enable layer-by-layer extraction.

**Story Chain:**
- **14e-8a** (this): Pre-Audit + Pure Utilities ← YOU ARE HERE
- **14e-8b**: Sub-Handlers extraction (depends on 14e-8a)
- **14e-8c**: Main Handler + Integration (depends on 14e-8b)

## Acceptance Criteria

1. **AC1: Dependency Audit Complete**
   - All ~30+ dependencies documented with their sources
   - Baseline test results recorded
   - Smoke test checklist created
   - Rollback plan documented

2. **AC2: Directory Structure Created**
   - `src/features/scan/handlers/processScan/` directory exists
   - Barrel exports set up (`index.ts` files)
   - Path alias `@features/scan` works for imports

3. **AC3: Pure Utilities Extracted**
   - `utils.ts` created with pure helper functions
   - `getSafeDate()` extracted (if not already exported)
   - `parseLocationResult()` extracted
   - `buildInitialTransaction()` extracted
   - Unit tests for each utility function

4. **AC4: No Regressions**
   - All existing tests pass
   - No changes to App.tsx behavior yet
   - Utilities are exported but not yet consumed

## Tasks / Subtasks

### Task 0: Pre-Extraction Audit (AC: 1)

- [ ] **0.1** Document ALL dependencies from processScan (~302 lines in App.tsx)
  - State values (~15): scanImages, scanCurrency, userCredits, mappings, etc.
  - State setters (~12): setScanError, setCurrentTransaction, etc.
  - Dispatchers (3): dispatchProcessStart/Success/Error
  - Services/Functions (~15): analyzeReceipt, firestoreAddTransaction, etc.
- [ ] **0.2** Run existing tests, document baseline pass/fail state
- [ ] **0.3** Create smoke test checklist (single scan, quicksave, trusted, error paths)
- [ ] **0.4** Document rollback plan (git revert strategy)

### Task 1: Extract Pure Helpers (AC: 2, 3)

- [ ] **1.1** Create directory structure:
  ```
  src/features/scan/handlers/processScan/
  ├── index.ts          # Barrel export
  ├── types.ts          # (placeholder for 14e-8b)
  └── utils.ts          # Pure utilities
  ```
- [ ] **1.2** Create `utils.ts` with extracted pure functions
- [ ] **1.3** Extract `getSafeDate()` - date validation utility
- [ ] **1.4** Extract `parseLocationResult()` - country/city validation
- [ ] **1.5** Extract `buildInitialTransaction()` - transaction object construction
- [ ] **1.6** Add unit tests for each utility in `utils.test.ts`

## Dev Notes

### Dependency Inventory Reference

From App.tsx processScan analysis (lines ~1241-1543):

**State Values (~15):**
- `scanImages`, `scanCurrency`, `scanStoreType`
- `userCredits.remaining`
- `viewMode`, `activeGroup`
- `mappings` (category mappings array)
- `userPreferences.defaultCurrency`
- `transactions` (for insight context)
- `insightProfile`, `insightCache`, `batchSession`
- `defaultCountry`, `defaultCity`
- `lang`, `prefersReducedMotion`

**State Setters (~12):**
- `setScanError`, `setToastMessage`, `setCreditUsedInSession`
- `setIsAnalyzing`, `setCurrentTransaction`, `setView`
- `setScanImages`, `setSkipScanCompleteModal`
- `setShowBatchSummary`, `setCurrentInsight`
- `setShowInsightCard`, `setAnimateEditViewItems`

### Pure Utility Signatures (Expected)

```typescript
// utils.ts
export function getSafeDate(dateString: string | undefined): Date;
export function parseLocationResult(location: LocationResult): { country: string; city: string };
export function buildInitialTransaction(scanResult: ScanResult, defaults: TransactionDefaults): Transaction;
```

### Testing Strategy

- Unit tests only - no integration with App.tsx yet
- Mock any external dependencies
- Focus on pure function input/output validation

### References

- [Source: src/App.tsx#L1241-1543] - processScan function
- [Parent Story: 14e-8] - Original story definition
- [Depends on: 14e-1] - Directory structure and path aliases

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 2 | <= 4 | ✅ OK |
| Subtasks | 10 | <= 15 | ✅ OK |
| Files | 3-4 | <= 8 | ✅ OK |

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Completion Notes List

_To be filled during development_

### File List

_To be filled during development_