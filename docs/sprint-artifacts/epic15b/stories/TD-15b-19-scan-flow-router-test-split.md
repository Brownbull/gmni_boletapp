# Tech Debt Story TD-15b-19: Split useScanFlowRouter test file under 300 lines

Status: done

> **Source:** ECC Code Review (2026-02-25) on story 15b-2l
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story
As a **developer**, I want **the useScanFlowRouter.test.ts file split into 2 focused test files under 300 lines**, so that **the unit test file size guideline (max 300 lines) is met and the test suite remains maintainable**.

## Acceptance Criteria

- [x] **AC1:** `useScanFlowRouter.test.ts` split into 2 files, each under 300 lines
- [x] **AC2:** Suggested split: `useScanFlowRouter.continueScan.test.ts` (continueScanWithTransaction tests) + `useScanFlowRouter.proceedAfter.test.ts` (proceedAfterCurrencyResolved tests)
- [x] **AC3:** Shared test utilities (`createDefaultFlowRouterProps`, `createMockTransaction`, mocks) extracted to a local test helper
- [x] **AC4:** All 16 existing tests pass unchanged after split (10 + 6)
- [x] **AC5:** `npm run test:quick` passes with 0 failures

## Tasks / Subtasks

### Task 1: Split test file
- [x] 1.1 Create `useScanFlowRouter.continueScan.test.ts` with continueScanWithTransaction tests (10 tests)
- [x] 1.2 Create `useScanFlowRouter.proceedAfter.test.ts` with proceedAfterCurrencyResolved tests (6 tests)
- [x] 1.3 Extract shared setup (mocks, factories) to `useScanFlowRouter.testHelper.ts`
- [x] 1.4 Delete original `useScanFlowRouter.test.ts`
- [x] 1.5 Verify both files under 300 lines (235 + 139)
- [x] 1.6 Run `npm run test:quick` — all 6962 tests pass

## File List
| File | Action | Lines |
|------|--------|-------|
| `tests/unit/features/scan/hooks/useScanFlowRouter.testHelper.ts` | CREATE | 49 |
| `tests/unit/features/scan/hooks/useScanFlowRouter.continueScan.test.ts` | CREATE | 235 |
| `tests/unit/features/scan/hooks/useScanFlowRouter.proceedAfter.test.ts` | CREATE | 139 |
| `tests/unit/features/scan/hooks/useScanFlowRouter.test.ts` | DELETE | — |

## Deferred Items Tracking

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-15b-20 | Harden useScanFlowRouter test coverage (boundary tests, usage assertions, null guards) | LOW | CREATED |

## Dev Notes
- Source story: [15b-2l](./15b-2l-decompose-scan-handlers.md)
- Review findings: #1 (test file 391 lines exceeds 300-line guideline)
- Original: 391 lines → Split: 235 + 139 + 49 helper = 423 total (8% growth from DRY extraction)
- vi.mock() calls duplicated in both test files (Vitest hoisting requires module-level declaration)
- Pre-existing concerns noted during review (not in scope for this TD):
  - console.error in catch blocks may leak Firestore paths (cross-cutting concern)
  - Advisory TOCTOU gap between checkTrusted() and addTransaction (low risk)

## Senior Developer Review (ECC)
- **Date:** 2026-02-25
- **Classification:** SIMPLE
- **Agents:** code-reviewer, tdd-guide
- **Outcome:** APPROVE 8.5/10
- **Quick fixes:** 0
- **TD stories created:** 1 (TD-15b-20)
- **Action items:** 6 pre-existing coverage gaps deferred to TD-15b-20
