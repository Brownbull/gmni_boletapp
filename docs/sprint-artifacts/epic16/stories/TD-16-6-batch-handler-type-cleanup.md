# Tech Debt Story TD-16-6: Batch Handler Type Cleanup

Status: done

> **Source:** KDBP Code Review (2026-03-07) on story TD-16-3
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story
As a **developer**, I want **duplicate type literals and constants in batch-review handlers consolidated into named types**, so that **DRY is maintained and future changes require only one edit**.

## Acceptance Criteria
- AC-1: Credit check result shape (`{ sufficient, available, required, remaining, shortage, maxProcessable, creditType }`) extracted to a named `CreditCheckResult` type used by both `checkCreditSufficiency` and `setCreditCheckResult` in `BatchReviewHandlersProps`
- AC-2: `MERCHANT_CONFIDENCE_THRESHOLD` has a single source of truth — remove duplicate from `handlers/save.ts` and import from `batchReviewHandlerTypes.ts`
- AC-3: All existing tests pass without modification

## Tasks / Subtasks
- [x] 1. Extract `CreditCheckResult` type from inline literals in `batchReviewHandlerTypes.ts:106-134`
- [x] 2. Consolidate `MERCHANT_CONFIDENCE_THRESHOLD` — single source in `batchReviewHandlerTypes.ts`, import in `handlers/save.ts`
- [x] 3. Verify all tests pass after consolidation

## Dev Notes
- Source story: [TD-16-3](./TD-16-3-batch-review-file-decomposition.md)
- Review findings: #4, #5
- Files affected: `src/features/batch-review/hooks/batchReviewHandlerTypes.ts`, `src/features/batch-review/handlers/save.ts`

## Senior Developer Review (KDBP)
- **Date:** 2026-03-07
- **Classification:** SIMPLE
- **Agents:** code-reviewer, tdd-guide
- **Outcome:** APPROVE 9.0/10
- **Quick fixes:** 1 (duplicate CreditCheckResult type → re-export from canonical creditService.ts)
- **TD stories:** 0
<!-- CITED: none -->
