# Story 14e.8a: processScan Pre-Audit & Pure Utilities

Status: done

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

- [x] **0.1** Document ALL dependencies from processScan (~302 lines in App.tsx)
  - State values (~15): scanImages, scanCurrency, userCredits, mappings, etc.
  - State setters (~12): setScanError, setCurrentTransaction, etc.
  - Dispatchers (3): dispatchProcessStart/Success/Error
  - Services/Functions (~15): analyzeReceipt, firestoreAddTransaction, etc.
- [x] **0.2** Run existing tests, document baseline pass/fail state
- [x] **0.3** Create smoke test checklist (single scan, quicksave, trusted, error paths)
- [x] **0.4** Document rollback plan (git revert strategy)

### Task 1: Extract Pure Helpers (AC: 2, 3)

- [x] **1.1** Create directory structure:
  ```
  src/features/scan/handlers/processScan/
  ├── index.ts          # Barrel export
  ├── types.ts          # (placeholder for 14e-8b)
  └── utils.ts          # Pure utilities
  ```
- [x] **1.2** Create `utils.ts` with extracted pure functions
- [x] **1.3** Extract `getSafeDate()` - date validation utility
- [x] **1.4** Extract `parseLocationResult()` - country/city validation
- [x] **1.5** Extract `buildInitialTransaction()` - transaction object construction
- [x] **1.6** Add unit tests for each utility in `utils.test.ts`

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

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

#### Task 0.1: Dependency Audit (COMPLETE)

