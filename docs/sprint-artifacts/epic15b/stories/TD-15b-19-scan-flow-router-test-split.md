# Tech Debt Story TD-15b-19: Split useScanFlowRouter test file under 300 lines

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-25) on story 15b-2l
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story
As a **developer**, I want **the useScanFlowRouter.test.ts file split into 2 focused test files under 300 lines**, so that **the unit test file size guideline (max 300 lines) is met and the test suite remains maintainable**.

## Acceptance Criteria

- [ ] **AC1:** `useScanFlowRouter.test.ts` split into 2 files, each under 300 lines
- [ ] **AC2:** Suggested split: `useScanFlowRouter.continueScan.test.ts` (continueScanWithTransaction tests) + `useScanFlowRouter.proceedAfter.test.ts` (proceedAfterCurrencyResolved tests)
- [ ] **AC3:** Shared test utilities (`createDefaultFlowRouterProps`, `createMockTransaction`, mocks) extracted to a local test helper
- [ ] **AC4:** All 15 existing tests pass unchanged after split
- [ ] **AC5:** `npm run test:quick` passes with 0 failures

## Tasks / Subtasks

### Task 1: Split test file
- [ ] 1.1 Create `useScanFlowRouter.continueScan.test.ts` with continueScanWithTransaction tests (~9 tests)
- [ ] 1.2 Create `useScanFlowRouter.proceedAfter.test.ts` with proceedAfterCurrencyResolved tests (~6 tests)
- [ ] 1.3 Extract shared setup (mocks, factories) to a local test helper or inline in both files
- [ ] 1.4 Delete original `useScanFlowRouter.test.ts`
- [ ] 1.5 Verify both files under 300 lines
- [ ] 1.6 Run `npm run test:quick` — all pass

## Dev Notes
- Source story: [15b-2l](./15b-2l-decompose-scan-handlers.md)
- Review findings: #1 (test file 391 lines exceeds 300-line guideline)
- Files affected: `tests/unit/features/scan/hooks/useScanFlowRouter.test.ts`
- Pre-existing concerns noted during review (not in scope for this TD):
  - console.error in catch blocks may leak Firestore paths (cross-cutting concern)
  - Advisory TOCTOU gap between checkTrusted() and addTransaction (low risk)
