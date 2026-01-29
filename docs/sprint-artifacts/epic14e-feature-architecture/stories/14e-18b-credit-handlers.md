# Story 14e-18b: Credit Handlers Extraction

Status: done

<!-- Created by atlas-create-story workflow 2026-01-25 -->
<!-- Split from 14e-18: Part 2 of 3 -->
<!-- DEPENDS: 14e-18a -->

## Story

As a **developer**,
I want **credit warning dialog handlers extracted to the credit feature module**,
So that **credit-related logic is colocated and App.tsx is simplified**.

## Acceptance Criteria

1. **AC1**: `src/features/credit/handlers/creditHandlers.ts` created with:
   - `handleBatchConfirmWithCreditCheck` handler
   - `handleCreditWarningConfirm` handler
   - `handleCreditWarningCancel` handler
   - Handler context type for dependency injection

2. **AC2**: Handlers use props-based dependency injection pattern:
   - Accept `CreditHandlerContext` with all dependencies
   - Do NOT access App.tsx state directly
   - Return functions compatible with component event handlers

3. **AC3**: Unit tests cover all handler scenarios:
   - Sufficient credits path
   - Insufficient credits path
   - Cancel/confirm flows

4. **AC4**: Handlers integrate with `checkCreditSufficiency` from creditService

5. **AC5**: Export from feature index.ts

## Tasks / Subtasks