**processScan Function Location:** [App.tsx:1291-1593](src/App.tsx#L1291-L1593) (~302 lines)

**State Values (16):**
| # | Variable | Source | Type |
|---|----------|--------|------|
| 1 | `scanImages` | scanState.images wrapper | `string[]` |
| 2 | `scanCurrency` | scanState.currency wrapper | `SupportedCurrency` |
| 3 | `scanStoreType` | scanState.storeType wrapper | `ReceiptType` |
| 4 | `userCredits.remaining` | useUserCredits hook | `number` |
| 5 | `viewMode` | useViewMode context | `'personal' \| 'group'` |
| 6 | `activeGroup` | useViewMode context | `SharedGroup \| null` |
| 7 | `mappings` | useCategoryMappings hook | `CategoryMapping[]` |
| 8 | `userPreferences.defaultCurrency` | useUserPreferences | `string` |
| 9 | `transactions` | useTransactions hook | `Transaction[]` |
| 10 | `insightProfile` | useInsightProfile | `InsightProfile` |
| 11 | `insightCache` | useInsightProfile | `InsightCache` |
| 12 | `batchSession` | useBatchSession | `BatchSession` |
| 13 | `defaultCountry` | userPreferences derived | `string` |
| 14 | `defaultCity` | userPreferences derived | `string` |
| 15 | `lang` | useState | `'en' \| 'es'` |
| 16 | `prefersReducedMotion` | useReducedMotion | `boolean` |

**State Setters (12):**
| # | Setter | Notes |
|---|--------|-------|
| 1 | `setScanError` | Wrapper for dispatchProcessError |
| 2 | `setToastMessage` | From dialog handlers |
| 3 | `setCreditUsedInSession` | Local useState |
| 4 | `setIsAnalyzing` | No-op wrapper (state machine manages) |
| 5 | `setCurrentTransaction` | Local useState |
| 6 | `setView` | Local useState |
| 7 | `setScanImages` | Context wrapper with auto-transition |
| 8 | `setSkipScanCompleteModal` | Local useState |
| 9 | `setShowBatchSummary` | Local useState |
| 10 | `setCurrentInsight` | Local useState |
| 11 | `setShowInsightCard` | Local useState |
| 12 | `setAnimateEditViewItems` | Local useState |

**Dispatchers (3):**
| # | Dispatcher | Source |
|---|------------|--------|
| 1 | `dispatchProcessStart` | useScan context |
| 2 | `dispatchProcessSuccess` | useScan context |
| 3 | `dispatchProcessError` | useScan context |

**Services/Functions (18):**
| # | Function | Source |
|---|----------|--------|
| 1 | `analyzeReceipt` | services/gemini |
| 2 | `firestoreAddTransaction` | services/firestore |
| 3 | `generateInsightForTransaction` | services/insightEngineService |
| 4 | `isInsightsSilenced` | services/insightEngineService |
| 5 | `recordMerchantScan` | useTrustedMerchants hook |
| 6 | `checkTrusted` | useTrustedMerchants hook |
| 7 | `deductUserCredits` | useUserCredits hook |
| 8 | `addUserCredits` | useUserCredits hook |
| 9 | `addToBatch` | useBatchSession hook |
| 10 | `scanOverlay.*` | useScanOverlayState hook |
| 11 | `showScanDialog` | useScan context |
| 12 | `applyCategoryMappings` | utils/categoryMatcher |
| 13 | `incrementMappingUsage` | services/categoryMappingService |
| 14 | `incrementMerchantMappingUsage` | services/merchantMappingService |
| 15 | `incrementItemNameMappingUsage` | services/itemNameMappingService |
| 16 | `findMerchantMatch` | useMerchantMappings hook |
| 17 | `applyItemNameMappings` | Inline useCallback in App.tsx |
| 18 | `getCitiesForCountry` | data/locations |

**Pure Utilities Already Exported:**
| Utility | Location | Notes |
|---------|----------|-------|
| `getSafeDate` | utils/validation.ts | ✅ Already exported |
| `parseStrictNumber` | utils/validation.ts | ✅ Already exported |
| `shouldShowQuickSave` | utils/confidenceCheck | ✅ Already exported |
| `calculateConfidence` | utils/confidenceCheck | ✅ Already exported |
| `validateTotal` | utils/totalValidation | ✅ Already exported |
| `reconcileItemsTotal` | App.tsx (inline) | Needs `lang` param - NOT pure |

**Types Used:**
- `Transaction`, `TransactionItem`, `StoreCategory` from types/transaction
- `TotalMismatchDialogData`, `CurrencyMismatchDialogData`, `QuickSaveDialogData` from types/scanStateMachine
- `DIALOG_TYPES` from types/scanStateMachine
- `SupportedCurrency` from services/userPreferencesService
- `ReceiptType` from services/gemini

#### Task 0.2: Baseline Test Results (COMPLETE)

**Test Command:** `npm run test:quick`
**Date:** 2026-01-25
**Results:**
- **Test Files:** 217 passed, 1 skipped (218 total)
- **Tests:** 5,347 passed, 33 skipped (5,380 total)
- **Duration:** 48.53s

**Baseline Status:** ✅ ALL TESTS PASSING

#### Task 0.3: Smoke Test Checklist (COMPLETE)

**Manual Verification Points (for future integration in 14e-8c):**

| # | Test Case | Expected Behavior |
|---|-----------|-------------------|
| 1 | **Single Scan - Success** | Capture image → processScan → Transaction appears in editor |
| 2 | **Single Scan - No Credits** | Shows "no credits" error, no API call |
| 3 | **Single Scan - API Error** | Credit refunded, error toast shown |
| 4 | **Single Scan - Timeout** | Credit refunded, timeout error shown |
| 5 | **QuickSave Path** | High confidence → QuickSaveCard dialog appears |
| 6 | **Trusted Merchant Path** | Trusted merchant → Auto-save + toast "Guardado automáticamente" |
| 7 | **Currency Mismatch** | Detected ≠ default → Currency dialog appears |
| 8 | **Total Mismatch** | >40% discrepancy → Total mismatch dialog |
| 9 | **Category Learning** | Merchant mapped → Category auto-applied |
| 10 | **Merchant Learning** | Merchant mapped → Alias auto-applied |

**Note:** This story (14e-8a) only extracts pure utilities - no App.tsx behavior changes. Smoke tests apply to 14e-8c.

#### Task 0.4: Rollback Plan (COMPLETE)

**Rollback Strategy:**

1. **Utilities are additive** - New files don't modify existing behavior
2. **No App.tsx changes in 14e-8a** - Zero risk to production flow
3. **Git revert sequence:**
   ```bash
   # If issues found after merge:
   git revert <commit-hash>  # Revert single commit
   # Or for feature branch:
   git revert --no-commit HEAD~N..HEAD  # Revert N commits
   ```
4. **Rollback scope:**
   - Delete: `src/features/scan/handlers/processScan/` directory
   - Delete: `tests/unit/features/scan/handlers/processScan/` (if created)
   - No other files affected

**Risk Assessment:** LOW - Pure utility extraction with no integration

#### Task 1: Extract Pure Helpers (COMPLETE)

**Created Files:**
| File | Purpose | LOC |
|------|---------|-----|
| `src/features/scan/handlers/processScan/index.ts` | Barrel export | 17 |
| `src/features/scan/handlers/processScan/types.ts` | Type definitions | 89 |
| `src/features/scan/handlers/processScan/utils.ts` | Pure utility functions | 203 |
| `tests/unit/features/scan/handlers/processScan/utils.test.ts` | Unit tests | 435 |

**Exported Functions:**
| Function | Description |
|----------|-------------|
| `getSafeDate` | Re-exported from utils/validation.ts |
| `parseStrictNumber` | Re-exported from utils/validation.ts |
| `parseLocationResult` | Validates country/city with city list lookup |
| `normalizeItems` | Maps AI 'quantity' to 'qty' field |
| `validateScanDate` | Clamps future dates to current year |
| `buildInitialTransaction` | Constructs initial Transaction object |
| `hasValidTotal` | Checks if total is valid positive number |
| `hasItems` | Checks if items array is non-empty |

**Test Coverage:**
- **45 tests** covering all utility functions
- Tests for edge cases: undefined inputs, invalid cities, future dates, group mode

#### Final Test Results (COMPLETE)

**Test Command:** `npm run test:quick`
**Date:** 2026-01-25
**Results:**
- **Test Files:** 218 passed, 1 skipped (219 total)
- **Tests:** 5,392 passed, 33 skipped (5,425 total)
- **New Tests Added:** 45

**Status:** ✅ ALL TESTS PASSING - NO REGRESSIONS

### Code Review Fixes (atlas-code-review 2026-01-25)

**Reviewer:** Claude Opus 4.5 (atlas-code-review workflow)

**Issues Found & Fixed:**

| Severity | Issue | Fix Applied |
|----------|-------|-------------|
| CRITICAL | Test imports used `@features/scan/handlers/processScan/*` path alias which didn't resolve | Changed to relative imports `../../../../../../src/features/scan/handlers/processScan/*` |
| MEDIUM | CI coverage gap - `tests/unit/features/` not in any CI group | Added pattern to `vitest.config.ci.group-managers.ts` |
| MEDIUM | Missing `handlers/index.ts` barrel file | Created `src/features/scan/handlers/index.ts` |
| LOW | `utils.ts` used relative import for validation utils | Auto-fixed by linter to `@/utils/validation` |

**Verification:** `npm run test:quick` → 218 passed, 5,392 tests ✅

### File List

| Action | File Path |
|--------|-----------|
| Created | `src/features/scan/handlers/processScan/index.ts` |
| Created | `src/features/scan/handlers/processScan/types.ts` |
| Created | `src/features/scan/handlers/processScan/utils.ts` |
| Created | `tests/unit/features/scan/handlers/processScan/utils.test.ts` |
| Created | `src/features/scan/handlers/index.ts` |
| Modified | `tests/config/vitest.config.ci.group-managers.ts` |