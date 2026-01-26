# Story 14e-18b: Credit Handlers Extraction

Status: ready-for-dev

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

- [ ] **Task 1: Define Handler Context Type** (AC: #2)
  - [ ] 1.1: Analyze App.tsx handler dependencies (lines 1646-1707):
    - `userCredits: UserCredits`
    - `checkCreditSufficiency` function
    - `deductSuperCredits` function
    - State setters: `setShowCreditWarning`, `setCreditCheckResult`
    - Batch processing callbacks
  - [ ] 1.2: Create `CreditHandlerContext` interface in `creditHandlers.ts`
  - [ ] 1.3: Document each dependency's purpose

- [ ] **Task 2: Extract Credit Handlers** (AC: #1, #4)
  - [ ] 2.1: Create `src/features/credit/handlers/creditHandlers.ts`
  - [ ] 2.2: Extract `createBatchConfirmWithCreditCheck` factory:
    ```typescript
    export function createBatchConfirmWithCreditCheck(ctx: CreditHandlerContext) {
      return () => {
        const result = checkCreditSufficiency(ctx.credits, 1, true);
        ctx.setCreditCheckResult(result);
        ctx.setShowCreditWarning(true);
      };
    }
    ```
  - [ ] 2.3: Extract `createCreditWarningConfirm` factory
  - [ ] 2.4: Extract `createCreditWarningCancel` factory
  - [ ] 2.5: Export all handlers from feature index.ts

- [ ] **Task 3: Add Unit Tests** (AC: #3)
  - [ ] 3.1: Create `tests/unit/features/credit/creditHandlers.test.ts`
  - [ ] 3.2: Test `createBatchConfirmWithCreditCheck`:
    - Calls `checkCreditSufficiency` with correct args
    - Sets credit check result
    - Shows warning dialog
  - [ ] 3.3: Test `createCreditWarningConfirm`:
    - Hides warning dialog
    - Clears credit check result
    - Calls batch processing callback
  - [ ] 3.4: Test `createCreditWarningCancel`:
    - Hides warning dialog
    - Clears credit check result
    - Does NOT call batch processing

## Dev Notes

### Handler Context Pattern

```typescript
// src/features/credit/handlers/creditHandlers.ts
import { UserCredits } from '../../../types/scan';
import { CreditCheckResult, checkCreditSufficiency } from '../../../services/creditService';

export interface CreditHandlerContext {
  /** Current user credits */
  credits: UserCredits;
  /** Function to deduct super credits */
  deductSuperCredits: (amount: number) => Promise<boolean>;
  /** State setter for showing credit warning dialog */
  setShowCreditWarning: (show: boolean) => void;
  /** State setter for credit check result */
  setCreditCheckResult: (result: CreditCheckResult | null) => void;
  /** Callback when user confirms batch with credits */
  onBatchConfirmed?: () => void;
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

### References

- [Source: src/App.tsx#L1646-1707 - original handler implementations]
- [Source: src/services/creditService.ts#checkCreditSufficiency]
- [Pattern: Epic 14c-refactor.20 - handler extraction pattern]

## Dev Agent Record

### Agent Model Used

<!-- Filled by dev agent -->

### Debug Log References

<!-- Filled by dev agent -->

### Completion Notes List

<!-- Filled by dev agent -->

### File List

<!-- Filled by dev agent -->
