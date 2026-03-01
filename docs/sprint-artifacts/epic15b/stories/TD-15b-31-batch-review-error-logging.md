# Tech Debt Story TD-15b-31: Sanitize Error Logging in useBatchReview

**Status:** done

> **Source:** ECC Code Review (2026-02-28) on story 15b-4d
> **Priority:** LOW | **Estimated Effort:** 1 point

## Story

As a **developer**, I want **console.error calls in useBatchReview.ts to log only error messages (not full error objects that may contain transaction data)**, so that **production logs don't inadvertently expose user financial data**.

## Acceptance Criteria

- [x] AC1: `console.error` at line ~322 logs `error.message` or `String(error)` instead of raw error object
- [x] AC2: `console.error` at line ~363 logs `error.message` or `String(error)` instead of raw error object
- [x] AC3: No transaction data structures appear in error log output
- [x] AC4: Tests pass

## Tasks / Subtasks

### Task 1: Fix error logging (DONE)

- [x] 1.1 Update `console.error` in `saveAll` to log `error instanceof Error ? error.message : String(error)`
- [x] 1.2 Update `console.error` in `saveOne` to log `error instanceof Error ? error.message : String(error)`
- [x] 1.3 Run `npm run test:quick`

## Dev Notes

- Source story: [15b-4d](./15b-4d-transaction-consumers-batch2.md)
- Review findings: #1 (security reviewer — LOW severity)
- Files affected: `src/features/batch-review/hooks/useBatchReview.ts`
- Pre-existing issue — not introduced by 15b-4d

## Senior Developer Review (ECC)

- **Date:** 2026-02-28
- **Classification:** TRIVIAL
- **Agents:** code-reviewer
- **Outcome:** APPROVE 10/10
- **Action Items:** 0
- **Session Cost:** $3.41