- [x] **Task 1: Define Handler Context Type** (AC: #2)
  - [x] 1.1: Analyze App.tsx handler dependencies (lines 1646-1707):
    - `userCredits: UserCredits`
    - `checkCreditSufficiency` function
    - `deductSuperCredits` function
    - State setters: `setShowCreditWarning`, `setCreditCheckResult`
    - Batch processing callbacks
  - [x] 1.2: Create `CreditHandlerContext` interface in `creditHandlers.ts`
  - [x] 1.3: Document each dependency's purpose

- [x] **Task 2: Extract Credit Handlers** (AC: #1, #4)
  - [x] 2.1: Create `src/features/credit/handlers/creditHandlers.ts`
  - [x] 2.2: Extract `createBatchConfirmWithCreditCheck` factory:
    ```typescript
    export function createBatchConfirmWithCreditCheck(ctx: CreditHandlerContext) {
      return () => {
        const result = checkCreditSufficiency(ctx.credits, 1, true);
        ctx.setCreditCheckResult(result);
        ctx.setShowCreditWarning(true);
      };
    }
    ```
  - [x] 2.3: Extract `createCreditWarningConfirm` factory
  - [x] 2.4: Extract `createCreditWarningCancel` factory
  - [x] 2.5: Export all handlers from feature index.ts

- [x] **Task 3: Add Unit Tests** (AC: #3)
  - [x] 3.1: Create `tests/unit/features/credit/creditHandlers.test.ts`
  - [x] 3.2: Test `createBatchConfirmWithCreditCheck`:
    - Calls `checkCreditSufficiency` with correct args
    - Sets credit check result
    - Shows warning dialog
  - [x] 3.3: Test `createCreditWarningConfirm`:
    - Hides warning dialog
    - Clears credit check result
    - Calls batch processing callback
  - [x] 3.4: Test `createCreditWarningCancel`:
    - Hides warning dialog
    - Clears credit check result
    - Does NOT call batch processing

### Review Follow-ups (AI Code Review 2026-01-27)

- [x] [AI-Review][HIGH] Stage untracked files before commit: `git add src/features/credit/handlers/creditHandlers.ts tests/unit/features/credit/creditHandlers.test.ts`
- [x] [AI-Review][MEDIUM] Document code duplication rationale: `createBatchConfirmWithCreditCheck` duplicates `confirmWithCreditCheck` from batch-review/handlers/creditCheck.ts - intentional foundation for future migration?
- [x] [AI-Review][LOW] App.tsx integration deferred: Handlers created but App.tsx still uses batch-review `confirmWithCreditCheck`. Document if intentional (follow-up story) or oversight.

## Dev Notes

### Handler Context Pattern

```typescript
// src/features/credit/handlers/creditHandlers.ts
import { UserCredits } from '../../../types/scan';
import { CreditCheckResult, checkCreditSufficiency } from '../../../services/creditService';

export interface CreditHandlerContext {
  /** Current user credits */
  credits: UserCredits;
  /** State setter for showing credit warning dialog */
  setShowCreditWarning: (show: boolean) => void;
  /** State setter for credit check result */
  setCreditCheckResult: (result: CreditCheckResult | null) => void;
  /** Optional callback when user confirms batch with credits */
  onBatchConfirmed?: () => void | Promise<void>;
}

/**
 * Factory for batch confirm with credit check handler.
 * Called before batch processing to verify sufficient super credits.
 */
export function createBatchConfirmWithCreditCheck(ctx: CreditHandlerContext) {
  return () => {
    const result = checkCreditSufficiency(ctx.credits, 1, true); // 1 super credit for batch
    ctx.setCreditCheckResult(result);
    ctx.setShowCreditWarning(true);
  };
}

/**
 * Factory for credit warning confirm handler.
 * Called when user confirms proceeding despite credit warning.
 */
export function createCreditWarningConfirm(ctx: CreditHandlerContext) {
  return async () => {
    ctx.setShowCreditWarning(false);
    ctx.setCreditCheckResult(null);
    ctx.onBatchConfirmed?.();
  };
}

/**
 * Factory for credit warning cancel handler.
 */
export function createCreditWarningCancel(ctx: CreditHandlerContext) {
  return () => {
    ctx.setShowCreditWarning(false);
    ctx.setCreditCheckResult(null);
  };
}
```

### Files to Create

- `src/features/credit/handlers/creditHandlers.ts`
- `tests/unit/features/credit/creditHandlers.test.ts`

### Files to Modify

- `src/features/credit/index.ts` (add handler exports)

### Files to Reference

- `src/App.tsx` lines 1646-1707 (original handlers)
- `src/services/creditService.ts` (checkCreditSufficiency)

### Dependencies

- Story 14e-18a MUST be complete (directory structure exists)

### Code Duplication Rationale (Review Follow-up)

**Q:** Why does `createBatchConfirmWithCreditCheck` duplicate `confirmWithCreditCheck` from `batch-review/handlers/creditCheck.ts`?

**A:** This is **intentional** as part of the Epic 14e feature architecture migration strategy:

1. **Separation of Concerns**: The credit feature module should own all credit-related logic. Currently batch-review has a `confirmWithCreditCheck` handler, but credit warnings are a credit feature concern, not a batch-review concern.

2. **Foundation for Migration**: The credit feature handlers serve as the canonical location for credit warning logic. Future stories will:
   - Migrate App.tsx to use the credit feature handlers
   - Deprecate and remove `batch-review/handlers/creditCheck.ts`
   - Consolidate all credit-related handlers in the credit feature

3. **Pattern Consistency**: Using factory pattern (`createXxx`) vs direct function (`confirmXxx`) aligns with the established handler extraction pattern from Epic 14c-refactor.20.

### App.tsx Integration Status (Review Follow-up)

**Status:** Intentionally deferred to follow-up story (14e-18c or later)

**Rationale:**
- Story 14e-18b scope is limited to *extraction* of handlers to the credit feature module
- App.tsx integration is a separate concern that involves:
  - Wiring up the new handlers to replace existing ones
  - Testing the integration in the full App context
  - Potentially deprecating batch-review credit handlers
- Keeping extraction and integration as separate stories reduces risk and allows for incremental validation

**Current State:**
- App.tsx continues to use `confirmWithCreditCheck` from `@features/batch-review/handlers`
- Credit feature has equivalent handlers ready for future integration
- No functional regression - existing behavior preserved

### References

- [Source: src/App.tsx#L1646-1707 - original handler implementations]
- [Source: src/services/creditService.ts#checkCreditSufficiency]
- [Pattern: Epic 14c-refactor.20 - handler extraction pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Clean implementation with no debugging required.

### Completion Notes List

- Implemented `CreditHandlerContext` interface with all required dependencies
- Created 3 factory functions following props-based dependency injection pattern:
  - `createBatchConfirmWithCreditCheck` - Shows credit warning dialog
  - `createCreditWarningConfirm` - Confirms and triggers batch callback
  - `createCreditWarningCancel` - Cancels and clears state
- Implemented 23 unit tests covering all scenarios
- Simplified context by removing `deductSuperCredits` (not needed in warning handlers)
- Handlers integrate with `checkCreditSufficiency` from creditService
- All 5802 tests pass after implementation

**Review Follow-ups Resolved (2026-01-27):**
- ✅ Staged untracked handler and test files
- ✅ Documented code duplication rationale (intentional migration foundation)
- ✅ Documented App.tsx integration deferral (follow-up story scope)

### File List

**Created:**
- `src/features/credit/handlers/creditHandlers.ts` - Handler implementations
- `tests/unit/features/credit/creditHandlers.test.ts` - Unit tests (23 tests)

**Modified:**
- `src/features/credit/handlers/index.ts` - Updated barrel exports
- `src/features/credit/index.ts` - Added handler exports to feature module
