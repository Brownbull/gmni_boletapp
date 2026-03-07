# Tech Debt Story TD-16-6: Batch Handler Type Cleanup

Status: ready-for-dev

> **Source:** KDBP Code Review (2026-03-07) on story TD-16-3
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story
As a **developer**, I want **duplicate type literals and constants in batch-review handlers consolidated into named types**, so that **DRY is maintained and future changes require only one edit**.

## Acceptance Criteria
- AC-1: Credit check result shape (`{ sufficient, available, required, remaining, shortage, maxProcessable, creditType }`) extracted to a named `CreditCheckResult` type used by both `checkCreditSufficiency` and `setCreditCheckResult` in `BatchReviewHandlersProps`
- AC-2: `MERCHANT_CONFIDENCE_THRESHOLD` has a single source of truth — remove duplicate from `handlers/save.ts` and import from `batchReviewHandlerTypes.ts`
- AC-3: All existing tests pass without modification

## Tasks / Subtasks
- [ ] 1. Extract `CreditCheckResult` type from inline literals in `batchReviewHandlerTypes.ts:106-134`
- [ ] 2. Consolidate `MERCHANT_CONFIDENCE_THRESHOLD` — single source in `batchReviewHandlerTypes.ts`, import in `handlers/save.ts`
- [ ] 3. Verify all tests pass after consolidation

## Dev Notes
- Source story: [TD-16-3](./TD-16-3-batch-review-file-decomposition.md)
- Review findings: #4, #5
- Files affected: `src/features/batch-review/hooks/batchReviewHandlerTypes.ts`, `src/features/batch-review/handlers/save.ts`
